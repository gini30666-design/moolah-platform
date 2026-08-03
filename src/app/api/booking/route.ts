import { NextRequest, NextResponse } from 'next/server'
import { isSameCustomer } from '@/lib/customerIdentity'
import { getSheetData, appendRow } from '@/lib/sheets'
import { isSlotBookable } from '@/lib/slots'
import { pushFlexMessage, consumerBookingFlex, providerBookingFlex } from '@/lib/line'
import { rateLimit, clientIp } from '@/lib/rateLimit'

function generateId() {
  return `BK${Date.now()}`
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`booking:${clientIp(req)}`, 8, 60_000)) {
    return NextResponse.json({ error: 'rate_limited', message: '操作太頻繁，請稍後再試。' }, { status: 429 })
  }
  const body = await req.json()
  const { providerId, serviceId, customerName, customerLineUserId, customerPhone, date, time, note, gender, hairLength } = body

  if (!providerId || !serviceId || !customerName || !date || !time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const [providerRows, serviceRows] = await Promise.all([
    getSheetData('providers!A2:Y'),
    getSheetData('services!A2:F'),
  ])

  const providerRow = providerRows.find(r => r[0] === providerId)
  const serviceRow = serviceRows.find(r => r[0] === providerId && r[1] === serviceId)

  if (!providerRow || !serviceRow) {
    return NextResponse.json({ error: 'Provider or service not found' }, { status: 404 })
  }

  // ── 示範帳號 ──────────────────────────────────────────────
  // designer-003 是公開 demo（/pro 的「自己先看看」指向它），任何人都進得來。
  // 2026-07-31~08-01 連續有陌生訪客以假名假電話下真單，佔用時段。
  // 這裡在寫入前攔下：讓對方完整走完流程、看到成功畫面，但不寫進資料庫。
  // 比直接擋掉更好——demo 的目的就是展示，順手把體驗完的人導向招商頁。
  if (String(providerRow[24] ?? '').toLowerCase() === 'true') {
    return NextResponse.json({
      demo: true,
      message: '這是 MooLah 的示範帳號，你剛剛完整體驗了客人預約的流程。實際使用時，這筆預約會直接進到設計師的後台，並自動發送 LINE 確認與提醒。',
    })
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
    const allBookings = await getSheetData('bookings!A2:M', { provider_id: providerId })
    const used = allBookings.filter(r => r[1] === providerId && r[12] !== 'cancelled').length
    if (used >= TRIAL_BOOKING_LIMIT) {
      return NextResponse.json({ error: 'unavailable', message: '此設計師暫不開放線上預約，請稍後再試或直接聯繫店家。' }, { status: 403 })
    }
  }

  // ── 一律要求 LINE 身分 ─────────────────────────────────────
  // 2026-08-01 起關閉「不加 LINE 也能預約」。三個理由：
  //  1) 產品面：cron/reminder 對沒有 lineUserId 的預約直接 continue——
  //     「前一天自動提醒」是賣點，沒有 LINE ID 等於賣了卻交付不了。
  //  2) 營運面：無法識別、無法封鎖、無法留客戶備註（見 lib/customerIdentity）。
  //  3) 安全面：7/31–8/1 連續出現陌生人以假名假電話下單，OA 好友數卻沒增加。
  // ⚠️ 例外：demo 帳號在上面已先回傳；設計師手動建單走 /api/admin/manual-booking，不經過這裡。
  if (!customerLineUserId) {
    return NextResponse.json({
      error: 'line_required',
      message: '請用 LINE 開啟預約頁，才能收到預約確認與提醒。',
    }, { status: 403 })
  }

  // 黑名單檢查（#19）— LINE userId ／【電話】／姓名
  // ⚠️ 電話是 2026-08-01 補上的：web 訪客沒有 LINE ID，原本只能靠姓名比對，
  //    改個名字就能繞過（實例：「開看看 / 0985555555」）。電話才是可靠的識別碼。
  try {
    const blacklistRows = await getSheetData('blacklist!A2:G')
    const isBlocked = blacklistRows.some(r => {
      if (r[0] !== providerId) return false
      return isSameCustomer(
        { lineUserId: customerLineUserId, name: customerName, phone: customerPhone },
        { lineUserId: r[1] as string, name: r[2] as string, phone: r[6] as string },
      )
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
      getSheetData('availability!A2:F', { provider_id: providerId }),
      getSheetData('bookings!A2:M', { provider_id: providerId }),
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

  try {
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
  } catch (e) {
    // over-booking 最後防線：DB 唯一約束（uniq_active_booking）擋下同時段第二筆。
    // 轉成友善 409（原本會直接 throw → 使用者收 500）。
    const msg = e instanceof Error ? e.message : String(e)
    if (/duplicate key|uniq_active_booking|23505/i.test(msg)) {
      return NextResponse.json(
        { error: 'slot_unavailable', message: '此時段剛被預約，請改選其他時段。' },
        { status: 409 },
      )
    }
    throw e
  }

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
