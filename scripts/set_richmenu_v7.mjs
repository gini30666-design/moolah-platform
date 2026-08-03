// 圖文選單 v7 — 消費者 OA 轉內部後的選單改版
// node --env-file=.env.local scripts/set_richmenu_v7.mjs
//
// 改動（只換文字，視覺與 v6 完全相同）：
//   格1  探索職人 → 再預約一次   （uri /discover → message，webhook 反查上次的設計師與服務）
//   格4  聯絡客服 → 我的設計師   （message 內容改，webhook 回設計師卡片）
// 不動：格2 我的預約、格3 我的後台（設計師實體快速登入）
//
// ⚠️ richmenu 是唯讀物件、沒有編輯 API：只能「建新 → 上傳圖 → 設預設 → 驗證通過才刪舊」，
//    順序不可調換，否則中間會有一段沒有選單。
import { readFileSync } from 'node:fs'

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
const LIFF = process.env.NEXT_PUBLIC_LIFF_ID
const IMG = '/Users/gini/Downloads/Gini Agent/richmenu/MooLah_richmenu_v7.jpg'
const H = { Authorization: `Bearer ${TOKEN}` }
if (!TOKEN) { console.error('缺 LINE_CHANNEL_ACCESS_TOKEN'); process.exit(1) }

const menu = {
  size: { width: 2500, height: 1686 },
  selected: true,
  name: 'MooLah v7 深炭金',
  chatBarText: '選單',
  areas: [
    { bounds: { x: 0,    y: 843, width: 625, height: 843 }, action: { type: 'message', text: '再預約一次' } },
    { bounds: { x: 625,  y: 843, width: 625, height: 843 }, action: { type: 'message', text: '我的預約' } },
    { bounds: { x: 1250, y: 843, width: 625, height: 843 }, action: { type: 'uri', uri: `https://liff.line.me/${LIFF}` } },
    { bounds: { x: 1875, y: 843, width: 625, height: 843 }, action: { type: 'message', text: '我的設計師' } },
  ],
}

// 先記下舊的預設選單，最後才刪
const before = await (await fetch('https://api.line.me/v2/bot/user/all/richmenu', { headers: H })).json().catch(() => ({}))
const oldId = before?.richMenuId
console.log('目前預設選單:', oldId ?? '(無)')

const r1 = await fetch('https://api.line.me/v2/bot/richmenu', {
  method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify(menu),
})
const j1 = await r1.json()
if (!r1.ok) { console.error('✗ 建立失敗:', JSON.stringify(j1)); process.exit(1) }
const id = j1.richMenuId
console.log('✓ 建立:', id)

const r2 = await fetch(`https://api-data.line.me/v2/bot/richmenu/${id}/content`, {
  method: 'POST', headers: { ...H, 'Content-Type': 'image/jpeg' }, body: readFileSync(IMG),
})
if (!r2.ok) { console.error('✗ 上傳圖失敗:', r2.status, await r2.text()); process.exit(1) }
console.log('✓ 圖片已上傳')

const r3 = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${id}`, { method: 'POST', headers: H })
if (!r3.ok) { console.error('✗ 設為預設失敗:', r3.status, await r3.text()); process.exit(1) }
console.log('✓ 已設為所有人的預設選單')

// 讀回驗證：確認生效的就是新的
const after = await (await fetch('https://api.line.me/v2/bot/user/all/richmenu', { headers: H })).json()
if (after.richMenuId !== id) { console.error('✗ 驗證失敗，目前生效的是', after.richMenuId, '→ 舊選單保留不刪'); process.exit(1) }
console.log('✓ 驗證通過，生效中:', after.richMenuId)

const detail = await (await fetch(`https://api.line.me/v2/bot/richmenu/${id}`, { headers: H })).json()
console.log('  格位動作:', detail.areas.map(a => a.action.text ?? a.action.uri).join(' | '))

if (oldId && oldId !== id) {
  const r5 = await fetch(`https://api.line.me/v2/bot/richmenu/${oldId}`, { method: 'DELETE', headers: H })
  console.log(r5.ok ? `✓ 舊選單已刪除: ${oldId}` : `⚠️ 舊選單刪除失敗（不影響使用）: ${r5.status}`)
}
