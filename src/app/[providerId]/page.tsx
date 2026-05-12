'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import liff from '@line/liff'

type Provider = {
  id: string; name: string; category: string; description: string
  avatarUrl: string; storeName: string; address: string
  businessHours: string; phone: string; instagram: string
}
type Service  = { id: string; name: string; price: number; duration: number }
type Portfolio = { id: string; imageUrl: string; caption: string }

const CAT_COLORS: Record<string, string> = {
  '髮型設計師': '#c4a882',
  '寵物美容師': '#a8b8a0',
  '汽車美容師': '#9aafba',
  '美甲師': '#c4a8b0',
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
      <div className="flex h-screen items-center justify-center" style={{ background: '#f5efe6' }}>
        <div className="w-6 h-6 rounded-full border-2 border-[rgba(166,137,102,0.25)] border-t-[#A68966] animate-spin" />
      </div>
    )
  }

  const catColor = CAT_COLORS[provider.category] ?? '#A68966'

  return (
    <div style={{ background: '#f5efe6', minHeight: '100vh', fontFamily: 'var(--font-dm-sans)' }}>

      {/* ── Hero Banner ─────────────────────────────── */}
      <div className="relative" style={{ height: '220px', background: 'var(--charcoal-deep)', overflow: 'hidden' }}>
        {/* Decorative gradient */}
        <div className="absolute inset-0" style={{
          background: `linear-gradient(135deg, var(--charcoal-deep) 0%, rgba(${catColor === '#c4a882' ? '196,168,130' : '166,137,102'},0.35) 100%)`
        }} />
        {/* Oak accent bar top */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(to right, transparent, var(--oak), transparent)' }} />
        {/* Decorative pattern lines */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, var(--oak) 0px, var(--oak) 1px, transparent 1px, transparent 40px)'
        }} />
        {/* Back button */}
        <div className="absolute top-0 left-0 right-0 flex items-center px-5 pt-safe pt-4">
          <a href="/" className="flex items-center gap-1.5 text-xs tracking-widest uppercase" style={{ color: 'rgba(251,249,244,0.55)' }}>
            ← MooLah
          </a>
        </div>
        {/* Category badge */}
        <div className="absolute top-4 right-5">
          <span className="text-[10px] tracking-[0.2em] uppercase px-3 py-1.5" style={{ background: 'rgba(166,137,102,0.20)', color: 'var(--oak)', border: '1px solid rgba(166,137,102,0.35)' }}>
            {provider.category}
          </span>
        </div>
      </div>

      {/* ── Avatar + Name ───────────────────────────── */}
      <div data-animate className="px-5 pb-6" style={{ marginTop: '-56px', position: 'relative', zIndex: 10 }}>
        {/* Avatar ring */}
        <div className="mb-4" style={{ width: '88px', height: '88px', padding: '3px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--oak), rgba(166,137,102,0.3))' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--charcoal-deep)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {provider.avatarUrl
              ? <img src={provider.avatarUrl} alt={provider.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span className="font-display text-3xl" style={{ color: 'var(--oak)' }}>{provider.name[0]}</span>
            }
          </div>
        </div>

        <h1 className="font-display text-2xl mb-0.5" style={{ color: 'var(--charcoal)', fontWeight: 400, letterSpacing: '0.01em' }}>
          {provider.name}
        </h1>
        {provider.storeName && (
          <p className="text-sm mb-2" style={{ color: 'rgba(44,40,37,0.55)' }}>{provider.storeName}</p>
        )}
        {provider.description && (
          <p className="text-sm leading-relaxed mt-2" style={{ color: 'rgba(44,40,37,0.60)', maxWidth: '340px' }}>
            {provider.description}
          </p>
        )}
      </div>

      {/* Thin oak divider */}
      <div className="mx-5 mb-5 h-px" style={{ background: 'linear-gradient(to right, var(--oak), rgba(166,137,102,0.1))' }} />

      {/* ── 店家資訊 ────────────────────────────────── */}
      {(provider.address || provider.businessHours || provider.phone) && (
        <section data-animate data-delay="100" className="mx-5 mb-5 px-4 py-4" style={{ background: 'white', border: '1px solid rgba(166,137,102,0.18)', borderRadius: '16px' }}>
          <p className="text-[10px] tracking-[0.22em] uppercase mb-3" style={{ color: 'var(--oak)' }}>STUDIO INFO</p>
          <div className="space-y-3">
            {provider.address && (
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 mt-0.5 flex-shrink-0 flex items-center justify-center" style={{ color: 'var(--oak)' }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <p className="text-sm leading-snug" style={{ color: 'rgba(44,40,37,0.70)' }}>{provider.address}</p>
              </div>
            )}
            {provider.businessHours && (
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--oak)' }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                  </svg>
                </div>
                <p className="text-sm leading-snug" style={{ color: 'rgba(44,40,37,0.70)' }}>{provider.businessHours}</p>
              </div>
            )}
            {provider.phone && (
              <div className="flex gap-3 items-center">
                <div className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--oak)' }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                  </svg>
                </div>
                <a href={`tel:${provider.phone}`} className="text-sm" style={{ color: 'var(--oak)' }}>{provider.phone}</a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── 服務項目 ────────────────────────────────── */}
      <section data-animate data-delay="150" className="mx-5 mb-5">
        <p className="text-[10px] tracking-[0.22em] uppercase mb-3 px-1" style={{ color: 'var(--oak)' }}>SERVICES</p>
        <div className="space-y-2">
          {services.map(s => (
            <a
              key={s.id}
              href={`/${providerId}/book?service=${s.id}`}
              className="flex items-center justify-between px-4 py-4 active:scale-[0.98] transition-transform"
              style={{ background: 'white', border: '1px solid rgba(166,137,102,0.14)', borderRadius: '14px' }}
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--charcoal)' }}>{s.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(44,40,37,0.45)' }}>{s.duration} 分鐘</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>NT$ {s.price.toLocaleString()}</p>
                <div style={{ color: 'var(--oak)', opacity: 0.6 }}>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                    <path d="M7 10h6M10 7l3 3-3 3"/>
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── 作品集 ──────────────────────────────────── */}
      {portfolio.length > 0 && (
        <section data-animate data-delay="200" className="mx-5 mb-4">
          <p className="text-[10px] tracking-[0.22em] uppercase mb-3 px-1" style={{ color: 'var(--oak)' }}>PORTFOLIO</p>
          <div className="grid grid-cols-3 gap-1.5">
            {portfolio.map(p => (
              <div key={p.id} className="aspect-square overflow-hidden" style={{ borderRadius: '10px', background: 'rgba(166,137,102,0.08)' }}>
                <img src={p.imageUrl} alt={p.caption} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Spacer for fixed CTA */}
      <div className="h-36" />

      {/* ── 固定底部 CTA ────────────────────────────── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg px-5 pb-8 pt-6"
        style={{ background: 'linear-gradient(to top, #f5efe6 70%, transparent)' }}>
        <a
          href={`/${providerId}/book`}
          className="flex items-center justify-center gap-2 w-full py-4 text-sm tracking-widest uppercase active:opacity-80 transition-opacity"
          style={{ background: 'var(--charcoal)', color: 'var(--cream)', borderRadius: '8px' }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
          </svg>
          立即預約
        </a>
      </div>
    </div>
  )
}
