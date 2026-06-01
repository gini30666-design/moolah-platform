import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

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

// POST /api/review  → 顧客送出評分
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { bookingId, providerId, customerLineUserId, customerName, rating, comment } = body

  if (!bookingId || !providerId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid fields' }, { status: 400 })
  }

  // 防止重複評價
  const existing = await getSheetData('reviews!A2:B')
  if (existing.some(r => r[0] === bookingId)) {
    return NextResponse.json({ error: 'Already reviewed' }, { status: 409 })
  }

  const createdAt = new Date().toISOString()

  await appendRow('reviews!A:G', [
    bookingId,
    providerId,
    customerName ?? '',
    String(rating),
    comment ?? '',
    'published',
    createdAt,
  ])

  return NextResponse.json({ success: true, reviewId })
}
