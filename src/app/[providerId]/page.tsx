'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import liff from '@line/liff'

type Provider = {
  id: string
  name: string
  category: string
  description: string
  avatarUrl: string
  storeName: string
  address: string
  businessHours: string
  phone: string
  instagram: string
}

type Service = { id: string; name: string; price: number; duration: number }
type Portfolio = { id: string; imageUrl: string; caption: string }

export default function ProviderPage() {
  const { providerId } = useParams<{ providerId: string }>()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [portfolio, setPortfolio] = useState<Portfolio[]>([])

  useEffect(() => {
    liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
  }, [])

  useEffect(() => {
    fetch(`/api/provider/${providerId}`)
      .then(r => r.json())
      .then(data => {
        setProvider(data.provider)
        setServices(data.services)
        setPortfolio(data.portfolio ?? [])
      })
  }, [providerId])

  if (!provider) {
    return <div className="flex h-screen items-center justify-center text-gray-300 text-sm">載入中...</div>
  }

  return (
    <main className="min-h-screen bg-[#faf9f7] max-w-md mx-auto pb-32">

      {/* 頭部：大頭貼 + 名稱 + 類別 */}
      <div className="px-5 pt-10 pb-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#e8e2db] mx-auto mb-4 overflow-hidden flex items-center justify-center text-2xl font-medium text-[#9b8ea0]">
          {provider.avatarUrl
            ? <img src={provider.avatarUrl} alt={provider.name} className="w-full h-full object-cover" />
            : provider.name[0]
          }
        </div>
        <h1 className="text-xl font-semibold text-gray-800">{provider.name}</h1>
        {provider.storeName && (
          <p className="text-sm text-gray-500 mt-0.5">{provider.storeName}</p>
        )}
        <span className="inline-block mt-2 text-[11px] text-[#9b8ea0] bg-[#f0eaed] px-2.5 py-0.5 rounded-full">
          {provider.category}
        </span>
        {provider.description && (
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">{provider.description}</p>
        )}
      </div>

      {/* 店家資訊 */}
      {(provider.address || provider.businessHours || provider.phone) && (
        <section className="mx-4 mb-5 bg-white rounded-2xl px-4 py-4 shadow-sm space-y-2.5">
          {provider.address && (
            <div className="flex gap-2.5 items-start">
              <span className="text-base mt-0.5">📍</span>
              <p className="text-sm text-gray-600 leading-snug">{provider.address}</p>
            </div>
          )}
          {provider.businessHours && (
            <div className="flex gap-2.5 items-start">
              <span className="text-base mt-0.5">🕐</span>
              <p className="text-sm text-gray-600 leading-snug">{provider.businessHours}</p>
            </div>
          )}
          {provider.phone && (
            <div className="flex gap-2.5 items-center">
              <span className="text-base">📞</span>
              <a href={`tel:${provider.phone}`} className="text-sm text-[#9b8ea0]">{provider.phone}</a>
            </div>
          )}
        </section>
      )}

      {/* 服務項目 */}
      <section className="mx-4 mb-5">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3 px-1">服務項目</h2>
        <div className="space-y-2">
          {services.map(s => (
            <a
              key={s.id}
              href={`/${providerId}/book?service=${s.id}`}
              className="flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.duration} 分鐘</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700">NT$ {s.price.toLocaleString()}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 作品集（有資料才顯示） */}
      {portfolio.length > 0 && (
        <section className="mx-4 mb-6">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3 px-1">作品集</h2>
          <div className="grid grid-cols-3 gap-1.5">
            {portfolio.map(p => (
              <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-[#e8e2db]">
                <img src={p.imageUrl} alt={p.caption} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 固定底部：橢圓形預約按鈕 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-8 pt-4 bg-gradient-to-t from-[#faf9f7] via-[#faf9f7]/90 to-transparent">
        <a
          href={`/${providerId}/book`}
          className="block w-full bg-[#9b8ea0] text-white text-center py-4 rounded-full text-sm font-medium shadow-lg active:scale-[0.97] transition-transform"
        >
          開始預約
        </a>
      </div>
    </main>
  )
}
