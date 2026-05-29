'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Provider = {
  id: string; name: string; category: string; description: string
  avatarUrl: string; coverUrl: string; storeName: string; address: string
  district: string; businessHours: string; phone: string; instagram: string
  rating?: string; reviewCount?: string
}
type Service  = { id: string; name: string; price: number; duration: number; description: string }
type PortfolioItem = { id: string; imageUrl: string; caption: string }

const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E\")"
const PF_TONES = [['#efe6da','#e2d4c2'],['#dccab6','#cdb59b'],['#c8ac86','#bb9d74']]

/* ── Lightbox ─────────────────────────────────────────────────────────────── */
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
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,8,7,0.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: '16px', right: '20px' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(251,249,244,0.5)', fontSize: '22px', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ position: 'absolute', top: '18px', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', letterSpacing: '0.14em', color: 'rgba(251,249,244,0.35)' }}>
        {idx + 1} / {items.length}
      </div>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '520px', padding: '0 16px' }}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.caption} style={{ width: '100%', borderRadius: '14px', objectFit: 'cover', maxHeight: '72vh' }} />
        ) : (
          <div style={{
            width: '100%', aspectRatio: '4/3', borderRadius: '14px', overflow: 'hidden',
            background: `repeating-linear-gradient(135deg, ${PF_TONES[idx % 3][0]} 0 11px, ${PF_TONES[idx % 3][1]} 11px 22px)`,
          }} />
        )}
        {item.caption && (
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(251,249,244,0.55)', marginTop: '14px', letterSpacing: '0.06em' }}>{item.caption}</p>
        )}
      </div>
      <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}>
        <button onClick={e => { e.stopPropagation(); prev() }} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', fontSize: '22px', color: 'rgba(251,249,244,0.7)', cursor: 'pointer' }}>‹</button>
      </div>
      <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
        <button onClick={e => { e.stopPropagation(); next() }} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', fontSize: '22px', color: 'rgba(251,249,244,0.7)', cursor: 'pointer' }}>›</button>
      </div>
    </div>
  )
}

/* ── Portfolio tile ───────────────────────────────────────────────────────── */
function PortfolioTile({ item, aspect, idx, onOpen }: { item: PortfolioItem; aspect: number; idx: number; onOpen: (i: number) => void }) {
  const [hover, setHover] = useState(false)
  const [toneIdx] = useState(idx % 3)
  return (
    <button
      type="button"
      onClick={() => onOpen(idx)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', width: '100%', aspectRatio: String(aspect),
        border: 'none', padding: 0, borderRadius: '14px', overflow: 'hidden',
        cursor: 'pointer', display: 'block', background: 'transparent',
        boxShadow: hover ? '0 14px 34px rgba(26,23,20,0.18)' : '0 3px 14px rgba(26,23,20,0.08)',
        transform: hover ? 'translateY(-3px)' : 'none',
        transition: 'transform .4s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow .4s',
      }}
    >
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt={item.caption} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '14px',
          background: `repeating-linear-gradient(135deg, ${PF_TONES[toneIdx][0]} 0 11px, ${PF_TONES[toneIdx][1]} 11px 22px)`,
        }} />
      )}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '22px 12px 11px',
        background: 'linear-gradient(to top, rgba(26,23,20,0.55), transparent)',
        opacity: hover ? 1 : 0.85, transition: 'opacity .4s',
      }}>
        {item.caption && <span style={{ fontSize: '11px', color: '#fbf9f4', letterSpacing: '0.04em', fontWeight: 500 }}>{item.caption}</span>}
      </div>
    </button>
  )
}

