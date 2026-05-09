'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Provider = {
  id: string
  name: string
  category: string
  avatarUrl: string
  storeName: string
  address: string
  district: string
  shortCode: string
}

const CATEGORIES = [
  {
    id: '髮型設計師',
    label: '髮型設計師',
    en: 'Hair Designer',
    no: '01',
    img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&fit=crop',
  },
  {
    id: '寵物美容師',
    label: '寵物美容師',
    en: 'Pet Grooming',
    no: '02',
    img: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80&fit=crop',
  },
  {
    id: '汽車美容師',
    label: '汽車美容師',
    en: 'Auto Detailing',
    no: '03',
    img: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=600&q=80&fit=crop',
  },
  {
    id: '美甲師',
    label: '美甲師',
    en: 'Nail Artist',
    no: '04',
    img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80&fit=crop',
  },
]

const QUICK_CITIES = ['高雄市', '台南市', '台中市', '台北市', '新北市', '屏東縣']
const TW_CITIES = [
  '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
  '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣',
  '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
  '台東縣', '澎湖縣', '金門縣', '連江縣',
]

const MARQUEE_TEXT = 'DISCOVER · 探索職人 · 髮型設計師 · 寵物美容師 · 汽車美容師 · 美甲師 · LINE 一鍵預約 · 高質感服務 · '

function LineIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="currentColor">
      <path d="M24 4C13 4 4 11.6 4 21c0 5.8 3.3 10.9 8.4 14.2-.4 1.4-1.3 4.9-1.5 5.7-.2.9.3 1 .7.7.4-.2 5.5-3.7 7.7-5.2A24 24 0 0024 37c11 0 20-7.6 20-16S35 4 24 4z" />
    </svg>
  )
}

