import { NextRequest, NextResponse } from 'next/server'
import { sb } from '@/lib/supabase'
import { verifyOwner } from '@/lib/auth'

function generatePortfolioId() {
  return `PFO${Date.now()}`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  if (!providerId) return NextResponse.json({ error: 'Missing providerId' }, { status: 400 })

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { data } = await sb.from('portfolio')
    .select('portfolio_id, image_url, caption, sort_order')
    .eq('provider_id', providerId).order('sort_order', { ascending: true })
  const items = (data ?? []).map(r => ({
    id: r.portfolio_id, imageUrl: r.image_url ?? '', caption: r.caption ?? '', order: Number(r.sort_order ?? 0),
  }))
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const { providerId, imageUrl, caption } = await req.json()
  if (!providerId || !imageUrl) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { count } = await sb.from('portfolio')
    .select('*', { count: 'exact', head: true }).eq('provider_id', providerId)

  const imageId = generatePortfolioId()
  const { error } = await sb.from('portfolio').insert({
    portfolio_id: imageId, provider_id: providerId, image_url: imageUrl,
    caption: caption ?? '', sort_order: count ?? 0, created_at: new Date().toISOString(),
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, imageId })
}

export async function DELETE(req: NextRequest) {
  const { providerId, imageId } = await req.json()
  if (!providerId || !imageId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { data, error } = await sb.from('portfolio')
    .delete().eq('provider_id', providerId).eq('portfolio_id', imageId).select('portfolio_id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
