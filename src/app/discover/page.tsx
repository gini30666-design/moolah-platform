import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import DiscoverClient from './DiscoverClient'

const BASE_URL = 'https://moolah-platform.vercel.app'

export const metadata: Metadata = {
  title: '探索美業職人 — 髮型、寵物美容、美甲線上預約 | MooLah',
  description: '探索台灣優質美業職人。高雄、台南、台中、台北髮型設計師、寵物美容師、汽車美容師、美甲師，選擇縣市即可找到附近職人，透過 LINE 一鍵預約。',
  alternates: { canonical: `${BASE_URL}/discover` },
  openGraph: {
    title: '探索美業職人 | MooLah',
    description: '台灣各地美業職人探索平台。選擇服務類別與縣市，找到優質職人，透過 LINE 一鍵預約。',
    url: `${BASE_URL}/discover`,
  },
}

const STATIC_CATS = [
  { id: '髮型設計師', en: 'Hair Designer', desc: '剪髮、染髮、燙髮' },
  { id: '寵物美容師', en: 'Pet Grooming', desc: '毛孩洗澡、剃毛、造型' },
  { id: '汽車美容師', en: 'Auto Detailing', desc: '鍍膜、打蠟、清潔' },
  { id: '美甲師', en: 'Nail Artist', desc: '光療、凝膠、手繪' },
]

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const params = await searchParams
  const initialCategory = params.category ?? ''

  return (
    <Suspense
      fallback={
        <div style={{ background: 'var(--charcoal-deep)', minHeight: '100vh' }}>
          <nav
            style={{ background: 'rgba(26,23,20,0.96)', borderBottom: '1px solid rgba(166,137,102,0.18)' }}
            className="sticky top-0 z-40"
          >
            <div className="max-w-md mx-auto flex items-center px-5 h-14">
              <Link href="/" className="font-display text-base tracking-[.18em] uppercase" style={{ color: 'var(--cream)' }}>
                MooLah
              </Link>
            </div>
          </nav>
          <div className="max-w-md mx-auto px-5 pt-9 pb-10">
            <h1 className="font-display leading-tight mb-3" style={{ fontSize: 'clamp(2.2rem,9vw,3rem)', fontWeight: 300, color: 'var(--cream)' }}>
              探索優質職人
            </h1>
            <p className="text-sm mb-7" style={{ color: 'rgba(166,137,102,0.7)' }}>
              台灣各地髮型設計師、寵物美容師、汽車美容師、美甲師，高雄、台南、台中、台北均有合作職人。
            </p>
            <div className="grid grid-cols-2 gap-3">
              {STATIC_CATS.map(cat => (
                <Link
                  key={cat.id}
                  href={`/discover?category=${encodeURIComponent(cat.id)}`}
                  className="p-4"
                  style={{
                    border: '1px solid rgba(166,137,102,0.22)',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'block',
                  }}
                >
                  <div className="font-display text-base" style={{ color: 'var(--cream)', fontWeight: 300 }}>{cat.id}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'rgba(166,137,102,0.7)' }}>{cat.en}</div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(214,197,178,0.5)' }}>{cat.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <DiscoverClient initialCategory={initialCategory} />
    </Suspense>
  )
}
