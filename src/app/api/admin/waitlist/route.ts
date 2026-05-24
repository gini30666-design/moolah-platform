import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, updateRow } from '@/lib/sheets'

export async function GET(req: NextRequest) {
  const providerId = new URL(req.url).searchParams.get('providerId')
  if (!providerId) return NextResponse.json({ entries: [] })

  const rows = await getSheetData('waitlist!A2:J')
  const entries = rows
    .map((r, i) => ({
      id: r[0] ?? '', providerId: r[1] ?? '', serviceId: r[2] ?? '',
      date: r[3] ?? '', time: r[4] ?? '', customerName: r[5] ?? '',
      customerLineUserId: r[6] ?? '', customerPhone: r[7] ?? '',
      addedAt: r[8] ?? '', status: r[9] ?? 'pending', sheetRow: i + 2,
    }))
    .filter(e => e.providerId === providerId && e.status === 'pending')
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  return NextResponse.json({ entries })
}

export async function PATCH(req: NextRequest) {
  const { entryId, status } = await req.json()
  if (!entryId || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const rows = await getSheetData('waitlist!A2:J')
  const idx = rows.findIndex(r => r[0] === entryId)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const r = rows[idx]
  await updateRow('waitlist', idx + 2, [r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], status])
  return NextResponse.json({ ok: true })
}
