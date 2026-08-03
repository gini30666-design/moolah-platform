'use client'

// 滾動深度追蹤（GA4）——用來回答「人到底有沒有看完落地頁」。
// 沒有這個數據，就分不出「流量不對」還是「頁面不夠說服人」：
//   · 多數人 <25% 就離開 → 流量/首屏訊息問題
//   · 看到 75%+ 卻不行動 → CTA/說服力問題
// 只發一次/深度/頁面載入，被動監聽，對效能無影響（passive listener + rAF 節流）。
import { useEffect } from 'react'
import { trackEvent } from '@/lib/gtag'

const MARKS = [25, 50, 75, 100] as const

export default function ScrollDepthTracker({ label }: { label: string }) {
  useEffect(() => {
    const fired = new Set<number>()
    let ticking = false

    const measure = () => {
      ticking = false
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      if (scrollable <= 0) return
      const pct = ((window.scrollY || doc.scrollTop) / scrollable) * 100
      for (const m of MARKS) {
        if (pct >= m && !fired.has(m)) {
          fired.add(m)
          trackEvent('scroll_depth', { page: label, percent: m })
        }
      }
      if (fired.size === MARKS.length) cleanup()
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(measure)
    }

    const cleanup = () => window.removeEventListener('scroll', onScroll)

    window.addEventListener('scroll', onScroll, { passive: true })
    measure() // 短頁面/直接落在深處時也要記錄
    return cleanup
  }, [label])

  return null
}
