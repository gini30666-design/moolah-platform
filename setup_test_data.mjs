import { google } from 'googleapis'
import { readFileSync } from 'fs'

const KEY_PATH = '/Users/gini/Downloads/Gini Agent/ginimcp-e42d974747c9.json'
const SHEET_ID = '1QwsKUYZpLOHg76IS9mxo-KcprasfIK9wSva__h3kMvs'

const key = JSON.parse(readFileSync(KEY_PATH, 'utf8'))

const auth = new google.auth.GoogleAuth({
  credentials: { client_email: key.client_email, private_key: key.private_key },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })

async function clearRange(range) {
  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range })
  console.log('Cleared ' + range)
}

async function writeRows(range, values) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: 'RAW',
    requestBody: { values },
  })
  console.log('Written ' + values.length + ' rows to ' + range)
}

async function main() {
  const providerRow = [
    'designer-001', 'Chloe Chen', '髮型設計師',
    '專業髮型設計 8 年，擅長韓系染燙與空氣感剪裁，讓每位客人找到最適合自己的造型。',
    '', '', "Chloe's Hair Studio", '高雄市苓雅區四維三路149號', '高雄市',
    '週二至週日 10:00–19:00（週一公休）', '', '', 'chloe',
  ]
  const serviceRows = [
    ['designer-001','svc-001','韓系空氣感剪裁','800','60','含洗、剪、吹，打造輕盈蓬鬆感'],
    ['designer-001','svc-002','漸層染髮','3500','150','客製化配色，自然融合無明顯分層'],
    ['designer-001','svc-003','冷燙 / 離子燙','2800','120','精準控溫，持久定型不傷髮'],
    ['designer-001','svc-004','頭皮護理 SPA','1200','45','深層清潔、舒緩頭皮，搭配精油按摩'],
  ]

  await clearRange('providers!A2:M')
  await writeRows('providers!A2', [providerRow])
  await clearRange('services!A2:F')
  await writeRows('services!A2', serviceRows)

  console.log('\n✅ 測試資料寫入成功！')
  console.log('設計師頁面：https://moolah-platform.vercel.app/designer-001')
  console.log('短網址：https://moolah-platform.vercel.app/go/chloe')
}

main().catch(err => { console.error('Error:', err.message); process.exit(1) })
