'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import liff from '@line/liff'
import { ga } from '@/lib/gtag'

type Service = { id: string; name: string; price: number; duration: number; description?: string; imageUrl?: string }
type Provider = { id: string; name: string; category: string; rating?: string; reviewCount?: string; address?: string; storeName?: string }
type SlotStatus = 'available' | 'booked' | 'hot'
type Slot = { time: string; status: SlotStatus }
type DayStatus = 'open' | 'limited' | 'full' | 'closed'
type PortfolioItem = { id: string; imageUrl: string; caption: string }

const GENDER_OPTIONS = ['女性', '男性', '不透露']
const HAIR_LENGTH_OPTIONS = ['超短髮', '短髮', '中長髮', '長髮', '超長髮']
const HAIR_CATEGORIES = ['髮型設計師']
const NOTE_TAGS = ['第一次來', '想換個風格', '特殊場合', '有指定參考', '預算有限', '會晚一點到']

// ── ChapterHeader ─────────────────────────────────────────────────────
// 去典禮化：不用編號/英文 eyebrow/菱形裝飾，直接一個清楚的群組標題（product register）
function ChapterHeader({ title }: { no?: string; eyebrow?: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0 18px' }}>
      <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--charcoal)', lineHeight: 1.2, letterSpacing: '0.01em' }}>{title}</p>
      <span style={{ flex: 1, height: '1px', background: 'rgba(166,137,102,0.22)' }} />
    </div>
  )
}

// ── Segmented (sliding indicator) ────────────────────────────────────
function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const n = options.length
  const idx = options.indexOf(value)
  return (
    <div style={{
      position: 'relative', display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`,
      background: 'rgba(166,137,102,0.1)', border: '1px solid rgba(166,137,102,0.22)',
      borderRadius: '99px', padding: '4px',
    }}>
      {idx >= 0 && (
        <div style={{
          position: 'absolute', top: '4px', bottom: '4px',
          left: `calc(4px + ${idx} * (100% - 8px) / ${n})`,
          width: `calc((100% - 8px) / ${n})`,
          background: 'var(--charcoal)', borderRadius: '99px',
          boxShadow: '0 3px 10px rgba(44,40,37,0.25)',
          transition: 'left 0.38s var(--ease-expo)',
        }} />
      )}
      {options.map(o => {
        const sel = o === value
        return (
          <button key={o} type="button" onClick={() => onChange(o)} style={{
            position: 'relative', zIndex: 1, background: 'none', border: 'none',
            padding: '11px 4px', cursor: 'pointer',
            fontSize: '13px', fontWeight: sel ? 600 : 400,
            color: sel ? 'var(--cream)' : 'var(--charcoal)',
            transition: 'color 0.3s',
          }}>{o}</button>
        )
      })}
    </div>
  )
}

// ── DateQuickChips ────────────────────────────────────────────────────
function DateQuickChips({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tmr = new Date(today); tmr.setDate(today.getDate() + 1)
  const sat = new Date(today); sat.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7))
  const chips = [
    { label: '今天', d: fmt(today) },
    { label: '明天', d: fmt(tmr) },
    { label: '本週末', d: fmt(sat) },
  ]
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
      {chips.map(c => {
        const sel = value === c.d
        return (
          <button key={c.label} type="button" onClick={() => onChange(c.d)} style={{
            padding: '11px 16px', borderRadius: '99px', fontSize: '12px', cursor: 'pointer',
            border: sel ? '1.5px solid var(--charcoal)' : '1.5px solid rgba(166,137,102,0.25)',
            background: sel ? 'var(--charcoal)' : 'rgba(255,255,255,0.7)',
            color: sel ? 'var(--cream)' : 'var(--charcoal)',
            fontWeight: sel ? 600 : 400, transition: 'all 0.18s ease',
          }}>{c.label}</button>
        )
      })}
    </div>
  )
}

// ── QuickTags ─────────────────────────────────────────────────────────
function QuickTags({ tags, selected, onToggle }: { tags: string[]; selected: string[]; onToggle: (tag: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
      {tags.map(tag => {
        const sel = selected.includes(tag)
        return (
          <button key={tag} type="button" onClick={() => onToggle(tag)} style={{
            padding: '7px 14px', borderRadius: '99px', fontSize: '12px', cursor: 'pointer',
            border: sel ? '1.5px solid var(--oak)' : '1.5px solid rgba(166,137,102,0.25)',
            background: sel ? 'rgba(166,137,102,0.14)' : 'rgba(255,255,255,0.6)',
            color: sel ? 'var(--oak)' : 'rgba(44,40,37,0.7)',
            fontWeight: sel ? 600 : 400, transition: 'all 0.18s ease',
            display: 'inline-flex', alignItems: 'center', gap: '5px',
          }}>
            {sel && <span style={{ fontSize: '10px' }}>✓</span>}{tag}
          </button>
        )
      })}
    </div>
  )
}

// ── InspirationPicker ─────────────────────────────────────────────────
function InspirationPicker({ items, selected, onToggle, max = 2 }: {
  items: PortfolioItem[]; selected: string[]; onToggle: (id: string) => void; max?: number
}) {
  if (!items.length) return null
  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '2px 0 10px', margin: '0 -20px', paddingLeft: '20px', paddingRight: '20px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', scrollSnapType: 'x proximity' }}>
        {items.map(item => {
          const sel = selected.includes(item.id)
          const dim = !sel && selected.length >= max
          return (
            <button key={item.id} type="button" onClick={() => !dim && onToggle(item.id)}
              style={{
                flex: '0 0 88px', position: 'relative', height: '110px', borderRadius: '12px', overflow: 'hidden',
                border: sel ? '2.5px solid var(--oak)' : '2px solid transparent',
                padding: 0, cursor: dim ? 'default' : 'pointer', scrollSnapAlign: 'start',
                opacity: dim ? 0.4 : 1, transition: 'opacity 0.2s, border-color 0.2s, transform 0.13s', background: '#e0d4c0',
              }}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(135deg, #efe6da 0 10px, #e6dccd 10px 20px)' }} />
              )}
              {item.caption && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px', background: 'linear-gradient(transparent, rgba(26,23,20,0.65))', fontSize: '9px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.2 }}>
                  {item.caption}
                </div>
              )}
              {sel && (
                <span style={{ position: 'absolute', top: '6px', right: '6px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--oak)', display: 'grid', placeItems: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                  <svg viewBox="0 0 12 12" style={{ width: '10px', height: '10px' }}><path d="M2 6l2.8 3L10 3" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              )}
            </button>
          )
        })}
      </div>
      <p style={{ fontSize: '10px', color: 'rgba(44,40,37,0.4)', marginTop: '2px' }}>最多選 {max} 張 · 已選 {selected.length}</p>
    </div>
  )
}

// ── PillGroup (hair length) ───────────────────────────────────────────
function PillGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const selected = value === opt
        return (
          <button key={opt} type="button" onClick={() => onChange(opt)} style={{
            padding: '12px 20px', borderRadius: '99px', fontSize: '13px',
            border: selected ? '1.5px solid var(--charcoal)' : '1.5px solid rgba(166,137,102,0.28)',
            background: selected ? 'var(--charcoal)' : 'rgba(255,255,255,0.75)',
            color: selected ? 'var(--cream)' : 'var(--charcoal)',
            boxShadow: selected ? '0 3px 10px rgba(44,40,37,0.18)' : '0 1px 3px rgba(166,137,102,0.10)',
            transform: selected ? 'translateY(-1px)' : 'none',
            transition: 'all 0.18s ease', cursor: 'pointer', fontWeight: selected ? 500 : 400,
          }}>{opt}</button>
        )
      })}
    </div>
  )
}

// ── FieldLabel ────────────────────────────────────────────────────────
function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '12px' }}>
      <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', color: 'var(--charcoal)' }}>{children}</span>
      {hint && <span style={{ fontSize: '10px', color: 'rgba(44,40,37,0.4)' }}>{hint}</span>}
    </div>
  )
}

// ── InlineCalendar ────────────────────────────────────────────────────
function InlineCalendar({ providerId, value, onChange }: {
  providerId: string; value: string; onChange: (date: string) => void
}) {
  const nowDate = new Date(); nowDate.setHours(0, 0, 0, 0)
  const todayStr = nowDate.toISOString().split('T')[0]
  const currentMonthStr = todayStr.slice(0, 7)
  const [viewMonth, setViewMonth] = useState(() => value ? value.slice(0, 7) : currentMonthStr)
  const [avail, setAvail] = useState<Record<string, DayStatus>>({})
  const [ripple, setRipple] = useState<{ key: number; day: string; x: number; y: number } | null>(null)

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

  function pick(e: React.MouseEvent<HTMLButtonElement>, dateStr: string) {
    const r = e.currentTarget.getBoundingClientRect()
    setRipple({ key: Date.now(), day: dateStr, x: e.clientX - r.left, y: e.clientY - r.top })
    setTimeout(() => setRipple(null), 620)
    onChange(dateStr)
  }

  const DOW_LABELS = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div style={{
      background: 'rgba(255,255,255,0.85)', border: '1.5px solid rgba(166,137,102,0.2)',
      borderRadius: '16px', padding: '14px 12px', boxShadow: '0 2px 12px rgba(26,23,20,0.06)',
    }}>
      <style>{`@keyframes cal-ripple { to { transform: scale(8); opacity: 0 } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', padding: '0 4px' }}>
        <button type="button" onClick={prevM} disabled={viewMonth <= currentMonthStr}
          style={{ background: 'none', border: 'none', fontSize: '20px', lineHeight: 1, padding: '4px 10px',
            color: viewMonth <= currentMonthStr ? 'rgba(166,137,102,0.2)' : 'var(--oak)',
            cursor: viewMonth <= currentMonthStr ? 'default' : 'pointer' }}>‹</button>
        <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '16px', fontWeight: 500, color: 'var(--charcoal)', letterSpacing: '0.04em' }}>
          {yr} 年 {mo} 月
        </p>
        <button type="button" onClick={nextM}
          style={{ background: 'none', border: 'none', fontSize: '20px', lineHeight: 1, padding: '4px 10px', color: 'var(--oak)', cursor: 'pointer' }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
        {DOW_LABELS.map(l => (
          <div key={l} style={{ textAlign: 'center', fontSize: '10px', color: 'rgba(44,40,37,0.28)', paddingBottom: '6px' }}>{l}</div>
        ))}
      </div>
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
          const rippling = ripple && ripple.day === dateStr
          return (
            <button key={day} type="button" disabled={isDisabled}
              onClick={e => !isDisabled && pick(e, dateStr)}
              style={{
                position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                padding: '11px 2px', borderRadius: '8px', border: 'none',
                cursor: isDisabled ? 'default' : 'pointer',
                background: isSelected ? 'var(--charcoal)' : isToday ? 'rgba(166,137,102,0.15)' : 'transparent',
                opacity: isPast ? 0.22 : 1, transition: 'background 0.15s',
              }}>
              {rippling && (
                <span style={{
                  position: 'absolute', left: ripple.x, top: ripple.y,
                  width: '8px', height: '8px', marginLeft: '-4px', marginTop: '-4px',
                  borderRadius: '50%', background: 'var(--oak)', opacity: 0.5,
                  pointerEvents: 'none', animation: 'cal-ripple 0.6s ease forwards',
                }} />
              )}
              <span style={{
                fontSize: '13px', lineHeight: 1, position: 'relative', zIndex: 1,
                fontWeight: isSelected || isToday ? 600 : 400,
                color: isSelected ? 'white' : isToday ? 'var(--oak)' : isDisabled && !isPast ? 'rgba(44,40,37,0.25)' : 'var(--charcoal)',
              }}>{day}</span>
              {!isPast && status !== 'closed' && (
                <span style={{
                  width: '4px', height: '4px', borderRadius: '50%', flexShrink: 0, position: 'relative', zIndex: 1,
                  background: isSelected ? 'rgba(255,255,255,0.5)' : status === 'full' ? 'transparent' : status === 'limited' ? 'rgba(166,137,102,0.5)' : 'var(--oak)',
                }} />
              )}
            </button>
          )
        })}
      </div>
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

