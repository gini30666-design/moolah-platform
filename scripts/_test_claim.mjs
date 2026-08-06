// 認領流程端到端測試（用臨時 provider，測完刪除，不碰真實資料）
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
  .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const API = 'https://moolah.studio/api/claim'

const TID = '_claimtest'
const U1 = 'Utest111111111111111111111111111'
const U2 = 'Utest222222222222222222222222222'

const post = (body) => fetch(API, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
}).then(async r => ({ status: r.status, body: await r.json() }))

const seed = async (plan) => {
  await sb.from('providers').delete().eq('id', TID)
  await sb.from('providers').insert({
    id: TID, name: '測試', category: '測試', line_user_id: null, plan,
    trial_start_at: null, trial_ends_at: null,
  })
}
const read = async () => (await sb.from('providers')
  .select('plan,line_user_id,agreed_at,trial_ends_at').eq('id', TID).single()).data

let pass = 0, fail = 0
const check = (name, ok, detail) => {
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? '  → ' + detail : ''}`)
  ok ? pass++ : fail++
}

// ── 1. OB 設 active 的職人認領 → 必須保持 active（今晚抓到的 bug）
await seed('active')
await post({ providerId: TID, lineUserId: U1, agreedAt: new Date().toISOString() })
let r = await read()
check('OB 設 active → 認領後仍是 active（不被打回 trial）', r.plan === 'active', `plan=${r.plan}`)
check('  └ 試用到期日應為空', r.trial_ends_at === null, `trial_ends_at=${r.trial_ends_at}`)
check('  └ 有寫入同意時間', !!r.agreed_at)
check('  └ 有綁定 LINE ID', r.line_user_id === U1)

// ── 2. 同一人重複點 → alreadyOwner（直接進後台，不報錯）
let res = await post({ providerId: TID, lineUserId: U1 })
check('同一人重複認領 → alreadyOwner', res.body.alreadyOwner === true && res.body.success === true, JSON.stringify(res.body))

// ── 3. 別人想搶 → alreadyClaimed（鎖定）
res = await post({ providerId: TID, lineUserId: U2 })
r = await read()
check('他人搶認領 → 被擋 alreadyClaimed', res.body.alreadyClaimed === true, JSON.stringify(res.body))
check('  └ 原持有人未被覆寫', r.line_user_id === U1)

// ── 4. OB 設 trial 的職人認領 → 保持 trial，且試用期從認領當下起算
await seed('trial')
await post({ providerId: TID, lineUserId: U1 })
r = await read()
const daysLeft = (new Date(r.trial_ends_at) - Date.now()) / 86400000
check('OB 設 trial → 認領後仍是 trial', r.plan === 'trial', `plan=${r.plan}`)
check('  └ 試用期從認領當下重新起算 14 天', daysLeft > 13.9 && daysLeft < 14.1, `剩 ${daysLeft.toFixed(2)} 天`)

// ── 5. 沒有預設方案（舊資料）→ 沿用舊規則
await seed('')
await post({ providerId: TID, lineUserId: U1 })
r = await read()
check('無預設方案 + 一般連結 → trial', r.plan === 'trial', `plan=${r.plan}`)

await seed('')
await post({ providerId: TID, lineUserId: U1, direct: true })
r = await read()
check('無預設方案 + ?direct=1 → active', r.plan === 'active' && r.trial_ends_at === null, `plan=${r.plan}`)

// ── 6. 不存在的職人 → 404
res = await post({ providerId: '_no_such_provider_', lineUserId: U1 })
check('不存在的職人 → 404 not_found', res.status === 404 && res.body.error === 'not_found', JSON.stringify(res.body))

// ── 7. 缺參數 → 400
res = await post({ providerId: TID })
check('缺 lineUserId → 400', res.status === 400, JSON.stringify(res.body))

// 清理
await sb.from('providers').delete().eq('id', TID)
const gone = (await sb.from('providers').select('id').eq('id', TID)).data
check('測試帳號已清除', gone.length === 0)

console.log(`\n${fail === 0 ? '🎉 全部通過' : '⚠️ 有失敗項'}：${pass} pass / ${fail} fail`)
process.exit(fail === 0 ? 0 : 1)
