import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  if (!providerId) return NextResponse.json({ error: 'Missing providerId' }, { status: 400 })

  const [bookingRows, serviceRows] = await Promise.all([
    getSheetData('bookings!A2:L'),
    getSheetData('services!A2:F'),
  ])

  const bookings = bookingRows
    .filter(r => r[1] === providerId)
    .map(r => {
      const serviceRow = serviceRows.find(s => s[0] === providerId && s[1] === r[2])
      return {
        id: r[0] ?? '',
        providerId: r[1] ?? '',
        serviceId: r[2] ?? '',
        serviceName: serviceRow?.[2] ?? r[2],
        servicePrice: Number(serviceRow?.[3] ?? 0),
        customerName: r[3] ?? '',
        customerLineUserId: r[4] ?? '',
        date: r[5] ?? '',
        time: r[6] ?? '',
        note: r[7] ?? '',
        createdAt: r[8] ?? '',
        gender: r[9] ?? '',
        hairLength: r[10] ?? '',
        status: r[11] ?? 'active',
      }
    })
    .filter(b => b.status !== 'cancelled')
    .sort((a, b) => {
      const dateTimeA = `${a.date} ${a.time}`
      const dateTimeB = `${b.date} ${b.time}`
      return dateTimeA.localeCompare(dateTimeB)
    })

  return NextResponse.json({ bookings })
}
