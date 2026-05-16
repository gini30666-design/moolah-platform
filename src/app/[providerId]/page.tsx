'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import liff from '@line/liff'

type Provider = {
  id: string; name: string; category: string; description: string
  avatarUrl: string; coverUrl: string; storeName: string; address: string
  businessHours: string; phone: string; instagram: string
}
type Service  = { id: string; name: string; price: number; duration: number }
type Portfolio = { id: string; imageUrl: string; caption: string }

const CAT_ACCENT: Record<string, { bg: string; text: string }> = {
  '髮型設計師': { bg: 'rgba(196,168,130,0.18)', text: '#c4a882' },
  '寵物美容師': { bg: 'rgba(168,184,160,0.18)', text: '#7a9e72' },
  '汽車美容師': { bg: 'rgba(154,175,186,0.18)', text: '#7a9fba' },
  '美甲師':    { bg: 'rgba(196,168,176,0.18)', text: '#c4a8b0' },
}

const CAT_ICON: Record<string, string> = {
  '髮型設計師': '✂',
  '寵物美容師': '🐾',
  '汽車美容師': '✦',
  '美甲師':    '◆',
}

export default function ProviderPage() {
  const { providerId } = useParams<{ providerId: string }>()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [portfolio, setPortfolio] = useState<Portfolio[]>([])

  useEffect(() => { liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! }) }, [])

  useEffect(() => {
    fetch(`/api/provider/${providerId}`)
      .then(r => r.json())
      .then(data => {
        setProvider(data.provider)
        setServices(data.services)
        setPortfolio(data.portfolio ?? [])
      })
  }, [providerId])

  if (!provider) {
    return (
      <div style={{ background: 'var(--charcoal-deep)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: '2px solid rgba(166,137,102,0.2)',
            borderTop: '2px solid #A68966',
            animation: 'spin 0.9s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: 'rgba(251,249,244,0.3)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>載入中</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const cat = CAT_ACCENT[provider.category] ?? { bg: 'rgba(166,137,102,0.18)', text: '#A68966' }
  const catIcon = CAT_ICON[provider.category] ?? '✦'

  return (
    <div style={{ background: 'var(--sand)', minHeight: '100vh', fontFamily: 'var(--font-dm-sans)', maxWidth: '480px', margin: '0 auto' }}>

      {/* ── Hero ─────────────────────────────────────── */}
      <div style={{ position: 'relative', height: '300px', background: 'var(--charcoal-deep)', overflow: 'hidden' }}>

        {/* Cover photo or fallback pattern */}
        {provider.coverUrl
          ? <img src={provider.coverUrl} alt="封面" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
          : <div style={{
              position: 'absolute', inset: 0, opacity: 0.06,
              backgroundImage: 'repeating-linear-gradient(135deg, var(--oak) 0px, var(--oak) 1px, transparent 1px, transparent 36px)',
            }} />
        }

        {/* Overlay: darken cover photo for readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: provider.coverUrl
            ? 'linear-gradient(to bottom, rgba(26,23,20,0.45) 0%, rgba(26,23,20,0.15) 50%, rgba(245,239,230,1) 100%)'
            : 'radial-gradient(ellipse 70% 60% at 30% 60%, rgba(166,137,102,0.18) 0%, transparent 70%)',
        }} />

        {/* Top gradient fade for nav */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '80px',
          background: 'linear-gradient(to bottom, rgba(26,23,20,0.7) 0%, transparent 100%)',
        }} />

        {/* Nav */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <a href="/discover" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(251,249,244,0.55)', fontSize: '11px', letterSpacing: '0.18em', textDecoration: 'none', textTransform: 'uppercase' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '14px', height: '14px' }}>
              <path d="M10 4L6 8l4 4"/>
            </svg>
            探索
          </a>
          {/* Category badge */}
          <span style={{
            fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
            padding: '5px 12px', borderRadius: '999px',
            background: cat.bg, color: cat.text,
            border: `1px solid ${cat.text}44`,
          }}>
            {catIcon} {provider.category}
          </span>
        </div>

        {/* Large decorative letter */}
        <div style={{
          position: 'absolute', right: '-10px', top: '40px',
          fontSize: '160px', lineHeight: 1, fontFamily: 'var(--font-cormorant)',
          color: 'rgba(166,137,102,0.07)', fontWeight: 300, userSelect: 'none',
          letterSpacing: '-0.05em',
        }}>
          {provider.name[0]}
        </div>

        {/* Thin oak accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(to right, transparent, var(--oak), transparent)',
        }} />
      </div>

      {/* ── Avatar + Identity ───────────────────────── */}
      <div style={{ padding: '0 20px 20px', marginTop: '-68px', position: 'relative', zIndex: 10 }}>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '16px' }}>
          <div style={{
            width: '100px', height: '100px', flexShrink: 0,
            borderRadius: '24px',
            padding: '2.5px',
            background: 'linear-gradient(135deg, var(--oak) 0%, rgba(166,137,102,0.25) 100%)',
            boxShadow: '0 8px 32px rgba(26,23,20,0.32)',
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '22px',
              background: 'var(--charcoal-deep)', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {provider.avatarUrl
                ? <img src={provider.avatarUrl} alt={provider.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '38px', color: 'var(--oak)', fontWeight: 300 }}>{provider.name[0]}</span>
              }
            </div>
          </div>

          {/* Verified badge */}
          <div style={{ paddingBottom: '8px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '999px',
              background: 'rgba(166,137,102,0.12)', border: '1px solid rgba(166,137,102,0.28)',
              marginBottom: '6px',
            }}>
              <svg viewBox="0 0 12 12" fill="none" style={{ width: '10px', height: '10px', flexShrink: 0 }}>
                <circle cx="6" cy="6" r="5.5" fill="#A68966" opacity="0.9"/>
                <path d="M3.5 6L5.2 7.8L8.5 4.2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: '9px', color: 'var(--oak)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500 }}>MooLah 認證</span>
            </div>
          </div>
        </div>

        {/* Name + Store */}
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '30px', fontWeight: 400, color: 'var(--charcoal)', letterSpacing: '0.01em', marginBottom: '2px', lineHeight: 1.1 }}>
          {provider.name}
        </h1>
        {provider.storeName && (
          <p style={{ fontSize: '13px', color: 'rgba(44,40,37,0.5)', marginBottom: '10px' }}>{provider.storeName}</p>
        )}

        {/* Social links */}
        {(provider.instagram || provider.phone) && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {provider.instagram && (
              <a
                href={`https://instagram.com/${provider.instagram.replace('@','')}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '5px 12px', borderRadius: '999px',
                  background: 'white', border: '1px solid rgba(166,137,102,0.2)',
                  fontSize: '12px', color: 'rgba(44,40,37,0.65)', textDecoration: 'none',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '13px', height: '13px' }}>
                  <rect x="2" y="2" width="16" height="16" rx="5"/>
                  <circle cx="10" cy="10" r="3.5"/>
                  <circle cx="14.5" cy="5.5" r="0.75" fill="currentColor" stroke="none"/>
                </svg>
                {provider.instagram}
              </a>
            )}
            {provider.phone && (
              <a
                href={`tel:${provider.phone}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '5px 12px', borderRadius: '999px',
                  background: 'white', border: '1px solid rgba(166,137,102,0.2)',
                  fontSize: '12px', color: 'rgba(44,40,37,0.65)', textDecoration: 'none',
                }}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '12px', height: '12px', color: 'var(--oak)' }}>
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                </svg>
                {provider.phone}
              </a>
            )}
          </div>
        )}

        {provider.description && (
          <p style={{ fontSize: '14px', lineHeight: 1.75, color: 'rgba(44,40,37,0.6)', maxWidth: '340px' }}>
            {provider.description}
          </p>
        )}
      </div>

      {/* Divider */}
      <div style={{ margin: '0 20px 24px', height: '1px', background: 'linear-gradient(to right, var(--oak), rgba(166,137,102,0.08))' }} />

      {/* ── Studio Info ──────────────────────────────── */}
      {(provider.address || provider.businessHours) && (
        <section data-animate data-delay="100" style={{ margin: '0 20px 24px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--oak)', marginBottom: '12px', paddingLeft: '2px' }}>Studio Info</p>
          <div style={{
            background: 'white',
            border: '1px solid rgba(166,137,102,0.14)',
            borderRadius: '18px',
            overflow: 'hidden',
          }}>
            {provider.address && (
              <div style={{
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                padding: '16px 18px',
                borderBottom: provider.businessHours ? '1px solid rgba(166,137,102,0.09)' : 'none',
              }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(166,137,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '14px', height: '14px', color: 'var(--oak)' }}>
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(44,40,37,0.35)', marginBottom: '3px' }}>地址</p>
                  <p style={{ fontSize: '14px', color: 'rgba(44,40,37,0.75)', lineHeight: 1.5 }}>{provider.address}</p>
                </div>
              </div>
            )}
            {provider.businessHours && (
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px 18px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(166,137,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '14px', height: '14px', color: 'var(--oak)' }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(44,40,37,0.35)', marginBottom: '3px' }}>營業時間</p>
                  <p style={{ fontSize: '14px', color: 'rgba(44,40,37,0.75)', lineHeight: 1.5 }}>{provider.businessHours}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Services ─────────────────────────────────── */}
      <section data-animate data-delay="150" style={{ margin: '0 20px 24px' }}>
        <p style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--oak)', marginBottom: '12px', paddingLeft: '2px' }}>Services</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {services.map((s, i) => (
            <a
              key={s.id}
              href={`/${providerId}/book?service=${s.id}`}
              style={{
                display: 'flex', alignItems: 'center',
                background: 'white',
                border: '1px solid rgba(166,137,102,0.14)',
                borderRadius: '16px',
                overflow: 'hidden',
                textDecoration: 'none',
                transition: 'transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.2s cubic-bezier(0.25,0.46,0.45,0.94)',
                animationDelay: `${i * 40}ms`,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(26,23,20,0.08)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = ''
                ;(e.currentTarget as HTMLElement).style.boxShadow = ''
              }}
            >
              {/* Accent bar */}
              <div style={{ width: '3px', alignSelf: 'stretch', background: 'linear-gradient(to bottom, var(--oak), rgba(166,137,102,0.3))', flexShrink: 0 }} />

              <div style={{ flex: 1, padding: '14px 14px 14px 16px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--charcoal)', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</p>
                  {/* Duration badge */}
                  <span style={{
                    display: 'inline-block', fontSize: '10px', letterSpacing: '0.1em',
                    padding: '2px 8px', borderRadius: '999px',
                    background: 'rgba(166,137,102,0.1)', color: 'var(--oak)',
                    border: '1px solid rgba(166,137,102,0.2)',
                  }}>
                    {s.duration} 分鐘
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--charcoal)' }}>
                    NT$ {s.price.toLocaleString()}
                  </p>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: 'rgba(166,137,102,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--oak)',
                  }}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '12px', height: '12px' }}>
                      <path d="M4 8h8M9 5l3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── Portfolio ────────────────────────────────── */}
      {portfolio.length > 0 && (
        <section data-animate data-delay="200" style={{ margin: '0 20px 8px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--oak)', marginBottom: '12px', paddingLeft: '2px' }}>Portfolio</p>

          {/* Editorial layout: first image large, rest in grid */}
          {portfolio.length >= 3 ? (
            <>
              {/* First row: big + two small */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '6px', marginBottom: '6px' }}>
                <div style={{ borderRadius: '14px', overflow: 'hidden', aspectRatio: '1/1', background: 'rgba(166,137,102,0.06)' }}>
                  <img src={portfolio[0].imageUrl} alt={portfolio[0].caption} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ borderRadius: '14px', overflow: 'hidden', flex: 1, background: 'rgba(166,137,102,0.06)' }}>
                    <img src={portfolio[1].imageUrl} alt={portfolio[1].caption} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                  <div style={{ borderRadius: '14px', overflow: 'hidden', flex: 1, background: 'rgba(166,137,102,0.06)' }}>
                    <img src={portfolio[2].imageUrl} alt={portfolio[2].caption} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                </div>
              </div>
              {/* Remaining in 3-col grid */}
              {portfolio.length > 3 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {portfolio.slice(3).map(p => (
                    <div key={p.id} style={{ aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', background: 'rgba(166,137,102,0.06)' }}>
                      <img src={p.imageUrl} alt={p.caption} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {portfolio.map(p => (
                <div key={p.id} style={{ aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', background: 'rgba(166,137,102,0.06)' }}>
                  <img src={p.imageUrl} alt={p.caption} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Spacer for fixed CTA */}
      <div style={{ height: '120px' }} />

      {/* ── Fixed CTA ────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px',
        padding: '16px 20px 32px',
        background: 'linear-gradient(to top, var(--sand) 65%, transparent)',
        zIndex: 50,
      }}>
        {/* Social proof line */}
        <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(44,40,37,0.38)', letterSpacing: '0.08em', marginBottom: '10px' }}>
          透過 LINE 即時確認 · 免費預約不收手續費
        </p>
        <a
          href={`/${providerId}/book`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%', padding: '16px',
            background: 'var(--charcoal)', color: 'var(--cream)',
            borderRadius: '14px',
            fontSize: '13px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
            textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(26,23,20,0.28)',
            transition: 'opacity 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '16px', height: '16px' }}>
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
          </svg>
          立即預約
        </a>
      </div>
    </div>
  )
}
