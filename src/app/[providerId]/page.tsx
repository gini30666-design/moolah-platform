'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Provider = {
  id: string; name: string; category: string; description: string
  avatarUrl: string; coverUrl: string; storeName: string; address: string
  district: string; businessHours: string; phone: string; instagram: string
  rating?: string; reviewCount?: string; years?: string; tagline?: string; specialties?: string; role?: string
}
type Service      = { id: string; name: string; price: number; duration: number; description: string }
type PortfolioItem = { id: string; imageUrl: string; caption: string }

const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E\")"
const PF_TONES  = [['#efe6da','#e2d4c2'],['#dccab6','#cdb59b'],['#c8ac86','#bb9d74']]
// Preset masonry ratios cycling per portfolio index
const PF_RATIOS = [0.78, 1.0, 1.32, 0.85, 1.18, 0.92, 1.1, 0.80]

/* ── Lightbox ──────────────────────────────────────────────────────────────── */
function Lightbox({ items, startIdx, onClose }: { items: PortfolioItem[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx)
  const prev = useCallback(() => setIdx(i => (i - 1 + items.length) % items.length), [items.length])
  const next = useCallback(() => setIdx(i => (i + 1) % items.length), [items.length])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [onClose, prev, next])

  const item = items[idx]
  const tone = PF_TONES[idx % 3]
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(10,8,7,0.94)', backdropFilter: 'blur(4px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ position: 'absolute', top: '16px', right: '20px' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(251,249,244,0.5)', fontSize: '22px', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ position: 'absolute', top: '18px', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', letterSpacing: '0.14em', color: 'rgba(251,249,244,0.35)' }}>
        {idx + 1} / {items.length}
      </div>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '520px', padding: '0 20px' }}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.caption} style={{ width: '100%', borderRadius: '18px', objectFit: 'cover', maxHeight: '72vh', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }} />
        ) : (
          <div style={{ width: '100%', height: '62vh', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', background: `repeating-linear-gradient(135deg,${tone[0]} 0 11px,${tone[1]} 11px 22px)` }} />
        )}
        {item.caption && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px' }}>
            <span style={{ color: 'var(--cream)', fontSize: '13px', letterSpacing: '0.05em' }}>{item.caption}</span>
            <button onClick={onClose} style={{ background: 'rgba(251,249,244,0.1)', border: '1px solid rgba(251,249,244,0.22)', color: 'var(--cream)', borderRadius: '99px', padding: '6px 16px', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>關閉</button>
          </div>
        )}
      </div>
      <button onClick={e => { e.stopPropagation(); prev() }}
        style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', fontSize: '24px', color: 'rgba(251,249,244,0.7)', cursor: 'pointer' }}>‹</button>
      <button onClick={e => { e.stopPropagation(); next() }}
        style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', fontSize: '24px', color: 'rgba(251,249,244,0.7)', cursor: 'pointer' }}>›</button>
    </div>
  )
}

/* ── Portfolio tile ────────────────────────────────────────────────────────── */
function PortfolioTile({ item, ratio, radius = 14, onOpen, idx }: {
  item: PortfolioItem; ratio: number; radius?: number; onOpen: () => void; idx: number
}) {
  const [hover, setHover] = useState(false)
  const tone = PF_TONES[idx % 3]
  return (
    <button type="button" onClick={onOpen}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', width: '100%', aspectRatio: String(1 / ratio),
        border: 'none', padding: 0, borderRadius: radius, overflow: 'hidden',
        cursor: 'pointer', display: 'block', background: 'transparent',
        boxShadow: hover ? '0 14px 34px rgba(26,23,20,0.18)' : '0 3px 14px rgba(26,23,20,0.08)',
        transform: hover ? 'translateY(-3px)' : 'none',
        transition: 'transform .45s cubic-bezier(0.22,1,0.36,1), box-shadow .45s',
      }}>
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt={item.caption}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: radius }} />
      ) : (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: radius, overflow: 'hidden',
          background: `repeating-linear-gradient(135deg,${tone[0]} 0 11px,${tone[1]} 11px 22px)`,
          display: 'flex', alignItems: 'flex-end',
        }}>
          {item.caption && (
            <span style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '9.5px', letterSpacing: '0.04em', lineHeight: 1.3,
              color: 'rgba(44,40,37,0.5)', background: 'rgba(251,249,244,0.82)',
              padding: '4px 7px', margin: '8px', borderRadius: '5px',
              maxWidth: 'calc(100% - 16px)',
            }}>{item.caption}</span>
          )}
        </div>
      )}
      {/* caption gradient */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '22px 12px 11px', textAlign: 'left',
        background: 'linear-gradient(to top, rgba(26,23,20,0.55), transparent)',
        opacity: hover ? 1 : 0.85, transition: 'opacity .4s',
      }}>
        {item.caption && (
          <span style={{ fontSize: '11px', color: 'var(--cream)', letterSpacing: '0.04em', fontWeight: 500 }}>{item.caption}</span>
        )}
      </div>
    </button>
  )
}

