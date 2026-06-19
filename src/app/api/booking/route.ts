import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'
import { isSlotBookable } from '@/lib/slots'
import { pushFlexMessage, consumerBookingFlex, providerBookingFlex } from '@/lib/line'

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

  // ── 伺服器端時段重驗（防繞過 UI / race）────────────────────────────
  // 與 availability 顯示端共用 computeAvailability：該時段在畫面上「可約」才放行。
  // 涵蓋休假日 / weekday 公休 / 非營業時段 / 服務時長跨格重疊（DB 唯一約束只擋完全同時段）。
  // DB 唯一約束仍為最後防線；重驗自身出錯則放行不誤擋。
  try {
    const [availRows, dayBookingRows] = await Promise.all([
      getSheetData('availability!A2:F'),
      getSheetData('bookings!A2:M'),
    ])
    const bookable = isSlotBookable(
      { providerId, date, serviceId, bookingRows: dayBookingRows, serviceRows, availRows },
      time,
    )
    if (!bookable) {
      return NextResponse.json(
        { error: 'slot_unavailable', message: '此時段剛被預約或不可預約，請改選其他時段。' },
        { status: 409 },
      )
    }
  } catch (e) {
    console.error('[booking] slot revalidation error:', e)
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
  const storeName = providerRow[6] || providerName
  const serviceName = serviceRow[2]

  // LIFF 連結（透過 /dashboard endpoint 的 ?to= 轉址）
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID
  const viewUrl = `https://liff.line.me/${liffId}?to=${encodeURIComponent('/my-bookings')}`
  const adminUrl = `https://liff.line.me/${liffId}?to=${encodeURIComponent(`/${providerId}/admin`)}`

  let consumerNotified = false
  try {
    const providerMsg = pushFlexMessage(
      providerLineUserId, '📋 新預約',
      providerBookingFlex({ customerName, customerPhone: customerPhone ?? '', serviceName, date, time, adminUrl })
    )
    const consumerMsg = customerLineUserId
      ? pushFlexMessage(
          customerLineUserId, '🎉 預約成功',
          consumerBookingFlex({ bookingId, serviceName, storeName, date, time, viewUrl })
        )
      : Promise.resolve(false)

    const [, notified] = await Promise.all([providerMsg, consumerMsg])
    consumerNotified = notified
  } catch (e) {
    console.error('[booking] notification error (booking still saved):', e)
  }

  return NextResponse.json({ success: true, bookingId, consumerNotified })
}
