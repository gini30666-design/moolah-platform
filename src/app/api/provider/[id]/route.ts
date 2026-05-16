import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [providerRows, serviceRows, portfolioRows] = await Promise.all([
    getSheetData('providers!A2:N'),
    getSheetData('services!A2:F'),
    getSheetData('portfolio!A2:D'),
  ])

  const r = providerRows.find(row => row[0] === id)
  if (!r) return NextResponse.json({ error: 'Provider not found' }, { status: 404 })

  const provider = {
    id: r[0],
    name: r[1],
    category: r[2],
    description: r[3],
    lineUserId: r[4],
    avatarUrl: r[5] ?? '',
    storeName: r[6] ?? '',
    address: r[7] ?? '',
    district: r[8] ?? '',
    businessHours: r[9] ?? '',
    phone: r[10] ?? '',
    instagram: r[11] ?? '',
    shortCode: r[12] ?? '',
    coverUrl:  r[13] ?? '',
  }

  const services = serviceRows
    .filter(row => row[0] === id)
    .map(row => ({
      id: row[1],
      name: row[2],
      price: Number(row[3]),
      duration: Number(row[4]),
      description: row[5] ?? '',
    }))

  const portfolio = portfolioRows
    .filter(row => row[0] === id)
    .map(row => ({ id: row[1], imageUrl: row[2], caption: row[3] ?? '' }))

  return NextResponse.json({ provider, services, portfolio })
}
