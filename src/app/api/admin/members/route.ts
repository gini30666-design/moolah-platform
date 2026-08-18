import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { verifyAccess } from '@/lib/auth'
import { sb } from '@/lib/supabase'
import { normalizeMemberRole } from '@/lib/access'

// 協作夥伴管理 —— 一律 owner 級（manager 不能自己再拉人進來，避免權限自我擴散）
const NEED = 'owner' as const

const INVITE_TTL_DAYS = 7

/** GET /api/admin/members?providerId=X → 成員名單 ＋ 未使用的邀請碼 */
export async function GET(req: NextRequest) {
  const providerId = req.nextUrl.searchParams.get('providerId')
  const auth = await verifyAccess(req, providerId, NEED)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const [members, invites] = await Promise.all([
    sb.from('provider_members')
      .select('line_user_id, role, display_name, created_at')
      .eq('provider_id', providerId!)
      .order('created_at', { ascending: true }),
    sb.from('member_invites')
      .select('code, role, expires_at, created_at')
      .eq('provider_id', providerId!)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }),
  ])

  if (members.error || invites.error) {
    console.error('[admin/members] GET', members.error?.message || invites.error?.message)
    return NextResponse.json({ error: 'load_failed' }, { status: 500 })
  }

  return NextResponse.json({
    members: (members.data ?? []).map(m => ({
      lineUserId: m.line_user_id,
      // 名單畫面不需要看到完整 LINE ID（也不該外流），只給尾碼辨識用
      masked: `…${String(m.line_user_id).slice(-6)}`,
      role: normalizeMemberRole(m.role),
      displayName: m.display_name ?? '',
      createdAt: m.created_at,
    })),
    invites: (invites.data ?? []).map(i => ({
      code: i.code,
      role: normalizeMemberRole(i.role),
      expiresAt: i.expires_at,
    })),
  })
}

/** POST /api/admin/members { providerId, role, displayName? } → 產生一次性邀請碼 */
export async function POST(req: NextRequest) {
  let body: { providerId?: unknown; role?: unknown; displayName?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const providerId = typeof body.providerId === 'string' ? body.providerId.trim() : ''
  const auth = await verifyAccess(req, providerId, NEED)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  // 🔴 邀請碼必須是猜不到的亂數。
  //    不可以用 /claim/{providerId}?staff=1 這種固定連結 —— providerId 印在立牌 QR
  //    與短網址上是公開資訊，等於任何看到立牌的人都能把自己加成客服。
  const code = randomBytes(12).toString('base64url')   // 16 字元、URL 安全
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86400_000).toISOString()

  const { error } = await sb.from('member_invites').insert({
    code,
    provider_id: providerId,
    role: normalizeMemberRole(body.role),
    created_by: auth.userId,
    expires_at: expiresAt,
  })
  if (error) {
    console.error('[admin/members] POST', error.message)
    return NextResponse.json({ error: 'invite_failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, code, expiresAt })
}

/** DELETE /api/admin/members { providerId, lineUserId } | { providerId, code } → 移除成員或作廢邀請 */
export async function DELETE(req: NextRequest) {
  let body: { providerId?: unknown; lineUserId?: unknown; code?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const providerId = typeof body.providerId === 'string' ? body.providerId.trim() : ''
  const auth = await verifyAccess(req, providerId, NEED)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const lineUserId = typeof body.lineUserId === 'string' ? body.lineUserId.trim() : ''
  const code = typeof body.code === 'string' ? body.code.trim() : ''

  // ⚠️ 兩個 delete 都必須同時帶 provider_id 條件 ——
  //    只用 line_user_id / code 當條件的話，A 店老闆能刪掉 B 店的成員。
  if (lineUserId) {
    const { error } = await sb.from('provider_members').delete()
      .eq('provider_id', providerId).eq('line_user_id', lineUserId)
    if (error) return NextResponse.json({ error: 'remove_failed' }, { status: 500 })
    return NextResponse.json({ success: true })
  }
  if (code) {
    const { error } = await sb.from('member_invites').delete()
      .eq('provider_id', providerId).eq('code', code)
    if (error) return NextResponse.json({ error: 'remove_failed' }, { status: 500 })
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: 'missing_target' }, { status: 400 })
}
