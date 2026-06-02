import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, sheets, SHEET_ID } from '@/lib/sheets'

export async function POST(req: NextRequest) {
  const { providerId, lineUserId, agreedAt } = await req.json()

  if (!providerId || !lineUserId) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 })
  }

  const rows = await getSheetData('providers!A2:E')
  const rowIndex = rows.findIndex(r => r[0] === providerId)

  if (rowIndex === -1) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const existing = rows[rowIndex][4]
  if (existing?.trim()) {
    // Already claimed — check if it's the same user reclaiming
    if (existing.trim() === lineUserId) {
      return NextResponse.json({ success: true, alreadyOwner: true })
    }
    return NextResponse.json({ alreadyClaimed: true })
  }

  const sheetRow = rowIndex + 2 // 1-indexed + 1 for header row

  // Write lineUserId to column E and agreedAt to column U in one batch
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: `providers!E${sheetRow}`, values: [[lineUserId]] },
        { range: `providers!U${sheetRow}`, values: [[agreedAt ?? new Date().toISOString()]] },
      ],
    },
  })

  return NextResponse.json({ success: true })
}
