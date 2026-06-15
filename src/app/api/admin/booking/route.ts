import { NextRequest, NextResponse } from 'next/server'
import { updateBookingStatus, getSheetData } from '@/lib/sheets'
import { sb } from '@/lib/supabase'
import { pushMessage } from '@/lib/line'
import { autoBlacklistIfThresholdReached } from '@/lib/blacklist'
import { verifyOwner } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { bookingId, status } = body

  if (!bookingId || !['cancelled', 'confirmed', 'no_show'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // 從預約反查 providerId，確認呼叫者是該預約所屬店家的擁有者
  const allBookings = await getSheetData('bookings!A2:M')
  const target = allBookings.find(r => r[0] === bookingId)
  if (!target) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  const auth = await verifyOwner(req, target[1])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const success = await updateBookingStatus(bookingId, status)
  if (!success) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  // 標記為 no_show 後檢查是否達自動拉黑門檻
  if (status === 'no_show') {
    try {
      const rows = await getSheetData('bookings!A2:M')
      const row = rows.find(r => r[0] === bookingId)
      if (row) {
        const providerId = row[1] as string
        const customerName = row[3] as string
        const customerLineUserId = (row[4] as string) ?? ''

        const providers = await getSheetData('providers!A2:E')
        const provider = providers.find(p => p[0] === providerId)
        const providerLineUserId = (provider?.[4] as string) ?? ''
        const providerName = (provider?.[1] as string) ?? ''

        await autoBlacklistIfThresholdReached({
          providerId, providerLineUserId, providerName,
          customerLineUserId, customerName,
        })
      }
    } catch (err) {
      console.error('[admin/booking no_show → blacklist check]', err)
    }
  }

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
          await sb.from('waitlist').update({ status: 'notified' }).eq('id', entry[0])
        }
      } catch {
        // Waitlist notification failure should not block the response
      }
    }
  }

  return NextResponse.json({ success: true })
}
