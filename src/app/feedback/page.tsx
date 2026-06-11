'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const CHARCOAL = '#1a1714'
const OAK = '#A68966'
const CREAM = '#fbf9f4'
const SEV = ['低', '中', '高']

export default function FeedbackPage() {
  return (
    <Suspense fallback={null}>
      <FeedbackForm />
    </Suspense>
  )
}

function FeedbackForm() {
  const sp = useSearchParams()
  const [area, setArea] = useState(sp.get('area') ?? '')
  const [severity, setSeverity] = useState('中')
  const [message, setMessage] = useState('')
  const [reporter, setReporter] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  async function submit() {
    if (!message.trim()) return
    setState('sending')
    try {
      const r = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area, severity, message, reporter }),
      })
      setState(r.ok ? 'done' : 'error')
    } catch { setState('error') }
  }

  const wrap: React.CSSProperties = {
    minHeight: '100svh', background: CHARCOAL, color: CREAM, maxWidth: 480, margin: '0 auto',
    padding: '40px 22px 60px', fontFamily: '-apple-system, "PingFang TC", sans-serif',
  }
  const label: React.CSSProperties = { fontSize: 12, color: OAK, letterSpacing: '0.08em', margin: '22px 0 8px', display: 'block' }
  const field: React.CSSProperties = {
    width: '100%', background: 'rgba(166,137,102,0.08)', border: '1px solid rgba(166,137,102,0.3)',
    borderRadius: 12, color: CREAM, fontSize: 15, padding: '12px 14px', outline: 'none',
  }

  if (state === 'done') {
    return (
      <div style={{ ...wrap, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16 }}>
        <div style={{ fontSize: 40 }}>✅</div>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>已收到回報，謝謝！</h1>
        <p style={{ fontSize: 14, opacity: 0.7 }}>已寫進 feedback 紀錄，Claude 會看到並處理。</p>
        <button onClick={() => { setMessage(''); setState('idle') }}
          style={{ marginTop: 10, background: OAK, color: CHARCOAL, fontWeight: 700, border: 'none', borderRadius: 99, padding: '12px 28px', fontSize: 15, cursor: 'pointer' }}>
          再回報一個
        </button>
      </div>
    )
  }

  return (
    <div style={wrap}>
      <p style={{ fontSize: 10, color: OAK, letterSpacing: '0.26em', textTransform: 'uppercase' }}>MooLah 封測</p>
      <h1 style={{ fontSize: 26, fontWeight: 600, margin: '6px 0 4px' }}>問題回報 🐞</h1>
      <p style={{ fontSize: 13, opacity: 0.65 }}>測到任何怪怪的、卡住的、醜的，都丟進來。</p>

      <label style={label}>頁面 / 區域</label>
      <input style={field} value={area} onChange={e => setArea(e.target.value)} placeholder="例：預約頁、後台-服務管理、立牌掃碼" />

      <label style={label}>嚴重度</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {SEV.map(s => (
          <button key={s} onClick={() => setSeverity(s)} style={{
            padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: severity === s ? 700 : 400,
            background: severity === s ? OAK : 'transparent', color: severity === s ? CHARCOAL : CREAM,
            border: `1px solid ${severity === s ? OAK : 'rgba(166,137,102,0.3)'}`,
          }}>{s}</button>
        ))}
      </div>

      <label style={label}>問題描述 *</label>
      <textarea style={{ ...field, minHeight: 120, resize: 'vertical' }} value={message} onChange={e => setMessage(e.target.value)}
        placeholder="發生什麼事？怎麼重現？預期應該怎樣？" />

      <label style={label}>回報者（選填）</label>
      <input style={field} value={reporter} onChange={e => setReporter(e.target.value)} placeholder="Gini / Claude" />

      {state === 'error' && <p style={{ color: '#e88', fontSize: 13, marginTop: 14 }}>送出失敗，再試一次。</p>}

      <button onClick={submit} disabled={state === 'sending' || !message.trim()} style={{
        width: '100%', marginTop: 28, background: message.trim() ? OAK : 'rgba(166,137,102,0.3)', color: CHARCOAL,
        fontWeight: 700, border: 'none', borderRadius: 99, padding: '15px', fontSize: 16,
        cursor: message.trim() ? 'pointer' : 'default',
      }}>
        {state === 'sending' ? '送出中…' : '送出回報'}
      </button>
    </div>
  )
}
