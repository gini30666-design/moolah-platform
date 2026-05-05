'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import liff from '@line/liff'

type Provider = {
  id: string
  name: string
  category: string
  description: string
  lineUserId: string
}

type Service = {
  id: string
  name: string
  price: number
  duration: number
}

export default function ProviderPage() {
  const { providerId } = useParams<{ providerId: string }>()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! }).then(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready) return
    fetch(`/api/provider/${providerId}`)
      .then(r => r.json())
      .then(data => {
        setProvider(data.provider)
        setServices(data.services)
      })
  }, [ready, providerId])

  if (!provider) return <div className="flex h-screen items-center justify-center text-gray-400">載入中...</div>

  return (
    <main className="min-h-screen bg-[#faf9f7] px-4 py-8 max-w-md mx-auto">
      {/* 設計師頭部資訊 */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-[#e8e2db] mx-auto mb-3 flex items-center justify-center text-2xl">
          {provider.name[0]}
        </div>
        <h1 className="text-xl font-medium text-gray-800">{provider.name}</h1>
        <p className="text-sm text-gray-500 mt-1">{provider.category}</p>
        <p className="text-sm text-gray-600 mt-2">{provider.description}</p>
      </div>

      {/* 服務項目 */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">服務項目</h2>
        <div className="space-y-2">
          {services.map(s => (
            <a
              key={s.id}
              href={`/${providerId}/book?service=${s.id}`}
              className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-400">{s.duration} 分鐘</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700">NT$ {s.price.toLocaleString()}</p>
                <p className="text-xs text-[#9b8ea0] mt-0.5">預約 →</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
