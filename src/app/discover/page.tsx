'use client'
import { useState, useEffect, Suspense } from 'react'
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
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path d="M6 3v18M6 3c0 0 2.5 2 5 2s5-2 5-2v10c0 0-2.5 2-5 2S6 13 6 13M18 7l-2 10M16 11h4"/>
      </svg>
    ),
  },
  {
    id: '寵物美容師',
    label: '寵物美容師',
    en: 'Pet Grooming',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path d="M10.5 4.5a2 2 0 100-4 2 2 0 000 4zm3 0a2 2 0 100-4 2 2 0 000 4zM5 7a2 2 0 100-4 2 2 0 000 4zm14 0a2 2 0 100-4 2 2 0 000 4zM12 8c-3.5 0-7 2-7 5 0 3.5 3.5 7 7 7s7-3.5 7-7c0-3-3.5-5-7-5z"/>
      </svg>
    ),
  },
  {
    id: '汽車美容師',
    label: '汽車美容師',
    en: 'Auto Detailing',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path d="M5 17H3a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2M7 17h10M7 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 13l2-4h10l2 4"/>
      </svg>
    ),
  },
  {
    id: '美甲師',
    label: '美甲師',
    en: 'Nail Artist',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path d="M12 3a9 9 0 110 18A9 9 0 0112 3zm0 0v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>
      </svg>
    ),
  },
]

const QUICK_CITIES = ['高雄市', '台南市', '台中市', '台北市', '新北市', '屏東縣']
const TW_CITIES = [
  '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
  '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣',
  '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
  '台東縣', '澎湖縣', '金門縣', '連江縣',
]

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
    <main className="min-h-screen bg-[#faf9f7] max-w-md mx-auto pb-20">

      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        {step !== 'category' && (
          <button
            onClick={() => setStep(step === 'results' ? 'location' : 'category')}
            className="text-sm text-gray-400 mb-5 flex items-center gap-1"
          >
            ← 返回
          </button>
        )}
        <p className="text-[10px] tracking-[0.2em] text-[#A68966] uppercase mb-2">
          {step === 'category' ? 'DISCOVER' : step === 'location' ? category : `${category} · ${selectedCity}`}
        </p>
        <h1 className="text-2xl font-semibold text-gray-800">
          {step === 'category' && '選擇服務類別'}
          {step === 'location' && '您在哪個縣市？'}
          {step === 'results' && (searched ? `找到 ${providers.length} 位職人` : '搜尋中...')}
        </h1>
      </div>

      {/* Step 1: Category */}
      {step === 'category' && (
        <div className="px-5 grid grid-cols-2 gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className="bg-white rounded-2xl px-5 py-6 shadow-sm text-left hover:shadow-md active:scale-[0.98] transition-all"
            >
              <div className="text-[#9b8ea0] mb-4">{cat.icon}</div>
              <p className="text-sm font-semibold text-gray-800">{cat.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{cat.en}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Location */}
      {step === 'location' && (
        <div className="px-5">
          {/* Selected category badge */}
          {selectedCatObj && (
            <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-[#f0eaed] rounded-xl w-fit">
              <span className="text-[#9b8ea0]">{selectedCatObj.icon}</span>
              <span className="text-sm text-[#9b8ea0] font-medium">{selectedCatObj.label}</span>
            </div>
          )}

          {/* City input */}
          <div className="relative mb-3">
            <input
              type="text"
              value={cityInput}
              onChange={e => handleCityInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="輸入縣市，例如：高雄市"
              autoFocus
              className="w-full bg-white rounded-2xl px-4 py-4 text-sm text-gray-800 shadow-sm outline-none focus:ring-2 focus:ring-[#d4c9d0]"
            />
          </div>

          {/* Autocomplete suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
              {suggestions.slice(0, 6).map(s => (
                <button
                  key={s}
                  onClick={() => handleSearch(s)}
                  className="w-full text-left px-4 py-3.5 text-sm text-gray-700 border-b border-gray-50 last:border-0 hover:bg-[#faf9f7] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Quick-select cities */}
          {!cityInput && (
            <div className="mt-5">
              <p className="text-xs text-gray-400 mb-3 px-1">常見縣市</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_CITIES.map(c => (
                  <button
                    key={c}
                    onClick={() => handleSearch(c)}
                    className="px-4 py-2.5 bg-white rounded-full text-sm text-gray-600 shadow-sm hover:bg-[#f0eaed] transition-colors"
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
              className="mt-5 w-full bg-[#9b8ea0] text-white py-4 rounded-full text-sm font-semibold shadow-sm active:scale-[0.98] transition-transform"
            >
              搜尋 {category}
            </button>
          )}
        </div>
      )}

      {/* Step 3: Results */}
      {step === 'results' && (
        <div className="px-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#e8e2db] border-t-[#9b8ea0] animate-spin" />
              <p className="text-sm text-gray-300">搜尋中...</p>
            </div>
          )}

          {!loading && searched && providers.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-[#f0eaed] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg viewBox="0 0 24 24" fill="none" stroke="#9b8ea0" strokeWidth={1.5} className="w-7 h-7">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v2h-2zm0-10h2v8h-2z"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">此區域尚未開放</h2>
              <p className="text-sm text-gray-400 mb-1 leading-relaxed">
                {selectedCity}目前暫無 MooLah 合作職人
              </p>
              <p className="text-sm text-[#9b8ea0] mb-8">敬請期待！</p>
              <Link
                href="/join"
                className="inline-flex items-center gap-2 bg-[#A68966] text-white text-sm px-8 py-3.5 rounded-full shadow-sm"
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
                  className="flex items-center gap-4 bg-white rounded-2xl px-4 py-4 shadow-sm hover:shadow-md active:scale-[0.99] transition-all"
                >
                  {/* Rank badge */}
                  <div className="absolute" style={{ display: 'none' }}>{i + 1}</div>

                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-[#e8e2db] flex-shrink-0 overflow-hidden flex items-center justify-center text-lg font-semibold text-[#9b8ea0]">
                    {p.avatarUrl
                      ? <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                      : (p.storeName || p.name)[0]
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {p.storeName || p.name}
                    </p>
                    {p.storeName && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{p.name}</p>
                    )}
                    <span className="inline-block text-[10px] text-[#9b8ea0] bg-[#f0eaed] px-2 py-0.5 rounded-full mt-1">
                      {p.category}
                    </span>
                    {p.address && (
                      <p className="text-xs text-gray-400 mt-1.5 truncate flex items-center gap-1">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 flex-shrink-0">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                        </svg>
                        {p.address}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <svg viewBox="0 0 20 20" fill="none" stroke="#d4c9d0" strokeWidth={1.5} className="w-5 h-5 flex-shrink-0">
                    <path d="M7 10h6M10 7l3 3-3 3"/>
                  </svg>
                </Link>
              ))}

              {/* Bottom CTA */}
              <div className="pt-6 pb-2 text-center">
                <p className="text-xs text-gray-400 mb-3">找不到理想的職人？</p>
                <Link
                  href="/join"
                  className="text-sm text-[#9b8ea0] underline underline-offset-4"
                >
                  邀請您的設計師加入 MooLah
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-300 text-sm">載入中...</div>}>
      <DiscoverContent />
    </Suspense>
  )
}
