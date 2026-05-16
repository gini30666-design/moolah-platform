'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import liff from '@line/liff'
import ScheduleView from './ScheduleView'
import PortfolioView from './PortfolioView'

// ─── Types ────────────────────────────────────────────────────────────────────
type Booking = {
  id: string
  serviceId: string
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
type Service = { id: string; name: string; price: number; duration: number; description: string }
type MainView = 'bookings' | 'services' | 'schedule' | 'portfolio'
type BookingTab = 'timeline' | 'today' | 'upcoming' | 'past'

const todayStr = () => new Date().toISOString().split('T')[0]

// ─── Shared style tokens ──────────────────────────────────────────────────────
const oak = '#A68966'
const charcoal = '#2C2825'
const cream = '#fbf9f4'
const cardBg = 'rgba(251,249,244,0.9)'
const border = 'rgba(166,137,102,0.15)'
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(166,137,102,0.06)',
  border: '1px solid rgba(166,137,102,0.18)', borderRadius: '12px',
  padding: '12px 14px', fontSize: '14px', color: charcoal,
  outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  fontSize: '10px', color: oak, letterSpacing: '0.1em',
  textTransform: 'uppercase', display: 'block', marginBottom: '8px',
}

// ─── Customer History Sheet ───────────────────────────────────────────────────
function CustomerSheet({ booking, allBookings, onClose, providerId }: {
  booking: Booking; allBookings: Booking[]; onClose: () => void; providerId: string
}) {
  const isManual = booking.customerLineUserId === 'MANUAL'
  const history = (isManual
    ? [booking]
    : allBookings.filter(b => b.customerLineUserId === booking.customerLineUserId)
  ).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
  const totalSpend = history.reduce((s, b) => s + b.servicePrice, 0)

  const [noteText, setNoteText] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)

  useEffect(() => {
    if (isManual) return
    fetch(`/api/admin/customer-note?providerId=${providerId}&customerLineUserId=${booking.customerLineUserId}`)
      .then(r => r.json())
      .then(d => setNoteText(d.note ?? ''))
      .catch(() => {})
  }, [booking.customerLineUserId, providerId, isManual])

  async function saveNote() {
    setNoteSaving(true)
    await fetch('/api/admin/customer-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, customerLineUserId: booking.customerLineUserId, note: noteText }),
    })
    setNoteSaving(false)
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(44,40,37,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: '480px', margin: '0 auto', background: cream, borderRadius: '24px 24px 0 0', padding: '16px 20px 44px', animation: 'slideUp 0.22s ease' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: '40px', height: '4px', background: 'rgba(166,137,102,0.25)', borderRadius: '2px', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '22px', fontWeight: 600, color: charcoal }}>
              {booking.customerName || '匿名顧客'}
            </p>
            {(booking.gender || booking.hairLength) && (
              <p style={{ fontSize: '11px', color: oak, marginTop: '3px' }}>
                {[booking.gender, booking.hairLength].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ fontSize: '22px', color: '#b0a89e', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, paddingTop: '2px' }}>×</button>
        </div>

        {!isManual && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: '歷史訪問', value: `${history.length} 次` },
              { label: '累計消費', value: `NT$ ${totalSpend.toLocaleString()}` },
            ].map(item => (
              <div key={item.label} style={{ flex: 1, background: 'rgba(166,137,102,0.07)', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '20px', fontWeight: 600, color: oak, lineHeight: 1 }}>{item.value}</p>
                <p style={{ fontSize: '10px', color: '#7a6e68', marginTop: '5px', letterSpacing: '0.05em' }}>{item.label}</p>
              </div>
            ))}
          </div>
        )}

        {!isManual && (
          <div style={{ marginBottom: '18px' }}>
            <p style={{ fontSize: '10px', color: oak, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>設計師筆記</p>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="記錄顧客偏好、過敏史、特殊需求…"
              rows={3}
              style={{
                width: '100%', background: 'rgba(166,137,102,0.06)',
                border: '1px solid rgba(166,137,102,0.18)', borderRadius: '12px',
                padding: '10px 12px', fontSize: '13px', color: charcoal,
                resize: 'none', outline: 'none', boxSizing: 'border-box',
                lineHeight: 1.5,
              }}
            />
            <button
              onClick={saveNote}
              disabled={noteSaving}
              style={{
                marginTop: '8px', padding: '8px 20px', fontSize: '12px',
                background: noteSaved ? 'rgba(34,180,100,0.15)' : 'rgba(166,137,102,0.12)',
                color: noteSaved ? '#22b464' : oak,
                border: `1px solid ${noteSaved ? 'rgba(34,180,100,0.25)' : 'rgba(166,137,102,0.2)'}`,
                borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {noteSaved ? '已儲存 ✓' : noteSaving ? '儲存中…' : '儲存筆記'}
            </button>
          </div>
        )}

        <p style={{ fontSize: '10px', color: oak, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>消費紀錄</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '35vh', overflowY: 'auto' }}>
          {history.map(b => (
            <div key={b.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 14px', borderRadius: '12px',
              background: b.id === booking.id ? 'rgba(166,137,102,0.1)' : 'rgba(166,137,102,0.04)',
              border: `1px solid ${b.id === booking.id ? 'rgba(166,137,102,0.25)' : 'transparent'}`,
            }}>
              <div>
                <p style={{ fontSize: '13px', color: charcoal, fontWeight: b.id === booking.id ? 500 : 400 }}>{b.serviceName}</p>
                <p style={{ fontSize: '11px', color: '#6b5f56', marginTop: '2px' }}>
                  {b.date} {b.time}
                  {b.id === booking.id && <span style={{ color: oak, marginLeft: '6px' }}>← 本次</span>}
                </p>
              </div>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '16px', color: charcoal }}>
                NT$ {b.servicePrice.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }`}</style>
    </div>
  )
}

// ─── Booking Card ─────────────────────────────────────────────────────────────
function BookingCard({ booking, onCancel, onViewCustomer }: {
  booking: Booking; onCancel: (id: string) => void; onViewCustomer: (b: Booking) => void
}) {
  const [cancelling, setCancelling] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const isManual = booking.customerLineUserId === 'MANUAL'

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

  return (
    <div style={{ background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${border}`, borderRadius: '16px', padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '22px', fontWeight: 600, color: charcoal, lineHeight: 1 }}>{booking.time}</p>
          <p style={{ fontSize: '12px', color: oak, marginTop: '4px', letterSpacing: '0.04em' }}>{booking.serviceName}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '18px', color: charcoal, fontWeight: 500 }}>
            NT$ {booking.servicePrice.toLocaleString()}
          </p>
          {isManual && (
            <span style={{ fontSize: '10px', color: oak, background: 'rgba(166,137,102,0.1)', padding: '2px 8px', borderRadius: '20px', display: 'inline-block', marginTop: '4px' }}>私下預約</span>
          )}
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(166,137,102,0.12)', margin: '12px 0' }} />

      <button
        onClick={() => onViewCustomer(booking)}
        style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', background: 'none', border: 'none', padding: '0', cursor: 'pointer', width: '100%', textAlign: 'left' }}
      >
        <span style={{ fontSize: '12px', color: '#4a3f3a' }}>{booking.customerName || '匿名客戶'}</span>
        {booking.gender && <span style={{ fontSize: '11px', color: oak, background: 'rgba(166,137,102,0.08)', padding: '2px 8px', borderRadius: '20px' }}>{booking.gender}</span>}
        {booking.hairLength && <span style={{ fontSize: '11px', color: oak, background: 'rgba(166,137,102,0.08)', padding: '2px 8px', borderRadius: '20px' }}>{booking.hairLength}</span>}
        <span style={{ fontSize: '10px', color: 'var(--oak)', marginLeft: 'auto' }}>顧客紀錄 →</span>
      </button>

      {booking.note && <p style={{ fontSize: '11px', color: '#6b5f56', marginTop: '8px', lineHeight: 1.6 }}>{booking.note}</p>}
      <p style={{ fontSize: '10px', color: '#c8c0b8', marginTop: '8px' }}>#{booking.id}</p>

      {!showConfirm ? (
        <button onClick={() => setShowConfirm(true)} style={{ marginTop: '14px', width: '100%', fontSize: '11px', color: '#7a6e68', border: `1px solid ${border}`, borderRadius: '12px', padding: '10px', background: 'transparent', cursor: 'pointer' }}>
          取消此預約
        </button>
      ) : (
        <div style={{ marginTop: '14px', background: 'rgba(180,60,60,0.06)', border: '1px solid rgba(180,60,60,0.15)', borderRadius: '12px', padding: '14px' }}>
          <p style={{ fontSize: '12px', color: '#b04040', textAlign: 'center', marginBottom: '12px' }}>
            確定取消？{!isManual && '系統將自動通知客戶。'}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowConfirm(false)} style={{ flex: 1, fontSize: '12px', color: '#8a7e76', border: '1px solid rgba(166,137,102,0.2)', borderRadius: '10px', padding: '10px', background: 'transparent', cursor: 'pointer' }}>返回</button>
            <button onClick={handleCancel} disabled={cancelling} style={{ flex: 1, fontSize: '12px', color: '#fff', background: '#b04040', borderRadius: '10px', padding: '10px', border: 'none', cursor: 'pointer', opacity: cancelling ? 0.6 : 1 }}>
              {cancelling ? '取消中...' : '確認取消'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Timeline View ────────────────────────────────────────────────────────────
function TimelineView({ bookings, services, onViewCustomer }: {
  bookings: Booking[]
  services: Service[]
  onViewCustomer: (b: Booking) => void
}) {
  const todayDate = todayStr()
  const [viewDate, setViewDate] = useState(todayDate)

  const START_HOUR = 9
  const END_HOUR = 20
  const SLOT_H = 56 // px per 30 min
  const PX_PER_MIN = SLOT_H / 30

  const timeToMin = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  const getDuration = (b: Booking) => services.find(s => s.id === b.serviceId)?.duration ?? 60

  const slots = Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => {
    const totalMin = START_HOUR * 60 + i * 30
    return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`
  })

  const dayBookings = bookings
    .filter(b => b.date === viewDate)
    .sort((a, b) => a.time.localeCompare(b.time))

  const dateLabel = () => {
    if (viewDate === todayDate) return '今天'
    const d = new Date(viewDate + 'T12:00:00')
    return `${d.getMonth() + 1}/${d.getDate()}（${'日一二三四五六'[d.getDay()]}）`
  }

  const shiftDay = (delta: number) => {
    const d = new Date(viewDate + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    setViewDate(d.toISOString().split('T')[0])
  }

  const now = new Date()
  const currentMin = now.getHours() * 60 + now.getMinutes()
  const showLine = viewDate === todayDate && currentMin >= START_HOUR * 60 && currentMin <= END_HOUR * 60
  const lineTop = (currentMin - START_HOUR * 60) * PX_PER_MIN

  return (
    <div>
      {/* Date navigator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '12px 16px 0', padding: '12px 8px', background: 'rgba(166,137,102,0.08)', borderRadius: '16px' }}>
        <button onClick={() => shiftDay(-1)} style={{ background: 'none', border: 'none', fontSize: '22px', color: oak, cursor: 'pointer', padding: '0 12px', lineHeight: 1 }}>‹</button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '17px', fontWeight: 600, color: charcoal }}>{dateLabel()}</p>
          <p style={{ fontSize: '10px', color: '#b0a89e', marginTop: '2px' }}>{dayBookings.length > 0 ? `${dayBookings.length} 筆預約` : '尚無預約'}</p>
        </div>
        <button onClick={() => shiftDay(1)} style={{ background: 'none', border: 'none', fontSize: '22px', color: oak, cursor: 'pointer', padding: '0 12px', lineHeight: 1 }}>›</button>
      </div>

      {/* Timeline */}
      <div style={{ margin: '12px 16px 40px', display: 'flex', gap: '8px' }}>
        {/* Time labels */}
        <div style={{ width: '44px', flexShrink: 0 }}>
          {slots.map((t, i) => (
            <div key={t} style={{ height: `${SLOT_H}px`, display: 'flex', alignItems: 'flex-start', paddingTop: '3px' }}>
              {i % 2 === 0
                ? <span style={{ fontSize: '10px', color: '#b0a89e', fontVariantNumeric: 'tabular-nums' }}>{t}</span>
                : <span style={{ fontSize: '9px', color: 'rgba(176,168,158,0.4)', paddingLeft: '6px' }}>·</span>
              }
            </div>
          ))}
        </div>

        {/* Grid + blocks */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Grid lines */}
          {slots.map((t, i) => (
            <div key={t} style={{
              height: `${SLOT_H}px`,
              borderTop: i % 2 === 0
                ? '1px solid rgba(166,137,102,0.18)'
                : '1px dashed rgba(166,137,102,0.07)',
            }} />
          ))}

          {/* Current time line */}
          {showLine && (
            <div style={{ position: 'absolute', top: `${lineTop}px`, left: 0, right: 0, zIndex: 10, pointerEvents: 'none' }}>
              <div style={{ height: '2px', background: `linear-gradient(to right, ${oak}, rgba(166,137,102,0.15))`, position: 'relative' }}>
                <div style={{ width: '8px', height: '8px', background: oak, borderRadius: '50%', position: 'absolute', top: '-3px', left: '-4px' }} />
              </div>
            </div>
          )}

          {/* Booking blocks */}
          {dayBookings.map(b => {
            const startMin = timeToMin(b.time)
            const dur = getDuration(b)
            const top = (startMin - START_HOUR * 60) * PX_PER_MIN
            const height = Math.max(dur * PX_PER_MIN - 4, SLOT_H - 4)
            if (startMin < START_HOUR * 60 || startMin >= END_HOUR * 60) return null
            return (
              <button
                key={b.id}
                onClick={() => onViewCustomer(b)}
                style={{
                  position: 'absolute',
                  top: `${top}px`,
                  left: '4px', right: '4px',
                  height: `${height}px`,
                  background: `linear-gradient(140deg, ${oak} 0%, rgba(140,110,80,0.85) 100%)`,
                  borderRadius: '10px',
                  padding: '8px 10px',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  overflow: 'hidden',
                  zIndex: 5,
                  boxShadow: '0 2px 8px rgba(166,137,102,0.25)',
                }}
              >
                <p style={{ fontSize: '13px', fontWeight: 600, color: cream, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.customerName || '顧客'}
                </p>
                <p style={{ fontSize: '11px', color: 'rgba(251,249,244,0.78)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.serviceName}
                </p>
                {height >= 68 && (
                  <p style={{ fontSize: '10px', color: 'rgba(251,249,244,0.55)', marginTop: '3px' }}>
                    {b.time} · {dur} 分鐘
                  </p>
                )}
              </button>
            )
          })}

          {/* Empty state overlay */}
          {dayBookings.length === 0 && (
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, transform: 'translateY(-50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '15px', color: '#d4ccc6' }}>今日無預約</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Manual Booking Form ──────────────────────────────────────────────────────
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
      padding: '16px', fontSize: '13px', color: oak,
      background: 'transparent', cursor: 'pointer',
    }}>
      <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '16px', height: '16px' }}>
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
      </svg>
      新增私下預約
    </button>
  )

  return (
    <div style={{ background: 'rgba(251,249,244,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(166,137,102,0.2)', borderRadius: '16px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: charcoal }}>新增私下預約</p>
        <button onClick={() => setOpen(false)} style={{ color: '#b0a89e', fontSize: '18px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
      </div>
      {done ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '28px', color: oak, marginBottom: '8px' }}>✓</p>
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
              <p style={{ fontSize: '11px', color: oak, marginTop: '6px', paddingLeft: '4px' }}>
                {selectedService.duration} 分鐘 · NT$ {selectedService.price.toLocaleString()}
              </p>
            )}
          </div>
          <div>
            <label style={labelStyle}>客戶姓名</label>
            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="例如：王小姐" style={inputStyle} />
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
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="特殊需求或提醒..." rows={2} style={{ ...inputStyle, resize: 'none' }} />
          </div>
          <button type="submit" disabled={!serviceId || !date || !time || submitting} style={{
            background: !serviceId || !date || !time || submitting ? 'rgba(166,137,102,0.4)' : oak,
            color: cream, borderRadius: '50px', padding: '14px',
            fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer',
          }}>
            {submitting ? '新增中...' : '確認新增'}
          </button>
        </form>
      )}
    </div>
  )
}

// ─── Service Form ─────────────────────────────────────────────────────────────
function ServiceForm({ service, providerId, onSuccess, onClose }: {
  service: Service | null; providerId: string; onSuccess: () => void; onClose: () => void
}) {
  const isNew = !service
  const [name, setName] = useState(service?.name ?? '')
  const [price, setPrice] = useState(service?.price?.toString() ?? '')
  const [duration, setDuration] = useState(service?.duration?.toString() ?? '')
  const [description, setDescription] = useState(service?.description ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !price || !duration) return
    setSubmitting(true)
    await fetch('/api/admin/service', {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId,
        ...(isNew ? {} : { serviceId: service!.id }),
        name, price: Number(price), duration: Number(duration), description,
      }),
    })
    setSubmitting(false)
    setDone(true)
    setTimeout(() => { onSuccess(); onClose() }, 1200)
  }

  return (
    <div style={{ background: cardBg, backdropFilter: 'blur(12px)', border: '1px solid rgba(166,137,102,0.2)', borderRadius: '16px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: charcoal }}>{isNew ? '新增服務項目' : '編輯服務項目'}</p>
        <button onClick={onClose} style={{ color: '#b0a89e', fontSize: '18px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
      </div>
      {done ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '28px', color: oak, marginBottom: '8px' }}>✓</p>
          <p style={{ fontSize: '13px', color: '#8a7e76' }}>{isNew ? '已新增！' : '已更新！'}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>服務名稱</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="例如：韓系空氣感剪裁" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>價格 (NT$)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} required placeholder="800" min="0" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>時長 (分鐘)</label>
              <input type="number" value={duration} onChange={e => setDuration(e.target.value)} required placeholder="60" min="15" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>說明（選填）</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="服務說明..." rows={2} style={{ ...inputStyle, resize: 'none' }} />
          </div>
          <button type="submit" disabled={!name || !price || !duration || submitting} style={{
            background: !name || !price || !duration || submitting ? 'rgba(166,137,102,0.4)' : oak,
            color: cream, borderRadius: '50px', padding: '14px',
            fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer',
          }}>
            {submitting ? '儲存中...' : isNew ? '新增服務' : '儲存變更'}
          </button>
        </form>
      )}
    </div>
  )
}

// ─── Service Item ─────────────────────────────────────────────────────────────
function ServiceItem({ service, providerId, onRefresh }: {
  service: Service; providerId: string; onRefresh: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await fetch('/api/admin/service', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId: service.id, providerId }),
    })
    setDeleting(false)
    onRefresh()
  }

  if (editing) {
    return <ServiceForm service={service} providerId={providerId} onSuccess={onRefresh} onClose={() => setEditing(false)} />
  }

  return (
    <div style={{ background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${border}`, borderRadius: '16px', padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
          <p style={{ fontSize: '15px', fontWeight: 500, color: charcoal }}>{service.name}</p>
          <p style={{ fontSize: '11px', color: '#a09890', marginTop: '4px' }}>
            {service.duration} 分鐘{service.description ? ` · ${service.description}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '18px', color: charcoal }}>
            NT$ {service.price.toLocaleString()}
          </p>
          <button onClick={() => setEditing(true)} style={{ padding: '6px 8px', background: 'rgba(166,137,102,0.1)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: oak, display: 'flex', alignItems: 'center' }}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '14px', height: '14px' }}>
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        </div>
      </div>
      {confirmDelete ? (
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
          <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, fontSize: '12px', color: '#8a7e76', border: '1px solid rgba(166,137,102,0.2)', borderRadius: '10px', padding: '8px', background: 'transparent', cursor: 'pointer' }}>取消</button>
          <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, fontSize: '12px', color: '#fff', background: '#b04040', borderRadius: '10px', padding: '8px', border: 'none', cursor: 'pointer' }}>
            {deleting ? '刪除中...' : '確認刪除'}
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirmDelete(true)} style={{ marginTop: '10px', fontSize: '11px', color: '#c0b4ac', background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}>刪除此服務</button>
      )}
    </div>
  )
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { providerId } = useParams<{ providerId: string }>()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [tab, setTab] = useState<BookingTab>('timeline')
  const [mainView, setMainView] = useState<MainView>('bookings')
  const [providerName, setProviderName] = useState('')
  const [customerSheet, setCustomerSheet] = useState<Booking | null>(null)
  const [addingService, setAddingService] = useState(false)

  const fetchBookings = useCallback(async () => {
    const res = await fetch(`/api/admin/bookings?providerId=${providerId}`)
    const data = await res.json()
    setBookings(data.bookings ?? [])
  }, [providerId])

  const fetchServices = useCallback(async () => {
    const res = await fetch(`/api/provider/${providerId}`)
    const data = await res.json()
    setServices(data.services ?? [])
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
        const storedUserId = data.provider?.lineUserId ?? ''
        if (storedUserId === lineUserId) {
          setAuthorized(true)
          await fetchBookings()
        } else if (!storedUserId) {
          // Unclaimed account — auto-register this LINE user as the owner
          const claimRes = await fetch('/api/admin/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ providerId, lineUserId }),
          })
          if (claimRes.ok) {
            setAuthorized(true)
            await fetchBookings()
          } else {
            setAuthorized(false)
          }
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

  // ── Computed stats ──
  const today = todayStr()
  const todayBookings = bookings.filter(b => b.date === today)
  const monthBookings = bookings.filter(b => b.date.startsWith(today.slice(0, 7)))
  const upcomingBookings = bookings.filter(b => b.date > today)
  const todayRevenue = todayBookings.reduce((s, b) => s + b.servicePrice, 0)
  const monthRevenue = monthBookings.reduce((s, b) => s + b.servicePrice, 0)

  const bookingTabs: { key: BookingTab; label: string }[] = [
    { key: 'timeline', label: '時段視圖' },
    { key: 'today', label: '今日' },
    { key: 'upcoming', label: '即將到來' },
    { key: 'past', label: '過去' },
  ]
  const filteredBookings = bookings.filter(b => {
    if (tab === 'today') return b.date === today
    if (tab === 'upcoming') return b.date > today
    return b.date < today
  })

  // ── Loading ──
  if (loading) return (
    <div style={{ display: 'flex', height: '100svh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', background: cream }}>
      <div style={{ width: '28px', height: '28px', border: '2px solid rgba(166,137,102,0.25)', borderTop: `2px solid ${oak}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: '12px', color: '#b0a89e', letterSpacing: '0.08em' }}>載入中</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // ── Unauthorized ──
  if (authorized === false) return (
    <div style={{ display: 'flex', height: '100svh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '32px', background: cream, textAlign: 'center' }}>
      <div style={{ width: '56px', height: '56px', background: 'rgba(166,137,102,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke={oak} strokeWidth={1.5} style={{ width: '24px', height: '24px' }}>
          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <div>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '20px', color: charcoal, marginBottom: '8px' }}>無訪問權限</p>
        <p style={{ fontSize: '13px', color: '#8a7e76', lineHeight: 1.6 }}>此頁面僅供已綁定的合作夥伴使用</p>
      </div>
    </div>
  )

  return (
    <main style={{ minHeight: '100svh', background: cream, maxWidth: '480px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ background: charcoal, padding: '52px 24px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`, opacity: 0.6, pointerEvents: 'none' }} />
        <div style={{ width: '32px', height: '2px', background: oak, marginBottom: '16px' }} />
        <p style={{ fontSize: '10px', color: 'rgba(166,137,102,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>後台管理</p>
        <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '28px', fontWeight: 600, color: cream, lineHeight: 1.1 }}>{providerName}</h1>
      </div>

      {/* ── Stats 2×2 ── */}
      <div data-animate style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '20px 16px 0' }}>
        {[
          { label: '今日預約', value: `${todayBookings.length}`, unit: '筆' },
          { label: '今日營收', value: todayRevenue === 0 ? '—' : `NT$ ${todayRevenue.toLocaleString()}`, unit: '' },
          { label: '本月預約', value: `${monthBookings.length}`, unit: '筆' },
          { label: '本月營收', value: monthRevenue === 0 ? '—' : `NT$ ${monthRevenue.toLocaleString()}`, unit: '' },
        ].map(item => (
          <div key={item.label} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '16px 14px', textAlign: 'center' }}>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: item.unit ? '30px' : '18px', fontWeight: 600, color: oak, lineHeight: 1 }}>
              {item.value}{item.unit && <span style={{ fontSize: '14px', marginLeft: '2px' }}>{item.unit}</span>}
            </p>
            <p style={{ fontSize: '10px', color: '#b0a89e', marginTop: '6px', letterSpacing: '0.04em' }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* ── Main Nav (scrollable) ── */}
      <div data-animate data-delay="100" style={{ margin: '16px 16px 0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', background: 'rgba(166,137,102,0.08)', borderRadius: '14px', padding: '4px', minWidth: 'max-content' }}>
        {([['bookings', '預約管理'], ['services', '服務管理'], ['schedule', '排班設定'], ['portfolio', '作品集']] as [MainView, string][]).map(([v, label]) => (
          <button key={v} onClick={() => setMainView(v)} style={{
            padding: '10px 14px', borderRadius: '10px', fontSize: '12px',
            fontWeight: mainView === v ? 600 : 400, border: 'none', cursor: 'pointer',
            background: mainView === v ? charcoal : 'transparent',
            color: mainView === v ? cream : '#8a7e76',
            transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}>{label}</button>
        ))}
        </div>
      </div>

      {/* ════════════════ BOOKINGS VIEW ════════════════ */}
      {mainView === 'bookings' && (
        <>
          {/* Sub-tabs (scrollable) */}
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '12px 16px 0' }}>
            <div style={{ display: 'flex', gap: '6px', minWidth: 'max-content' }}>
              {bookingTabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  padding: '8px 16px', borderRadius: '20px', fontSize: '12px',
                  fontWeight: tab === t.key ? 600 : 400, border: 'none', cursor: 'pointer',
                  background: tab === t.key ? oak : 'rgba(166,137,102,0.08)',
                  color: tab === t.key ? cream : '#8a7e76',
                  transition: 'all 0.18s', whiteSpace: 'nowrap',
                }}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* Timeline view */}
          {tab === 'timeline' && (
            <TimelineView bookings={bookings} services={services} onViewCustomer={setCustomerSheet} />
          )}

          {/* Booking list (today / upcoming / past) */}
          {tab !== 'timeline' && (
            <div style={{ padding: '14px 16px 8px' }}>
              {filteredBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '16px', color: '#c8c0b8' }}>
                    {tab === 'today' ? '今日尚無預約' : tab === 'upcoming' ? '目前無待服務預約' : '無過去記錄'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tab !== 'past'
                    ? Object.entries(
                        filteredBookings.reduce<Record<string, Booking[]>>((acc, b) => {
                          acc[b.date] = [...(acc[b.date] ?? []), b]
                          return acc
                        }, {})
                      ).map(([date, dayBookings]) => (
                        <div key={date}>
                          <p style={{ fontSize: '11px', color: oak, letterSpacing: '0.08em', marginBottom: '8px', paddingLeft: '4px' }}>
                            {date === today ? '· 今天' : `· ${date}`}
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {dayBookings.map(b => (
                              <BookingCard key={b.id} booking={b} onCancel={handleCancel} onViewCustomer={setCustomerSheet} />
                            ))}
                          </div>
                        </div>
                      ))
                    : filteredBookings.map(b => (
                        <BookingCard key={b.id} booking={b} onCancel={handleCancel} onViewCustomer={setCustomerSheet} />
                      ))
                  }
                </div>
              )}
            </div>
          )}

          {/* Manual booking */}
          {tab !== 'timeline' && services.length > 0 && (
            <div style={{ padding: '8px 16px 32px' }}>
              <p style={{ fontSize: '10px', color: oak, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px', paddingLeft: '4px' }}>私下預約管理</p>
              <ManualBookingForm providerId={providerId} services={services} onSuccess={fetchBookings} />
            </div>
          )}
        </>
      )}

      {/* ════════════════ SERVICES VIEW ════════════════ */}
      {mainView === 'services' && (
        <div style={{ padding: '16px 16px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <p style={{ fontSize: '10px', color: oak, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              服務項目 ({services.length})
            </p>
            {!addingService && (
              <button onClick={() => setAddingService(true)} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', color: oak, background: 'rgba(166,137,102,0.1)',
                border: 'none', borderRadius: '20px', padding: '7px 14px', cursor: 'pointer',
              }}>
                <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '14px', height: '14px' }}>
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                新增服務
              </button>
            )}
          </div>

          {addingService && (
            <div style={{ marginBottom: '14px' }}>
              <ServiceForm service={null} providerId={providerId} onSuccess={fetchServices} onClose={() => setAddingService(false)} />
            </div>
          )}

          {services.length === 0 && !addingService ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '16px', color: '#c8c0b8' }}>尚未設定服務項目</p>
              <p style={{ fontSize: '12px', color: '#d0c8c0', marginTop: '8px' }}>點選「新增服務」開始設定</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {services.map(s => (
                <ServiceItem key={s.id} service={s} providerId={providerId} onRefresh={fetchServices} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════ SCHEDULE VIEW ════════════════ */}
      {mainView === 'schedule' && <ScheduleView providerId={providerId} />}

      {/* ════════════════ PORTFOLIO VIEW ════════════════ */}
      {mainView === 'portfolio' && <PortfolioView providerId={providerId} />}

      {/* Oak bottom accent */}
      <div style={{ height: '3px', background: `linear-gradient(90deg, transparent, ${oak}, transparent)`, opacity: 0.3, margin: '0 16px 24px' }} />

      {/* ── Customer History Sheet ── */}
      {customerSheet && (
        <CustomerSheet booking={customerSheet} allBookings={bookings} onClose={() => setCustomerSheet(null)} providerId={providerId} />
      )}
    </main>
  )
}
