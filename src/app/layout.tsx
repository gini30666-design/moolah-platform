import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, DM_Sans, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { ScrollReveal } from '@/components/ScrollReveal'
import PwaInit from '@/components/PwaInit'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import MetaPixel from '@/components/MetaPixel'

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

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

const BASE_URL = 'https://moolah-platform.vercel.app'

const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: 'MooLah',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/icons/icon-512.png`,
        width: 512,
        height: 512,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'moolah118@gmail.com',
        contactType: 'customer service',
        areaServed: 'TW',
        availableLanguage: 'zh-TW',
      },
      sameAs: ['https://line.me/R/ti/p/@881zhkla'],
    },
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: 'MooLah',
      description: '台灣美業智慧預約平台，透過 LINE 輕鬆預約髮型設計師、寵物美容、汽車美容、美甲師。',
      publisher: { '@id': `${BASE_URL}/#organization` },
      inLanguage: 'zh-Hant-TW',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${BASE_URL}/discover?category={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: { default: 'MooLah — 質感生活 從容預約', template: '%s | MooLah' },
  description: '台灣美業智慧預約平台。髮型設計師、寵物美容、汽車美容、美甲師，透過 LINE 輕鬆預約，雙向即時通知。',
  keywords: ['預約', '髮型設計師', '寵物美容', '汽車美容', '美甲', 'LINE 預約', '台灣', '高雄', 'MooLah'],
  authors: [{ name: 'MooLah', url: BASE_URL }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MooLah',
  },
  openGraph: {
    title: 'MooLah — 質感生活 從容預約',
    description: '台灣美業智慧預約平台，透過 LINE 輕鬆預約髮型設計師、寵物美容、汽車美容、美甲師。',
    siteName: 'MooLah',
    url: BASE_URL,
    type: 'website',
    locale: 'zh_TW',
    images: [{ url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'MooLah — 質感生活 從容預約' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MooLah — 質感生活 從容預約',
    description: '台灣美業智慧預約平台，透過 LINE 輕鬆預約。',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" className={`${cormorant.variable} ${dmSans.variable} ${plusJakartaSans.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@300;400;500&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="google-site-verification" content="PVuQFoOLnjD9ewRjnQUOZrhHCLJQyGLut-_Pe0q1QZc" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_SCHEMA) }}
        />
      </head>
      <body>
        <GoogleAnalytics />
        <MetaPixel />
        <ScrollReveal />
        <PwaInit />
        {children}
      </body>
    </html>
  )
}
