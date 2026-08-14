// ============================================================
//  時段計算 — 單一真相來源（pure，無 I/O）
//  availability 顯示端與 booking 下單端共用同一套，杜絕「畫面可約但下單擋/不擋」的 drift。
//  輸入 rows 為 getSheetData 回傳的 string[][]（欄位順序見 sheets.ts TABLE_COLS）。
// ============================================================

export type SlotStatus = 'available' | 'booked' | 'hot'
export type Slot = { time: string; status: SlotStatus }

// 與全站一致的時段表 —— 全天 00:00–23:30，每 30 分一格（48 格）。
//
// 2026-08-06：12:00/12:30 回歸（午休改由每位職人在排班自訂 break_start/break_end，留空＝不休）
// 2026-08-12：從「09:00–18:30 寫死」擴充為全天。
//   ⚠️ 這個陣列只是「所有可能存在的格子」，不是「會顯示的格子」——
//      computeAvailability 只回傳落在該職人營業時段內的格子（見下方 withinHours）。
//      所以既有職人（預設 09:00–19:00）拿到的結果與擴充前完全相同，不會突然多出一堆灰格。
//   ⚠️ 全站只能有這一份。next-available / embed 一律 import，不要再各自複製
//      （8/06 加回 12:00 那次就是因為有三份副本而漏改兩份）。
export const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2), m = i % 2 ? '30' : '00'
  return `${String(h).padStart(2, '0')}:${m}`
})
export const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SLOT_MINUTES = 30

/**
 * 最短預約前置時間（分鐘）—— 時段開始時間距離「現在」不足這麼久就不開放。
 *
 * 客人不可能十分鐘後就到店，職人也需要準備時間。
 * 只影響「今天」；明天以後整天照常開放。
 * 2026-08-14 Gini 定 30 分鐘。要調整改這一個常數即可。
 */
export const BOOKING_LEAD_MINUTES = 30

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
  availRows: Row[]             // getSheetData('availability!A2:I')
}

/**
 * 固定梯次（slot_starts，availability 第 9 欄）。
 *
 * 有些職人不是「營業時段內每 30 分都能開始」，而是固定幾個梯次出發
 * （自由島潛水：08:00／10:00／13:00／15:00 四梯，每梯 2 小時）。
 * 留空 ＝ 維持預設行為（每 30 分一格），既有職人零影響。
 *
 * ⚠️ 非梯次時間的處理是「不回傳」而不是「回傳 booked」——
 *    與 withinHours 同一個原則：那個時間點不存在，不是「已經被約走」。
 *    isSlotBookable 用 find()，找不到即 false，下單守門自動跟著生效。
 */
