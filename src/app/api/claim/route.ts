import { NextRequest, NextResponse } from 'next/server'
import { sb } from '@/lib/supabase'
import { sendCapiEvent, capiUserFromRequest } from '@/lib/metaCapi'

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
  // 連帶讓試用的筆數上限復活、客人被靜默擋下（2026-08-06 交付前抓到）。
  const nowIso = new Date().toISOString()
  const preset = (provider.plan ?? '').trim()

  // 🔑 2026-08-20 Gini 決定：**試用期改為「第一筆真實預約」起算**，認領不再起算。
  //
  //    為什麼：認領到「真的開始接單」中間往往隔好幾天甚至沒開始 ——
  //    Zuzu 就是 8/10 認領、8/24 到期、期間 0 筆預約，14 天全燒在「還沒開始用」上。
  //    試用期的意義是「讓他驗證這東西有沒有用」，那就該從他真的用起來的那一刻算。
  //
  //    實作：認領時 plan='trial' 但 trial_start_at / trial_ends_at 留 null，
  //    由 `startTrialIfFirstBooking()`（lib/plan.ts）在第一筆預約寫入後補上。
  //    ⚠️ 筆數上限（TRIAL_BOOKING_LIMIT）不受影響，仍然從第一筆就開始算。
  let plan: string
  const trialStartAt: string | null = null
  const trialEndsAt: string | null = null

  if (preset === 'active') {
    plan = 'active'          // OB 已設為正式 → 認領不動方案
  } else if (preset === 'trial') {
    plan = 'trial'           // 試用期等第一筆預約才起算
  } else {
    plan = direct ? 'active' : 'trial'
  }

  const { error: updErr } = await sb.from('providers').update({
    line_user_id: lineUserId,
    agreed_at: agreedAt ?? nowIso,
    plan,
    trial_start_at: trialStartAt,
    trial_ends_at: trialEndsAt,
  }).eq('id', providerId)

  if (updErr) return NextResponse.json({ error: 'server_error' }, { status: 500 })

  // 漏斗第 5 階：試用真的開始了。
  // 這比「填了表」深一階 —— 餵回 Meta，它才學得到「哪種人最後會真的裝起來用」。
  // ⚠️ 純伺服器事件（認領發生在 LIFF 裡，沒有 Pixel），失敗不影響認領結果。
  try {
    await sendCapiEvent('trial', {
      ...capiUserFromRequest(req),
      externalId: providerId,
    }, {
      actionSource: 'business_messaging',   // 來自 LINE，不是網站點擊
      customData: { plan, provider_id: providerId },
      // 認領是職人正在等待的畫面 —— 追蹤最多只准佔用 3 秒
      timeoutMs: 3000,
    })
  } catch { /* 追蹤失敗絕不能擋住認領 */ }

  return NextResponse.json({ success: true, plan, trialEndsAt: trialEndsAt || null })
}
