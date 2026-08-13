import { describe, it, expect, vi } from 'vitest'
import {
  padTime, timeToMinutes, computeOccupiedSlots, computeAvailability, isSlotBookable,
  DOW_NAMES, todayInTaipei, taipeiDate, taipeiDayOfWeek, type Row,
} from './slots'

// ── row builders（欄位順序對齊 sheets.ts TABLE_COLS）────────────────
const PID = 'designer-003'
// bookings: 0 id,1 pid,2 svc,3 name,4 line,5 date,6 time,7 note,8 created,9 gender,10 hair,11 phone,12 status
const booking = (o: { svc?: string; date: string; time: string; status?: string }): Row =>
  ['BK1', PID, o.svc ?? 'svc60', 'C', '', o.date, o.time, '', '', '', '', '', o.status ?? 'confirmed']
// services: 0 pid,1 svc,2 name,3 price,4 duration,5 desc,6 img
const service = (id: string, duration: number): Row => [PID, id, id, '600', String(duration), '', '']
// availability: 0 pid,1 type,2 day_or_date,3 start,4 end,5 active
const block = (date: string): Row => [PID, 'block', date, '', '', 'true']
const schedule = (dow: string, start: string, end: string, active = 'true'): Row =>
  [PID, 'schedule', dow, start, end, active]
// 帶午休的排班（6 break_start, 7 break_end）；只給一邊＝設定不完整，應視為不休息
const scheduleWithBreak = (dow: string, start: string, end: string, bStart: string, bEnd: string): Row =>
  [PID, 'schedule', dow, start, end, 'true', bStart, bEnd]

const SERVICES = [service('svc30', 30), service('svc60', 60), service('svc90', 90)]
const D = '2026-06-22' // 用 dowOf(D) 動態取得星期，測試不受實際星期影響
const dowOf = (date: string) => DOW_NAMES[new Date(date + 'T12:00:00').getDay()]

const base = (over: Partial<Parameters<typeof computeAvailability>[0]> = {}) => ({
  providerId: PID, date: D, serviceId: null,
  bookingRows: [] as Row[], serviceRows: SERVICES, availRows: [] as Row[], ...over,
})

describe('時間 helper', () => {
  it('padTime 補前導零、相容已正規化', () => {
    expect(padTime('9:00')).toBe('09:00')
    expect(padTime('09:30')).toBe('09:30')
    expect(padTime(undefined)).toBe('')
  })
  it('timeToMinutes', () => {
    expect(timeToMinutes('09:00')).toBe(540)
    expect(timeToMinutes('9:30')).toBe(570)
    expect(timeToMinutes('18:30')).toBe(1110)
  })
})

describe('computeOccupiedSlots — 服務時長跨格', () => {
  it('60 分服務佔兩格（09:00 + 09:30）', () => {
    const occ = computeOccupiedSlots([booking({ svc: 'svc60', date: D, time: '09:00' })], SERVICES, PID, D)
    expect(occ.has('09:00')).toBe(true)
    expect(occ.has('09:30')).toBe(true)
    expect(occ.has('10:00')).toBe(false)
  })
  it('已取消的預約不佔格', () => {
    const occ = computeOccupiedSlots([booking({ date: D, time: '09:00', status: 'cancelled' })], SERVICES, PID, D)
    expect(occ.size).toBe(0)
  })
  it('相容歷史去前導零資料（"9:00"）', () => {
    const occ = computeOccupiedSlots([booking({ svc: 'svc30', date: D, time: '9:00' })], SERVICES, PID, D)
    expect(occ.has('09:00')).toBe(true)
  })
})

