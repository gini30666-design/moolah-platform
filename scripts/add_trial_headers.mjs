// 補試用方案相關 Sheets 標頭：providers V/W/X、leads I
// 安全：先讀現值，非空就不覆蓋（避免蓋到資料）
import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})
const sheets = google.sheets({ version: 'v4', auth })
const SHEET_ID = process.env.GOOGLE_SHEETS_ID

const targets = [
  { range: 'providers!V1', value: 'plan' },
  { range: 'providers!W1', value: 'trialStartAt' },
  { range: 'providers!X1', value: 'trialEndsAt' },
  { range: 'leads!I1',     value: 'plan' },
]

for (const t of targets) {
  const cur = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: t.range })
  const existing = cur.data.values?.[0]?.[0]
  if (existing && existing.trim()) {
    console.log(`SKIP ${t.range} 已有值「${existing}」（不覆蓋）`)
    continue
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: t.range,
    valueInputOption: 'RAW',
    requestBody: { values: [[t.value]] },
  })
  console.log(`OK   ${t.range} = ${t.value}`)
}
console.log('done')
