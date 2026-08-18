import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'
import { sb } from '@/lib/supabase'
import { normalizeMemberRole } from '@/lib/access'

// GET /api/dashboard/me?userId=Uxxxx
// 用 lineUserId 反查這個人「所有」能進的後台。
//
// 🔴 舊版是 rows.find(...) 只回第一筆 —— 一個 LINE 綁多個職人時會回錯人
//    （Gini 同時綁 designer-003 與 tong 就踩到）。協作客服可能同時服務 10–20 家，
//    所以這裡一律回清單。
//
// ⚠️ 這支只用來「決定要進哪個後台」，不是授權。真正的授權在 verifyAccess，
//    每支 admin API 都會用 LIFF token 重驗一次，所以這裡吃 query 的 userId 是可以的
//    （最壞情況是知道別人 userId 的人看到店名，拿不到任何資料）。
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 })

  // 欄位: id(0), name(1), category(2), description(3), lineUserId(4)
  const rows = await getSheetData('providers!A2:E')

  const owned = rows
    .filter(r => (r[4] ?? '').trim() === userId)
    .map(r => ({ providerId: r[0], name: r[1], category: r[2], role: 'owner' as const }))

  const { data: memberRows, error } = await sb
    .from('provider_members')
    .select('provider_id, role')
    .eq('line_user_id', userId)
  if (error) console.error('[dashboard/me] members', error.message)

  const ownedIds = new Set(owned.map(o => o.providerId))
  const joined = (memberRows ?? [])
    .filter(m => !ownedIds.has(m.provider_id))   // 老闆身分優先，不重複列出
    .map(m => {
      const row = rows.find(r => r[0] === m.provider_id)
      return row
        ? { providerId: row[0], name: row[1], category: row[2], role: normalizeMemberRole(m.role) }
        : null
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  const memberships = [...owned, ...joined]

  return NextResponse.json({
    memberships,
    // ⬇️ 舊欄位保留，避免有沒改到的呼叫端直接壞掉（值＝第一筆）
    found: memberships.length > 0,
    ...(memberships[0]
      ? { providerId: memberships[0].providerId, name: memberships[0].name, category: memberships[0].category }
      : {}),
  })
}
