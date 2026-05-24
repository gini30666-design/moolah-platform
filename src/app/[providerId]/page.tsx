'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar'

type Provider = {
  id: string; name: string; category: string; description: string
  avatarUrl: string; coverUrl: string; storeName: string; address: string
  businessHours: string; phone: string; instagram: string
  rating?: string; reviewCount?: string
}
type Service  = { id: string; name: string; price: number; duration: number; description: string }
type Portfolio = { id: string; imageUrl: string; caption: string }
type ReviewSummary = { count: number; average: number; reviews: Array<{ id: string; customerName: string; rating: number; comment: string; createdAt: string }> }

const CAT_ACCENT: Record<string, { bg: string; text: string; light: string }> = {
  '髮型設計師': { bg: 'rgba(196,168,130,0.15)', text: '#c4a882', light: 'rgba(196,168,130,0.06)' },
  '寵物美容師': { bg: 'rgba(168,184,160,0.15)', text: '#7a9e72', light: 'rgba(168,184,160,0.06)' },
  '汽車美容師': { bg: 'rgba(154,175,186,0.15)', text: '#7a9fba', light: 'rgba(154,175,186,0.06)' },
  '美甲師':    { bg: 'rgba(196,168,176,0.15)', text: '#c4a8b0', light: 'rgba(196,168,176,0.06)' },
}
const CAT_ICON: Record<string, string> = {
  '髮型設計師': '✂', '寵物美容師': '🐾', '汽車美容師': '✦', '美甲師': '◆',
}

/* ── Lightbox ──────────────────────────────── */
function Lightbox({ images, startIndex, onClose }: {
  images: Portfolio[]; startIndex: number; onClose: () => void
}) {
  const [idx, setIdx] = useState(startIndex)
  const prev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose, prev, next])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(10,8,7,0.96)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.18s ease',
      }}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>

      {/* Close */}
      <button onClick={onClose} style={{
        position: 'absolute', top: '20px', right: '20px',
        width: '44px', height: '44px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
        fontSize: '20px', zIndex: 10,
      }}>✕</button>

      {/* Counter */}
      <div style={{
        position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)',
        fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em',
      }}>
        {idx + 1} / {images.length}
      </div>

      {/* Image */}
      <img
        src={images[idx].imageUrl}
        alt={images[idx].caption}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '92vw', maxHeight: '84vh',
          objectFit: 'contain', borderRadius: '12px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
      />

      {/* Caption */}
      {images[idx].caption && (
        <div style={{
          position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          fontSize: '13px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em',
          maxWidth: '280px', textAlign: 'center',
        }}>
          {images[idx].caption}
        </div>
      )}

      {/* Prev / Next */}
      {images.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); prev() }} style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer',
            color: 'white', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>‹</button>
          <button onClick={e => { e.stopPropagation(); next() }} style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer',
            color: 'white', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>›</button>
        </>
      )}
    </div>
  )
}