/* ── Main provider page ────────────────────────────────────────────────────── */
export default function ProviderPage() {
  const { providerId } = useParams<{ providerId: string }>()
  const router = useRouter()

  const [provider, setProvider]   = useState<Provider | null>(null)
  const [services, setServices]   = useState<Service[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [lightbox, setLightbox]   = useState<number | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [nextAvail, setNextAvail] = useState<{ label: string; time: string } | null>(null)

  useEffect(() => {
    if (!providerId) return
    fetch(`/api/provider/${providerId}`)
      .then(r => r.json())
      .then(data => {
        setProvider(data.provider)
        setServices(data.services ?? [])
        setPortfolio(data.portfolio ?? [])
        const firstSvc = data.services?.[0]
        if (firstSvc) {
          setSelectedServiceId(firstSvc.id)
          fetch(`/api/next-available?providerId=${providerId}&serviceId=${firstSvc.id}`)
            .then(r => r.json())
            .then(d => { if (d.date) setNextAvail(d) })
            .catch(() => {})
        }
      })
      .catch(() => {})
  }, [providerId])

  function handleBook() {
    router.push(`/${providerId}/book${selectedServiceId ? `?service=${selectedServiceId}` : ''}`)
  }

  // Loading skeleton
  if (!provider) {
    return (
      <div className="max-w-[480px] mx-auto" style={{ background: 'var(--cream)', minHeight: '100vh' }}>
        <style>{`@keyframes shimmer{0%{background-position:-480px 0}100%{background-position:480px 0}}.sk{background:linear-gradient(90deg,rgba(166,137,102,0.07) 25%,rgba(166,137,102,0.14) 50%,rgba(166,137,102,0.07) 75%);background-size:960px 100%;animation:shimmer 1.4s infinite linear;border-radius:8px;}`}</style>
        <div style={{ padding: '32px 20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px' }}>
            <div className="sk" style={{ width: '60px', height: '11px' }} />
            <div className="sk" style={{ width: '60px', height: '11px' }} />
          </div>
          <div className="sk" style={{ width: '72%', height: '52px', marginBottom: '14px', borderRadius: '4px' }} />
          <div className="sk" style={{ width: '44%', height: '13px', marginBottom: '18px' }} />
          <div className="sk" style={{ width: '56%', height: '20px' }} />
        </div>
        <div className="sk" style={{ height: '38px', borderRadius: 0, marginBottom: '32px' }} />
        <div style={{ padding: '0 20px', columnCount: 2, columnGap: '10px' }}>
          {[0.78, 1.0, 1.32, 0.85].map((r, i) => (
            <div key={i} className="sk" style={{ width: '100%', aspectRatio: String(1/r), marginBottom: '10px', breakInside: 'avoid', borderRadius: '14px' }} />
          ))}
        </div>
      </div>
    )
  }

  const fromPrice = services.length ? Math.min(...services.map(s => s.price)) : 0
  const displayName = provider.storeName || provider.name
  const handle     = provider.instagram ? `@${provider.instagram.replace(/^@/, '')}` : ''
  const location   = provider.district  || ''
  // tagline = short header phrase (R column); bio = longer intro text (D column)
  const headerTagline = provider.tagline || ''
  const bioQuote      = provider.description || ''

  // Specialties: use S column if available, else fallback to first 3 service names
  const specialties = provider.specialties
    ? provider.specialties.split(',').map(s => s.trim()).filter(Boolean)
    : services.slice(0, 3).map(s => s.name)

  return (
    <div className="max-w-[480px] mx-auto" style={{ background: 'var(--cream)', minHeight: '100vh', fontFamily: 'var(--font-plus-jakarta), var(--font-dm-sans), sans-serif' }}>
      <style>{`
        @keyframes marquee-op { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes phase-in   { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
        @keyframes lb-fade    { from { opacity: 0 } to { opacity: 1 } }
        @keyframes lb-rise    { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: none } }
      `}</style>

      {/* ── 1. Header band ──────────────────────────────────────────────── */}
      <div style={{
        padding: '34px 20px 26px', position: 'relative',
        background: 'radial-gradient(120% 78% at 50% -18%, rgba(166,137,102,0.16), transparent 62%)',
        animation: 'phase-in .55s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* MooLah + location */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '26px' }}>
          <span style={{ fontSize: '11px', letterSpacing: '0.34em', textTransform: 'uppercase', color: 'var(--oak)', fontWeight: 600 }}>MooLah</span>
          {location && <span style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(44,40,37,0.42)' }}>{location}</span>}
        </div>

        {/* Store name — large serif */}
        <p className="font-display" style={{ fontSize: 'clamp(2.4rem,10vw,3.1rem)', fontWeight: 300, lineHeight: 1.02, color: 'var(--charcoal)', letterSpacing: '-0.02em', marginBottom: '12px' }}>
          {displayName}
        </p>

        {/* Handle + rating row — always present, IG handle preserved for future */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: headerTagline ? '16px' : 0 }}>
          {handle && <span style={{ fontSize: '12px', color: 'rgba(44,40,37,0.52)', letterSpacing: '0.02em' }}>{handle}</span>}
          {handle && provider.rating && <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(44,40,37,0.25)', flexShrink: 0 }} />}
          {provider.rating && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--oak)', fontWeight: 600 }}>
              ★ {provider.rating}
              {provider.reviewCount && <span style={{ color: 'rgba(44,40,37,0.4)', fontWeight: 400 }}>({provider.reviewCount})</span>}
            </span>
          )}
        </div>

        {/* Tagline italic serif — short phrase from R column */}
        {headerTagline && (
          <p className="font-display" style={{ fontSize: 'clamp(1.2rem,4vw,1.5rem)', fontStyle: 'italic', fontWeight: 400, color: 'var(--oak)', opacity: 0.9 }}>
            「{headerTagline}」
          </p>
        )}
      </div>

      {/* ── 2. Marquee strip ────────────────────────────────────────────── */}
      <div style={{ background: 'var(--oak)', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-flex', animation: 'marquee-op 24s linear infinite', padding: '8px 0' }}>
          {[0, 1].map(k => (
            <span key={k} style={{ display: 'inline-flex', fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(251,249,244,0.9)' }}>
              {['認證職人', '即時 LINE 通知', `${provider.reviewCount || '—'} 則好評`, '質感空間', '一對一諮詢'].map((t, i) => (
                <span key={i}>{t}<span style={{ margin: '0 16px', opacity: 0.4 }}>·</span></span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── 3. Designer intro dark section ──────────────────────────────── */}
      <div style={{
        background: 'var(--charcoal-deep)', position: 'relative', overflow: 'hidden',
        padding: '38px 22px 40px', margin: '8px 0',
      }}>
        {/* top hairline gold */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, var(--oak), transparent)', opacity: 0.6 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, var(--oak), transparent)', opacity: 0.3 }} />
        {/* grain */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: GRAIN, backgroundSize: '300px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--oak)', marginBottom: '20px' }}>Meet your designer</p>

          {/* Avatar + name + role */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '22px' }}>
            <div style={{
              width: '84px', height: '84px', borderRadius: '50%', flexShrink: 0,
              position: 'relative', overflow: 'hidden',
              border: '1px solid rgba(166,137,102,0.4)',
              background: 'repeating-linear-gradient(135deg, #2a2520 0 9px, #211d18 9px 18px)',
            }}>
              {provider.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={provider.avatarUrl} alt={provider.name}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-monospace,monospace', fontSize: '8px', letterSpacing: '0.06em', color: 'rgba(166,137,102,0.7)', textAlign: 'center', lineHeight: 1.4 }}>
                  設計師<br />照片
                </span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p className="font-display" style={{ fontSize: '1.9rem', fontWeight: 400, color: 'var(--cream)', lineHeight: 1.1, marginBottom: '5px' }}>{provider.name}</p>
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(251,249,244,0.5)' }}>{provider.role || provider.category}</p>
              {provider.years && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginTop: '8px' }}>
                  <span className="font-display" style={{ fontSize: '1.3rem', color: 'var(--oak)', lineHeight: 1 }}>{provider.years}</span>
                  <span style={{ fontSize: '10px', color: 'rgba(251,249,244,0.4)', letterSpacing: '0.08em' }}>年經驗</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio quote — longer description from D column */}
          {bioQuote && (
            <p className="font-display" style={{ fontSize: '1.18rem', fontStyle: 'italic', fontWeight: 400, lineHeight: 1.7, color: 'rgba(251,249,244,0.82)', marginBottom: '20px' }}>
              「{bioQuote}」
            </p>
          )}

          {/* Specialty tags from services */}
          {specialties.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: handle ? '18px' : 0 }}>
              {specialties.map(s => (
                <span key={s} style={{ fontSize: '11px', letterSpacing: '0.04em', padding: '6px 13px', borderRadius: '99px', color: 'var(--oak)', border: '1px solid rgba(166,137,102,0.4)', background: 'rgba(166,137,102,0.06)' }}>{s}</span>
              ))}
            </div>
          )}

          {/* IG link — always rendered as a slot (preserved for future even if empty) */}
          {handle && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: specialties.length ? 0 : '4px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--oak)" strokeWidth="1.6" style={{ width: '14px', height: '14px', flexShrink: 0 }}>
                <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="var(--oak)" stroke="none" />
              </svg>
              <a href={`https://instagram.com/${handle.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '12px', color: 'rgba(251,249,244,0.55)', letterSpacing: '0.04em', textDecoration: 'none' }}>
                {handle}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Portfolio section ─────────────────────────────────────────── */}
      <div style={{ padding: '28px 20px 30px', background: 'var(--cream)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <p style={{ fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'rgba(44,40,37,0.4)', marginBottom: '6px' }}>Selected Work</p>
            <p className="font-display" style={{ fontSize: '1.7rem', fontWeight: 400, color: 'var(--charcoal)' }}>作品集</p>
          </div>
          {portfolio.length > 0 && (
            <span style={{ fontSize: '11px', color: 'var(--oak)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{portfolio.length} 件 · 點擊放大</span>
          )}
        </div>

        {portfolio.length > 0 ? (
          <div style={{ columnCount: 2, columnGap: '10px' }}>
            {portfolio.map((item, i) => (
              <div key={item.id} style={{ breakInside: 'avoid', marginBottom: '10px' }}>
                <PortfolioTile item={item} ratio={PF_RATIOS[i % PF_RATIOS.length]} radius={14} onOpen={() => setLightbox(i)} idx={i} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed rgba(166,137,102,0.3)', borderRadius: '14px' }}>
            <p style={{ fontSize: '12px', color: 'rgba(44,40,37,0.4)' }}>作品集即將更新</p>
          </div>
        )}
      </div>

      {/* ── 5. Closing dark editorial section ───────────────────────────── */}
      <div style={{
        background: 'var(--charcoal-deep)', position: 'relative', overflow: 'hidden',
        padding: '46px 26px 48px', textAlign: 'center',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, var(--oak), transparent)', opacity: 0.6 }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: GRAIN, backgroundSize: '300px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--oak)', marginBottom: '18px' }}>Ready when you are</p>

          <p className="font-display" style={{ fontSize: 'clamp(1.8rem,6vw,2.2rem)', fontWeight: 300, lineHeight: 1.18, color: 'var(--cream)', letterSpacing: '-0.01em' }}>
            準備好遇見<br />更好的自己了嗎
          </p>

          {/* gold diamond divider */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', margin: '20px 0 22px' }}>
            <span style={{ width: '34px', height: '1px', background: 'linear-gradient(to right, transparent, var(--oak))' }} />
            <span style={{ width: '6px', height: '6px', background: 'var(--oak)', transform: 'rotate(45deg)', flexShrink: 0 }} />
            <span style={{ width: '34px', height: '1px', background: 'linear-gradient(to left, transparent, var(--oak))' }} />
          </div>

          {/* three-column stats */}
          <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center' }}>
            <div style={{ flex: 1, maxWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(251,249,244,0.38)' }}>最快</span>
              <span className="font-display" style={{ fontSize: '1.15rem', color: 'var(--cream)', whiteSpace: 'nowrap' }}>
                {nextAvail ? `${nextAvail.label} ${nextAvail.time}` : '歡迎預約'}
              </span>
            </div>
            <div style={{ width: '1px', background: 'rgba(166,137,102,0.25)', margin: '2px 0', flexShrink: 0 }} />
            <div style={{ flex: 1, maxWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(251,249,244,0.38)' }}>價格</span>
              <span className="font-display" style={{ fontSize: '1.15rem', color: 'var(--oak)', whiteSpace: 'nowrap' }}>NT$ {fromPrice.toLocaleString()} 起</span>
            </div>
            <div style={{ width: '1px', background: 'rgba(166,137,102,0.25)', margin: '2px 0', flexShrink: 0 }} />
            <div style={{ flex: 1, maxWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(251,249,244,0.38)' }}>評分</span>
              <span className="font-display" style={{ fontSize: '1.15rem', color: 'var(--cream)', whiteSpace: 'nowrap' }}>★ {provider.rating || '—'}</span>
            </div>
          </div>

          <p style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(251,249,244,0.32)', marginTop: '24px' }}>選擇喜歡的時段，其餘交給我們</p>

          {/* Inline CTA — always visible regardless of position:fixed support */}
          <button onClick={handleBook} style={{
            marginTop: '32px', width: '100%', maxWidth: '360px',
            padding: '17px', borderRadius: '15px',
            border: '1px solid rgba(166,137,102,0.45)', cursor: 'pointer',
            background: 'linear-gradient(#27221b, #191510)', color: 'var(--cream)',
            fontSize: '15px', fontWeight: 600,
            boxShadow: '0 14px 34px rgba(0,0,0,0.45), inset 0 1px 0 rgba(166,137,102,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            fontFamily: 'inherit',
          }}>
            開始預約
            {fromPrice > 0 && <span style={{ fontSize: '12px', color: 'var(--oak)', fontWeight: 500 }}>NT$ {fromPrice.toLocaleString()} 起</span>}
            <span style={{ fontSize: '17px', color: 'var(--oak)' }}>→</span>
          </button>
        </div>
      </div>

      {/* ── 6. Service selector (mini, above CTA) ───────────────────────── */}
      {services.length > 1 && (
        <div style={{
          position: 'fixed', left: 0, right: 0, bottom: '84px', zIndex: 29,
          display: 'flex', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <div style={{ width: '100%', maxWidth: '440px', padding: '0 20px', pointerEvents: 'auto' }}>
            <div style={{
              background: 'rgba(26,23,20,0.92)', backdropFilter: 'blur(12px)',
              borderRadius: '16px', padding: '10px 12px',
              border: '1px solid rgba(166,137,102,0.22)',
              display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none',
            }}>
              {services.map(s => {
                const sel = selectedServiceId === s.id
                return (
                  <button key={s.id} type="button" onClick={() => setSelectedServiceId(s.id)}
                    style={{
                      flex: '0 0 auto', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer',
                      border: sel ? '1.5px solid var(--oak)' : '1.5px solid rgba(166,137,102,0.2)',
                      background: sel ? 'rgba(166,137,102,0.18)' : 'transparent',
                      color: sel ? 'var(--oak)' : 'rgba(251,249,244,0.55)',
                      fontSize: '12px', fontWeight: sel ? 600 : 400, whiteSpace: 'nowrap',
                      transition: 'all .2s ease',
                    }}>
                    {s.name}
                    <span style={{ marginLeft: '6px', fontSize: '11px', color: sel ? 'var(--oak)' : 'rgba(251,249,244,0.35)' }}>
                      NT${s.price.toLocaleString()}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Fixed sticky CTA ─────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%', maxWidth: '440px', padding: '24px 20px 24px',
          background: 'linear-gradient(to top, var(--charcoal-deep) 56%, rgba(26,23,20,0.78) 78%, transparent)',
          pointerEvents: 'auto',
        }}>
          <button onClick={handleBook} style={{
            width: '100%', padding: '17px', borderRadius: '15px',
            border: '1px solid rgba(166,137,102,0.45)', cursor: 'pointer',
            background: 'linear-gradient(#27221b, #191510)', color: 'var(--cream)',
            fontSize: '15px', fontWeight: 600,
            boxShadow: '0 14px 34px rgba(0,0,0,0.45), inset 0 1px 0 rgba(166,137,102,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            fontFamily: 'inherit',
          }}>
            開始預約
            {fromPrice > 0 && <span style={{ fontSize: '12px', color: 'var(--oak)', fontWeight: 500 }}>NT$ {fromPrice.toLocaleString()} 起</span>}
            <span style={{ fontSize: '17px', color: 'var(--oak)' }}>→</span>
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <Lightbox items={portfolio} startIdx={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}
