import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
]

export type SlotStatus = 'available' | 'booked' | 'hot'
export type AvailabilityResponse = { slots: { time: string; status: SlotStatus }[] }

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  const date = searchParams.get('date')
  const serviceId = searchParams.get('serviceId')

  if (!providerId || !date) {
    return NextResponse.json({ error: 'Missing providerId or date' }, { status: 400 })
  }

  const [bookingRows, serviceRows, availRows] = await Promise.all([
    getSheetData('bookings!A2:I'),
    getSheetData('services!A2:F'),
    getSheetData('availability!A2:F'),
  ])

  // Load provider schedule from availability sheet
  const providerAvail = availRows.filter(r => r[0] === providerId && r[1])
  const blockRows = providerAvail.filter(r => r[1] === 'block')
  const scheduleRows = providerAvail.filter(r => r[1] === 'schedule')

  const allBooked: AvailabilityResponse = {
    slots: TIME_SLOTS.map(t => ({ time: t, status: 'booked' as SlotStatus })),
  }

  // Check if this date is explicitly blocked
  if (blockRows.some(r => r[2] === date)) return NextResponse.json(allBooked)

  // Check if the day of week is open (note: new Date('2026-05-11') is UTC midnight)
  const dayOfWeek = new Date(date + 'T12:00:00').getDay()
  const daySchedule = scheduleRows.find(r => r[2] === String(dayOfWeek))
  if (daySchedule && daySchedule[5] === 'FALSE') return NextResponse.json(allBooked)

  // Working hours for the day (default 09:00–19:00 if no schedule set)
  const startTime = daySchedule ? (daySchedule[3] || '09:00') : '09:00'
  const endTime   = daySchedule ? (daySchedule[4] || '19:00') : '19:00'
  const startMin  = timeToMinutes(startTime)
  const endMin    = timeToMinutes(endTime)

  // Existing bookings for this provider + date
  const todayBookings = bookingRows.filter(r => r[1] === providerId && r[5] === date)
  const occupiedSlots = new Set<string>()

  for (const booking of todayBookings) {
    const bookedServiceId = booking[2]
    const startSlotTime = booking[6]
    const serviceRow = serviceRows.find(r => r[0] === providerId && r[1] === bookedServiceId)
    const duration = serviceRow ? Number(serviceRow[4]) : 30
    const startIdx = TIME_SLOTS.indexOf(startSlotTime)
    if (startIdx === -1) continue
    const slotsNeeded = Math.ceil(duration / 30)
    for (let i = 0; i < slotsNeeded; i++) {
      if (startIdx + i < TIME_SLOTS.length) occupiedSlots.add(TIME_SLOTS[startIdx + i])
    }
  }

  let serviceSlots = 1
  if (serviceId) {
    const serviceRow = serviceRows.find(r => r[0] === providerId && r[1] === serviceId)
    if (serviceRow) serviceSlots = Math.ceil(Number(serviceRow[4]) / 30)
  }

  const slots: { time: string; status: SlotStatus }[] = TIME_SLOTS.map((time, idx) => {
    const slotMin = timeToMinutes(time)

    // Outside working hours → blocked
    if (slotMin < startMin || slotMin >= endMin) return { time, status: 'booked' }

    // Check if service fits starting here
    const fitsHere = Array.from({ length: serviceSlots }, (_, i) => TIME_SLOTS[idx + i])
      .every(t => t !== undefined && !occupiedSlots.has(t))
    if (!fitsHere) return { time, status: 'booked' }

    // Compact strategy: adjacent to existing booking = hot
    const slotBefore = TIME_SLOTS[idx - 1]
    const slotAfter  = TIME_SLOTS[idx + serviceSlots]
    const isHot = (slotBefore !== undefined && occupiedSlots.has(slotBefore)) ||
                  (slotAfter  !== undefined && occupiedSlots.has(slotAfter))

    return { time, status: isHot ? 'hot' : 'available' }
  })

  return NextResponse.json({ slots } satisfies AvailabilityResponse)
}
