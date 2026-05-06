import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'
import { pushMessage } from '@/lib/line'

// Vercel Cron 每天早上 8:00 (UTC+8) 呼叫此 endpoint
// vercel.json: { "crons": [{ "path": "/api/notify", "schedule": "0 0 * * *" }] }
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toLocaleDateString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '-')

  const [providerRows, bookingRows] = await Promise.all([
    getSheetData('providers!A2:F'),
    getSheetData('bookings!A2:I'),
  ])

  const todayBookings = bookingRows.filter(r => r[5] === today)

  if (todayBookings.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // 依設計師分組
  const byProvider: Record<string, typeof todayBookings> = {}
  for (const b of todayBookings) {
    const pid = b[1]
    if (!byProvider[pid]) byProvider[pid] = []
    byProvider[pid].push(b)
  }

  let sent = 0
  for (const [providerId, bookings] of Object.entries(byProvider)) {
    const providerRow = providerRows.find(r => r[0] === providerId)
    if (!providerRow) continue

    const providerLineUserId = providerRow[4]
    const lines = bookings.map(b => `• ${b[6]} ${b[3]}（${b[2]}）`).join('\n')
    const msg = `📅 今日預約 ${today}\n\n${lines}\n\n共 ${bookings.length} 筆`

    await pushMessage(providerLineUserId, msg)
    sent++
  }

  return NextResponse.json({ sent, date: today })
}
