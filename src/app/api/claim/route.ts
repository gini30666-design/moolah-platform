import { NextRequest, NextResponse } from 'next/server'
import { sb } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { providerId, lineUserId, agreedAt, direct } = await req.json()

  if (!providerId || !lineUserId) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 })
  }

  const { data: provider, error: findErr } = await sb
    .from('providers').select('id, line_user_id, plan').eq('id', providerId).maybeSingle()

  if (findErr) return NextResponse.json({ error: 'server_error' }, { status: 500 })
  if (!provider) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const existing = (provider.line_user_id ?? '').trim()
  if (existing) {
    // 已認領 — 同一人重複點 → 直接進後台；不同人 → 鎖定
    if (existing === lineUserId) return NextResponse.json({ success: true, alreadyOwner: true })
    return NextResponse.json({ alreadyClaimed: true })
  }

  // ⚠️ 認領的職責是「綁定 LINE 身分 + 記錄同意時間」，不該推翻 OB 上線時已決定的方案。
  // 舊版無條件寫 `direct ? 'active' : 'trial'`，會把 OB 特意設成 active 的職人打回 trial，
  // 連帶讓 20 筆預約上限復活、第 21 位客人被擋（2026-08-06 交付前抓到）。
  const nowIso = new Date().toISOString()
  const preset = (provider.plan ?? '').trim()
  const fourteenDays = () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

  let plan: string
  let trialStartAt: string | null
  let trialEndsAt: string | null

  if (preset === 'active') {
    // OB 已設為正式 → 認領不動方案
    plan = 'active'; trialStartAt = null; trialEndsAt = null
  } else if (preset === 'trial') {
    // OB 設為試用 → 方案保留，但試用期從「認領當下」重新起算（他真正開始用是現在，
    // 不該把上線到認領之間的空窗算進去）
    plan = 'trial'; trialStartAt = nowIso; trialEndsAt = fourteenDays()
  } else {
    // 沒有預設方案（舊資料 / 自助認領）→ 沿用原本規則
    plan = direct ? 'active' : 'trial'
    trialStartAt = direct ? null : nowIso
    trialEndsAt = direct ? null : fourteenDays()
  }

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
