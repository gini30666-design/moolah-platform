'use client'

// 加 LINE 連結（回報 Google Ads「聯絡人」轉換 + GA4 click_line_oa）
//
// ⚠️ 2026-08-08 重寫，修掉一個造成大量流失的 bug：
//  1) 原本 href 直接指向 https://line.me/R/...（universal link）。
//     在 Instagram / Facebook 的 in-app browser 裡會被攔截，變成 LINE 的英文中間頁
//     「Open LINE to continue / Download LINE」，使用者要再按一次，而且常常按了沒反應。
//     Reels 廣告的流量 100% 都在 in-app browser 內 → 這是最大的漏斗破口。
//  2) 原本還加了 target="_blank"，在 in-app browser 開新分頁會讓 universal link
//     更難喚起 App，甚至被彈窗阻擋。
//
// 現在：點擊 → App scheme 直接跳進 LINE 加好友畫面，喚不起才 fallback https。
// 使用者不需要多按任何一次，也不會看到英文頁。
import type { CSSProperties, ReactNode, MouseEvent } from 'react'
import { ga } from '@/lib/gtag'
import { trackContact } from '@/components/MetaPixel'
import { OA_B2B, lineAddFriendUrl, openLineOA } from '@/lib/lineOA'

type Props = {
  source: string
  /** 要加的 OA，預設招商窗口 @492ejbwx */
  oaId?: string
  style?: CSSProperties
  className?: string
  children: ReactNode
}

export default function TrackedLineLink({ source, oaId = OA_B2B, style, className, children }: Props) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    // 讓使用者用「在新分頁開啟」等原生操作時不被攔截
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    try { ga.clickLineOA(source); trackContact() } catch { /* 追蹤失敗不能擋住跳轉 */ }
    openLineOA(oaId)
  }

  return (
    <a
      // 沒有 JS 時仍可用；有 JS 時被 handleClick 接管
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
