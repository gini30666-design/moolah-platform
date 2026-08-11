// 端到端驗證（2026-08-11）：儲值卡／次卡的資料層行為
// 對真實 Supabase 跑，跑完自動清除。驗的是「單元測試驗不到」的那一層：
// FK / check constraint / append-only trigger / 餘額在真實資料上算對。
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const env = Object.fromEntries(fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
  .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const PID = '__credits_test__'
let pass = 0, fail = 0
const ok = (label, cond, extra = '') => { cond ? (pass++, console.log('✅', label)) : (fail++, console.log('❌', label, extra)) }
const balanceOf = async (cid) => {
  const { data } = await sb.from('credit_ledger').select('delta').eq('credit_id', cid)
  return (data ?? []).reduce((s, r) => s + Number(r.delta), 0)
}

// 測試用職人
await sb.from('providers').upsert({ id: PID, name: '儲值測試' }, { onConflict: 'id' })

// 1) 建卡
const { data: card, error: e1 } = await sb.from('customer_credits').insert({
  provider_id: PID, customer_phone: '0912345678', customer_name: '測試客',
  kind: 'amount', title: '儲值金', expires_on: '2027-12-31', refund_terms: '可隨時終止，手續費上限 10%',
}).select('id').single()
ok('建立儲值卡', !e1 && card?.id, e1?.message)

// 2) 儲值 5000（實付 5000 + 贈送 500 → delta 5500）
await sb.from('credit_ledger').insert({ credit_id: card.id, provider_id: PID, entry_type: 'topup', delta: 5500, paid: 5000, bonus: 500 })
ok('儲值後餘額 = 5500', await balanceOf(card.id) === 5500)

// 3) 扣款 1200
await sb.from('credit_ledger').insert({ credit_id: card.id, provider_id: PID, entry_type: 'redeem', delta: -1200, service_name: '洗剪' })
ok('扣款後餘額 = 4300', await balanceOf(card.id) === 4300)

// 4) 🔴 append-only：不能改、不能刪
const { data: entries } = await sb.from('credit_ledger').select('id').eq('credit_id', card.id).order('id')
const targetId = entries[entries.length - 1].id
const upd = await sb.from('credit_ledger').update({ delta: -1 }).eq('id', targetId)
ok('UPDATE 被 DB trigger 擋下', !!upd.error, JSON.stringify(upd.error))
const del = await sb.from('credit_ledger').delete().eq('id', targetId)
ok('DELETE 被 DB trigger 擋下', !!del.error, JSON.stringify(del.error))
ok('被擋後餘額沒有被動到（仍 4300）', await balanceOf(card.id) === 4300)

// 5) 沖正：唯一的更正方式
await sb.from('credit_ledger').insert({ credit_id: card.id, provider_id: PID, entry_type: 'reverse', delta: 1200, reversal_of: targetId, memo: '誤扣' })
ok('沖正後餘額回到 5500', await balanceOf(card.id) === 5500)
const { data: all } = await sb.from('credit_ledger').select('id').eq('credit_id', card.id)
ok('原紀錄仍在（3 筆，沒有被抹掉）', all.length === 3, `實際 ${all.length}`)

// 6) check constraint
const badKind = await sb.from('customer_credits').insert({ provider_id: PID, kind: 'wallet', title: 'x' })
ok('kind 只允許 amount/count', !!badKind.error)
const badType = await sb.from('credit_ledger').insert({ credit_id: card.id, provider_id: PID, entry_type: 'hack', delta: 1 })
ok('entry_type 白名單生效', !!badType.error)

// 7) FK：卡片必須屬於存在的職人
const badFk = await sb.from('customer_credits').insert({ provider_id: '__nope__', kind: 'amount', title: 'x' })
ok('provider_id 外鍵約束生效', !!badFk.error)

// 8) 次卡
const { data: cc, error: eCc } = await sb.from('customer_credits').insert({
  provider_id: PID, customer_phone: '0912345678', kind: 'count', title: '洗剪 10 次卡',
}).select('id').single()
if (eCc) { fail++; console.log('❌ 建立次卡', eCc.message) }
// ⚠️ 批次 insert 每一列的鍵集合必須一致 —— PostgREST 取聯集，缺的欄位塞 NULL 而非 DEFAULT，
//    會撞上 paid NOT NULL（這正是 2026-08-11 這支測試抓到的 bug）
const { error: eLed } = await sb.from('credit_ledger').insert([
  { credit_id: cc?.id, provider_id: PID, entry_type: 'topup', delta: 10, paid: 9000, bonus: 0 },
  { credit_id: cc?.id, provider_id: PID, entry_type: 'redeem', delta: -1, paid: 0, bonus: 0 },
  { credit_id: cc?.id, provider_id: PID, entry_type: 'redeem', delta: -1, paid: 0, bonus: 0 },
])
if (eLed) { fail++; console.log('❌ 次卡流水帳寫入', eLed.message) }
ok('次卡餘額 = 8 次', cc && await balanceOf(cc.id) === 8, cc ? `實際 ${await balanceOf(cc.id)}` : 'no card')

// ── 清除（用逃生閥；app 端沒有這個變數，所以線上仍然刪不動）──
const c = new pg.Client({ connectionString: env.SUPABASE_DB_URL })
await c.connect()
await c.query('begin')
await c.query(`set local app.allow_ledger_purge = 'on'`)
await c.query(`delete from providers where id = $1`, [PID])
await c.query('commit')
const left = await c.query(`select (select count(*) from customer_credits) a, (select count(*) from credit_ledger) b`)
await c.end()
ok('測試資料已清除', left.rows[0].a === '0' && left.rows[0].b === '0', JSON.stringify(left.rows[0]))

console.log(`\n${fail === 0 ? '🎉' : '⚠️'} ${pass} 通過 / ${fail} 失敗`)
process.exit(fail === 0 ? 0 : 1)
