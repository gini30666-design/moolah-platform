import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'
import { verifyOwner } from '@/lib/auth'
import { isSlotBookable } from '@/lib/slots'

function generateId() {
  return `MN${Date.now()}`
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { providerId, serviceId, customerName, customerPhone, date, time, note } = body

  if (!providerId || !serviceId || !date || !time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  // ── 時段重驗（2026-08-16 補）──────────────────────────────────
  // 在此之前手動建單完全沒有任何時段檢查，職人可以直接建到
  // 客人已經約走的時段 —— 兩個人同時出現在店裡。
  // 與線上預約共用 computeAvailability，判斷標準完全一致。
  let conflict = false
  try {
    const [availRows, dayBookingRows, serviceRows] = await Promise.all([
      getSheetData('availability!A2:I', { provider_id: providerId }),
      getSheetData('bookings!A2:M', { provider_id: providerId }),
      getSheetData('services!A2:F', { provider_id: providerId }),
    ])
    conflict = !isSlotBookable(
      { providerId, date, serviceId, bookingRows: dayBookingRows, serviceRows, availRows },
      time,
    )
  } catch (e) {
    // 重驗自身出錯不誤擋職人（他人就在現場、比系統更清楚狀況），但要留下紀錄
    console.error('[manual-booking] slot revalidation error:', e)
  }
  if (conflict) {
    return NextResponse.json(
      { error: 'slot_taken', message: '這個時段已經有預約或不在營業時段內，請確認後再試。' },
      { status: 409 },
    )
  }

  const createdAt = new Date().toISOString()
  const bookingId = generateId()

  // bookings 欄位順序見 sheets.ts TABLE_COLS：
  // A id / B providerId / C serviceId / D customerName / E lineUserId
  // F date / G time / H note / I createdAt / J gender / K hairLength
  // L customerPhone / M status
  //
  // 🔴 status 一定要寫 'confirmed'，不可留空。
  //    DB 唯一約束是 partial index：`where status <> 'cancelled'`。
  //    SQL 三值邏輯下 `NULL <> 'cancelled'` 回傳 UNKNOWN 而非 TRUE，
  //    所以 status 為 NULL 的列**不會進入索引** = 完全不受 over-booking 保護。
  //    2026-08-16 實測確認：兩筆 status=NULL 的同時段單都能寫入；
  //    改成 'confirmed' 後第二筆才被資料庫擋下。
  try {
    await appendRow('bookings!A:M', [
      bookingId,
      providerId,
      serviceId,
      customerName || '現場預約',
      'MANUAL',
      date,
      time,
      note ?? '',
      createdAt,
      '',
      '',
      customerPhone ?? '',
      'confirmed',
    ], 'RAW')  // RAW：避免 "09:00" 被解析成時間值（同 /api/booking）
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/duplicate key|uniq_active_booking|23505/i.test(msg)) {
      return NextResponse.json(
        { error: 'slot_taken', message: '這個時段剛剛已經被預約了，請改選其他時段。' },
        { status: 409 },
      )
    }
    throw e
  }

  return NextResponse.json({ ok: true, bookingId })
}
