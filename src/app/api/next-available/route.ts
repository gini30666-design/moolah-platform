import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

const TIME_SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30',
]

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

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
    getSheetData('bookings!A2:M'),
    getSheetData('services!A2:F'),
    getSheetData('availability!A2:F'),
  ])

  const providerAvail = availRows.filter(r => r[0] === providerId)
  const blockRows     = providerAvail.filter(r => r[1] === 'block')
  const scheduleRows  = providerAvail.filter(r => r[1] === 'schedule')

  const serviceRow = serviceRows.find(r => r[0] === providerId && r[1] === serviceId)
  const serviceSlots = serviceRow ? Math.ceil(Number(serviceRow[4]) / 30) : 1

  const today = new Date(); today.setHours(0,0,0,0)

  for (let offset = 1; offset <= 30; offset++) {
    const d = new Date(today); d.setDate(d.getDate() + offset)
    const dateStr = d.toISOString().split('T')[0]

    if (blockRows.some(r => r[2] === dateStr)) continue

    const dow = d.getDay()
    const DOW_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    const daySched = scheduleRows.find(r => r[2] === DOW_NAMES[dow])
    if (daySched && daySched[5]?.toLowerCase() === 'false') continue

    const startMin = timeToMinutes(daySched ? (daySched[3] || '09:00') : '09:00')
    const endMin   = timeToMinutes(daySched ? (daySched[4] || '19:00') : '19:00')

    const dayBookings = bookingRows.filter(r => r[1] === providerId && r[5] === dateStr && (r[12] ?? '') !== 'cancelled')
    const occupied = new Set<string>()
    const padTime = (t: string) => {
      const m = String(t ?? '').match(/^(\d{1,2}):(\d{2})$/)
      return m ? `${m[1].padStart(2, '0')}:${m[2]}` : String(t ?? '')
    }
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
      if (slotMin < startMin || slotMin >= endMin) continue
      const fits = Array.from({ length: serviceSlots }, (_, k) => TIME_SLOTS[i + k])
        .every(t => t !== undefined && !occupied.has(t))
      if (fits) {
        return NextResponse.json({ date: dateStr, time: TIME_SLOTS[i], label: dateLabel(dateStr) })
      }
    }
  }

  return NextResponse.json({ date: null, time: null, label: null })
}
