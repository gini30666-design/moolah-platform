import { NextRequest, NextResponse } from 'next/server'

// 唯讀：拉 IG 媒體/帳號 insights（官方 Graph API，供行銷成效報告用）
// GET ?mediaId=xxx → 該貼文 insights；GET ?account=1 → 帳號概況
export async function GET(req: NextRequest) {
  const secret = process.env.OPS_PUBLISH_SECRET
  if (!secret || req.headers.get('x-ops-secret') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const token = process.env.IG_GRAPH_TOKEN
  const igUserId = process.env.IG_USER_ID
  if (!token || !igUserId) {
    return NextResponse.json({ error: 'ig credentials missing' }, { status: 500 })
  }

  const mediaId = req.nextUrl.searchParams.get('mediaId')
  const account = req.nextUrl.searchParams.get('account')

  try {
    if (mediaId) {
      // 貼文基本資料 + insights（reach/likes/comments/saved/shares/views）
      const [meta, ins] = await Promise.all([
        fetch(`https://graph.instagram.com/${mediaId}?fields=media_type,media_product_type,timestamp,permalink,like_count,comments_count&access_token=${token}`).then(r => r.json()),
        fetch(`https://graph.instagram.com/${mediaId}/insights?metric=reach,likes,comments,saved,shares,views&access_token=${token}`).then(r => r.json()),
      ])
      return NextResponse.json({ meta, insights: ins })
    }
    if (account) {
      const [profile, ins] = await Promise.all([
        fetch(`https://graph.instagram.com/${igUserId}?fields=username,followers_count,media_count&access_token=${token}`).then(r => r.json()),
        fetch(`https://graph.instagram.com/${igUserId}/insights?metric=reach,profile_views,accounts_engaged&period=day&metric_type=total_value&access_token=${token}`).then(r => r.json()),
      ])
      return NextResponse.json({ profile, insights: ins })
    }
    return NextResponse.json({ error: 'need mediaId or account param' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
