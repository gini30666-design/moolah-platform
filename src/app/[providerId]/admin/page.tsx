'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import liff from '@line/liff'

type Booking = {
  id: string
  serviceName: string
  servicePrice: number
  customerName: string
  customerLineUserId: string
  date: string
  time: string
  note: string
  gender: string
  hairLength: string
  status: string
}

type Service = { id: string; name: string; price: number; duration: number }
type TabKey = 'today' | 'upcoming' | 'past'

const todayStr = () => new Date().toISOString().split('T')[0]

// ── Booking Card ──────────────────────────────────────────────────────────────
function BookingCard({ booking, onCancel }: { booking: Booking; onCancel: (id: string) => void }) {
  const [cancelling, setCancelling] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleCancel() {
    setCancelling(true)
    await fetch('/api/admin/booking', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking.id, status: 'cancelled' }),
    })
    onCancel(booking.id)
    setCancelling(false)
    setShowConfirm(false)
  }

  const isManual = booking.customerLineUserId === 'MANUAL'

  return (
    <div style={{
      background: 'rgba(251,249,244,0.85)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(166,137,102,0.15)',
      borderRadius: '16px',
      padding: '18px 20px',
    }}>
      {/* Time + Price row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '22px', fontWeight: 600, color: '#2C2825', lineHeight: 1 }}>
            {booking.time}
          </p>
          <p style={{ fontSize: '12px', color: '#A68966', marginTop: '4px', letterSpacing: '0.04em' }}>
            {booking.serviceName}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '18px', color: '#2C2825', fontWeight: 500 }}>
            NT$ {booking.servicePrice.toLocaleString()}
          </p>
          {isManual && (
            <span style={{
              fontSize: '10px', color: '#A68966',
              background: 'rgba(166,137,102,0.1)',
              padding: '2px 8px', borderRadius: '20px',
              display: 'inline-block', marginTop: '4px',
            }}>私下預約</span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(166,137,102,0.12)', margin: '12px 0' }} />

      {/* Customer info */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: '#8a7e76' }}>{booking.customerName || '匿名客戶'}</span>
        {booking.gender && (
          <span style={{
            fontSize: '11px', color: '#A68966',
            background: 'rgba(166,137,102,0.08)',
            padding: '2px 8px', borderRadius: '20px',
          }}>{booking.gender}</span>
        )}
        {booking.hairLength && (
          <span style={{
            fontSize: '11px', color: '#A68966',
            background: 'rgba(166,137,102,0.08)',
            padding: '2px 8px', borderRadius: '20px',
          }}>{booking.hairLength}</span>
        )}
      </div>

      {booking.note && (
        <p style={{ fontSize: '11px', color: '#a09890', marginTop: '8px', lineHeight: 1.6 }}>
          {booking.note}
        </p>
      )}

      <p style={{ fontSize: '10px', color: '#c8c0b8', marginTop: '8px' }}>#{booking.id}</p>

      {/* Cancel */}
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          style={{
            marginTop: '14px', width: '100%', fontSize: '11px',
            color: '#c0b4ac', border: '1px solid rgba(166,137,102,0.15)',
            borderRadius: '12px', padding: '10px',
            background: 'transparent', cursor: 'pointer',
          }}
        >
          取消此預約
        </button>
      ) : (
        <div style={{
          marginTop: '14px',
          background: 'rgba(180,60,60,0.06)',
          border: '1px solid rgba(180,60,60,0.15)',
          borderRadius: '12px', padding: '14px',
        }}>
          <p style={{ fontSize: '12px', color: '#b04040', textAlign: 'center', marginBottom: '12px' }}>
            確定取消？{!isManual && '系統將自動通知客戶。'}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowConfirm(false)} style={{
              flex: 1, fontSize: '12px', color: '#8a7e76',
              border: '1px solid rgba(166,137,102,0.2)', borderRadius: '10px',
              padding: '10px', background: 'transparent', cursor: 'pointer',
            }}>返回</button>
            <button onClick={handleCancel} disabled={cancelling} style={{
              flex: 1, fontSize: '12px', color: '#fff',
              background: '#b04040', borderRadius: '10px',
              padding: '10px', border: 'none', cursor: 'pointer', opacity: cancelling ? 0.6 : 1,
            }}>{cancelling ? '取消中...' : '確認取消'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Manual Booking Form ───────────────────────────────────────────────────────
function ManualBookingForm({ providerId, services, onSuccess }: {
  providerId: string; services: Service[]; onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '')
  const [customerName, setCustomerName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const selectedService = services.find(s => s.id === serviceId)

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(166,137,102,0.06)',
    border: '1px solid rgba(166,137,102,0.18)', borderRadius: '12px',
    padding: '12px 14px', fontSize: '14px', color: '#2C2825',
    outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '10px', color: '#A68966', letterSpacing: '0.1em',
    textTransform: 'uppercase', display: 'block', marginBottom: '8px',
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!serviceId || !date || !time) return
    setSubmitting(true)
    const res = await fetch('/api/admin/manual-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, serviceId, customerName, date, time, note }),
    })
    setSubmitting(false)
    if (res.ok) {
      setDone(true)
      setTimeout(() => {
        setDone(false); setOpen(false)
        setCustomerName(''); setDate(''); setTime(''); setNote('')
        onSuccess()
      }, 1500)
    }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      border: '1.5px dashed rgba(166,137,102,0.35)', borderRadius: '16px',
      padding: '16px', fontSize: '13px', color: '#A68966',
      background: 'transparent', cursor: 'pointer',
    }}>
      <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '16px', height: '16px' }}>
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
      </svg>
      新增私下預約
    </button>
  )

  return (
    <div style={{
      background: 'rgba(251,249,244,0.9)', backdropFilter: 'blur(12px)',
      border: '1px solid rgba(166,137,102,0.2)', borderRadius: '16px', padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#2C2825' }}>新增私下預約</p>
        <button onClick={() => setOpen(false)} style={{ color: '#b0a89e', fontSize: '18px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
      </div>

      {done ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '28px', color: '#A68966', marginBottom: '8px' }}>✓</p>
          <p style={{ fontSize: '13px', color: '#8a7e76' }}>已成功新增！</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>服務項目</label>
            <select value={serviceId} onChange={e => setServiceId(e.target.value)} required style={inputStyle}>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}　NT$ {s.price.toLocaleString()}　{s.duration} 分鐘</option>
              ))}
            </select>
            {selectedService && (
              <p style={{ fontSize: '11px', color: '#A68966', marginTop: '6px', paddingLeft: '4px' }}>
                {selectedService.duration} 分鐘 · NT$ {selectedService.price.toLocaleString()}
              </p>
            )}
          </div>
          <div>
            <label style={labelStyle}>客戶姓名</label>
            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
              placeholder="例如：王小姐" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>日期</label>
              <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>時間</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} required style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>備註（選填）</label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="特殊需求或提醒..." rows={2}
              style={{ ...inputStyle, resize: 'none' }} />
          </div>
          <button type="submit" disabled={!serviceId || !date || !time || submitting} style={{
            background: submitting || !date || !time ? 'rgba(166,137,102,0.4)' : '#A68966',
            color: '#fbf9f4', borderRadius: '50px', padding: '14px',
            fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer',
          }}>
            {submitting ? '新增中...' : '確認新增'}
          </button>
        </form>
      )}
    </div>
  )
}

