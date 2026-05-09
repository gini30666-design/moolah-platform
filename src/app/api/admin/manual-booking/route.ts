import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

function generateId() {
  return `MN${Date.now()}`
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { providerId, serviceId, customerName, date, time, note } = body

  if (!providerId || !serviceId || !date || !time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const createdAt = new Date().toISOString()
  const bookingId = generateId()

  // Write to bookings sheet — same column order as /api/booking
  // A:id  B:providerId  C:serviceId  D:customerName  E:lineUserId
  // F:date  G:time  H:note  I:createdAt  J:gender  K:hairLength
  // L:status defaults to '' which admin API treats as 'active'
  await appendRow('bookings!A:K', [
    bookingId,
    providerId,
    serviceId,
    customerName || '現場預約',
    'MANUAL',
    date,
    time,
    note ?? '',
    createdAt,
    '',
    '',
  ])

  return NextResponse.json({ ok: true, bookingId })
}
