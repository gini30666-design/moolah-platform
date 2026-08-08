import { NextRequest, NextResponse } from 'next/server'

// IG 長期權杖續期（Instagram Login API / graph.instagram.com）
//
// 為什麼需要這支：IG_GRAPH_TOKEN 在 Vercel 標成 Sensitive，`vercel env pull` 拉回來是空字串，
// 本機拿不到 token 就沒辦法呼叫 refresh。所以由伺服器端讀 env 打 refresh，再把新 token 回傳。
//
// ⚠️ 這支會回傳完整 token → 一定要 secret 保護，且不要在公開場合貼輸出。
// 用法：POST /api/ops/ig-refresh-token  header: x-ops-secret
// 回傳新 token 後，仍需人工寫回 Vercel env（Vercel 沒有讓執行中的函式改自己 env 的 API）。
//
// 續期規則：長期權杖需「滿 24 小時、且未過期」才能 refresh，成功後重新給 60 天。

export async function POST(req: NextRequest) {
  const secret = process.env.OPS_PUBLISH_SECRET
  if (!secret || req.headers.get('x-ops-secret') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const token = process.env.IG_GRAPH_TOKEN
  if (!token) return NextResponse.json({ error: 'IG_GRAPH_TOKEN not set' }, { status: 500 })

  const res = await fetch(
    `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`,
    { cache: 'no-store' },
  )
  const data = await res.json()

  if (!res.ok || !data.access_token) {
    return NextResponse.json({ ok: false, status: res.status, error: data }, { status: 502 })
  }

  const days = Math.round((data.expires_in ?? 0) / 86400)
  const expiresAt = new Date(Date.now() + (data.expires_in ?? 0) * 1000).toISOString().slice(0, 10)

  return NextResponse.json({
    ok: true,
    newToken: data.access_token,
    validDays: days,
    expiresAt,
    note: '請把 newToken 寫回 Vercel env IG_GRAPH_TOKEN 後重新部署，否則下次仍用舊的。',
  })
}