// ── Admin Page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { providerId } = useParams<{ providerId: string }>()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [tab, setTab] = useState<TabKey>('today')
  const [providerName, setProviderName] = useState('')

  const fetchBookings = useCallback(async () => {
    const res = await fetch(`/api/admin/bookings?providerId=${providerId}`)
    const data = await res.json()
    setBookings(data.bookings ?? [])
  }, [providerId])

  useEffect(() => {
    liff
      .init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
      .then(async () => {
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href })
          return
        }
        const profile = await liff.getProfile()
        const lineUserId = profile.userId
        const res = await fetch(`/api/provider/${providerId}`)
        const data = await res.json()
        setProviderName(data.provider?.name ?? '')
        setServices(data.services ?? [])
        if (data.provider?.lineUserId === lineUserId) {
          setAuthorized(true)
          await fetchBookings()
        } else {
          setAuthorized(false)
        }
        setLoading(false)
      })
      .catch(() => { setAuthorized(false); setLoading(false) })
  }, [providerId, fetchBookings])

  function handleCancel(id: string) {
    setBookings(prev => prev.filter(b => b.id !== id))
  }

  const today = todayStr()
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'today', label: '今日' },
    { key: 'upcoming', label: '即將到來' },
    { key: 'past', label: '過去' },
  ]
  const filtered = bookings.filter(b => {
    if (tab === 'today') return b.date === today
    if (tab === 'upcoming') return b.date > today
    return b.date < today
  })
  const todayCount = bookings.filter(b => b.date === today).length
  const upcomingCount = bookings.filter(b => b.date > today).length
  const monthCount = bookings.filter(b => b.date.startsWith(today.slice(0, 7))).length

  // ── Loading ──
  if (loading) return (
    <div style={{ display: 'flex', height: '100svh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', background: '#fbf9f4' }}>
      <div style={{ width: '28px', height: '28px', border: '2px solid rgba(166,137,102,0.25)', borderTop: '2px solid #A68966', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: '12px', color: '#b0a89e', letterSpacing: '0.08em' }}>載入中</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // ── Unauthorized ──
  if (authorized === false) return (
    <div style={{ display: 'flex', height: '100svh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '32px', background: '#fbf9f4', textAlign: 'center' }}>
      <div style={{ width: '56px', height: '56px', background: 'rgba(166,137,102,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#A68966" strokeWidth={1.5} style={{ width: '24px', height: '24px' }}>
          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <div>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '20px', color: '#2C2825', marginBottom: '8px' }}>無訪問權限</p>
        <p style={{ fontSize: '13px', color: '#8a7e76', lineHeight: 1.6 }}>此頁面僅供已綁定的合作夥伴使用</p>
      </div>
    </div>
  )

  return (
    <main style={{ minHeight: '100svh', background: '#fbf9f4', maxWidth: '480px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{
        background: '#2C2825',
        padding: '52px 24px 28px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* grain overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.6, pointerEvents: 'none',
        }} />
        {/* oak accent line */}
        <div style={{ width: '32px', height: '2px', background: '#A68966', marginBottom: '16px' }} />
        <p style={{ fontSize: '10px', color: 'rgba(166,137,102,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
          後台管理
        </p>
        <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '28px', fontWeight: 600, color: '#fbf9f4', lineHeight: 1.1 }}>
          {providerName}
        </h1>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', padding: '20px 16px 0' }}>
        {[
          { label: '今日預約', value: todayCount },
          { label: '待服務', value: upcomingCount },
          { label: '本月總計', value: monthCount },
        ].map(item => (
          <div key={item.label} style={{
            background: 'rgba(251,249,244,0.9)',
            border: '1px solid rgba(166,137,102,0.15)',
            borderRadius: '16px', padding: '16px 10px', textAlign: 'center',
          }}>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '30px', fontWeight: 600, color: '#A68966', lineHeight: 1 }}>
              {item.value}
            </p>
            <p style={{ fontSize: '10px', color: '#b0a89e', marginTop: '6px', letterSpacing: '0.04em' }}>
              {item.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', margin: '16px 16px 0', background: 'rgba(166,137,102,0.08)', borderRadius: '14px', padding: '4px' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '10px 0', borderRadius: '10px', fontSize: '12px',
            fontWeight: tab === t.key ? 600 : 400, border: 'none', cursor: 'pointer',
            background: tab === t.key ? '#2C2825' : 'transparent',
            color: tab === t.key ? '#fbf9f4' : '#8a7e76',
            transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Booking List ── */}
      <div style={{ padding: '16px 16px 8px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '16px', color: '#c8c0b8' }}>
              {tab === 'today' ? '今日尚無預約' : tab === 'upcoming' ? '目前無待服務預約' : '無過去記錄'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(tab === 'today' || tab === 'upcoming')
              ? Object.entries(
                  filtered.reduce<Record<string, Booking[]>>((acc, b) => {
                    acc[b.date] = [...(acc[b.date] ?? []), b]
                    return acc
                  }, {})
                ).map(([date, dayBookings]) => (
                  <div key={date}>
                    <p style={{ fontSize: '11px', color: '#A68966', letterSpacing: '0.08em', marginBottom: '8px', paddingLeft: '4px' }}>
                      {date === today ? '· 今天' : `· ${date}`}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {dayBookings.map(b => <BookingCard key={b.id} booking={b} onCancel={handleCancel} />)}
                    </div>
                  </div>
                ))
              : filtered.map(b => <BookingCard key={b.id} booking={b} onCancel={handleCancel} />)
            }
          </div>
        )}
      </div>

      {/* ── Manual Booking ── */}
      {services.length > 0 && (
        <div style={{ padding: '8px 16px 32px' }}>
          <p style={{ fontSize: '10px', color: '#A68966', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px', paddingLeft: '4px' }}>
            私下預約管理
          </p>
          <ManualBookingForm providerId={providerId} services={services} onSuccess={fetchBookings} />
        </div>
      )}

      {/* Oak bottom accent */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #A68966, transparent)', opacity: 0.3, margin: '0 16px 24px' }} />
    </main>
  )
}