describe('computeAvailability — 整體狀態', () => {
  it('空白日：營業時段內皆 available', () => {
    const slots = computeAvailability(base())
    expect(slots.find(s => s.time === '09:00')!.status).toBe('available')
    expect(slots.find(s => s.time === '14:00')!.status).toBe('available')
  })
  it('整天休假（block）→ 全 booked', () => {
    const slots = computeAvailability(base({ availRows: [block(D)] }))
    expect(slots.every(s => s.status === 'booked')).toBe(true)
  })
  it('該 weekday 公休（active=false）→ 全 booked', () => {
    const slots = computeAvailability(base({ availRows: [schedule(dowOf(D), '09:00', '18:00', 'false')] }))
    expect(slots.every(s => s.status === 'booked')).toBe(true)
  })
  // 2026-08-12 全天時段表：營業時段外＝「不存在」而非「已約」。
  // 客人只看到營業中的格子，不會被一整排凌晨灰格洗版。
  it('營業時段外的格 → 不回傳（10:00–12:00 營業）', () => {
    const input = base({ availRows: [schedule(dowOf(D), '10:00', '12:00')] })
    const slots = computeAvailability(input)
    expect(slots.map(s => s.time)).toEqual(['10:00', '10:30', '11:00', '11:30'])
    expect(slots.every(s => s.status === 'available')).toBe(true)
    // 不回傳 ≠ 可約：下單守門仍必須擋下開門前／打烊後
    expect(isSlotBookable(input, '09:00')).toBe(false)
    expect(isSlotBookable(input, '13:00')).toBe(false)
    expect(isSlotBookable(input, '10:00')).toBe(true)
  })
  it('★ 全天時段表：早班 07:00 與晚班 22:00 都約得到', () => {
    const early = base({ availRows: [schedule(dowOf(D), '07:00', '09:00')] })
    expect(computeAvailability(early).map(s => s.time)).toEqual(['07:00', '07:30', '08:00', '08:30'])
    expect(isSlotBookable(early, '07:00')).toBe(true)

    const late = base({ availRows: [schedule(dowOf(D), '19:00', '22:00')] })
    expect(isSlotBookable(late, '21:30')).toBe(true)
    expect(isSlotBookable(late, '18:30')).toBe(false)
  })
  it('★ 收工填 00:00 視為午夜 24:00（time input 打不出 24:00）', () => {
    const input = base({ availRows: [schedule(dowOf(D), '22:00', '00:00')] })
    expect(computeAvailability(input).map(s => s.time)).toEqual(['22:00', '22:30', '23:00', '23:30'])
    expect(isSlotBookable(input, '23:30')).toBe(true)
  })
  it('★ 服務不得做到打烊後：90 分服務在 11:00 收工的班表，10:00 起訂不到', () => {
    // 全天時段表下，10:00+90分 = 10:00/10:30/11:00 三格在陣列上都存在，
    // 但 11:00 已超過收工 → 必須擋下（改全天前這個 bug 被陣列邊界意外遮住）
    const input = base({ availRows: [schedule(dowOf(D), '09:00', '11:00')], serviceId: 'svc90' })
    expect(isSlotBookable(input, '10:00')).toBe(false) // 會做到 11:30，打烊後
    expect(isSlotBookable(input, '09:00')).toBe(true)  // 佔 09:00/09:30/10:00，10:30 結束，剛好趕上
  })
  it('已被佔用的格 → booked；相鄰格 → hot', () => {
    const slots = computeAvailability(base({ bookingRows: [booking({ svc: 'svc30', date: D, time: '10:00' })], serviceId: 'svc30' }))
    expect(slots.find(s => s.time === '10:00')!.status).toBe('booked')
    expect(slots.find(s => s.time === '09:30')!.status).toBe('hot')
    expect(slots.find(s => s.time === '10:30')!.status).toBe('hot')
  })
  it('90 分服務無法塞進收尾不足的格 → booked', () => {
    // 18:30 是最後一格，90 分(3格)塞不下 → booked
    const slots = computeAvailability(base({ serviceId: 'svc90' }))
    expect(slots.find(s => s.time === '18:30')!.status).toBe('booked')
    expect(slots.find(s => s.time === '17:30')!.status).toBe('available')
  })
})

describe('isSlotBookable — 下單守門（與顯示端一致）', () => {
  it('★ over-booking 時長重疊：60分服務佔 09:00，他人不能訂 09:30', () => {
    const input = base({ bookingRows: [booking({ svc: 'svc60', date: D, time: '09:00' })], serviceId: 'svc30' })
    expect(isSlotBookable(input, '09:00')).toBe(false) // 完全同時段
    expect(isSlotBookable(input, '09:30')).toBe(false) // ★ 跨格重疊（DB 唯一約束擋不到，這層擋）
    expect(isSlotBookable(input, '10:00')).toBe(true)  // 不重疊 → 可約
  })
  it('休假日不可約', () => {
    expect(isSlotBookable(base({ availRows: [block(D)] }), '14:00')).toBe(false)
  })
  it('weekday 公休不可約', () => {
    expect(isSlotBookable(base({ availRows: [schedule(dowOf(D), '09:00', '18:00', 'false')] }), '14:00')).toBe(false)
  })
  it('非營業時段不可約', () => {
    const input = base({ availRows: [schedule(dowOf(D), '13:00', '18:00')] })
    expect(isSlotBookable(input, '09:00')).toBe(false)
    expect(isSlotBookable(input, '14:00')).toBe(true)
  })
  it('取消後該時段重新可約', () => {
    const input = base({ bookingRows: [booking({ date: D, time: '14:00', status: 'cancelled' })] })
    expect(isSlotBookable(input, '14:00')).toBe(true)
  })
  it('傳 "9:00"（去前導零）也能正確比對', () => {
    expect(isSlotBookable(base(), '9:00')).toBe(true)
  })
})

