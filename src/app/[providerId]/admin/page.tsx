'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import liff from '@line/liff'
import { authHeader } from '@/lib/clientAuth'
import MoolahLoader from '@/components/MoolahLoader'
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
type WaitlistEntry = { id: string; date: string; time: string; customerName: string; customerLineUserId: string; customerPhone: string; addedAt: string }
type MainView = 'bookings' | 'services' | 'schedule' | 'portfolio' | 'waitlist'
type BookingTab = 'timeline' | 'today' | 'upcoming' | 'past'

const TAGS = [
  { label: 'VIP', bg: 'rgba(201,169,110,0.18)', color: '#8a6030', border: 'rgba(201,169,110,0.4)' },
  { label: '首訪', bg: 'rgba(0,149,246,0.1)', color: '#0070c0', border: 'rgba(0,149,246,0.3)' },
  { label: '常客', bg: 'rgba(34,180,100,0.1)', color: '#1a8a50', border: 'rgba(34,180,100,0.3)' },
  { label: '高風險', bg: 'rgba(200,60,60,0.1)', color: '#b03030', border: 'rgba(200,60,60,0.3)' },
]

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
  const [sheetError, setSheetError] = useState('')  // 內嵌錯誤提示（取代 alert / 靜默）
  const [tags, setTags] = useState<string[]>([])

  // 作品歷史（Karte）：每次服務的照片 + 備註
  type KarteEntry = { id: number; imageUrl: string; note: string; serviceName: string; createdAt: string }
  const [karte, setKarte] = useState<KarteEntry[]>([])
  const [karteNote, setKarteNote] = useState('')
  const [karteUploading, setKarteUploading] = useState(false)

  const noShowCount = history.filter(b => b.status === 'no_show').length

  useEffect(() => {
    if (isManual) return
    fetch(`/api/admin/customer-note?providerId=${providerId}&customerLineUserId=${booking.customerLineUserId}`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => { setNoteText(d.note ?? ''); setTags(d.tags ?? []) })
      .catch(() => {})
    fetch(`/api/admin/customer-history?providerId=${providerId}&customerLineUserId=${booking.customerLineUserId}`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => setKarte(d.entries ?? []))
      .catch(() => {})
  }, [booking.customerLineUserId, providerId, isManual])

  async function addKarte(file: File | null, input: HTMLInputElement) {
    if (!file) return
    setSheetError('')
    if (file.size > 4 * 1024 * 1024) { setSheetError('圖片大小不可超過 4MB'); input.value = ''; return }
    setKarteUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('providerId', providerId)
      const up = await fetch('/api/admin/upload', { method: 'POST', headers: authHeader(), body: fd })
      const upData = await up.json()
      if (!up.ok) { setSheetError(upData.error ?? '上傳失敗'); return }
      const res = await fetch('/api/admin/customer-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ providerId, customerLineUserId: booking.customerLineUserId, imageUrl: upData.url, note: karteNote, serviceName: booking.serviceName }),
      })
      const data = await res.json()
      if (res.ok && data.entry) { setKarte(prev => [data.entry, ...prev]); setKarteNote('') }
      else setSheetError(data.error ?? '儲存失敗')
    } finally {
      setKarteUploading(false)
      input.value = ''
    }
  }

  async function deleteKarte(id: number) {
    setKarte(prev => prev.filter(k => k.id !== id))
    await fetch('/api/admin/customer-history', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ providerId, id }),
    }).catch(() => {})
  }

  async function saveNote() {
    setNoteSaving(true); setSheetError('')
    try {
      const res = await fetch('/api/admin/customer-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ providerId, customerLineUserId: booking.customerLineUserId, note: noteText, tags }),
      })
      if (!res.ok) throw new Error()
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 2000)
    } catch {
      setSheetError('筆記儲存失敗，請重試')   // 不再「失敗也顯示已儲存」
    } finally {
      setNoteSaving(false)
    }
  }

  async function toggleTag(label: string) {
    const next = tags.includes(label) ? tags.filter(t => t !== label) : [...tags, label]
    setTags(next)
    await fetch('/api/admin/customer-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ providerId, customerLineUserId: booking.customerLineUserId, tags: next }),
    }).catch(() => {})
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
        {sheetError && (
          <div onClick={() => setSheetError('')} style={{ background: 'rgba(176,64,64,0.1)', border: '1px solid rgba(176,64,64,0.3)', color: '#b04040', fontSize: '12px', padding: '10px 14px', borderRadius: '12px', marginBottom: '14px', textAlign: 'center', cursor: 'pointer' }}>
            {sheetError}　（點此關閉）
          </div>
        )}
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
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {[
                { label: '歷史訪問', value: `${history.filter(b => b.status !== 'no_show').length} 次` },
                { label: '累計消費', value: `NT$ ${totalSpend.toLocaleString()}` },
                ...(noShowCount > 0 ? [{ label: '爽約', value: `${noShowCount} 次`, red: true }] : []),
              ].map((item: { label: string; value: string; red?: boolean }) => (
                <div key={item.label} style={{ flex: 1, background: item.red ? 'rgba(200,60,60,0.07)' : 'rgba(166,137,102,0.07)', borderRadius: '14px', padding: '12px 8px', textAlign: 'center' }}>
                  <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '18px', fontWeight: 600, color: item.red ? '#b03030' : oak, lineHeight: 1 }}>{item.value}</p>
                  <p style={{ fontSize: '10px', color: item.red ? '#c05050' : '#7a6e68', marginTop: '4px', letterSpacing: '0.05em' }}>{item.label}</p>
                </div>
              ))}
            </div>
            {/* Tags */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '10px', color: oak, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>顧客標籤</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {TAGS.map(tag => {
                  const active = tags.includes(tag.label)
                  return (
                    <button key={tag.label} onClick={() => toggleTag(tag.label)} style={{
                      padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
                      background: active ? tag.bg : 'transparent',
                      color: active ? tag.color : '#b0a89e',
                      border: `1px solid ${active ? tag.border : 'rgba(166,137,102,0.18)'}`,
                    }}>{tag.label}</button>
                  )
                })}
              </div>
            </div>
          </>
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

        {!isManual && (
          <div style={{ marginBottom: '18px' }}>
            <p style={{ fontSize: '10px', color: oak, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>作品歷史</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: karte.length ? '12px' : '0' }}>
              <input
                value={karteNote}
                onChange={e => setKarteNote(e.target.value)}
                placeholder="這次做的（如：8 度霧棕、法式手繪）"
                style={{ flex: 1, background: 'rgba(166,137,102,0.06)', border: '1px solid rgba(166,137,102,0.18)', borderRadius: '12px', padding: '9px 12px', fontSize: '12px', color: charcoal, outline: 'none', boxSizing: 'border-box' }}
              />
              <label style={{
                display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
                padding: '0 14px', fontSize: '12px', fontWeight: 600,
                background: karteUploading ? 'rgba(166,137,102,0.3)' : oak, color: '#fff',
                borderRadius: '12px', cursor: karteUploading ? 'default' : 'pointer',
              }}>
                {karteUploading ? '上傳中…' : '＋ 照片'}
                <input type="file" accept="image/*" disabled={karteUploading}
                  onChange={e => addKarte(e.currentTarget.files?.[0] ?? null, e.currentTarget)}
                  style={{ display: 'none' }} />
              </label>
            </div>
            {karte.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                {karte.map(k => (
                  <div key={k.id} style={{ position: 'relative', width: '96px', flexShrink: 0 }}>
                    {k.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={k.imageUrl} alt="" style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '12px', display: 'block' }} />
                    ) : (
                      <div style={{ width: '96px', height: '96px', borderRadius: '12px', background: 'rgba(166,137,102,0.08)' }} />
                    )}
                    <button onClick={() => deleteKarte(k.id)} style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(44,40,37,0.6)', color: '#fff', border: 'none', fontSize: '12px', lineHeight: '20px', cursor: 'pointer', padding: 0 }}>×</button>
                    {k.note && <p style={{ fontSize: '10px', color: '#6b5f56', marginTop: '4px', lineHeight: 1.3 }}>{k.note}</p>}
                    <p style={{ fontSize: '9px', color: oak, marginTop: '2px' }}>{(k.createdAt || '').slice(0, 10)}</p>
                  </div>
                ))}
              </div>
            )}
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
function BookingCard({ booking, onCancel, onViewCustomer, compact, isNext }: {
  booking: Booking; onCancel: (id: string) => void; onViewCustomer: (b: Booking) => void; compact?: boolean; isNext?: boolean
}) {
  const [cancelling, setCancelling] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [markingNoShow, setMarkingNoShow] = useState(false)
  const [showNoShowConfirm, setShowNoShowConfirm] = useState(false)
  const [actionError, setActionError] = useState('')  // 動作失敗提示（取代靜默/誤移除）
  const isManual = booking.customerLineUserId === 'MANUAL'
  const isNoShow = booking.status === 'no_show'
  const nextCountdown = (() => {
    if (!isNext) return ''
    const diff = Math.round((new Date(`${booking.date}T${booking.time}:00+08:00`).getTime() - Date.now()) / 60000)
    if (diff <= 0 || diff > 720) return ''  // 只在 12 小時內顯示倒數
    return diff >= 60 ? `還有 ${Math.floor(diff / 60)} 時 ${diff % 60} 分` : `還有 ${diff} 分`
  })()

  async function handleCancel() {
    setCancelling(true); setActionError('')
    try {
      const res = await fetch('/api/admin/booking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ bookingId: booking.id, status: 'cancelled' }),
      })
      if (!res.ok) throw new Error()
      onCancel(booking.id)   // 只在成功才從畫面移除
      setShowConfirm(false)
    } catch {
      setActionError('取消失敗，請檢查網路後再試一次')
    } finally {
      setCancelling(false)
    }
  }

  async function handleNoShow() {
    setMarkingNoShow(true); setActionError('')
    try {
      const res = await fetch('/api/admin/booking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ bookingId: booking.id, status: 'no_show' }),
      })
      if (!res.ok) throw new Error()
      onCancel(booking.id)
      setShowNoShowConfirm(false)
    } catch {
      setActionError('標記失敗，請檢查網路後再試一次')
    } finally {
      setMarkingNoShow(false)
    }
  }

  return (
    <div style={{
      background: isNoShow ? 'rgba(200,60,60,0.04)' : 'white',
      border: `1px solid ${isNoShow ? 'rgba(200,60,60,0.25)' : isNext ? 'rgba(166,137,102,0.6)' : 'rgba(166,137,102,0.28)'}`,
      borderRadius: compact ? '12px' : '16px',
      padding: compact ? '12px 16px' : '18px 20px',
      boxShadow: compact ? '0 1px 8px rgba(26,23,20,0.05)' : '0 2px 16px rgba(26,23,20,0.08)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* left oak accent bar */}
      {!isNoShow && <div style={{ position: 'absolute', left: 0, top: '14px', bottom: '14px', width: '2px', background: 'linear-gradient(to bottom, var(--oak), transparent)', borderRadius: '1px' }} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: compact ? '1.6rem' : '2rem', fontWeight: 300, color: charcoal, lineHeight: 1, letterSpacing: '-0.02em' }}>{booking.time}</p>
          <p style={{ fontSize: compact ? '11px' : '12px', color: oak, marginTop: '4px', letterSpacing: '0.04em', fontFamily: "var(--font-noto-serif-tc), 'Noto Serif TC', serif" }}>{booking.serviceName}</p>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', color: charcoal, fontWeight: 300 }}>
            NT$ {booking.servicePrice.toLocaleString()}
          </p>
          {isNext && !isNoShow && <span style={{ fontSize: '10px', color: cream, background: oak, padding: '2px 9px', borderRadius: '20px', letterSpacing: '0.04em' }}>下一位{nextCountdown ? ` · ${nextCountdown}` : ''}</span>}
          {isNoShow && <span style={{ fontSize: '10px', color: '#b03030', background: 'rgba(200,60,60,0.12)', padding: '2px 8px', borderRadius: '20px' }}>爽約</span>}
          {isManual && !isNoShow && <span style={{ fontSize: '10px', color: oak, background: 'rgba(166,137,102,0.1)', padding: '2px 8px', borderRadius: '20px' }}>私下預約</span>}
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

      {!isNoShow && !showConfirm && !showNoShowConfirm && (
        <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowNoShowConfirm(true)} style={{ flex: 1, fontSize: '11px', color: '#a04030', border: '1px solid rgba(200,60,60,0.2)', borderRadius: '12px', padding: '13px', background: 'rgba(200,60,60,0.04)', cursor: 'pointer' }}>
            標記爽約
          </button>
          <button onClick={() => setShowConfirm(true)} style={{ flex: 1, fontSize: '11px', color: '#7a6e68', border: `1px solid ${border}`, borderRadius: '12px', padding: '13px', background: 'transparent', cursor: 'pointer' }}>
            取消預約
          </button>
        </div>
      )}
      {showNoShowConfirm && (
        <div style={{ marginTop: '14px', background: 'rgba(200,60,60,0.06)', border: '1px solid rgba(200,60,60,0.15)', borderRadius: '12px', padding: '14px' }}>
          <p style={{ fontSize: '12px', color: '#b04040', textAlign: 'center', marginBottom: '12px' }}>確認標記為爽約？此紀錄將保留在顧客歷史中。</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowNoShowConfirm(false)} style={{ flex: 1, fontSize: '12px', color: '#8a7e76', border: '1px solid rgba(166,137,102,0.2)', borderRadius: '10px', padding: '13px', background: 'transparent', cursor: 'pointer' }}>返回</button>
            <button onClick={handleNoShow} disabled={markingNoShow} style={{ flex: 1, fontSize: '12px', color: '#fff', background: '#b04040', borderRadius: '10px', padding: '13px', border: 'none', cursor: 'pointer', opacity: markingNoShow ? 0.6 : 1 }}>
              {markingNoShow ? '處理中...' : '確認爽約'}
            </button>
          </div>
        </div>
      )}
      {showConfirm && (
        <div style={{ marginTop: '14px', background: 'rgba(180,60,60,0.06)', border: '1px solid rgba(180,60,60,0.15)', borderRadius: '12px', padding: '14px' }}>
          <p style={{ fontSize: '12px', color: '#b04040', textAlign: 'center', marginBottom: '12px' }}>
            確定取消？{!isManual && '系統將自動通知客戶。'}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowConfirm(false)} style={{ flex: 1, fontSize: '12px', color: '#8a7e76', border: '1px solid rgba(166,137,102,0.2)', borderRadius: '10px', padding: '13px', background: 'transparent', cursor: 'pointer' }}>返回</button>
            <button onClick={handleCancel} disabled={cancelling} style={{ flex: 1, fontSize: '12px', color: '#fff', background: '#b04040', borderRadius: '10px', padding: '13px', border: 'none', cursor: 'pointer', opacity: cancelling ? 0.6 : 1 }}>
              {cancelling ? '取消中...' : '確認取消'}
            </button>
          </div>
        </div>
      )}
      {actionError && <p style={{ fontSize: '11px', color: '#b04040', textAlign: 'center', marginTop: '10px' }}>{actionError}</p>}
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
      headers: { 'Content-Type': 'application/json', ...authHeader() },
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
      headers: { 'Content-Type': 'application/json', ...authHeader() },
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
      headers: { 'Content-Type': 'application/json', ...authHeader() },
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
// 首次使用引導：偵測到還沒設定服務時顯示，3 步驟帶新設計師上手
function FirstRunChecklist({ providerId, onGoServices, onGoSchedule }: { providerId: string; onGoServices: () => void; onGoSchedule: () => void }) {
  const [copied, setCopied] = useState(false)
  const bookUrl = typeof window !== 'undefined' ? `${window.location.origin}/${providerId}/book` : ''
  const share = async () => {
    try { await navigator.clipboard.writeText(bookUrl); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {}
  }
  const steps = [
    { n: 1, title: '設定你的服務與價格', desc: '客人才能選擇要預約的項目', action: onGoServices, label: '去設定' },
    { n: 2, title: '設定營業時間與休假', desc: '決定哪些時段可以被預約', action: onGoSchedule, label: '去設定' },
    { n: 3, title: '分享你的預約連結', desc: '貼到 IG / LINE，客人自己線上約', action: share, label: copied ? '✓ 已複製' : '複製連結' },
  ]
  return (
    <div data-animate style={{ margin: '16px 16px 0', padding: '18px 18px 10px', background: 'linear-gradient(135deg, rgba(166,137,102,0.12), rgba(166,137,102,0.03))', border: '1px solid rgba(166,137,102,0.3)', borderRadius: '18px' }}>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '19px', color: charcoal }}>歡迎使用 MooLah ✨</p>
      <p style={{ fontSize: '11.5px', color: 'rgba(44,40,37,0.55)', marginTop: '2px', marginBottom: '6px', lineHeight: 1.5 }}>3 步驟開始線上接單：</p>
      {steps.map(s => (
        <div key={s.n} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '11px 0', borderTop: '1px solid rgba(166,137,102,0.14)' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: oak, color: cream, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', color: charcoal, fontWeight: 600 }}>{s.title}</p>
            <p style={{ fontSize: '11px', color: 'rgba(44,40,37,0.5)', marginTop: '2px', lineHeight: 1.5 }}>{s.desc}</p>
          </div>
          <button onClick={s.action} style={{ fontSize: '11.5px', color: oak, background: 'rgba(166,137,102,0.12)', border: `1px solid ${oak}`, borderRadius: '14px', padding: '11px 15px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{s.label}</button>
        </div>
      ))}
    </div>
  )
}

// 空狀態 → 招客 CTA（不留白；把空白變成分享預約連結的入口）
function EmptyBookings({ tab, providerId }: { tab: BookingTab; providerId: string }) {
  const [copied, setCopied] = useState(false)
  const bookUrl = typeof window !== 'undefined' ? `${window.location.origin}/${providerId}/book` : ''
  const title = tab === 'today' ? '今天還沒有預約 🌿' : tab === 'upcoming' ? '目前沒有待服務的預約 🌿' : '沒有過去記錄'
  const showCta = tab !== 'past'
  const copy = async () => {
    try { await navigator.clipboard.writeText(bookUrl); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {}
  }
  const shareLine = () => {
    const url = `https://line.me/R/msg/text/?${encodeURIComponent(`幫我線上預約 → ${bookUrl}`)}`
    try { liff.openWindow({ url, external: true }) } catch { window.open(url, '_blank') }
  }
  return (
    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '17px', color: charcoal }}>{title}</p>
      {showCta && (
        <>
          <p style={{ fontSize: '12px', color: 'rgba(44,40,37,0.5)', marginTop: '10px', lineHeight: 1.7 }}>
            把你的預約連結分享出去，<br />讓客人自己線上預約 ✨
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '18px', flexWrap: 'wrap' }}>
            <button onClick={copy} style={{ padding: '12px 18px', borderRadius: '20px', fontSize: '12.5px', cursor: 'pointer', background: copied ? oak : 'transparent', color: copied ? cream : oak, border: `1px solid ${oak}`, transition: 'all 0.18s' }}>
              {copied ? '✓ 已複製' : '📋 複製預約連結'}
            </button>
            <button onClick={shareLine} style={{ padding: '12px 18px', borderRadius: '20px', fontSize: '12.5px', cursor: 'pointer', background: '#06C755', color: '#fff', border: '1px solid #06C755' }}>
              分享到 LINE
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { providerId } = useParams<{ providerId: string }>()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [loadError, setLoadError] = useState(false)  // 區分「載入失敗(可重試)」與「無權限」
  const [showAnalytics, setShowAnalytics] = useState(false)  // 數據/對帳預設收合，讓操作內容上提
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<BookingTab>('upcoming')  // 預設「即將到來」：開後台第一眼看接下來的預約，而非可能空白的時段視圖
  const [mainView, setMainView] = useState<MainView>('bookings')
  const [providerName, setProviderName] = useState('')
  const [plan, setPlan] = useState('')               // trial | active | expired | ''(舊資料=正式)
  const [trialEndsAt, setTrialEndsAt] = useState('')
  const [customerSheet, setCustomerSheet] = useState<Booking | null>(null)
  const [addingService, setAddingService] = useState(false)
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [removingWL, setRemovingWL] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    const res = await fetch(`/api/admin/bookings?providerId=${providerId}`, { headers: authHeader() })
    const data = await res.json()
    setBookings(data.bookings ?? [])
  }, [providerId])

  const fetchServices = useCallback(async () => {
    const res = await fetch(`/api/provider/${providerId}`)
    const data = await res.json()
    setServices(data.services ?? [])
  }, [providerId])

  const fetchWaitlist = useCallback(async () => {
    const res = await fetch(`/api/admin/waitlist?providerId=${providerId}`, { headers: authHeader() })
    const data = await res.json()
    setWaitlist(data.entries ?? [])
  }, [providerId])

  // 手動刷新（不整頁 reload）— 重抓預約與候補
  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    try { await Promise.all([fetchBookings(), fetchWaitlist()]) } finally { setRefreshing(false) }
  }, [fetchBookings, fetchWaitlist])

  useEffect(() => {
    liff
      .init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
      .then(async () => {
        if (!liff.isLoggedIn()) {
          // Redirect through /dashboard (registered LIFF endpoint) to avoid LINE rejecting unregistered redirectUris
          window.location.href = '/dashboard'
          return
        }
        // 擁有權判斷改由伺服器端（token 認證）決定，不再從公開 API 取得 lineUserId
        // 一次並行發 4 支（不再瀑布等 access 回來才抓 bookings/waitlist）→ 大幅縮短後台開啟時間
        const [provRes, accessRes, bookingsRes, waitlistRes] = await Promise.all([
          fetch(`/api/provider/${providerId}`),
          fetch(`/api/admin/access?providerId=${providerId}`, { headers: authHeader() }),
          fetch(`/api/admin/bookings?providerId=${providerId}`, { headers: authHeader() }),
          fetch(`/api/admin/waitlist?providerId=${providerId}`, { headers: authHeader() }),
        ])
        const data = await provRes.json()
        setProviderName(data.provider?.name ?? '')
        setPlan(data.provider?.plan ?? '')
        setTrialEndsAt(data.provider?.trialEndsAt ?? '')
        setServices(data.services ?? [])

        const access = await accessRes.json()
        if (access.status === 'owner') {
          setAuthorized(true)
          const [bookingsData, waitlistData] = await Promise.all([bookingsRes.json(), waitlistRes.json()])
          setBookings(bookingsData.bookings ?? [])
          setWaitlist(waitlistData.entries ?? [])
        } else if (access.status === 'unclaimed') {
          // 尚未認領 — 一律導去合約認領流程（/claim），不在此自動認領
          window.location.href = `/claim/${providerId}`
          return
        } else {
          setAuthorized(false)
        }
        setLoading(false)
      })
      .catch(() => { setLoadError(true); setLoading(false) })  // 網路/初始化失敗 → 顯示可重試畫面（非「無權限」）
  }, [providerId])

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

  // ── 方案 / 試用狀態 ──
  const TRIAL_LIMIT = 20
  const isTrial = plan === 'trial'
  const trialEndMs = trialEndsAt ? new Date(trialEndsAt).getTime() : 0
  const isExpired = plan === 'expired' || (isTrial && trialEndMs > 0 && Date.now() > trialEndMs)
  const trialDaysLeft = trialEndMs ? Math.max(0, Math.ceil((trialEndMs - Date.now()) / 86400000)) : 0
  const trialUsed = bookings.length // 後台 bookings 已是本職人未取消的預約

  // ── 回購率分析（#24）— 近 90 天範圍 ──
  const normalizeName = (s: string) => s.replace(/\s+/g, '').toLowerCase()
  const past90Start = (() => {
    const d = new Date(today + 'T12:00:00+08:00'); d.setDate(d.getDate() - 90)
    return d.toISOString().slice(0, 10)
  })()
  const past90Bookings = bookings.filter(b => b.date >= past90Start && b.date <= today && b.status !== 'cancelled')
  const customerVisits: Record<string, string[]> = {}  // customerKey → dates
  for (const b of past90Bookings) {
    const key = (b as { customerLineUserId?: string }).customerLineUserId || normalizeName(b.customerName)
    if (!customerVisits[key]) customerVisits[key] = []
    customerVisits[key].push(b.date)
  }
  const customerKeys = Object.keys(customerVisits)
  const repeatCustomers = customerKeys.filter(k => customerVisits[k].length >= 2)
  const newCustomers = customerKeys.filter(k => customerVisits[k].length === 1)
  const repeatRate = customerKeys.length === 0 ? 0 : Math.round(repeatCustomers.length / customerKeys.length * 100)
  // 平均回購間隔（天）
  const intervals: number[] = []
  for (const k of repeatCustomers) {
    const sorted = [...customerVisits[k]].sort()
    for (let i = 1; i < sorted.length; i++) {
      const diff = Math.round((new Date(sorted[i]).getTime() - new Date(sorted[i-1]).getTime()) / 86400000)
      intervals.push(diff)
    }
  }
  const avgInterval = intervals.length === 0 ? 0 : Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)

  const bookingTabs: { key: BookingTab; label: string }[] = [
    { key: 'upcoming', label: '即將到來' },
    { key: 'today', label: '今日' },
    { key: 'timeline', label: '時段視圖' },
    { key: 'past', label: '過去' },
  ]
  const filteredBookings = bookings
    .filter(b => {
      if (tab === 'today') return b.date === today
      if (tab === 'upcoming') return b.date > today
      return b.date < today
    })
    // 即將到來/今日：最近的在最前（時間升冪）；過去：最新的在前（降冪）
    .sort((a, b) => {
      const cmp = (a.date + a.time).localeCompare(b.date + b.time)
      return tab === 'past' ? -cmp : cmp
    })
  const nextBookingId = (tab === 'upcoming' || tab === 'today') ? filteredBookings[0]?.id : undefined

  // ── Loading ──
  if (loading) return <MoolahLoader label="載入後台中…" />

  // ── Load error (網路/初始化失敗，可重試) ──
  if (loadError) return (
    <div style={{ display: 'flex', height: '100svh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '32px', background: cream, textAlign: 'center' }}>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '20px', color: charcoal }}>後台載入失敗</p>
      <p style={{ fontSize: '13px', color: '#8a7e76', lineHeight: 1.6 }}>請確認網路連線後再試一次</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: '8px', padding: '11px 28px', borderRadius: '99px', background: oak, color: cream, border: 'none', fontSize: '14px', cursor: 'pointer' }}>
        重試
      </button>
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
      <div style={{ background: 'var(--charcoal-deep)', padding: '52px 24px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`, opacity: 0.6, pointerEvents: 'none' }} />
        {/* top oak accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, var(--oak), transparent)', opacity: 0.8 }} />
        {/* 右上：刷新（不整頁 reload）+ 預覽預約頁 */}
        <style>{`@keyframes adminSpin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ position: 'absolute', top: '20px', right: '18px', zIndex: 3, display: 'flex', gap: '8px' }}>
          <button onClick={refreshAll} disabled={refreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(166,137,102,0.15)', border: '1px solid rgba(166,137,102,0.5)', color: 'var(--oak)', fontSize: '12px', padding: '7px 12px', borderRadius: '99px', cursor: 'pointer', backdropFilter: 'blur(4px)', opacity: refreshing ? 0.6 : 1 }}>
            <span style={{ display: 'inline-block', animation: refreshing ? 'adminSpin 0.8s linear infinite' : 'none' }}>↻</span>{refreshing ? '更新中' : '刷新'}
          </button>
          <button onClick={() => { const url = `${window.location.origin}/${providerId}/book`; try { liff.openWindow({ url, external: false }) } catch { window.open(url, '_blank') } }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(166,137,102,0.15)', border: '1px solid rgba(166,137,102,0.5)', color: 'var(--oak)', fontSize: '12px', letterSpacing: '0.04em', padding: '7px 13px', borderRadius: '99px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            <span style={{ fontSize: '13px' }}>👁</span> 預覽
          </button>
        </div>
        <p style={{ fontSize: '9px', color: 'var(--oak)', letterSpacing: '0.26em', textTransform: 'uppercase', marginBottom: '10px', opacity: 0.8 }}>管理後台</p>
        <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '2rem', fontWeight: 300, color: cream, lineHeight: 1.1, letterSpacing: '-0.01em' }}>{providerName}</h1>
        <div style={{ width: '28px', height: '1px', background: oak, marginTop: '14px', opacity: 0.5 }} />
      </div>

      {/* ── Admin Marquee bar ── */}
      <div style={{ background: oak, overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <style>{`@keyframes marqueeAdmin { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
        <div style={{ display: 'inline-flex', animation: 'marqueeAdmin 20s linear infinite', paddingTop: '7px', paddingBottom: '7px' }}>
          {[0,1].map(i => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(251,249,244,0.88)' }}>
              <span>今日預約 {todayBookings.length} 件</span><span style={{ margin: '0 18px', opacity: 0.4 }}>·</span>
              <span>待服務 {upcomingBookings.filter(b => b.date === today).length + todayBookings.length} 人</span><span style={{ margin: '0 18px', opacity: 0.4 }}>·</span>
              <span>本月累計 NT$ {monthRevenue > 0 ? monthRevenue.toLocaleString() : '—'}</span><span style={{ margin: '0 18px', opacity: 0.4 }}>·</span>
              {waitlist.length > 0 && <><span>候補名單 {waitlist.length} 人</span><span style={{ margin: '0 18px', opacity: 0.4 }}>·</span></>}
              <span>MooLah 後台管理</span><span style={{ margin: '0 18px', opacity: 0.4 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Stats 2×2 ── */}
      <div data-animate style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '20px 16px 0' }}>
        {[
          { label: '今日預約', value: `${todayBookings.length}`, unit: '筆', shade: 'dark' as const },
          { label: '今日營收', value: todayRevenue === 0 ? '—' : todayRevenue.toLocaleString(), unit: todayRevenue > 0 ? 'NT$' : '', shade: 'oak' as const },
          { label: '本月預約', value: `${monthBookings.length}`, unit: '筆', shade: 'light' as const },
          { label: '本月營收', value: monthRevenue === 0 ? '—' : monthRevenue.toLocaleString(), unit: monthRevenue > 0 ? 'NT$' : '', shade: 'light' as const },
        ].map(item => {
          const isDark = item.shade === 'dark'
          const isOak  = item.shade === 'oak'
          const bg     = isDark ? 'var(--charcoal-deep)' : isOak ? 'rgba(166,137,102,0.08)' : cardBg
          const bdr    = isDark ? '1px solid rgba(166,137,102,0.25)' : isOak ? '1px solid rgba(166,137,102,0.22)' : `1px solid ${border}`
          const numClr = isDark ? cream : oak
          const lblClr = isDark ? 'rgba(251,249,244,0.55)' : 'rgba(44,40,37,0.52)'
          const ntClr  = isDark ? 'rgba(166,137,102,0.7)' : 'rgba(166,137,102,0.65)'
          return (
          <div key={item.label} style={{
            background: bg, border: bdr,
            borderRadius: '16px', padding: '18px 16px 14px', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            {isDark && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, var(--oak), transparent)' }} />}
            {isOak  && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px', background: 'linear-gradient(to right, rgba(166,137,102,0.5), transparent)' }} />}
            {item.unit === 'NT$' && (
              <p style={{ fontSize: '9px', letterSpacing: '0.16em', color: ntClr, marginBottom: '4px' }}>NT$</p>
            )}
            <p style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: item.unit === '筆' ? '2.4rem' : '1.9rem',
              fontWeight: 300, color: numClr,
              lineHeight: 1, letterSpacing: '-0.02em',
            }}>
              {item.value}{item.unit === '筆' && <span style={{ fontSize: '1rem', marginLeft: '3px', opacity: 0.7 }}>筆</span>}
            </p>
            <p style={{
              fontSize: '10px', color: lblClr, marginTop: '8px', letterSpacing: '0.08em',
              fontFamily: "var(--font-noto-serif-tc), 'Noto Serif TC', 'Songti SC', serif",
            }}>{item.label}</p>
          </div>
          )
        })}
      </div>

      {/* 首次使用引導（還沒設定服務 = 新設計師）*/}
      {services.length === 0 && (
        <FirstRunChecklist
          providerId={providerId}
          onGoServices={() => setMainView('services')}
          onGoSchedule={() => setMainView('schedule')}
        />
      )}

      {/* 數據與對帳：預設收合，把操作內容（預約）往上提 */}
      <button data-animate data-delay="55" onClick={() => setShowAnalytics(v => !v)} style={{ display: 'flex', width: 'calc(100% - 32px)', margin: '14px 16px 0', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', cursor: 'pointer' }}>
        <span style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: oak, fontWeight: 600 }}>
          📊 數據與對帳{isTrial && !isExpired ? ` · 試用剩 ${trialDaysLeft} 天` : ''}
        </span>
        <span style={{ fontSize: '12px', color: oak }}>{showAnalytics ? '收合 ▲' : '展開 ▼'}</span>
      </button>
      {showAnalytics && (<>
      {/* ── 本月對帳透明化 panel ── */}
      <div data-animate data-delay="60" style={{ margin: '14px 16px 0', padding: '16px 18px', background: 'linear-gradient(135deg, rgba(166,137,102,0.10), rgba(166,137,102,0.04))', border: '1px solid rgba(166,137,102,0.24)', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px', background: 'linear-gradient(to right, transparent, var(--oak), transparent)', opacity: 0.6 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: oak, fontWeight: 600 }}>本月對帳</p>
          <span style={{ fontSize: '10px', color: 'rgba(44,40,37,0.42)', letterSpacing: '0.06em' }}>{today.slice(0, 7).replace('-', ' / ')}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', alignItems: 'stretch' }}>
          <div style={{ textAlign: 'center', padding: '4px 6px' }}>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', fontWeight: 300, color: charcoal, lineHeight: 1, letterSpacing: '-0.02em' }}>{monthBookings.length}</p>
            <p style={{ fontSize: '9.5px', color: 'rgba(44,40,37,0.55)', marginTop: '6px', letterSpacing: '0.06em' }}>成交數</p>
          </div>
          <div style={{ textAlign: 'center', padding: '4px 6px', borderLeft: '1px solid rgba(166,137,102,0.18)', borderRight: '1px solid rgba(166,137,102,0.18)' }}>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', fontWeight: 300, color: charcoal, lineHeight: 1, letterSpacing: '-0.02em' }}>{monthRevenue > 0 ? monthRevenue.toLocaleString() : '—'}</p>
            <p style={{ fontSize: '9.5px', color: 'rgba(44,40,37,0.55)', marginTop: '6px', letterSpacing: '0.06em' }}>營收 NT$</p>
          </div>
          <div style={{ textAlign: 'center', padding: '4px 6px' }}>
            {isTrial && !isExpired ? (
              <>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', fontWeight: 300, color: oak, lineHeight: 1, letterSpacing: '-0.02em' }}>{trialDaysLeft}</p>
                <p style={{ fontSize: '9.5px', color: 'rgba(44,40,37,0.55)', marginTop: '6px', letterSpacing: '0.06em' }}>試用剩餘天</p>
              </>
            ) : (
              <>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', fontWeight: 300, color: oak, lineHeight: 1, letterSpacing: '-0.02em' }}>699</p>
                <p style={{ fontSize: '9.5px', color: 'rgba(44,40,37,0.55)', marginTop: '6px', letterSpacing: '0.06em' }}>應付月費 NT$</p>
              </>
            )}
          </div>
        </div>
        <div style={{ marginTop: '14px', padding: '10px 12px', background: 'rgba(255,255,255,0.55)', borderRadius: '10px', border: '1px solid rgba(166,137,102,0.16)' }}>
          {isExpired ? (
            <p style={{ fontSize: '11px', color: charcoal, lineHeight: 1.55 }}>
              <span style={{ fontWeight: 600, color: '#b4533a' }}>⏰ 試用已結束</span>
              <span style={{ color: 'rgba(44,40,37,0.55)' }}>　·　後台即將暫停，正式加入（NT$699/月）即可繼續服務並獲贈免費客製立牌</span>
            </p>
          ) : isTrial ? (
            <p style={{ fontSize: '11px', color: charcoal, lineHeight: 1.55 }}>
              <span style={{ fontWeight: 600, color: oak }}>🎁 試用中 · 剩 {trialDaysLeft} 天 · 已用 {trialUsed}/{TRIAL_LIMIT} 筆</span>
              <span style={{ color: 'rgba(44,40,37,0.55)' }}>　·　正式加入 NT$699/月解鎖無限預約 + 免費客製立牌</span>
            </p>
          ) : (
            <p style={{ fontSize: '11px', color: charcoal, lineHeight: 1.55 }}>
              <span style={{ fontWeight: 600, color: oak }}>✓ 月費 NT$699</span>
              <span style={{ color: 'rgba(44,40,37,0.55)' }}>　·　0% 抽佣 · 不綁約 · 解約提前 1 週通知</span>
            </p>
          )}
        </div>
      </div>

      {/* ── 回購率 dashboard (#24) ── */}
      <div data-animate data-delay="70" style={{ margin: '14px 16px 0', padding: '16px 18px', background: 'var(--charcoal-deep)', border: '1px solid rgba(166,137,102,0.25)', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px', background: 'linear-gradient(to right, transparent, var(--oak), transparent)', opacity: 0.6 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: oak, fontWeight: 600 }}>回購分析 · 近 90 天</p>
          <span style={{ fontSize: '10px', color: 'rgba(251,249,244,0.42)', letterSpacing: '0.06em' }}>{past90Bookings.length} 筆預約</span>
        </div>
        {customerKeys.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'rgba(251,249,244,0.55)', textAlign: 'center', padding: '10px 0', lineHeight: 1.6 }}>
            近 90 天還沒有預約資料<br/>
            <span style={{ fontSize: '11px', color: 'rgba(251,249,244,0.35)' }}>開始接單後這裡會有完整分析</span>
          </p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', alignItems: 'stretch' }}>
              <div style={{ textAlign: 'center', padding: '4px 4px' }}>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.7rem', fontWeight: 300, color: oak, lineHeight: 1 }}>{repeatRate}<span style={{ fontSize: '1rem', opacity: 0.7 }}>%</span></p>
                <p style={{ fontSize: '9.5px', color: 'rgba(251,249,244,0.5)', marginTop: '6px', letterSpacing: '0.06em' }}>回購率</p>
              </div>
              <div style={{ textAlign: 'center', padding: '4px 4px', borderLeft: '1px solid rgba(166,137,102,0.18)' }}>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.7rem', fontWeight: 300, color: cream, lineHeight: 1 }}>{repeatCustomers.length}</p>
                <p style={{ fontSize: '9.5px', color: 'rgba(251,249,244,0.5)', marginTop: '6px', letterSpacing: '0.06em' }}>回頭客</p>
              </div>
              <div style={{ textAlign: 'center', padding: '4px 4px', borderLeft: '1px solid rgba(166,137,102,0.18)' }}>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.7rem', fontWeight: 300, color: cream, lineHeight: 1 }}>{newCustomers.length}</p>
                <p style={{ fontSize: '9.5px', color: 'rgba(251,249,244,0.5)', marginTop: '6px', letterSpacing: '0.06em' }}>新客</p>
              </div>
              <div style={{ textAlign: 'center', padding: '4px 4px', borderLeft: '1px solid rgba(166,137,102,0.18)' }}>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.7rem', fontWeight: 300, color: cream, lineHeight: 1 }}>{avgInterval || '—'}<span style={{ fontSize: '0.9rem', opacity: 0.7, marginLeft: '2px' }}>{avgInterval ? '天' : ''}</span></p>
                <p style={{ fontSize: '9.5px', color: 'rgba(251,249,244,0.5)', marginTop: '6px', letterSpacing: '0.06em' }}>回購間隔</p>
              </div>
            </div>
            <p style={{ fontSize: '10.5px', color: 'rgba(251,249,244,0.42)', marginTop: '12px', lineHeight: 1.55, textAlign: 'center' }}>
              {repeatRate >= 50 ? '🌟 黏著度很高，繼續維持品質！' :
               repeatRate >= 30 ? '👍 回購表現不錯，可加強回訪提醒' :
               repeatRate >= 15 ? '📈 回購率有成長空間，建議追蹤老客戶' :
               '💡 多數是新客，思考如何讓他們再來'}
            </p>
          </>
        )}
      </div>
      </>)}

      {/* ── Sand content panel ── */}
      <div style={{ position: 'relative', marginTop: '14px', background: 'var(--sand)', borderTop: '1px solid rgba(166,137,102,0.16)', borderRadius: '22px 22px 0 0', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)', paddingBottom: '8px' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '46px', height: '3px', borderRadius: '0 0 3px 3px', background: 'var(--oak)', opacity: 0.5 }} />

      {/* ── Main Nav (scrollable) ── */}
      <div data-animate data-delay="100" style={{ margin: '16px 16px 0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid rgba(166,137,102,0.15)', paddingBottom: '0', minWidth: 'max-content' }}>
        {([['bookings', '預約管理'], ['services', '服務管理'], ['schedule', '排班設定'], ['portfolio', '作品集'], ['waitlist', `候補${waitlist.length > 0 ? ` ${waitlist.length}` : ''}`]] as [MainView, string][]).map(([v, label]) => (
          <button key={v} onClick={() => { setMainView(v); if (v === 'waitlist') fetchWaitlist() }} style={{
            padding: '10px 16px 12px', fontSize: '12px',
            fontWeight: mainView === v ? 600 : 400, border: 'none', cursor: 'pointer',
            background: 'transparent',
            color: mainView === v ? charcoal : 'rgba(44,40,37,0.45)',
            borderBottom: mainView === v ? `2px solid ${oak}` : '2px solid transparent',
            transition: 'all 0.18s', whiteSpace: 'nowrap',
            letterSpacing: '0.02em',
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
                  padding: '11px 18px', borderRadius: '20px', fontSize: '12px',
                  fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer',
                  background: tab === t.key ? oak : 'transparent',
                  border: tab === t.key ? `1px solid ${oak}` : '1px solid rgba(166,137,102,0.35)',
                  color: tab === t.key ? cream : 'rgba(44,40,37,0.62)',
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
                <EmptyBookings tab={tab} providerId={providerId} />
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
                              <BookingCard key={b.id} booking={b} onCancel={handleCancel} onViewCustomer={setCustomerSheet} isNext={b.id === nextBookingId} />
                            ))}
                          </div>
                        </div>
                      ))
                    : filteredBookings.map(b => (
                        <BookingCard key={b.id} booking={b} onCancel={handleCancel} onViewCustomer={setCustomerSheet} compact />
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

      {/* ════════════════ WAITLIST VIEW ════════════════ */}
      {mainView === 'waitlist' && (
        <section style={{ padding: '0 16px 24px' }}>
          {waitlist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: 'rgba(166,137,102,0.04)', borderRadius: '18px', border: `1px solid ${border}` }}>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '20px', color: 'rgba(44,40,37,0.3)', marginBottom: '8px' }}>目前沒有候補</p>
              <p style={{ fontSize: '11px', color: 'rgba(44,40,37,0.35)' }}>預約頁時段客滿時，顧客可加入候補名單</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {waitlist.map(entry => (
                <div key={entry.id} style={{ background: 'rgba(180,120,40,0.06)', border: '1px solid rgba(180,120,40,0.22)', borderRadius: '14px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '18px', fontWeight: 600, color: charcoal }}>{entry.date} {entry.time}</p>
                      <p style={{ fontSize: '13px', color: '#8a5c20', marginTop: '2px' }}>{entry.customerName}</p>
                    </div>
                    <span style={{ fontSize: '10px', color: '#8a5c20', background: 'rgba(180,120,40,0.12)', padding: '3px 10px', borderRadius: '20px' }}>候補中</span>
                  </div>
                  {entry.customerPhone && (
                    <p style={{ fontSize: '11px', color: '#7a6e68', marginBottom: '10px' }}>📱 {entry.customerPhone}</p>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={async () => {
                        setRemovingWL(entry.id)
                        await fetch('/api/admin/waitlist', { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ entryId: entry.id, status: 'cancelled' }) })
                        setWaitlist(w => w.filter(e => e.id !== entry.id))
                        setRemovingWL(null)
                      }}
                      disabled={removingWL === entry.id}
                      style={{ flex: 1, fontSize: '11px', color: '#7a6e68', border: `1px solid ${border}`, borderRadius: '10px', padding: '8px', background: 'transparent', cursor: 'pointer', opacity: removingWL === entry.id ? 0.5 : 1 }}
                    >
                      移除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      </div>{/* end sand panel */}

      {/* ── Dark footer ── */}
      <div style={{ background: 'var(--charcoal-deep)', padding: '34px 24px 44px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: '300px 300px', pointerEvents: 'none' }} />
        {/* Diamond ornament */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '16px', position: 'relative' }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(166,137,102,0.38))' }} />
          <span style={{ fontSize: '14px', color: oak, letterSpacing: '0.08em' }}>◆</span>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(166,137,102,0.38))' }} />
        </div>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.45rem', fontWeight: 300, color: cream, marginBottom: '20px', position: 'relative' }}>{providerName}</p>
        {/* 3-col mini stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px', marginBottom: '22px', position: 'relative' }}>
          {([
            { label: '今日預約', value: `${todayBookings.length}` },
            { label: '本月預約', value: `${monthBookings.length}` },
            { label: '本月營收', value: monthRevenue > 0 ? `NT$${monthRevenue.toLocaleString()}` : '—' },
          ] as { label: string; value: string }[]).map(s => (
            <div key={s.label} style={{ padding: '10px 4px' }}>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', fontWeight: 300, color: cream, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '9px', color: 'rgba(251,249,244,0.32)', letterSpacing: '0.08em', marginTop: '5px' }}>{s.label}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '10px', color: 'rgba(251,249,244,0.25)', letterSpacing: '0.14em', textTransform: 'uppercase', position: 'relative' }}>MooLah · 合作夥伴後台</p>
      </div>

      {/* ── 嵌入到 IG/網站 widget snippet (#30) ── */}
      <details style={{ margin: '0 16px 24px', padding: '14px 18px', background: 'rgba(166,137,102,0.08)', border: '1px solid rgba(166,137,102,0.25)', borderRadius: '12px' }}>
        <summary style={{ cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: oak, letterSpacing: '0.06em', listStyle: 'none' }}>
          📌 嵌入到 IG bio / 自己網站
        </summary>
        <div style={{ marginTop: '12px', fontSize: '11px', color: 'rgba(44,40,37,0.7)', lineHeight: 1.7 }}>
          <p style={{ marginBottom: '10px' }}>把以下程式碼貼到你的網站，客人可直接看到最近可預約時段：</p>
          <pre style={{ background: '#2C2825', color: '#A68966', padding: '12px', borderRadius: '8px', fontSize: '10.5px', overflowX: 'auto', fontFamily: 'ui-monospace, Menlo, monospace', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
{`<iframe src="https://moolah-platform.vercel.app/embed/${providerId}" width="360" height="540" frameborder="0" style="border:0;border-radius:14px;"></iframe>`}
          </pre>
          <p style={{ marginTop: '8px', fontSize: '10px', color: 'rgba(44,40,37,0.5)' }}>
            或直接分享連結：
            <a href={`/embed/${providerId}`} target="_blank" rel="noopener noreferrer" style={{ color: oak, marginLeft: '4px', textDecoration: 'underline' }}>
              預覽 widget →
            </a>
          </p>
        </div>
      </details>

      {/* ── Customer History Sheet ── */}
      {customerSheet && (
        <CustomerSheet booking={customerSheet} allBookings={bookings} onClose={() => setCustomerSheet(null)} providerId={providerId} />
      )}
    </main>
  )
}
