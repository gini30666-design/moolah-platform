import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [providerRows, serviceRows, portfolioRows] = await Promise.all([
    getSheetData('providers!A2:F'),
    getSheetData('services!A2:F'),
    getSheetData('portfolio!A2:D'),
  ])

  const providerRow = providerRows.find(r => r[0] === id)
  if (!providerRow) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
  }

  const provider = {
    id: providerRow[0],
    name: providerRow[1],
    category: providerRow[2],
    description: providerRow[3],
    lineUserId: providerRow[4],
    avatarUrl: providerRow[5] ?? '',
  }

  const services = serviceRows
    .filter(r => r[0] === id)
    .map(r => ({
      id: r[1],
      name: r[2],
      price: Number(r[3]),
      duration: Number(r[4]),
      description: r[5] ?? '',
    }))

  const portfolio = portfolioRows
    .filter(r => r[0] === id)
    .map(r => ({
      id: r[1],
      imageUrl: r[2],
      caption: r[3] ?? '',
    }))

  return NextResponse.json({ provider, services, portfolio })
}