// ── CompletionScreen ──────────────────────────────────────────────────
function CompletionScreen({ providerName, serviceName, date, time, onBack, isLineUser, consumerNotified, serviceDuration, servicePrice, providerAddress }: {
  providerName: string; serviceName: string; date: string; time: string
  onBack: () => void; isLineUser: boolean; consumerNotified: boolean
  serviceDuration: number; servicePrice: number; providerAddress: string
}) {
  function handleAddToCalendar() {
    const start = new Date(`${date}T${time}:00+08:00`)
    const end = new Date(start.getTime() + (serviceDuration || 60) * 60000)
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    // Google 日曆「新增活動」連結——手機 / LINE webview 都能開（取代 .ics blob 下載，webview 不支援）
    const gcal = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + `&text=${encodeURIComponent(`${providerName} · ${serviceName}`)}`
      + `&dates=${fmt(start)}/${fmt(end)}`
      + `&details=${encodeURIComponent(`MooLah 預約 - ${serviceName}`)}`
      + `&location=${encodeURIComponent(providerAddress || '')}`
    try { liff.openWindow({ url: gcal, external: true }) } catch { window.open(gcal, '_blank') }
  }

  // 「我的預約」需 LINE 身分 → 走 LIFF 連結經已註冊的 /dashboard 轉址（直接 /my-bookings 不在 LINE Login 白名單會報錯）
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID || ''
  const myBookingsUrl = `https://liff.line.me/${liffId}?to=${encodeURIComponent('/my-bookings')}`
  // web 訪客（無 LINE 身分）在「我的預約」追蹤不到自己的預約 → 改引導加好友（才收得到提醒）
  const trackHref = isLineUser ? myBookingsUrl : 'https://line.me/R/ti/p/@881zhkla'
  const trackLabel = isLineUser ? '我的預約' : '加好友追蹤'

  const mapUrl = providerAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(providerAddress)}`
    : ''
  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-plus-jakarta), var(--font-dm-sans), sans-serif', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes drawCircle { to { stroke-dashoffset: 0; } }
        @keyframes drawCheck  { to { stroke-dashoffset: 0; } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        @keyframes pulseRing { 0% { transform: scale(0.95); opacity: 0.6; } 50% { transform: scale(1.08); opacity: 0.15; } 100% { transform: scale(0.95); opacity: 0.6; } }
        @keyframes petalFall { 0% { transform: translateY(-20px) rotate(var(--rot,0deg)); opacity: 0.9; } 100% { transform: translateY(100vh) translateX(var(--drift,0px)) rotate(calc(var(--rot,0deg) + 180deg)); opacity: 0; } }
      `}</style>
      <div style={{
        background: 'var(--charcoal-deep)', flex: '0 0 52vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', padding: '40px 24px 48px',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: '300px 300px' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--oak), transparent)' }} />
        <div style={{ position: 'relative', marginBottom: '28px' }}>
          <div style={{ position: 'absolute', inset: '-16px', borderRadius: '50%', border: '1px solid rgba(166,137,102,0.25)', animation: 'pulseRing 2.8s ease-in-out 1s infinite' }} />
          <svg width="100" height="100" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="44" fill="rgba(166,137,102,0.07)" stroke="rgba(166,137,102,0.18)" strokeWidth="1" />
            <circle cx="48" cy="48" r="44" fill="none" stroke="var(--oak)" strokeWidth="2"
              strokeDasharray="276" strokeDashoffset="276" strokeLinecap="round"
              style={{ animation: 'drawCircle 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s forwards' }} />
            <polyline points="28,50 42,64 68,36" fill="none" stroke="#fbf9f4" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" strokeDashoffset="60"
              style={{ animation: 'drawCheck 0.35s ease 0.45s forwards' }} />
          </svg>
        </div>
        <p style={{ fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--oak)', marginBottom: '10px', animation: 'fadeSlideUp 0.4s ease 0.5s both' }}>Booking Confirmed</p>
        <h1 className="font-display" style={{ fontSize: 'clamp(2.4rem,8vw,3.5rem)', fontWeight: 300, letterSpacing: '-0.01em', color: '#fbf9f4', lineHeight: 1.1, textAlign: 'center', animation: 'fadeSlideUp 0.4s ease 0.55s both' }}>預約完成</h1>
        <div style={{ width: '36px', height: '1px', background: 'var(--oak)', margin: '16px 0', opacity: 0.5, animation: 'fadeSlideUp 0.4s ease 0.6s both' }} />
        <p style={{ fontSize: '13px', color: 'rgba(251,249,244,0.45)', letterSpacing: '0.08em', textAlign: 'center', animation: 'fadeSlideUp 0.4s ease 0.65s both' }}>{providerName} &nbsp;·&nbsp; {serviceName}</p>
      </div>
      <div style={{ background: '#f5efe6', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px 40px', position: 'relative' }}>
        <div style={{ marginTop: '-28px', width: '100%', maxWidth: '320px', background: 'white', border: '1px solid rgba(166,137,102,0.18)', borderRadius: '18px', padding: '20px 24px', boxShadow: '0 8px 32px rgba(26,23,20,0.12)', animation: 'fadeSlideUp 0.4s ease 0.7s both', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
            <span className="font-display" style={{ fontSize: '28px', fontWeight: 300, color: 'var(--oak)' }}>{date}</span>
            <span style={{ width: '1px', height: '20px', background: 'rgba(166,137,102,0.3)', display: 'inline-block', alignSelf: 'center' }} />
            <span className="font-display" style={{ fontSize: '24px', fontWeight: 300, color: 'var(--charcoal)' }}>{time}</span>
          </div>
          <div style={{ height: '1px', background: 'rgba(166,137,102,0.12)', margin: '0 -8px 12px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--oak)', opacity: 0.6 }} />
            <span style={{ fontSize: '12px', color: 'rgba(44,40,37,0.55)' }}>{providerName} · {serviceName}</span>
          </div>
          {servicePrice > 0 && (
            <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '13px', color: 'var(--oak)', fontWeight: 600, letterSpacing: '0.02em' }}>
              到店付款 · NT$ {servicePrice.toLocaleString()}
            </p>
          )}
        </div>
        <div style={{ width: '100%', maxWidth: '320px', animation: 'fadeSlideUp 0.4s ease 0.75s both' }}>
          {consumerNotified ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(6,199,85,0.08)', border: '1px solid rgba(6,199,85,0.2)', marginBottom: '20px' }}>
              <svg viewBox="0 0 20 20" fill="none" style={{ width: '16px', height: '16px', flexShrink: 0 }}>
                <path d="M10 1.5C5.31 1.5 1.5 5.31 1.5 10c0 4.69 3.81 8.5 8.5 8.5s8.5-3.81 8.5-8.5c0-4.69-3.81-8.5-8.5-8.5zm-1 12.06l-3-3 1.06-1.06 1.94 1.94 4.44-4.44 1.06 1.06-5.5 5.5z" fill="#06C755"/>
              </svg>
              <p style={{ fontSize: '12px', color: 'rgba(44,40,37,0.65)', lineHeight: 1.5 }}>LINE 確認通知已傳送給您與設計師</p>
            </div>
          ) : (
            <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(26,23,20,0.04)', border: '1px solid rgba(44,40,37,0.1)', marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: 'rgba(44,40,37,0.55)', marginBottom: '12px', lineHeight: 1.6, textAlign: 'center' }}>
                {isLineUser ? '加入 MooLah LINE 好友，即可接收預約確認與提醒' : '設計師已收到通知。加入 LINE 好友可接收後續提醒'}
              </p>
              <a href="https://line.me/R/ti/p/@881zhkla" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px 20px', borderRadius: '10px', background: '#06C755', color: 'white', fontSize: '13px', fontWeight: 500, textDecoration: 'none', boxShadow: '0 2px 12px rgba(6,199,85,0.28)' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1C4.134 1 1 3.701 1 7.04c0 1.982 1.07 3.748 2.744 4.9-.12.444-.435 1.61-.498 1.86-.08.31.114.308.24.224.099-.066 1.577-1.04 2.213-1.463.424.06.858.092 1.301.092C11.866 12.653 15 9.952 15 6.613 15 3.274 11.866 1 8 1Z" fill="white"/></svg>
                加入 MooLah LINE 好友
              </a>
            </div>
          )}
        </div>
        {/* Reassurance action grid: calendar + map */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', maxWidth: '320px', animation: 'fadeSlideUp 0.4s ease 0.8s both', marginBottom: '10px' }}>
          <button onClick={handleAddToCalendar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', borderRadius: '12px', background: 'var(--charcoal)', color: 'var(--cream)', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', letterSpacing: '0.02em' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: '14px', height: '14px' }}>
              <rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M5 1.5v3M11 1.5v3M2 7h12"/>
            </svg>
            加入行事曆
          </button>
          {mapUrl ? (
            <a href={mapUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', borderRadius: '12px', background: 'rgba(166,137,102,0.14)', color: 'var(--oak)', fontSize: '12px', fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(166,137,102,0.25)', letterSpacing: '0.02em' }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: '14px', height: '14px' }}>
                <path d="M8 1.5a4.5 4.5 0 014.5 4.5c0 3.5-4.5 8-4.5 8s-4.5-4.5-4.5-8A4.5 4.5 0 018 1.5z"/><circle cx="8" cy="6" r="1.5"/>
              </svg>
              查看地圖
            </a>
          ) : (
            <a href={trackHref}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', borderRadius: '12px', background: 'rgba(166,137,102,0.14)', color: 'var(--oak)', fontSize: '12px', fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(166,137,102,0.25)', letterSpacing: '0.02em' }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '13px', height: '13px' }}><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 2v2M11 2v2M2 7h12"/></svg>
              {trackLabel}
            </a>
          )}
        </div>

        {/* Secondary actions */}
        <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '320px', animation: 'fadeSlideUp 0.4s ease 0.85s both' }}>
          <a href={trackHref} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', borderRadius: '10px', background: 'rgba(44,40,37,0.07)', border: '1px solid rgba(44,40,37,0.1)', fontSize: '12px', color: 'rgba(44,40,37,0.65)', textDecoration: 'none', fontWeight: 500 }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '13px', height: '13px' }}><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 2v2M11 2v2M2 7h12"/></svg>
            {trackLabel}
          </a>
          <a href="https://line.me/R/ti/p/@881zhkla" target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', borderRadius: '10px', background: 'rgba(6,199,85,0.07)', border: '1px solid rgba(6,199,85,0.2)', fontSize: '12px', color: '#06C755', textDecoration: 'none', fontWeight: 500 }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1C4.134 1 1 3.701 1 7.04c0 1.982 1.07 3.748 2.744 4.9-.12.444-.435 1.61-.498 1.86-.08.31.114.308.24.224.099-.066 1.577-1.04 2.213-1.463.424.06.858.092 1.301.092C11.866 12.653 15 9.952 15 6.613 15 3.274 11.866 1 8 1Z" fill="#06C755"/></svg>
            LINE 聯繫
          </a>
        </div>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(44,40,37,0.35)', paddingBottom: '2px', borderBottom: '1px solid rgba(44,40,37,0.15)', marginTop: '18px', animation: 'fadeSlideUp 0.4s ease 0.9s both' }}>
          返回設計師頁面
        </button>
      </div>
    </div>
  )
}

