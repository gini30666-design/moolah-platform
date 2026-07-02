import { NextRequest, NextResponse } from 'next/server'
import { appendRow, ensureSheet } from '@/lib/sheets'
import { rateLimit, clientIp } from '@/lib/rateLimit'

const HEADERS = ['時間', '頁面/區域', '嚴重度', '問題描述', '回報者', 'User-Agent']

// 問題回報：寫進 Google Sheets 的 feedback 分頁（封測用，之後也可當客服意見箱）
export async function POST(req: NextRequest) {
  if (!rateLimit(`feedback:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: 'rate_limited', message: '操作太頻繁，請稍後再試。' }, { status: 429 })
  }
  let body: { area?: string; severity?: string; message?: string; reporter?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }) }

  const message = (body.message ?? '').trim()
  if (!message) return NextResponse.json({ error: 'missing_message' }, { status: 400 })

  const area = (body.area ?? '').trim() || '未指定'
  const severity = (body.severity ?? '').trim() || '中'
  const reporter = (body.reporter ?? '').trim() || '匿名'
  const ua = req.headers.get('user-agent')?.slice(0, 180) ?? ''
  const ts = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })

  try {
    await ensureSheet('feedback', HEADERS)
    await appendRow('feedback!A:F', [ts, area, severity, message, reporter, ua])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'write_failed', detail: String(e) }, { status: 500 })
  }
}
