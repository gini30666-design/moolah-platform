import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'
import { pushFlexMessage, consumerBookingFlex, providerBookingFlex } from '@/lib/line'

function generateId() {
  return `BK${Date.now()}`
}

// 與 availability route 一致的時段表（含午休斷點）
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
]
const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
// "9:00" → "09:00"（相容歷史去前導零資料）
function padTime(t: unknown): string {
  const m = String(t ?? '').match(/^(\d{1,2}):(\d{2})$/)
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : String(t ?? '')
}
function toMinutes(t: string): number {
  const [h, m] = padTime(t).split(':').map(Number)
  return h * 60 + (m || 0)
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
  // DB 唯一約束只擋「完全同 provider+date+time」。以下補上：休假日 / 該weekday公休 /
  // 非營業時段 / 服務時長跨格重疊（例：60分服務佔 09:00+09:30，別人不能再訂 09:30）。
  const reqTime = padTime(time)
  const reqDuration = Number(serviceRow[4]) || 30
  const reqSlots = Math.ceil(reqDuration / 30)
  const SLOT_TAKEN = { error: 'slot_unavailable', message: '此時段剛被預約或不可預約，請改選其他時段。' }
  try {
    const [availRows, dayBookingRows] = await Promise.all([
      getSheetData('availability!A2:F'),
      getSheetData('bookings!A2:M'),
    ])
    const provAvail = availRows.filter(r => r[0] === providerId)

    // 1) 整天休假（block）
    if (provAvail.some(r => r[1] === 'block' && r[2] === date)) {
      return NextResponse.json(SLOT_TAKEN, { status: 409 })
    }
    // 2) 該 weekday 公休 + 營業時段
    const dow = new Date(date + 'T12:00:00').getDay()
    const daySched = provAvail.find(r => r[1] === 'schedule' && r[2] === DOW_NAMES[dow])
    if (daySched && (daySched[5] ?? '').toLowerCase() === 'false') {
      return NextResponse.json(SLOT_TAKEN, { status: 409 })
    }
    const startMin = toMinutes(daySched ? (daySched[3] || '09:00') : '09:00')
    const endMin = toMinutes(daySched ? (daySched[4] || '19:00') : '19:00')
    const reqMin = toMinutes(reqTime)
    // 3) 起始在營業時段內，且整段服務做完不超過打烊
    if (reqMin < startMin || reqMin + reqDuration > endMin) {
      return NextResponse.json(SLOT_TAKEN, { status: 409 })
    }
    // 4) 服務時長跨格重疊（DB 唯一約束擋不到）
    const occupied = new Set<string>()
    for (const b of dayBookingRows) {
      if (b[1] !== providerId || b[5] !== date || (b[12] ?? '') === 'cancelled') continue
      const bIdx = TIME_SLOTS.indexOf(padTime(b[6]))
      if (bIdx === -1) continue
      const bSvc = serviceRows.find(r => r[0] === providerId && r[1] === b[2])
      const bSlots = Math.ceil((bSvc ? Number(bSvc[4]) : 30) / 30)
      for (let i = 0; i < bSlots; i++) if (TIME_SLOTS[bIdx + i]) occupied.add(TIME_SLOTS[bIdx + i])
    }
    const reqIdx = TIME_SLOTS.indexOf(reqTime)
    const reqCells = reqIdx === -1 ? [reqTime] : Array.from({ length: reqSlots }, (_, i) => TIME_SLOTS[reqIdx + i])
    if (reqCells.some(t => t === undefined || occupied.has(t))) {
      return NextResponse.json(SLOT_TAKEN, { status: 409 })
    }
  } catch (e) {
    console.error('[booking] slot revalidation error:', e)
    // 驗證流程本身出錯不應誤擋（DB 唯一約束仍是最後防線）→ 放行
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
