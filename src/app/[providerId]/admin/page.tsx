'use client'
import { useEffect, useState, useCallback } from 'react'
import CopyableUrl from '@/components/CopyableUrl'
import { taipeiDate } from '@/lib/slots'
import { copyText } from '@/lib/clipboard'
import { useParams, useSearchParams } from 'next/navigation'
import liff from '@line/liff'
import { authHeader } from '@/lib/clientAuth'
import MoolahLoader from '@/components/MoolahLoader'
import ScheduleView from './ScheduleView'
import { TRIAL_BOOKING_LIMIT } from '@/lib/plan'
import PortfolioView from './PortfolioView'
import { ProviderThemeShell } from '@/components/ProviderThemeShell'
import { ThemePickerPanel } from '@/components/ThemePickerPanel'
import {
  DEFAULT_PROVIDER_THEME,
  normalizeProviderTheme,
  type ProviderThemeKey,
} from '@/lib/providerTheme'

// ─── Types ────────────────────────────────────────────────────────────────────
type Booking = {
  id: string
  serviceId: string
  serviceName: string
  servicePrice: number
  customerName: string
  customerLineUserId: string
  customerPhone?: string
  date: string
  time: string
  note: string
  gender: string
  hairLength: string
  status: string
}
type Service = { id: string; name: string; price: number; duration: number; description: string }
type WaitlistEntry = { id: string; date: string; time: string; customerName: string; customerLineUserId: string; customerPhone: string; addedAt: string }
type MainView = 'bookings' | 'services' | 'schedule' | 'portfolio' | 'theme' | 'waitlist'
type BookingTab = 'timeline' | 'today' | 'upcoming' | 'past'

const TAGS = [
  { label: 'VIP', bg: 'rgba(201,169,110,0.18)', color: '#8a6030', border: 'rgba(201,169,110,0.4)' },
  { label: '首訪', bg: 'rgba(0,149,246,0.1)', color: '#0070c0', border: 'rgba(0,149,246,0.3)' },
  { label: '常客', bg: 'rgba(34,180,100,0.1)', color: '#1a8a50', border: 'rgba(34,180,100,0.3)' },
  { label: '高風險', bg: 'rgba(200,60,60,0.1)', color: '#b03030', border: 'rgba(200,60,60,0.3)' },
]

// ⚠️ 用台北時區：toISOString() 是 UTC，台灣凌晨 0–8 點會算成昨天，
// 「今日預約」會顯示昨天的（2026-08-08 掃描發現）
const todayStr = () => taipeiDate(0)

// ─── Shared style tokens ──────────────────────────────────────────────────────
const oak = 'var(--theme-accent)'
const charcoal = '#2C2825'
const cream = 'var(--theme-background)'
const cardBg = 'rgba(var(--theme-background-rgb-legacy),0.9)'
const border = 'rgba(var(--theme-accent-rgb-legacy),0.15)'
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(var(--theme-accent-rgb-legacy),0.06)',
  border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.18)', borderRadius: '12px',
  padding: '12px 14px', fontSize: 'calc(14px * var(--fs, 1))', color: charcoal,
  outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  fontSize: 'calc(12px * var(--fs, 1))', fontWeight: 600, color: 'rgba(44,40,37,0.88)',
  display: 'block', marginBottom: '8px',
}

// ─── 儲值卡／次卡（S3）────────────────────────────────────────────────────────
// ⚠️ MooLah 不經手任何金錢：錢是職人在線下自己收的，這裡只記帳。
//    法規依據與「為什麼不能做成平台錢包」見 src/lib/credits.ts 檔頭。
type CreditEntry = { id: number; type: string; delta: number; memo: string | null; serviceName: string | null; reversalOf: number | null; createdAt: string }
type CreditCardRow = {
  id: number; kind: 'amount' | 'count'; title: string; status: string
  expiresOn: string | null; refundTerms: string | null; balance: number; balanceText: string
  expired: boolean; needsGuarantee: boolean; entries: CreditEntry[]
}
const ENTRY_LABEL: Record<string, string> = { topup: '儲值', redeem: '扣款', reverse: '更正', adjust: '調整', refund: '退款', expire: '到期' }

