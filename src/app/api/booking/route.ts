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
    getSheetData('providers!A2:X'),
    getSheetData('services!A2:F'),
  ])

  const providerRow = providerRows.find(r => r[0] === providerId)
  const serviceRow = serviceRows.find(r => r[0] === providerId && r[1] === serviceId)

  if (!providerRow || !serviceRow) {
    return NextResponse.json({ error: 'Provider or service not found' }, { status: 404 })
  }

  // 方案限制：trial=14 天 + 20 筆上限；expired=已暫停。active / 舊資料(空)=不限。
  // V(21)=plan、X(23)=trialEndsAt。對客人一律回中性訊息，不暴露試用機制。
  const TRIAL_BOOKING_LIMIT = 20
  const plan = (providerRow[21] ?? '').toString().trim().toLowerCase()
  if (plan === 'trial' || plan === 'expired') {
    const trialEndsAt = providerRow[23]
    const isExpired = plan === 'expired' || (trialEndsAt && Date.now() > new Date(trialEndsAt).getTime())
    if (isExpired) {
      return NextResponse.json({ error: 'unavailable', message: '此設計師暫不開放線上預約，請稍後再試或直接聯繫店家。' }, { status: 403 })
    }
    const allBookings = await getSheetData('bookings!A2:M')
    const used = allBookings.filter(r => r[1] === providerId && r[12] !== 'cancelled').length
    if (used >= TRIAL_BOOKING_LIMIT) {
      return NextResponse.json({ error: 'unavailable', message: '此設計師暫不開放線上預約，請稍後再試或直接聯繫店家。' }, { status: 403 })
    }
  }

  // 黑名單檢查（#19）— 比對 LINE userId 或姓名
  try {
    const blacklistRows = await getSheetData('blacklist!A2:E')
    const norm = (s: string) => (s ?? '').replace(/\s+/g, '').toLowerCase()
    const isBlocked = blacklistRows.some(r => {
      if (r[0] !== providerId) return false
      const matchById = customerLineUserId && r[1] && r[1] === customerLineUserId
      const matchByName = customerName && r[2] && norm(r[2] as string) === norm(customerName)
      return matchById || matchByName
    })
    if (isBlocked) {
      return NextResponse.json({ error: 'Booking not allowed', message: '此設計師目前無法接受您的預約，請改選其他設計師。' }, { status: 403 })
    }
  } catch {
    // blacklist sheet 可能尚未建立，不擋預約
  }

  const bookingId = generateId()
  const createdAt = new Date().toISOString()

  await appendRow('bookings!A:M', [
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
    'confirmed',
  ], 'RAW') // RAW：避免 Sheets 把 "09:00" 解析成時間而改成 "9:00"（會害 availability 找不到時段）

  const providerName = providerRow[1]
  const providerLineUserId = providerRow[4]
  const serviceName = serviceRow[2]
  const servicePrice = serviceRow[3]

  let consumerNotified = false
  try {
    const providerMsg = pushMessage(
      providerLineUserId,
      `📋 新預約通知\n\n客戶：${customerName}${customerPhone ? `（${customerPhone}）` : ''}\n服務：${serviceName}\n日期：${date} ${time}\n\n請至後台確認詳情。`
    )
    const consumerMsg = customerLineUserId
      ? pushMessage(
          customerLineUserId,
          `✅ 預約確認！\n\n設計師：${providerName}\n服務：${serviceName}\n日期：${date} ${time}\n金額：NT$ ${Number(servicePrice).toLocaleString()}\n\n預約編號：${bookingId}\n\n若需取消或查詢，請至 MooLah 我的預約。`
        )
      : Promise.resolve(false)

    const [, notified] = await Promise.all([providerMsg, consumerMsg])
    consumerNotified = notified
  } catch (e) {
    console.error('[booking] notification error (booking still saved):', e)
  }

  return NextResponse.json({ success: true, bookingId, consumerNotified })
}
