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
    <div className="bg-white rounded-2xl px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{booking.time}</p>
          <p className="text-xs text-[#9b8ea0] mt-0.5">{booking.serviceName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">NT$ {booking.servicePrice.toLocaleString()}</p>
          {isManual && (
            <span className="text-[10px] text-[#A68966] bg-[#fdf3e8] px-2 py-0.5 rounded-full">私下預約</span>
          )}
        </div>
      </div>

      <div className="border-t border-gray-50 pt-3 space-y-1.5">
        <div className="flex gap-2 text-xs text-gray-500">
          <span className="text-gray-300">客戶</span>
          <span className="text-gray-700 font-medium">{booking.customerName}</span>
          {booking.gender && <span className="bg-[#f0eaed] text-[#9b8ea0] px-2 py-0.5 rounded-full">{booking.gender}</span>}
          {booking.hairLength && <span className="bg-[#f0eaed] text-[#9b8ea0] px-2 py-0.5 rounded-full">{booking.hairLength}</span>}
        </div>
        {booking.note && (
          <div className="flex gap-2 text-xs text-gray-500">
            <span className="text-gray-300">備註</span>
            <span className="text-gray-600 leading-relaxed">{booking.note}</span>
          </div>
        )}
        <p className="text-[10px] text-gray-300">#{booking.id}</p>
      </div>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="mt-3 w-full text-xs text-gray-300 border border-gray-100 rounded-xl py-2 hover:border-red-100 hover:text-red-300 transition-colors"
        >
          取消此預約
        </button>
      ) : (
        <div className="mt-3 bg-red-50 rounded-xl px-3 py-3 space-y-2">
          <p className="text-xs text-red-400 text-center">確定取消？{!isManual && '系統將自動通知客戶。'}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 text-xs text-gray-400 border border-gray-100 rounded-lg py-2"
            >
              返回
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 text-xs bg-red-400 text-white rounded-lg py-2 disabled:opacity-50"
            >
              {cancelling ? '取消中...' : '確認取消'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Manual Booking Form ───────────────────────────────────────────────────────
function ManualBookingForm({
  providerId,
  services,
  onSuccess,
}: {
  providerId: string
  services: Service[]
  onSuccess: () => void
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
        setDone(false)
        setOpen(false)
        setCustomerName('')
        setDate('')
        setTime('')
        setNote('')
        onSuccess()
      }, 1500)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#e8e2db] rounded-2xl py-4 text-sm text-gray-400 hover:border-[#9b8ea0] hover:text-[#9b8ea0] transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
        </svg>
        新增私下預約
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm px-4 py-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-800">新增私下預約</p>
        <button onClick={() => setOpen(false)} className="text-gray-300 text-lg leading-none">×</button>
      </div>

      {done ? (
        <div className="text-center py-8">
          <div className="text-2xl mb-2">✓</div>
          <p className="text-sm text-[#9b8ea0]">已成功新增！</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 服務項目 */}
          <div>
            <label className="text-xs text-gray-400 tracking-widest uppercase block mb-2">服務項目</label>
            <select
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              required
              className="w-full bg-[#faf9f7] rounded-xl px-3 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#d4c9d0]"
            >
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}　NT$ {s.price.toLocaleString()}　{s.duration} 分鐘
                </option>
              ))}
            </select>
            {selectedService && (
              <p className="text-xs text-gray-400 mt-1.5 px-1">
                預計時長：{selectedService.duration} 分鐘　金額：NT$ {selectedService.price.toLocaleString()}
              </p>
            )}
          </div>

          {/* 客戶姓名 */}
          <div>
            <label className="text-xs text-gray-400 tracking-widest uppercase block mb-2">客戶姓名</label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="例如：王小姐"
              className="w-full bg-[#faf9f7] rounded-xl px-3 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#d4c9d0]"
            />
          </div>

          {/* 日期 & 時間 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 tracking-widest uppercase block mb-2">日期</label>
              <input
                type="date"
                min={today}
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full bg-[#faf9f7] rounded-xl px-3 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#d4c9d0]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 tracking-widest uppercase block mb-2">時間</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                required
                className="w-full bg-[#faf9f7] rounded-xl px-3 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#d4c9d0]"
              />
            </div>
          </div>

          {/* 備註 */}
          <div>
            <label className="text-xs text-gray-400 tracking-widest uppercase block mb-2">備註（選填）</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="私下預約的特殊需求..."
              rows={2}
              className="w-full bg-[#faf9f7] rounded-xl px-3 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#d4c9d0] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!serviceId || !date || !time || submitting}
            className="w-full bg-[#9b8ea0] text-white py-3.5 rounded-full text-sm font-medium disabled:opacity-40 transition-opacity"
          >
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
          // 帶 redirectUri 確保登入後回到 admin 頁面，而不是 LIFF 預設 endpoint
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
      .catch(() => {
        setAuthorized(false)
        setLoading(false)
      })
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

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-300 text-sm">載入中...</div>

  if (authorized === false) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-3 px-6">
        <div className="w-12 h-12 bg-[#f0eaed] rounded-full flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="#9b8ea0" strokeWidth={1.5} className="w-5 h-5">
            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <p className="text-sm text-gray-500 text-center">此頁面僅供設計師本人使用</p>
      </div>
    )
  }

  const todayCount = bookings.filter(b => b.date === today).length
  const upcomingCount = bookings.filter(b => b.date > today).length
  const monthCount = bookings.filter(b => b.date.startsWith(today.slice(0, 7))).length

  return (
    <main className="min-h-screen bg-[#faf9f7] max-w-md mx-auto px-4 py-8 pb-16">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-1">後台管理</p>
        <h1 className="text-lg font-semibold text-gray-800">{providerName}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: '今日預約', value: todayCount },
          { label: '待服務', value: upcomingCount },
          { label: '本月總計', value: monthCount },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-2xl px-3 py-4 shadow-sm text-center">
            <p className="text-xl font-semibold text-[#9b8ea0]">{item.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              'flex-1 py-2 rounded-xl text-xs transition-all',
              tab === t.key ? 'bg-[#9b8ea0] text-white font-medium shadow-sm' : 'text-gray-400',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Booking list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-300 text-sm">
          {tab === 'today' ? '今日尚無預約' : tab === 'upcoming' ? '目前無待服務預約' : '無過去記錄'}
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {(tab === 'today' || tab === 'upcoming') ? (
            Object.entries(
              filtered.reduce<Record<string, Booking[]>>((acc, b) => {
                acc[b.date] = [...(acc[b.date] ?? []), b]
                return acc
              }, {})
            ).map(([date, dayBookings]) => (
              <div key={date}>
                <p className="text-xs text-gray-400 mb-2 px-1">
                  {date === today ? '今天' : date}
                </p>
                <div className="space-y-3">
                  {dayBookings.map(b => (
                    <BookingCard key={b.id} booking={b} onCancel={handleCancel} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            filtered.map(b => <BookingCard key={b.id} booking={b} onCancel={handleCancel} />)
          )}
        </div>
      )}

      {/* Manual booking section */}
      {services.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 px-1">私下預約管理</p>
          <ManualBookingForm
            providerId={providerId}
            services={services}
            onSuccess={fetchBookings}
          />
        </div>
      )}
    </main>
  )
}