function parseSlotStarts(raw: unknown): Set<string> | null {
  const list = String(raw ?? '').split(',').map(s => padTime(s.trim())).filter(s => /^\d{2}:\d{2}$/.test(s))
  return list.length ? new Set(list) : null
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

  // 先取營業時段，休假判斷才知道該回傳幾格
  // （改全天時段表後，allBooked 若沿用整包 48 格，公休日會吐出一整排凌晨灰格）
  const dayOfWeek = new Date(date + 'T12:00:00').getDay()
  const daySchedule = scheduleRows.find(r => r[2] === DOW_NAMES[dayOfWeek])

  const startMin = timeToMinutes(daySchedule ? (daySchedule[3] || '09:00') : '09:00')
  // 收工時間 '00:00' 視為當日 24:00（<input type="time"> 打不出 24:00，這是營業到午夜的唯一表示法）
  const rawEnd = daySchedule ? (daySchedule[4] || '19:00') : '19:00'
  const endMin = padTime(rawEnd) === '00:00' ? 1440 : timeToMinutes(rawEnd)
  const withinHours = (min: number) => min >= startMin && min < endMin

  // 固定梯次：有設就只開這幾個起點（且仍須落在營業時段內）
  const slotStarts = parseSlotStarts(daySchedule?.[8])

  // 今天：已經過去、以及太趕（不足 BOOKING_LEAD_MINUTES）的時段一律不開放。
  // ⚠️ 這裡跟 withinHours／slot_starts 同一個原則：約不到的時間「不存在」，
  //    不是「被別人約走」—— 所以是不回傳，不是回傳 booked。
  const isToday = date === todayInTaipei()
  const earliestMin = isToday ? taipeiNowMinutes() + BOOKING_LEAD_MINUTES : -1
  const notPast = (min: number) => !isToday || min >= earliestMin

  const isOpenStart = (t: string) => {
    const min = timeToMinutes(t)
    return withinHours(min) && notPast(min) && (!slotStarts || slotStarts.has(t))
  }

  const allBooked: Slot[] = TIME_SLOTS
    .filter(isOpenStart)
    .map(t => ({ time: t, status: 'booked' as SlotStatus }))

  // 1) 整天休假
  if (blockRows.some(r => r[2] === date)) return allBooked
  // 2) 該 weekday 公休
  if (daySchedule && (daySchedule[5] ?? '').toLowerCase() === 'false') return allBooked

  // 午休（每位職人自訂；兩欄都有值且成立才生效，留空＝不休）
  const rawBreakStart = daySchedule?.[6] ?? ''
  const rawBreakEnd = daySchedule?.[7] ?? ''
  const hasBreak = !!rawBreakStart && !!rawBreakEnd
  const breakStartMin = hasBreak ? timeToMinutes(rawBreakStart) : 0
  const breakEndMin = hasBreak ? timeToMinutes(rawBreakEnd) : 0
  const breakValid = hasBreak && breakEndMin > breakStartMin
  const inBreak = (min: number) => breakValid && min >= breakStartMin && min < breakEndMin

  const occupied = computeOccupiedSlots(bookingRows, serviceRows, providerId, date)
  const serviceSlots = slotsForService(serviceRows, providerId, serviceId)

  // ⚠️ 只回傳營業時段內的格子。時段表是全天 48 格，若整包回傳，
  //    客人會看到一整排凌晨的灰格。營業時段外＝不存在，不是「已約」。
  //    （isSlotBookable 用 find()，找不到即視為不可約，行為仍正確。）
  //    設了固定梯次時同理：非梯次的起點一律不回傳。
  return TIME_SLOTS.filter(isOpenStart).map(time => {
    const idx = TIME_SLOTS.indexOf(time)
    const slotMin = timeToMinutes(time)

    // 午休中
    if (inBreak(slotMin)) return { time, status: 'booked' as SlotStatus }

    // 服務能否從此格起連續塞下（不撞已佔用、不做到打烊後、不跨進午休）
    // ⚠️ withinHours 這關不能少：全天時段表下，18:30 起的 90 分服務在陣列上塞得下，
    //    但會做到 20:00 —— 打烊後。改全天前這個 bug 被陣列邊界意外擋住了。
    const fits = Array.from({ length: serviceSlots }, (_, i) => TIME_SLOTS[idx + i])
      .every(t => t !== undefined && withinHours(timeToMinutes(t)) && !occupied.has(t) && !inBreak(timeToMinutes(t)))
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

// ── 日期／時區 ──────────────────────────────────────────────
/**
 * 台北時區的「今天」（YYYY-MM-DD）。
 *
 * ⚠️ 不要用 `new Date().toISOString().split('T')[0]` —— 那是 UTC 日期。
 * 台灣是 UTC+8，所以台灣時間 00:00–08:00 之間，UTC 還停在「昨天」，
 * 拿去比對 bookings.date 會把昨天的預約也算進「即將到來」。
 * （2026-08-08 架構掃描時，在 my-bookings 與 webhook 的「我的預約」發現這個 bug）
 */
export function todayInTaipei(): string {
  return taipeiDate(0)
}

/**
 * 台北時區的「今天 + n 天」（YYYY-MM-DD）。
 *
 * ⚠️ 也不要用 `const d = new Date(); d.setHours(0,0,0,0); d.toISOString()` ——
 * `setHours` 設的是「執行環境時區」的午夜，Vercel 跑在 UTC，
 * 於是台灣凌晨 0–8 點算出來會是台灣的昨天。
 * （/api/calendar 的日曆第一格會變成昨天）
 *
 * 這裡改成先取台北的年月日，再用 UTC 建構做日期加減 —— 不受執行環境時區影響。
 */
export function taipeiDate(offsetDays = 0): string {
  const [y, m, d] = new Date()
    .toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' })
    .split('-').map(Number)
  const base = new Date(Date.UTC(y, m - 1, d))
  base.setUTCDate(base.getUTCDate() + offsetDays)
  return base.toISOString().slice(0, 10)
}

/**
 * 台北「現在」是當日的第幾分鐘（00:00 起算）。
 *
 * 用來擋掉今天已經過去的時段 —— 沒有這道過濾，客人下午三點打開頁面
 * 仍看得到今天早上九點可約，送出後職人會收到一張時間已經過去的預約單。
 * （2026-08-14 檢查 zuzu 時發現：她 16:00 打烊，晚上七點查仍回傳整天可約）
 */
export function taipeiNowMinutes(): number {
  const hhmm = new Date().toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Taipei', hour12: false, hour: '2-digit', minute: '2-digit',
  })
  return timeToMinutes(hhmm)
}

/** 台北時區的星期幾（0=Sun），與 taipeiDate 搭配用。 */
export function taipeiDayOfWeek(dateStr: string): number {
  return new Date(dateStr + 'T12:00:00Z').getUTCDay()
}
