// 用 LINE Messaging API 直接換上定案的圖文選單（深炭金 v6）
// node --env-file=.env.local scripts/set_richmenu.mjs
import { readFileSync } from 'node:fs'

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
const LIFF = process.env.NEXT_PUBLIC_LIFF_ID
const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'
const IMG = '/Users/gini/Downloads/Gini Agent/richmenu/MooLah_richmenu_v6.jpg'
const H = { Authorization: `Bearer ${TOKEN}` }

if (!TOKEN) { console.error('缺 LINE_CHANNEL_ACCESS_TOKEN'); process.exit(1) }

// 4 格 tappable（下半部，每格 625 寬）：探索職人/我的預約/我的後台/聯絡客服
const menu = {
  size: { width: 2500, height: 1686 },
  selected: true,
  name: 'MooLah v6 深炭金',
  chatBarText: '選單',
  areas: [
    { bounds: { x: 0,    y: 843, width: 625, height: 843 }, action: { type: 'uri', uri: `${BASE}/discover` } },
    { bounds: { x: 625,  y: 843, width: 625, height: 843 }, action: { type: 'message', text: '我的預約' } },
    { bounds: { x: 1250, y: 843, width: 625, height: 843 }, action: { type: 'uri', uri: `https://liff.line.me/${LIFF}` } },
    { bounds: { x: 1875, y: 843, width: 625, height: 843 }, action: { type: 'message', text: '聯絡客服' } },
  ],
}

// 1) 建立 rich menu
const r1 = await fetch('https://api.line.me/v2/bot/richmenu', {
  method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify(menu),
})
const j1 = await r1.json()
if (!r1.ok) { console.error('✗ 建立失敗:', JSON.stringify(j1)); process.exit(1) }
const richMenuId = j1.richMenuId
console.log('✓ 建立 rich menu:', richMenuId)

// 2) 上傳圖片（image/jpeg；注意是 api-data 主機）
const img = readFileSync(IMG)
const r2 = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
  method: 'POST', headers: { ...H, 'Content-Type': 'image/jpeg' }, body: img,
})
if (!r2.ok) { console.error('✗ 上傳圖失敗:', r2.status, await r2.text()); process.exit(1) }
console.log('✓ 圖片已上傳')

// 3) 設為所有人的預設選單
const r3 = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, { method: 'POST', headers: H })
if (!r3.ok) { console.error('✗ 設預設失敗:', r3.status, await r3.text()); process.exit(1) }
console.log('✓ 已設為預設選單')

// 4) 清掉舊選單（保留剛建的）
const rl = await fetch('https://api.line.me/v2/bot/richmenu/list', { headers: H })
const list = (await rl.json()).richmenus ?? []
for (const m of list) {
  if (m.richMenuId === richMenuId) continue
  const d = await fetch(`https://api.line.me/v2/bot/richmenu/${m.richMenuId}`, { method: 'DELETE', headers: H })
  console.log(`  ${d.ok ? '🗑 刪除舊選單' : '⚠ 刪除失敗'} ${m.richMenuId}（${m.name}）`)
}
console.log('\n完成！新選單 ID:', richMenuId)
