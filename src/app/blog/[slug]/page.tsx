import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPost, POSTS } from '@/lib/blog'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

export function generateStaticParams() {
  return POSTS.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return { title: 'MooLah 部落格' }
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `${BASE_URL}/blog/${post.slug}` },
    openGraph: {
      title: post.h1,
      description: post.description,
      url: `${BASE_URL}/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.published,
      modifiedTime: post.updated,
    },
  }
}

export default async function BlogArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: post.h1,
        description: post.description,
        datePublished: post.published,
        dateModified: post.updated,
        author: { '@type': 'Organization', name: '永翔數位有限公司 MooLah' },
        publisher: {
          '@type': 'Organization',
          name: 'MooLah',
          logo: { '@type': 'ImageObject', url: `${BASE_URL}/icons/icon-192.png` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}/blog/${post.slug}` },
      },
      {
        '@type': 'FAQPage',
        mainEntity: post.faq.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首頁', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: '部落格', item: `${BASE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: post.h1, item: `${BASE_URL}/blog/${post.slug}` },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main style={{ background: 'var(--cream)', minHeight: '100vh' }}>
        {/* Hero */}
        <article>
          <header style={{ background: 'var(--charcoal-deep)', padding: '80px 24px 56px', textAlign: 'center', color: 'var(--cream)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--oak), transparent)' }} />
            <p style={{ fontSize: 46, marginBottom: 14 }}>{post.emoji}</p>
            <p style={{ fontSize: 11, letterSpacing: '0.28em', color: 'var(--oak)', textTransform: 'uppercase', marginBottom: 16 }}>{post.tag} · 約 {post.readMin} 分鐘</p>
            <h1 className="font-display" style={{ fontSize: 'clamp(1.7rem,5vw,3rem)', fontWeight: 300, lineHeight: 1.25, maxWidth: 760, margin: '0 auto', letterSpacing: '-0.01em' }}>{post.h1}</h1>
          </header>

          {/* Body */}
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 20px' }}>
            <p style={{ fontSize: 16, color: 'var(--charcoal)', lineHeight: 1.9, marginBottom: 8, fontWeight: 500 }}>{post.intro}</p>

            {post.sections.map((s, i) => (
              <section key={i} style={{ marginTop: 36 }}>
                {s.h && (
                  <h2 className="font-display" style={{ fontSize: 'clamp(1.35rem,3vw,1.7rem)', color: 'var(--charcoal)', fontWeight: 500, marginBottom: 14, lineHeight: 1.4 }}>{s.h}</h2>
                )}
                {s.p?.map((para, j) => (
                  <p key={j} style={{ fontSize: 15, color: 'rgba(44,40,37,0.82)', lineHeight: 1.9, marginBottom: 14 }}>{para}</p>
                ))}
                {s.ul && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 8px' }}>
                    {s.ul.map((li, j) => (
                      <li key={j} style={{ fontSize: 15, color: 'rgba(44,40,37,0.82)', lineHeight: 1.75, marginBottom: 10, paddingLeft: 22, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0, color: 'var(--oak)' }}>◆</span>{li}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* FAQ */}
          <section style={{ maxWidth: 720, margin: '0 auto', padding: '20px 24px 40px' }}>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.35rem,3vw,1.7rem)', color: 'var(--charcoal)', fontWeight: 500, marginBottom: 18 }}>常見問題</h2>
            {post.faq.map((f, i) => (
              <details key={i} style={{ background: 'white', borderRadius: 12, marginBottom: 10, padding: '14px 20px', border: '1px solid rgba(166,137,102,0.18)' }}>
                <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--charcoal)', listStyle: 'none' }}>{f.q}</summary>
                <p style={{ marginTop: 12, fontSize: 13, color: 'rgba(44,40,37,0.7)', lineHeight: 1.8 }}>{f.a}</p>
              </details>
            ))}
          </section>
        </article>

        {/* CTA */}
        <section style={{ background: 'var(--oak)', padding: '44px 24px', textAlign: 'center' }}>
          <p className="font-display" style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', color: 'var(--cream)', fontWeight: 400, marginBottom: 18 }}>{post.ctaTitle}</p>
          <Link href={post.ctaHref}
            style={{ display: 'inline-block', padding: '13px 32px', background: 'var(--charcoal)', color: 'var(--cream)', borderRadius: 8, fontSize: 13, letterSpacing: '0.16em', textDecoration: 'none', fontWeight: 600 }}>
            {post.ctaLabel}
          </Link>
        </section>

        {/* Related */}
        {post.related.length > 0 && (
          <section style={{ maxWidth: 720, margin: '0 auto', padding: '44px 24px 20px' }}>
            <h2 className="font-display" style={{ fontSize: '1.3rem', color: 'var(--charcoal)', fontWeight: 500, marginBottom: 16 }}>延伸閱讀</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {post.related.map((r, i) => (
                <Link key={i} href={r.href} style={{ background: 'white', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(166,137,102,0.2)', textDecoration: 'none', color: 'var(--charcoal)', fontSize: 14, fontWeight: 500 }}>
                  {r.label} →
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer style={{ padding: '28px 24px', textAlign: 'center', background: 'var(--charcoal-deep)', color: 'var(--oak-dim)', fontSize: 12 }}>
          <p><Link href="/blog" style={{ color: 'var(--oak)', textDecoration: 'none' }}>← 回部落格</Link> · © 2026 永翔數位有限公司 MooLah</p>
        </footer>
      </main>
    </>
  )
}
