'use client'

// 招商漏斗前兩階的追蹤器：ViewContent（看到）→ Engaged（真的在讀）。
//
// 為什麼需要 Engaged（2026-08-13 GA4 揭穿的事）：
//   28 天 469 個到站，其中 **88.6% 停留不到 10 秒**。
//   如果只看「到站數」當分母，會誤以為落地頁轉換率很健康、問題只是量不夠；
//   用「真的有在讀的人」當分母才看得出落地頁到底行不行。
//   把 Engaged 也餵回 Meta，它才學得到「誰會認真讀」而不只是「誰愛點連結」。
//
// 與 ScrollDepthTracker 的分工：
//   ScrollDepthTracker → GA4 報表用（25/50/75/100 四段）
//   FunnelTracker      → 廣告平台用（Pixel + CAPI），只有 view / engaged 兩個事件

import { useEffect } from 'react'
import { trackPixel } from '@/components/MetaPixel'
import { trackEvent } from '@/lib/gtag'
import { captureAttribution } from '@/lib/attribution'
import { newEventId, GA_EVENT, ENGAGED_DWELL_MS, ENGAGED_SCROLL_PCT } from '@/lib/funnel'
import type { FunnelStage } from '@/lib/funnel'

/** Pixel + CAPI 各送一次、共用同一個 eventId → Meta 去重合併 */
function fire(stage: FunnelStage, extra?: Record<string, unknown>) {
  const eventId = newEventId(stage)
  trackPixel(stage, eventId, extra)
  // keepalive：使用者馬上關掉分頁時也要送得出去
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage, eventId, url: window.location.href }),
      keepalive: true,
    }).catch(() => {})
  } catch { /* 追蹤失敗絕不能擋住頁面 */ }
}

type Props = {
  page: string
  /**
   * 只收 UTM、不送 view/engaged 事件。
   * 給「不是廣告落地頁但有表單」的頁面用（例如首頁）——
   * 沒有它的話，那些頁面的表單送出時 `getAttribution()` 是空的，來源就掉了。
   * 但也不該讓它們的瀏覽混進 /pro 的漏斗與 Engaged 重定向池。
   */
  captureOnly?: boolean
}

export default function FunnelTracker({ page, captureOnly = false }: Props) {
  useEffect(() => {
    const attr = captureAttribution()
    if (captureOnly) return

    fire('view', { content_name: page })
    trackEvent(GA_EVENT.view, {
      page,
      utm_source: attr.utmSource ?? '(none)',
      utm_campaign: attr.utmCampaign ?? '(none)',
      utm_content: attr.utmContent ?? '(none)',
    })

    let done = false
    const markEngaged = (how: 'dwell' | 'scroll') => {
      if (done) return
      done = true
      fire('engaged', { content_name: page, trigger: how })
      trackEvent(GA_EVENT.engaged, { page, trigger: how })
      cleanup()
    }

    const timer = window.setTimeout(() => markEngaged('dwell'), ENGAGED_DWELL_MS)

    let ticking = false
    const measure = () => {
      ticking = false
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      if (scrollable <= 0) return
      const pct = ((window.scrollY || doc.scrollTop) / scrollable) * 100
      if (pct >= ENGAGED_SCROLL_PCT) markEngaged('scroll')
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(measure)
    }

    function cleanup() {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return cleanup
  }, [page, captureOnly])

  return null
}