function DiscoverContent() {
  const searchParams = useSearchParams()
  const initCategory = searchParams.get('category') ?? ''

  const [step, setStep] = useState<'category' | 'location' | 'results'>(
    initCategory ? 'location' : 'category'
  )
  const [category, setCategory] = useState(initCategory)
  const [cityInput, setCityInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selectedCity, setSelectedCity] = useState('')

  function handleCategorySelect(cat: string) {
    setCategory(cat)
    setStep('location')
  }

  function handleCityInput(value: string) {
    setCityInput(value)
    setSuggestions(
      value.length >= 1 ? TW_CITIES.filter(c => c.includes(value)) : []
    )
  }

  async function handleSearch(city?: string) {
    const searchCity = city ?? cityInput
    if (!searchCity || !category) return
    setCityInput(searchCity)
    setSelectedCity(searchCity)
    setSuggestions([])
    setLoading(true)
    setStep('results')
    setSearched(false)

    const res = await fetch(
      `/api/discover?category=${encodeURIComponent(category)}&district=${encodeURIComponent(searchCity)}`
    )
    const data = await res.json()
    setProviders(data.providers ?? [])
    setLoading(false)
    setSearched(true)
  }

  const selectedCatObj = CATEGORIES.find(c => c.id === category)

  return (
    <>
      <style>{`
        @keyframes discoverMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes cardRise { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .cat-card { transition: transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.25s ease; }
        .cat-card:active { transform: scale(0.97); }
        @media (hover: hover) { .cat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.25); } }
      `}</style>

      <div style={{ background: 'var(--charcoal-deep)', minHeight: '100vh' }}>

        {/* Sticky Nav — dark editorial */}
        <nav
          style={{ background: 'rgba(26,23,20,0.96)', borderBottom: '1px solid rgba(166,137,102,0.18)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
          className="sticky top-0 z-40"
        >
          <div className="max-w-md mx-auto flex items-center justify-between px-5 h-14">
            <Link href="/" className="font-display text-base tracking-[.18em] uppercase" style={{ color: 'var(--cream)' }}>
              MooLah
            </Link>
            <div className="flex items-center gap-3">
              {step !== 'category' && (
                <button
                  onClick={() => setStep(step === 'results' ? 'location' : 'category')}
                  className="text-xs tracking-widest uppercase flex items-center gap-1.5"
                  style={{ color: 'var(--oak)' }}
                >
                  ← 返回
                </button>
              )}
              <Link
                href="/line"
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-widest uppercase text-white"
                style={{ background: 'var(--line-green)', borderRadius: '6px' }}
              >
                <LineIcon size={12} />
                預約
              </Link>
            </div>
          </div>
        </nav>

        {/* Marquee strip */}
        <div className="overflow-hidden py-3 border-b" style={{ borderColor: 'rgba(166,137,102,0.14)', background: 'rgba(166,137,102,0.05)' }}>
          <div style={{ display: 'flex', width: 'max-content', animation: 'discoverMarquee 28s linear infinite' }}>
            {[MARQUEE_TEXT, MARQUEE_TEXT].map((t, i) => (
              <span key={i} className="text-[10px] tracking-[.22em] uppercase px-4 whitespace-nowrap" style={{ color: 'var(--oak)' }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Editorial Header */}
        <div className="max-w-md mx-auto px-5 pt-9 pb-10" style={{ animation: 'fadeSlideIn 0.7s cubic-bezier(0.16,1,0.3,1) both' }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block w-7 h-px" style={{ background: 'var(--oak)' }} />
            <span className="text-[10px] tracking-[0.28em] uppercase" style={{ color: 'var(--oak)' }}>
              {step === 'category' ? 'DISCOVER · 探索職人' : step === 'location' ? `${category} · 選擇縣市` : `${category} · ${selectedCity}`}
            </span>
          </div>
          <h1
            className="font-display leading-tight"
            style={{ fontSize: 'clamp(2.2rem,9vw,3rem)', fontWeight: 300, color: 'var(--cream)', letterSpacing: '.01em' }}
          >
            {step === 'category' && <>探索優質<br />職人</>}
            {step === 'location' && '您在哪個縣市？'}
            {step === 'results' && (searched ? `找到 ${providers.length} 位職人` : '搜尋中')}
          </h1>
          {step === 'category' && (
            <p className="text-sm leading-relaxed mt-3" style={{ color: 'var(--oak-dim)' }}>
              選擇服務項目，找到您所在縣市的優質職人
            </p>
          )}
        </div>

        {/* Divider line */}
        <div className="max-w-md mx-auto px-5">
          <div style={{ height: '1px', background: 'linear-gradient(to right, var(--oak), rgba(166,137,102,0.1))' }} />
        </div>

        {/* ── Step 1: Category ─────────────────────────────────────── */}
        {step === 'category' && (
          <div className="max-w-md mx-auto px-5 pt-7 pb-20">
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat, i) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className="cat-card relative overflow-hidden text-left"
                  style={{
                    height: '200px',
                    borderRadius: '16px',
                    border: '1px solid rgba(166,137,102,0.22)',
                    animation: `cardRise 0.65s cubic-bezier(0.16,1,0.3,1) ${i * 90}ms both`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.img}
                    alt={cat.label}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ opacity: 0.72, filter: 'brightness(.80) saturate(1.05)' }}
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,8,6,0.92) 35%, rgba(10,8,6,0.10) 75%)' }} />
                  {/* Oak shimmer border on hover — CSS handles via .cat-card */}
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-300" style={{ boxShadow: 'inset 0 0 0 1px rgba(166,137,102,0.65)', borderRadius: '16px', pointerEvents: 'none' }} />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-[10px] tracking-[.22em] uppercase mb-1" style={{ color: 'var(--oak)' }}>{cat.no}</p>
                    <p className="font-display text-base leading-tight mb-0.5" style={{ color: 'var(--cream)', fontWeight: 300 }}>{cat.label}</p>
                    <p className="text-[10px] tracking-wide" style={{ color: 'var(--oak-dim)' }}>{cat.en}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Divider + Join CTA */}
            <div className="mt-10 pt-6 border-t" style={{ borderColor: 'rgba(166,137,102,0.20)' }}>
              <p className="text-xs text-center mb-4" style={{ color: 'rgba(214,197,178,0.50)' }}>您是美業職人？</p>
              <div className="text-center">
                <Link
                  href="/join"
                  className="inline-block text-xs tracking-widest uppercase px-6 py-3 border hover:opacity-75 transition-opacity"
                  style={{ color: 'var(--oak)', borderColor: 'rgba(166,137,102,0.38)', borderRadius: '4px' }}
                >
                  申請加入 MooLah →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Location ─────────────────────────────────────── */}
        {step === 'location' && (
          <div className="max-w-md mx-auto px-5 pt-7 pb-20" style={{ animation: 'fadeSlideIn 0.55s cubic-bezier(0.16,1,0.3,1) both' }}>

            {/* Selected category badge */}
            {selectedCatObj && (
              <div
                className="flex items-center gap-3 mb-6 px-4 py-3 w-fit"
                style={{ background: 'rgba(166,137,102,0.10)', border: '1px solid rgba(166,137,102,0.28)', borderRadius: '12px' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedCatObj.img} alt="" className="w-8 h-8 object-cover rounded-md" />
                <div>
                  <p className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--oak)' }}>{selectedCatObj.en}</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--cream)' }}>{selectedCatObj.label}</p>
                </div>
              </div>
            )}

            {/* City input */}
            <div className="relative mb-3">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4" style={{ color: 'var(--oak)' }}>
                  <path d="M10 2a6 6 0 00-6 6c0 4 6 10 6 10s6-6 6-10a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </div>
              <input
                type="text"
                value={cityInput}
                onChange={e => handleCityInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="輸入縣市，例如：高雄市"
                autoFocus
                className="w-full pl-10 pr-4 py-4 text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  borderRadius: '12px',
                  border: '1px solid rgba(166,137,102,0.32)',
                  color: 'var(--cream)',
                }}
              />
            </div>

            {/* Autocomplete */}
            {suggestions.length > 0 && (
              <div className="mb-4 overflow-hidden" style={{ background: 'rgba(30,27,24,0.95)', borderRadius: '12px', border: '1px solid rgba(166,137,102,0.22)' }}>
                {suggestions.slice(0, 6).map(s => (
                  <button
                    key={s}
                    onClick={() => handleSearch(s)}
                    className="w-full text-left px-4 py-3.5 text-sm border-b last:border-0 hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--cream)', borderColor: 'rgba(166,137,102,0.12)' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Quick cities */}
            {!cityInput && (
              <div className="mt-5">
                <p className="text-xs mb-3 px-1 tracking-widest uppercase" style={{ color: 'rgba(166,137,102,0.55)' }}>常見縣市</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_CITIES.map(c => (
                    <button
                      key={c}
                      onClick={() => handleSearch(c)}
                      className="px-4 py-2.5 text-sm hover:opacity-75 transition-opacity"
                      style={{
                        background: 'rgba(166,137,102,0.10)',
                        color: 'var(--oak-dim)',
                        border: '1px solid rgba(166,137,102,0.28)',
                        borderRadius: '99px',
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {cityInput && (
              <button
                onClick={() => handleSearch()}
                className="mt-5 w-full py-4 text-sm tracking-widest uppercase active:opacity-80 transition-opacity"
                style={{ background: 'var(--oak)', color: 'var(--cream)', borderRadius: '8px' }}
              >
                搜尋 {category}
              </button>
            )}
          </div>
        )}

        {/* ── Step 3: Results ──────────────────────────────────────── */}
        {step === 'results' && (
          <div className="max-w-md mx-auto px-5 pt-7 pb-20">
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-[rgba(166,137,102,0.18)] border-t-[#A68966] animate-spin" />
                <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--oak)' }}>搜尋中</p>
              </div>
            )}

            {!loading && searched && providers.length === 0 && (
              <div className="text-center py-16 px-4" style={{ animation: 'fadeSlideIn 0.55s ease both' }}>
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: 'rgba(166,137,102,0.10)', border: '1px solid rgba(166,137,102,0.28)' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="#A68966" strokeWidth={1.5} className="w-7 h-7">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                </div>
                <h2 className="font-display text-xl mb-2" style={{ color: 'var(--cream)', fontWeight: 400 }}>此區域尚未開放</h2>
                <p className="text-sm leading-relaxed mb-1" style={{ color: 'var(--oak-dim)' }}>
                  {selectedCity} 目前暫無 MooLah 合作職人
                </p>
                <p className="text-sm mb-8" style={{ color: 'var(--oak)' }}>敬請期待</p>
                <Link
                  href="/join"
                  className="inline-flex items-center gap-2 text-sm px-8 py-3.5 tracking-widest uppercase"
                  style={{ background: 'var(--oak)', color: 'var(--cream)', borderRadius: '8px' }}
                >
                  申請成為合作夥伴 →
                </Link>
              </div>
            )}

            {!loading && providers.length > 0 && (
              <div className="space-y-3">
                {providers.map((p, i) => (
                  <Link
                    key={p.id}
                    href={p.shortCode ? `/go/${p.shortCode}` : `/${p.id}`}
                    className="flex items-center gap-4 active:scale-[0.99] transition-transform"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '16px',
                      padding: '16px',
                      border: '1px solid rgba(166,137,102,0.20)',
                      animation: `cardRise 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 70}ms both`,
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-display text-lg"
                      style={{ background: 'rgba(166,137,102,0.15)', color: 'var(--oak)' }}
                    >
                      {p.avatarUrl
                        ? <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                        : (p.storeName || p.name)[0]
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--cream)' }}>
                        {p.storeName || p.name}
                      </p>
                      {p.storeName && (
                        <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(214,197,178,0.55)' }}>{p.name}</p>
                      )}
                      <span className="inline-block text-[10px] px-2 py-0.5 mt-1 tracking-wide" style={{ color: 'var(--oak)', background: 'rgba(166,137,102,0.13)', borderRadius: '99px' }}>
                        {p.category}
                      </span>
                      {p.address && (
                        <p className="text-xs mt-1.5 truncate flex items-center gap-1" style={{ color: 'rgba(214,197,178,0.45)' }}>
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 flex-shrink-0">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {p.address}
                        </p>
                      )}
                    </div>

                    {/* Arrow */}
                    <svg viewBox="0 0 20 20" fill="none" stroke="#A68966" strokeWidth={1.5} className="w-5 h-5 flex-shrink-0 opacity-50">
                      <path d="M7 10h6M10 7l3 3-3 3" />
                    </svg>
                  </Link>
                ))}

                {/* Bottom CTA */}
                <div className="pt-8 pb-4 text-center border-t mt-6" style={{ borderColor: 'rgba(166,137,102,0.20)' }}>
                  <p className="text-xs mb-3" style={{ color: 'rgba(214,197,178,0.45)' }}>找不到理想的職人？</p>
                  <Link
                    href="/join"
                    className="text-sm tracking-wide pb-0.5 border-b hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--oak)', borderColor: 'var(--oak)' }}
                  >
                    邀請設計師加入 MooLah →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center text-xs tracking-widest uppercase" style={{ color: 'var(--oak)', background: 'var(--charcoal-deep)' }}>
        載入中
      </div>
    }>
      <DiscoverContent />
    </Suspense>
  )
}
