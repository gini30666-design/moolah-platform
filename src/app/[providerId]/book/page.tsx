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

type DayStatus = 'open' | 'limited' | 'full' | 'closed'

function InlineCalendar({ providerId, value, onChange }: {
  providerId: string
  value: string
  onChange: (date: string) => void
}) {
  const nowDate = new Date()
  nowDate.setHours(0, 0, 0, 0)
  const todayStr = nowDate.toISOString().split('T')[0]
  const currentMonthStr = todayStr.slice(0, 7)

  const [viewMonth, setViewMonth] = useState(() => value ? value.slice(0, 7) : currentMonthStr)
  const [avail, setAvail] = useState<Record<string, DayStatus>>({})

  useEffect(() => {
    fetch(`/api/calendar?providerId=${providerId}&days=90`)
      .then(r => r.json())
      .then((data: { date: string; status: DayStatus }[]) => {
        const map: Record<string, DayStatus> = {}
        data.forEach(d => { map[d.date] = d.status })
        setAvail(map)
      })
      .catch(() => {})
  }, [providerId])

  const [yr, mo] = viewMonth.split('-').map(Number)
  const firstDOW = new Date(yr, mo - 1, 1).getDay()
  const daysInMonth = new Date(yr, mo, 0).getDate()

  const prevM = () => {
    const d = new Date(yr, mo - 2, 1)
    setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const nextM = () => {
    const d = new Date(yr, mo, 1)
    setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const DOW_LABELS = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div style={{
      background: 'rgba(255,255,255,0.85)',
      border: '1.5px solid rgba(166,137,102,0.2)',
      borderRadius: '16px',
      padding: '14px 12px',
      boxShadow: '0 2px 12px rgba(26,23,20,0.06)',
    }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', padding: '0 4px' }}>
        <button type="button" onClick={prevM}
          disabled={viewMonth <= currentMonthStr}
          style={{
            background: 'none', border: 'none', fontSize: '20px', lineHeight: 1,
            color: viewMonth <= currentMonthStr ? 'rgba(166,137,102,0.2)' : 'var(--oak)',
            cursor: viewMonth <= currentMonthStr ? 'default' : 'pointer',
            padding: '4px 10px',
          }}>‹</button>
        <p style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize: '16px', fontWeight: 500,
          color: 'var(--charcoal)', letterSpacing: '0.04em',
        }}>{yr} 年 {mo} 月</p>
        <button type="button" onClick={nextM}
          style={{ background: 'none', border: 'none', fontSize: '20px', lineHeight: 1, color: 'var(--oak)', cursor: 'pointer', padding: '4px 10px' }}>›</button>
      </div>

      {/* DOW labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
        {DOW_LABELS.map(l => (
          <div key={l} style={{ textAlign: 'center', fontSize: '10px', color: 'rgba(44,40,37,0.28)', paddingBottom: '6px' }}>{l}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {Array.from({ length: firstDOW }, (_, i) => <div key={`p${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const dateStr = `${yr}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isPast = new Date(dateStr + 'T12:00:00') < nowDate
          const isToday = dateStr === todayStr
          const isSelected = dateStr === value
          const status = avail[dateStr] ?? 'open'
          const isDisabled = isPast || status === 'closed' || status === 'full'

          return (
            <button key={day} type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && onChange(dateStr)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                padding: '7px 2px', borderRadius: '8px', border: 'none',
                cursor: isDisabled ? 'default' : 'pointer',
                background: isSelected
                  ? 'var(--charcoal)'
                  : isToday
                    ? 'rgba(166,137,102,0.15)'
                    : 'transparent',
                opacity: isPast ? 0.22 : 1,
                transition: 'background 0.15s',
              }}
            >
              <span style={{
                fontSize: '13px', lineHeight: 1,
                fontWeight: isSelected || isToday ? 600 : 400,
                color: isSelected
                  ? 'white'
                  : isToday
                    ? 'var(--oak)'
                    : isDisabled && !isPast
                      ? 'rgba(44,40,37,0.25)'
                      : 'var(--charcoal)',
              }}>{day}</span>
              {!isPast && status !== 'closed' && (
                <span style={{
                  width: '4px', height: '4px', borderRadius: '50%', flexShrink: 0,
                  background: isSelected
                    ? 'rgba(255,255,255,0.5)'
                    : status === 'full'
                      ? 'transparent'
                      : status === 'limited'
                        ? 'rgba(166,137,102,0.5)'
                        : 'var(--oak)',
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(166,137,102,0.1)' }}>
        {[['var(--oak)', '有空位'], ['rgba(166,137,102,0.5)', '少量']].map(([bg, label]) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'rgba(44,40,37,0.4)' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: bg, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

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

function CompletionScreen({ providerName, serviceName, date, time, onBack, isLineUser, consumerNotified }: {
  providerName: string; serviceName: string; date: string; time: string
  onBack: () => void; isLineUser: boolean; consumerNotified: boolean
}) {
  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-dm-sans)', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes drawCircle { to { stroke-dashoffset: 0; } }
        @keyframes drawCheck  { to { stroke-dashoffset: 0; } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        @keyframes pulseRing {
          0% { transform: scale(0.95); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 0.15; }
          100% { transform: scale(0.95); opacity: 0.6; }
        }
      `}</style>

      {/* ── Top dark section ─────────────────────── */}
      <div style={{
        background: 'var(--charcoal-deep)',
        flex: '0 0 52vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 24px 48px',
      }}>
        {/* Background grain */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'300\' height=\'300\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          backgroundSize: '300px 300px',
        }} />
        {/* Top oak accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--oak), transparent)' }} />

        {/* Checkmark animation */}
        <div style={{ position: 'relative', marginBottom: '28px' }}>
          {/* Pulse ring */}
          <div style={{
            position: 'absolute', inset: '-16px', borderRadius: '50%',
            border: '1px solid rgba(166,137,102,0.25)',
            animation: 'pulseRing 2.8s ease-in-out 1s infinite',
          }} />
          <svg width="100" height="100" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="44" fill="rgba(166,137,102,0.07)" stroke="rgba(166,137,102,0.18)" strokeWidth="1" />
            <circle cx="48" cy="48" r="44" fill="none" stroke="var(--oak)" strokeWidth="2"
              strokeDasharray="276" strokeDashoffset="276" strokeLinecap="round"
              style={{ animation: 'drawCircle 1s cubic-bezier(0.16,1,0.3,1) 0.2s forwards' }} />
            <polyline points="28,50 42,64 68,36" fill="none" stroke="#fbf9f4" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="60" strokeDashoffset="60"
              style={{ animation: 'drawCheck 0.5s ease 1s forwards' }} />
          </svg>
        </div>

        {/* Eyebrow + Title */}
        <p style={{ fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--oak)', marginBottom: '10px', animation: 'fadeSlideUp 0.5s ease 1.2s both' }}>
          Booking Confirmed
        </p>
        <h1 className="font-display" style={{
          fontSize: 'clamp(2.4rem,8vw,3.5rem)', fontWeight: 300, letterSpacing: '-0.01em',
          color: '#fbf9f4', lineHeight: 1.1, textAlign: 'center',
          animation: 'fadeSlideUp 0.5s ease 1.35s both',
        }}>
          預約完成
        </h1>

        {/* Thin oak divider */}
        <div style={{ width: '36px', height: '1px', background: 'var(--oak)', margin: '16px 0', opacity: 0.5, animation: 'fadeSlideUp 0.5s ease 1.4s both' }} />

        {/* Provider · Service */}
        <p style={{ fontSize: '13px', color: 'rgba(251,249,244,0.45)', letterSpacing: '0.08em', textAlign: 'center', animation: 'fadeSlideUp 0.5s ease 1.5s both' }}>
          {providerName} &nbsp;·&nbsp; {serviceName}
        </p>
      </div>

      {/* ── Bottom light section ──────────────────── */}
      <div style={{
        background: '#f5efe6',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 24px 40px',
        position: 'relative',
      }}>
        {/* Booking detail card — overlapping the two sections */}
        <div style={{
          marginTop: '-28px',
          width: '100%', maxWidth: '320px',
          background: 'white',
          border: '1px solid rgba(166,137,102,0.18)',
          borderRadius: '18px',
          padding: '20px 24px',
          boxShadow: '0 8px 32px rgba(26,23,20,0.12)',
          animation: 'fadeSlideUp 0.5s ease 1.55s both',
          marginBottom: '24px',
        }}>
          {/* Date time row */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
            <span className="font-display" style={{ fontSize: '28px', fontWeight: 300, color: 'var(--oak)', letterSpacing: '-0.01em' }}>{date}</span>
            <span style={{ width: '1px', height: '20px', background: 'rgba(166,137,102,0.3)', display: 'inline-block', alignSelf: 'center' }} />
            <span className="font-display" style={{ fontSize: '24px', fontWeight: 300, color: 'var(--charcoal)' }}>{time}</span>
          </div>
          {/* Thin separator */}
          <div style={{ height: '1px', background: 'rgba(166,137,102,0.12)', margin: '0 -8px 12px' }} />
          {/* Detail row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--oak)', opacity: 0.6 }} />
            <span style={{ fontSize: '12px', color: 'rgba(44,40,37,0.55)', letterSpacing: '0.04em' }}>
              {providerName} · {serviceName}
            </span>
          </div>
        </div>

        {/* Notification status */}
        <div style={{ width: '100%', maxWidth: '320px', animation: 'fadeSlideUp 0.5s ease 1.7s both' }}>
          {consumerNotified ? (
            /* ── Notification sent ── */
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px', borderRadius: '12px',
              background: 'rgba(6,199,85,0.08)', border: '1px solid rgba(6,199,85,0.2)',
              marginBottom: '20px',
            }}>
              <svg viewBox="0 0 20 20" fill="none" style={{ width: '16px', height: '16px', flexShrink: 0 }}>
                <path d="M10 1.5C5.31 1.5 1.5 5.31 1.5 10c0 4.69 3.81 8.5 8.5 8.5s8.5-3.81 8.5-8.5c0-4.69-3.81-8.5-8.5-8.5zm-1 12.06l-3-3 1.06-1.06 1.94 1.94 4.44-4.44 1.06 1.06-5.5 5.5z" fill="#06C755"/>
              </svg>
              <p style={{ fontSize: '12px', color: 'rgba(44,40,37,0.65)', lineHeight: 1.5 }}>
                LINE 確認通知已傳送給您與設計師
              </p>
            </div>
          ) : (
            /* ── Add OA to receive notification ── */
            <div style={{
              padding: '16px',
              borderRadius: '14px',
              background: 'rgba(26,23,20,0.04)',
              border: '1px solid rgba(44,40,37,0.1)',
              marginBottom: '20px',
            }}>
              <p style={{ fontSize: '12px', color: 'rgba(44,40,37,0.55)', marginBottom: '12px', lineHeight: 1.6, textAlign: 'center' }}>
                {isLineUser
                  ? '加入 MooLah LINE 好友，即可接收預約確認與提醒'
                  : '設計師已收到通知。加入 LINE 好友可接收後續提醒'}
              </p>
              <a
                href="https://line.me/R/ti/p/@881zhkla"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '11px 20px', borderRadius: '10px',
                  background: '#06C755', color: 'white',
                  fontSize: '13px', fontWeight: 500, textDecoration: 'none',
                  boxShadow: '0 2px 12px rgba(6,199,85,0.28)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1C4.134 1 1 3.701 1 7.04c0 1.982 1.07 3.748 2.744 4.9-.12.444-.435 1.61-.498 1.86-.08.31.114.308.24.224.099-.066 1.577-1.04 2.213-1.463.424.06.858.092 1.301.092C11.866 12.653 15 9.952 15 6.613 15 3.274 11.866 1 8 1Z" fill="white"/>
                </svg>
                加入 MooLah LINE 好友
              </a>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '320px', animation: 'fadeSlideUp 0.5s ease 1.85s both' }}>
          <a href="/my-bookings" style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '11px', borderRadius: '10px',
            background: 'rgba(44,40,37,0.07)', border: '1px solid rgba(44,40,37,0.1)',
            fontSize: '12px', color: 'rgba(44,40,37,0.65)', textDecoration: 'none', fontWeight: 500,
          }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '13px', height: '13px' }}>
              <rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 2v2M11 2v2M2 7h12"/>
            </svg>
            我的預約
          </a>
          <a href="https://line.me/R/ti/p/@881zhkla" target="_blank" rel="noopener noreferrer" style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '11px', borderRadius: '10px',
            background: 'rgba(6,199,85,0.07)', border: '1px solid rgba(6,199,85,0.2)',
            fontSize: '12px', color: '#06C755', textDecoration: 'none', fontWeight: 500,
          }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M8 1C4.134 1 1 3.701 1 7.04c0 1.982 1.07 3.748 2.744 4.9-.12.444-.435 1.61-.498 1.86-.08.31.114.308.24.224.099-.066 1.577-1.04 2.213-1.463.424.06.858.092 1.301.092C11.866 12.653 15 9.952 15 6.613 15 3.274 11.866 1 8 1Z" fill="#06C755"/>
            </svg>
            LINE 聯繫
          </a>
        </div>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'rgba(44,40,37,0.35)',
            animation: 'fadeSlideUp 0.5s ease 2s both',
            paddingBottom: '2px',
            borderBottom: '1px solid rgba(44,40,37,0.15)',
            marginTop: '4px',
          }}
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
  const initialDate = searchParams.get('date') ?? ''

  const [provider, setProvider] = useState<Provider | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [lineUserId, setLineUserId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [customerNameInput, setCustomerNameInput] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [liffReady, setLiffReady] = useState(false)
  const [showLineCard, setShowLineCard] = useState(true)

  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState('')
  const [gender, setGender] = useState('')
  const [hairLength, setHairLength] = useState('')
  const [note, setNote] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [consumerNotified, setConsumerNotified] = useState(false)
  const [isHairCategory, setIsHairCategory] = useState(false)
  const [waitlistSlot, setWaitlistSlot] = useState<string | null>(null)
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false)
  const [waitlistDone, setWaitlistDone] = useState(false)

  useEffect(() => {
    liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
      .then(async () => {
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile()
          setLineUserId(profile.userId)
          setDisplayName(profile.displayName)
          setLiffReady(true)
        } else if (liff.isInClient()) {
          // In LINE's browser but not yet authenticated → trigger LINE login seamlessly
          liff.login({ redirectUri: window.location.href })
          // Don't set liffReady; page will redirect then return with token
        } else {
          // External browser (IG, Safari, Chrome) → show name + phone form
          setLiffReady(true)
        }
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
    if (res.ok) {
      const data = await res.json()
      setConsumerNotified(data.consumerNotified ?? false)
      setDone(true)
    } else alert('預約失敗，請稍後再試')
    setSubmitting(false)
  }

  if (done && provider && service) {
    return <CompletionScreen providerName={provider.name} serviceName={service.name} date={date} time={time} onBack={() => router.push(`/${providerId}`)} isLineUser={!!lineUserId} consumerNotified={consumerNotified} />
  }

  if (!provider || !service) {
    return (
      <div style={{ background: '#f5efe6', minHeight: '100vh', maxWidth: '480px', margin: '0 auto', overflow: 'hidden' }}>
        <style>{`@keyframes shimmer{0%{background-position:-480px 0}100%{background-position:480px 0}}.bsk{background:linear-gradient(90deg,rgba(166,137,102,0.07) 25%,rgba(166,137,102,0.14) 50%,rgba(166,137,102,0.07) 75%);background-size:960px 100%;animation:shimmer 1.4s infinite linear;border-radius:10px;}`}</style>
        <div style={{ background: 'rgba(240,234,224,0.97)', borderBottom: '1px solid rgba(26,23,20,0.12)', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="bsk" style={{ width: '48px', height: '11px' }} />
          <div className="bsk" style={{ width: '100px', height: '14px' }} />
          <div style={{ width: '48px' }} />
        </div>
        <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div className="bsk" style={{ height: '86px', borderRadius: '16px' }} />
          <div>
            <div className="bsk" style={{ height: '10px', width: '80px', marginBottom: '14px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              {[72, 64, 80].map((w, i) => <div key={i} className="bsk" style={{ height: '38px', width: `${w}px`, borderRadius: '20px' }} />)}
            </div>
          </div>
          <div>
            <div className="bsk" style={{ height: '10px', width: '80px', marginBottom: '14px' }} />
            <div className="bsk" style={{ height: '270px', borderRadius: '16px' }} />
          </div>
        </div>
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

      {/* ── Sticky mini-header + Progress ──────────── */}
      <div className="sticky top-0 z-40" style={{ background: 'rgba(240,234,224,0.97)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(26,23,20,0.12)', boxShadow: '0 1px 0 rgba(26,23,20,0.06)' }}>
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-xs tracking-widest uppercase" style={{ color: 'var(--oak)', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← 返回
          </button>
          <span className="font-display text-base tracking-wide" style={{ color: 'var(--charcoal)' }}>{provider.name}</span>
          <div style={{ width: '48px' }} />
        </div>

        {/* Progress bar */}
        {(() => {
          const step2Done = !!gender && (isHairCategory ? !!hairLength : true) &&
            (lineUserId ? true : (customerNameInput.trim().length > 0 && customerPhone.trim().length > 0))
          const step3Done = !!date && !!time
          const currentStep = !step2Done ? 2 : !step3Done ? 3 : 4

          const steps = [
            { label: '服務', done: true },
            { label: '資料', done: step2Done },
            { label: '日期', done: step3Done },
            { label: '送出', done: false },
          ]

          return (
            <div className="max-w-lg mx-auto px-8 pb-3 flex items-center">
              {steps.map((s, i) => {
                const isActive = i + 1 === currentStep
                const isDone = s.done && i + 1 < currentStep
                return (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isDone ? 'var(--oak)' : isActive ? 'transparent' : 'transparent',
                        border: isDone ? 'none' : isActive ? '2px solid var(--oak)' : '1.5px solid rgba(166,137,102,0.3)',
                        transition: 'all 0.3s',
                        flexShrink: 0,
                      }}>
                        {isDone ? (
                          <svg viewBox="0 0 12 12" fill="none" style={{ width: '10px', height: '10px' }}>
                            <path d="M2 6l2.8 3L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <div style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: isActive ? 'var(--oak)' : 'rgba(166,137,102,0.25)',
                            transition: 'background 0.3s',
                          }} />
                        )}
                      </div>
                      <span style={{
                        fontSize: '9px',
                        letterSpacing: '0.08em',
                        color: isDone || isActive ? 'var(--oak)' : 'rgba(44,40,37,0.3)',
                        fontWeight: isActive ? 600 : 400,
                        whiteSpace: 'nowrap',
                        transition: 'color 0.3s',
                      }}>{s.label}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div style={{
                        flex: 1, height: '1.5px',
                        background: isDone ? 'var(--oak)' : 'rgba(166,137,102,0.2)',
                        margin: '0 6px',
                        marginBottom: '14px',
                        transition: 'background 0.3s',
                      }} />
                    )}
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 pb-52">

        {/* ── LINE OA 加入提示（外部瀏覽器才顯示）──────── */}
        {liffReady && !lineUserId && showLineCard && (
          <div className="mb-6" style={{
            background: 'linear-gradient(135deg, rgba(6,199,85,0.08) 0%, rgba(6,199,85,0.04) 100%)',
            border: '1.5px solid rgba(6,199,85,0.25)',
            borderRadius: '16px',
            padding: '16px',
            position: 'relative',
          }}>
            <button
              type="button"
              onClick={() => setShowLineCard(false)}
              style={{
                position: 'absolute', top: '10px', right: '12px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(44,40,37,0.35)', fontSize: '16px', lineHeight: 1, padding: '2px',
              }}
            >✕</button>

            <div className="flex items-start gap-3">
              {/* LINE icon */}
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#06C755', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2C5.582 2 2 5.088 2 8.9c0 2.477 1.338 4.685 3.43 6.125-.15.555-.544 2.013-.623 2.325-.1.388.143.385.3.28.123-.083 1.97-1.3 2.766-1.829.53.075 1.073.115 1.627.115C14.418 15.916 18 12.828 18 9.04 18 5.25 14.418 2 10 2Z" fill="white"/>
                </svg>
              </div>

              <div style={{ flex: 1, paddingRight: '20px' }}>
                <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--charcoal)' }}>加入 MooLah LINE，接收預約通知</p>
                <p className="text-xs mb-3" style={{ color: 'rgba(44,40,37,0.60)' }}>加入後可即時收到預約確認，以及前一天的提醒通知</p>
                <a
                  href="https://line.me/R/ti/p/@881zhkla"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '99px',
                    background: '#06C755', color: 'white',
                    fontSize: '12px', fontWeight: 600, textDecoration: 'none',
                    letterSpacing: '0.02em',
                  }}
                >
                  立即加入 →
                </a>
                <span
                  onClick={() => setShowLineCard(false)}
                  className="text-xs ml-4"
                  style={{ color: 'rgba(44,40,37,0.40)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  略過，直接預約
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── 服務摘要卡 ─────────────────────────────── */}
        <div data-animate className="mb-8 p-4" style={{
          background: 'white',
          border: '1px solid rgba(26,23,20,0.10)',
          borderRadius: '16px',
          borderLeft: '3px solid var(--charcoal)',
          boxShadow: '0 2px 12px rgba(26,23,20,0.07)',
        }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase mb-1.5" style={{ color: 'var(--oak)' }}>預約服務</p>
              <p className="text-base font-medium" style={{ color: 'var(--charcoal)' }}>{service.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(44,40,37,0.55)' }}>{service.duration} 分鐘</p>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <p className="font-display text-2xl" style={{ color: 'var(--charcoal)' }}>NT$ {service.price.toLocaleString()}</p>
              <span style={{
                fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase',
                padding: '3px 8px', borderRadius: '4px',
                background: 'var(--charcoal)', color: 'rgba(251,249,244,0.85)',
              }}>已選擇</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-0">
            <style>{`
              .book-section { padding: 28px 0; border-bottom: 1px solid rgba(26,23,20,0.07); }
              .book-section:last-child { border-bottom: none; }
            `}</style>

            {/* 聯絡資訊（非 LINE 用戶） */}
            {liffReady && !lineUserId && (
              <div data-animate data-delay="50" className="book-section">
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
            <div data-animate data-delay="100" className="book-section">
              <SectionLabel step="01" label="性別" />
              <PillGroup options={GENDER_OPTIONS} value={gender} onChange={setGender} />
            </div>

            {/* 髮長 */}
            {isHairCategory && (
              <div data-animate data-delay="150" className="book-section">
                <SectionLabel step="02" label="目前髮長" />
                <PillGroup options={HAIR_LENGTH_OPTIONS} value={hairLength} onChange={setHairLength} />
              </div>
            )}

            {/* 日期 */}
            <div data-animate data-delay="200" className="book-section">
              <SectionLabel step={isHairCategory ? '03' : '02'} label="選擇日期" />
              <InlineCalendar providerId={providerId} value={date} onChange={setDate} />
            </div>

            {/* 時段 */}
            {date && (
              <div data-animate className="book-section">
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
                        const isWaitlistTarget = waitlistSlot === slot.time
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => {
                              if (isBooked) {
                                setWaitlistSlot(isWaitlistTarget ? null : slot.time)
                                setWaitlistDone(false)
                              } else {
                                setTime(slot.time)
                                setWaitlistSlot(null)
                              }
                            }}
                            style={{
                              position: 'relative',
                              padding: '10px 4px',
                              borderRadius: '10px',
                              fontSize: '13px',
                              cursor: 'pointer',
                              border: isSelected
                                ? '1.5px solid var(--charcoal)'
                                : isWaitlistTarget
                                  ? '1.5px solid rgba(180,120,40,0.6)'
                                  : isBooked
                                    ? '1.5px solid rgba(180,120,40,0.25)'
                                    : isHot
                                      ? '1.5px solid rgba(196,132,90,0.50)'
                                      : '1.5px solid rgba(166,137,102,0.18)',
                              background: isSelected
                                ? 'var(--charcoal)'
                                : isWaitlistTarget
                                  ? 'rgba(180,120,40,0.12)'
                                  : isBooked
                                    ? 'rgba(180,120,40,0.05)'
                                    : isHot
                                      ? 'rgba(196,132,90,0.10)'
                                      : 'rgba(255,255,255,0.80)',
                              color: isSelected
                                ? 'var(--cream)'
                                : isBooked
                                  ? 'rgba(160,100,30,0.7)'
                                  : isHot
                                    ? '#c4845a'
                                    : 'var(--charcoal)',
                              boxShadow: isSelected
                                ? '0 3px 10px rgba(44,40,37,0.18)'
                                : isBooked ? 'none' : '0 1px 3px rgba(166,137,102,0.08)',
                              transform: isSelected ? 'translateY(-1px)' : 'translateY(0)',
                              fontWeight: isSelected ? 500 : 400,
                              fontFamily: 'var(--font-dm-sans)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {slot.time}
                            {isBooked && <span style={{ display: 'block', fontSize: '10px', marginTop: '2px', color: 'rgba(160,100,30,0.65)' }}>候補</span>}
                            {isHot && !isSelected && !isBooked && (
                              <span style={{ position: 'absolute', top: '-8px', right: '-6px', background: '#c4845a', color: 'white', fontSize: '8px', padding: '2px 5px', borderRadius: '99px' }}>推薦</span>
                            )}
                          </button>
                        )
                      })}
                      {/* Waitlist confirmation */}
                      {waitlistSlot && !waitlistDone && (
                        <div style={{ gridColumn: '1/-1', marginTop: '4px', padding: '14px 16px', background: 'rgba(180,120,40,0.07)', border: '1px solid rgba(180,120,40,0.2)', borderRadius: '12px', animation: 'fadeIn 0.2s ease' }}>
                          <p style={{ fontSize: '12px', color: '#8a5c20', marginBottom: '10px', lineHeight: 1.5 }}>
                            加入 <strong>{waitlistSlot}</strong> 候補名單？有人取消時將第一時間通知您。
                          </p>
                          <button
                            type="button"
                            disabled={waitlistSubmitting || (!lineUserId && !customerNameInput.trim())}
                            onClick={async () => {
                              const wlName = lineUserId ? displayName : customerNameInput.trim()
                              const wlPhone = lineUserId ? '' : customerPhone.trim()
                              if (!wlName && !lineUserId) return
                              setWaitlistSubmitting(true)
                              try {
                                await fetch('/api/waitlist', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    providerId, serviceId: service?.id, date,
                                    time: waitlistSlot, customerName: wlName,
                                    customerLineUserId: lineUserId, customerPhone: wlPhone,
                                  }),
                                })
                                setWaitlistDone(true)
                              } finally {
                                setWaitlistSubmitting(false)
                              }
                            }}
                            style={{ padding: '8px 20px', background: '#8a5c20', color: 'white', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            {waitlistSubmitting ? '處理中…' : '確認加入候補'}
                          </button>
                          <button type="button" onClick={() => setWaitlistSlot(null)} style={{ marginLeft: '8px', fontSize: '12px', color: 'rgba(44,40,37,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>取消</button>
                        </div>
                      )}
                      {waitlistDone && (
                        <div style={{ gridColumn: '1/-1', marginTop: '4px', padding: '12px 16px', background: 'rgba(34,180,100,0.08)', border: '1px solid rgba(34,180,100,0.2)', borderRadius: '12px', textAlign: 'center' }}>
                          <p style={{ fontSize: '12px', color: '#22b464', fontWeight: 500 }}>✓ 已加入候補名單，有空位時將立即通知您</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 備註 */}
            <div data-animate className="book-section">
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
        style={{ background: 'linear-gradient(to top, #ede8dc 0%, #f0ebe1 50%, transparent 100%)', borderTop: '1px solid rgba(26,23,20,0.08)' }}>
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
