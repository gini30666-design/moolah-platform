import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import './globals.css'
import { ScrollReveal } from '@/components/ScrollReveal'
import PwaInit from '@/components/PwaInit'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#A68966',
}

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

const BASE_URL = 'https://moolah-platform.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: { default: 'MooLah — 質感生活，從容預約', template: '%s | MooLah' },
  description: '台灣美業智慧預約平台。髮型設計師、寵物美容、汽車美容、美甲師，透過 LINE 輕鬆預約，雙向即時通知。',
  keywords: ['預約', '髮型設計師', '寵物美容', '汽車美容', '美甲', 'LINE 預約', '台灣', 'MooLah'],
  authors: [{ name: 'MooLah', url: BASE_URL }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MooLah',
  },
  openGraph: {
    title: 'MooLah — 質感生活，從容預約',
    description: '台灣美業智慧預約平台，透過 LINE 輕鬆預約髮型設計師、寵物美容、汽車美容、美甲師。',
    siteName: 'MooLah',
    url: BASE_URL,
    type: 'website',
    locale: 'zh_TW',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MooLah — 質感生活，從容預約',
    description: '台灣美業智慧預約平台，透過 LINE 輕鬆預約。',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: BASE_URL },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" className={`${cormorant.variable} ${dmSans.variable}`}>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <ScrollReveal />
        <PwaInit />
        {children}
      </body>
    </html>
  )
}
