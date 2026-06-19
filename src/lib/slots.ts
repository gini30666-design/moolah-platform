// ============================================================
//  時段計算 — 單一真相來源（pure，無 I/O）
//  availability 顯示端與 booking 下單端共用同一套，杜絕「畫面可約但下單擋/不擋」的 drift。
//  輸入 rows 為 getSheetData 回傳的 string[][]（欄位順序見 sheets.ts TABLE_COLS）。
// ============================================================

export type SlotStatus = 'available' | 'booked' | 'hot'
export type Slot = { time: string; status: SlotStatus }

// 與全站一致的時段表（含 12:00–12:30 午休斷點）
export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
]
export const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SLOT_MINUTES = 30

// "9:00" → "09:00"（相容歷史去前導零資料）
export function padTime(t: unknown): string {
  const m = String(t ?? '').match(/^(\d{1,2}):(\d{2})$/)
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : String(t ?? '')
}

export function timeToMinutes(t: string): number {
  const [h, m] = padTime(t).split(':').map(Number)
  return h * 60 + (m || 0)
}

export type Row = (string | undefined)[]

export type AvailabilityInput = {
  providerId: string
  date: string                 // 'YYYY-MM-DD'
  serviceId?: string | null    // 指定服務 → 依時長判斷能否塞下
  bookingRows: Row[]           // getSheetData('bookings!A2:M')
  serviceRows: Row[]           // getSheetData('services!A2:F')
  availRows: Row[]             // getSheetData('availability!A2:F')
}

// 某服務需要幾個 30 分格（找不到服務 → 1 格）
function slotsForService(serviceRows: Row[], providerId: string, serviceId: string | null | undefined): number {
  if (!serviceId) return 1
  const svc = serviceRows.find(r => r[0] === providerId && r[1] === serviceId)
  if (!svc) return 1
  return Math.max(1, Math.ceil(Number(svc[4]) / SLOT_MINUTES))
}

// 計算某職人某日的「已被佔用的 30 分格」集合（含每筆既有預約的服務時長）
export function computeOccupiedSlots(bookingRows: Row[], serviceRows: Row[], providerId: string, date: string): Set<string> {
  const occupied = new Set<string>()
  const todays = bookingRows.filter(r => r[1] === providerId && r[5] === date && (r[12] ?? '') !== 'cancelled')
  for (const b of todays) {
    const startIdx = TIME_SLOTS.indexOf(padTime(b[6]))
    if (startIdx === -1) continue
    const need = slotsForService(serviceRows, providerId, b[2])
    for (let i = 0; i < need; i++) {
      const cell = TIME_SLOTS[startIdx + i]
      if (cell) occupied.add(cell)
    }
  }
  return occupied
}

// 主計算：回傳該日每個時段的狀態。availability 顯示端與 booking 下單端都吃這個。
export function computeAvailability(input: AvailabilityInput): Slot[] {
  const { providerId, date, serviceId, bookingRows, serviceRows, availRows } = input
  const providerAvail = availRows.filter(r => r[0] === providerId && r[1])
  const blockRows = providerAvail.filter(r => r[1] === 'block')
  const scheduleRows = providerAvail.filter(r => r[1] === 'schedule')

  const allBooked: Slot[] = TIME_SLOTS.map(t => ({ time: t, status: 'booked' as SlotStatus }))

  // 1) 整天休假
  if (blockRows.some(r => r[2] === date)) return allBooked

  // 2) 該 weekday 公休 / 取得營業時段
  const dayOfWeek = new Date(date + 'T12:00:00').getDay()
  const daySchedule = scheduleRows.find(r => r[2] === DOW_NAMES[dayOfWeek])
  if (daySchedule && (daySchedule[5] ?? '').toLowerCase() === 'false') return allBooked

  const startMin = timeToMinutes(daySchedule ? (daySchedule[3] || '09:00') : '09:00')
  const endMin = timeToMinutes(daySchedule ? (daySchedule[4] || '19:00') : '19:00')

  const occupied = computeOccupiedSlots(bookingRows, serviceRows, providerId, date)
  const serviceSlots = slotsForService(serviceRows, providerId, serviceId)

  return TIME_SLOTS.map((time, idx) => {
    const slotMin = timeToMinutes(time)

    // 營業時段外
    if (slotMin < startMin || slotMin >= endMin) return { time, status: 'booked' as SlotStatus }

    // 服務能否從此格起連續塞下（且不撞已佔用、不超出時段表）
    const fits = Array.from({ length: serviceSlots }, (_, i) => TIME_SLOTS[idx + i])
      .every(t => t !== undefined && !occupied.has(t))
    if (!fits) return { time, status: 'booked' as SlotStatus }

    // 緊鄰既有預約 → hot（鼓勵集中）
    const before = TIME_SLOTS[idx - 1]
    const after = TIME_SLOTS[idx + serviceSlots]
    const hot = (before !== undefined && occupied.has(before)) || (after !== undefined && occupied.has(after))
    return { time, status: hot ? 'hot' : 'available' as SlotStatus }
  })
}

// 下單守門：該 time 在 computeAvailability 裡是否真的可約（available / hot）。
// booking POST 用它做伺服器端重驗 → 與畫面顯示保證一致。
export function isSlotBookable(input: AvailabilityInput, time: string): boolean {
  const target = padTime(time)
  const slot = computeAvailability(input).find(s => s.time === target)
  return !!slot && slot.status !== 'booked'
}
