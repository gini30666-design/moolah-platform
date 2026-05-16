'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import liff from '@line/liff'

type Service = { id: string; name: string; price: number; duration: number }
type Provider = { id: string; name: string; category: string }
type SlotStatus = 'available' | 'booked' | 'hot'
type Slot = { time: string; status: SlotStatus }

const GENDER_OPTIONS = ['男性', '女性', '不透露']
const HAIR_LENGTH_OPTIONS = ['超短髮', '短髮', '中長髮', '長髮', '超長髮']
const HAIR_CATEGORIES = ['髮型設計師']

function PillGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const selected = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              padding: '9px 20px',
              borderRadius: '99px',
              fontSize: '13px',
              fontFamily: 'var(--font-dm-sans)',
              border: selected
                ? '1.5px solid var(--charcoal)'
                : '1.5px solid rgba(166,137,102,0.28)',
              background: selected
                ? 'var(--charcoal)'
                : 'rgba(255,255,255,0.75)',
              color: selected
                ? 'var(--cream)'
                : 'var(--charcoal)',
              boxShadow: selected
                ? '0 3px 10px rgba(44,40,37,0.18), inset 0 1px 0 rgba(255,255,255,0.08)'
                : '0 1px 3px rgba(166,137,102,0.10)',
              transform: selected ? 'translateY(-1px)' : 'translateY(0)',
              transition: 'all 0.18s ease',
              cursor: 'pointer',
              fontWeight: selected ? 500 : 400,
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function SectionLabel({ step, label }: { step: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="font-display text-lg leading-none" style={{ color: 'rgba(166,137,102,0.65)' }}>{step}</span>
      <span className="text-[10px] tracking-[0.22em] uppercase" style={{ color: 'var(--charcoal)' }}>{label}</span>
    </div>
  )
}

