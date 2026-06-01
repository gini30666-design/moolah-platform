import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'
import { pushMessage } from '@/lib/line'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find customers whose last booking was exactly 30 days ago
  const target30 = new Date(today)
  target30.setDate(target30.getDate() - 30)
  const target30Str = target30.toISOString().split('T')[0]

  const [bookingRows, providerRows] = await Promise.all([
    getSheetData('bookings!A2:M'),
    getSheetData('providers!A2:N'),
  ])

  // Group bookings by (customerLineUserId, providerId) → find last visit date
  const customerMap = new Map<string, { lastDate: string; providerId: string; providerName: string; userId: string }>()

  for (const r of bookingRows) {
    const status = r[12] ?? 'active'
    if (status === 'cancelled') continue
    const userId = r[4]
    const providerId = r[1]
    const date = r[5]
    if (!userId || userId === 'MANUAL' || !providerId || !date) continue

    const key = `${providerId}::${userId}`
    const existing = customerMap.get(key)
    if (!existing || date > existing.lastDate) {
      const providerRow = providerRows.find(p => p[0] === providerId)
      customerMap.set(key, {
        lastDate: date,
        providerId,
        providerName: providerRow?.[1] ?? '設計師',
        userId,
      })
    }
  }

  let sent = 0
  const providerBookingLinks = new Map<string, string>()
  for (const p of providerRows) {
    if (p[0] && p[12]) providerBookingLinks.set(p[0], p[12]) // shortCode in col M (index 12)
  }

  for (const { lastDate, providerName, userId, providerId } of customerMap.values()) {
    if (lastDate !== target30Str) continue

    // Check no future bookings exist
    const hasFuture = bookingRows.some(r =>
      r[4] === userId && r[1] === providerId &&
      r[5] > today.toISOString().split('T')[0] &&
      (r[12] ?? 'active') !== 'cancelled'
    )
    if (hasFuture) continue

    const shortCode = providerBookingLinks.get(providerId)
    const bookingUrl = shortCode
      ? `https://moolah-platform.vercel.app/go/${shortCode}`
      : `https://moolah-platform.vercel.app/${providerId}`

    try {
      await pushMessage(
        userId,
        `好久不見！\n\n距離您上次與 ${providerName} 的預約已超過 30 天了。\n\n隨時歡迎回來預約，讓您繼續保持最佳狀態 ✨\n\n👉 立即預約：${bookingUrl}`
      )
      sent++
    } catch {
      // Skip failed notifications
    }
  }

  return NextResponse.json({ ok: true, sent, target: target30Str })
}
