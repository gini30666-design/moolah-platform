import { NextRequest, NextResponse } from 'next/server'
import { sb } from '@/lib/supabase'
import { verifyOwner } from '@/lib/auth'

// 客戶作品歷史（Karte）：每位客人 × 每次服務的照片 + 備註（染髮配方、指甲款式…）
// table: customer_history (id, provider_id, customer_line_user_id, image_url, note, service_name, created_at)

// GET ?providerId=&customerLineUserId=  → 該客人的作品歷史（新到舊）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  const customerLineUserId = searchParams.get('customerLineUserId')
  if (!providerId || !customerLineUserId) return NextResponse.json({ entries: [] })

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { data, error } = await sb.from('customer_history')
    .select('id, image_url, note, service_name, created_at')
    .eq('provider_id', providerId)
    .eq('customer_line_user_id', customerLineUserId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const entries = (data ?? []).map(r => ({
    id: r.id, imageUrl: r.image_url ?? '', note: r.note ?? '',
    serviceName: r.service_name ?? '', createdAt: r.created_at,
  }))
  return NextResponse.json({ entries })
}

// POST {providerId, customerLineUserId, imageUrl?, note?, serviceName?} → 新增一筆
export async function POST(req: NextRequest) {
  const { providerId, customerLineUserId, imageUrl, note, serviceName } = await req.json()
  if (!providerId || !customerLineUserId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  if (!imageUrl && !note) {
    return NextResponse.json({ error: '請至少提供照片或備註' }, { status: 400 })
  }

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { data, error } = await sb.from('customer_history').insert({
    provider_id: providerId,
    customer_line_user_id: customerLineUserId,
    image_url: imageUrl || null,
    note: note || null,
    service_name: serviceName || null,
    created_at: new Date().toISOString(),
  }).select('id, image_url, note, service_name, created_at').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    entry: { id: data.id, imageUrl: data.image_url ?? '', note: data.note ?? '', serviceName: data.service_name ?? '', createdAt: data.created_at },
  })
}

// DELETE {providerId, id} → 刪一筆（驗證該筆屬於此職人）
export async function DELETE(req: NextRequest) {
  const { providerId, id } = await req.json()
  if (!providerId || id === undefined) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { data, error } = await sb.from('customer_history')
    .delete().eq('id', id).eq('provider_id', providerId).select('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
