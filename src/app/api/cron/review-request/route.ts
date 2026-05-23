import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'
import { buildReviewFlex, pushFlexMessage } from '@/lib/line'

// Vercel Cron: 每日 UTC 13:00（台灣 21:00）
// 推播給當日已完成服務的顧客邀評通知
// vercel.json: { "path": "/api/cron/review-request", "schedule": "0 13 * * *" }
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
  const todayStr = now.toISOString().split('T')[0]

  const [providerRows, serviceRows, bookingRows, reviewRows] = await Promise.all([
    getSheetData('providers!A2:F'),
    getSheetData('services!A2:F'),
    getSheetData('bookings!A2:L'),
    getSheetData('reviews!A2:B'),
  ])

  // 已評價的 bookingId set
  const reviewedIds = new Set(reviewRows.map(r => r[0]))

  // 今日已完成且有 LINE userId 且尚未評價的預約
  const toNotify = bookingRows.filter(r =>
    r[5] === todayStr &&
    (r[11] ?? '') !== 'cancelled' &&
    r[4] && // 有 customerLineUserId
    r[4] !== 'MANUAL' &&
    !reviewedIds.has(r[0])
  )

  if (toNotify.length === 0) {
    return NextResponse.json({ sent: 0, date: todayStr })
  }

  let sent = 0
  for (const b of toNotify) {
    const providerRow = providerRows.find(r => r[0] === b[1])
    const svc = serviceRows.find(s => s[0] === b[1] && s[1] === b[2])

    const providerName = (providerRow?.[1] as string) ?? '職人'
    const serviceName = (svc?.[2] as string) ?? '服務'
    const customerName = (b[3] as string) ?? '顧客'
    const customerUserId = b[4] as string

    const flex = buildReviewFlex({
      bookingId: b[0] as string,
      providerId: b[1] as string,
      providerName,
      serviceName,
      customerName,
      customerUserId,
      date: b[5] as string,
    })

    await pushFlexMessage(customerUserId, `${providerName} 想邀您評分 ⭐`, flex)
    sent++
  }

  return NextResponse.json({ sent, date: todayStr })
}