function CreditsPanel({ providerId, customerLineUserId, customerPhone, customerName, serviceName }: {
  providerId: string; customerLineUserId: string; customerPhone: string; customerName: string; serviceName?: string
}) {
  const [cards, setCards] = useState<CreditCardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [openCard, setOpenCard] = useState<number | null>(null)
  const [act, setAct] = useState<{ id: number; mode: 'topup' | 'redeem' } | null>(null)
  const [actValue, setActValue] = useState('')

  // 建卡表單
  const [f, setF] = useState({ kind: 'amount' as 'amount' | 'count', title: '', initial: '', paid: '', bonus: '', expiresOn: '', refundTerms: '', agreed: false })

  const lineId = customerLineUserId === 'MANUAL' ? '' : customerLineUserId
  const q = `providerId=${providerId}&customerLineUserId=${encodeURIComponent(lineId)}&customerPhone=${encodeURIComponent(customerPhone ?? '')}`

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/credits?${q}`, { headers: authHeader() })
      if (!res.ok) throw new Error()
      const d = await res.json()
      setCards(d.cards ?? [])
    } catch { setErr('載入儲值資料失敗') } finally { setLoading(false) }
  }, [q])

  useEffect(() => { reload() }, [reload])

  async function post(body: Record<string, unknown>) {
    setBusy(true); setErr(''); setWarnings([])
    try {
      const res = await fetch('/api/admin/credits', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ providerId, ...body }),
      })
      const d = await res.json()
      // 失敗一定要說出來——這裡動的是錢，靜默失敗會讓職人以為扣了、客人以為沒扣
      if (!res.ok) { setErr(d.error ?? '操作失敗'); return false }
      if (d.warnings?.length) setWarnings(d.warnings)
      await reload()
      return true
    } catch { setErr('操作失敗，請再試一次'); return false } finally { setBusy(false) }
  }

  async function doCreate() {
    if (!f.title.trim()) { setErr('請填卡片名稱'); return }
    const ok = await post({
      action: 'create', kind: f.kind, title: f.title.trim(),
      customerLineUserId: lineId, customerPhone, customerName,
      initialDelta: Number(f.initial || 0), paid: Number(f.paid || 0), bonus: Number(f.bonus || 0),
      expiresOn: f.expiresOn || null, refundTerms: f.refundTerms || null, agreed: f.agreed,
    })
    if (ok) { setCreating(false); setF({ kind: 'amount', title: '', initial: '', paid: '', bonus: '', expiresOn: '', refundTerms: '', agreed: false }) }
  }

  async function doAct() {
    if (!act) return
    const v = Number(actValue)
    if (!(v > 0)) { setErr('金額／次數必須大於 0'); return }
    const ok = act.mode === 'topup'
      ? await post({ action: 'topup', creditId: act.id, delta: v, paid: v })
      : await post({ action: 'redeem', creditId: act.id, amount: v, serviceName })
    if (ok) { setAct(null); setActValue('') }
  }

  const inputS: React.CSSProperties = {
    width: '100%', background: 'rgba(var(--theme-accent-rgb-legacy),0.06)', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.18)',
    borderRadius: '10px', padding: '9px 12px', fontSize: 'calc(13px * var(--fs, 1))', color: charcoal, outline: 'none', boxSizing: 'border-box',
  }

  return (
    // 整區給一個沙色底＋左側橡木條，把「儲值」從一長串同色區塊裡拉出來（職人反應這塊沒抓到眼睛）
    <div style={{ marginBottom: '18px', background: 'rgba(var(--theme-accent-rgb-legacy),0.10)', borderLeft: `3px solid ${oak}`, borderRadius: '4px 14px 14px 4px', padding: '14px 14px 16px' }}>
      <p style={{ fontSize: 'calc(12.5px * var(--fs, 1))', color: charcoal, fontWeight: 700, marginBottom: '10px', letterSpacing: '0.02em' }}>儲值卡 / 次卡</p>

      {err && <div onClick={() => setErr('')} style={{ background: 'rgba(176,64,64,0.1)', border: '1px solid rgba(176,64,64,0.3)', color: '#b04040', fontSize: 'calc(12px * var(--fs, 1))', padding: '9px 12px', borderRadius: '10px', marginBottom: '10px', cursor: 'pointer' }}>{err}（點此關閉）</div>}
      {warnings.map((w, i) => (
        <div key={i} style={{ background: 'rgba(var(--theme-accent-rgb-legacy),0.12)', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.3)', color: '#7a5c2e', fontSize: 'calc(11px * var(--fs, 1))', lineHeight: 1.6, padding: '9px 12px', borderRadius: '10px', marginBottom: '8px' }}>⚠️ {w}</div>
      ))}

      {loading && <p style={{ fontSize: 'calc(12px * var(--fs, 1))', color: '#7d736b' }}>載入中…</p>}

      {/* 卡片刻意用白底＋較重的邊框：原本 rgba(var(--theme-accent-rgb-legacy),0.07) 疊在 cream 上幾乎看不出邊界，
          職人反應「這一塊是重點但沒抓到眼睛」。餘額也從 oak 改成 charcoal，對比才夠。 */}
      {!loading && cards.map(c => (
        <div key={c.id} style={{ background: '#ffffff', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.42)', boxShadow: '0 2px 10px rgba(44,40,37,0.06)', borderRadius: '14px', padding: '14px', marginBottom: '10px', opacity: c.expired || c.status === 'closed' ? 0.6 : 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 'calc(13.5px * var(--fs, 1))', fontWeight: 700, color: charcoal, wordBreak: 'break-word' }}>{c.title}</p>
              <p style={{ fontSize: 'calc(10.5px * var(--fs, 1))', color: '#574e48', marginTop: '2px' }}>
                {c.expired ? '已過期' : c.status === 'closed' ? '已結清' : c.expiresOn ? `到期 ${c.expiresOn}` : '無期限'}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'calc(23px * var(--fs, 1))', fontWeight: 600, color: charcoal, lineHeight: 1.1 }}>{c.balanceText}</p>
              <p style={{ fontSize: 'calc(9.5px * var(--fs, 1))', color: '#7d736b', marginTop: '1px' }}>目前餘額</p>
            </div>
          </div>

          {c.needsGuarantee && (
            <p style={{ fontSize: 'calc(10px * var(--fs, 1))', color: '#7a5c2e', marginTop: '6px', lineHeight: 1.5 }}>
              ⚠️ 未使用餘額逾 NT$50,000，依《美容定型化契約》超過部分應提供履約保障
            </p>
          )}

          {/* 扣款＝主要動作，用深橡木色（var(--theme-accent-strong)）而不是純黑：黑在這片暖色系裡太衝突 */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
            <button onClick={() => { setAct({ id: c.id, mode: 'topup' }); setActValue('') }} style={{ flex: 1, minHeight: '44px', borderRadius: '10px', border: '1.5px solid rgba(138,111,79,0.55)', background: 'transparent', color: 'var(--theme-accent-strong)', fontSize: 'calc(12.5px * var(--fs, 1))', fontWeight: 600, cursor: 'pointer' }}>＋ 儲值</button>
            <button onClick={() => { setAct({ id: c.id, mode: 'redeem' }); setActValue('') }} style={{ flex: 1, minHeight: '44px', borderRadius: '10px', border: 'none', background: 'var(--theme-accent-strong)', color: '#fff', fontSize: 'calc(12.5px * var(--fs, 1))', fontWeight: 700, cursor: 'pointer' }}>− 扣款</button>
            <button onClick={() => setOpenCard(openCard === c.id ? null : c.id)} style={{ minWidth: '52px', minHeight: '44px', borderRadius: '10px', border: '1.5px solid rgba(138,111,79,0.32)', background: 'transparent', color: '#4e453f', fontSize: 'calc(12.5px * var(--fs, 1))', cursor: 'pointer' }}>{openCard === c.id ? '收起' : '紀錄'}</button>
          </div>

          {act?.id === c.id && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              <input autoFocus type="number" inputMode="numeric" value={actValue} onChange={e => setActValue(e.target.value)}
                placeholder={act.mode === 'topup' ? (c.kind === 'count' ? '增加次數' : '儲值金額') : (c.kind === 'count' ? '扣除次數' : '扣款金額')}
                style={{ ...inputS, flex: 1 }} />
              <button onClick={doAct} disabled={busy} style={{ minWidth: '64px', minHeight: '40px', borderRadius: '10px', border: 'none', background: charcoal, color: '#fff', fontSize: 'calc(12px * var(--fs, 1))', cursor: 'pointer' }}>{busy ? '…' : '確認'}</button>
              <button onClick={() => setAct(null)} style={{ minWidth: '44px', minHeight: '40px', borderRadius: '10px', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.2)', background: 'transparent', color: '#574e48', fontSize: 'calc(12px * var(--fs, 1))', cursor: 'pointer' }}>取消</button>
            </div>
          )}

          {openCard === c.id && (
            <div style={{ marginTop: '10px', borderTop: '1px solid rgba(var(--theme-accent-rgb-legacy),0.15)', paddingTop: '8px' }}>
              {c.entries.length === 0 && <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: '#7d736b' }}>還沒有異動</p>}
              {c.entries.map(e => {
                const reversed = c.entries.some(x => x.reversalOf === e.id)
                return (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: charcoal, textDecoration: reversed ? 'line-through' : 'none' }}>
                        {ENTRY_LABEL[e.type] ?? e.type}{e.serviceName ? `・${e.serviceName}` : ''}{e.memo ? `・${e.memo}` : ''}
                      </p>
                      <p style={{ fontSize: 'calc(9px * var(--fs, 1))', color: '#7d736b' }}>{(e.createdAt || '').slice(0, 16).replace('T', ' ')}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ fontSize: 'calc(12px * var(--fs, 1))', fontWeight: 600, color: e.delta >= 0 ? '#3d7a5a' : charcoal }}>{e.delta >= 0 ? '+' : '−'}{Math.abs(e.delta)}</span>
                      {/* 更正只能靠沖正（DB trigger 禁止改／刪紀錄）→ 原紀錄永遠留著可追溯 */}
                      {!reversed && e.type !== 'reverse' && (
                        <button onClick={() => post({ action: 'reverse', creditId: c.id, ledgerId: e.id })} disabled={busy}
                          style={{ fontSize: 'calc(10px * var(--fs, 1))', color: '#b04040', background: 'none', border: '1px solid rgba(176,64,64,0.25)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer' }}>沖正</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}

      {!loading && !creating && (
        <button onClick={() => setCreating(true)} style={{ width: '100%', minHeight: '44px', borderRadius: '12px', border: '1px dashed rgba(var(--theme-accent-rgb-legacy),0.4)', background: 'transparent', color: oak, fontSize: 'calc(13px * var(--fs, 1))', cursor: 'pointer' }}>
          ＋ 建立{cards.length ? '另一張' : ''}儲值卡／次卡
        </button>
      )}

      {creating && (
        // 建卡表單也改白底：現在整區已經是沙色，半透明沙疊沙會糊成一片
        <div style={{ background: '#ffffff', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.42)', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['amount', 'count'] as const).map(k => (
              <button key={k} onClick={() => setF({ ...f, kind: k })} style={{
                flex: 1, minHeight: '40px', borderRadius: '10px', fontSize: 'calc(12px * var(--fs, 1))', cursor: 'pointer',
                background: f.kind === k ? oak : 'transparent', color: f.kind === k ? '#fff' : '#574e48',
                border: `1px solid ${f.kind === k ? oak : 'rgba(var(--theme-accent-rgb-legacy),0.25)'}`,
              }}>{k === 'amount' ? '儲值金' : '次卡'}</button>
            ))}
          </div>
          <input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder={f.kind === 'amount' ? '卡名（如：儲值金）' : '卡名（如：洗剪護 10 次卡）'} style={inputS} />
          <div style={{ display: 'flex', gap: '6px' }}>
            <input type="number" inputMode="numeric" value={f.initial} onChange={e => setF({ ...f, initial: e.target.value, paid: f.kind === 'amount' && !f.paid ? e.target.value : f.paid })} placeholder={f.kind === 'amount' ? '入帳金額' : '總次數'} style={{ ...inputS, flex: 1 }} />
            {f.kind === 'amount' && <input type="number" inputMode="numeric" value={f.paid} onChange={e => setF({ ...f, paid: e.target.value })} placeholder="客人實付" style={{ ...inputS, flex: 1 }} />}
            {f.kind === 'amount' && <input type="number" inputMode="numeric" value={f.bonus} onChange={e => setF({ ...f, bonus: e.target.value })} placeholder="贈送" style={{ ...inputS, flex: 1 }} />}
          </div>
          {/* 下面兩欄是《美容定型化契約應記載及不得記載事項》要求的，不是我們自己想加的 */}
          <input type="date" value={f.expiresOn} onChange={e => setF({ ...f, expiresOn: e.target.value })} style={inputS} />
          <input value={f.refundTerms} onChange={e => setF({ ...f, refundTerms: e.target.value })} placeholder="退費規則（依規定消費者可隨時終止並退費，手續費上限 10%）" style={inputS} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'calc(11px * var(--fs, 1))', color: '#574e48', minHeight: '40px', cursor: 'pointer' }}>
            <input type="checkbox" checked={f.agreed} onChange={e => setF({ ...f, agreed: e.target.checked })} style={{ width: '18px', height: '18px' }} />
            已當面向客人說明期限與退費規則並取得同意（存證用）
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={doCreate} disabled={busy} style={{ flex: 1, minHeight: '44px', borderRadius: '12px', border: 'none', background: oak, color: '#fff', fontSize: 'calc(13px * var(--fs, 1))', fontWeight: 600, cursor: 'pointer' }}>{busy ? '建立中…' : '建立'}</button>
            <button onClick={() => { setCreating(false); setErr('') }} style={{ minWidth: '80px', minHeight: '44px', borderRadius: '12px', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.25)', background: 'transparent', color: '#574e48', fontSize: 'calc(13px * var(--fs, 1))', cursor: 'pointer' }}>取消</button>
          </div>
        </div>
      )}

      <p style={{ fontSize: 'calc(10px * var(--fs, 1))', color: '#7d736b', lineHeight: 1.6, marginTop: '8px' }}>
        錢請你自己在店裡收（現金／轉帳／刷卡機），MooLah 只負責記帳，不經手款項。每次異動都會自動通知客人。
      </p>
    </div>
  )
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

  // sheet 開著時鎖住背景捲動：否則手指在 sheet 邊緣滑會捲到後面那頁，
  // 關掉之後停在莫名其妙的位置，感覺像「卡住」。關閉時務必還原原值。
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    if (isManual) return
    fetch(`/api/admin/customer-note?providerId=${providerId}&customerLineUserId=${booking.customerLineUserId === 'MANUAL' ? '' : booking.customerLineUserId}&customerPhone=${encodeURIComponent(booking.customerPhone ?? '')}`, { headers: authHeader() })
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
    // optimistic 移除後若失敗必須還原，否則職人以為刪了、重整又出現
    const snapshot = karte
    setKarte(prev => prev.filter(k => k.id !== id))
    try {
      const res = await fetch('/api/admin/customer-history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ providerId, id }),
      })
      if (!res.ok) throw new Error('delete failed')
    } catch {
      setKarte(snapshot)
      setSheetError('刪除失敗，請再試一次')
    }
  }

  async function saveNote() {
    setNoteSaving(true); setSheetError('')
    try {
      const res = await fetch('/api/admin/customer-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ providerId, customerLineUserId: booking.customerLineUserId === 'MANUAL' ? '' : booking.customerLineUserId, customerPhone: booking.customerPhone ?? '', note: noteText, tags }),
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
    const prev = tags
    const next = tags.includes(label) ? tags.filter(t => t !== label) : [...tags, label]
    setTags(next)
    try {
      const res = await fetch('/api/admin/customer-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ providerId, customerLineUserId: booking.customerLineUserId === 'MANUAL' ? '' : booking.customerLineUserId, customerPhone: booking.customerPhone ?? '', tags: next }),
      })
      if (!res.ok) throw new Error('save failed')
    } catch {
      setTags(prev)                       // 標籤沒存到就還原，別讓畫面說謊
      setSheetError('標籤儲存失敗，請再試一次')
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(44,40,37,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}
    >
      {/*
        🐞 2026-08-11 修：這張 sheet 原本沒有高度上限也不能捲。
        外層是 position:fixed + align-items:flex-end，所以內容一旦比螢幕高，
        就會往「畫面上方」溢出到看不到的地方——關閉鍵剛好在最上面，於是整頁像被鎖死。
        加了儲值面板之後高度撐爆才浮現（Gini 實測回報）。
        解法三件：① 高度上限 + 自己可捲 ② 標題列 sticky（× 永遠按得到）③ 背景鎖捲。
      */}
      <div
        className="cust-sheet"
        style={{ width: '100%', maxWidth: '480px', margin: '0 auto', background: cream, borderRadius: '24px 24px 0 0', padding: '0 20px 44px', animation: 'slideUp 0.22s ease' }}
        onClick={e => e.stopPropagation()}
      >
        {/* sticky 標題列：捲到多下面都關得掉 */}
        <div style={{ position: 'sticky', top: 0, zIndex: 2, background: cream, paddingTop: '16px', margin: '0 -20px', padding: '16px 20px 0' }}>
          <div style={{ width: '40px', height: '4px', background: 'rgba(var(--theme-accent-rgb-legacy),0.25)', borderRadius: '2px', margin: '0 auto 16px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '12px', borderBottom: '1px solid rgba(var(--theme-accent-rgb-legacy),0.12)', marginBottom: '16px' }}>
            <div>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'calc(22px * var(--fs, 1))', fontWeight: 600, color: charcoal }}>
                {booking.customerName || '匿名顧客'}
              </p>
              {(booking.gender || booking.hairLength) && (
                <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: oak, marginTop: '3px' }}>
                  {[booking.gender, booking.hairLength].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            {/* tap target 拉到 44px，手機才好按 */}
            <button onClick={onClose} aria-label="關閉" style={{ minWidth: '44px', minHeight: '44px', fontSize: 'calc(22px * var(--fs, 1))', color: '#7d736b', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, marginTop: '-8px', marginRight: '-10px' }}>×</button>
          </div>
        </div>
        {sheetError && (
          <div onClick={() => setSheetError('')} style={{ background: 'rgba(176,64,64,0.1)', border: '1px solid rgba(176,64,64,0.3)', color: '#b04040', fontSize: 'calc(12px * var(--fs, 1))', padding: '10px 14px', borderRadius: '12px', marginBottom: '14px', textAlign: 'center', cursor: 'pointer' }}>
            {sheetError}　（點此關閉）
          </div>
        )}

        {!isManual && (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {[
                { label: '歷史訪問', value: `${history.filter(b => b.status !== 'no_show').length} 次` },
                { label: '累計消費', value: `NT$ ${totalSpend.toLocaleString()}` },
                ...(noShowCount > 0 ? [{ label: '爽約', value: `${noShowCount} 次`, red: true }] : []),
              ].map((item: { label: string; value: string; red?: boolean }) => (
                <div key={item.label} style={{ flex: 1, background: item.red ? 'rgba(200,60,60,0.07)' : 'rgba(var(--theme-accent-rgb-legacy),0.07)', borderRadius: '14px', padding: '12px 8px', textAlign: 'center' }}>
                  <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'calc(18px * var(--fs, 1))', fontWeight: 600, color: item.red ? '#b03030' : oak, lineHeight: 1 }}>{item.value}</p>
                  <p style={{ fontSize: 'calc(10px * var(--fs, 1))', color: item.red ? '#c05050' : '#574e48', marginTop: '4px', letterSpacing: '0.05em' }}>{item.label}</p>
                </div>
              ))}
            </div>
            {/* Tags */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: 'calc(12px * var(--fs, 1))', color: 'rgba(44,40,37,0.88)', fontWeight: 600, marginBottom: '8px' }}>顧客標籤</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {TAGS.map(tag => {
                  const active = tags.includes(tag.label)
                  return (
                    <button key={tag.label} onClick={() => toggleTag(tag.label)} style={{
                      padding: '5px 14px', borderRadius: '20px', fontSize: 'calc(12px * var(--fs, 1))', fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
                      background: active ? tag.bg : 'transparent',
                      color: active ? tag.color : '#7d736b',
                      border: `1px solid ${active ? tag.border : 'rgba(var(--theme-accent-rgb-legacy),0.18)'}`,
                    }}>{tag.label}</button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {!isManual && (
          <div style={{ marginBottom: '18px' }}>
            <p style={{ fontSize: 'calc(12px * var(--fs, 1))', color: 'rgba(44,40,37,0.88)', fontWeight: 600, marginBottom: '8px' }}>設計師筆記</p>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="記錄顧客偏好、過敏史、特殊需求…"
              rows={3}
              style={{
                width: '100%', background: 'rgba(var(--theme-accent-rgb-legacy),0.06)',
                border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.18)', borderRadius: '12px',
                padding: '10px 12px', fontSize: 'calc(13px * var(--fs, 1))', color: charcoal,
                resize: 'none', outline: 'none', boxSizing: 'border-box',
                lineHeight: 1.5,
              }}
            />
            <button
              onClick={saveNote}
              disabled={noteSaving}
              style={{
                marginTop: '8px', padding: '8px 20px', fontSize: 'calc(12px * var(--fs, 1))',
                background: noteSaved ? 'rgba(34,180,100,0.15)' : 'rgba(var(--theme-accent-rgb-legacy),0.12)',
                color: noteSaved ? '#22b464' : oak,
                border: `1px solid ${noteSaved ? 'rgba(34,180,100,0.25)' : 'rgba(var(--theme-accent-rgb-legacy),0.2)'}`,
                borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {noteSaved ? '已儲存 ✓' : noteSaving ? '儲存中…' : '儲存筆記'}
            </button>
          </div>
        )}

        {/* 儲值卡／次卡 — 手動建單的客人也要能用（老客人最常儲值），靠電話識別即可 */}
        <CreditsPanel
          providerId={providerId}
          customerLineUserId={booking.customerLineUserId}
          customerPhone={booking.customerPhone ?? ''}
          customerName={booking.customerName}
          serviceName={booking.serviceName}
        />

        {!isManual && (
          <div style={{ marginBottom: '18px' }}>
            <p style={{ fontSize: 'calc(12px * var(--fs, 1))', color: 'rgba(44,40,37,0.88)', fontWeight: 600, marginBottom: '8px' }}>作品歷史</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: karte.length ? '12px' : '0' }}>
              <input
                value={karteNote}
                onChange={e => setKarteNote(e.target.value)}
                placeholder="這次做的（如：8 度霧棕、法式手繪）"
                style={{ flex: 1, background: 'rgba(var(--theme-accent-rgb-legacy),0.06)', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.18)', borderRadius: '12px', padding: '9px 12px', fontSize: 'calc(12px * var(--fs, 1))', color: charcoal, outline: 'none', boxSizing: 'border-box' }}
              />
              <label style={{
                display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
                padding: '0 14px', fontSize: 'calc(12px * var(--fs, 1))', fontWeight: 600,
                background: karteUploading ? 'rgba(var(--theme-accent-rgb-legacy),0.3)' : oak, color: '#fff',
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
                      <div style={{ width: '96px', height: '96px', borderRadius: '12px', background: 'rgba(var(--theme-accent-rgb-legacy),0.08)' }} />
                    )}
                    <button onClick={() => deleteKarte(k.id)} style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(44,40,37,0.6)', color: '#fff', border: 'none', fontSize: 'calc(12px * var(--fs, 1))', lineHeight: '20px', cursor: 'pointer', padding: 0 }}>×</button>
                    {k.note && <p style={{ fontSize: 'calc(10px * var(--fs, 1))', color: '#4e453f', marginTop: '4px', lineHeight: 1.3 }}>{k.note}</p>}
                    <p style={{ fontSize: 'calc(9px * var(--fs, 1))', color: oak, marginTop: '2px' }}>{(k.createdAt || '').slice(0, 10)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p style={{ fontSize: 'calc(12px * var(--fs, 1))', color: 'rgba(44,40,37,0.88)', fontWeight: 600, marginBottom: '12px' }}>消費紀錄</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '35vh', overflowY: 'auto' }}>
          {history.map(b => (
            <div key={b.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 14px', borderRadius: '12px',
              background: b.id === booking.id ? 'rgba(var(--theme-accent-rgb-legacy),0.1)' : 'rgba(var(--theme-accent-rgb-legacy),0.04)',
              border: `1px solid ${b.id === booking.id ? 'rgba(var(--theme-accent-rgb-legacy),0.25)' : 'transparent'}`,
            }}>
              <div>
                <p style={{ fontSize: 'calc(13px * var(--fs, 1))', color: charcoal, fontWeight: b.id === booking.id ? 500 : 400 }}>{b.serviceName}</p>
                <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: '#4e453f', marginTop: '2px' }}>
                  {b.date} {b.time}
                  {b.id === booking.id && <span style={{ color: oak, marginLeft: '6px' }}>← 本次</span>}
                </p>
              </div>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'calc(16px * var(--fs, 1))', color: charcoal }}>
                NT$ {b.servicePrice.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
        /* 88vh 先保底，支援 dvh 的瀏覽器再覆蓋成 88dvh
           （手機 vh 算的是「網址列收起來」的高度，會比實際可視範圍大一點） */
        .cust-sheet {
          max-height: 88vh;
          max-height: 88dvh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;   /* 捲到底不要連背景一起帶著捲 */
        }
      `}</style>
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
      background: isNoShow ? 'rgba(200,60,60,0.04)' : isNext ? 'rgba(var(--theme-accent-rgb-legacy),0.12)' : 'rgba(255,255,255,0.82)',
      border: `1px solid ${isNoShow ? 'rgba(200,60,60,0.25)' : isNext ? 'rgba(var(--theme-accent-rgb-legacy),0.5)' : 'rgba(var(--theme-accent-rgb-legacy),0.28)'}`,
      borderRadius: compact ? '12px' : '16px',
      padding: compact ? '12px 16px' : '18px 20px',
      boxShadow: isNext ? '0 10px 30px rgba(26,23,20,0.11)' : compact ? '0 1px 8px rgba(26,23,20,0.05)' : '0 2px 16px rgba(26,23,20,0.08)',
      position: 'relative', overflow: 'hidden',
    }}>
      {isNext && !isNoShow && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, var(--oak), transparent)' }} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: compact ? '1.6rem' : '2rem', fontWeight: 300, color: charcoal, lineHeight: 1, letterSpacing: '-0.02em' }}>{booking.time}</p>
          <p style={{ fontSize: compact ? '11px' : '12px', color: oak, marginTop: '4px', letterSpacing: '0.04em', fontFamily: "var(--font-noto-serif-tc), 'Noto Serif TC', serif" }}>{booking.serviceName}</p>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', color: charcoal, fontWeight: 300 }}>
            NT$ {booking.servicePrice.toLocaleString()}
          </p>
          {isNext && !isNoShow && <span style={{ fontSize: 'calc(10px * var(--fs, 1))', color: 'white', background: 'var(--theme-accent-strong)', padding: '2px 9px', borderRadius: '20px', letterSpacing: '0.04em' }}>下一位{nextCountdown ? ` · ${nextCountdown}` : ''}</span>}
          {isNoShow && <span style={{ fontSize: 'calc(10px * var(--fs, 1))', color: '#b03030', background: 'rgba(200,60,60,0.12)', padding: '2px 8px', borderRadius: '20px' }}>爽約</span>}
          {isManual && !isNoShow && <span style={{ fontSize: 'calc(10px * var(--fs, 1))', color: oak, background: 'rgba(var(--theme-accent-rgb-legacy),0.1)', padding: '2px 8px', borderRadius: '20px' }}>私下預約</span>}
        </div>
      </div>

      <div style={{ height: '1px', background: isNext && !isNoShow ? 'rgba(var(--theme-accent-rgb-legacy),0.28)' : 'rgba(var(--theme-accent-rgb-legacy),0.12)', margin: '12px 0' }} />

      <button
        onClick={() => onViewCustomer(booking)}
        style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', background: 'none', border: 'none', padding: '0', cursor: 'pointer', width: '100%', textAlign: 'left' }}
      >
        <span style={{ fontSize: 'calc(12px * var(--fs, 1))', color: '#4a3f3a' }}>{booking.customerName || '匿名客戶'}</span>
        {booking.gender && <span style={{ fontSize: 'calc(11px * var(--fs, 1))', color: oak, background: 'rgba(var(--theme-accent-rgb-legacy),0.08)', padding: '2px 8px', borderRadius: '20px' }}>{booking.gender}</span>}
        {booking.hairLength && <span style={{ fontSize: 'calc(11px * var(--fs, 1))', color: oak, background: 'rgba(var(--theme-accent-rgb-legacy),0.08)', padding: '2px 8px', borderRadius: '20px' }}>{booking.hairLength}</span>}
        <span style={{ fontSize: 'calc(10px * var(--fs, 1))', color: 'var(--oak)', marginLeft: 'auto' }}>顧客紀錄 →</span>
      </button>

      {booking.note && <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: '#4e453f', marginTop: '8px', lineHeight: 1.6 }}>{booking.note}</p>}
      <p style={{ fontSize: 'calc(10px * var(--fs, 1))', color: 'rgba(44,40,37,0.4)', marginTop: '8px' }}>#{booking.id}</p>

      {!isNoShow && !showConfirm && !showNoShowConfirm && (
        <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowNoShowConfirm(true)} style={{ flex: 1, fontSize: 'calc(11px * var(--fs, 1))', color: '#a04030', border: '1px solid rgba(200,60,60,0.2)', borderRadius: '12px', padding: '13px', background: 'rgba(200,60,60,0.04)', cursor: 'pointer' }}>
            標記爽約
          </button>
          <button onClick={() => setShowConfirm(true)} style={{ flex: 1, fontSize: 'calc(11px * var(--fs, 1))', color: '#574e48', border: `1px solid ${border}`, borderRadius: '12px', padding: '13px', background: 'transparent', cursor: 'pointer' }}>
            取消預約
          </button>
        </div>
      )}
      {showNoShowConfirm && (
        <div style={{ marginTop: '14px', background: 'rgba(200,60,60,0.06)', border: '1px solid rgba(200,60,60,0.15)', borderRadius: '12px', padding: '14px' }}>
          <p style={{ fontSize: 'calc(12px * var(--fs, 1))', color: '#b04040', textAlign: 'center', marginBottom: '12px' }}>確認標記為爽約？此紀錄將保留在顧客歷史中。</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowNoShowConfirm(false)} style={{ flex: 1, fontSize: 'calc(12px * var(--fs, 1))', color: '#8a7e76', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.2)', borderRadius: '10px', padding: '13px', background: 'transparent', cursor: 'pointer' }}>返回</button>
            <button onClick={handleNoShow} disabled={markingNoShow} style={{ flex: 1, fontSize: 'calc(12px * var(--fs, 1))', color: '#fff', background: '#b04040', borderRadius: '10px', padding: '13px', border: 'none', cursor: 'pointer', opacity: markingNoShow ? 0.6 : 1 }}>
              {markingNoShow ? '處理中...' : '確認爽約'}
            </button>
          </div>
        </div>
      )}
      {showConfirm && (
        <div style={{ marginTop: '14px', background: 'rgba(180,60,60,0.06)', border: '1px solid rgba(180,60,60,0.15)', borderRadius: '12px', padding: '14px' }}>
          <p style={{ fontSize: 'calc(12px * var(--fs, 1))', color: '#b04040', textAlign: 'center', marginBottom: '12px' }}>
            確定取消？{!isManual && '系統將自動通知客戶。'}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowConfirm(false)} style={{ flex: 1, fontSize: 'calc(12px * var(--fs, 1))', color: '#8a7e76', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.2)', borderRadius: '10px', padding: '13px', background: 'transparent', cursor: 'pointer' }}>返回</button>
            <button onClick={handleCancel} disabled={cancelling} style={{ flex: 1, fontSize: 'calc(12px * var(--fs, 1))', color: '#fff', background: '#b04040', borderRadius: '10px', padding: '13px', border: 'none', cursor: 'pointer', opacity: cancelling ? 0.6 : 1 }}>
              {cancelling ? '取消中...' : '確認取消'}
            </button>
          </div>
        </div>
      )}
      {actionError && <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: '#b04040', textAlign: 'center', marginTop: '10px' }}>{actionError}</p>}
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
    setViewDate(d.toLocaleDateString('sv-SE'))
  }

  const now = new Date()
  const currentMin = now.getHours() * 60 + now.getMinutes()
  const showLine = viewDate === todayDate && currentMin >= START_HOUR * 60 && currentMin <= END_HOUR * 60
  const lineTop = (currentMin - START_HOUR * 60) * PX_PER_MIN

  return (
    <div>
      {/* Date navigator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '12px 16px 0', padding: '12px 8px', background: 'rgba(var(--theme-accent-rgb-legacy),0.08)', borderRadius: '16px' }}>
        <button onClick={() => shiftDay(-1)} style={{ background: 'none', border: 'none', fontSize: 'calc(22px * var(--fs, 1))', color: oak, cursor: 'pointer', padding: '0 12px', lineHeight: 1 }}>‹</button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'calc(17px * var(--fs, 1))', fontWeight: 600, color: charcoal }}>{dateLabel()}</p>
          <p style={{ fontSize: 'calc(10px * var(--fs, 1))', color: '#7d736b', marginTop: '2px' }}>{dayBookings.length > 0 ? `${dayBookings.length} 筆預約` : '尚無預約'}</p>
        </div>
        <button onClick={() => shiftDay(1)} style={{ background: 'none', border: 'none', fontSize: 'calc(22px * var(--fs, 1))', color: oak, cursor: 'pointer', padding: '0 12px', lineHeight: 1 }}>›</button>
      </div>

      {/* Timeline */}
      <div style={{ margin: '12px 16px 40px', display: 'flex', gap: '8px' }}>
        {/* Time labels */}
        <div style={{ width: '44px', flexShrink: 0 }}>
          {slots.map((t, i) => (
            <div key={t} style={{ height: `${SLOT_H}px`, display: 'flex', alignItems: 'flex-start', paddingTop: '3px' }}>
              {i % 2 === 0
                ? <span style={{ fontSize: 'calc(10px * var(--fs, 1))', color: '#7d736b', fontVariantNumeric: 'tabular-nums' }}>{t}</span>
                : <span style={{ fontSize: 'calc(9px * var(--fs, 1))', color: 'rgba(176,168,158,0.4)', paddingLeft: '6px' }}>·</span>
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
                ? '1px solid rgba(var(--theme-accent-rgb-legacy),0.18)'
                : '1px dashed rgba(var(--theme-accent-rgb-legacy),0.07)',
            }} />
          ))}

          {/* Current time line */}
          {showLine && (
            <div style={{ position: 'absolute', top: `${lineTop}px`, left: 0, right: 0, zIndex: 10, pointerEvents: 'none' }}>
              <div style={{ height: '2px', background: `linear-gradient(to right, ${oak}, rgba(var(--theme-accent-rgb-legacy),0.15))`, position: 'relative' }}>
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
                  boxShadow: '0 2px 8px rgba(var(--theme-accent-rgb-legacy),0.25)',
                }}
              >
                <p style={{ fontSize: 'calc(13px * var(--fs, 1))', fontWeight: 600, color: cream, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.customerName || '顧客'}
                </p>
                <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: 'rgba(251,249,244,0.78)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.serviceName}
                </p>
                {height >= 68 && (
                  <p style={{ fontSize: 'calc(10px * var(--fs, 1))', color: 'rgba(251,249,244,0.55)', marginTop: '3px' }}>
                    {b.time} · {dur} 分鐘
                  </p>
                )}
              </button>
            )
          })}

          {/* Empty state overlay */}
          {dayBookings.length === 0 && (
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, transform: 'translateY(-50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'calc(15px * var(--fs, 1))', color: '#d4ccc6' }}>今日無預約</p>
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
  const [error, setError] = useState('')
  const today = taipeiDate(0)
  const selectedService = services.find(s => s.id === serviceId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!serviceId || !date || !time) return
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/admin/manual-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ providerId, serviceId, customerName, date, time, note }),
    })
    setSubmitting(false)
    // 失敗一定要講出來 —— 舊版只處理 res.ok，撞到已被預約的時段時
    // 畫面完全沒反應，職人會以為建好了（實際上沒有）。
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.message || '建立失敗，請再試一次')
      return
    }
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
      border: '1.5px dashed rgba(var(--theme-accent-rgb-legacy),0.35)', borderRadius: '16px',
      padding: '16px', fontSize: 'calc(13px * var(--fs, 1))', color: oak,
      background: 'transparent', cursor: 'pointer',
    }}>
      <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '16px', height: '16px' }}>
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
      </svg>
      新增私下預約
    </button>
  )

  return (
    <div style={{ background: cardBg, backdropFilter: 'blur(12px)', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.2)', borderRadius: '16px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <p style={{ fontSize: 'calc(14px * var(--fs, 1))', fontWeight: 600, color: charcoal }}>新增私下預約</p>
        <button onClick={() => setOpen(false)} style={{ color: '#7d736b', fontSize: 'calc(18px * var(--fs, 1))', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
      </div>
      {done ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'calc(28px * var(--fs, 1))', color: oak, marginBottom: '8px' }}>✓</p>
          <p style={{ fontSize: 'calc(13px * var(--fs, 1))', color: '#8a7e76' }}>已成功新增！</p>
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
              <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: oak, marginTop: '6px', paddingLeft: '4px' }}>
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
          {error && (
            <div onClick={() => setError('')} style={{
              padding: '11px 14px', borderRadius: '12px', cursor: 'pointer',
              background: 'rgba(176,64,64,0.1)', border: '1px solid rgba(176,64,64,0.3)',
              color: '#b04040', fontSize: 'calc(12.5px * var(--fs, 1))', lineHeight: 1.5, textAlign: 'center',
            }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={!serviceId || !date || !time || submitting} style={{
            background: !serviceId || !date || !time || submitting ? 'rgba(var(--theme-accent-rgb-legacy),0.4)' : oak,
            color: cream, borderRadius: '50px', padding: '14px',
            fontSize: 'calc(14px * var(--fs, 1))', fontWeight: 500, border: 'none', cursor: 'pointer',
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
  const [saveError, setSaveError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !price || !duration) return
    setSubmitting(true)
    setSaveError('')
    try {
      // 必須檢查 res.ok：否則儲存失敗仍會顯示「完成」，職人以為改好了但價格沒進 DB
      const res = await fetch('/api/admin/service', {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          providerId,
          ...(isNew ? {} : { serviceId: service!.id }),
          name, price: Number(price), duration: Number(duration), description,
        }),
      })
      if (!res.ok) throw new Error('save failed')
      setDone(true)
      setTimeout(() => { onSuccess(); onClose() }, 1200)
    } catch {
      setSaveError('儲存失敗，請確認網路後再試一次')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ background: cardBg, backdropFilter: 'blur(12px)', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.2)', borderRadius: '16px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <p style={{ fontSize: 'calc(14px * var(--fs, 1))', fontWeight: 600, color: charcoal }}>{isNew ? '新增服務項目' : '編輯服務項目'}</p>
        <button onClick={onClose} style={{ color: '#7d736b', fontSize: 'calc(18px * var(--fs, 1))', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
      </div>
      {done ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'calc(28px * var(--fs, 1))', color: oak, marginBottom: '8px' }}>✓</p>
          <p style={{ fontSize: 'calc(13px * var(--fs, 1))', color: '#8a7e76' }}>{isNew ? '已新增！' : '已更新！'}</p>
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
          {saveError && (
            <p style={{ fontSize: 'calc(12px * var(--fs, 1))', color: '#c88f8f', marginBottom: '10px', textAlign: 'center' }}>{saveError}</p>
          )}
          <button type="submit" disabled={!name || !price || !duration || submitting} style={{
            background: !name || !price || !duration || submitting ? 'rgba(var(--theme-accent-rgb-legacy),0.4)' : oak,
            color: cream, borderRadius: '50px', padding: '14px',
            fontSize: 'calc(14px * var(--fs, 1))', fontWeight: 500, border: 'none', cursor: 'pointer',
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
    // 刪除失敗卻照樣關掉確認框 = 職人以為刪了，客人還約得到（2026-08-08 掃描發現）
    const res = await fetch('/api/admin/service', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ serviceId: service.id, providerId }),
    })
    setDeleting(false)
    if (!res.ok) { alert('刪除失敗，這個服務還在，請再試一次'); return }
    onRefresh()
  }

  if (editing) {
    return <ServiceForm service={service} providerId={providerId} onSuccess={onRefresh} onClose={() => setEditing(false)} />
  }

  return (
    <div style={{ background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${border}`, borderRadius: '16px', padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
          <p style={{ fontSize: 'calc(15px * var(--fs, 1))', fontWeight: 500, color: charcoal }}>{service.name}</p>
          <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: '#a09890', marginTop: '4px' }}>
            {service.duration} 分鐘{service.description ? ` · ${service.description}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'calc(18px * var(--fs, 1))', color: charcoal }}>
            NT$ {service.price.toLocaleString()}
          </p>
          <button onClick={() => setEditing(true)} aria-label="編輯服務" style={{ width: '44px', height: '44px', background: 'rgba(var(--theme-accent-rgb-legacy),0.1)', border: 'none', borderRadius: '10px', cursor: 'pointer', color: oak, display: 'grid', placeItems: 'center' }}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '14px', height: '14px' }}>
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        </div>
      </div>
      {confirmDelete ? (
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
          <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, fontSize: 'calc(12px * var(--fs, 1))', color: '#8a7e76', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.2)', borderRadius: '10px', minHeight: '44px', background: 'transparent', cursor: 'pointer' }}>取消</button>
          <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, fontSize: 'calc(12px * var(--fs, 1))', color: '#fff', background: '#b04040', borderRadius: '10px', minHeight: '44px', border: 'none', cursor: 'pointer' }}>
            {deleting ? '刪除中...' : '確認刪除'}
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirmDelete(true)} style={{ marginTop: '4px', fontSize: 'calc(11px * var(--fs, 1))', color: '#c0b4ac', background: 'none', border: 'none', cursor: 'pointer', padding: '0 6px', minHeight: '40px', display: 'inline-flex', alignItems: 'center' }}>刪除此服務</button>
      )}
    </div>
  )
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
// 首次使用引導：偵測到還沒設定服務時顯示，3 步驟帶新設計師上手
function FirstRunChecklist({ providerId, onGoServices, onGoSchedule }: { providerId: string; onGoServices: () => void; onGoSchedule: () => void }) {
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  // 消費者旅程：分享/複製的連結一律指向職人首頁（作品集+介紹）→ 客人再點「開始預約」進 book（Gini 2026-07-19 定案）
  const bookUrl = typeof window !== 'undefined' ? `${window.location.origin}/${providerId}` : ''
  const share = async () => {
    // copyText 有 execCommand fallback；LINE/IG 的 webview 常常沒有 navigator.clipboard，
    // 舊寫法是 catch {} 靜默失敗卻照樣顯示「已複製」（2026-08-08 掃描發現）
    const ok = await copyText(bookUrl)
    if (!ok) { setCopyFailed(true); return }
    setCopyFailed(false)
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }
  const steps = [
    { n: 1, title: '設定你的服務與價格', desc: '客人才能選擇要預約的項目', action: onGoServices, label: '去設定' },
    { n: 2, title: '設定營業時間與休假', desc: '決定哪些時段可以被預約', action: onGoSchedule, label: '去設定' },
    { n: 3, title: '分享你的預約連結', desc: '貼到 IG / LINE，客人自己線上約', action: share, label: copied ? '✓ 已複製' : '複製連結' },
  ]
  return (
    <div data-animate style={{ margin: '16px 16px 0', padding: '18px 18px 10px', background: 'linear-gradient(135deg, rgba(var(--theme-accent-rgb-legacy),0.12), rgba(var(--theme-accent-rgb-legacy),0.03))', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.3)', borderRadius: '18px' }}>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'calc(19px * var(--fs, 1))', color: charcoal }}>歡迎使用 MooLah ✨</p>
      <p style={{ fontSize: 'calc(11.5px * var(--fs, 1))', color: 'rgba(44,40,37,0.55)', marginTop: '2px', marginBottom: '6px', lineHeight: 1.5 }}>3 步驟開始線上接單：</p>
      {steps.map(s => (
        <div key={s.n} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '11px 0', borderTop: '1px solid rgba(var(--theme-accent-rgb-legacy),0.14)' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: oak, color: cream, fontSize: 'calc(12px * var(--fs, 1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 'calc(13px * var(--fs, 1))', color: charcoal, fontWeight: 600 }}>{s.title}</p>
            <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: 'rgba(44,40,37,0.5)', marginTop: '2px', lineHeight: 1.5 }}>{s.desc}</p>
          </div>
          <button onClick={s.action} style={{ fontSize: 'calc(11.5px * var(--fs, 1))', color: oak, background: 'rgba(var(--theme-accent-rgb-legacy),0.12)', border: `1px solid ${oak}`, borderRadius: '14px', padding: '11px 15px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{s.label}</button>
        </div>
      ))}
          {copyFailed && <CopyableUrl url={bookUrl} />}
    </div>
  )
}

// 空狀態 → 招客 CTA（不留白；把空白變成分享預約連結的入口）
function EmptyBookings({ tab, providerId }: { tab: BookingTab; providerId: string }) {
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  // 消費者旅程：分享/複製的連結一律指向職人首頁（作品集+介紹）→ 客人再點「開始預約」進 book（Gini 2026-07-19 定案）
  const bookUrl = typeof window !== 'undefined' ? `${window.location.origin}/${providerId}` : ''
  const title = tab === 'today' ? '今天還沒有預約 🌿' : tab === 'upcoming' ? '目前沒有待服務的預約 🌿' : '沒有過去記錄'
  const showCta = tab !== 'past'
  const copy = async () => {
    // copyText 有 execCommand fallback；LINE/IG 的 webview 常常沒有 navigator.clipboard，
    // 舊寫法是 catch {} 靜默失敗卻照樣顯示「已複製」（2026-08-08 掃描發現）
    const ok = await copyText(bookUrl)
    if (!ok) { setCopyFailed(true); return }
    setCopyFailed(false)
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }
  const shareLine = () => {
    const url = `https://line.me/R/msg/text/?${encodeURIComponent(`幫我線上預約 → ${bookUrl}`)}`
    // ⚠️ external 必須是 false：設計師是在 LINE webview 內開後台，
    // external:true 會先跳外部瀏覽器 → 撞上 LINE 的英文中間頁 → 再繞回 LINE，
    // 多一跳而且常常失敗（同 2026-08-08「加 LINE」那個 bug 的成因）。
    // external:false 直接在 LINE 內開分享選單。
    try { liff.openWindow({ url, external: false }) } catch { window.open(url, '_blank') }
  }
  return (
    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'calc(17px * var(--fs, 1))', color: charcoal }}>{title}</p>
      {showCta && (
        <>
          <p style={{ fontSize: 'calc(12px * var(--fs, 1))', color: 'rgba(44,40,37,0.5)', marginTop: '10px', lineHeight: 1.7 }}>
            把你的預約連結分享出去，<br />讓客人自己線上預約 ✨
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '18px', flexWrap: 'wrap' }}>
            <button onClick={copy} style={{ padding: '12px 18px', borderRadius: '20px', fontSize: 'calc(12.5px * var(--fs, 1))', cursor: 'pointer', background: copied ? oak : 'transparent', color: copied ? cream : oak, border: `1px solid ${oak}`, transition: 'all 0.18s' }}>
              {copied ? '✓ 已複製' : '📋 複製預約連結'}
            </button>
            <button onClick={shareLine} style={{ padding: '12px 18px', borderRadius: '20px', fontSize: 'calc(12.5px * var(--fs, 1))', cursor: 'pointer', background: '#06C755', color: '#fff', border: '1px solid #06C755' }}>
              分享到 LINE
            </button>
          </div>
          {copyFailed && <CopyableUrl url={bookUrl} />}
        </>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { providerId } = useParams<{ providerId: string }>()
  const searchParams = useSearchParams()
  const previewTheme = searchParams.get('previewTheme')
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
  const [providerTheme, setProviderTheme] = useState<ProviderThemeKey>(DEFAULT_PROVIDER_THEME)
  const [draftTheme, setDraftTheme] = useState<ProviderThemeKey>(DEFAULT_PROVIDER_THEME)
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

  // ── 字級（標準 / 大 / 特大）──────────────────────────────
  // 存 localStorage：職人設一次就好，下次開後台自動沿用。
  // 只動 --fs 這一個 CSS 變數，全頁 calc(Npx * var(--fs)) 一起等比放大。
  const FS_STEPS = [1, 1.18, 1.36]
  const [fsIdx, setFsIdx] = useState(0)
  useEffect(() => {
    const saved = Number(localStorage.getItem('moolah_admin_fs') ?? '0')
    const i = Number.isInteger(saved) && saved >= 0 && saved < FS_STEPS.length ? saved : 0
    setFsIdx(i)
    document.documentElement.style.setProperty('--fs', String(FS_STEPS[i]))
    // 離開後台要還原，否則其他頁面（職人頁 / 預約頁）會被一起放大
    return () => { document.documentElement.style.removeProperty('--fs') }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  function setFontScale(i: number) {
    setFsIdx(i)
    localStorage.setItem('moolah_admin_fs', String(i))
    document.documentElement.style.setProperty('--fs', String(FS_STEPS[i]))
  }

  // 頂部功能列（⋯）開合
  const [menuOpen, setMenuOpen] = useState(false)

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
        setProviderTheme(normalizeProviderTheme(data.provider?.theme))
        setDraftTheme(normalizeProviderTheme(data.provider?.theme))
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
  const TRIAL_LIMIT = TRIAL_BOOKING_LIMIT
  const isTrial = plan === 'trial'
  const trialEndMs = trialEndsAt ? new Date(trialEndsAt).getTime() : 0
  const isExpired = plan === 'expired' || (isTrial && trialEndMs > 0 && Date.now() > trialEndMs)
  const trialDaysLeft = trialEndMs ? Math.max(0, Math.ceil((trialEndMs - Date.now()) / 86400000)) : 0
  // 🔴 trial 但沒有到期日（認領前 OB 先設好方案、或 claim 寫入失敗）→ 不能顯示「剩 0 天」，
  //    那會讓職人一進後台就以為試用已經用完。沒有日期就只說「試用中」。
  const trialDateKnown = trialEndMs > 0
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
  const themed = (content: React.ReactNode) => (
    <ProviderThemeShell theme={draftTheme} previewTheme={previewTheme} style={{ minHeight: '100svh' }}>
      {content}
    </ProviderThemeShell>
  )

  // ── Loading ──
  if (loading) return themed(<MoolahLoader label="載入後台中…" />)

  // ── Load error (網路/初始化失敗，可重試) ──
  if (loadError) return themed(
    <div style={{ display: 'flex', height: '100svh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '32px', background: cream, textAlign: 'center' }}>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'calc(20px * var(--fs, 1))', color: charcoal }}>後台載入失敗</p>
      <p style={{ fontSize: 'calc(13px * var(--fs, 1))', color: '#8a7e76', lineHeight: 1.6 }}>請確認網路連線後再試一次</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: '8px', padding: '11px 28px', borderRadius: '99px', background: oak, color: cream, border: 'none', fontSize: 'calc(14px * var(--fs, 1))', cursor: 'pointer' }}>
        重試
      </button>
    </div>
  )

  // ── Unauthorized ──
  if (authorized === false) return themed(
    <div style={{ display: 'flex', height: '100svh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '32px', background: cream, textAlign: 'center' }}>
      <div style={{ width: '56px', height: '56px', background: 'rgba(var(--theme-accent-rgb-legacy),0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke={oak} strokeWidth={1.5} style={{ width: '24px', height: '24px' }}>
          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <div>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'calc(20px * var(--fs, 1))', color: charcoal, marginBottom: '8px' }}>無訪問權限</p>
        <p style={{ fontSize: 'calc(13px * var(--fs, 1))', color: '#8a7e76', lineHeight: 1.6 }}>此頁面僅供已綁定的合作夥伴使用</p>
      </div>
    </div>
  )

  return themed(
    <main data-layout="provider-admin-light" data-admin-surface="light" style={{ minHeight: '100svh', background: 'var(--theme-background)', maxWidth: '480px', margin: '0 auto', boxShadow: '0 0 42px rgba(26,23,20,0.08)' }}>

      {/* ── Header ── */}
      {/* ⚠️ 這裡刻意「不」設 overflow:hidden：功能列的下拉選單會延伸到 header 下緣以外，
          設了就會被整個裁掉、按了像沒反應（2026-08-11 實機踩到）。
          內部的噪點層與頂部金線都是 inset/absolute 貼齊，本來就不會溢出，不需要裁切。
          zIndex 讓 header 疊在後面的統計卡之上，選單才不會被蓋住。 */}
      <div style={{ background: 'rgba(255,255,255,0.58)', padding: '42px 20px 20px', position: 'relative', zIndex: 20, borderBottom: '1px solid rgba(var(--theme-accent-rgb-legacy),0.15)', backdropFilter: 'blur(16px)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`, opacity: 0.6, pointerEvents: 'none' }} />
        {/* top oak accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, var(--oak), transparent)', opacity: 0.8 }} />
        {/* 右上：刷新（不整頁 reload）+ 預覽（消費者視角＝職人首頁起點）*/}
        <style>{`@keyframes adminSpin { to { transform: rotate(360deg) } }`}</style>
        {/*
          功能列（2026-08-11 收合）
          原本三顆藥丸並排在深色 header 上，佔掉標題空間、半透明底也顯得浮。
          收成一顆「☰ 選單」，刷新與預覽都在裡面。
          ⚠️ 有標籤文字不是多餘的：只放一個圖示時，職人會找不到刷新和預覽跑哪去了。
        */}
        <div style={{ position: 'absolute', top: '20px', right: '18px', zIndex: 5 }}>
          {/* ⚠️ 這顆按鈕「不能」做成近黑色：header 本身就是近黑，黑底黑鈕等於隱形
              （2026-08-11 第一版就是這樣，Gini 直接找不到刷新和預覽在哪）。
              深色底上要跳出來，靠的是亮色而不是更黑 → 用橡木色填底＋深色字。 */}
          <button onClick={() => setMenuOpen(v => !v)} aria-label="功能選單" aria-expanded={menuOpen}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: menuOpen ? 'rgba(var(--theme-accent-rgb-legacy),0.16)' : 'rgba(255,255,255,0.72)', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.24)', color: charcoal, minHeight: '44px', padding: '0 14px', borderRadius: '12px', cursor: 'pointer', fontSize: 'calc(12.5px * var(--fs, 1))', fontWeight: 700, letterSpacing: '0.04em', boxShadow: '0 4px 14px rgba(26,23,20,0.08)' }}>
            <span style={{ fontSize: 'calc(15px * var(--fs, 1))', lineHeight: 1, marginTop: '-3px' }}>☰</span>
            選單
          </button>

          {menuOpen && (
            <>
              {/* 點外面關閉：蓋一層透明遮罩比在 document 上掛 listener 單純且不會漏拆 */}
              <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: -1 }} />
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: '186px', background: 'var(--theme-background)', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.32)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 16px 40px rgba(26,23,20,0.18)' }}>
                {/* 字級：一列三段，直接看得到現在停在哪一級 */}
                <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(var(--theme-accent-rgb-legacy),0.18)' }}>
                  <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: 'rgba(44,40,37,0.58)', marginBottom: '8px' }}>字體大小</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['標準', '大', '特大'].map((label, i) => (
                      <button key={label} onClick={() => setFontScale(i)}
                        style={{ flex: 1, minHeight: '38px', borderRadius: '9px', cursor: 'pointer', fontSize: 'calc(12px * var(--fs, 1))', background: fsIdx === i ? 'var(--theme-accent-strong)' : 'transparent', color: fsIdx === i ? 'white' : 'rgba(44,40,37,0.8)', border: `1px solid ${fsIdx === i ? 'var(--theme-accent-strong)' : 'rgba(var(--theme-accent-rgb-legacy),0.3)'}`, fontWeight: fsIdx === i ? 700 : 400 }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={() => { setMenuOpen(false); refreshAll() }} disabled={refreshing}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', minHeight: '48px', padding: '0 16px', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(var(--theme-accent-rgb-legacy),0.18)', color: charcoal, fontSize: 'calc(13.5px * var(--fs, 1))', cursor: 'pointer', textAlign: 'left', opacity: refreshing ? 0.55 : 1 }}>
                  <span style={{ display: 'inline-block', color: 'var(--oak)', animation: refreshing ? 'adminSpin 0.8s linear infinite' : 'none' }}>↻</span>
                  {refreshing ? '更新中…' : '重新整理'}
                </button>

                <button onClick={() => { setMenuOpen(false); const url = `${window.location.origin}/${providerId}`; try { liff.openWindow({ url, external: false }) } catch { window.open(url, '_blank') } }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', minHeight: '48px', padding: '0 16px', background: 'transparent', border: 'none', color: charcoal, fontSize: 'calc(13.5px * var(--fs, 1))', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ color: 'var(--oak)' }}>👁</span> 預覽預約頁
                </button>
              </div>
            </>
          )}
        </div>
        <p style={{ fontSize: 'calc(12px * var(--fs, 1))', color: 'var(--oak)', marginBottom: '10px', letterSpacing: '0.04em' }}>管理後台</p>
        <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.8rem', fontWeight: 500, color: charcoal, lineHeight: 1.1, letterSpacing: '-0.01em' }}>{providerName}</h1>
        <div style={{ width: '28px', height: '1px', background: oak, marginTop: '14px', opacity: 0.5 }} />
      </div>

      {/* ── Stats 2×2 ── */}
      <div data-animate style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', margin: '16px 16px 0', background: 'rgba(255,255,255,0.7)', border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 28px rgba(26,23,20,0.06)' }}>
        {[
          { label: '今日預約', value: `${todayBookings.length}`, unit: '筆', shade: 'primary' as const },
          { label: '今日營收', value: todayRevenue === 0 ? '—' : todayRevenue.toLocaleString(), unit: todayRevenue > 0 ? 'NT$' : '', shade: 'light' as const },
          { label: '本月預約', value: `${monthBookings.length}`, unit: '筆', shade: 'light' as const },
          { label: '本月營收', value: monthRevenue === 0 ? '—' : monthRevenue.toLocaleString(), unit: monthRevenue > 0 ? 'NT$' : '', shade: 'light' as const },
        ].map(item => {
          const isPrimary = item.shade === 'primary'
          const numClr = isPrimary ? 'var(--theme-accent-strong)' : charcoal
          const lblClr = 'rgba(44,40,37,0.7)'
          const ntClr = 'rgba(var(--theme-accent-rgb-legacy),0.72)'
          return (
          <div key={item.label} style={{
            background: 'transparent',
            borderRight: item.label === '今日預約' || item.label === '本月預約' ? `1px solid ${border}` : 'none',
            borderBottom: item.label === '今日預約' || item.label === '今日營收' ? `1px solid ${border}` : 'none',
            padding: '18px 16px 14px', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
            boxShadow: 'none',
          }}>
            {isPrimary && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, var(--oak), transparent)' }} />}
            {item.unit === 'NT$' && (
              <p style={{ fontSize: 'calc(9px * var(--fs, 1))', letterSpacing: '0.16em', color: ntClr, marginBottom: '4px' }}>NT$</p>
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
              fontSize: 'calc(10px * var(--fs, 1))', color: lblClr, marginTop: '8px', letterSpacing: '0.08em',
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
        <span style={{ fontSize: 'calc(13px * var(--fs, 1))', color: charcoal, fontWeight: 600 }}>
          數據與對帳{isTrial && !isExpired ? (trialDateKnown ? ` · 試用剩 ${trialDaysLeft} 天` : ' · 試用中') : ''}
        </span>
        <span style={{ fontSize: 'calc(12px * var(--fs, 1))', color: oak }}>{showAnalytics ? '收合 ▲' : '展開 ▼'}</span>
      </button>
      {showAnalytics && (<>
      {/* ── 本月對帳透明化 panel ── */}
      <div data-animate data-delay="60" style={{ margin: '14px 16px 0', padding: '16px 18px', background: 'var(--sand-deep)', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.3)', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px', background: 'linear-gradient(to right, transparent, var(--oak), transparent)', opacity: 0.6 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <p style={{ fontSize: 'calc(13px * var(--fs, 1))', color: charcoal, fontWeight: 700 }}>本月對帳</p>
          <span style={{ fontSize: 'calc(10px * var(--fs, 1))', color: 'rgba(44,40,37,0.42)', letterSpacing: '0.06em' }}>{today.slice(0, 7).replace('-', ' / ')}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', alignItems: 'stretch' }}>
          <div style={{ textAlign: 'center', padding: '4px 6px' }}>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', fontWeight: 300, color: charcoal, lineHeight: 1, letterSpacing: '-0.02em' }}>{monthBookings.length}</p>
            <p style={{ fontSize: 'calc(9.5px * var(--fs, 1))', color: 'rgba(44,40,37,0.55)', marginTop: '6px', letterSpacing: '0.06em' }}>成交數</p>
          </div>
          <div style={{ textAlign: 'center', padding: '4px 6px', borderLeft: '1px solid rgba(var(--theme-accent-rgb-legacy),0.18)', borderRight: '1px solid rgba(var(--theme-accent-rgb-legacy),0.18)' }}>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', fontWeight: 300, color: charcoal, lineHeight: 1, letterSpacing: '-0.02em' }}>{monthRevenue > 0 ? monthRevenue.toLocaleString() : '—'}</p>
            <p style={{ fontSize: 'calc(9.5px * var(--fs, 1))', color: 'rgba(44,40,37,0.55)', marginTop: '6px', letterSpacing: '0.06em' }}>營收 NT$</p>
          </div>
          <div style={{ textAlign: 'center', padding: '4px 6px' }}>
            {isTrial && !isExpired ? (
              <>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', fontWeight: 300, color: oak, lineHeight: 1, letterSpacing: '-0.02em' }}>{trialDateKnown ? trialDaysLeft : '—'}</p>
                <p style={{ fontSize: 'calc(9.5px * var(--fs, 1))', color: 'rgba(44,40,37,0.55)', marginTop: '6px', letterSpacing: '0.06em' }}>{trialDateKnown ? '試用剩餘天' : '試用中'}</p>
              </>
            ) : (
              /* 2026-08-06 起不在後台叫價：這裡是職人的營運成績單，收費由業務個別處理 */
              <>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', fontWeight: 300, color: oak, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {monthBookings.length > 0 ? Math.round(monthRevenue / monthBookings.length).toLocaleString() : '—'}
                </p>
                <p style={{ fontSize: 'calc(9.5px * var(--fs, 1))', color: 'rgba(44,40,37,0.55)', marginTop: '6px', letterSpacing: '0.06em' }}>平均客單 NT$</p>
              </>
            )}
          </div>
        </div>
        <div style={{ marginTop: '14px', padding: '10px 12px', background: 'rgba(255,255,255,0.55)', borderRadius: '10px', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.16)' }}>
          {isExpired ? (
            <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: charcoal, lineHeight: 1.55 }}>
              <span style={{ fontWeight: 600, color: '#b4533a' }}>⏰ 試用已結束</span>
              <span style={{ color: 'rgba(44,40,37,0.55)' }}>　·　後台即將暫停，正式加入（NT$699/月）即可繼續服務並獲贈免費客製立牌</span>
            </p>
          ) : isTrial ? (
            <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: charcoal, lineHeight: 1.55 }}>
              <span style={{ fontWeight: 600, color: oak }}>🎁 試用中{trialDateKnown ? ` · 剩 ${trialDaysLeft} 天` : ''} · 已用 {trialUsed}/{TRIAL_LIMIT} 筆</span>
              <span style={{ color: 'rgba(44,40,37,0.55)' }}>　·　正式加入 NT$699/月解鎖無限預約 + 免費客製立牌</span>
            </p>
          ) : (
            <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: charcoal, lineHeight: 1.55 }}>
              <span style={{ fontWeight: 600, color: oak }}>✓ 0% 抽佣</span>
              <span style={{ color: 'rgba(44,40,37,0.55)' }}>　·　客人付多少全部都是你的 · 不綁約 · 解約提前 1 週通知</span>
            </p>
          )}
        </div>
      </div>

      {/* ── 回購率 dashboard (#24) ── */}
      <div data-animate data-delay="70" style={{ margin: '14px 16px 0', padding: '16px 18px', background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.2)', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px', background: 'linear-gradient(to right, transparent, var(--oak), transparent)', opacity: 0.6 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <p style={{ fontSize: 'calc(13px * var(--fs, 1))', color: charcoal, fontWeight: 700 }}>回購分析 · 近 90 天</p>
          <span style={{ fontSize: 'calc(10px * var(--fs, 1))', color: 'rgba(44,40,37,0.52)', letterSpacing: '0.06em' }}>{past90Bookings.length} 筆預約</span>
        </div>
        {customerKeys.length === 0 ? (
          <p style={{ fontSize: 'calc(12px * var(--fs, 1))', color: 'rgba(44,40,37,0.55)', textAlign: 'center', padding: '10px 0', lineHeight: 1.6 }}>
            近 90 天還沒有預約資料<br/>
            <span style={{ fontSize: 'calc(11px * var(--fs, 1))', color: 'rgba(44,40,37,0.35)' }}>開始接單後這裡會有完整分析</span>
          </p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', alignItems: 'stretch' }}>
              <div style={{ textAlign: 'center', padding: '4px 4px' }}>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.7rem', fontWeight: 300, color: oak, lineHeight: 1 }}>{repeatRate}<span style={{ fontSize: '1rem', opacity: 0.7 }}>%</span></p>
                <p style={{ fontSize: 'calc(9.5px * var(--fs, 1))', color: 'rgba(44,40,37,0.5)', marginTop: '6px', letterSpacing: '0.06em' }}>回購率</p>
              </div>
              <div style={{ textAlign: 'center', padding: '4px 4px', borderLeft: '1px solid rgba(var(--theme-accent-rgb-legacy),0.18)' }}>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.7rem', fontWeight: 300, color: charcoal, lineHeight: 1 }}>{repeatCustomers.length}</p>
                <p style={{ fontSize: 'calc(9.5px * var(--fs, 1))', color: 'rgba(44,40,37,0.5)', marginTop: '6px', letterSpacing: '0.06em' }}>回頭客</p>
              </div>
              <div style={{ textAlign: 'center', padding: '4px 4px', borderLeft: '1px solid rgba(var(--theme-accent-rgb-legacy),0.18)' }}>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.7rem', fontWeight: 300, color: charcoal, lineHeight: 1 }}>{newCustomers.length}</p>
                <p style={{ fontSize: 'calc(9.5px * var(--fs, 1))', color: 'rgba(44,40,37,0.5)', marginTop: '6px', letterSpacing: '0.06em' }}>新客</p>
              </div>
              <div style={{ textAlign: 'center', padding: '4px 4px', borderLeft: '1px solid rgba(var(--theme-accent-rgb-legacy),0.18)' }}>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.7rem', fontWeight: 300, color: charcoal, lineHeight: 1 }}>{avgInterval || '—'}<span style={{ fontSize: '0.9rem', opacity: 0.7, marginLeft: '2px' }}>{avgInterval ? '天' : ''}</span></p>
                <p style={{ fontSize: 'calc(9.5px * var(--fs, 1))', color: 'rgba(44,40,37,0.5)', marginTop: '6px', letterSpacing: '0.06em' }}>回購間隔</p>
              </div>
            </div>
            <p style={{ fontSize: 'calc(10.5px * var(--fs, 1))', color: 'rgba(44,40,37,0.64)', marginTop: '12px', lineHeight: 1.55, textAlign: 'center' }}>
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
      <div style={{ position: 'relative', margin: '14px 8px 0', background: 'rgba(255,255,255,0.48)', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.14)', borderRadius: '18px 18px 0 0', boxShadow: '0 10px 30px rgba(26,23,20,0.05)', paddingBottom: '8px' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '46px', height: '3px', borderRadius: '0 0 3px 3px', background: 'var(--oak)', opacity: 0.5 }} />

      {/* ── Main Nav (scrollable) ── */}
      <div data-animate data-delay="100" style={{ margin: '16px 16px 0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid rgba(var(--theme-accent-rgb-legacy),0.15)', paddingBottom: '0', minWidth: 'max-content' }}>
        {([['bookings', '預約管理'], ['services', '服務管理'], ['schedule', '排班設定'], ['portfolio', '作品集'], ['theme', '頁面風格'], ['waitlist', `候補${waitlist.length > 0 ? ` ${waitlist.length}` : ''}`]] as [MainView, string][]).map(([v, label]) => (
          <button key={v} onClick={() => { setMainView(v); if (v === 'waitlist') fetchWaitlist() }} style={{
            padding: '10px 16px 12px', fontSize: 'calc(12px * var(--fs, 1))',
            fontWeight: mainView === v ? 600 : 400, border: 'none', cursor: 'pointer',
            background: 'transparent',
            color: mainView === v ? charcoal : 'rgba(44,40,37,0.58)',
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
                  padding: '11px 18px', borderRadius: '20px', fontSize: 'calc(12px * var(--fs, 1))',
                  fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer',
                  background: tab === t.key ? oak : 'transparent',
                  border: tab === t.key ? `1px solid ${oak}` : '1px solid rgba(var(--theme-accent-rgb-legacy),0.35)',
                  color: tab === t.key ? cream : 'rgba(44,40,37,0.8)',
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
                          <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: oak, letterSpacing: '0.08em', marginBottom: '8px', paddingLeft: '4px' }}>
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
              <p style={{ fontSize: 'calc(13px * var(--fs, 1))', color: charcoal, fontWeight: 700, marginBottom: '12px', paddingLeft: '4px' }}>私下預約管理</p>
              <ManualBookingForm providerId={providerId} services={services} onSuccess={fetchBookings} />
            </div>
          )}
        </>
      )}

      {/* ════════════════ SERVICES VIEW ════════════════ */}
      {mainView === 'services' && (
        <div style={{ padding: '16px 16px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <p style={{ fontSize: 'calc(13px * var(--fs, 1))', color: charcoal, fontWeight: 700 }}>
              服務項目 ({services.length})
            </p>
            {!addingService && (
              <button onClick={() => setAddingService(true)} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: 'calc(12px * var(--fs, 1))', color: oak, background: 'rgba(var(--theme-accent-rgb-legacy),0.1)',
                border: 'none', borderRadius: '22px', padding: '0 16px', minHeight: '44px', cursor: 'pointer',
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
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'calc(16px * var(--fs, 1))', color: '#c8c0b8' }}>尚未設定服務項目</p>
              <p style={{ fontSize: 'calc(12px * var(--fs, 1))', color: '#d0c8c0', marginTop: '8px' }}>點選「新增服務」開始設定</p>
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

      {/* ════════════════ THEME VIEW ════════════════ */}
      {mainView === 'theme' && (
        <ThemePickerPanel
          providerId={providerId}
          selectedTheme={draftTheme}
          savedTheme={providerTheme}
          onSelect={setDraftTheme}
          onSaved={(theme) => { setProviderTheme(theme); setDraftTheme(theme) }}
        />
      )}

      {/* ════════════════ WAITLIST VIEW ════════════════ */}
      {mainView === 'waitlist' && (
        <section style={{ padding: '0 16px 24px' }}>
          {waitlist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: 'rgba(var(--theme-accent-rgb-legacy),0.04)', borderRadius: '18px', border: `1px solid ${border}` }}>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'calc(20px * var(--fs, 1))', color: 'rgba(44,40,37,0.3)', marginBottom: '8px' }}>目前沒有候補</p>
              <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: 'rgba(44,40,37,0.35)' }}>預約頁時段客滿時，顧客可加入候補名單</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {waitlist.map(entry => (
                <div key={entry.id} style={{ background: 'rgba(180,120,40,0.06)', border: '1px solid rgba(180,120,40,0.22)', borderRadius: '14px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'calc(18px * var(--fs, 1))', fontWeight: 600, color: charcoal }}>{entry.date} {entry.time}</p>
                      <p style={{ fontSize: 'calc(13px * var(--fs, 1))', color: '#8a5c20', marginTop: '2px' }}>{entry.customerName}</p>
                    </div>
                    <span style={{ fontSize: 'calc(10px * var(--fs, 1))', color: '#8a5c20', background: 'rgba(180,120,40,0.12)', padding: '3px 10px', borderRadius: '20px' }}>候補中</span>
                  </div>
                  {entry.customerPhone && (
                    <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: '#574e48', marginBottom: '10px' }}>📱 {entry.customerPhone}</p>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={async () => {
                        setRemovingWL(entry.id)
                        // 失敗卻從畫面移除 = 這筆候補從此在後台消失，但客人還在等
                        const wlRes = await fetch('/api/admin/waitlist', { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ entryId: entry.id, status: 'cancelled' }) })
                        setRemovingWL(null)
                        if (!wlRes.ok) { alert('移除失敗，請再試一次'); return }
                        setWaitlist(w => w.filter(e => e.id !== entry.id))
                      }}
                      disabled={removingWL === entry.id}
                      style={{ flex: 1, fontSize: 'calc(11px * var(--fs, 1))', color: '#574e48', border: `1px solid ${border}`, borderRadius: '10px', padding: '8px', background: 'transparent', cursor: 'pointer', opacity: removingWL === entry.id ? 0.5 : 1 }}
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

      {/* ── Light footer ── */}
      <div style={{ background: 'rgba(255,255,255,0.46)', borderTop: '1px solid rgba(var(--theme-accent-rgb-legacy),0.14)', padding: '28px 24px 34px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: '300px 300px', pointerEvents: 'none' }} />
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.3rem', fontWeight: 500, color: charcoal, marginBottom: '10px', position: 'relative' }}>{providerName}</p>
        <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: 'rgba(44,40,37,0.42)', position: 'relative' }}>MooLah · 合作夥伴後台</p>
      </div>

      {/* ── 嵌入到 IG/網站 widget snippet (#30) ── */}
      <details style={{ margin: '0 16px 24px', padding: '14px 18px', background: 'rgba(var(--theme-accent-rgb-legacy),0.08)', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.25)', borderRadius: '12px' }}>
        <summary style={{ cursor: 'pointer', fontSize: 'calc(12px * var(--fs, 1))', fontWeight: 600, color: oak, letterSpacing: '0.06em', listStyle: 'none' }}>
          📌 嵌入到 IG bio / 自己網站
        </summary>
        <div style={{ marginTop: '12px', fontSize: 'calc(11px * var(--fs, 1))', color: 'rgba(44,40,37,0.7)', lineHeight: 1.7 }}>
          <p style={{ marginBottom: '10px' }}>把以下程式碼貼到你的網站，客人可直接看到最近可預約時段：</p>
          {/* 深底上用 accent-light 不用 accent：實測 accent 在 #2C2825 上八主題只有 2.50–4.45，
              換 light 後 5.22–6.45 全數過 4.5:1（2026-08-17） */}
          <pre style={{ background: '#2C2825', color: 'var(--theme-accent-light)', padding: '12px', borderRadius: '8px', fontSize: 'calc(10.5px * var(--fs, 1))', overflowX: 'auto', fontFamily: 'ui-monospace, Menlo, monospace', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
{`<iframe src="https://moolah.studio/embed/${providerId}" width="360" height="540" frameborder="0" style="border:0;border-radius:14px;"></iframe>`}
          </pre>
          <p style={{ marginTop: '8px', fontSize: 'calc(10px * var(--fs, 1))', color: 'rgba(44,40,37,0.5)' }}>
            或直接分享連結：
            <a href={`/embed/${providerId}`} target="_blank" rel="noopener noreferrer"
              style={{ color: oak, marginLeft: '4px', textDecoration: 'underline', minHeight: '40px', display: 'inline-flex', alignItems: 'center', padding: '0 4px' }}>
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
