import { NextRequest, NextResponse } from 'next/server'
import { sb } from '@/lib/supabase'
import { verifyOwner } from '@/lib/auth'

// customer_notes: (provider_id, customer_line_user_id) 複合主鍵；tags 為 jsonb

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  const customerLineUserId = searchParams.get('customerLineUserId')
  if (!providerId || !customerLineUserId) return NextResponse.json({ note: '', tags: [] })

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { data } = await sb.from('customer_notes')
    .select('note, tags').eq('provider_id', providerId).eq('customer_line_user_id', customerLineUserId).maybeSingle()
  return NextResponse.json({ note: data?.note ?? '', tags: Array.isArray(data?.tags) ? data!.tags : [] })
}

export async function POST(req: NextRequest) {
  const { providerId, customerLineUserId, note, tags } = await req.json()
  if (!providerId || !customerLineUserId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  // 部分更新：未提供的欄位沿用既有值
  const { data: existing } = await sb.from('customer_notes')
    .select('note, tags').eq('provider_id', providerId).eq('customer_line_user_id', customerLineUserId).maybeSingle()

  const finalNote = note !== undefined ? note : (existing?.note ?? '')
  const finalTags = tags !== undefined ? tags : (Array.isArray(existing?.tags) ? existing!.tags : [])

  const { error } = await sb.from('customer_notes').upsert({
    provider_id: providerId, customer_line_user_id: customerLineUserId,
    note: finalNote, updated_at: new Date().toISOString(), tags: finalTags,
  }, { onConflict: 'provider_id,customer_line_user_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
