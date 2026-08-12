import { NextRequest, NextResponse } from 'next/server'
// ⚠️ 時段表一律 import，不要在這裡自己複製一份。
//    2026-08-12 前這支有自己的副本，且停在「沒有 12:00/12:30」的舊版
//    （8/06 午休改成可自訂時漏改），導致中午不休息的職人永遠不會被推薦到 12:00。
import { TIME_SLOTS, timeToMinutes, padTime, taipeiDate, taipeiDayOfWeek } from '@/lib/slots'
import { getSheetData } from '@/lib/sheets'

function dateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  const DOW = ['日','一','二','三','四','五','六']
  return `${d.getMonth()+1}/${d.getDate()}（周${DOW[d.getDay()]}）`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  const serviceId  = searchParams.get('serviceId') ?? ''
  if (!providerId) return NextResponse.json({ error: 'Missing providerId' }, { status: 400 })

  const [bookingRows, serviceRows, availRows] = await Promise.all([
    getSheetData('bookings!A2:M', { provider_id: providerId }),
    getSheetData('services!A2:F', { provider_id: providerId }),
    getSheetData('availability!A2:H', { provider_id: providerId }),
  ])

  const providerAvail = availRows.filter(r => r[0] === providerId)
  const blockRows     = providerAvail.filter(r => r[1] === 'block')
  const scheduleRows  = providerAvail.filter(r => r[1] === 'schedule')

  const serviceRow = serviceRows.find(r => r[0] === providerId && r[1] === serviceId)
  const serviceSlots = serviceRow ? Math.ceil(Number(serviceRow[4]) / 30) : 1

  for (let offset = 1; offset <= 30; offset++) {
    // 台北時區（理由同 /api/calendar）
    const dateStr = taipeiDate(offset)

    if (blockRows.some(r => r[2] === dateStr)) continue

    const dow = taipeiDayOfWeek(dateStr)
    const DOW_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    const daySched = scheduleRows.find(r => r[2] === DOW_NAMES[dow])
    if (daySched && daySched[5]?.toLowerCase() === 'false') continue

    const startMin = timeToMinutes(daySched ? (daySched[3] || '09:00') : '09:00')
    const rawEnd   = daySched ? (daySched[4] || '19:00') : '19:00'
    const endMin   = padTime(rawEnd) === '00:00' ? 1440 : timeToMinutes(rawEnd)
    const withinHours = (min: number) => min >= startMin && min < endMin

    const dayBookings = bookingRows.filter(r => r[1] === providerId && r[5] === dateStr && (r[12] ?? '') !== 'cancelled')
    const occupied = new Set<string>()
    for (const b of dayBookings) {
      const svc = serviceRows.find(r => r[0] === providerId && r[1] === b[2])
      const dur = svc ? Math.ceil(Number(svc[4]) / 30) : 1
      const startIdx = TIME_SLOTS.indexOf(padTime(b[6]))
      if (startIdx === -1) continue
      for (let i = 0; i < dur; i++) {
        if (TIME_SLOTS[startIdx + i]) occupied.add(TIME_SLOTS[startIdx + i])
      }
    }

    for (let i = 0; i < TIME_SLOTS.length; i++) {
      const slotMin = timeToMinutes(TIME_SLOTS[i])
      if (!withinHours(slotMin)) continue
      // 整段服務都必須落在營業時間內，不能推薦一個會做到打烊後的起點
      const fits = Array.from({ length: serviceSlots }, (_, k) => TIME_SLOTS[i + k])
        .every(t => t !== undefined && withinHours(timeToMinutes(t)) && !occupied.has(t))
      if (fits) {
        return NextResponse.json({ date: dateStr, time: TIME_SLOTS[i], label: dateLabel(dateStr) })
      }
    }
  }

  return NextResponse.json({ date: null, time: null, label: null })
}
