import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'
import { sb } from '@/lib/supabase'
import { rateLimit, clientIp } from '@/lib/rateLimit'

// GET /api/review?providerId=xxx  → 取得設計師評分摘要
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  if (!providerId) return NextResponse.json({ error: 'Missing providerId' }, { status: 400 })

  const rows = await getSheetData('reviews!A2:G')
  const filtered = rows.filter(r => r[1] === providerId && r[5] === 'published')

  if (filtered.length === 0) {
    return NextResponse.json({ count: 0, average: 0, reviews: [] })
  }

  const total = filtered.reduce((sum, r) => sum + Number(r[3] ?? 0), 0)
  const average = Math.round((total / filtered.length) * 10) / 10

  const reviews = filtered.slice(-5).reverse().map(r => ({
    id: r[0],
    customerName: r[2] ? r[2].charAt(0) + '**' : '匿名',
    rating: Number(r[3]),
    comment: r[4] ?? '',
    createdAt: r[6] ?? '',
  }))

  return NextResponse.json({ count: filtered.length, average, reviews })
}

// POST /api/review  → 顧客送出評分（進「待審」，不自動公開）
export async function POST(req: NextRequest) {
  if (!rateLimit(`review:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: 'rate_limited', message: '操作太頻繁，請稍後再試。' }, { status: 429 })
  }
  const body = await req.json()
  const { bookingId, providerId, customerName, rating, comment } = body

  const ratingNum = Number(rating)
  if (!bookingId || !providerId || !Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: 'Invalid fields' }, { status: 400 })
  }

  // 驗證 bookingId 屬實且屬於該設計師（PK 查詢；擋掉用亂數 bookingId 灌評價）
  const { data: bk } = await sb
    .from('bookings')
    .select('provider_id')
    .eq('booking_id', bookingId)
    .maybeSingle()
  if (!bk || bk.provider_id !== providerId) {
    return NextResponse.json({ error: 'Invalid booking' }, { status: 400 })
  }

  // 防止重複評價
  const existing = await getSheetData('reviews!A2:B')
  if (existing.some(r => r[0] === bookingId)) {
    return NextResponse.json({ error: 'Already reviewed' }, { status: 409 })
  }

  const createdAt = new Date().toISOString()

  // status='pending'：客戶投稿一律進待審佇列，永不自動公開。
  // 公開的評價牆（reviews-feed 只顯示 'published'）與職人分數（providers.rating）
  // 皆由公司統一策展 → 保護合作設計師，不受客戶評分/惡意投稿影響。
  await appendRow('reviews!A:G', [
    bookingId,
    providerId,
    customerName ?? '',
    String(ratingNum),
    comment ?? '',
    'pending',
    createdAt,
  ])

  return NextResponse.json({ success: true })
}