// ── 午休（2026-08-06：從全站寫死 12:00–13:00 改為每位職人自訂）──────────
describe('午休 break_start / break_end', () => {
  const statusAt = (rows: Row[], time: string, serviceId: string | null = null) =>
    computeAvailability(base({ availRows: rows, serviceId }))!.find(s => s.time === time)!.status

  it('沒設午休 → 中午 12:00 / 12:30 可預約（舊版全站寫死已解除）', () => {
    const rows = [schedule(dowOf(D), '09:00', '18:00')]
    expect(statusAt(rows, '12:00')).not.toBe('booked')
    expect(statusAt(rows, '12:30')).not.toBe('booked')
  })

  it('設 12:00–13:00 → 該區間鎖住，前後緊鄰時段仍可約', () => {
    const rows = [scheduleWithBreak(dowOf(D), '09:00', '18:00', '12:00', '13:00')]
    expect(statusAt(rows, '11:30')).not.toBe('booked')
    expect(statusAt(rows, '12:00')).toBe('booked')
    expect(statusAt(rows, '12:30')).toBe('booked')
    expect(statusAt(rows, '13:00')).not.toBe('booked')
  })

  it('午休時段可自訂在任何時間（14:00–15:00）', () => {
    const rows = [scheduleWithBreak(dowOf(D), '09:00', '18:00', '14:00', '15:00')]
    expect(statusAt(rows, '12:00')).not.toBe('booked')
    expect(statusAt(rows, '14:00')).toBe('booked')
    expect(statusAt(rows, '14:30')).toBe('booked')
    expect(statusAt(rows, '15:00')).not.toBe('booked')
  })

  it('服務時長會跨進午休 → 該起始格擋下（60 分服務不能從 11:30 起）', () => {
    const rows = [scheduleWithBreak(dowOf(D), '09:00', '18:00', '12:00', '13:00')]
    expect(statusAt(rows, '11:30', 'svc60')).toBe('booked')
    expect(statusAt(rows, '11:00', 'svc60')).not.toBe('booked')  // 11:00+11:30 未觸及午休
  })

  it('只填一邊（半套設定）→ 視為不休息，不會誤鎖整天', () => {
    const rows = [scheduleWithBreak(dowOf(D), '09:00', '18:00', '12:00', '')]
    expect(statusAt(rows, '12:00')).not.toBe('booked')
  })

  it('起訖顛倒（13:00–12:00）→ 不成立，不鎖任何時段', () => {
    const rows = [scheduleWithBreak(dowOf(D), '09:00', '18:00', '13:00', '12:00')]
    expect(statusAt(rows, '12:00')).not.toBe('booked')
    expect(statusAt(rows, '12:30')).not.toBe('booked')
  })

  it('下單守門與畫面一致：午休時段 isSlotBookable = false', () => {
    const rows = [scheduleWithBreak(dowOf(D), '09:00', '18:00', '12:00', '13:00')]
    expect(isSlotBookable(base({ availRows: rows }), '12:00')).toBe(false)
    expect(isSlotBookable(base({ availRows: rows }), '13:00')).toBe(true)
  })
})

// ── 時區（2026-08-08 掃描發現的 bug 回歸測試）─────────────────
describe('todayInTaipei — 台北時區的今天', () => {
  it('回傳 YYYY-MM-DD 格式', () => {
    expect(todayInTaipei()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('★ 台灣凌晨時 UTC 還是昨天 → 必須回傳台灣的今天，不是 UTC 的', () => {
    // 台灣 2026-08-09 03:00 = UTC 2026-08-08 19:00
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-08T19:00:00Z'))
    expect(new Date().toISOString().split('T')[0]).toBe('2026-08-08')  // 舊寫法：錯的
    expect(todayInTaipei()).toBe('2026-08-09')                          // 新寫法：對的
    vi.useRealTimers()
  })

  it('台灣白天時兩者相同（所以這個 bug 只在凌晨 0–8 點出現，很難被發現）', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-08T06:00:00Z'))  // 台灣 14:00
    expect(todayInTaipei()).toBe('2026-08-08')
    vi.useRealTimers()
  })
})

describe('taipeiDate — 台北時區的日期加減（不受執行環境時區影響）', () => {
  it('offset 0 等於 todayInTaipei', () => {
    expect(taipeiDate(0)).toBe(todayInTaipei())
  })

  it('★ 台灣凌晨（UTC 還是昨天）→ 日曆第一格必須是台灣的今天', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-08T19:00:00Z'))   // 台灣 8/9 03:00
    expect(taipeiDate(0)).toBe('2026-08-09')
    expect(taipeiDate(1)).toBe('2026-08-10')
    expect(taipeiDate(-1)).toBe('2026-08-08')
    vi.useRealTimers()
  })

  it('跨月正確', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-31T04:00:00Z'))   // 台灣 8/31 12:00
    expect(taipeiDate(1)).toBe('2026-09-01')
    vi.useRealTimers()
  })

  it('跨年正確', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-12-31T04:00:00Z'))
    expect(taipeiDate(1)).toBe('2027-01-01')
    vi.useRealTimers()
  })

  it('taipeiDayOfWeek 與 DOW_NAMES 對得起來', () => {
    // 2026-08-09 是週日
    expect(DOW_NAMES[taipeiDayOfWeek('2026-08-09')]).toBe('Sunday')
    expect(DOW_NAMES[taipeiDayOfWeek('2026-08-10')]).toBe('Monday')
  })
})

