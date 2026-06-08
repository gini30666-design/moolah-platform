import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { getSheetData } from '@/lib/sheets'

// GET /api/admin/access?providerId=X  （需帶 LIFF token）
// 回傳呼叫者對該 providerId 的存取狀態，供後台前端決定 gate
//   owner / unclaimed / forbidden / unauthorized / not_found
export async function GET(req: NextRequest) {
  const providerId = req.nextUrl.searchParams.get('providerId')
  if (!providerId) return NextResponse.json({ status: 'error' }, { status: 400 })

  const userId = await getAuthUserId(req)
  if (!userId) return NextResponse.json({ status: 'unauthorized' }, { status: 401 })

  const rows = await getSheetData('providers!A2:E')
  const match = rows.find(r => r[0] === providerId)
  if (!match) return NextResponse.json({ status: 'not_found' }, { status: 404 })

  const owner = (match[4] ?? '').trim()
  if (!owner) return NextResponse.json({ status: 'unclaimed' })
  if (owner === userId) return NextResponse.json({ status: 'owner' })
  return NextResponse.json({ status: 'forbidden' })
}
