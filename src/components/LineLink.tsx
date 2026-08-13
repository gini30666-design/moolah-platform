'use client'

// 全站統一的「加 LINE 好友」連結。
//
// ⚠️ 2026-08-08：這個元件的存在是為了修一個造成大量流失的 bug。
// 詳見 lib/lineOA 的 openLineOA 註解——簡述：
//   直接用 https://line.me/R/... 在 Instagram / Facebook / 其他 App 的 in-app browser
//   裡會被攔截，顯示 LINE 的英文中間頁「Open LINE to continue / Download LINE」，
//   使用者要再按一次而且常常沒反應。改用 App scheme 直接喚起就沒有這個問題。
//
// 🔑 track 參數很重要，不要亂開：
//   true  = 招商動線（@492ejbwx）→ 上報 Google Ads「聯絡人」轉換 + Meta Pixel Contact
//   false = 消費者動線（@881zhkla，例如預約完加好友收提醒）
//           **絕對不能上報 B2B 轉換**，否則消費者的加好友會被算成招商成效，
//           廣告優化會朝錯的方向學習。
import type { CSSProperties, ReactNode, MouseEvent } from 'react'
import { ga, trackEvent } from '@/lib/gtag'
import { trackContact } from '@/components/MetaPixel'
import { newEventId } from '@/lib/funnel'
import { OA_B2B, lineAddFriendUrl, openLineOA } from '@/lib/lineOA'

/** 目前這個訪客被分到哪個 CTA 版本（由 /pro 的 inline script 寫在 <html> 上） */
function ctaVariant(): string {
  if (typeof document === 'undefined') return 'na'
  return document.documentElement.dataset.ctaVariant || 'na'
}

type Props = {
  /** 要加的 OA，預設招商窗口 */
  oaId?: string
  /** GA4 事件的來源標記 */
  source: string
  /** 是否上報招商轉換（Google Ads 聯絡人 / Meta Contact）。消費者動線一律 false。 */
  track?: boolean
  style?: CSSProperties
  className?: string
  children: ReactNode
}

export default function LineLink({
  oaId = OA_B2B, source, track = false, style, className, children,
}: Props) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    // 使用者主動要開新分頁（Cmd/Ctrl/Shift + 點擊、中鍵）時不攔截
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    try {
      if (track) {
        const variant = ctaVariant()
        const eventId = newEventId('contact')
        ga.clickLineOA(source, variant)   // 內含 Google Ads 轉換上報
        trackContact(eventId)
        // 伺服器端再送一次同 eventId：廣告封鎖器擋掉 fbq 時仍算得到。
        // ⚠️ keepalive 必要 —— 下一行就跳去 LINE App，一般 fetch 會被瀏覽器中斷。
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: 'contact', eventId, url: window.location.href }),
          keepalive: true,
        }).catch(() => {})
      } else {
        trackEvent('add_line_friend', { source, oa: oaId })
      }
    } catch { /* 追蹤失敗絕不能擋住跳轉 */ }
    openLineOA(oaId)
  }

  return (
    <a
      // 沒有 JS 時仍可用（也讓爬蟲看得到）；有 JS 時由 handleClick 接管
      href={lineAddFriendUrl(oaId)}
      rel="noopener noreferrer"
      className={className}
      style={style}
      onClick={handleClick}
    >
      {children}
    </a>
  )
}
