import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProviderPublic } from '@/lib/providerData'
import ProviderProfileClient from './ProviderProfileClient'

// 網站基底網址抽成 env → 之後買網域只要設 NEXT_PUBLIC_BASE_URL，無痛搬遷
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

type Params = { params: Promise<{ providerId: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { providerId } = await params
  const data = await getProviderPublic(providerId)
  if (!data) return { title: '找不到此職人 | MooLah', robots: { index: false } }

  const p = data.provider
  const store = p.store_name || p.name
  const where = p.district || ''
  const cat = p.category || '美業'
  const namePart = p.name && p.name !== store ? `・${p.name}` : ''
  const title = `${store}${namePart}｜${where}${cat}・線上預約`  // root layout template 會自動補「| MooLah」
  const desc = (p.tagline || p.description || `${where}${cat} ${store}，線上預約、作品集、服務價目一頁掌握。LINE 一鍵預約。`).replace(/\s+/g, ' ').trim().slice(0, 150)
  const url = `${BASE_URL}/${providerId}`
  const image = p.cover_url || p.avatar_url || ''

  return {
    title,
    description: desc,
    keywords: [store, p.name, `${where}${cat}`, `${where}預約`, cat, '線上預約', 'MooLah', p.specialties ?? ''].filter(Boolean) as string[],
    alternates: { canonical: url },
    openGraph: {
      title, description: desc, url, type: 'profile', siteName: 'MooLah',
      images: image ? [{ url: image }] : [],
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description: desc },
  }
}

export default async function ProviderPage({ params }: Params) {
  const { providerId } = await params
  const data = await getProviderPublic(providerId)
  if (!data) notFound()

  const { provider: p, services } = data
  const store = p.store_name || p.name
  const url = `${BASE_URL}/${providerId}`
  const image = p.cover_url || p.avatar_url || undefined

  // JSON-LD：在地美業 + 服務 offers + 評價 → Google 在地搜尋/精選摘要看得懂
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    '@id': url,
    name: store,
    url,
    ...(p.description ? { description: p.description } : {}),
    ...(image ? { image } : {}),
    ...(p.phone ? { telephone: p.phone } : {}),
    ...(p.instagram ? { sameAs: [`https://instagram.com/${p.instagram}`] } : {}),
    ...(p.address ? { address: { '@type': 'PostalAddress', addressLocality: p.district || '', streetAddress: p.address, addressCountry: 'TW' } } : {}),
    ...(p.district ? { areaServed: p.district } : {}),
    ...(p.rating && p.review_count ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.review_count } } : {}),
    ...(services.length ? {
      makesOffer: services.map(s => ({
        '@type': 'Offer',
        priceCurrency: 'TWD',
        ...(s.price ? { price: s.price } : {}),
        itemOffered: { '@type': 'Service', name: s.name, ...(s.description ? { description: s.description } : {}) },
      })),
    } : {}),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProviderProfileClient />
    </>
  )
}
