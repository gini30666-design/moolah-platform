import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import './globals.css'
import { ScrollReveal } from '@/components/ScrollReveal'

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'MooLah — 質感生活，從容預約',
  description: '台灣首個美業智慧預約平台。髮型設計師、寵物美容、汽車美容、美甲師，透過 LINE 輕鬆預約，雙向即時通知。',
  openGraph: {
    title: 'MooLah — 質感生活，從容預約',
    description: '台灣首個美業智慧預約平台',
    siteName: 'MooLah',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body>
        <ScrollReveal />
        {children}
      </body>
    </html>
  )
}
