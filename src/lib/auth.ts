import { NextRequest } from 'next/server'
import { getSheetData } from './sheets'
import { sb } from './supabase'
import { normalizeMemberRole, roleSatisfies, type AccessNeed, type AccessRole } from './access'

/**
 * 從 Authorization: Bearer <LIFF access token> 取出 LINE userId（向 LINE 驗證）。
 *
 * 🔑 這是唯一可信的身分來源。前端傳來的 userId 一律不可信 ——
 *    LINE userId 只是一串字，拿到別人的就能冒用。
 *
 * ⚠️ 必須有逾時：這支在預約與查詢的使用者等待路徑上，
 *    LINE API 一卡，客人會看到「送出失敗」但實際上什麼都沒發生。
 *    （同型問題 2026-08-13 在 CAPI/LINE 推播上修過一次）
 */
export async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const header = req.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) return null
  try {
    const res = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(4500),
    })
    if (!res.ok) return null
    const profile = await res.json()
    return typeof profile.userId === 'string' ? profile.userId : null
  } catch {
    return null
  }
}

export type OwnerCheck =
  | { ok: true; userId: string; role: AccessRole }
  | { ok: false; status: number; error: string }

/**
 * 查某人對某個 providerId 的角色。找不到就是 null（＝沒有任何權限）。
 *
 * owner 只認 providers.line_user_id；協作夥伴才查 provider_members。
 * 兩者的順序不可對調 —— 老闆就算被誤塞進 members 表也永遠是 owner。
 */
export async function resolveAccessRole(
  providerId: string,
  userId: string,
): Promise<{ role: AccessRole } | { notFound: true } | null> {
  const rows = await getSheetData('providers!A2:E')
  const match = rows.find(r => r[0] === providerId)
  if (!match) return { notFound: true }

  if ((match[4] ?? '').trim() === userId) return { role: 'owner' }

  const { data, error } = await sb
    .from('provider_members')
    .select('role')
    .eq('provider_id', providerId)
    .eq('line_user_id', userId)
    .maybeSingle()

  // 🔴 查詢出錯一律當作沒有權限（fail-closed）。
  //    這支是全後台唯一的守門，DB 抖一下就放行的話等於沒有門。
  if (error || !data) return null
  return { role: normalizeMemberRole(data.role) }
}

/**
 * 驗證呼叫者對 providerId 的存取權限。
 *
 * `need` 預設 'owner'：新的 admin API 忘了標，行為是最嚴而不是意外放行。
 * 全部 /api/admin/* 都吃這一支，改動請務必配測試。
 */
export async function verifyAccess(
  req: NextRequest,
  providerId: string | null | undefined,
  need: AccessNeed = 'owner',
): Promise<OwnerCheck> {
  if (!providerId) return { ok: false, status: 400, error: 'missing_providerId' }
  const userId = await getAuthUserId(req)
  if (!userId) return { ok: false, status: 401, error: 'unauthorized' }

  const found = await resolveAccessRole(providerId, userId)
  if (found && 'notFound' in found) return { ok: false, status: 404, error: 'provider_not_found' }
  if (!found) return { ok: false, status: 403, error: 'forbidden' }
  if (!roleSatisfies(found.role, need)) return { ok: false, status: 403, error: 'insufficient_role' }

  return { ok: true, userId, role: found.role }
}

/**
 * 舊名稱，等同 verifyAccess(req, id, 'owner')。
 * 既有呼叫端不必全部改寫；新程式碼請直接用 verifyAccess 並明確標出 need。
 */
export function verifyOwner(
  req: NextRequest,
  providerId: string | null | undefined,
): Promise<OwnerCheck> {
  return verifyAccess(req, providerId, 'owner')
}
