import { NextRequest, NextResponse } from 'next/server'
import { updateBookingStatus } from '@/lib/sheets'
import { pushMessage } from '@/lib/line'
import { getSheetData } from '@/lib/sheets'

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { bookingId, status } = body

  if (!bookingId || !['cancelled', 'confirmed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const success = await updateBookingStatus(bookingId, status)
  if (!success) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  if (status === 'cancelled') {
    const rows = await getSheetData('bookings!A2:L')
    const row = rows.find(r => r[0] === bookingId)
    if (row) {
      const customerLineUserId = row[4]
      const date = row[5]
      const time = row[6]
      if (customerLineUserId) {
        await pushMessage(
          customerLineUserId,
          `您好，您在 ${date} ${time} 的預約已由設計師取消。\n如需重新預約，請點選預約連結重新安排。\n造成不便深感抱歉 🙏`
        )
      }
    }
  }

  return NextResponse.json({ success: true })
}