/* ── Designer intro band ──────────────────────────────────────────────────── */
function DesignerIntro({ provider }: { provider: Provider }) {
  const hasBio = provider.description && provider.description.trim().length > 0
  return (
    <div style={{ background: '#1a1714', position: 'relative', overflow: 'hidden', padding: '38px 22px 40px', margin: '8px 0' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, #A68966, transparent)', opacity: 0.6 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, #A68966, transparent)', opacity: 0.3 }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: GRAIN, backgroundSize: '300px', pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <p style={{ fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#A68966', marginBottom: '20px' }}>Meet your designer</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '22px' }}>
          {provider.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={provider.avatarUrl} alt={provider.name} style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(166,137,102,0.4)', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '84px', height: '84px', borderRadius: '50%', flexShrink: 0, border: '1px solid rgba(166,137,102,0.4)', background: 'repeating-linear-gradient(135deg, #2a2520 0 9px, #211d18 9px 18px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '8px', color: 'rgba(166,137,102,0.7)', textAlign: 'center', lineHeight: 1.4 }}>設計師<br />照片</span>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.9rem', fontWeight: 400, color: '#fbf9f4', lineHeight: 1.1, marginBottom: '5px' }}>{provider.name}</p>
            <p style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(251,249,244,0.5)' }}>{provider.category}</p>
            {provider.storeName && <p style={{ fontSize: '10px', color: 'rgba(251,249,244,0.35)', marginTop: '4px' }}>{provider.storeName}</p>}
          </div>
        </div>
        {hasBio ? (
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.18rem', fontStyle: 'italic', fontWeight: 400, lineHeight: 1.7, color: 'rgba(251,249,244,0.82)', marginBottom: '20px' }}>「{provider.description}」</p>
        ) : (
          <div style={{ border: '1px dashed rgba(166,137,102,0.35)', borderRadius: '12px', padding: '18px', marginBottom: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'rgba(251,249,244,0.4)' }}>設計師自我介紹即將登場</p>
          </div>
        )}
        {provider.instagram && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#A68966" strokeWidth="1.6" style={{ width: '14px', height: '14px' }}>
              <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="#A68966" stroke="none" />
            </svg>
            <span style={{ fontSize: '12px', color: 'rgba(251,249,244,0.55)', letterSpacing: '0.04em' }}>{provider.instagram}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto', background: '#fbf9f4', minHeight: '100vh' }}>
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
      <div style={{ padding: '34px 20px 26px', background: 'radial-gradient(120% 78% at 50% -18%, rgba(166,137,102,0.1), transparent 62%)' }}>
        <div style={{ height: '11px', width: '60px', borderRadius: '6px', background: 'linear-gradient(90deg,#e8e0d8 25%,#f0ece5 50%,#e8e0d8 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite', marginBottom: '26px' }} />
        <div style={{ height: '52px', width: '70%', borderRadius: '8px', background: 'linear-gradient(90deg,#e8e0d8 25%,#f0ece5 50%,#e8e0d8 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite', marginBottom: '16px' }} />
        <div style={{ height: '14px', width: '40%', borderRadius: '6px', background: 'linear-gradient(90deg,#e8e0d8 25%,#f0ece5 50%,#e8e0d8 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite' }} />
      </div>
      <div style={{ background: '#A68966', height: '36px' }} />
      <div style={{ padding: '28px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[0.78, 1.0, 1.32, 0.85, 1.18, 0.92].map((r, i) => (
            <div key={i} style={{ aspectRatio: String(r), borderRadius: '14px', background: 'linear-gradient(90deg,#e8e0d8 25%,#f0ece5 50%,#e8e0d8 75%)', backgroundSize: '800px 100%', animation: `shimmer 1.4s ${i * 0.1}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function ProviderPage() {
  const params = useParams<{ providerId: string }>()
  const router = useRouter()
  const providerId = params.providerId

  const [data, setData] = useState<{ provider: Provider; services: Service[]; portfolio: PortfolioItem[] } | null>(null)
  const [error, setError] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/provider/${providerId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => {
        setData(d)
        if (d.services.length > 0) setSelectedService(d.services[0])
      })
      .catch(() => setError(true))
  }, [providerId])

  const handleBook = () => {
    if (!selectedService) return
    router.push(`/${providerId}/book?service=${selectedService.id}`)
  }

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fbf9f4', padding: '24px' }}>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.6rem', color: '#2C2825', marginBottom: '8px' }}>找不到此職人</p>
      <a href="/discover" style={{ fontSize: '13px', color: '#A68966' }}>瀏覽其他職人</a>
    </div>
  )

  if (!data) return <Skeleton />

  const { provider, services, portfolio } = data
  const fromPrice = services.length > 0 ? Math.min(...services.map(s => s.price)) : 0
  const RATIOS = [0.78, 1.0, 1.32, 0.85, 1.18, 0.92, 1.1, 0.8]

  return (
    <div ref={scrollRef} style={{ background: '#1a1714', minHeight: '100vh' }}>
      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes phase-in { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .pf-tile { animation: phase-in .55s cubic-bezier(0.19,1,0.22,1) both; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto', background: '#fbf9f4', minHeight: '100vh', position: 'relative', overflow: 'hidden', boxShadow: '0 0 80px rgba(0,0,0,0.35)', animation: 'phase-in .55s cubic-bezier(0.19,1,0.22,1)' }}>

        {/* ── Header band ── */}
        <div style={{ padding: '34px 20px 26px', position: 'relative', background: 'radial-gradient(120% 78% at 50% -18%, rgba(166,137,102,0.16), transparent 62%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '26px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '0.34em', textTransform: 'uppercase', color: '#A68966', fontWeight: 600 }}>MooLah</span>
            <span style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(44,40,37,0.42)', whiteSpace: 'nowrap' }}>{provider.district || provider.address?.slice(0, 5) || ''}</span>
          </div>

          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2.4rem,7vw,3rem)', fontWeight: 300, lineHeight: 1.02, color: '#2C2825', letterSpacing: '-0.02em', marginBottom: '12px' }}>
            {provider.storeName || provider.name}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {provider.instagram && <span style={{ fontSize: '12px', color: 'rgba(44,40,37,0.5)' }}>{provider.instagram}</span>}
            {provider.instagram && provider.rating && <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(44,40,37,0.25)' }} />}
            {provider.rating && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#A68966', fontWeight: 600 }}>
                ★ {provider.rating}
                {provider.reviewCount && <span style={{ color: 'rgba(44,40,37,0.4)', fontWeight: 400 }}>({provider.reviewCount})</span>}
              </span>
            )}
          </div>

          {provider.description && (
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.45rem', fontStyle: 'italic', fontWeight: 400, color: '#A68966', marginTop: '16px', opacity: 0.9 }}>「{provider.description.slice(0, 40)}{provider.description.length > 40 ? '…' : ''}」</p>
          )}
        </div>

        {/* ── Marquee ── */}
        <div style={{ background: '#A68966', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'inline-flex', animation: 'marquee 24s linear infinite', padding: '8px 0' }}>
            {[0, 1].map(k => (
              <span key={k} style={{ display: 'inline-flex', fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(251,249,244,0.9)' }}>
                {['認證職人', '即時 LINE 通知', `${provider.reviewCount || ''}則好評`, '質感空間', '一對一諮詢', provider.category].filter(Boolean).map((t, i) => (
                  <span key={i}>{t}<span style={{ margin: '0 16px', opacity: 0.4 }}>·</span></span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* ── Designer intro ── */}
        <DesignerIntro provider={provider} />

        {/* ── Portfolio ── */}
        <div style={{ padding: '28px 20px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <p style={{ fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'rgba(44,40,37,0.4)', marginBottom: '6px' }}>Selected Work</p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.7rem', fontWeight: 400, color: '#2C2825' }}>作品集</p>
            </div>
            {portfolio.length > 0 && (
              <span style={{ fontSize: '11px', color: '#A68966', letterSpacing: '0.06em', whiteSpace: 'nowrap', flexShrink: 0 }}>{portfolio.length} 件 · 點擊放大</span>
            )}
          </div>

          {portfolio.length > 0 ? (
            <div style={{ columnCount: 2, columnGap: '10px' }}>
              {portfolio.map((item, i) => (
                <div key={item.id} style={{ breakInside: 'avoid', marginBottom: '10px' }}>
                  <PortfolioTile item={item} aspect={RATIOS[i % RATIOS.length]} idx={i} onOpen={setLightboxIdx} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(44,40,37,0.35)', fontSize: '13px' }}>作品集準備中</div>
          )}
        </div>

        {/* ── Dark closing section ── */}
        <div style={{ background: '#1a1714', position: 'relative', overflow: 'hidden', marginTop: '8px', padding: '46px 26px 124px', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, #A68966, transparent)', opacity: 0.6 }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: GRAIN, backgroundSize: '300px', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.32em', textTransform: 'uppercase', color: '#A68966', marginBottom: '18px' }}>Ready when you are</p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.8rem,5vw,2.15rem)', fontWeight: 300, lineHeight: 1.18, color: '#fbf9f4', letterSpacing: '-0.01em' }}>
              準備好遇見<br />更好的自己了嗎
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', margin: '20px 0 22px' }}>
              <span style={{ width: '34px', height: '1px', background: 'linear-gradient(to right, transparent, #A68966)' }} />
              <span style={{ width: '6px', height: '6px', background: '#A68966', transform: 'rotate(45deg)' }} />
              <span style={{ width: '34px', height: '1px', background: 'linear-gradient(to left, transparent, #A68966)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: '0' }}>
              {fromPrice > 0 && (
                <>
                  <div style={{ flex: 1, maxWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(251,249,244,0.38)' }}>價格</span>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.15rem', color: '#A68966', whiteSpace: 'nowrap' }}>NT$ {fromPrice.toLocaleString()} 起</span>
                  </div>
                  {provider.rating && (
                    <>
                      <div style={{ width: '1px', background: 'rgba(166,137,102,0.25)', margin: '2px 0' }} />
                      <div style={{ flex: 1, maxWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(251,249,244,0.38)' }}>評分</span>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.15rem', color: '#fbf9f4', whiteSpace: 'nowrap' }}>★ {provider.rating}</span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            <p style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(251,249,244,0.32)', marginTop: '24px' }}>選擇喜歡的時段，其餘交給我們</p>
          </div>
        </div>

        {/* ── Service selector (above CTA) ── */}
        {services.length > 1 && (
          <div style={{ padding: '0 20px 20px', background: '#fbf9f4' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {services.map(s => {
                const sel = selectedService?.id === s.id
                return (
                  <button key={s.id} type="button" onClick={() => setSelectedService(s)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', padding: '14px 16px', borderRadius: '14px', cursor: 'pointer', border: sel ? '1.5px solid #2C2825' : '1.5px solid rgba(166,137,102,0.2)', background: sel ? 'rgba(44,40,37,0.04)' : 'rgba(255,255,255,0.7)', transition: 'all .25s' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#2C2825', marginBottom: '2px' }}>{s.name}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(44,40,37,0.45)' }}>{s.duration} 分鐘{s.description ? ` · ${s.description}` : ''}</p>
                    </div>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', color: '#A68966', flexShrink: 0 }}>NT$ {s.price.toLocaleString()}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Fixed CTA ── */}
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: '100%', maxWidth: '440px', padding: '24px 20px 24px', background: 'linear-gradient(to top, #1a1714 56%, rgba(26,23,20,0.78) 78%, transparent)', pointerEvents: 'auto' }}>
            <button onClick={handleBook} style={{ width: '100%', padding: '17px', borderRadius: '15px', border: '1px solid rgba(166,137,102,0.45)', cursor: 'pointer', background: 'linear-gradient(#27221b, #191510)', color: '#fbf9f4', fontSize: '15px', fontWeight: 600, boxShadow: '0 14px 34px rgba(0,0,0,0.45), inset 0 1px 0 rgba(166,137,102,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              開始預約
              {fromPrice > 0 && <span style={{ fontSize: '12px', color: '#A68966', fontWeight: 500 }}>NT$ {fromPrice.toLocaleString()} 起</span>}
              <span style={{ fontSize: '17px', color: '#A68966' }}>→</span>
            </button>
          </div>
        </div>

      </div>

      {lightboxIdx !== null && portfolio.length > 0 && (
        <Lightbox items={portfolio} startIdx={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </div>
  )
}
