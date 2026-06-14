import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, sheets, SHEET_ID } from '@/lib/sheets'

export async function POST(req: NextRequest) {
  const { providerId, lineUserId, agreedAt, direct } = await req.json()

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

  // 方案狀態：direct=直接正式加入(active)；預設=14 天免費試用(trial)
  const nowIso = new Date().toISOString()
  const plan = direct ? 'active' : 'trial'
  const trialStartAt = direct ? '' : nowIso
  const trialEndsAt = direct ? '' : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

  // Write 一次寫入：E lineUserId / U agreedAt / V plan / W trialStartAt / X trialEndsAt
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: `providers!E${sheetRow}`, values: [[lineUserId]] },
        { range: `providers!U${sheetRow}`, values: [[agreedAt ?? nowIso]] },
        { range: `providers!V${sheetRow}`, values: [[plan]] },
        { range: `providers!W${sheetRow}`, values: [[trialStartAt]] },
        { range: `providers!X${sheetRow}`, values: [[trialEndsAt]] },
      ],
    },
  })

  return NextResponse.json({ success: true, plan, trialEndsAt: trialEndsAt || null })
}
