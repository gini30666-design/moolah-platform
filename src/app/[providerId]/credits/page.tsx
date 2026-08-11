'use client'

import { useEffect, useState, use } from 'react'
import liff from '@line/liff'
import OpenInLine from '@/components/OpenInLine'
import { authHeader } from '@/lib/clientAuth'

/**
 * 客人端：我的儲值卡／次卡。
 *
 * ⚠️ 這頁只讀。餘額與流水帳由職人在後台操作，客人這邊看得到但改不動——
 *    這正是它作為「爭議證據」的價值所在。
 */

type Entry = { type: string; delta: number; deltaText: string; memo: string | null; serviceName: string | null; createdAt: string }
type Card = {
  id: number; providerId: string; providerName: string; kind: 'amount' | 'count'
  title: string; status: string; expiresOn: string | null; refundTerms: string | null
  expired: boolean; balance: number; balanceText: string; entries: Entry[]
}

const CHARCOAL = '#241c15'
const OAK = '#a98a5e'
const CREAM = '#fbf9f4'

const TYPE_LABEL: Record<string, string> = {
  topup: '儲值', redeem: '扣款', reverse: '更正', adjust: '調整', refund: '退款', expire: '到期',
}

export default function MyCreditsPage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = use(params)
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [needLine, setNeedLine] = useState(false)
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => {
    async function init() {
      try {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
        if (!liff.isLoggedIn()) {
          // 外部瀏覽器不能直接 login()，會無限跳轉（見 OpenInLine 註解）
          if (!liff.isInClient()) { setNeedLine(true); setLoading(false); return }
          liff.login({ redirectUri: window.location.href })
          return
        }
        const res = await fetch(`/api/my-credits?providerId=${providerId}`, { headers: authHeader() })
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        setCards(data.cards ?? [])
        if (data.cards?.length === 1) setOpen(data.cards[0].id)
      } catch {
        setError('載入失敗，請稍後再試。')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [providerId])

  if (needLine) return <OpenInLine path={`/${providerId}/credits`} />

  return (
    <div style={{ minHeight: '100vh', background: CREAM, padding: '24px 16px 48px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.7rem', color: CHARCOAL, marginBottom: 4 }}>
          我的儲值
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(36,28,21,0.6)', marginBottom: 24 }}>餘額與每一筆使用紀錄</p>

        {loading && <p style={{ fontSize: 14, color: 'rgba(36,28,21,0.5)' }}>載入中…</p>}
        {error && <p style={{ fontSize: 14, color: '#b4453a' }}>{error}</p>}

        {!loading && !error && cards.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: CHARCOAL, marginBottom: 6 }}>目前沒有儲值紀錄</p>
            <p style={{ fontSize: 13, color: 'rgba(36,28,21,0.55)', lineHeight: 1.7 }}>
              如果你已在店裡儲值但這裡沒有顯示，請直接與店家確認。
            </p>
          </div>
        )}

        {cards.map(c => (
          <div key={c.id} style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, opacity: c.expired || c.status === 'closed' ? 0.62 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, color: 'rgba(36,28,21,0.55)' }}>{c.providerName}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: CHARCOAL, wordBreak: 'break-word' }}>{c.title}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.7rem', color: OAK, lineHeight: 1.1 }}>
                  {c.balanceText}
                </p>
                <p style={{ fontSize: 11, color: 'rgba(36,28,21,0.5)' }}>目前餘額</p>
              </div>
            </div>

            {(c.expired || c.status === 'closed') && (
              <p style={{ marginTop: 10, fontSize: 12, color: '#b4453a' }}>
                {c.status === 'closed' ? '此卡已結清' : '此卡已過期'}
              </p>
            )}
            {c.expiresOn && !c.expired && (
              <p style={{ marginTop: 10, fontSize: 12, color: 'rgba(36,28,21,0.6)' }}>有效期限：{c.expiresOn}</p>
            )}
            {c.refundTerms && (
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(36,28,21,0.6)', lineHeight: 1.6 }}>退費規則：{c.refundTerms}</p>
            )}

            <button
              onClick={() => setOpen(open === c.id ? null : c.id)}
              style={{
                marginTop: 14, width: '100%', minHeight: 44, borderRadius: 10,
                border: '1px solid rgba(36,28,21,0.14)', background: 'transparent',
                color: CHARCOAL, fontSize: 14, cursor: 'pointer',
              }}
            >
              {open === c.id ? '收起紀錄' : `查看紀錄（${c.entries.length} 筆）`}
            </button>

            {open === c.id && (
              <div style={{ marginTop: 12, borderTop: '1px solid rgba(36,28,21,0.08)', paddingTop: 12 }}>
                {c.entries.length === 0 && <p style={{ fontSize: 13, color: 'rgba(36,28,21,0.5)' }}>還沒有異動紀錄</p>}
                {c.entries.map((e, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: i < c.entries.length - 1 ? '1px solid rgba(36,28,21,0.05)' : 'none' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: CHARCOAL }}>
                        {TYPE_LABEL[e.type] ?? e.type}
                        {e.serviceName ? `・${e.serviceName}` : ''}
                      </p>
                      <p style={{ fontSize: 11, color: 'rgba(36,28,21,0.5)' }}>
                        {new Date(e.createdAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', dateStyle: 'short', timeStyle: 'short' })}
                        {e.memo ? `・${e.memo}` : ''}
                      </p>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, flexShrink: 0, color: e.delta >= 0 ? '#3d7a5a' : CHARCOAL }}>
                      {e.deltaText}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* 講清楚錢在誰手上——這是我們刻意不碰金流的直接結果，也是爭議時的立場 */}
        {cards.length > 0 && (
          <p style={{ fontSize: 11, color: 'rgba(36,28,21,0.45)', lineHeight: 1.7, marginTop: 8 }}>
            此餘額由店家保管並提供服務，MooLah 僅負責記錄，不經手款項。
            若數字有疑問，請直接與店家確認。
          </p>
        )}
      </div>
    </div>
  )
}