// ── BookPage ──────────────────────────────────────────────────────────
export default function BookPage() {
  const { providerId } = useParams<{ providerId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const serviceId = searchParams.get('service') ?? ''
  const initialDate = searchParams.get('date') ?? ''
  const timeRef = useRef<HTMLDivElement>(null)

  const [provider, setProvider] = useState<Provider | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [allServices, setAllServices] = useState<Service[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [selectedInspirations, setSelectedInspirations] = useState<string[]>([])
  const [lineUserId, setLineUserId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [customerNameInput, setCustomerNameInput] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [liffReady, setLiffReady] = useState(false)
  const [showLineCard, setShowLineCard] = useState(true)
  const [needAddFriend, setNeedAddFriend] = useState(false)

  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState('')
  const [gender, setGender] = useState('')
  const [hairLength, setHairLength] = useState('')
  const [note, setNote] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')  // 送出失敗內嵌提示（取代 alert）
  const [done, setDone] = useState(false)
  const [consumerNotified, setConsumerNotified] = useState(false)
  const [isHairCategory, setIsHairCategory] = useState(false)
  const [waitlistSlot, setWaitlistSlot] = useState<string | null>(null)
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false)
  const [waitlistDone, setWaitlistDone] = useState(false)
  const [nextAvailable, setNextAvailable] = useState<{ date: string; time: string; label: string } | null>(null)
  const [forOthers, setForOthers] = useState(false)
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [nameInputFocus, setNameInputFocus] = useState(false)
  const [phoneInputFocus, setPhoneInputFocus] = useState(false)

  useEffect(() => {
    liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
      .then(async () => {
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile()
          setLineUserId(profile.userId)
          setDisplayName(profile.displayName)
          setCustomerNameInput(prev => prev || profile.displayName)  // 預填 LINE 名方便，仍可改、仍必填
          setLiffReady(true)
          // 檢查是否已加 OA 好友——沒加就收不到 LINE 預約提醒
          try {
            const fs = await liff.getFriendship()
            if (!fs.friendFlag) setNeedAddFriend(true)
          } catch { /* 外部瀏覽器不支援，略過 */ }
        } else if (liff.isInClient()) {
          liff.login({ redirectUri: window.location.href })
        } else {
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
        setAllServices(data.services ?? [])
        setPortfolio(data.portfolio ?? [])
        const svc = serviceId
          ? data.services.find((s: Service) => s.id === serviceId) ?? null
          : data.services[0] ?? null
        setService(svc)
        const sid = svc?.id ?? ''
        fetch(`/api/next-available?providerId=${providerId}&serviceId=${sid}`)
          .then(r => r.json())
          .then(d => { if (d.date) setNextAvailable(d) })
          .catch(() => {})
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

  function toggleTag(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  function toggleInspiration(id: string) {
    setSelectedInspirations(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 2 ? [...prev, id] : prev
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const bookerName = customerNameInput.trim()
    const name = forOthers ? recipientName.trim() : bookerName
    const phone = forOthers ? recipientPhone.trim() : customerPhone.trim()
    const tagStr = selectedTags.join('、')
    const inspirationStr = selectedInspirations.length > 0
      ? `靈感參考：${selectedInspirations.map(id => portfolio.find(p => p.id === id)?.caption || id).join('、')}`
      : ''
    const combinedNote = [tagStr, inspirationStr, note.trim()].filter(Boolean).join(' / ')
    const finalNote = forOthers && bookerName ? `[代訂人：${bookerName}]${combinedNote ? ' ' + combinedNote : ''}` : combinedNote
    if (!date || !time || !gender || !name || (!forOthers && !phone)) return
    setSubmitting(true); setSubmitError('')
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId, serviceId: service?.id,
          customerName: name, customerLineUserId: forOthers ? '' : (lineUserId || ''),
          customerPhone: phone, date, time, note: finalNote, gender,
          hairLength: isHairCategory ? hairLength : '',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setConsumerNotified(data.consumerNotified ?? false)
        ga.completeBooking(providerId, service?.id || '', service?.price || 0)
        setDone(true)
      } else {
        // 針對「時段剛被搶走 (409)」給明確訊息並重新整理可選時段，而非叫他重來
        let msg = '預約失敗，請稍後再試'
        const err = await res.json().catch(() => ({} as { message?: string }))
        if (res.status === 409) {
          msg = err.message || '這個時段剛被預約，請改選其他時段'
          setTime('')
          fetchSlots(date)
        } else if (err.message) {
          msg = err.message
        }
        setSubmitError(msg)
      }
    } catch {
      setSubmitError('網路連線不穩，請稍後再試一次')
    } finally {
      setSubmitting(false)
    }
  }

  if (done && provider && service) {
    return <CompletionScreen
      providerName={provider.storeName || provider.name}
      serviceName={service.name}
      date={date} time={time}
      onBack={() => router.push(`/${providerId}`)}
      isLineUser={!!lineUserId}
      consumerNotified={consumerNotified}
      serviceDuration={service.duration}
      servicePrice={service.price}
      providerAddress={provider.address ?? ''}
    />
  }

  // provider 載入完成但沒有任何服務 → 不要無限骨架，給友善訊息
  if (provider && allServices.length === 0) {
    return (
      <div style={{ display: 'flex', minHeight: '100svh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '14px', padding: '32px', background: '#f5efe6', textAlign: 'center' }}>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '22px', color: 'var(--charcoal)' }}>尚未開放線上預約</p>
        <p style={{ fontSize: '13px', color: 'rgba(44,40,37,0.55)', lineHeight: 1.7 }}>{provider.storeName || provider.name} 尚未設定服務項目，<br />請直接聯絡店家，或晚點再來看看 🌿</p>
        <a href="/discover" style={{ marginTop: '8px', padding: '11px 24px', borderRadius: '99px', background: 'var(--oak)', color: 'var(--cream)', fontSize: '13px', textDecoration: 'none' }}>探索其他職人</a>
      </div>
    )
  }

  if (!provider || !service) {
    return (
      <div className="max-w-[480px] mx-auto" style={{ background: '#f5efe6', minHeight: '100vh', overflow: 'hidden' }}>
        <style>{`@keyframes shimmer{0%{background-position:-480px 0}100%{background-position:480px 0}}.bsk{background:linear-gradient(90deg,rgba(166,137,102,0.07) 25%,rgba(166,137,102,0.14) 50%,rgba(166,137,102,0.07) 75%);background-size:960px 100%;animation:shimmer 1.4s infinite linear;border-radius:10px;}`}</style>
        <div style={{ background: 'var(--charcoal-deep)', borderBottom: '1px solid rgba(166,137,102,0.2)', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

  const hotCount = slots.filter(s => s.status === 'hot').length
  const hasCustomerInfo = forOthers
    ? recipientName.trim().length > 0
    : (customerNameInput.trim().length > 0 && customerPhone.trim().length > 0)
  // 寬鬆電話驗證：去掉非數字後 ≥ 8 碼才算有效（擋 typo，不誤擋市話/含符號格式）
  const phoneValid = forOthers || customerPhone.replace(/\D/g, '').length >= 8
  const canSubmit = liffReady && date && time && gender && (isHairCategory ? !!hairLength : true) && hasCustomerInfo && phoneValid && !submitting

  const fmtDate = date ? `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}` : ''
  // 選定時段的結束時間（讓客人知道大約做到幾點）
  const endTime = (time && service) ? (() => {
    const [h, m] = time.split(':').map(Number)
    const e = new Date(2000, 0, 1, h, m + (service.duration || 60))
    return `${String(e.getHours()).padStart(2, '0')}:${String(e.getMinutes()).padStart(2, '0')}`
  })() : ''

  // Time slot grouped renderer
  function renderSlots() {
    if (loadingSlots) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0' }}>
          <div className="w-5 h-5 rounded-full border-2 border-[rgba(166,137,102,0.20)] border-t-[#A68966] animate-spin" />
          <span style={{ fontSize: '13px', color: 'rgba(44,40,37,0.65)' }}>查詢可用時段中</span>
        </div>
      )
    }

    if (!slots.length) return (
      <div style={{ padding: '14px 16px', background: 'rgba(166,137,102,0.06)', border: '1px solid rgba(166,137,102,0.2)', borderRadius: '12px' }}>
        <p style={{ fontSize: '13px', color: 'rgba(44,40,37,0.6)', lineHeight: 1.6 }}>這天已約滿或公休 🌙</p>
        <p style={{ fontSize: '12px', color: 'rgba(44,40,37,0.45)', marginTop: '4px', lineHeight: 1.5 }}>請改選其他日期{nextAvailable ? '，或點上方「最快可預約」一鍵跳到最近時段' : ''}</p>
      </div>
    )

    const periods: [string, (s: Slot) => boolean][] = [
      ['上午', s => Number(s.time.slice(0, 2)) < 12],
      ['下午', s => { const h = Number(s.time.slice(0, 2)); return h >= 12 && h < 18 }],
      ['晚上', s => Number(s.time.slice(0, 2)) >= 18],
    ]

    const slotGrid = (list: Slot[]) => (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {list.map(slot => {
          const isBooked = slot.status === 'booked'
          const isHot = slot.status === 'hot'
          const isSelected = time === slot.time
          const isWaitlistTarget = waitlistSlot === slot.time
          return (
            <button key={slot.time} type="button"
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
                position: 'relative', padding: '11px 4px',
                borderRadius: '10px', fontSize: '14px',
                cursor: 'pointer', fontVariantNumeric: 'tabular-nums',
                border: isSelected ? '1.5px solid var(--charcoal)' : isWaitlistTarget ? '1.5px solid rgba(180,120,40,0.6)' : isBooked ? '1.5px dashed rgba(180,120,40,0.28)' : isHot ? '1.5px solid rgba(196,132,90,0.50)' : '1.5px solid rgba(166,137,102,0.18)',
                background: isSelected ? 'var(--charcoal-deep)' : isWaitlistTarget ? 'rgba(180,120,40,0.12)' : isBooked ? 'rgba(180,120,40,0.04)' : isHot ? 'rgba(196,132,90,0.10)' : 'rgba(255,255,255,0.82)',
                color: isSelected ? 'var(--cream)' : isBooked ? 'rgba(150,92,26,0.85)' : isHot ? '#b26f45' : 'var(--charcoal)',
                boxShadow: isSelected ? '0 3px 12px rgba(26,23,20,0.18)' : isBooked ? 'none' : '0 1px 3px rgba(166,137,102,0.08)',
                fontWeight: isSelected ? 600 : 400,
                textDecoration: isBooked ? 'line-through' : 'none',
                transition: 'background 0.15s, border-color 0.15s, color 0.15s',
              }}>
              {slot.time}
              {isBooked && <span style={{ display: 'block', fontSize: '10px', marginTop: '2px', color: 'rgba(160,100,30,0.65)', textDecoration: 'none' }}>候補</span>}
              {isHot && !isSelected && !isBooked && (
                <span style={{ position: 'absolute', top: '-6px', right: '-3px', background: '#c4845a', color: 'white', fontSize: '8px', padding: '2px 5px', borderRadius: '99px' }}>推薦</span>
              )}
            </button>
          )
        })}
      </div>
    )

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {hotCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'rgba(196,132,90,0.08)', border: '1px solid rgba(196,132,90,0.22)', borderRadius: '10px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c4845a', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#c4845a' }}>橘色為設計師較有空的時段，預約這些服務更從容</span>
          </div>
        )}
        {periods.map(([label, fn]) => {
          const list = slots.filter(fn)
          if (!list.length) return null
          return (
            <div key={label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--oak)' }}>{label}</span>
                <span style={{ flex: 1, height: '1px', background: 'rgba(166,137,102,0.18)' }} />
                <span style={{ fontSize: '10px', color: 'rgba(44,40,37,0.35)' }}>{list.filter(s => s.status !== 'booked').length} 個可選</span>
              </div>
              {slotGrid(list)}
            </div>
          )
        })}
        {time && (
          <div style={{ padding: '11px 18px', background: 'var(--charcoal-deep)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', animation: 'fadeUp 0.25s ease' }}>
            <span style={{ fontSize: '11px', color: 'var(--oak)', flexShrink: 0 }}>已選擇</span>
            <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.9rem', color: 'var(--cream)', fontWeight: 300, lineHeight: 1 }}>{time}{endTime && <span style={{ fontSize: '1rem', color: 'rgba(251,249,244,0.55)' }}> – {endTime}</span>}</span>
            <span style={{ fontSize: '9px', color: 'rgba(251,249,244,0.45)', letterSpacing: '0.06em', flexShrink: 0 }}>{date}{service ? ` · 約 ${service.duration} 分` : ''}</span>
          </div>
        )}
        {waitlistSlot && !waitlistDone && (
          <div style={{ padding: '14px 16px', background: 'rgba(180,120,40,0.07)', border: '1px solid rgba(180,120,40,0.2)', borderRadius: '12px' }}>
            <p style={{ fontSize: '12px', color: '#8a5c20', marginBottom: '10px', lineHeight: 1.5 }}>加入 <strong>{waitlistSlot}</strong> 候補名單？有人取消時將第一時間通知您。</p>
            <button type="button" disabled={waitlistSubmitting || !customerNameInput.trim()}
              onClick={async () => {
                const wlName = customerNameInput.trim()
                const wlPhone = customerPhone.trim()
                if (!wlName) return
                setWaitlistSubmitting(true)
                try {
                  await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ providerId, serviceId: service?.id, date, time: waitlistSlot, customerName: wlName, customerLineUserId: lineUserId, customerPhone: wlPhone }) })
                  setWaitlistDone(true)
                } finally { setWaitlistSubmitting(false) }
              }}
              style={{ padding: '8px 20px', background: '#8a5c20', color: 'white', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {waitlistSubmitting ? '處理中…' : '確認加入候補'}
            </button>
            <button type="button" onClick={() => setWaitlistSlot(null)} style={{ marginLeft: '8px', fontSize: '12px', color: 'rgba(44,40,37,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>取消</button>
          </div>
        )}
        {waitlistDone && (
          <div style={{ padding: '12px 16px', background: 'rgba(34,180,100,0.08)', border: '1px solid rgba(34,180,100,0.2)', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#22b464', fontWeight: 500 }}>✓ 已加入候補名單，有空位時將立即通知您</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-[480px] mx-auto" style={{ background: 'var(--cream)', minHeight: '100vh', fontFamily: 'var(--font-plus-jakarta), var(--font-dm-sans), sans-serif' }}>
      {needAddFriend && (
        <button
          onClick={() => {
            try { liff.openWindow({ url: 'https://line.me/R/ti/p/@881zhkla', external: false }) }
            catch { window.location.href = 'https://line.me/R/ti/p/@881zhkla' }
            setNeedAddFriend(false)
          }}
          style={{
            position: 'fixed', left: '50%', bottom: '16px', transform: 'translateX(-50%)',
            zIndex: 60, width: 'calc(100% - 28px)', maxWidth: '452px',
            display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textAlign: 'left',
            background: 'var(--charcoal-deep)', color: 'var(--cream)',
            border: '1px solid rgba(166,137,102,0.4)', borderRadius: '16px',
            padding: '12px 14px', boxShadow: '0 10px 28px rgba(0,0,0,0.28)',
          }}
        >
          <span style={{ fontSize: '20px' }}>🔔</span>
          <span style={{ flex: 1, fontSize: '13px', lineHeight: 1.45 }}>
            加 <b style={{ color: 'var(--oak)' }}>MooLah</b> 好友，才收得到預約確認與提醒
          </span>
          <span style={{ background: 'var(--oak)', color: 'var(--charcoal-deep)', fontWeight: 700, fontSize: '13px', padding: '8px 14px', borderRadius: '99px', whiteSpace: 'nowrap' }}>加好友</span>
        </button>
      )}
      <style>{`
        @keyframes marqueeBook { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .ch-panel { background: var(--sand-deep); border: 1px solid rgba(166,137,102,0.18); border-radius: 22px; padding: 26px 18px 28px; margin: 14px 0; }
      `}</style>

      {/* ── Sticky header + progress ─── */}
      <div className="sticky top-0 z-40" style={{ background: 'var(--charcoal-deep)', borderBottom: '1px solid rgba(166,137,102,0.2)' }}>
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} style={{ color: 'var(--oak)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.12em' }}>← 作品集</button>
          <span className="font-display text-base tracking-[0.12em]" style={{ color: 'var(--cream)' }}>{provider.name}</span>
          <div style={{ width: '48px' }} />
        </div>
        {(() => {
          const stepTimeDone = !!date && !!time
          const stepInfoDone = !!gender && (isHairCategory ? !!hairLength : true) && hasCustomerInfo
          const currentStep = !stepTimeDone ? 2 : !stepInfoDone ? 3 : 4
          const steps = [{ label: '服務', done: true }, { label: '時段', done: stepTimeDone }, { label: '資料', done: stepInfoDone }, { label: '送出', done: false }]
          return (
            <div className="max-w-lg mx-auto px-8 pb-3 flex items-center">
              {steps.map((s, i) => {
                const isActive = i + 1 === currentStep
                const isDone = s.done && i + 1 < currentStep
                return (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDone ? 'var(--oak)' : 'transparent', border: isDone ? 'none' : isActive ? '2px solid var(--oak)' : '1.5px solid rgba(166,137,102,0.3)', transition: 'all 0.3s', flexShrink: 0 }}>
                        {isDone ? <svg viewBox="0 0 12 12" fill="none" style={{ width: '10px', height: '10px' }}><path d="M2 6l2.8 3L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          : <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? 'var(--oak)' : 'rgba(166,137,102,0.25)' }} />}
                      </div>
                      <span style={{ fontSize: '9px', letterSpacing: '0.08em', color: isDone || isActive ? 'var(--oak)' : 'rgba(251,249,244,0.28)', fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap' }}>{s.label}</span>
                    </div>
                    {i < steps.length - 1 && <div style={{ flex: 1, height: '1.5px', background: isDone ? 'var(--oak)' : 'rgba(251,249,244,0.12)', margin: '0 6px', marginBottom: '14px', transition: 'background 0.3s' }} />}
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>

      <div className="max-w-lg mx-auto px-5 py-6" style={{ paddingBottom: '120px' }}>

        {/* ── LINE OA join card ─── */}
        {liffReady && showLineCard && (
          <div className="mb-5" style={{ background: 'linear-gradient(135deg, rgba(6,199,85,0.08), rgba(6,199,85,0.04))', border: '1.5px solid rgba(6,199,85,0.25)', borderRadius: '16px', padding: '15px 16px', position: 'relative' }}>
            <button type="button" onClick={() => setShowLineCard(false)} style={{ position: 'absolute', top: '10px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(44,40,37,0.32)', fontSize: '15px', lineHeight: 1, padding: '2px' }}>✕</button>
            <div className="flex items-start gap-3">
              <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: '#06C755', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><path d="M10 2C5.582 2 2 5.088 2 8.9c0 2.477 1.338 4.685 3.43 6.125-.15.555-.544 2.013-.623 2.325-.1.388.143.385.3.28.123-.083 1.97-1.3 2.766-1.829.53.075 1.073.115 1.627.115C14.418 15.916 18 12.828 18 9.04 18 5.25 14.418 2 10 2Z" fill="white"/></svg>
              </div>
              <div style={{ flex: 1, paddingRight: '20px' }}>
                <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--charcoal)' }}>加入 MooLah LINE，接收預約通知</p>
                <p className="text-xs mb-3" style={{ color: 'rgba(44,40,37,0.60)' }}>加入後可即時收到預約確認與前一天提醒通知</p>
                <a href="https://line.me/R/ti/p/@881zhkla" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '99px', background: '#06C755', color: 'white', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>立即加入 →</a>
                <span onClick={() => setShowLineCard(false)} className="text-xs ml-4" style={{ color: 'rgba(44,40,37,0.40)', cursor: 'pointer', textDecoration: 'underline' }}>略過</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Service summary card ─── */}
        <div data-animate className="mb-5" style={{ background: 'var(--charcoal-deep)', borderRadius: '20px', padding: service.imageUrl ? '0 0 18px' : '22px 22px 18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, var(--oak), transparent)', zIndex: 2 }} />
          {service.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={service.imageUrl} alt={service.name} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
          )}
          {service.imageUrl && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '180px', background: 'linear-gradient(to bottom, transparent 60%, rgba(26,23,20,0.55))', pointerEvents: 'none' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: '300px 300px', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', padding: service.imageUrl ? '18px 22px 0' : '0' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--oak)', marginBottom: '8px', letterSpacing: '0.02em' }}>預約服務</p>
              <p className="font-display" style={{ fontSize: '1.75rem', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.15, marginBottom: '4px' }}>{service.name}</p>
              <p style={{ fontSize: '11px', color: 'rgba(251,249,244,0.38)', letterSpacing: '0.06em' }}>{service.duration} 分鐘</p>
              {provider.rating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '10px' }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: '11px', color: s <= Math.round(parseFloat(provider.rating!)) ? 'var(--oak)' : 'rgba(166,137,102,0.2)' }}>★</span>)}
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--oak)', marginLeft: '4px' }}>{provider.rating}</span>
                  {provider.reviewCount && <span style={{ fontSize: '10px', color: 'rgba(251,249,244,0.3)', marginLeft: '2px' }}>({provider.reviewCount})</span>}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '14px' }}>
              <p style={{ fontSize: '11px', color: 'rgba(166,137,102,0.85)', marginBottom: '3px' }}>NT$</p>
              <p className="font-display" style={{ fontSize: '2.2rem', color: 'var(--oak)', fontWeight: 300, lineHeight: 1, marginBottom: '10px', whiteSpace: 'nowrap' }}>{service.price.toLocaleString()}</p>
              <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '99px', background: 'rgba(166,137,102,0.18)', color: 'var(--oak)', border: '1px solid rgba(166,137,102,0.3)' }}>已選擇</span>
            </div>
          </div>
        </div>

        {/* ── Service switcher ─── */}
        {allServices.length > 1 && (
          <div className="mb-6">
            <FieldLabel hint="可更換">選擇服務</FieldLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {allServices.map(s => {
                const sel = service.id === s.id
                return (
                  <button key={s.id} type="button" onClick={() => setService(s)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '14px', cursor: 'pointer', border: sel ? '1.5px solid var(--charcoal)' : '1.5px solid rgba(166,137,102,0.2)', background: sel ? 'rgba(44,40,37,0.04)' : 'rgba(255,255,255,0.7)', transition: 'all 0.2s ease', gap: '12px' }}>
                    {s.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.imageUrl} alt={s.name} style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: 'repeating-linear-gradient(135deg, #efe6da 0 8px, #e6dccd 8px 16px)', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--charcoal)', marginBottom: '2px' }}>{s.name}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(44,40,37,0.45)' }}>{s.duration} 分鐘</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="font-display" style={{ fontSize: '17px', color: 'var(--oak)' }}>NT$ {s.price.toLocaleString()}</span>
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', border: sel ? 'none' : '1.5px solid rgba(166,137,102,0.4)', background: sel ? 'var(--charcoal)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        {sel && <svg viewBox="0 0 12 12" style={{ width: '9px', height: '9px' }}><path d="M2 6l2.8 3L10 3" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>

          {/* ════════════ Chapter 01 — 關於你（CSS order=2：視覺上排在「選擇時間」之後）════════════ */}
          <div style={{ margin: '14px 0', order: 2 }}>
            <ChapterHeader no="02" eyebrow="About you" title="關於你" />

            {/* 稱呼 + 電話：一律必填（給設計師的聯絡資訊），不論是否抓到 LINE */}
            {liffReady && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: 'rgba(44,40,37,0.6)', marginBottom: '6px', letterSpacing: '0.04em' }}>如何稱呼<span style={{ color: 'var(--oak)' }}>*</span></label>
                  <input type="text" placeholder="您的姓名或暱稱" value={customerNameInput} onChange={e => setCustomerNameInput(e.target.value)}
                    onFocus={() => setNameInputFocus(true)} onBlur={() => setNameInputFocus(false)} required
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', fontSize: '14px', color: 'var(--charcoal)', outline: 'none', fontFamily: 'inherit', background: '#fff', border: `1.5px solid ${nameInputFocus ? 'var(--oak)' : customerNameInput ? 'rgba(166,137,102,0.4)' : 'rgba(166,137,102,0.22)'}`, boxShadow: nameInputFocus ? '0 0 0 3px rgba(166,137,102,0.12)' : 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }} />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: 'rgba(44,40,37,0.6)', marginBottom: '6px', letterSpacing: '0.04em' }}>聯絡電話<span style={{ color: 'var(--oak)' }}>*</span></label>
                  <input type="tel" placeholder="09xx-xxx-xxx" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                    onFocus={() => setPhoneInputFocus(true)} onBlur={() => setPhoneInputFocus(false)} required
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', fontSize: '14px', color: 'var(--charcoal)', outline: 'none', fontFamily: 'inherit', background: '#fff', border: `1.5px solid ${phoneInputFocus ? 'var(--oak)' : customerPhone ? 'rgba(166,137,102,0.4)' : 'rgba(166,137,102,0.22)'}`, boxShadow: phoneInputFocus ? '0 0 0 3px rgba(166,137,102,0.12)' : 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }} />
                  {customerPhone && !phoneValid && <p style={{ fontSize: '10.5px', color: '#b04040', marginTop: '5px' }}>請輸入有效的電話號碼（至少 8 碼）</p>}
                </div>
              </div>
            )}

            {/* For others toggle */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--charcoal)', marginBottom: '2px' }}>替別人預約</p>
                  <p style={{ fontSize: '11px', color: 'rgba(44,40,37,0.45)' }}>幫親友代訂，輸入對方資訊</p>
                </div>
                <button type="button" onClick={() => { setForOthers(v => !v); setRecipientName(''); setRecipientPhone('') }}
                  style={{ width: '44px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer', flexShrink: 0, background: forOthers ? 'var(--oak)' : 'rgba(44,40,37,0.12)', position: 'relative', padding: 0, transition: 'background 0.2s' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: '3px', transform: forOthers ? 'translateX(18px)' : 'translateX(0)', transition: 'transform 0.2s var(--ease-expo)', boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }} />
                </button>
              </div>
              {forOthers && (
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input type="text" placeholder="受預約者姓名（必填）" value={recipientName} onChange={e => setRecipientName(e.target.value)}
                    style={{ width: '100%', padding: '13px 16px', borderRadius: '12px', border: `1.5px solid ${recipientName ? 'rgba(166,137,102,0.5)' : 'rgba(166,137,102,0.25)'}`, background: 'white', fontSize: '14px', color: 'var(--charcoal)', outline: 'none', fontFamily: 'inherit' }} />
                  <input type="tel" placeholder="受預約者電話（選填）" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)}
                    style={{ width: '100%', padding: '13px 16px', borderRadius: '12px', border: '1.5px solid rgba(166,137,102,0.25)', background: 'white', fontSize: '14px', color: 'var(--charcoal)', outline: 'none', fontFamily: 'inherit' }} />
                  <p style={{ fontSize: '10px', color: 'rgba(44,40,37,0.38)' }}>預約確認通知將發送給代訂人</p>
                </div>
              )}
            </div>

            {/* Gender */}
            <div style={{ marginBottom: isHairCategory ? '20px' : 0 }}>
              <FieldLabel>性別</FieldLabel>
              <Segmented options={GENDER_OPTIONS} value={gender} onChange={setGender} />
            </div>

            {/* Hair length */}
            {isHairCategory && (
              <div style={{ marginBottom: portfolio.length > 0 ? '20px' : 0 }}>
                <FieldLabel>目前髮長</FieldLabel>
                <PillGroup options={HAIR_LENGTH_OPTIONS} value={hairLength} onChange={setHairLength} />
              </div>
            )}

            {/* Inspiration picker */}
            {portfolio.length > 0 && (
              <div>
                <FieldLabel hint="最多 2 張">靈感參考 — 從作品集挑選</FieldLabel>
                <InspirationPicker items={portfolio} selected={selectedInspirations} onToggle={toggleInspiration} max={2} />
              </div>
            )}
          </div>

          {/* ════════════ Chapter 02 — 選擇時間（CSS order=1：先選時段，再填資料）════════════ */}
          <div className="ch-panel" style={{ order: 1 }}>
            <ChapterHeader no="01" eyebrow="Pick a time" title="選擇時間" />

            {/* Date section */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <FieldLabel>日期</FieldLabel>
                {nextAvailable && (
                  <button type="button"
                    onClick={() => {
                      setDate(nextAvailable.date)
                      setTime(nextAvailable.time)
                      setTimeout(() => timeRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' }), 700)
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '999px', background: 'rgba(166,137,102,0.1)', border: '1px solid rgba(166,137,102,0.3)', fontSize: '11px', fontWeight: 600, color: 'var(--oak)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <svg viewBox="0 0 12 12" fill="currentColor" style={{ width: '10px', height: '10px' }}><path d="M6 1l1.2 2.4L10 4l-2 1.95.47 2.75L6 7.4l-2.47 1.3.47-2.75L2 4l2.8-.6z"/></svg>
                    最快 {nextAvailable.label} {nextAvailable.time}
                  </button>
                )}
              </div>
              <DateQuickChips value={date} onChange={d => { setDate(d); setTime(''); setTimeout(() => timeRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' }), 700) }} />
              <InlineCalendar providerId={providerId} value={date} onChange={d => { setDate(d); setTime(''); setTimeout(() => timeRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' }), 700) }} />
            </div>

            {/* Time slots */}
            <div ref={timeRef}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <FieldLabel>時段</FieldLabel>
                {date && !loadingSlots && slots.length > 0 && (
                  <span style={{ fontSize: '10px', color: 'rgba(44,40,37,0.4)' }}>{slots.filter(s => s.status !== 'booked').length} 個可選</span>
                )}
              </div>
              {!date ? (
                <p style={{ fontSize: '12px', color: 'rgba(44,40,37,0.4)', padding: '8px 0' }}>請先選擇日期</p>
              ) : renderSlots()}
            </div>
          </div>

          {/* ════════════ Chapter 03 — 給設計師的話（order=3）════════════ */}
          <div style={{ margin: '14px 0', order: 3 }}>
            <ChapterHeader no="03" eyebrow="One last thing" title="給設計師的話" />

            <FieldLabel hint="選填">快速標籤</FieldLabel>
            <QuickTags tags={NOTE_TAGS} selected={selectedTags} onToggle={toggleTag} />

            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="想嘗試的方向、需要注意的事項…（選填）" rows={3}
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid rgba(166,137,102,0.22)', background: 'rgba(255,255,255,0.78)', fontSize: '14px', color: 'var(--charcoal)', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.6, marginBottom: '20px' }} />

            {/* Summary recap */}
            <div style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(166,137,102,0.18)', borderRadius: '14px', padding: '16px 18px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '12px' }}>預約摘要</p>
              {[
                ['服務', service.name],
                ['時長', `${service.duration} 分鐘`],
                ['稱呼', customerNameInput || '—'],
                ['性別', gender || '—'],
                ['日期時段', date ? `${fmtDate} ${time || '—'}` : '—'],
                ...(selectedInspirations.length > 0 ? [['靈感參考', `${selectedInspirations.length} 張已選`]] : [['靈感參考', '—']]),
                ...(selectedTags.length ? [['備註標籤', selectedTags.join('、')]] : []),
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderTop: '1px solid rgba(166,137,102,0.1)' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(44,40,37,0.62)' }}>{k}</span>
                  <span style={{ fontSize: '13px', color: 'var(--charcoal)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

        </form>
      </div>

      {/* ── Fixed bottom CTA ─── */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30, background: 'linear-gradient(to top, var(--cream) 62%, transparent)', padding: '20px 20px 28px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          {submitError && (
            <div onClick={() => setSubmitError('')} style={{ marginBottom: '10px', padding: '11px 14px', borderRadius: '12px', background: 'rgba(176,64,64,0.1)', border: '1px solid rgba(176,64,64,0.3)', color: '#b04040', fontSize: '12.5px', textAlign: 'center', lineHeight: 1.5, cursor: 'pointer' }}>
              {submitError}
            </div>
          )}
          <button onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>} disabled={!canSubmit}
            style={{ width: '100%', padding: '17px', borderRadius: '15px', border: 'none', cursor: canSubmit ? 'pointer' : 'default', background: canSubmit ? 'var(--charcoal)' : 'rgba(44,40,37,0.18)', color: 'var(--cream)', fontSize: '15px', fontWeight: 600, letterSpacing: '0.04em', boxShadow: canSubmit ? '0 12px 30px rgba(26,23,20,0.28)' : 'none', transition: 'all .3s cubic-bezier(0.16,1,0.3,1)' }}>
            {submitting ? '預約中…' : canSubmit ? `確認預約 · ${fmtDate} ${time}` : !date ? '請選擇日期' : !time ? '請選擇時段' : !hasCustomerInfo ? '請填寫稱呼與電話' : !phoneValid ? '請輸入有效電話' : !gender ? '請選擇性別' : isHairCategory && !hairLength ? '請選擇髮長' : '請完成必填'}
          </button>
        </div>
      </div>
    </div>
  )
}