function CompletionScreen({ providerName, serviceName, date, time, onBack, isLineUser }: {
  providerName: string; serviceName: string; date: string; time: string; onBack: () => void; isLineUser: boolean
}) {
  return (
    <div style={{ minHeight: '100vh', background: '#f5efe6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'var(--font-dm-sans)' }}>
      <style>{`
        @keyframes drawCircle { to { stroke-dashoffset: 0; } }
        @keyframes drawCheck  { to { stroke-dashoffset: 0; } }
        @keyframes floatUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
      `}</style>

      {/* Oak checkmark */}
      <div style={{ marginBottom: '32px' }}>
        <svg width="88" height="88" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(166,137,102,0.15)" strokeWidth="2.5" />
          <circle cx="48" cy="48" r="44" fill="none" stroke="var(--oak)" strokeWidth="2.5"
            strokeDasharray="276" strokeDashoffset="276" strokeLinecap="round"
            style={{ animation: 'drawCircle 0.8s cubic-bezier(0.16,1,0.3,1) forwards' }} />
          <polyline points="28,50 42,64 68,36" fill="none" stroke="var(--charcoal)" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="60" strokeDashoffset="60"
            style={{ animation: 'drawCheck 0.45s ease 0.7s forwards' }} />
        </svg>
      </div>

      <div style={{ textAlign: 'center', animation: 'floatUp 0.5s ease 0.9s both' }}>
        <p className="text-[10px] tracking-[0.25em] uppercase mb-4" style={{ color: 'var(--oak)' }}>BOOKING CONFIRMED</p>
        <h1 className="font-display text-3xl mb-3" style={{ color: 'var(--charcoal)', fontWeight: 300 }}>預約完成</h1>

        <div style={{ margin: '0 auto 24px', padding: '16px 24px', background: 'white', border: '1px solid rgba(166,137,102,0.20)', borderRadius: '12px', maxWidth: '280px' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--charcoal)' }}>{providerName}　·　{serviceName}</p>
          <p className="font-display text-xl" style={{ color: 'var(--oak)' }}>{date}　{time}</p>
        </div>

        {isLineUser ? (
          <p className="text-xs mb-8" style={{ color: 'rgba(44,40,37,0.65)' }}>確認通知已透過 LINE 傳送給您與設計師</p>
        ) : (
          <div className="mb-8">
            <p className="text-xs mb-3" style={{ color: 'rgba(44,40,37,0.65)' }}>設計師已收到通知，將盡速與您聯繫</p>
            <a
              href="https://line.me/R/ti/p/@881zhkla"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '99px',
                background: '#06C755', color: 'white',
                fontSize: '13px', fontWeight: 500, textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(6,199,85,0.30)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1C4.134 1 1 3.701 1 7.04c0 1.982 1.07 3.748 2.744 4.9-.12.444-.435 1.61-.498 1.86-.08.31.114.308.24.224.099-.066 1.577-1.04 2.213-1.463.424.06.858.092 1.301.092C11.866 12.653 15 9.952 15 6.613 15 3.274 11.866 1 8 1Z" fill="white"/>
              </svg>
              加入 MooLah LINE，接收預約通知
            </a>
          </div>
        )}

        <button
          onClick={onBack}
          className="text-xs tracking-widest uppercase pb-0.5 border-b"
          style={{ color: 'var(--oak)', borderColor: 'var(--oak)', background: 'none', cursor: 'pointer' }}
        >
          返回設計師頁面
        </button>
      </div>
    </div>
  )
}

export default function BookPage() {
  const { providerId } = useParams<{ providerId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const serviceId = searchParams.get('service') ?? ''

  const [provider, setProvider] = useState<Provider | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [lineUserId, setLineUserId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [customerNameInput, setCustomerNameInput] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [liffReady, setLiffReady] = useState(false)

  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [gender, setGender] = useState('')
  const [hairLength, setHairLength] = useState('')
  const [note, setNote] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [isHairCategory, setIsHairCategory] = useState(false)

  useEffect(() => {
    liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
      .then(async () => {
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile()
          setLineUserId(profile.userId)
          setDisplayName(profile.displayName)
        }
        // Not logged in → user fills name + phone manually, no forced redirect
        setLiffReady(true)
      })
      .catch(() => setLiffReady(true))
  }, [])

  useEffect(() => {
    if (!providerId) return
    fetch(`/api/provider/${providerId}`)
      .then(r => r.json())
      .then(data => {
        setProvider(data.provider)
        setIsHairCategory(HAIR_CATEGORIES.includes(data.provider?.category ?? ''))
        if (serviceId) {
          setService(data.services.find((s: Service) => s.id === serviceId) ?? null)
        } else if (data.services.length > 0) {
          setService(data.services[0])
        }
      })
  }, [providerId, serviceId])

  const fetchSlots = useCallback(async (selectedDate: string) => {
    if (!selectedDate || !service) return
    setLoadingSlots(true)
    setTime('')
    const res = await fetch(`/api/availability?providerId=${providerId}&date=${selectedDate}&serviceId=${service.id}`)
    const data = await res.json()
    setSlots(data.slots ?? [])
    setLoadingSlots(false)
  }, [providerId, service])

  useEffect(() => { fetchSlots(date) }, [date, fetchSlots])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = lineUserId ? displayName : customerNameInput.trim()
    const phone = lineUserId ? '' : customerPhone.trim()
    if (!date || !time || !gender || !name) return
    setSubmitting(true)
    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId, serviceId: service?.id,
        customerName: name,
        customerLineUserId: lineUserId || '',
        customerPhone: phone,
        date, time, note, gender,
        hairLength: isHairCategory ? hairLength : '',
      }),
    })
    if (res.ok) setDone(true)
    else alert('預約失敗，請稍後再試')
    setSubmitting(false)
  }

  if (done && provider && service) {
    return <CompletionScreen providerName={provider.name} serviceName={service.name} date={date} time={time} onBack={() => router.push(`/${providerId}`)} isLineUser={!!lineUserId} />
  }

  if (!provider || !service) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5efe6' }}>
        <div className="w-6 h-6 rounded-full border-2 border-[rgba(166,137,102,0.25)] border-t-[#A68966] animate-spin" />
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const hotCount = slots.filter(s => s.status === 'hot').length
  const hasCustomerInfo = lineUserId
    ? true
    : (customerNameInput.trim().length > 0 && customerPhone.trim().length > 0)
  const canSubmit = liffReady && date && time && gender && (isHairCategory ? !!hairLength : true) && hasCustomerInfo && !submitting

  return (
    <div style={{ background: '#f5efe6', minHeight: '100vh', fontFamily: 'var(--font-dm-sans)' }}>

      {/* ── Sticky mini-header ──────────────────────── */}
      <div className="sticky top-0 z-40" style={{ background: 'rgba(245,239,230,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(166,137,102,0.18)' }}>
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-xs tracking-widest uppercase" style={{ color: 'var(--oak)', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← 返回
          </button>
          <span className="font-display text-base tracking-wide" style={{ color: 'var(--charcoal)' }}>{provider.name}</span>
          <div style={{ width: '48px' }} />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 pb-52">

        {/* ── 服務摘要卡 ─────────────────────────────── */}
        <div data-animate className="mb-8 p-4" style={{ background: 'white', border: '1px solid rgba(166,137,102,0.20)', borderRadius: '16px', borderLeft: '3px solid var(--oak)' }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase mb-1.5" style={{ color: 'var(--oak)' }}>預約服務</p>
              <p className="text-base font-medium" style={{ color: 'var(--charcoal)' }}>{service.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(44,40,37,0.65)' }}>{service.duration} 分鐘</p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl" style={{ color: 'var(--charcoal)' }}>NT$ {service.price.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-8">

            {/* 聯絡資訊（非 LINE 用戶） */}
            {liffReady && !lineUserId && (
              <div data-animate data-delay="50">
                <SectionLabel step="00" label="聯絡資訊" />
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="您的姓名"
                    value={customerNameInput}
                    onChange={e => setCustomerNameInput(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: '12px',
                      border: '1.5px solid rgba(166,137,102,0.25)', background: 'white',
                      fontSize: '14px', color: 'var(--charcoal)', outline: 'none',
                      fontFamily: 'var(--font-dm-sans)',
                    }}
                  />
                  <input
                    type="tel"
                    placeholder="聯絡電話"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: '12px',
                      border: '1.5px solid rgba(166,137,102,0.25)', background: 'white',
                      fontSize: '14px', color: 'var(--charcoal)', outline: 'none',
                      fontFamily: 'var(--font-dm-sans)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* 性別 */}
            <div data-animate data-delay="100">
              <SectionLabel step="01" label="性別" />
              <PillGroup options={GENDER_OPTIONS} value={gender} onChange={setGender} />
            </div>

            {/* 髮長 */}
            {isHairCategory && (
              <div data-animate data-delay="150">
                <SectionLabel step="02" label="目前髮長" />
                <PillGroup options={HAIR_LENGTH_OPTIONS} value={hairLength} onChange={setHairLength} />
              </div>
            )}

            {/* 日期 */}
            <div data-animate data-delay="200">
              <SectionLabel step={isHairCategory ? '03' : '02'} label="選擇日期" />
              <input
                type="date" min={today} value={date}
                onChange={e => setDate(e.target.value)}
                required
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: '12px',
                  border: '1.5px solid rgba(166,137,102,0.25)', background: 'white',
                  fontSize: '14px', color: 'var(--charcoal)', outline: 'none',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              />
            </div>

            {/* 時段 */}
            {date && (
              <div data-animate>
                <SectionLabel step={isHairCategory ? '04' : '03'} label="選擇時段" />

                {loadingSlots ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0' }}>
                    <div className="w-5 h-5 rounded-full border-2 border-[rgba(166,137,102,0.20)] border-t-[#A68966] animate-spin" />
                    <span style={{ fontSize: '13px', color: 'rgba(44,40,37,0.65)' }}>查詢可用時段中</span>
                  </div>
                ) : (
                  <>
                    {hotCount > 0 && (
                      <div className="mb-3 flex items-center gap-2 px-3 py-2.5" style={{ background: 'rgba(196,132,90,0.08)', border: '1px solid rgba(196,132,90,0.25)', borderRadius: '10px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c4845a', flexShrink: 0, display: 'inline-block' }} />
                        <span style={{ fontSize: '12px', color: '#c4845a' }}>橘色時段為熱門推薦，幫設計師填補空檔</span>
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {slots.map(slot => {
                        const isBooked  = slot.status === 'booked'
                        const isHot     = slot.status === 'hot'
                        const isSelected = time === slot.time
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={isBooked}
                            onClick={() => !isBooked && setTime(slot.time)}
                            style={{
                              position: 'relative',
                              padding: '10px 4px',
                              borderRadius: '10px',
                              fontSize: '13px',
                              cursor: isBooked ? 'not-allowed' : 'pointer',
                              border: isSelected
                                ? '1.5px solid var(--charcoal)'
                                : isHot
                                  ? '1.5px solid rgba(196,132,90,0.50)'
                                  : '1.5px solid rgba(166,137,102,0.18)',
                              background: isSelected
                                ? 'var(--charcoal)'
                                : isBooked
                                  ? 'rgba(44,40,37,0.04)'
                                  : isHot
                                    ? 'rgba(196,132,90,0.10)'
                                    : 'rgba(255,255,255,0.80)',
                              color: isSelected
                                ? 'var(--cream)'
                                : isBooked
                                  ? 'rgba(44,40,37,0.25)'
                                  : isHot
                                    ? '#c4845a'
                                    : 'var(--charcoal)',
                              boxShadow: isSelected
                                ? '0 3px 10px rgba(44,40,37,0.18)'
                                : isBooked
                                  ? 'none'
                                  : '0 1px 3px rgba(166,137,102,0.08)',
                              transform: isSelected ? 'translateY(-1px)' : 'translateY(0)',
                              fontWeight: isSelected ? 500 : 400,
                              fontFamily: 'var(--font-dm-sans)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {slot.time}
                            {isBooked && <span style={{ display: 'block', fontSize: '10px', marginTop: '2px', color: 'rgba(44,40,37,0.22)' }}>已客滿</span>}
                            {isHot && !isSelected && (
                              <span style={{ position: 'absolute', top: '-8px', right: '-6px', background: '#c4845a', color: 'white', fontSize: '8px', padding: '2px 5px', borderRadius: '99px' }}>推薦</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 備註 */}
            <div data-animate>
              <SectionLabel step={isHairCategory ? '05' : '04'} label="補充說明（選填）" />
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={isHairCategory ? '例：想要偏灰的色調、參考圖已截圖...' : '特殊需求或備註...'}
                rows={3}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: '12px',
                  border: '1.5px solid rgba(166,137,102,0.25)', background: 'white',
                  fontSize: '13px', color: 'var(--charcoal)', outline: 'none',
                  resize: 'none', fontFamily: 'var(--font-dm-sans)',
                }}
              />
            </div>

          </div>
        </form>
      </div>

      {/* ── Fixed bottom CTA ────────────────────────── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg px-5 pb-8 pt-5"
        style={{ background: 'linear-gradient(to top, #f5efe6 70%, transparent)' }}>
        <button
          onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
          disabled={!canSubmit}
          style={{
            width: '100%', padding: '16px',
            borderRadius: '8px', border: 'none',
            background: canSubmit ? 'var(--charcoal)' : 'rgba(44,40,37,0.18)',
            color: canSubmit ? 'var(--cream)' : 'rgba(44,40,37,0.35)',
            fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-dm-sans)',
            transition: 'all 0.2s ease',
          }}
        >
          {submitting ? '預約中...' : '確認預約'}
        </button>

        {/* Progress hint */}
        {!canSubmit && liffReady && (
          <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(44,40,37,0.65)', marginTop: '8px' }}>
            {!hasCustomerInfo ? '請填入姓名與聯絡電話' : !gender ? '請選擇性別' : isHairCategory && !hairLength ? '請選擇髮長' : !date ? '請選擇日期' : !time ? '請選擇時段' : ''}
          </p>
        )}
      </div>
    </div>
  )
}
