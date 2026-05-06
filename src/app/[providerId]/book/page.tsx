'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import liff from '@line/liff'

type Service = {
  id: string
  name: string
  price: number
  duration: number
}

type Provider = {
  id: string
  name: string
  category: string
}

type SlotStatus = 'available' | 'booked' | 'hot'
type Slot = { time: string; status: SlotStatus }

export default function BookPage() {
  const { providerId } = useParams<{ providerId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const serviceId = searchParams.get('service') ?? ''

  const [provider, setProvider] = useState<Provider | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [lineUserId, setLineUserId] = useState('')
  const [displayName, setDisplayName] = useState('')

  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! }).then(async () => {
      if (!liff.isLoggedIn()) { liff.login(); return }
      const profile = await liff.getProfile()
      setLineUserId(profile.userId)
      setDisplayName(profile.displayName)
    })
  }, [])

  useEffect(() => {
    if (!serviceId) return
    fetch(`/api/provider/${providerId}`)
      .then(r => r.json())
      .then(data => {
        setProvider(data.provider)
        setService(data.services.find((s: Service) => s.id === serviceId) ?? null)
      })
  }, [providerId, serviceId])

  // 每次日期變更時重新拉可用時段
  const fetchSlots = useCallback(async (selectedDate: string) => {
    if (!selectedDate) return
    setLoadingSlots(true)
    setTime('') // 重置已選時間
    const res = await fetch(
      `/api/availability?providerId=${providerId}&date=${selectedDate}&serviceId=${serviceId}`
    )
    const data = await res.json()
    setSlots(data.slots ?? [])
    setLoadingSlots(false)
  }, [providerId, serviceId])

  useEffect(() => {
    fetchSlots(date)
  }, [date, fetchSlots])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date || !time || !lineUserId) return
    setSubmitting(true)

    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId, serviceId,
        customerName: displayName,
        customerLineUserId: lineUserId,
        date, time, note,
      }),
    })

    if (res.ok) setDone(true)
    else alert('預約失敗，請稍後再試')
    setSubmitting(false)
  }

  if (done) {
    return (
      <main className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-medium text-gray-800 mb-2">預約成功！</h1>
          <p className="text-sm text-gray-500 mb-6">確認通知已透過 LINE 傳送給您</p>
          <button onClick={() => router.push(`/${providerId}`)} className="text-sm text-[#9b8ea0] underline">
            返回設計師頁面
          </button>
        </div>
      </main>
    )
  }

  if (!provider || !service) {
    return <div className="flex h-screen items-center justify-center text-gray-400">載入中...</div>
  }

  const today = new Date().toISOString().split('T')[0]
  const hotCount = slots.filter(s => s.status === 'hot').length

  return (
    <main className="min-h-screen bg-[#faf9f7] px-4 py-8 max-w-md mx-auto">
      <button onClick={() => router.back()} className="text-sm text-gray-400 mb-6 flex items-center gap-1">
        ← 返回
      </button>

      <h1 className="text-lg font-medium text-gray-800 mb-1">預約服務</h1>
      <p className="text-sm text-gray-500 mb-6">{provider.name} · {service.name}</p>

      {/* 服務摘要 */}
      <div className="bg-white rounded-xl px-4 py-3 mb-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-800">{service.name}</p>
            <p className="text-xs text-gray-400">{service.duration} 分鐘</p>
          </div>
          <p className="text-sm font-semibold text-gray-700">NT$ {service.price.toLocaleString()}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 日期 */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            選擇日期
          </label>
          <input
            type="date"
            min={today}
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className="w-full bg-white rounded-xl px-4 py-3 text-sm text-gray-800 shadow-sm border-0 outline-none focus:ring-2 focus:ring-[#d4c9d0]"
          />
        </div>

        {/* 時段 */}
        {date && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                選擇時段
              </label>
              {/* 圖例 */}
              {!loadingSlots && slots.length > 0 && (
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  {hotCount > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#e8a87c] inline-block" />
                      熱門推薦
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-200 inline-block" />
                    已客滿
                  </span>
                </div>
              )}
            </div>

            {loadingSlots ? (
              <div className="text-center py-6 text-sm text-gray-400">查詢時段中...</div>
            ) : (
              <>
                {hotCount > 0 && (
                  <p className="text-xs text-[#c4845a] mb-3 bg-[#fdf3ec] rounded-lg px-3 py-2">
                    橘色時段可幫設計師填補空檔，讓排程更集中，優先選它對雙方都好！
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2">
                  {slots.map(slot => {
                    const isBooked = slot.status === 'booked'
                    const isHot = slot.status === 'hot'
                    const isSelected = time === slot.time

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={isBooked}
                        onClick={() => !isBooked && setTime(slot.time)}
                        className={[
                          'relative py-2.5 rounded-xl text-sm transition-all',
                          isBooked
                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                            : isSelected
                              ? 'bg-[#9b8ea0] text-white shadow-md'
                              : isHot
                                ? 'bg-[#fdf0e8] text-[#c4845a] border border-[#e8a87c] hover:bg-[#f8e4d4]'
                                : 'bg-white text-gray-700 shadow-sm hover:bg-[#f0eaed]',
                        ].join(' ')}
                      >
                        {slot.time}
                        {isBooked && (
                          <span className="block text-[9px] text-gray-300 leading-none mt-0.5">
                            已客滿
                          </span>
                        )}
                        {isHot && !isSelected && (
                          <span className="absolute -top-1.5 -right-1.5 bg-[#e8a87c] text-white text-[8px] px-1 py-0.5 rounded-full leading-none">
                            推薦
                          </span>
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
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            備註（選填）
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="例如：髮色偏好、特殊需求..."
            rows={3}
            className="w-full bg-white rounded-xl px-4 py-3 text-sm text-gray-800 shadow-sm border-0 outline-none focus:ring-2 focus:ring-[#d4c9d0] resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !date || !time}
          className="w-full bg-[#9b8ea0] text-white py-3.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-opacity"
        >
          {submitting ? '預約中...' : '確認預約'}
        </button>
      </form>
    </main>
  )
}
