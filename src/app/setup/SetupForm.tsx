'use client'
import { useState } from 'react'

const oak = '#A68966'
const charcoal = '#2C2825'
const charcoalDeep = '#1a1714'
const cream = '#fbf9f4'
const LINE_URL = 'https://line.me/R/ti/p/@492ejbwx'

const CATEGORIES = ['美甲師', '美髮設計師', '美睫師', '採耳師', '美容師（做臉）', '按摩舒壓師', '寵物美容師', '其他']
const DISTRICTS = ['高雄市', '台南市', '台中市', '台北市', '新北市', '桃園市', '屏東縣', '其他']

function LineIcon({ size = 18 }: { size?: number }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: size, height: size }}><path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
}

export default function SetupForm() {
  const [form, setForm] = useState({ name: '', category: '', district: '', contact: '', note: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.contact.trim()) {
      setError('請留下稱呼與聯絡方式，我們才能與你聯繫開通'); return
    }
    setStatus('loading'); setError('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category || '美業職人',
          district: form.district || '未填',
          contact: form.contact.trim(),
          currentMethod: `蝦皮開通${form.note ? '｜' + form.note.trim() : ''}`,
          plan: 'trial',
        }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error'); setError('送出失敗，請稍後再試，或直接加 LINE 聯繫我們')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: '12px',
    border: '1.5px solid rgba(166,137,102,0.28)', background: '#fff',
    fontSize: '15px', color: charcoal, outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.18s, box-shadow 0.18s',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 600, color: charcoal, marginBottom: '8px',
  }
  const pill = (active: boolean): React.CSSProperties => ({
    padding: '9px 16px', borderRadius: '999px', fontSize: '13.5px', cursor: 'pointer',
    border: `1.5px solid ${active ? oak : 'rgba(166,137,102,0.28)'}`,
    background: active ? charcoal : '#fff',
    color: active ? cream : 'rgba(44,40,37,0.72)', transition: 'all 0.15s',
  })

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '20px 8px' }}>
        <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(166,137,102,0.12)', border: `1.5px solid ${oak}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={oak} strokeWidth="2" style={{ width: 30, height: 30 }}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '2rem', fontWeight: 300, color: charcoal, marginBottom: '10px' }}>收到你的資料了！</p>
        <p style={{ fontSize: '14.5px', color: 'rgba(44,40,37,0.62)', lineHeight: 1.8, marginBottom: '26px' }}>
          我們會在 <strong style={{ color: charcoal }}>1 個工作天內</strong>與你聯繫，<br />
          幫你完成預約 AI 機器人的開通與設定 💛
        </p>
        <a href={LINE_URL} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#06C755', color: '#fff', padding: '14px 26px', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 22px rgba(6,199,85,0.28)' }}>
          <LineIcon /> 想更快？直接加 LINE 找我們
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={submit}>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>如何稱呼你 <span style={{ color: oak }}>*</span></label>
        <input style={inputStyle} placeholder="你的稱呼或店名" value={form.name} onChange={e => set('name', e.target.value)}
          onFocus={e => { e.target.style.borderColor = oak; e.target.style.boxShadow = '0 0 0 3px rgba(166,137,102,0.12)' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(166,137,102,0.28)'; e.target.style.boxShadow = 'none' }} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>LINE ID 或電話 <span style={{ color: oak }}>*</span></label>
        <input style={inputStyle} placeholder="LINE ID 或 09xx-xxx-xxx" value={form.contact} onChange={e => set('contact', e.target.value)}
          onFocus={e => { e.target.style.borderColor = oak; e.target.style.boxShadow = '0 0 0 3px rgba(166,137,102,0.12)' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(166,137,102,0.28)'; e.target.style.boxShadow = 'none' }} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ ...labelStyle, color: 'rgba(44,40,37,0.5)', fontWeight: 500 }}>你的服務類別（選填）</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map(c => (
            <button key={c} type="button" style={pill(form.category === c)} onClick={() => set('category', form.category === c ? '' : c)}>{c}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ ...labelStyle, color: 'rgba(44,40,37,0.5)', fontWeight: 500 }}>所在地區（選填）</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {DISTRICTS.map(d => (
            <button key={d} type="button" style={pill(form.district === d)} onClick={() => set('district', form.district === d ? '' : d)}>{d}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 26 }}>
        <label style={{ ...labelStyle, color: 'rgba(44,40,37,0.5)', fontWeight: 500 }}>想先讓我們知道的事（選填）</label>
        <textarea style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} rows={3} placeholder="例如：目前用 LINE 手動接單、想解決漏單問題…"
          value={form.note} onChange={e => set('note', e.target.value)}
          onFocus={e => { e.target.style.borderColor = oak; e.target.style.boxShadow = '0 0 0 3px rgba(166,137,102,0.12)' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(166,137,102,0.28)'; e.target.style.boxShadow = 'none' }} />
      </div>

      {error && <p style={{ fontSize: 13.5, color: '#c0392b', marginBottom: 16, textAlign: 'center' }}>{error}</p>}

      <button type="submit" disabled={status === 'loading'}
        style={{ width: '100%', padding: '16px', borderRadius: 13, border: 'none', cursor: 'pointer',
          background: charcoalDeep, color: cream, fontSize: 16, fontWeight: 700, letterSpacing: '0.02em',
          opacity: status === 'loading' ? 0.6 : 1, boxShadow: '0 8px 22px rgba(26,23,20,0.22)' }}>
        {status === 'loading' ? '送出中…' : '送出，開通我的預約 AI 機器人'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 12.5, color: 'rgba(44,40,37,0.42)', marginTop: 16 }}>
        送出後，專人將於 1 個工作天內與你聯繫完成設定
      </p>
    </form>
  )
}
