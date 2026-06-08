import { NextResponse } from 'next/server'

// 已停用：認領一律走 /api/claim（需同意合約條款）。
// 此端點過去允許未經保護的自動認領，已移除以防帳號被搶佔。
export async function POST() {
  return NextResponse.json({ error: 'gone', message: '請改用 /claim/{providerId} 認領流程' }, { status: 410 })
}
