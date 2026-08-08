import { NextRequest, NextResponse } from 'next/server'
import { taipeiDate, taipeiDayOfWeek } from '@/lib/slots'
import { getSheetData } from '@/lib/sheets'

export type DayStatus = 'open' | 'limited' | 'full' | 'closed'
export type CalendarDay = { date: string; status: DayStatus }

const MAX_SLOTS = 18 // TIME_SLOTS.length

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  const days = Math.min(Number(searchParams.get('days') || '28'), 42)

  if (!providerId) return NextResponse.json({ error: 'Missing providerId' }, { status: 400 })

  const [bookingRows, availRows] = await Promise.all([
    getSheetData('bookings!A2:M', { provider_id: providerId }),
    getSheetData('availability!A2:H', { provider_id: providerId }),
  ])

  const providerAvail = availRows.filter(r => r[0] === providerId)
  const blockRows = providerAvail.filter(r => r[1] === 'block')
  const scheduleRows = providerAvail.filter(r => r[1] === 'schedule')
  const hasSchedule = scheduleRows.length > 0

  const result: CalendarDay[] = []

  for (let i = 0; i < days; i++) {
    // ⚠️ 用台北時區算日期：舊寫法 new Date()+setHours 在 Vercel(UTC) 上，
    // 台灣凌晨 0–8 點會讓日曆第一格變成昨天
    const dateStr = taipeiDate(i)
    const dow = taipeiDayOfWeek(dateStr) // 0=Sun

    // Explicitly blocked date
    if (blockRows.some(r => r[2] === dateStr)) {
      result.push({ date: dateStr, status: 'closed' }); continue
    }

    // Schedule-based open/close
    const DOW_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    const daySchedule = scheduleRows.find(r => r[2] === DOW_NAMES[dow])
    const isClosed =
      (hasSchedule && daySchedule && daySchedule[5]?.toLowerCase() === 'false') ||
      (hasSchedule && !daySchedule) || // day not in schedule = closed
      (!hasSchedule && dow === 0)       // no schedule → Sunday closed by default

    if (isClosed) { result.push({ date: dateStr, status: 'closed' }); continue }

    // Count non-cancelled bookings
    const booked = bookingRows.filter(
      r => r[1] === providerId && r[5] === dateStr && (r[12] ?? '') !== 'cancelled'
    ).length

    const status: DayStatus =
      booked === 0               ? 'open'
      : booked < MAX_SLOTS * 0.6 ? 'open'
      : booked < MAX_SLOTS       ? 'limited'
      :                            'full'

    result.push({ date: dateStr, status })
  }

  return NextResponse.json(result)
}
