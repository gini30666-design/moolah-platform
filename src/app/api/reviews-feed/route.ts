import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

// 公開精選評價 — 給首頁評價牆 (#2)
// reviews schema: A=bookingId, B=providerId, C=customerName, D=rating, E=comment, F=status, G=createdAt
let cache: { at: number; data: object } | null = null
const TTL_MS = 10 * 60 * 1000

export async function GET() {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json(cache.data, {
      headers: { 'Cache-Control': 'public, max-age=600, s-maxage=600' },
    })
  }

  const [reviewRows, providerRows] = await Promise.all([
    getSheetData('reviews!A2:G'),
    getSheetData('providers!A2:G'),
  ])

  const items = reviewRows
    .filter(r => r[5] === 'published' && Number(r[3]) >= 4 && (r[4] ?? '').trim().length >= 6)
    .map(r => {
      const provider = providerRows.find(p => p[0] === r[1])
      const name = (r[2] as string) ?? '匿名'
      return {
        rating: Number(r[3]),
        comment: r[4] as string,
        customerName: name ? name.charAt(0) + '**' : '匿名',
        providerId: r[1] as string,
        providerName: (provider?.[1] as string) ?? '設計師',
        storeName: (provider?.[6] as string) ?? '',
        createdAt: r[6] as string,
      }
    })
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 9)

  const data = { items, count: items.length }
  cache = { at: Date.now(), data }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, max-age=600, s-maxage=600' },
  })
}
