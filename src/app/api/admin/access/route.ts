import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId, resolveAccessRole } from '@/lib/auth'
import { getSheetData } from '@/lib/sheets'

// GET /api/admin/access?providerId=X  （需帶 LIFF token）
// 回傳呼叫者對該 providerId 的存取狀態，供後台前端決定 gate
//   owner / member / unclaimed / forbidden / unauthorized / not_found
//
// ⚠️ 這支只決定「畫面顯示什麼」，不是授權。真正的授權在每支 admin API 的 verifyAccess，
//    前端藏起來的按鈕即使被繞過，後端還是會擋。
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
  if (owner === userId) return NextResponse.json({ status: 'owner', role: 'owner' })

  // 協作夥伴（provider_members）
  const found = await resolveAccessRole(providerId, userId)
  if (found && !('notFound' in found)) {
    return NextResponse.json({ status: 'member', role: found.role })
  }
  return NextResponse.json({ status: 'forbidden' })
}
