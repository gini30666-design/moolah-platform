import { NextRequest, NextResponse } from 'next/server'
import { updateBookingStatus, getSheetData, updateRow } from '@/lib/sheets'
import { pushMessage } from '@/lib/line'

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { bookingId, status } = body

  if (!bookingId || !['cancelled', 'confirmed', 'no_show'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const success = await updateBookingStatus(bookingId, status)
  if (!success) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  if (status === 'cancelled') {
    const rows = await getSheetData('bookings!A2:M')
    const row = rows.find(r => r[0] === bookingId)
    if (row) {
      const customerLineUserId = row[4]
      const providerId = row[1]
      const date = row[5]
      const time = row[6]

      if (customerLineUserId) {
        await pushMessage(
          customerLineUserId,
          `您好，您在 ${date} ${time} 的預約已由設計師取消。\n如需重新預約，請點選預約連結重新安排。\n造成不便深感抱歉 🙏`
        )
      }

      // Notify first person on waitlist for this slot
      try {
        const waitlistRows = await getSheetData('waitlist!A2:J')
        const entryIdx = waitlistRows.findIndex(r =>
          r[1] === providerId && r[3] === date && r[4] === time && (r[9] ?? 'pending') === 'pending'
        )
        if (entryIdx !== -1) {
          const entry = waitlistRows[entryIdx]
          const waitlistUserId = entry[6]
          const waitlistName = entry[5]
          const providerRows = await getSheetData('providers!A2:N')
          const providerRow = providerRows.find(p => p[0] === providerId)
          const shortCode = providerRow?.[12] ?? ''
          const bookingUrl = shortCode
            ? `https://moolah-platform.vercel.app/go/${shortCode}`
            : `https://moolah-platform.vercel.app/${providerId}`

          if (waitlistUserId) {
            await pushMessage(
              waitlistUserId,
              `${waitlistName} 好消息！\n\n您候補的 ${date} ${time} 時段剛剛有空缺了 🎉\n\n請盡快點擊以下連結完成預約（先到先得）：\n${bookingUrl}`
            )
          }
          // Mark waitlist entry as notified
          await updateRow('waitlist', entryIdx + 2, [
            entry[0], entry[1], entry[2], entry[3], entry[4],
            entry[5], entry[6], entry[7], entry[8], 'notified',
          ])
        }
      } catch {
        // Waitlist notification failure should not block the response
      }
    }
  }

  return NextResponse.json({ success: true })
}
