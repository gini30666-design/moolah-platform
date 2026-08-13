import { NextRequest, NextResponse } from 'next/server'
import { taipeiDate, taipeiDayOfWeek, timeToMinutes, padTime } from '@/lib/slots'
import { getSheetData } from '@/lib/sheets'

export type DayStatus = 'open' | 'limited' | 'full' | 'closed'
export type CalendarDay = { date: string; status: DayStatus }

/**
 * 這位職人這天有幾個 30 分格可賣 —— 用來判斷日曆上的「空／緊／滿」。
 *
 * ⚠️ 2026-08-12 前這裡是寫死的 `MAX_SLOTS = 18`，註解還寫著「TIME_SLOTS.length」，
 *    但 8/06 把 12:00/12:30 加回去後實際是 20 —— 日曆會把日子算得比實際更滿。
 *    現在時段表已擴充成全天 48 格，寫死更不可能對：早班職人（07:00–12:00）
 *    只有 10 格，用 48 去除會永遠顯示「很空」。改成依當天班表實算。
 */
function daySlotCapacity(daySchedule: (string | undefined)[] | undefined): number {
  const startMin = timeToMinutes(daySchedule?.[3] || '09:00')
  const rawEnd = daySchedule?.[4] || '19:00'
  const endMin = padTime(rawEnd) === '00:00' ? 1440 : timeToMinutes(rawEnd)

  let minutes = endMin - startMin
  // 扣掉午休（兩欄都有值且成立才算）
  const bs = daySchedule?.[6], be = daySchedule?.[7]
  if (bs && be) {
    const b1 = timeToMinutes(bs), b2 = timeToMinutes(be)
    if (b2 > b1) minutes -= (b2 - b1)
  }
  return Math.max(1, Math.floor(minutes / 30))
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  const days = Math.min(Number(searchParams.get('days') || '28'), 42)

  if (!providerId) return NextResponse.json({ error: 'Missing providerId' }, { status: 400 })

  const [bookingRows, availRows] = await Promise.all([
    getSheetData('bookings!A2:M', { provider_id: providerId }),
    getSheetData('availability!A2:I', { provider_id: providerId }),
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

    const capacity = daySlotCapacity(daySchedule)
    const status: DayStatus =
      booked === 0              ? 'open'
      : booked < capacity * 0.6 ? 'open'
      : booked < capacity       ? 'limited'
      :                           'full'

    result.push({ date: dateStr, status })
  }

  return NextResponse.json(result)
}
