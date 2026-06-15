import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'
import { sb } from '@/lib/supabase'
import { verifyOwner } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const providerId = new URL(req.url).searchParams.get('providerId')
  if (!providerId) return NextResponse.json({ entries: [] })

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

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

  // 從候補資料反查 providerId，確認呼叫者是該店擁有者
  const auth = await verifyOwner(req, rows[idx][1])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  await sb.from('waitlist').update({ status }).eq('id', entryId)
  return NextResponse.json({ ok: true })
}
