import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'
import { pushMessage } from '@/lib/line'

// Vercel Cron: 每日 UTC 10:00（台灣 18:00）推播明日預約提醒
// vercel.json: { "path": "/api/cron/reminder", "schedule": "0 10 * * *" }
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const [providerRows, serviceRows, bookingRows] = await Promise.all([
    getSheetData('providers!A2:F'),
    getSheetData('services!A2:F'),
    getSheetData('bookings!A2:L'),
  ])

  const tomorrowBookings = bookingRows.filter(
    r => r[5] === tomorrowStr && (r[11] ?? '') !== 'cancelled'
  )

  if (tomorrowBookings.length === 0) {
    return NextResponse.json({ sent: 0, date: tomorrowStr })
  }

  let customerSent = 0
  let providerSent = 0

  // 依設計師分組（方便推播設計師摘要）
  const byProvider: Record<string, typeof tomorrowBookings> = {}
  for (const b of tomorrowBookings) {
    if (!byProvider[b[1]]) byProvider[b[1]] = []
    byProvider[b[1]].push(b)
  }

  // 推播給各設計師：明日排程摘要
  for (const [providerId, bookings] of Object.entries(byProvider)) {
    const providerRow = providerRows.find(r => r[0] === providerId)
    if (!providerRow?.[4]) continue

    const lines = bookings
      .sort((a, b) => (a[6] as string).localeCompare(b[6] as string))
      .map(b => {
        const svc = serviceRows.find(s => s[0] === providerId && s[1] === b[2])
        return `• ${b[6]}　${b[3] || '顧客'}（${(svc?.[2] as string) ?? b[2]}）`
      })
      .join('\n')

    const msg = `🗓 明日預約提醒 ${tomorrowStr}\n\n${lines}\n\n共 ${bookings.length} 筆，請準時就位 ✨`
    await pushMessage(providerRow[4] as string, msg)
    providerSent++
  }

  // 推播給各顧客：個人提醒
  for (const b of tomorrowBookings) {
    const customerLineUserId = b[4] as string
    if (!customerLineUserId || customerLineUserId === 'MANUAL') continue

    const providerRow = providerRows.find(r => r[0] === b[1])
    const svc = serviceRows.find(s => s[0] === b[1] && s[1] === b[2])
    const providerName = (providerRow?.[1] as string) ?? '設計師'
    const serviceName = (svc?.[2] as string) ?? '服務'

    const msg = `✨ 預約提醒\n\n明天 ${tomorrowStr} ${b[6]} 您有一筆預約：\n\n服務：${serviceName}\n職人：${providerName}\n\n期待為您服務 🙏`
    await pushMessage(customerLineUserId, msg)
    customerSent++
  }

  return NextResponse.json({ providerSent, customerSent, date: tomorrowStr })
}
