import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60
// Instagram API with Instagram Login（graph.instagram.com）
const GRAPH = 'https://graph.instagram.com/v21.0'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// 在函式上限內輪詢容器狀態：FINISHED→發布回 {ok}；仍處理中→回 {pending,creationId}（交呼叫端續查）
async function pollAndPublish(igUser: string, token: string, creationId: string, maxMs: number) {
  const deadline = Date.now() + maxMs
  while (Date.now() < deadline) {
    await sleep(3000)
    const stRes = await fetch(`${GRAPH}/${creationId}?fields=status_code&access_token=${encodeURIComponent(token)}`)
    const st = await stRes.json()
    if (st.status_code === 'FINISHED') {
      const pubRes = await fetch(`${GRAPH}/${igUser}/media_publish`, {
        method: 'POST',
        body: new URLSearchParams({ creation_id: creationId, access_token: token }),
      })
      const published = await pubRes.json()
      if (!pubRes.ok || !published.id) {
        return NextResponse.json({ step: 'publish', error: published, creationId }, { status: 400 })
      }
      return NextResponse.json({ ok: true, mediaId: published.id })
    }
    if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') {
      return NextResponse.json({ step: 'process', error: st, creationId }, { status: 400 })
    }
  }
  // 仍在處理（影片常見）→ 交回呼叫端帶 creationId 續查
  return NextResponse.json({ pending: true, creationId }, { status: 202 })
}

// 發布到 Instagram（內容發布：建容器 → 等處理 → 發布）
// body:
//   圖片： { imageUrl, caption }
//   影片(Reels)： { videoUrl, caption, coverUrl?, shareToFeed? }
//   續查長影片： { creationId }
// 需 header x-ops-secret
export async function POST(req: NextRequest) {
  const igUser = process.env.IG_USER_ID
  const token = process.env.IG_GRAPH_TOKEN
  if (!igUser || !token) return NextResponse.json({ error: 'not_configured' }, { status: 503 })

  // fail-closed：secret 未設定 → 一律拒絕（避免環境變數遺失時端點對外全開）
  const secret = process.env.OPS_PUBLISH_SECRET
  if (!secret || req.headers.get('x-ops-secret') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: {
    imageUrl?: string
    videoUrl?: string
    coverUrl?: string
    caption?: string
    shareToFeed?: boolean
    creationId?: string
  }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }) }
  const caption = body.caption ?? ''

  // 續查路徑：只帶 creationId（長影片跨多次請求完成，每次都 <60s）
  if (body.creationId && !body.imageUrl && !body.videoUrl) {
    return pollAndPublish(igUser, token, body.creationId, 45000)
  }

  // Reels（影片）流程
  if (body.videoUrl) {
    const params = new URLSearchParams({
      media_type: 'REELS',
      video_url: body.videoUrl,
      caption,
      share_to_feed: String(body.shareToFeed !== false),
      access_token: token,
    })
    if (body.coverUrl) params.set('cover_url', body.coverUrl)
    const createRes = await fetch(`${GRAPH}/${igUser}/media`, { method: 'POST', body: params })
    const created = await createRes.json()
    if (!createRes.ok || !created.id) {
      return NextResponse.json({ step: 'create', error: created }, { status: 400 })
    }
    return pollAndPublish(igUser, token, created.id, 45000)
  }

  // 圖片流程（既有，向後相容）
  const imageUrl = body.imageUrl
  if (!imageUrl) return NextResponse.json({ error: 'missing_media' }, { status: 400 })

  const createRes = await fetch(`${GRAPH}/${igUser}/media`, {
    method: 'POST',
    body: new URLSearchParams({ image_url: imageUrl, caption, access_token: token }),
  })
  const created = await createRes.json()
  if (!createRes.ok || !created.id) {
    return NextResponse.json({ step: 'create', error: created }, { status: 400 })
  }
  return pollAndPublish(igUser, token, created.id, 45000)
}
