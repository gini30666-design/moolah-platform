import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

// GET /api/dashboard/me?userId=Uxxxx
// 用 lineUserId 反查對應的 providerId
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 })

  // 欄位: id(0), name(1), category(2), description(3), lineUserId(4)
  // 註：Supabase cutover 後 getSheetData 只回資料列、無 header，故不再 slice(1)
  const rows = await getSheetData('providers!A2:E')
  const match = rows.find(r => r[4] === userId)

  if (!match) return NextResponse.json({ found: false }, { status: 200 })

  return NextResponse.json({
    found: true,
    providerId: match[0],
    name: match[1],
    category: match[2],
  })
}
