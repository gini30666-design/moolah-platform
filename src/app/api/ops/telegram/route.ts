import { NextResponse } from 'next/server'

// 已退役：手機指揮中心改用官方 Claude Code Channels（telegram plugin），
// 這支自建的窄 ops agent（opsAgent + telegram lib）已停用。保留 410 stub 以移除死碼/攻擊面。
export async function POST() {
  return NextResponse.json({ error: 'gone' }, { status: 410 })
}
