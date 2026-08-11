import { NextRequest, NextResponse } from 'next/server'
import { sb } from '@/lib/supabase'
import { pushB2bMessage } from '@/lib/line'

/**
 * 招商 OA（@492ejbwx）好友名冊 — 查名單 / 主動私訊。
 *
 * 為什麼需要這支（2026-08-11）：
 * LINE 的機制是「加了好友但一句話都沒說」的人不會出現在 OA Manager 聊天列表，
 * 也點不到、無法私訊。以前唯一的解是「群發」，但群發會一併打擾正在談的其他客戶。
 * 現在 b2b-webhook 會把 userId 存進 b2b_followers，這支就能一對一敲——不吵到別人。
 *
 * ⚠️ 招商 OA 的 access token 只在 Vercel（本機 .env.local 沒有），
 *    所以一定要走伺服器端，不能從 CLI 直接打 LINE API。
 *
 * 用法（header 一律帶 x-ops-secret）：
 *   GET  /api/ops/b2b-contact           → 全部名冊
 *   GET  /api/ops/b2b-contact?silent=1  → 只列「沒開口且還是好友」＝需要主動敲的人
 *   POST /api/ops/b2b-contact  { userId: "U...", text: "..." }
 *   POST /api/ops/b2b-contact  { userIds: ["U...","U..."], text: "..." }
 *
 * ⚠️ 刻意「不」提供「一鍵發給所有人」——那等於群發，
 *    Gini 2026-08-11 明確指示不要打擾正在談的客戶。要發給誰必須逐一指名。
 */

export const maxDuration = 30

type Row = {
  line_user_id: string
  display_name: string | null
  followed_at: string | null
  first_message_at: string | null
  last_contacted_at: string | null
  unfollowed_at: string | null
  note: string | null
}

function authed(req: NextRequest): boolean {
  const secret = process.env.OPS_PUBLISH_SECRET
  // fail-closed：secret 沒設就一律拒絕，不要讓 `undefined === undefined` 變成後門
  return Boolean(secret) && req.headers.get('x-ops-secret') === secret
}

/** 名冊裡只有 userId、沒有暱稱的人（本表建立前就加好友、靠 message 事件補進來的）→ 回填一次 */
async function backfillNames(rows: Row[]): Promise<Row[]> {
  const token = process.env.LINE_B2B_CHANNEL_ACCESS_TOKEN
  const missing = rows.filter((r) => !r.display_name && !r.unfollowed_at)
  if (!token || missing.length === 0) return rows

  await Promise.all(
    missing.map(async (r) => {
      try {
        const res = await fetch(`https://api.line.me/v2/bot/profile/${r.line_user_id}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        if (!res.ok) return
        const d = await res.json()
        if (!d.displayName) return
        r.display_name = d.displayName
        await sb
          .from('b2b_followers')
          .update({ display_name: d.displayName, picture_url: d.pictureUrl ?? null })
          .eq('line_user_id', r.line_user_id)
      } catch {
        /* 回填是加分項，失敗不影響名單回傳 */
      }
    }),
  )
  return rows
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const silentOnly = req.nextUrl.searchParams.get('silent') === '1'

  let q = sb
    .from('b2b_followers')
    .select('line_user_id, display_name, followed_at, first_message_at, last_contacted_at, unfollowed_at, note')
    .order('followed_at', { ascending: false })

  if (silentOnly) q = q.is('first_message_at', null).is('unfollowed_at', null)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = await backfillNames((data ?? []) as Row[])

  return NextResponse.json({
    ok: true,
    count: rows.length,
    silentOnly,
    followers: rows.map((r) => ({
      userId: r.line_user_id,
      name: r.display_name ?? '(未知)',
      followedAt: r.followed_at,
      // 這兩個欄位就是決定「要不要敲他」的依據
      hasSpoken: Boolean(r.first_message_at),
      lastContactedAt: r.last_contacted_at,
      unfollowed: Boolean(r.unfollowed_at),
      note: r.note,
    })),
  })
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { userId?: string; userIds?: string[]; text?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const text = (body.text ?? '').trim()
  const targets = [...new Set([...(body.userIds ?? []), ...(body.userId ? [body.userId] : [])])].filter(Boolean)

  if (!text) return NextResponse.json({ error: 'text 必填' }, { status: 400 })
  if (targets.length === 0) return NextResponse.json({ error: 'userId 或 userIds 必填（刻意不支援「發給全部」）' }, { status: 400 })

  const results: { userId: string; sent: boolean }[] = []
  for (const userId of targets) {
    const sent = await pushB2bMessage(userId, text)
    if (sent) {
      // 記下敲過的時間，避免同一個人被重複騷擾
      await sb
        .from('b2b_followers')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('line_user_id', userId)
    }
    results.push({ userId, sent })
  }

  const sentCount = results.filter((r) => r.sent).length
  // 有任何一則沒送出就回 502——「回 200 但其實沒送到」正是我們一再犯的錯
  return NextResponse.json(
    { ok: sentCount === targets.length, sent: sentCount, total: targets.length, results },
    { status: sentCount === targets.length ? 200 : 502 },
  )
}
