import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

// 全部可選時段（固定排序，用 index 判斷相鄰）
export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
]

export type SlotStatus = 'available' | 'booked' | 'hot'

export type AvailabilityResponse = {
  slots: { time: string; status: SlotStatus }[]
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  const date = searchParams.get('date')
  const serviceId = searchParams.get('serviceId')

  if (!providerId || !date) {
    return NextResponse.json({ error: 'Missing providerId or date' }, { status: 400 })
  }

  const [bookingRows, serviceRows] = await Promise.all([
    getSheetData('bookings!A2:I'),
    getSheetData('services!A2:F'),
  ])

  // 找出這位設計師、這天的所有預約起始時間
  const todayBookings = bookingRows.filter(r => r[1] === providerId && r[5] === date)

  // 計算每個預約佔用的時段區間（考慮服務時長）
  const occupiedSlots = new Set<string>()

  for (const booking of todayBookings) {
    const bookedServiceId = booking[2]
    const startTime = booking[6]

    // 找服務時長（分鐘）
    const serviceRow = serviceRows.find(r => r[0] === providerId && r[1] === bookedServiceId)
    const duration = serviceRow ? Number(serviceRow[4]) : 30

    const startIdx = TIME_SLOTS.indexOf(startTime)
    if (startIdx === -1) continue

    // 佔用從 startTime 起、持續 duration 分鐘的所有時段
    const slotsNeeded = Math.ceil(duration / 30)
    for (let i = 0; i < slotsNeeded; i++) {
      if (startIdx + i < TIME_SLOTS.length) {
        occupiedSlots.add(TIME_SLOTS[startIdx + i])
      }
    }
  }

  // 如果客人選了服務，計算這個服務需要佔用幾格（用於判斷是否真的放得下）
  let serviceSlots = 1
  if (serviceId) {
    const serviceRow = serviceRows.find(r => r[0] === providerId && r[1] === serviceId)
    if (serviceRow) {
      serviceSlots = Math.ceil(Number(serviceRow[4]) / 30)
    }
  }

  // 建立時段狀態
  const slots: { time: string; status: SlotStatus }[] = TIME_SLOTS.map((time, idx) => {
    // 檢查從這個時段開始、持續 serviceSlots 格是否全都空閒
    const fitsHere = Array.from({ length: serviceSlots }, (_, i) => TIME_SLOTS[idx + i])
      .every(t => t !== undefined && !occupiedSlots.has(t))

    if (!fitsHere) {
      return { time, status: 'booked' }
    }

    // 緊湊策略：判斷此時段是否「緊貼」已有預約
    // 條件：這個時段開始前一格是佔用時段，OR 這個時段結束後一格是佔用時段
    const slotBefore = TIME_SLOTS[idx - 1]
    const slotAfter = TIME_SLOTS[idx + serviceSlots] // 服務結束後的下一格

    const adjacentToBefore = slotBefore !== undefined && occupiedSlots.has(slotBefore)
    const adjacentToAfter = slotAfter !== undefined && occupiedSlots.has(slotAfter)

    const isHot = adjacentToBefore || adjacentToAfter

    return { time, status: isHot ? 'hot' : 'available' }
  })

  return NextResponse.json({ slots } satisfies AvailabilityResponse)
}