/* ── Main Page ─────────────────────────────── */
export default function ProviderPage() {
  const { providerId } = useParams<{ providerId: string }>()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [portfolio, setPortfolio] = useState<Portfolio[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null)
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [stickyVisible, setStickyVisible] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/provider/${providerId}`)
      .then(r => r.json())
      .then(data => {
        setProvider(data.provider)
        setServices(data.services)
        setPortfolio(data.portfolio ?? [])
      })
    fetch(`/api/review?providerId=${providerId}`)
      .then(r => r.json())
      .then(setReviewSummary)
      .catch(() => {})
  }, [providerId])

  // Sticky header on scroll
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const obs = new IntersectionObserver(([e]) => setStickyVisible(!e.isIntersecting), { threshold: 0 })
    obs.observe(hero)
    return () => obs.disconnect()
  }, [provider])

  if (!provider) {
    return (
      <div style={{ background: 'var(--sand)', minHeight: '100vh', maxWidth: '480px', margin: '0 auto', overflow: 'hidden' }}>
        <style>{`
          @keyframes shimmer {
            0%   { background-position: -480px 0 }
            100% { background-position:  480px 0 }
          }
          .sk {
            background: linear-gradient(90deg, rgba(166,137,102,0.07) 25%, rgba(166,137,102,0.13) 50%, rgba(166,137,102,0.07) 75%);
            background-size: 960px 100%;
            animation: shimmer 1.4s infinite linear;
            border-radius: 10px;
          }
        `}</style>
        {/* Hero skeleton */}
        <div className="sk" style={{ height: '420px', borderRadius: 0 }} />
        {/* Glass card skeleton */}
        <div style={{ padding: '0 16px', marginTop: '-44px', position: 'relative', zIndex: 20 }}>
          <div style={{ background: 'rgba(245,239,230,0.88)', border: '1px solid rgba(166,137,102,0.2)', borderRadius: '22px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 8px 40px rgba(26,23,20,0.1)' }}>
            <div className="sk" style={{ width: '72px', height: '72px', borderRadius: '18px', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="sk" style={{ height: '18px', width: '60%' }} />
              <div className="sk" style={{ height: '12px', width: '40%' }} />
              <div className="sk" style={{ height: '24px', width: '80%', borderRadius: '999px' }} />
            </div>
          </div>
        </div>
        {/* Stats skeleton */}
        <div style={{ margin: '20px 16px 0', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          {[0,1,2].map(i => <div key={i} className="sk" style={{ height: '62px', borderRadius: '14px' }} />)}
        </div>
        {/* Section + rows skeleton */}
        <div style={{ margin: '24px 16px 0' }}>
          <div className="sk" style={{ height: '14px', width: '30%', marginBottom: '14px' }} />
          {[0,1,2,3].map(i => <div key={i} className="sk" style={{ height: '72px', borderRadius: '16px', marginBottom: '8px' }} />)}
        </div>
      </div>
    )
  }

  const cat = CAT_ACCENT[provider.category] ?? { bg: 'rgba(166,137,102,0.15)', text: '#A68966', light: 'rgba(166,137,102,0.06)' }
  const catIcon = CAT_ICON[provider.category] ?? '✦'
  const manualRating = provider.rating ? parseFloat(provider.rating) : null
  const manualCount  = provider.reviewCount ? parseInt(provider.reviewCount) : null
  const stars      = reviewSummary && reviewSummary.count > 0 ? reviewSummary.average : manualRating
  const starsCount = reviewSummary && reviewSummary.count > 0 ? reviewSummary.count : manualCount

  // Split portfolio: featured (first 1) + masonry (rest)
  const featured = portfolio[0] ?? null
  const masonryItems = portfolio.slice(1)

  return (
    <div style={{ background: 'var(--sand)', minHeight: '100vh', fontFamily: 'var(--font-dm-sans)', maxWidth: '480px', margin: '0 auto' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-100%) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .portfolio-item { position: relative; overflow: hidden; border-radius: 14px; cursor: pointer; break-inside: avoid; margin-bottom: 8px; background: rgba(166,137,102,0.06); }
        .portfolio-item img { width: 100%; display: block; transition: transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94); }
        .portfolio-item:hover img { transform: scale(1.04); }
        .portfolio-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(26,23,20,0.72) 0%, transparent 55%); opacity: 0; transition: opacity 0.25s; display: flex; align-items: flex-end; padding: 14px; }
        .portfolio-item:hover .portfolio-overlay { opacity: 1; }
        .portfolio-overlay-caption { font-size: 12px; color: rgba(251,249,244,0.85); letter-spacing: 0.06em; line-height: 1.4; }
        .portfolio-overlay-icon { margin-left: auto; width: 28px; height: 28px; border-radius: 50%; background: rgba(166,137,102,0.7); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .service-row { display: flex; align-items: center; padding: 18px 16px; background: white; border: 1px solid rgba(166,137,102,0.12); border-radius: 16px; cursor: pointer; gap: 14px; transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s, border-color 0.18s, background 0.18s; }
        .service-row:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(26,23,20,0.08); }
        .service-row.selected { background: rgba(166,137,102,0.06); border-color: rgba(166,137,102,0.5); box-shadow: 0 10px 32px rgba(166,137,102,0.18); transform: scale(1.015) translateY(-3px); }
      `}</style>

      {/* ── Sticky Mini Header ─────────────────── */}
      {stickyVisible && (
        <div style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: '480px', zIndex: 100,
          padding: '12px 20px',
          background: 'rgba(245,239,230,0.96)', backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(166,137,102,0.15)',
          display: 'flex', alignItems: 'center', gap: '12px',
          animation: 'slideDown 0.22s ease',
        }}>
          {provider.avatarUrl && (
            <img src={provider.avatarUrl} alt={provider.name} style={{
              width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover',
              flexShrink: 0, border: '1.5px solid rgba(166,137,102,0.25)',
            }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '18px', fontWeight: 500, color: 'var(--charcoal)', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{provider.name}</p>
            <p style={{ fontSize: '11px', color: 'rgba(44,40,37,0.45)', letterSpacing: '0.06em' }}>{provider.category}</p>
          </div>
          {selectedServiceId && (
            <a href={`/${providerId}/book?service=${selectedServiceId}`} style={{
              padding: '9px 18px', borderRadius: '999px',
              background: 'var(--charcoal)', color: 'var(--cream)',
              fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase',
              textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap',
            }}>
              預約
            </a>
          )}
        </div>
      )}

      {/* ── Hero ─────────────────────────────────── */}
      <div ref={heroRef} style={{ position: 'relative', height: '420px', background: 'var(--charcoal-deep)', overflow: 'hidden' }}>

        {/* Cover photo */}
        {provider.coverUrl
          ? <img src={provider.coverUrl} alt="封面" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
          : <>
              {/* Fallback: category-specific gradient + decorative elements */}
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 70% at 65% 30%, ${cat.bg.replace('0.15)', '0.30)')} 0%, transparent 65%)` }} />
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 55% 45% at 20% 78%, rgba(26,23,20,0.18) 0%, transparent 65%)' }} />
              <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'repeating-linear-gradient(135deg, var(--oak) 0px, var(--oak) 1px, transparent 1px, transparent 40px)' }} />
              {/* Giant letter watermark */}
              <div style={{ position: 'absolute', right: '-10px', top: '40px', fontFamily: 'var(--font-cormorant)', fontSize: '240px', lineHeight: 1, color: `${cat.bg.replace('0.15)', '0.1)')}`, fontWeight: 300, userSelect: 'none', letterSpacing: '-0.04em' }}>
                {provider.name[0]}
              </div>
              {/* Vertical category label */}
              <div style={{ position: 'absolute', right: '22px', bottom: '135px', fontSize: '9px', color: `${cat.bg.replace('0.15)', '0.5)')}`, letterSpacing: '0.42em', textTransform: 'uppercase', writingMode: 'vertical-rl', userSelect: 'none', fontWeight: 500 }}>
                {provider.category}
              </div>
            </>
        }

        {/* Multi-layer scrim: cinematic feel */}
        <div style={{
          position: 'absolute', inset: 0,
          background: provider.coverUrl
            ? 'linear-gradient(to bottom, rgba(26,23,20,0.55) 0%, rgba(26,23,20,0.1) 40%, rgba(26,23,20,0.25) 70%, rgba(26,23,20,0.75) 100%)'
            : 'linear-gradient(to bottom, rgba(26,23,20,0.3) 0%, rgba(26,23,20,0.05) 50%, rgba(26,23,20,0.5) 100%)',
        }} />

        {/* Top oak accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--oak), transparent)' }} />

        {/* Nav */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', zIndex: 10 }}>
          <a href="/discover" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(251,249,244,0.6)', fontSize: '11px', letterSpacing: '0.16em', textDecoration: 'none', textTransform: 'uppercase' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '14px', height: '14px' }}><path d="M10 4L6 8l4 4"/></svg>
            探索
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Share */}
            <button
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.share) {
                  navigator.share({ title: provider.name, text: `${provider.name} · ${provider.category}`, url: window.location.href }).catch(() => {})
                } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href).catch(() => {})
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 11px', borderRadius: '999px', background: 'rgba(251,249,244,0.12)', border: '1px solid rgba(251,249,244,0.2)', backdropFilter: 'blur(8px)', color: 'rgba(251,249,244,0.65)', fontSize: '11px', cursor: 'pointer', letterSpacing: '0.08em' }}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '11px', height: '11px' }}>
                <circle cx="12.5" cy="2.5" r="1.5"/><circle cx="3.5" cy="8" r="1.5"/><circle cx="12.5" cy="13.5" r="1.5"/>
                <path d="M5 7l6-3.5M5 9l6 3.5" strokeLinecap="round"/>
              </svg>
              分享
            </button>
            <span style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '5px 13px', borderRadius: '999px', background: cat.bg, color: cat.text, border: `1px solid ${cat.text}44`, backdropFilter: 'blur(8px)' }}>
              {catIcon} {provider.category}
            </span>
          </div>
        </div>

        {/* Bottom: name teaser in hero */}
        <div style={{ position: 'absolute', bottom: '72px', left: '24px', right: '24px', zIndex: 10 }}>
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '34px', fontWeight: 400, color: '#fbf9f4', letterSpacing: '0.01em', lineHeight: 1.1, marginBottom: '4px', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
            {provider.name}
          </h1>
          {provider.storeName && (
            <p style={{ fontSize: '13px', color: 'rgba(251,249,244,0.55)', letterSpacing: '0.04em' }}>{provider.storeName}</p>
          )}
        </div>
      </div>

      {/* ── Glass Identity Card ─────────────────── */}
      <div style={{ padding: '0 16px', marginTop: '-44px', position: 'relative', zIndex: 20 }}>
        <div style={{
          background: 'rgba(245,239,230,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(166,137,102,0.2)',
          borderRadius: '22px',
          padding: '16px 18px',
          boxShadow: '0 8px 40px rgba(26,23,20,0.18), 0 2px 8px rgba(26,23,20,0.08)',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          {/* Avatar */}
          <div style={{
            flexShrink: 0, width: '72px', height: '72px', borderRadius: '18px',
            padding: '2px',
            background: 'linear-gradient(135deg, var(--oak) 0%, rgba(166,137,102,0.3) 100%)',
            boxShadow: '0 4px 16px rgba(26,23,20,0.2)',
          }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden', background: 'var(--charcoal-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {provider.avatarUrl
                ? <img src={provider.avatarUrl} alt={provider.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', color: 'var(--oak)', fontWeight: 300 }}>{provider.name[0]}</span>
              }
            </div>
          </div>

          {/* Info — always shows name + store, stars/social as secondary */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name */}
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '20px', fontWeight: 500, color: 'var(--charcoal)', lineHeight: 1.1, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {provider.name}
            </p>
            {/* Store name */}
            {provider.storeName && (
              <p style={{ fontSize: '11px', color: 'rgba(44,40,37,0.45)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{provider.storeName}</p>
            )}
            {/* Stars */}
            {stars !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                <div style={{ display: 'flex', gap: '1px' }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ fontSize: '12px', color: s <= Math.round(stars) ? '#A68966' : 'rgba(166,137,102,0.2)' }}>★</span>
                  ))}
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--charcoal)' }}>{stars.toFixed(1)}</span>
                {starsCount !== null && (
                  <span style={{ fontSize: '11px', color: 'rgba(44,40,37,0.38)' }}>({starsCount})</span>
                )}
              </div>
            )}
            {/* Social */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {provider.instagram && (
                <a href={`https://instagram.com/${provider.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '999px', background: 'white', border: '1px solid rgba(166,137,102,0.18)', fontSize: '11px', color: 'rgba(44,40,37,0.6)', textDecoration: 'none' }}>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '11px', height: '11px' }}><rect x="2" y="2" width="16" height="16" rx="5"/><circle cx="10" cy="10" r="3.5"/><circle cx="14.5" cy="5.5" r="0.75" fill="currentColor" stroke="none"/></svg>
                  {provider.instagram}
                </a>
              )}
              {provider.phone && (
                <a href={`tel:${provider.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '999px', background: 'white', border: '1px solid rgba(166,137,102,0.18)', fontSize: '11px', color: 'rgba(44,40,37,0.6)', textDecoration: 'none' }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '10px', height: '10px', color: 'var(--oak)' }}><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                  {provider.phone}
                </a>
              )}
            </div>
          </div>

          {/* MooLah 官方認證勳章 — IG 鋸齒徽章 */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <svg viewBox="0 0 50 50" fill="none" style={{ width: '46px', height: '46px', filter: 'drop-shadow(0 2px 10px rgba(0,149,246,0.55))' }}>
              {/* 12-point starburst outer ring */}
              <path d="M25,2 L29.9,6.65 L36.5,5.08 L38.44,11.56 L44.92,13.5 L43.35,20.08 L48,25 L43.35,29.92 L44.92,36.5 L38.44,38.44 L36.5,44.92 L29.92,43.35 L25,48 L20.08,43.35 L13.5,44.92 L11.56,38.44 L5.08,36.5 L6.65,29.92 L2,25 L6.65,20.08 L5.08,13.5 L11.56,11.56 L13.5,5.08 L20.08,6.65 Z" fill="#0095F6"/>
              {/* shine highlight */}
              <ellipse cx="18" cy="14" rx="5" ry="3" fill="rgba(255,255,255,0.22)" transform="rotate(-20 18 14)"/>
              {/* white checkmark */}
              <path d="M15.5 25.5l5.5 5.5L34.5 18" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '8px', letterSpacing: '0.12em', fontWeight: 700, color: '#0095F6' }}>官方認證</span>
          </div>
        </div>
      </div>

      {/* ── Description ────────────────────────── */}
      {provider.description && (
        <div data-animate data-delay="50" style={{ padding: '20px 20px 0' }}>
          <p style={{ fontSize: '14px', lineHeight: 1.8, color: 'rgba(44,40,37,0.75)', letterSpacing: '0.01em' }}>{provider.description}</p>
        </div>
      )}

      {/* ── Stats Row ──────────────────────────── */}
      <div data-animate data-delay="80" style={{ margin: '20px 16px 0', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
        {[
          { num: starsCount ?? reviewSummary?.count ?? '—', label: '則評價' },
          { num: services.length || '—', label: '項服務' },
        ].map(({ num, label }) => (
          <div key={label} style={{ padding: '14px 8px', background: 'white', border: '1px solid rgba(166,137,102,0.12)', borderRadius: '14px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', fontWeight: 500, color: 'var(--charcoal)', lineHeight: 1, marginBottom: '4px' }}>{num}</p>
            <p style={{ fontSize: '10px', color: 'rgba(44,40,37,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</p>
          </div>
        ))}
        {/* MooLah 官方認證卡片 */}
        <div style={{
          padding: '12px 6px',
          borderRadius: '14px',
          textAlign: 'center',
          background: 'white',
          border: '1px solid rgba(166,137,102,0.12)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px',
        }}>
          {/* IG-style blue checkmark badge */}
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: '#0095F6',
            boxShadow: '0 2px 10px rgba(0,149,246,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden', flexShrink: 0,
          }}>
            <div style={{ position: 'absolute', top: '4px', left: '5px', width: '12px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.28)', transform: 'rotate(-20deg)' }} />
            <svg viewBox="0 0 20 20" fill="none" style={{ width: '14px', height: '14px', position: 'relative', zIndex: 1 }}>
              <path d="M5 10l3.5 3.5L15 6.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--charcoal)', lineHeight: 1, marginBottom: '1px' }}>官方認證</p>
          <p style={{ fontSize: '9px', color: 'rgba(44,40,37,0.42)', letterSpacing: '0.06em' }}>MooLah 職人</p>
        </div>
      </div>

      {/* ── Studio Info ─────────────────────────── */}
      {(provider.address || provider.businessHours) && (
        <section data-animate data-delay="100" style={{ margin: '20px 16px 0' }}>
          <SectionHeader index="01" title="Studio" />
          <div style={{ background: 'white', border: '1px solid rgba(166,137,102,0.12)', borderRadius: '18px', overflow: 'hidden' }}>
            {provider.address && (
              <InfoRow
                icon={<svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '14px', height: '14px', color: 'var(--oak)' }}><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>}
                label="地址" value={provider.address}
                hasBorder={!!provider.businessHours}
              />
            )}
            {provider.businessHours && (
              <InfoRow
                icon={<svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '14px', height: '14px', color: 'var(--oak)' }}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>}
                label="營業時間" value={provider.businessHours}
                hasBorder={false}
              />
            )}
          </div>
        </section>
      )}

      {/* ── Services ────────────────────────────── */}
      <section data-animate data-delay="140" style={{ margin: '24px 16px 0' }}>
        <SectionHeader index="02" title="Services" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {services.map((s, i) => {
            const isSelected = selectedServiceId === s.id
            const isExpanded = expandedServiceId === s.id
            const hasDesc = !!s.description?.trim()
            return (
              {isSelected ? (
                /* ── Selected: editorial summary card (matches book page) ── */
                <div key={s.id}
                  onClick={() => setSelectedServiceId(null)}
                  style={{
                    background: 'var(--charcoal-deep)', borderRadius: '20px',
                    padding: '22px 22px 18px', position: 'relative', overflow: 'hidden',
                    cursor: 'pointer', animation: 'fadeUp 0.2s ease',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 36px rgba(26,23,20,0.32)',
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, var(--oak), transparent)' }} />
                  <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: '300px 300px', pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '9px', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--oak)', marginBottom: '8px' }}>預約服務</p>
                      <p style={{ fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.15, marginBottom: '4px', letterSpacing: '-0.01em' }}>{s.name}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(251,249,244,0.38)', letterSpacing: '0.06em' }}>{s.duration} 分鐘</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                      <p style={{ fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif', fontSize: '2rem', color: 'var(--oak)', fontWeight: 300, lineHeight: 1, marginBottom: '8px' }}>NT$&thinsp;{s.price.toLocaleString()}</p>
                      <span style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '4px', background: 'rgba(166,137,102,0.18)', color: 'var(--oak)', border: '1px solid rgba(166,137,102,0.3)' }}>已選擇</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Unselected: standard row ── */
                <div key={s.id} style={{
                  borderRadius: '16px', overflow: 'hidden', background: 'white',
                  border: '1px solid rgba(166,137,102,0.12)',
                  transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s',
                }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', padding: '18px 16px', cursor: 'pointer', gap: '14px' }}
                    onClick={() => setSelectedServiceId(s.id)}
                  >
                    <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '20px', fontWeight: 300, color: 'rgba(166,137,102,0.5)', flexShrink: 0, width: '24px', textAlign: 'center', lineHeight: 1 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div style={{ width: '2px', alignSelf: 'stretch', borderRadius: '999px', background: 'rgba(166,137,102,0.25)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--charcoal)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                      <span style={{ fontSize: '10px', letterSpacing: '0.1em', padding: '2px 7px', borderRadius: '999px', background: cat.light, color: cat.text, border: `1px solid ${cat.text}33` }}>
                        {s.duration} 分鐘
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', fontWeight: 500, color: 'var(--charcoal)', lineHeight: 1 }}>{s.price.toLocaleString()}</p>
                        <p style={{ fontSize: '9px', color: 'rgba(44,40,37,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>NT$</p>
                      </div>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(166,137,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '11px', height: '11px', color: 'var(--oak)' }}><path d="M4 8h8M9 5l3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      {hasDesc && (
                        <button type="button"
                          onClick={e => { e.stopPropagation(); setExpandedServiceId(isExpanded ? null : s.id) }}
                          style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: isExpanded ? 'var(--oak)' : 'rgba(44,40,37,0.3)', lineHeight: 0, flexShrink: 0, transition: 'color 0.15s' }}
                          aria-label="展開說明"
                        >
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                            style={{ width: '14px', height: '14px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {isExpanded && hasDesc && (
                    <div style={{
                      padding: '10px 16px 14px 54px',
                      borderTop: '1px solid rgba(166,137,102,0.1)',
                      fontSize: '13px', color: 'rgba(44,40,37,0.62)', lineHeight: 1.7,
                      animation: 'fadeUp 0.18s ease',
                    }}>
                      {s.description}
                    </div>
                  )}
                </div>
              )}
            )
          })}
        </div>
      </section>

      {/* ── Portfolio ────────────────────────────── */}
      {portfolio.length > 0 && (
        <section data-animate data-delay="180" style={{ margin: '24px 16px 0' }}>
          <SectionHeader index="03" title="Portfolio" count={portfolio.length} />

          {/* Featured: first image full-width */}
          {featured && (
            <div
              className="portfolio-item"
              style={{ marginBottom: '8px', borderRadius: '18px' }}
              onClick={() => setLightboxIndex(0)}
            >
              <img src={featured.imageUrl} alt={featured.caption} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
              <div className="portfolio-overlay">
                {featured.caption && <span className="portfolio-overlay-caption">{featured.caption}</span>}
                <div className="portfolio-overlay-icon">
                  <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" style={{ width: '12px', height: '12px' }}><path d="M3 3h10v10M3 13L13 3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>
          )}

          {/* Masonry: 2 columns, natural heights */}
          {masonryItems.length > 0 && (
            <div style={{ columns: '2', columnGap: '8px' }}>
              {masonryItems.map((p, i) => (
                <div
                  key={p.id}
                  className="portfolio-item"
                  onClick={() => setLightboxIndex(i + 1)}
                >
                  <img src={p.imageUrl} alt={p.caption} style={{
                    width: '100%',
                    // Alternate aspect ratios for visual rhythm
                    aspectRatio: i % 3 === 1 ? '3/4' : i % 3 === 2 ? '1/1' : '4/5',
                    objectFit: 'cover',
                  }} />
                  <div className="portfolio-overlay">
                    {p.caption && <span className="portfolio-overlay-caption">{p.caption}</span>}
                    <div className="portfolio-overlay-icon">
                      <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" style={{ width: '12px', height: '12px' }}><path d="M3 3h10v10M3 13L13 3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Availability Calendar ─────────────── */}
      <div style={{ margin: '24px 16px 0' }}>
        <SectionHeader index={portfolio.length > 0 ? '04' : '03'} title="Availability" />
        <AvailabilityCalendar providerId={providerId} selectedServiceId={selectedServiceId} />
      </div>

      {/* Spacer */}
      <div style={{ height: '120px' }} />

      {/* ── Fixed CTA ─────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px',
        padding: '12px 16px 28px',
        background: 'linear-gradient(to top, var(--sand) 70%, transparent)',
        zIndex: 50,
      }}>
        {/* Service hint */}
        {selectedServiceId
          ? <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--oak)', letterSpacing: '0.06em', marginBottom: '8px', fontWeight: 500 }}>
              ✓ {services.find(s => s.id === selectedServiceId)?.name}
            </p>
          : <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(44,40,37,0.32)', letterSpacing: '0.08em', marginBottom: '8px' }}>
              請先選擇上方服務項目
            </p>
        }
        <a
          href={selectedServiceId ? `/${providerId}/book?service=${selectedServiceId}` : undefined}
          onClick={e => { if (!selectedServiceId) e.preventDefault() }}
          style={{
            display: 'flex', alignItems: 'center',
            width: '100%', padding: selectedServiceId ? '12px 16px 12px 12px' : '16px',
            background: selectedServiceId ? 'var(--charcoal)' : 'rgba(44,40,37,0.14)',
            color: selectedServiceId ? 'var(--cream)' : 'rgba(44,40,37,0.3)',
            borderRadius: '16px', textDecoration: 'none',
            boxShadow: selectedServiceId ? '0 8px 28px rgba(26,23,20,0.3)' : 'none',
            transition: 'opacity 0.15s, background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s',
            cursor: selectedServiceId ? 'pointer' : 'default',
            gap: '12px',
          }}
          onMouseEnter={e => { if (selectedServiceId) { (e.currentTarget as HTMLElement).style.opacity = '0.88'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' } }}
          onMouseLeave={e => { if (selectedServiceId) { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.transform = '' } }}
        >
          {/* Avatar — only when service selected */}
          {selectedServiceId && provider.avatarUrl && (
            <img
              src={provider.avatarUrl}
              alt={provider.name}
              style={{
                width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover',
                flexShrink: 0, border: '1.5px solid rgba(251,249,244,0.2)',
              }}
            />
          )}

          {/* Label */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '15px', height: '15px', flexShrink: 0 }}>
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
            </svg>
            <span style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase' }}>開始預約</span>
          </div>

          {/* Price — only when service selected */}
          {selectedServiceId && (
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '18px', fontWeight: 500, color: 'rgba(251,249,244,0.9)', lineHeight: 1 }}>
                NT$ {services.find(s => s.id === selectedServiceId)?.price.toLocaleString()}
              </p>
            </div>
          )}
        </a>
      </div>

      {/* ── Lightbox ─────────────────────────── */}
      {lightboxIndex !== null && (
        <Lightbox images={portfolio} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  )
}

/* ── Sub-components ──────────────────────── */
function SectionHeader({ index, title, count }: { index: string; title: string; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
      <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '14px', color: 'var(--oak)', fontWeight: 400, letterSpacing: '0.08em' }}>{index}</span>
      <div style={{ width: '1px', height: '14px', background: 'rgba(166,137,102,0.5)' }} />
      <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(44,40,37,0.72)', fontWeight: 600 }}>{title}</span>
      {count !== undefined && (
        <span style={{ fontSize: '10px', color: 'rgba(44,40,37,0.4)', marginLeft: '2px' }}>({count})</span>
      )}
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(44,40,37,0.12), transparent)' }} />
    </div>
  )
}

function InfoRow({ icon, label, value, hasBorder }: { icon: React.ReactNode; label: string; value: string; hasBorder: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px 18px', borderBottom: hasBorder ? '1px solid rgba(166,137,102,0.09)' : 'none' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(166,137,102,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(44,40,37,0.65)', marginBottom: '3px' }}>{label}</p>
        <p style={{ fontSize: '15px', color: 'rgba(44,40,37,0.9)', lineHeight: 1.5 }}>{value}</p>
      </div>
    </div>
  )
}
