import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'
import { pushMessage } from '@/lib/line'

function generateId() {
  return `BK${Date.now()}`
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { providerId, serviceId, customerName, customerLineUserId, customerPhone, date, time, note, gender, hairLength } = body

  if (!providerId || !serviceId || !customerName || !date || !time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const [providerRows, serviceRows] = await Promise.all([
    getSheetData('providers!A2:L'),
    getSheetData('services!A2:F'),
  ])

  const providerRow = providerRows.find(r => r[0] === providerId)
  const serviceRow = serviceRows.find(r => r[0] === providerId && r[1] === serviceId)

  if (!providerRow || !serviceRow) {
    return NextResponse.json({ error: 'Provider or service not found' }, { status: 404 })
  }

  const bookingId = generateId()
  const createdAt = new Date().toISOString()

  await appendRow('bookings!A:L', [
    bookingId,
    providerId,
    serviceId,
    customerName,
    customerLineUserId ?? '',
    date,
    time,
    note ?? '',
    createdAt,
    gender ?? '',
    hairLength ?? '',
    customerPhone ?? '',
  ])

  const providerName = providerRow[1]
  const providerLineUserId = providerRow[4]
  const serviceName = serviceRow[2]
  const servicePrice = serviceRow[3]

  const notifications: Promise<unknown>[] = [
    pushMessage(
      providerLineUserId,
      `📋 新預約通知\n\n客戶：${customerName}${customerPhone ? `（${customerPhone}）` : ''}\n服務：${serviceName}\n日期：${date} ${time}\n\n請至後台確認詳情。`
    ),
  ]
  if (customerLineUserId) {
    notifications.push(
      pushMessage(
        customerLineUserId,
        `✅ 預約確認！\n\n設計師：${providerName}\n服務：${serviceName}\n日期：${date} ${time}\n金額：NT$ ${Number(servicePrice).toLocaleString()}\n\n預約編號：${bookingId}`
      )
    )
  }
  await Promise.all(notifications)

  return NextResponse.json({ success: true, bookingId })
}
