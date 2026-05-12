import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, updateBookingStatus } from '@/lib/sheets'
import { pushMessage } from '@/lib/line'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const today = new Date().toISOString().split('T')[0]

  const [bookingRows, serviceRows, providerRows] = await Promise.all([
    getSheetData('bookings!A2:L'),
    getSheetData('services!A2:F'),
    getSheetData('providers!A2:B'),
  ])

  const bookings = bookingRows
    .filter(r => r[4] === userId && (r[11] ?? '') !== 'cancelled')
    .map(r => {
      const provider = providerRows.find(p => p[0] === r[1])
      const service = serviceRows.find(s => s[0] === r[1] && s[1] === r[2])
      return {
        bookingId: r[0] as string,
        providerId: r[1] as string,
        serviceId: r[2] as string,
        customerName: r[3] as string,
        date: r[5] as string,
        time: r[6] as string,
        notes: (r[9] as string) ?? '',
        status: (r[11] as string) ?? 'confirmed',
        isPast: (r[5] as string) < today,
        providerName: (provider?.[1] as string) ?? '設計師',
        servicePrice: (service?.[3] as string) ?? '',
        serviceName: (service?.[2] as string) ?? '服務',
      }
    })
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  return NextResponse.json({ bookings })
}

// Consumer-facing cancellation — verifies lineUserId matches booking owner
export async function PATCH(req: NextRequest) {
  const { bookingId, userId } = await req.json()

  if (!bookingId || !userId) {
    return NextResponse.json({ error: 'bookingId and userId required' }, { status: 400 })
  }

  const rows = await getSheetData('bookings!A2:L')
  const row = rows.find(r => r[0] === bookingId)

  if (!row) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (row[4] !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  if ((row[11] as string) === 'cancelled') {
    return NextResponse.json({ error: 'Already cancelled' }, { status: 409 })
  }

  const success = await updateBookingStatus(bookingId, 'cancelled')
  if (!success) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  // Notify designer
  const providerRows = await getSheetData('providers!A2:E')
  const provider = providerRows.find(p => p[0] === row[1])
  const designerLineUserId = provider?.[4] as string | undefined
  if (designerLineUserId) {
    await pushMessage(
      designerLineUserId,
      `顧客已取消預約 ${row[5]} ${row[6]} 的 ${row[3]} 預約。\n系統已自動更新，請確認您的排程。`
    )
  }

  return NextResponse.json({ success: true })
}
