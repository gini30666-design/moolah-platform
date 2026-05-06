'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import liff from '@line/liff'

type Service = { id: string; name: string; price: number; duration: number }
type Provider = { id: string; name: string; category: string }
type SlotStatus = 'available' | 'booked' | 'hot'
type Slot = { time: string; status: SlotStatus }

// 性別（通用）
const GENDER_OPTIONS = ['男性', '女性', '不透露']

// 髮長選項（髮型類別專用）
const HAIR_LENGTH_OPTIONS = ['超短髮', '短髮', '中長髮', '長髮', '超長髮']

const HAIR_CATEGORIES = ['髮型設計師']

function SelectPill({
  options, value, onChange,
}: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={[
            'px-4 py-2 rounded-full text-sm transition-all',
            value === opt
              ? 'bg-[#9b8ea0] text-white shadow-sm'
              : 'bg-white text-gray-600 shadow-sm hover:bg-[#f0eaed]',
          ].join(' ')}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function CompletionScreen({ providerName, serviceName, date, time, onBack }: {
  providerName: string; serviceName: string; date: string; time: string; onBack: () => void
}) {
  return (
    <main className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center px-6">
      {/* 動畫圓圈打勾 */}
      <div className="relative mb-8">
        <svg className="w-24 h-24" viewBox="0 0 96 96">
          <circle
            cx="48" cy="48" r="44"
            fill="none" stroke="#e8e2db" strokeWidth="3"
          />
          <circle
            cx="48" cy="48" r="44"
            fill="none" stroke="#9b8ea0" strokeWidth="3"
            strokeDasharray="276" strokeDashoffset="276"
            strokeLinecap="round"
            style={{ animation: 'drawCircle 0.7s ease forwards' }}
          />
          <polyline
            points="28,50 42,64 68,36"
            fill="none" stroke="#9b8ea0" strokeWidth="3.5"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="60" strokeDashoffset="60"
            style={{ animation: 'drawCheck 0.4s ease 0.6s forwards' }}
          />
        </svg>
      </div>

      <style>{`
        @keyframes drawCircle {
          to { stroke-dashoffset: 0; }
        }
        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }
      `}</style>

      <div className="text-center" style={{ animation: 'fadeUp 0.5s ease 0.8s both' }}>
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">預約完成！</h1>
        <p className="text-sm text-gray-500 mb-1">{providerName}・{serviceName}</p>
        <p className="text-sm text-[#9b8ea0] font-medium">{date} {time}</p>
        <p className="text-xs text-gray-400 mt-4">確認通知已透過 LINE 傳送</p>
      </div>

      <button
        onClick={onBack}
        className="mt-10 text-sm text-gray-400 underline underline-offset-4"
      >
        返回設計師頁面
      </button>
    </main>
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
    liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! }).then(async () => {
      if (!liff.isLoggedIn()) { liff.login(); return }
      const profile = await liff.getProfile()
      setLineUserId(profile.userId)
      setDisplayName(profile.displayName)
    })
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
    const res = await fetch(
      `/api/availability?providerId=${providerId}&date=${selectedDate}&serviceId=${service.id}`
    )
    const data = await res.json()
    setSlots(data.slots ?? [])
    setLoadingSlots(false)
  }, [providerId, service])

  useEffect(() => { fetchSlots(date) }, [date, fetchSlots])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date || !time || !gender || !lineUserId) return
    setSubmitting(true)

    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId, serviceId: service?.id,
        customerName: displayName,
        customerLineUserId: lineUserId,
        date, time, note, gender,
        hairLength: isHairCategory ? hairLength : '',
      }),
    })

    if (res.ok) setDone(true)
    else alert('預約失敗，請稍後再試')
    setSubmitting(false)
  }

  if (done && provider && service) {
    return (
      <CompletionScreen
        providerName={provider.name}
        serviceName={service.name}
        date={date} time={time}
        onBack={() => router.push(`/${providerId}`)}
      />
    )
  }

  if (!provider || !service) {
    return <div className="flex h-screen items-center justify-center text-gray-300 text-sm">載入中...</div>
  }

  const today = new Date().toISOString().split('T')[0]
  const hotCount = slots.filter(s => s.status === 'hot').length
  const canSubmit = date && time && gender && (isHairCategory ? !!hairLength : true) && !submitting

  return (
    <main className="min-h-screen bg-[#faf9f7] max-w-md mx-auto px-4 py-8 pb-32">
      <button onClick={() => router.back()} className="text-sm text-gray-400 mb-6 flex items-center gap-1">
        ← 返回
      </button>

      {/* 頁面標題 */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-800">預約服務</h1>
        <p className="text-sm text-gray-400 mt-0.5">{provider.name}</p>
      </div>

      {/* 服務摘要卡 */}
      <div className="bg-white rounded-2xl px-4 py-3.5 mb-6 shadow-sm flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-800">{service.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{service.duration} 分鐘</p>
        </div>
        <p className="text-sm font-semibold text-gray-700">NT$ {service.price.toLocaleString()}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">

        {/* 性別 */}
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
            性別
          </label>
          <SelectPill options={GENDER_OPTIONS} value={gender} onChange={setGender} />
        </div>

        {/* 目前髮長（髮型類別才顯示） */}
        {isHairCategory && (
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
              目前髮長
            </label>
            <SelectPill options={HAIR_LENGTH_OPTIONS} value={hairLength} onChange={setHairLength} />
          </div>
        )}

        {/* 日期 */}
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
            選擇日期
          </label>
          <input
            type="date" min={today} value={date}
            onChange={e => setDate(e.target.value)}
            required
            className="w-full bg-white rounded-2xl px-4 py-3 text-sm text-gray-800 shadow-sm outline-none focus:ring-2 focus:ring-[#d4c9d0]"
          />
        </div>

        {/* 時段 */}
        {date && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                選擇時段
              </label>
              {!loadingSlots && hotCount > 0 && (
                <span className="text-[10px] text-[#c4845a]">橘色＝熱門推薦</span>
              )}
            </div>

            {loadingSlots ? (
              <p className="text-sm text-gray-300 text-center py-4">查詢中...</p>
            ) : (
              <>
                {hotCount > 0 && (
                  <p className="text-xs text-[#c4845a] bg-[#fdf3ec] rounded-xl px-3 py-2 mb-3">
                    選橘色時段可幫設計師填補空檔，讓排程更集中。
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
                        {isBooked && <span className="block text-[9px] text-gray-300 mt-0.5">已客滿</span>}
                        {isHot && !isSelected && (
                          <span className="absolute -top-1.5 -right-1.5 bg-[#e8a87c] text-white text-[8px] px-1 py-0.5 rounded-full">推薦</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* 補充說明 */}
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
            補充說明（選填）
          </label>
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            placeholder={isHairCategory ? '例如：想要偏灰的色調、參考圖已截圖...' : '特殊需求或備註...'}
            rows={3}
            className="w-full bg-white rounded-2xl px-4 py-3 text-sm text-gray-800 shadow-sm outline-none focus:ring-2 focus:ring-[#d4c9d0] resize-none"
          />
        </div>

        {/* 送出按鈕（固定底部） */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-8 pt-4 bg-gradient-to-t from-[#faf9f7] via-[#faf9f7]/90 to-transparent">
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-[#9b8ea0] text-white py-4 rounded-full text-sm font-medium disabled:opacity-40 transition-opacity shadow-lg"
          >
            {submitting ? '預約中...' : '確認預約'}
          </button>
        </div>
      </form>
    </main>
  )
}
