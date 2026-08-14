import { NextRequest, NextResponse } from 'next/server'
import { computeAvailability, taipeiDate, taipeiDayOfWeek } from '@/lib/slots'
import { getSheetData } from '@/lib/sheets'

export type DayStatus = 'open' | 'limited' | 'full' | 'closed'
export type CalendarDay = { date: string; status: DayStatus }

// 剩餘比例低於這條線就標「少量」
const LIMITED_RATIO = 0.4

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  const serviceId = searchParams.get('serviceId')
  const days = Math.min(Number(searchParams.get('days') || '28'), 42)

  if (!providerId) return NextResponse.json({ error: 'Missing providerId' }, { status: 400 })

  const [bookingRows, serviceRows, availRows] = await Promise.all([
    getSheetData('bookings!A2:M', { provider_id: providerId }),
    getSheetData('services!A2:F', { provider_id: providerId }),
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

    // Schedule-based open/close（公休與「訂滿」要分得出來，所以這關留著）
    const DOW_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    const daySchedule = scheduleRows.find(r => r[2] === DOW_NAMES[dow])
    const isClosed =
      (hasSchedule && daySchedule && daySchedule[5]?.toLowerCase() === 'false') ||
      (hasSchedule && !daySchedule) || // day not in schedule = closed
      (!hasSchedule && dow === 0)       // no schedule → Sunday closed by default

    if (isClosed) { result.push({ date: dateStr, status: 'closed' }); continue }

    // ⚠️ 空／緊／滿一律問 computeAvailability，不要自己估。
    //    2026-08-14 前這裡是「已預約筆數 ÷ 依營業時數估算的容量」，於是：
    //      · 固定梯次的職人（自由島一天 4 梯）容量被估成 18 格 →
    //        四梯全訂滿了，日曆還顯示「有空位」
    //      · 今天已經過去的時段仍被算成可賣 → 客人點進去是空的
    //    改成直接數「實際還約得到幾格」，跟預約頁看到的完全一致。
    const slots = computeAvailability({
      providerId, date: dateStr, serviceId, bookingRows, serviceRows, availRows,
    })
    const total = slots.length
    const free = slots.filter(s => s.status !== 'booked').length

    const status: DayStatus =
      total === 0 || free === 0 ? 'full'
      : free <= total * LIMITED_RATIO ? 'limited'
      : 'open'

    result.push({ date: dateStr, status })
  }

  return NextResponse.json(result)
}
