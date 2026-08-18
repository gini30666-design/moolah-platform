import { NextRequest, NextResponse } from 'next/server'
import { verifyOwner } from '@/lib/auth'
import { sb } from '@/lib/supabase'
import { isMissingProviderThemeColumn, isProviderThemeKey, PROVIDER_THEME_PICKER_ENABLED } from '@/lib/providerTheme'

export async function PATCH(req: NextRequest) {
  // 主題切換總開關關閉時，API 也要擋 —— 只藏 UI 不擋 API 等於沒擋（隨手 curl 就能改）。
  if (!PROVIDER_THEME_PICKER_ENABLED) {
    return NextResponse.json({ error: 'theme_picker_disabled' }, { status: 403 })
  }

  let body: { providerId?: unknown; theme?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const providerId = typeof body.providerId === 'string' ? body.providerId.trim() : ''
  if (!providerId) return NextResponse.json({ error: 'missing_providerId' }, { status: 400 })
  if (!isProviderThemeKey(body.theme)) {
    return NextResponse.json({ error: 'invalid_theme' }, { status: 400 })
  }

  const owner = await verifyOwner(req, providerId)
  if (!owner.ok) {
    return NextResponse.json({ error: owner.error }, { status: owner.status })
  }

  const { error } = await sb.from('providers').update({ theme: body.theme }).eq('id', providerId)
  if (isMissingProviderThemeColumn(error)) {
    return NextResponse.json({ error: 'theme_storage_unavailable' }, { status: 503 })
  }
  if (error) {
    console.error('[admin/theme]', error.message)
    return NextResponse.json({ error: 'theme_update_failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, theme: body.theme })
}
