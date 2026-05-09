import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') ?? ''
  const district = searchParams.get('district') ?? ''

  if (!category || !district) {
    return NextResponse.json({ providers: [] })
  }

  const rows = await getSheetData('providers!A2:M')

  const providers = rows
    .filter(r => {
      const cat = r[2] ?? ''
      const dist = r[8] ?? ''
      return cat === category && dist.includes(district)
    })
    .map(r => ({
      id: r[0] ?? '',
      name: r[1] ?? '',
      category: r[2] ?? '',
      avatarUrl: r[5] ?? '',
      storeName: r[6] ?? '',
      address: r[7] ?? '',
      district: r[8] ?? '',
      shortCode: r[12] ?? '',
    }))

  return NextResponse.json({ providers })
}
