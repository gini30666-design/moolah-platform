import type { Metadata } from 'next'
import Link from 'next/link'
import { POSTS } from '@/lib/blog'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

export const metadata: Metadata = {
  title: 'MooLah 部落格 | 預約經營、美業保養一次看懂',
  description: 'MooLah 部落格：給美業職人的 LINE 預約經營指南（選系統、降爽約、接單），也給消費者的採耳、做臉、按摩保養攻略。少走冤枉路，把時間花在手藝上。',
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    title: 'MooLah 部落格',
    description: '給美業職人的預約經營指南，與給消費者的保養攻略。',
    url: `${BASE_URL}/blog`,
  },
}

export default function BlogIndex() {
  const pro = POSTS.filter(p => p.audience === 'pro')
  const consumer = POSTS.filter(p => p.audience === 'consumer')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'MooLah 部落格',
    url: `${BASE_URL}/blog`,
    blogPost: POSTS.map(p => ({
      '@type': 'BlogPosting',
      headline: p.h1,
      url: `${BASE_URL}/blog/${p.slug}`,
      datePublished: p.published,
      dateModified: p.updated,
    })),
  }

  const Card = ({ slug, emoji, tag, h1, description, readMin }: (typeof POSTS)[number]) => (
    <Link href={`/blog/${slug}`} style={{ background: 'white', padding: '22px 24px', borderRadius: 16, border: '1px solid rgba(166,137,102,0.2)', textDecoration: 'none', display: 'block' }}>
      <p style={{ fontSize: 30, marginBottom: 10 }}>{emoji}</p>
      <p style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--oak)', textTransform: 'uppercase', marginBottom: 8 }}>{tag} · 約 {readMin} 分鐘</p>
      <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 8, lineHeight: 1.45 }}>{h1}</h3>
      <p style={{ fontSize: 13, color: 'rgba(44,40,37,0.6)', lineHeight: 1.7 }}>{description}</p>
    </Link>
  )

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main style={{ background: 'var(--cream)', minHeight: '100vh' }}>
        {/* Hero */}
        <section style={{ background: 'var(--charcoal-deep)', padding: '84px 24px 56px', textAlign: 'center', color: 'var(--cream)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--oak), transparent)' }} />
          <p style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--oak)', textTransform: 'uppercase', marginBottom: 16 }}>MooLah Journal</p>
          <h1 className="font-display" style={{ fontSize: 'clamp(2rem,6vw,3.4rem)', fontWeight: 300, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.01em' }}>把時間花在手藝，其他交給我們</h1>
          <p style={{ fontSize: 'clamp(14px,2vw,16px)', color: 'rgba(251,249,244,0.65)', maxWidth: 600, margin: '0 auto', lineHeight: 1.8 }}>給美業職人的預約經營指南，也給消費者的保養攻略。</p>
        </section>

        {/* 職人經營 */}
        <section style={{ maxWidth: 980, margin: '0 auto', padding: '56px 24px 20px' }}>
          <h2 className="font-display" style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', color: 'var(--charcoal)', fontWeight: 400, marginBottom: 6 }}>職人經營</h2>
          <p style={{ fontSize: 13, color: 'rgba(44,40,37,0.55)', marginBottom: 26 }}>用 LINE 預約系統少走冤枉路</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {pro.map(p => <Card key={p.slug} {...p} />)}
          </div>
        </section>

        {/* 保養攻略 */}
        <section style={{ maxWidth: 980, margin: '0 auto', padding: '40px 24px 70px' }}>
          <h2 className="font-display" style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', color: 'var(--charcoal)', fontWeight: 400, marginBottom: 6 }}>保養攻略</h2>
          <p style={{ fontSize: 13, color: 'rgba(44,40,37,0.55)', marginBottom: 26 }}>採耳、做臉、按摩，體驗前先看懂</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {consumer.map(p => <Card key={p.slug} {...p} />)}
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: '28px 24px', textAlign: 'center', background: 'var(--charcoal-deep)', color: 'var(--oak-dim)', fontSize: 12 }}>
          <p>© 2026 永翔數位有限公司 MooLah · <Link href="/" style={{ color: 'var(--oak)', textDecoration: 'none' }}>回首頁</Link></p>
        </footer>
      </main>
    </>
  )
}
