import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'
import { verifyOwner } from '@/lib/auth'

// customer_notes sheet: A=providerId, B=customerLineUserId, C=note, D=updatedAt, E=tags(JSON)

async function findNoteRow(providerId: string, customerLineUserId: string) {
  const rows = await getSheetData('customer_notes!A2:E')
  const idx = rows.findIndex(r => r[0] === providerId && r[1] === customerLineUserId)
  return { rows, rowIndex: idx, sheetRow: idx >= 0 ? idx + 2 : -1 }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  const customerLineUserId = searchParams.get('customerLineUserId')
  if (!providerId || !customerLineUserId) return NextResponse.json({ note: '', tags: [] })

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { rows, rowIndex } = await findNoteRow(providerId, customerLineUserId)
  if (rowIndex === -1) return NextResponse.json({ note: '', tags: [] })
  const note = rows[rowIndex][2] ?? ''
  const tags: string[] = (() => { try { return JSON.parse(rows[rowIndex][4] ?? '[]') } catch { return [] } })()
  return NextResponse.json({ note, tags })
}

export async function POST(req: NextRequest) {
  const { providerId, customerLineUserId, note, tags } = await req.json()
  if (!providerId || !customerLineUserId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { rows, rowIndex, sheetRow } = await findNoteRow(providerId, customerLineUserId)
  const now = new Date().toISOString()

  if (rowIndex >= 0) {
    const existingNote = note !== undefined ? note : (rows[rowIndex][2] ?? '')
    const existingTags = tags !== undefined ? JSON.stringify(tags) : (rows[rowIndex][4] ?? '[]')
    await updateRow('customer_notes', sheetRow, [providerId, customerLineUserId, existingNote, now, existingTags])
  } else {
    await appendRow('customer_notes!A:E', [providerId, customerLineUserId, note ?? '', now, JSON.stringify(tags ?? [])])
  }
  return NextResponse.json({ ok: true })
}
