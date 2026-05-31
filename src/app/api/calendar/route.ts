import { NextRequest, NextResponse } from 'next/server'
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
    getSheetData('bookings!A2:I'),
    getSheetData('availability!A2:F'),
  ])

  const providerAvail = availRows.filter(r => r[0] === providerId)
  const blockRows = providerAvail.filter(r => r[1] === 'block')
  const scheduleRows = providerAvail.filter(r => r[1] === 'schedule')
  const hasSchedule = scheduleRows.length > 0

  const result: CalendarDay[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const dow = d.getDay() // 0=Sun

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
      r => r[1] === providerId && r[5] === dateStr && r[8] !== 'cancelled'
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
