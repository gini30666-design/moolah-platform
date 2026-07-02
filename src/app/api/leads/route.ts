import { NextResponse } from 'next/server'
import { appendRow } from '@/lib/sheets'
import { rateLimit, clientIp } from '@/lib/rateLimit'

export async function POST(req: Request) {
  try {
    if (!rateLimit(`leads:${clientIp(req)}`, 5, 60_000)) {
      return NextResponse.json({ error: 'rate_limited', message: '操作太頻繁，請稍後再試。' }, { status: 429 })
    }
    const { name, category, district, contact, currentMethod, plan } = await req.json()
    if (!name?.trim() || !category || !district || !contact?.trim()) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }

    const id = `lead-${Date.now()}`
    const createdAt = new Date().toISOString()  // timestamptz 欄位需 ISO（原本 toLocaleString 的「上午/下午」會讓 Postgres 解析失敗→500）
    // plan：trial=14 天免費試用（預設）／direct=直接正式加入（免試用）
    const planChoice = plan === 'direct' ? 'direct' : 'trial'

    await appendRow('leads!A:I', [id, name.trim(), category, district, contact.trim(), currentMethod || '', createdAt, 'new', planChoice])

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[leads]', e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
