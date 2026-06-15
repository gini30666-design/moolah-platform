import { NextRequest, NextResponse } from 'next/server'
import { sb } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { providerId, lineUserId, agreedAt, direct } = await req.json()

  if (!providerId || !lineUserId) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 })
  }

  const { data: provider, error: findErr } = await sb
    .from('providers').select('id, line_user_id').eq('id', providerId).maybeSingle()

  if (findErr) return NextResponse.json({ error: 'server_error' }, { status: 500 })
  if (!provider) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const existing = (provider.line_user_id ?? '').trim()
  if (existing) {
    // 已認領 — 同一人重複點 → 直接進後台；不同人 → 鎖定
    if (existing === lineUserId) return NextResponse.json({ success: true, alreadyOwner: true })
    return NextResponse.json({ alreadyClaimed: true })
  }

  // 方案狀態：direct=直接正式加入(active)；預設=14 天免費試用(trial)
  const nowIso = new Date().toISOString()
  const plan = direct ? 'active' : 'trial'
  const trialStartAt = direct ? null : nowIso
  const trialEndsAt = direct ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

  const { error: updErr } = await sb.from('providers').update({
    line_user_id: lineUserId,
    agreed_at: agreedAt ?? nowIso,
    plan,
    trial_start_at: trialStartAt,
    trial_ends_at: trialEndsAt,
  }).eq('id', providerId)

  if (updErr) return NextResponse.json({ error: 'server_error' }, { status: 500 })
  return NextResponse.json({ success: true, plan, trialEndsAt: trialEndsAt || null })
}
