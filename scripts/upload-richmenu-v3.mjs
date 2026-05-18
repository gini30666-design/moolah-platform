/**
 * 上傳新版圖文選單 v3（深色系）
 * 執行：node scripts/upload-richmenu-v3.mjs
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '../.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => { const i = line.indexOf('='); return [line.slice(0,i).trim(), line.slice(i+1).trim()] })
    .filter(([k]) => k)
)

const TOKEN = env.LINE_CHANNEL_ACCESS_TOKEN
const IMG_PATH = '/Users/gini/Downloads/Gini Agent/moolah_richmenu_v3.jpg'

if (!TOKEN) { console.error('❌ LINE_CHANNEL_ACCESS_TOKEN 不存在'); process.exit(1) }

const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` }

// ── Step 1: 列出並刪除舊的圖文選單 ───────────────────────
console.log('🗑  刪除舊圖文選單...')
const listRes = await fetch('https://api.line.me/v2/bot/richmenu/list', { headers })
const { richmenus } = await listRes.json()
for (const rm of (richmenus ?? [])) {
  const del = await fetch(`https://api.line.me/v2/bot/richmenu/${rm.richMenuId}`, { method: 'DELETE', headers })
  console.log(`   刪除 ${rm.richMenuId}: ${del.ok ? 'OK' : await del.text()}`)
}

// ── Step 2: 建立新圖文選單結構 ────────────────────────────
console.log('\n📋 建立新圖文選單結構...')
const body = {
  size: { width: 2500, height: 843 },
  selected: true,
  name: 'MooLah 主選單 v3',
  chatBarText: '選單',
  areas: [
    {
      bounds: { x: 0, y: 0, width: 833, height: 843 },
      action: { type: 'uri', label: '探索職人', uri: 'https://moolah-platform.vercel.app/discover' },
    },
    {
      bounds: { x: 833, y: 0, width: 834, height: 843 },
      action: { type: 'message', label: '我的預約', text: '我的預約' },
    },
    {
      bounds: { x: 1667, y: 0, width: 833, height: 843 },
      action: { type: 'message', label: '聯絡客服', text: '客服' },
    },
  ],
}

const createRes = await fetch('https://api.line.me/v2/bot/richmenu', { method: 'POST', headers, body: JSON.stringify(body) })
if (!createRes.ok) { console.error('❌ 建立失敗：', await createRes.text()); process.exit(1) }
const { richMenuId } = await createRes.json()
console.log(`✅ 圖文選單建立完成：${richMenuId}`)

// ── Step 3: 上傳圖片 ──────────────────────────────────────
console.log('\n🖼  上傳圖文選單圖片...')
const imgBuffer = readFileSync(IMG_PATH)
const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
  method: 'POST',
  headers: { 'Content-Type': 'image/jpeg', Authorization: `Bearer ${TOKEN}` },
  body: imgBuffer,
})
if (!uploadRes.ok) { console.error('❌ 上傳失敗：', await uploadRes.text()); process.exit(1) }
console.log('✅ 圖片上傳成功')

// ── Step 4: 設為預設 ──────────────────────────────────────
console.log('\n📌 設為所有用戶預設圖文選單...')
const defaultRes = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, { method: 'POST', headers })
console.log(defaultRes.ok ? '✅ 設定完成' : `⚠️  ${await defaultRes.text()}`)

console.log(`\n${'='.repeat(50)}`)
console.log(`新圖文選單 ID：${richMenuId}`)
console.log('='.repeat(50))
