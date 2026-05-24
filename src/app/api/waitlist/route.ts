import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

// waitlist sheet: A=id, B=providerId, C=serviceId, D=date, E=time,
//                 F=customerName, G=customerLineUserId, H=customerPhone, I=addedAt, J=status

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  const date = searchParams.get('date')
  const time = searchParams.get('time')
  const userId = searchParams.get('userId')
  if (!providerId || !date || !time) return NextResponse.json({ onWaitlist: false })

  const rows = await getSheetData('waitlist!A2:J')
  const entry = rows.find(r =>
    r[1] === providerId && r[3] === date && r[4] === time &&
    (r[9] ?? 'pending') === 'pending' && userId && r[6] === userId
  )
  return NextResponse.json({ onWaitlist: !!entry })
}

export async function POST(req: NextRequest) {
  const { providerId, serviceId, date, time, customerName, customerLineUserId, customerPhone } = await req.json()
  if (!providerId || !date || !time || !customerName) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const rows = await getSheetData('waitlist!A2:J')
  const exists = rows.find(r =>
    r[1] === providerId && r[3] === date && r[4] === time &&
    (r[9] ?? 'pending') === 'pending' &&
    (customerLineUserId ? r[6] === customerLineUserId : r[5] === customerName)
  )
  if (exists) return NextResponse.json({ error: 'Already on waitlist' }, { status: 409 })

  const id = `WL${Date.now()}`
  await appendRow('waitlist!A:J', [
    id, providerId, serviceId ?? '', date, time,
    customerName, customerLineUserId ?? '', customerPhone ?? '',
    new Date().toISOString(), 'pending',
  ])
  return NextResponse.json({ ok: true, id })
}
