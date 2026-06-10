import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60
const GRAPH = 'https://graph.facebook.com/v21.0'

// 發布單張圖到 Instagram（Graph API 內容發布：建容器 → 發布）
// body: { imageUrl, caption }；需 header x-ops-secret
export async function POST(req: NextRequest) {
  const igUser = process.env.IG_USER_ID
  const token = process.env.IG_GRAPH_TOKEN
  if (!igUser || !token) return NextResponse.json({ error: 'not_configured' }, { status: 503 })

  const secret = process.env.OPS_PUBLISH_SECRET
  if (secret && req.headers.get('x-ops-secret') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: { imageUrl?: string; caption?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }) }
  const imageUrl = body.imageUrl
  const caption = body.caption ?? ''
  if (!imageUrl) return NextResponse.json({ error: 'missing_imageUrl' }, { status: 400 })

  // 1) 建立媒體容器
  const createRes = await fetch(`${GRAPH}/${igUser}/media`, {
    method: 'POST',
    body: new URLSearchParams({ image_url: imageUrl, caption, access_token: token }),
  })
  const created = await createRes.json()
  if (!createRes.ok || !created.id) {
    return NextResponse.json({ step: 'create', error: created }, { status: 400 })
  }

  // 2) 發布
  const pubRes = await fetch(`${GRAPH}/${igUser}/media_publish`, {
    method: 'POST',
    body: new URLSearchParams({ creation_id: created.id, access_token: token }),
  })
  const published = await pubRes.json()
  if (!pubRes.ok || !published.id) {
    return NextResponse.json({ step: 'publish', error: published, creationId: created.id }, { status: 400 })
  }

  return NextResponse.json({ ok: true, mediaId: published.id })
}
