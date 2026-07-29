'use client'

// 加 LINE 連結（會回報 Google Ads「聯絡人」轉換 + GA4 click_line_oa）
// 只多一個點擊上報，樣式/行為與原本的 <a> 完全相同（target=_blank 開 LINE）
import type { CSSProperties, ReactNode } from 'react'
import { ga } from '@/lib/gtag'
import { trackContact } from '@/components/MetaPixel'

type Props = {
  href: string
  source: string
  style?: CSSProperties
  className?: string
  children: ReactNode
}

export default function TrackedLineLink({ href, source, style, className, children }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      onClick={() => { ga.clickLineOA(source); trackContact() }}
    >
      {children}
    </a>
  )
}
