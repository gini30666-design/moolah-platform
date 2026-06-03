'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Review = {
  rating: number
  comment: string
  customerName: string
  providerId: string
  providerName: string
  storeName: string
  createdAt: string
}

export default function TestimonialWall() {
  const [reviews, setReviews] = useState<Review[] | null>(null)

  useEffect(() => {
    fetch('/api/reviews-feed')
      .then(r => r.json())
      .then((d: { items: Review[] }) => setReviews(d.items))
      .catch(() => setReviews([]))
  }, [])

  // 評價尚少時不要顯示這區（避免空白尷尬）
  if (reviews !== null && reviews.length === 0) return null

  return (
    <section className="py-16 lg:py-24 px-5 lg:px-16" style={{ background: 'var(--sand)' }}>
      <div className="max-w-[1440px] mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <span className="text-xs tracking-[.22em] uppercase block mb-4" style={{ color: 'var(--oak)' }}>VOICES</span>
          <h2 className="font-display" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', color: 'var(--charcoal)', fontWeight: 400 }}>
            真實客戶<span style={{ fontStyle: 'italic', color: 'var(--oak)' }}>的話</span>
          </h2>
          <p className="text-sm mt-3 max-w-md mx-auto" style={{ color: 'rgba(44,40,37,0.55)' }}>
            每一則評價都來自實際完成預約的客戶
          </p>
        </div>

        {reviews === null ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ height: '180px', background: 'white', borderRadius: '14px', opacity: 0.5 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {reviews.map((r, i) => (
              <div
                key={i}
                style={{
                  background: 'white',
                  borderRadius: '14px',
                  padding: '22px 22px 18px',
                  border: '1px solid rgba(166,137,102,0.18)',
                  boxShadow: '0 2px 12px rgba(26,23,20,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '170px',
                }}
              >
                <div style={{ display: 'flex', gap: '2px', marginBottom: '12px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} style={{ color: s <= r.rating ? 'var(--oak)' : 'rgba(166,137,102,0.2)', fontSize: '14px' }}>★</span>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: '14px',
                    color: 'var(--charcoal)',
                    lineHeight: 1.7,
                    flex: 1,
                    fontFamily: 'var(--font-noto-serif-tc), "Noto Serif TC", serif',
                  }}
                >
                  「{r.comment.length > 90 ? r.comment.slice(0, 90) + '…' : r.comment}」
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(166,137,102,0.15)' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(44,40,37,0.55)' }}>
                    {r.customerName}
                  </span>
                  <Link
                    href={`/${r.providerId}`}
                    style={{ fontSize: '11px', color: 'var(--oak)', textDecoration: 'none', letterSpacing: '0.04em' }}
                  >
                    @ {r.storeName || r.providerName} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
