import { NextRequest, NextResponse } from 'next/server'
import { sb } from '@/lib/supabase'
import { getAuthUserId } from '@/lib/auth'
import { computeBalance, isCardExpired, formatCredit, type CreditKind } from '@/lib/credits'

/**
 * 客人查自己的儲值卡／次卡餘額與流水帳。
 *
 * 🔑 為什麼這支一定要驗 token（而 /api/my-bookings 只吃 userId 參數）：
 * 這裡回傳的是「錢」。userId 雖然難猜，但拿它當唯一憑證等於誰知道 ID 誰就看得到餘額。
 * 改成用 LIFF access token 向 LINE 換回 userId，只有本人拿得到。
 *
 * 只讀。客人永遠不能改自己的餘額——加值與扣款只能由職人在後台操作。
 */

export const maxDuration = 20

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')

  const userId = await getAuthUserId(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let q = sb.from('customer_credits')
    .select('id, provider_id, kind, title, expires_on, refund_terms, status, created_at')
    .eq('customer_line_user_id', userId)
    .order('created_at', { ascending: false })
  if (providerId) q = q.eq('provider_id', providerId)

  const { data: cards, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!cards?.length) return NextResponse.json({ cards: [] })

  const { data: entries } = await sb.from('credit_ledger')
    .select('credit_id, entry_type, delta, memo, service_name, created_at')
    .in('credit_id', cards.map(c => c.id))
    .order('created_at', { ascending: false })

  // 職人名稱（一次撈完，避免 N+1）
  const providerIds = [...new Set(cards.map(c => c.provider_id))]
  const { data: provs } = await sb.from('providers').select('id, name').in('id', providerIds)
  const nameOf = new Map((provs ?? []).map(p => [p.id, p.name as string]))

  return NextResponse.json({
    cards: cards.map(c => {
      const rows = (entries ?? []).filter(e => e.credit_id === c.id)
      const balance = computeBalance(rows)
      const kind = c.kind as CreditKind
      return {
        id: c.id,
        providerId: c.provider_id,
        providerName: nameOf.get(c.provider_id) ?? '',
        kind,
        title: c.title,
        status: c.status,
        expiresOn: c.expires_on,
        refundTerms: c.refund_terms,
        expired: isCardExpired(c.expires_on),
        balance,
        balanceText: formatCredit(kind, balance),
        entries: rows.map(e => ({
          type: e.entry_type,
          delta: Number(e.delta),
          deltaText: `${Number(e.delta) >= 0 ? '+' : '−'}${formatCredit(kind, Math.abs(Number(e.delta)))}`,
          memo: e.memo,
          serviceName: e.service_name,
          createdAt: e.created_at,
        })),
      }
    }),
  })
}
