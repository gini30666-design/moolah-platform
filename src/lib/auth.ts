import { NextRequest } from 'next/server'
import { getSheetData } from './sheets'

// 從 Authorization: Bearer <LIFF access token> 取出 LINE userId（向 LINE 驗證）
export async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const header = req.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) return null
  try {
    const res = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const profile = await res.json()
    return typeof profile.userId === 'string' ? profile.userId : null
  } catch {
    return null
  }
}

export type OwnerCheck =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string }

// 驗證呼叫者（LINE userId）確實是 providerId 的擁有者（providers!E 欄）
export async function verifyOwner(
  req: NextRequest,
  providerId: string | null | undefined,
): Promise<OwnerCheck> {
  if (!providerId) return { ok: false, status: 400, error: 'missing_providerId' }
  const userId = await getAuthUserId(req)
  if (!userId) return { ok: false, status: 401, error: 'unauthorized' }
  const rows = await getSheetData('providers!A2:E')
  const match = rows.find(r => r[0] === providerId)
  if (!match) return { ok: false, status: 404, error: 'provider_not_found' }
  if ((match[4] ?? '').trim() !== userId) return { ok: false, status: 403, error: 'forbidden' }
  return { ok: true, userId }
}
