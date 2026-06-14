// 印出指定 providerId 綁定的 lineUserId（providers 分頁 E 欄）
import { google } from 'googleapis'
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})
const sheets = google.sheets({ version: 'v4', auth })
const pid = process.argv[2]
const r = await sheets.spreadsheets.values.get({
  spreadsheetId: process.env.GOOGLE_SHEETS_ID, range: 'providers!A2:E',
})
const row = (r.data.values || []).find(x => x[0] === pid)
process.stdout.write(row?.[4]?.trim() || '')
