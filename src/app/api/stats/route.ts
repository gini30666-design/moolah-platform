import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

// 公開統計 — 給首頁信任條用 (#1)
// 簡單 in-memory cache 5 分鐘，避免 Sheets API 過度被呼叫
let cache: { at: number; data: { customers: number; providers: number; portfolio: number; bookings: number } } | null = null
const TTL_MS = 5 * 60 * 1000

export async function GET() {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json(cache.data, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    })
  }

  const [providerRows, bookingRows, portfolioRows] = await Promise.all([
    getSheetData('providers!A2:A'),
    getSheetData('bookings!A2:M'),
    getSheetData('portfolio!A2:A'),
  ])

  // 累計成交客人 = 不重複 customerLineUserId + 不同姓名 (rough estimate)
  const customerKeys = new Set<string>()
  let totalBookings = 0
  for (const r of bookingRows) {
    if ((r[12] ?? '') === 'cancelled') continue
    totalBookings++
    const key = (r[4] as string) || `${r[1]}::${r[3]}`  // userId 或 providerId+name
    if (key) customerKeys.add(key)
  }

  const data = {
    customers: customerKeys.size,
    providers: providerRows.filter(r => r[0]).length,
    portfolio: portfolioRows.filter(r => r[0]).length,
    bookings: totalBookings,
  }

  cache = { at: Date.now(), data }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
  })
}
