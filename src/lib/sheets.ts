import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

export const sheets = google.sheets({ version: 'v4', auth })
export const SHEET_ID = process.env.GOOGLE_SHEETS_ID!

export async function getSheetData(range: string) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  })
  return res.data.values ?? []
}

export async function appendRow(range: string, values: string[]) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  })
}

export async function findServiceRow(serviceId: string): Promise<number> {
  const rows = await getSheetData('services!B2:B')
  const idx = rows.findIndex(r => r[0] === serviceId)
  return idx === -1 ? -1 : idx + 2
}

export async function updateServiceAtRow(sheetRow: number, values: string[]) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `services!A${sheetRow}:F${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  })
}

export async function clearServiceAtRow(sheetRow: number) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `services!A${sheetRow}:F${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [['', '', '', '', '', '']] },
  })
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const idRows = await getSheetData('bookings!A:A')
  const rowIndex = idRows.findIndex(r => r[0] === bookingId)
  if (rowIndex === -1) return false
  const sheetRow = rowIndex + 1 // 1-based, row 1 is header so data starts at row 2
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `bookings!L${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[status]] },
  })
  return true
}
