/**
 * 圖文選單換網域：把「探索職人」的舊 vercel.app 連結改成 moolah.studio。
 *
 * ⚠️ LINE 的 richmenu 是唯讀物件，沒有「編輯」API。
 *    唯一做法＝用舊選單的定義建一個新的 → 下載舊圖再上傳 → 設為預設 → 最後才刪舊的。
 *    順序不可調換：先設預設再刪舊，中間使用者不會看到空選單。
 *
 * 用法：node scripts/richmenu_fix_domain.mjs [--apply]
 *       不加 --apply 只做 dry-run（印出將要改什麼，不動線上）。
 */
import fs from 'node:fs'

const OLD_HOST = 'https://moolah-platform.vercel.app'
const NEW_HOST = 'https://moolah.studio'
const APPLY = process.argv.includes('--apply')

const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const TOKEN = env.match(/^LINE_CHANNEL_ACCESS_TOKEN=(.*)$/m)?.[1].trim().replace(/^["']|["']$/g, '')
if (!TOKEN) throw new Error('LINE_CHANNEL_ACCESS_TOKEN 不在 .env.local')

const H = { Authorization: `Bearer ${TOKEN}` }
const api = async (path, init = {}) => {
  const r = await fetch(`https://api.line.me/v2/bot${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } })
  const text = await r.text()
  if (!r.ok) throw new Error(`${path} → ${r.status} ${text}`)
  return text ? JSON.parse(text) : {}
}

// 1. 抓現行選單
const { richmenus } = await api('/richmenu/list')
const current = richmenus.find(m => m.selected) || richmenus[0]
if (!current) throw new Error('帳號目前沒有任何圖文選單')

const needsFix = JSON.stringify(current.areas).includes(OLD_HOST)
console.log(`現行選單：${current.richMenuId}（${current.name}）`)
current.areas.forEach((a, i) => {
  const v = a.action.uri || `訊息「${a.action.text}」`
  console.log(`  [${i}] ${v}${(a.action.uri || '').includes(OLD_HOST) ? '   ← 要改' : ''}`)
})
if (!needsFix) { console.log('\n沒有舊網域連結，不需要處理。'); process.exit(0) }

// 2. 組出新定義（只換 host，其餘完全照抄）
const next = {
  size: current.size,
  selected: true,
  name: `${current.name.replace(/ \(moolah\.studio\)$/, '')} (moolah.studio)`.slice(0, 300),
  chatBarText: current.chatBarText,
  areas: current.areas.map(a => a.action.uri
    ? { ...a, action: { ...a.action, uri: a.action.uri.replace(OLD_HOST, NEW_HOST) } }
    : a),
}
console.log('\n新定義：')
next.areas.forEach((a, i) => console.log(`  [${i}] ${a.action.uri || `訊息「${a.action.text}」`}`))

if (!APPLY) { console.log('\n(dry-run，未套用。加 --apply 才會真的執行)'); process.exit(0) }

// 3. 下載舊圖（同一張，視覺零變化）
const imgRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${current.richMenuId}/content`, { headers: H })
if (!imgRes.ok) throw new Error(`下載圖片失敗 ${imgRes.status}`)
const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
const img = Buffer.from(await imgRes.arrayBuffer())
console.log(`\n舊圖已下載：${(img.length / 1024).toFixed(0)} KB (${contentType})`)

// 4. 建新選單 → 上傳圖 → 設為預設
const { richMenuId } = await api('/richmenu', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next),
})
console.log(`新選單已建立：${richMenuId}`)

const up = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
  method: 'POST', headers: { ...H, 'Content-Type': contentType }, body: img,
})
if (!up.ok) throw new Error(`上傳圖片失敗 ${up.status} ${await up.text()}`)
console.log('圖片已上傳')

await api(`/user/all/richmenu/${richMenuId}`, { method: 'POST' })
console.log('已設為所有使用者的預設選單')

// 5. 驗證後才刪舊的
const def = await api('/user/all/richmenu')
if (def.richMenuId !== richMenuId) throw new Error(`預設選單驗證失敗（目前是 ${def.richMenuId}）→ 保留舊選單不刪`)
await api(`/richmenu/${current.richMenuId}`, { method: 'DELETE' })
console.log(`舊選單已刪除：${current.richMenuId}`)

const after = await api('/richmenu/list')
console.log('\n完成。目前選單：')
after.richmenus.forEach(m => {
  console.log(`  ${m.richMenuId}（${m.name}）selected=${m.selected}`)
  m.areas.forEach((a, i) => console.log(`    [${i}] ${a.action.uri || `訊息「${a.action.text}」`}`))
})
