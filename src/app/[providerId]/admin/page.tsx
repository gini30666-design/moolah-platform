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

type TabKey = 'today' | 'upcoming' | 'past'

const today = () => new Date().toISOString().split('T')[0]

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

  return (
    <div className="bg-white rounded-2xl px-4 py-4 shadow-sm">
      {/* 時間+服務 */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{booking.time}</p>
          <p className="text-xs text-[#9b8ea0] mt-0.5">{booking.serviceName}</p>
        </div>
        <p className="text-sm font-medium text-gray-700">NT$ {booking.servicePrice.toLocaleString()}</p>
      </div>

      {/* 客戶資訊 */}
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

      {/* 取消按鈕 */}
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="mt-3 w-full text-xs text-gray-300 border border-gray-100 rounded-xl py-2 hover:border-red-100 hover:text-red-300 transition-colors"
        >
          取消此預約
        </button>
      ) : (
        <div className="mt-3 bg-red-50 rounded-xl px-3 py-3 space-y-2">
          <p className="text-xs text-red-400 text-center">確定取消？系統將自動通知客戶。</p>
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

export default function AdminPage() {
  const { providerId } = useParams<{ providerId: string }>()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [tab, setTab] = useState<TabKey>('today')
  const [providerName, setProviderName] = useState('')

  const fetchBookings = useCallback(async () => {
    const res = await fetch(`/api/admin/bookings?providerId=${providerId}`)
    const data = await res.json()
    setBookings(data.bookings ?? [])
    setLoading(false)
  }, [providerId])

  useEffect(() => {
    liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! }).then(async () => {
      if (!liff.isLoggedIn()) { liff.login(); return }
      const profile = await liff.getProfile()
      const lineUserId = profile.userId

      // 驗證：確認此 LINE 帳號是否為此 providerId 的設計師
      const res = await fetch(`/api/provider/${providerId}`)
      const data = await res.json()
      setProviderName(data.provider?.name ?? '')

      if (data.provider?.lineUserId === lineUserId) {
        setAuthorized(true)
        fetchBookings()
      } else {
        setAuthorized(false)
        setLoading(false)
      }
    })
  }, [providerId, fetchBookings])

  function handleCancel(id: string) {
    setBookings(prev => prev.filter(b => b.id !== id))
  }

  const todayStr = today()

  const filtered = bookings.filter(b => {
    if (tab === 'today') return b.date === todayStr
    if (tab === 'upcoming') return b.date > todayStr
    return b.date < todayStr
  })

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'today', label: '今日' },
    { key: 'upcoming', label: '即將到來' },
    { key: 'past', label: '過去' },
  ]

  const todayCount = bookings.filter(b => b.date === todayStr).length
  const upcomingCount = bookings.filter(b => b.date > todayStr).length

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-300 text-sm">載入中...</div>
  }

  if (authorized === false) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-3 px-6">
        <div className="text-4xl">🔒</div>
        <p className="text-sm text-gray-500 text-center">此頁面僅供設計師本人使用</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#faf9f7] max-w-md mx-auto px-4 py-8 pb-16">

      {/* 頁面標題 */}
      <div className="mb-6">
        <p className="text-xs text-gray-300 uppercase tracking-widest mb-1">後台管理</p>
        <h1 className="text-lg font-semibold text-gray-800">{providerName}</h1>
      </div>

      {/* 數據摘要 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: '今日預約', value: todayCount },
          { label: '待服務', value: upcomingCount },
          { label: '本月總計', value: bookings.filter(b => b.date.startsWith(todayStr.slice(0, 7))).length },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-2xl px-3 py-4 shadow-sm text-center">
            <p className="text-xl font-semibold text-[#9b8ea0]">{item.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Tab 切換 */}
      <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              'flex-1 py-2 rounded-xl text-xs transition-all',
              tab === t.key
                ? 'bg-[#9b8ea0] text-white font-medium shadow-sm'
                : 'text-gray-400',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 預約列表 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-300 text-sm">
          {tab === 'today' ? '今日尚無預約' : tab === 'upcoming' ? '目前無待服務預約' : '無過去記錄'}
        </div>
      ) : (
        <div className="space-y-3">
          {tab === 'today' || tab === 'upcoming' ? (
            // 依日期分組
            Object.entries(
              filtered.reduce<Record<string, Booking[]>>((acc, b) => {
                acc[b.date] = [...(acc[b.date] ?? []), b]
                return acc
              }, {})
            ).map(([date, dayBookings]) => (
              <div key={date}>
                <p className="text-xs text-gray-400 mb-2 px-1">
                  {date === todayStr ? '今天' : date}
                </p>
                <div className="space-y-3">
                  {dayBookings.map(b => (
                    <BookingCard key={b.id} booking={b} onCancel={handleCancel} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            filtered.map(b => (
              <BookingCard key={b.id} booking={b} onCancel={handleCancel} />
            ))
          )}
        </div>
      )}
    </main>
  )
}
