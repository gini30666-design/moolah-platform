import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

// GET /api/dashboard/me?userId=Uxxxx
// 用 lineUserId 反查對應的 providerId
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 })

  const rows = await getSheetData('providers!A:E')
  // headers: id, name, category, description, lineUserId
  const match = rows.slice(1).find(r => r[4] === userId)

  if (!match) return NextResponse.json({ found: false }, { status: 200 })

  return NextResponse.json({
    found: true,
    providerId: match[0],
    name: match[1],
    category: match[2],
  })
}
