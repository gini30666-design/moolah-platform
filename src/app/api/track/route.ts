import { NextResponse } from 'next/server'
import { sendCapiEvent, capiUserFromRequest, capiEnabled } from '@/lib/metaCapi'
import { rateLimit, clientIp } from '@/lib/rateLimit'
import type { FunnelStage } from '@/lib/funnel'

// 瀏覽器事件的 CAPI 鏡像端點。
//
// 瀏覽器已經用 fbq() 送過一次了，這裡帶**同一個 eventId** 再從伺服器送一次，
// Meta 會去重合併。目的是在廣告封鎖器／iOS 隱私防護／in-app browser 把
// fbq() 擋掉時，事件仍然算得到。
//
// ⚠️ 只開放瀏覽器真的會觸發的三個階段。
//    lead 由 /api/leads 在伺服器端送、trial 由 /api/claim 送、paid 由帳務流程送 ——
//    那些是「錢」的事件，不能讓前端隨便打。
const CLIENT_ALLOWED = new Set<FunnelStage>(['view', 'engaged', 'contact'])

export async function POST(req: Request) {
  try {
    if (!capiEnabled()) return NextResponse.json({ ok: false, reason: 'capi_off' })

    // view 每次載入都會打 → 額度放寬；contact 是轉換事件 → 一樣走這個上限就夠擋洗量
    if (!rateLimit(`track:${clientIp(req)}`, 40, 60_000)) {
      return NextResponse.json({ ok: false, reason: 'rate_limited' }, { status: 429 })
    }

    const { stage, eventId, url } = await req.json()
    if (!CLIENT_ALLOWED.has(stage)) {
      return NextResponse.json({ ok: false, reason: 'stage_not_allowed' }, { status: 400 })
    }

    const sent = await sendCapiEvent(stage as FunnelStage, capiUserFromRequest(req), {
      eventId: typeof eventId === 'string' ? eventId : undefined,
      eventSourceUrl: typeof url === 'string' ? url : undefined,
      actionSource: 'website',
    })
    return NextResponse.json({ ok: sent })
  } catch (e) {
    console.error('[track]', e)
    // 追蹤端點不回 500 —— 前端不需要知道，也不該因此顯示錯誤
    return NextResponse.json({ ok: false })
  }
}
