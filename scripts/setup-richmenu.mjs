/**
 * MooLah LINE OA 圖文選單設定腳本
 * 執行：node scripts/setup-richmenu.mjs
 *
 * 圖文選單佈局（3格橫排）：
 * ┌─────────────────────────────────────────┐
 * │  立即預約        我的預約       聯絡客服  │
 * │  Book Now       My Bookings   Contact   │
 * └─────────────────────────────────────────┘
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 讀取 .env.local
const envPath = join(__dirname, '../.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=').map(s => s.trim()))
    .filter(([k]) => k)
    .map(([k, ...v]) => [k, v.join('=')])
)

const TOKEN = env.LINE_CHANNEL_ACCESS_TOKEN
const BASE_URL = 'https://moolah-platform.vercel.app'

if (!TOKEN) {
  console.error('❌ LINE_CHANNEL_ACCESS_TOKEN 不存在，請確認 .env.local')
  process.exit(1)
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
}

// Step 1：建立圖文選單
const richMenuBody = {
  size: { width: 2500, height: 843 },
  selected: true,
  name: 'MooLah 主選單',
  chatBarText: '預約選單',
  areas: [
    {
      bounds: { x: 0, y: 0, width: 833, height: 843 },
      action: {
        type: 'uri',
        label: '立即預約',
        uri: `https://liff.line.me/${env.NEXT_PUBLIC_LIFF_ID || '2009980332-eM2b6gtT'}`,
      },
    },
    {
      bounds: { x: 833, y: 0, width: 834, height: 843 },
      action: {
        type: 'message',
        label: '我的預約',
        text: '我的預約',
      },
    },
    {
      bounds: { x: 1667, y: 0, width: 833, height: 843 },
      action: {
        type: 'message',
        label: '聯絡客服',
        text: '客服',
      },
    },
  ],
}

console.log('📋 建立圖文選單...')
const createRes = await fetch('https://api.line.me/v2/bot/richmenu', {
  method: 'POST',
  headers,
  body: JSON.stringify(richMenuBody),
})

if (!createRes.ok) {
  const err = await createRes.text()
  console.error('❌ 建立失敗：', err)
  process.exit(1)
}

const { richMenuId } = await createRes.json()
console.log(`✅ 圖文選單建立完成，ID：${richMenuId}`)
console.log('')
console.log('⚠️  接下來需要手動上傳圖文選單圖片：')
console.log(`   1. 進入 LINE Developers Console`)
console.log(`   2. Messaging API → Rich menu`)
console.log(`   3. 找到 ID: ${richMenuId}`)
console.log(`   4. 上傳圖片（2500×843px，三格佈局）`)
console.log(`      左：立即預約 Book Now`)
console.log(`      中：我的預約 My Bookings`)
console.log(`      右：聯絡客服 Contact`)
console.log('')

// Step 2：設為預設圖文選單
console.log('📌 設定為預設圖文選單...')
const defaultRes = await fetch(
  `https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`,
  { method: 'POST', headers }
)

if (defaultRes.ok) {
  console.log('✅ 已設為所有用戶的預設圖文選單')
} else {
  const err = await defaultRes.text()
  console.warn('⚠️  設定預設失敗（可能需要先上傳圖片）：', err)
}

console.log('')
console.log('='.repeat(50))
console.log(`圖文選單 ID：${richMenuId}`)
console.log('Webhook URL（需設定在 LINE Developers Console）：')
console.log(`${BASE_URL}/api/line/webhook`)
console.log('='.repeat(50))
