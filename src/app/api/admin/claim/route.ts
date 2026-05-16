import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, sheets, SHEET_ID } from '@/lib/sheets'

export async function POST(req: NextRequest) {
  const { providerId, lineUserId } = await req.json()
  if (!providerId || !lineUserId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const rows = await getSheetData('providers!A2:E')
  const rowIndex = rows.findIndex(r => r[0] === providerId)
  if (rowIndex === -1) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
  }

  const existingUserId = rows[rowIndex][4] ?? ''
  if (existingUserId && existingUserId !== lineUserId) {
    return NextResponse.json({ error: 'Already claimed' }, { status: 403 })
  }

  // Already claimed by same user, or unclaimed — write/confirm
  const sheetRow = rowIndex + 2 // +1 for header, +1 for 1-based index
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `providers!E${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[lineUserId]] },
  })

  return NextResponse.json({ ok: true })
}