// ── 固定梯次 slot_starts（2026-08-13，自由島潛水四梯制）─────────────
// availability 第 9 欄（index 8）；留空＝維持每 30 分一格
const scheduleWithSlots = (dow: string, start: string, end: string, slots: string): Row =>
  [PID, 'schedule', dow, start, end, 'true', '', '', slots]

describe('固定梯次（slot_starts）', () => {
  const FOUR = '08:00,10:00,13:00,15:00'

  it('留空＝維持預設，營業時段內每 30 分一格', () => {
    const s = computeAvailability(base({ availRows: [schedule(dowOf(D), '08:00', '17:00')] }))
    expect(s.length).toBe(18)
    expect(s.map(x => x.time)).toContain('09:30')
  })

  it('設了四梯 → 只回傳這四格，其餘時間不存在（不是 booked）', () => {
    const s = computeAvailability(base({ availRows: [scheduleWithSlots(dowOf(D), '08:00', '17:00', FOUR)] }))
    expect(s.map(x => x.time)).toEqual(['08:00', '10:00', '13:00', '15:00'])
    expect(s.every(x => x.status !== 'booked')).toBe(true)
  })

  it('非梯次時間下單被擋，梯次時間放行', () => {
    const input = base({ availRows: [scheduleWithSlots(dowOf(D), '08:00', '17:00', FOUR)] })
    expect(isSlotBookable(input, '09:30')).toBe(false)
    expect(isSlotBookable(input, '11:00')).toBe(false)
    expect(isSlotBookable(input, '10:00')).toBe(true)
  })

  it('120 分服務佔用跨到非梯次格，但下一梯仍可約', () => {
    const svc120 = [...SERVICES, service('svc120', 120)]
    const input = base({
      serviceId: 'svc120', serviceRows: svc120,
      bookingRows: [booking({ svc: 'svc120', date: D, time: '08:00' })],
      availRows: [scheduleWithSlots(dowOf(D), '08:00', '17:00', FOUR)],
    })
    const s = computeAvailability(input)
    // 08:00 佔到 09:30（08:00/08:30/09:00/09:30）→ 該梯已滿
    expect(s.find(x => x.time === '08:00')?.status).toBe('booked')
    // 10:00 起的 120 分不撞既有預約 → 仍可約
    expect(s.find(x => x.time === '10:00')?.status).not.toBe('booked')
    expect(isSlotBookable(input, '10:00')).toBe(true)
  })

  it('梯次起點超出營業時段 → 該梯不出現', () => {
    const s = computeAvailability(base({ availRows: [scheduleWithSlots(dowOf(D), '08:00', '14:00', FOUR)] }))
    expect(s.map(x => x.time)).toEqual(['08:00', '10:00', '13:00'])
  })

  it('公休日設了梯次仍全部 booked（休假優先）', () => {
    const s = computeAvailability(base({ availRows: [[PID, 'schedule', dowOf(D), '08:00', '17:00', 'false', '', '', FOUR]] }))
    expect(s.length).toBe(4)
    expect(s.every(x => x.status === 'booked')).toBe(true)
  })

  it('整天休假日設了梯次仍全部 booked', () => {
    const s = computeAvailability(base({
      availRows: [scheduleWithSlots(dowOf(D), '08:00', '17:00', FOUR), block(D)],
    }))
    expect(s.every(x => x.status === 'booked')).toBe(true)
  })

  it('容錯：格式雜亂（空白、單位數小時、空項）仍解析得出來', () => {
    const s = computeAvailability(base({ availRows: [scheduleWithSlots(dowOf(D), '08:00', '17:00', ' 8:00 , ,10:00,亂碼, 13:00 ')] }))
    expect(s.map(x => x.time)).toEqual(['08:00', '10:00', '13:00'])
  })

  it('全部是亂碼＝視同沒設，回到預設每 30 分一格', () => {
    const s = computeAvailability(base({ availRows: [scheduleWithSlots(dowOf(D), '08:00', '17:00', 'abc,,,')] }))
    expect(s.length).toBe(18)
  })
})
