import { describe, it, expect } from 'vitest'
import {
  padTime, timeToMinutes, computeOccupiedSlots, computeAvailability, isSlotBookable,
  DOW_NAMES, type Row,
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
  it('營業時段外的格 → booked（10:00–12:00 營業）', () => {
    const slots = computeAvailability(base({ availRows: [schedule(dowOf(D), '10:00', '12:00')] }))
    expect(slots.find(s => s.time === '09:00')!.status).toBe('booked') // 開門前
    expect(slots.find(s => s.time === '10:00')!.status).toBe('available')
    expect(slots.find(s => s.time === '13:00')!.status).toBe('booked') // 打烊後
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
