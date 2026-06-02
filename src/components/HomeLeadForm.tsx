'use client'
import { useState } from 'react'
import { trackLead } from '@/components/MetaPixel'

const CATEGORIES = ['髮型設計師', '寵物美容師', '汽車美容師', '美甲師']

export default function HomeLeadForm() {
  const [form, setForm] = useState({ name: '', contact: '', category: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.contact.trim() || !form.category) {
      setError('請填寫姓名、聯絡方式與類別'); return
    }
    setStatus('loading'); setError('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, district: '', currentMethod: '', source: 'home' }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      trackLead()
    } catch {
      setStatus('error'); setError('送出失敗，請稍後再試')
    }
  }

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '36px 24px', background: 'rgba(166,137,102,0.08)', border: '1px solid rgba(166,137,102,0.25)', borderRadius: '14px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(166,137,102,0.15)', border: '1.5px solid var(--oak)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--oak)" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: 'var(--cream)', fontWeight: 300, marginBottom: '6px' }}>申請已送出</p>
        <p style={{ fontSize: '13px', color: 'rgba(251,249,244,0.55)', lineHeight: 1.7 }}>
          24 小時內 Gini 會透過你提供的方式聯絡你
        </p>
      </div>
    )
  }

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    border: '1px solid rgba(166,137,102,0.32)', borderRadius: '10px',
    background: 'rgba(251,249,244,0.05)', fontSize: '14px', color: 'var(--cream)',
    outline: 'none', transition: 'border-color 0.18s', fontFamily: 'inherit',
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <input
          type="text" placeholder="姓名或店名"
          value={form.name} onChange={e => set('name', e.target.value)}
          style={inputBase}
          onFocus={e => (e.target.style.borderColor = 'var(--oak)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(166,137,102,0.32)')}
        />
        <input
          type="text" placeholder="LINE ID 或電話"
          value={form.contact} onChange={e => set('contact', e.target.value)}
          style={inputBase}
          onFocus={e => (e.target.style.borderColor = 'var(--oak)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(166,137,102,0.32)')}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {CATEGORIES.map(c => (
          <button key={c} type="button" onClick={() => set('category', c)} style={{
            padding: '8px 16px', borderRadius: '999px', fontSize: '12px', cursor: 'pointer',
            border: `1px solid ${form.category === c ? 'var(--oak)' : 'rgba(166,137,102,0.32)'}`,
            background: form.category === c ? 'var(--oak)' : 'transparent',
            color: form.category === c ? 'var(--cream)' : 'rgba(251,249,244,0.65)',
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}>{c}</button>
        ))}
      </div>

      {error && (
        <p style={{ fontSize: '12px', color: '#ff9999', marginBottom: '12px', textAlign: 'center' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          width: '100%', padding: '14px',
          background: status === 'loading' ? 'rgba(166,137,102,0.4)' : 'var(--oak)',
          color: 'var(--cream)', border: 'none', borderRadius: '10px',
          fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase',
          cursor: status === 'loading' ? 'default' : 'pointer',
          transition: 'background 0.18s', fontFamily: 'inherit', fontWeight: 600,
        }}
      >
        {status === 'loading' ? '傳送中…' : '免費試用 3 個月 →'}
      </button>

      <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(251,249,244,0.42)', marginTop: '12px', lineHeight: 1.6 }}>
        前 20 位合作夥伴免費 · 24 小時內專人聯絡
      </p>
    </form>
  )
}
