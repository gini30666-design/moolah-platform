'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import liff from '@line/liff'

interface Booking {
  bookingId: string
  providerId: string
  date: string
  time: string
  providerName: string
  serviceName: string
  servicePrice: string
  notes: string
  status: string
  isPast: boolean
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState<Set<string>>(new Set())
  const [confirming, setConfirming] = useState<string | null>(null)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function init() {
      try {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href })
          return
        }
        const profile = await liff.getProfile()
        setUserId(profile.userId)
        const res = await fetch(`/api/my-bookings?userId=${profile.userId}`)
        const data = await res.json()
        setBookings(data.bookings ?? [])
      } catch {
        setError('載入預約資料失敗，請稍後再試。')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  async function doCancel(bookingId: string) {
    setCancelling(bookingId)
    setConfirming(null)
    try {
      const res = await fetch('/api/my-bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, userId }),
      })
      if (res.ok) {
        setCancelled(prev => new Set([...prev, bookingId]))
      } else {
        alert('取消失敗，請稍後再試。')
      }
    } catch {
      alert('取消失敗，請稍後再試。')
    }
    setCancelling(null)
  }

  const upcoming = bookings.filter(b => !b.isPast && !cancelled.has(b.bookingId))
  const past = bookings.filter(b => b.isPast && !cancelled.has(b.bookingId))

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--charcoal-deep, #1a1714)',
        color: 'var(--cream, #fbf9f4)',
        fontFamily: '"DM Sans", sans-serif',
      }}
    >
      {/* Nav */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'rgba(26,23,20,0.96)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(166,137,102,0.15)',
        }}
      >
        <Link href="/discover" style={{ color: 'var(--oak, #A68966)', fontSize: '13px', textDecoration: 'none' }}>
          ← 探索職人
        </Link>
        <span
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '18px',
            letterSpacing: '0.08em',
            color: 'var(--cream, #fbf9f4)',
          }}
        >
          MooLah
        </span>
        <div style={{ width: '60px' }} />
      </div>

      <div style={{ padding: '32px 20px 48px', maxWidth: '480px', margin: '0 auto' }}>
        {/* Title */}
        <div data-animate style={{ marginBottom: '32px' }}>
          <h1
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '32px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              margin: '0 0 8px',
              color: 'var(--cream, #fbf9f4)',
            }}
          >
            我的預約
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(251,249,244,0.5)', margin: 0 }}>
            查看您的預約紀錄與狀態
          </p>
          <div
            style={{
              width: '40px',
              height: '2px',
              background: 'var(--oak, #A68966)',
              marginTop: '16px',
              borderRadius: '1px',
            }}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(251,249,244,0.4)', fontSize: '14px' }}>
            載入中…
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div
            style={{
              padding: '20px',
              background: 'rgba(255,100,100,0.1)',
              border: '1px solid rgba(255,100,100,0.2)',
              borderRadius: '12px',
              color: '#ff8080',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {/* No bookings */}
        {!loading && !error && bookings.length === 0 && (
          <div data-animate style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📅</div>
            <p style={{ fontSize: '16px', color: 'rgba(251,249,244,0.6)', marginBottom: '24px' }}>
              目前沒有預約紀錄
            </p>
            <Link
              href="/discover"
              style={{
                display: 'inline-block',
                padding: '12px 32px',
                background: 'var(--oak, #A68966)',
                color: 'var(--cream, #fbf9f4)',
                borderRadius: '999px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                letterSpacing: '0.08em',
              }}
            >
              探索職人開始預約
            </Link>
          </div>
        )}

        {/* Upcoming bookings */}
        {!loading && upcoming.length > 0 && (
          <div data-animate style={{ marginBottom: '40px' }}>
            <h2
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--oak, #A68966)',
                marginBottom: '16px',
              }}
            >
              即將到來
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcoming.map(b => (
                <BookingCard
                  key={b.bookingId}
                  booking={b}
                  isCancelling={cancelling === b.bookingId}
                  isConfirming={confirming === b.bookingId}
                  onCancelRequest={() => setConfirming(b.bookingId)}
                  onCancelConfirm={() => doCancel(b.bookingId)}
                  onCancelAbort={() => setConfirming(null)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past bookings */}
        {!loading && past.length > 0 && (
          <div data-animate>
            <h2
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(251,249,244,0.3)',
                marginBottom: '16px',
              }}
            >
              歷史紀錄
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {past.map(b => (
                <BookingCard
                  key={b.bookingId}
                  booking={b}
                  isPastView
                  isCancelling={false}
                  isConfirming={false}
                  onCancelRequest={() => {}}
                  onCancelConfirm={() => {}}
                  onCancelAbort={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {/* New booking CTA */}
        {!loading && !error && (
          <div data-animate style={{ marginTop: '48px', textAlign: 'center' }}>
            <Link
              href="/discover"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 32px',
                border: '1.5px solid rgba(166,137,102,0.4)',
                borderRadius: '999px',
                textDecoration: 'none',
                fontSize: '13px',
                letterSpacing: '0.1em',
                color: 'var(--oak, #A68966)',
                transition: 'all 0.2s',
              }}
            >
              + 新增預約
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ── BookingCard ───────────────────────────────────────────────────────────

interface CardProps {
  booking: Booking
  isPastView?: boolean
  isCancelling: boolean
  isConfirming: boolean
  onCancelRequest: () => void
  onCancelConfirm: () => void
  onCancelAbort: () => void
}

function BookingCard({
  booking: b,
  isPastView,
  isCancelling,
  isConfirming,
  onCancelRequest,
  onCancelConfirm,
  onCancelAbort,
}: CardProps) {
  return (
    <div
      style={{
        background: isPastView
          ? 'rgba(255,255,255,0.03)'
          : 'rgba(255,255,255,0.06)',
        border: isPastView
          ? '1px solid rgba(255,255,255,0.06)'
          : '1px solid rgba(166,137,102,0.2)',
        borderRadius: '16px',
        padding: '20px',
        opacity: isPastView ? 0.6 : 1,
      }}
    >
      {/* Date & time row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--cream, #fbf9f4)',
              letterSpacing: '0.02em',
              marginBottom: '2px',
            }}
          >
            {b.date}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--oak, #A68966)', fontVariantNumeric: 'tabular-nums' }}>
            {b.time}
          </div>
        </div>
        <StatusBadge isPast={isPastView} />
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />

      {/* Service & provider */}
      <div style={{ marginBottom: '4px' }}>
        <span
          style={{
            fontSize: '15px',
            fontWeight: 500,
            color: 'var(--cream, #fbf9f4)',
          }}
        >
          {b.serviceName}
        </span>
        {b.servicePrice && (
          <span
            style={{
              marginLeft: '8px',
              fontSize: '13px',
              color: 'var(--oak, #A68966)',
            }}
          >
            NT${b.servicePrice}
          </span>
        )}
      </div>
      <div style={{ fontSize: '13px', color: 'rgba(251,249,244,0.5)' }}>{b.providerName}</div>

      {b.notes && (
        <div
          style={{
            marginTop: '10px',
            fontSize: '12px',
            color: 'rgba(251,249,244,0.4)',
            fontStyle: 'italic',
          }}
        >
          備註：{b.notes}
        </div>
      )}

      {/* Cancel area — only for upcoming */}
      {!isPastView && (
        <div style={{ marginTop: '16px' }}>
          {isConfirming ? (
            <div>
              <p style={{ fontSize: '13px', color: 'rgba(251,249,244,0.7)', marginBottom: '10px' }}>
                確定要取消此預約嗎？取消後將通知設計師。
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={onCancelConfirm}
                  disabled={isCancelling}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'rgba(220,60,60,0.15)',
                    border: '1px solid rgba(220,60,60,0.4)',
                    borderRadius: '10px',
                    color: '#ff8080',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {isCancelling ? '取消中…' : '確認取消'}
                </button>
                <button
                  onClick={onCancelAbort}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: 'rgba(251,249,244,0.6)',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  保留預約
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onCancelRequest}
              style={{
                width: '100%',
                padding: '10px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: 'rgba(251,249,244,0.4)',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              取消此預約
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ isPast }: { isPast?: boolean }) {
  if (isPast) {
    return (
      <span
        style={{
          padding: '3px 10px',
          borderRadius: '999px',
          fontSize: '11px',
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(251,249,244,0.4)',
        }}
      >
        已完成
      </span>
    )
  }
  return (
    <span
      style={{
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '11px',
        background: 'rgba(166,137,102,0.15)',
        color: 'var(--oak, #A68966)',
        border: '1px solid rgba(166,137,102,0.3)',
      }}
    >
      待服務
    </span>
  )
}
