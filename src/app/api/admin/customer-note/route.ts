import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'

// customer_notes sheet columns: A=providerId, B=customerLineUserId, C=note, D=updatedAt

async function findNoteRow(providerId: string, customerLineUserId: string) {
  const rows = await getSheetData('customer_notes!A2:D')
  const idx = rows.findIndex(r => r[0] === providerId && r[1] === customerLineUserId)
  return { rows, rowIndex: idx, sheetRow: idx >= 0 ? idx + 2 : -1 }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  const customerLineUserId = searchParams.get('customerLineUserId')
  if (!providerId || !customerLineUserId) {
    return NextResponse.json({ note: '' })
  }
  const { rows, rowIndex } = await findNoteRow(providerId, customerLineUserId)
  const note = rowIndex >= 0 ? (rows[rowIndex][2] as string) ?? '' : ''
  return NextResponse.json({ note })
}

export async function POST(req: NextRequest) {
  const { providerId, customerLineUserId, note } = await req.json()
  if (!providerId || !customerLineUserId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const { rowIndex, sheetRow } = await findNoteRow(providerId, customerLineUserId)
  const now = new Date().toISOString()
  if (rowIndex >= 0) {
    await updateRow('customer_notes', sheetRow, [providerId, customerLineUserId, note, now])
  } else {
    await appendRow('customer_notes', [providerId, customerLineUserId, note, now])
  }
  return NextResponse.json({ ok: true })
}
