import { NextRequest, NextResponse } from 'next/server'
import { sb } from '@/lib/supabase'
import { verifyOwner } from '@/lib/auth'

function generateServiceId() {
  return `SVC${Date.now()}`
}

export async function POST(req: NextRequest) {
  const { providerId, name, price, duration, description } = await req.json()
  if (!providerId || !name || price == null || !duration) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const serviceId = generateServiceId()
  const { error } = await sb.from('services').insert({
    service_id: serviceId, provider_id: providerId, name,
    price: Number(price), duration: Number(duration), description: description ?? '',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, serviceId })
}

export async function PATCH(req: NextRequest) {
  const { providerId, serviceId, name, price, duration, description } = await req.json()
  if (!providerId || !serviceId || !name || price == null || !duration) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { data, error } = await sb.from('services')
    .update({ name, price: Number(price), duration: Number(duration), description: description ?? '' })
    .eq('service_id', serviceId).eq('provider_id', providerId).select('service_id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { providerId, serviceId } = await req.json()
  if (!providerId || !serviceId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { data, error } = await sb.from('services')
    .delete().eq('service_id', serviceId).eq('provider_id', providerId).select('service_id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
