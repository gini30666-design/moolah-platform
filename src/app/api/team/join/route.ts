import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { getSheetData } from '@/lib/sheets'
import { sb } from '@/lib/supabase'
import { normalizeMemberRole } from '@/lib/access'

// 客服用一次性邀請碼加入某個職人的後台。
// 身分一律取自 LIFF access token（getAuthUserId），前端傳來的 userId 不可信。

type InviteRow = {
  code: string
  provider_id: string
  role: string
  expires_at: string
  used_at: string | null
}

async function loadInvite(code: string) {
  const { data, error } = await sb
    .from('member_invites')
    .select('code, provider_id, role, expires_at, used_at')
    .eq('code', code)
    .maybeSingle()
  if (error || !data) return null
  return data as InviteRow
}

function inviteState(invite: InviteRow | null): 'not_found' | 'used' | 'expired' | 'ok' {
  if (!invite) return 'not_found'
  if (invite.used_at) return 'used'
  if (new Date(invite.expires_at).getTime() <= Date.now()) return 'expired'
  return 'ok'
}

async function providerName(providerId: string): Promise<string | null> {
  const rows = await getSheetData('providers!A2:E')
  const match = rows.find(r => r[0] === providerId)
  return match ? (match[1] ?? providerId) : null
}

/** GET /api/team/join?code=xxx → 預覽這張邀請（不需要身分，只回店名與角色，不回任何個資） */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim() ?? ''
  if (!code) return NextResponse.json({ status: 'not_found' }, { status: 404 })

  const invite = await loadInvite(code)
  const state = inviteState(invite)
  if (state !== 'ok') return NextResponse.json({ status: state }, { status: state === 'not_found' ? 404 : 410 })

  const name = await providerName(invite!.provider_id)
  if (!name) return NextResponse.json({ status: 'not_found' }, { status: 404 })

  return NextResponse.json({
    status: 'ok',
    providerId: invite!.provider_id,
    providerName: name,
    role: normalizeMemberRole(invite!.role),
  })
}

/** POST /api/team/join { code } → 用目前 LINE 身分接受邀請 */
export async function POST(req: NextRequest) {
  let body: { code?: unknown; displayName?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (!code) return NextResponse.json({ error: 'missing_code' }, { status: 400 })

  const userId = await getAuthUserId(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const invite = await loadInvite(code)
  const state = inviteState(invite)
  if (state !== 'ok') return NextResponse.json({ error: state }, { status: state === 'not_found' ? 404 : 410 })

  const providerId = invite!.provider_id
  const rows = await getSheetData('providers!A2:E')
  const provider = rows.find(r => r[0] === providerId)
  if (!provider) return NextResponse.json({ error: 'provider_not_found' }, { status: 404 })

  // 老闆自己點自己發的邀請 → 什麼都不做，直接放行進後台。
  // （不可寫進 provider_members：owner 的唯一真相是 providers.line_user_id）
  if ((provider[4] ?? '').trim() === userId) {
    return NextResponse.json({ success: true, providerId, role: 'owner', alreadyOwner: true })
  }

  const role = normalizeMemberRole(invite!.role)
  const { error: upsertError } = await sb.from('provider_members').upsert({
    provider_id: providerId,
    line_user_id: userId,
    role,
    display_name: typeof body.displayName === 'string' ? body.displayName.slice(0, 40) : null,
    invited_by: providerId,
  }, { onConflict: 'provider_id,line_user_id' })
  if (upsertError) {
    console.error('[team/join] upsert', upsertError.message)
    return NextResponse.json({ error: 'join_failed' }, { status: 500 })
  }

  // 🔴 蓋章作廢一定要帶 `is('used_at', null)` ——
  //    兩個人同時點同一條連結時，只有第一個 update 會影響到列，第二個拿到 0 列。
  //    （不強制回滾已寫入的成員：邀請碼是老闆自己發的，重複點的是同一批人，
  //      風險遠低於「因為競態而讓正確的人加不進來」。）
  const { error: burnError } = await sb.from('member_invites')
    .update({ used_at: new Date().toISOString(), used_by: userId })
    .eq('code', code)
    .is('used_at', null)
  if (burnError) console.error('[team/join] burn', burnError.message)

  return NextResponse.json({ success: true, providerId, role })
}
