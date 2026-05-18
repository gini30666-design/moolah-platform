import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envContent = readFileSync(join(__dirname, '../.env.local'), 'utf-8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
    .filter(([k]) => k)
    .map(([k, ...v]) => [k, v.join('=')])
)

const TOKEN = env.LINE_CHANNEL_ACCESS_TOKEN
const LIFF_ID = env.NEXT_PUBLIC_LIFF_ID || '2009980332-eM2b6gtT'
const BASE = 'https://moolah-platform.vercel.app'

const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` }

// Step 1: 刪除舊圖文選單（取得清單後全刪）
console.log('🗑  取得現有圖文選單清單...')
const listRes = await fetch('https://api.line.me/v2/bot/richmenu/list', { headers })
const { richmenus = [] } = await listRes.json()
for (const m of richmenus) {
  await fetch(`https://api.line.me/v2/bot/richmenu/${m.richMenuId}`, { method: 'DELETE', headers })
  console.log(`   刪除：${m.richMenuId}`)
}

// Step 2: 建立新圖文選單
console.log('📋 建立新圖文選單（v3：我的後台）...')
const body = {
  size: { width: 2500, height: 843 },
  selected: true,
  name: 'MooLah 主選單 v3',
  chatBarText: '選單',
  areas: [
    {
      bounds: { x: 0, y: 0, width: 833, height: 843 },
      action: { type: 'uri', label: '立即預約', uri: `${BASE}/discover` },
    },
    {
      bounds: { x: 833, y: 0, width: 834, height: 843 },
      action: { type: 'message', label: '我的預約', text: '我的預約' },
    },
    {
      bounds: { x: 1667, y: 0, width: 833, height: 843 },
      action: { type: 'uri', label: '我的後台', uri: `https://liff.line.me/${LIFF_ID}` },
    },
  ],
}

const createRes = await fetch('https://api.line.me/v2/bot/richmenu', {
  method: 'POST', headers, body: JSON.stringify(body),
})
if (!createRes.ok) { console.error('❌', await createRes.text()); process.exit(1) }
const { richMenuId } = await createRes.json()
console.log(`✅ 建立完成：${richMenuId}`)

// Step 3: 上傳圖片
console.log('🖼  上傳圖文選單圖片...')
const imgPath = '/Users/gini/Downloads/Gini Agent/moolah_richmenu_v3.png'
const imgData = readFileSync(imgPath)
const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
  method: 'POST',
  headers: { 'Content-Type': 'image/png', Authorization: `Bearer ${TOKEN}` },
  body: imgData,
})
if (!uploadRes.ok) { console.error('❌ 上傳圖片失敗：', await uploadRes.text()); process.exit(1) }
console.log('✅ 圖片上傳完成')

// Step 4: 設為預設
console.log('📌 設定為預設選單...')
const defaultRes = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
  method: 'POST', headers,
})
console.log(defaultRes.ok ? '✅ 已設為所有用戶預設' : `⚠️  ${await defaultRes.text()}`)

console.log(`\n完成！Rich Menu ID：${richMenuId}`)
console.log(`Cell C → https://liff.line.me/${LIFF_ID}`)
