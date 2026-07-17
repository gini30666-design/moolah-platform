'use client'
import { useState } from 'react'
import { trackLead } from '@/components/MetaPixel'
import { ga } from '@/lib/gtag'

const CATEGORIES = ['髮型設計師', '美甲師', '美容師（做臉）', '採耳師', '按摩舒壓師', '寵物美容師', '汽車美容師', '刺青師']
const DISTRICTS  = ['高雄市', '屏東縣', '台南市', '台中市', '台北市', '其他']
const METHODS    = ['口頭或電話確認', 'LINE 個人帳號', '無系統（自行記錄）', '已有其他軟體']
const PLANS      = [
  { key: 'trial',  title: '14 天免費試用', desc: '全功能體驗・試用期上限 20 筆預約' },
  { key: 'direct', title: '直接正式加入', desc: '免試用・NT$699/月・立即寄送客製立牌' },
]

export default function JoinForm() {
  const [form, setForm] = useState({ name: '', category: '', district: '', contact: '', currentMethod: '', plan: 'trial' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.category || !form.district || !form.contact.trim()) {
      setError('請填寫所有必填欄位'); return
    }
    setStatus('loading'); setError('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      trackLead()
      ga.submitLead(form.category, form.plan)
    } catch {
      setStatus('error'); setError('送出失敗，請稍後再試或直接加入 LINE')
    }
  }

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'rgba(166,137,102,0.12)', border: '1.5px solid var(--oak)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--oak)" strokeWidth="2" style={{ width: '28px', height: '28px' }}>
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.8rem', color: 'var(--charcoal)', fontWeight: 300, marginBottom: '8px' }}>申請已送出</p>
        <p style={{ fontSize: '14px', color: 'rgba(44,40,37,0.55)', lineHeight: 1.7, marginBottom: '28px' }}>
          我們會在 24 小時內透過你提供的方式聯絡你。<br/>
          如有急事，也可直接加入 LINE 聯絡 Gini。
        </p>
        <a
          href="https://line.me/R/ti/p/@492ejbwx"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 24px', background: '#06C755', color: 'white',
            fontSize: '13px', letterSpacing: '0.08em', borderRadius: '4px',
            textDecoration: 'none',
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '16px', height: '16px' }}>
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
          加入 MooLah LINE
        </a>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    border: '1px solid rgba(166,137,102,0.25)', borderRadius: '8px',
    background: 'white', fontSize: '14px', color: 'var(--charcoal)',
    outline: 'none', transition: 'border-color 0.18s',
    fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', letterSpacing: '0.15em',
    textTransform: 'uppercase', color: 'var(--oak)', marginBottom: '8px', fontWeight: 500,
  }
  const pillGroupStyle: React.CSSProperties = {
    display: 'flex', flexWrap: 'wrap', gap: '8px',
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '480px', margin: '0 auto' }}>
      {/* Name */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>姓名 *</label>
        <input
          type="text" placeholder="你的姓名或店名"
          value={form.name} onChange={e => set('name', e.target.value)}
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = 'var(--oak)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(166,137,102,0.25)')}
        />
      </div>

      {/* Category */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>服務類別 *</label>
        <div style={pillGroupStyle}>
          {CATEGORIES.map(c => (
            <button key={c} type="button" onClick={() => set('category', c)} style={{
              padding: '8px 16px', borderRadius: '999px', fontSize: '13px', cursor: 'pointer',
              border: `1px solid ${form.category === c ? 'var(--oak)' : 'rgba(166,137,102,0.25)'}`,
              background: form.category === c ? 'var(--charcoal)' : 'white',
              color: form.category === c ? 'var(--cream)' : 'rgba(44,40,37,0.7)',
              transition: 'all 0.15s',
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* District */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>所在地區 *</label>
        <div style={pillGroupStyle}>
          {DISTRICTS.map(d => (
            <button key={d} type="button" onClick={() => set('district', d)} style={{
              padding: '8px 16px', borderRadius: '999px', fontSize: '13px', cursor: 'pointer',
              border: `1px solid ${form.district === d ? 'var(--oak)' : 'rgba(166,137,102,0.25)'}`,
              background: form.district === d ? 'var(--charcoal)' : 'white',
              color: form.district === d ? 'var(--cream)' : 'rgba(44,40,37,0.7)',
              transition: 'all 0.15s',
            }}>{d}</button>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>LINE ID 或電話 *</label>
        <input
          type="text" placeholder="LINE ID 或 09xx-xxx-xxx"
          value={form.contact} onChange={e => set('contact', e.target.value)}
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = 'var(--oak)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(166,137,102,0.25)')}
        />
      </div>

      {/* Current method */}
      <div style={{ marginBottom: '28px' }}>
        <label style={{ ...labelStyle, color: 'rgba(44,40,37,0.45)' }}>目前如何接預約？（選填）</label>
        <div style={pillGroupStyle}>
          {METHODS.map(m => (
            <button key={m} type="button" onClick={() => set('currentMethod', form.currentMethod === m ? '' : m)} style={{
              padding: '7px 14px', borderRadius: '999px', fontSize: '12px', cursor: 'pointer',
              border: `1px solid ${form.currentMethod === m ? 'rgba(166,137,102,0.5)' : 'rgba(166,137,102,0.18)'}`,
              background: form.currentMethod === m ? 'rgba(166,137,102,0.08)' : 'white',
              color: form.currentMethod === m ? 'var(--oak)' : 'rgba(44,40,37,0.5)',
              transition: 'all 0.15s',
            }}>{m}</button>
          ))}
        </div>
      </div>

      {/* Plan choice */}
      <div style={{ marginBottom: '28px' }}>
        <label style={labelStyle}>我想要 *</label>
        <div style={{ display: 'grid', gap: '10px' }}>
          {PLANS.map(p => {
            const active = form.plan === p.key
            return (
              <button key={p.key} type="button" onClick={() => set('plan', p.key)} style={{
                textAlign: 'left', padding: '14px 16px', borderRadius: '10px', cursor: 'pointer',
                border: `1.5px solid ${active ? 'var(--oak)' : 'rgba(166,137,102,0.25)'}`,
                background: active ? 'rgba(166,137,102,0.08)' : 'white',
                transition: 'all 0.15s',
              }}>
                <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: active ? 'var(--oak)' : 'var(--charcoal)', marginBottom: '3px' }}>
                  {active ? '◉ ' : '○ '}{p.title}
                </span>
                <span style={{ display: 'block', fontSize: '12px', color: 'rgba(44,40,37,0.55)' }}>{p.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <p style={{ fontSize: '13px', color: '#c0392b', marginBottom: '16px', textAlign: 'center' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          width: '100%', padding: '15px',
          background: status === 'loading' ? 'rgba(44,40,37,0.5)' : 'var(--charcoal)',
          color: 'var(--cream)', border: 'none', borderRadius: '8px',
          fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase',
          cursor: status === 'loading' ? 'default' : 'pointer',
          transition: 'background 0.18s',
        }}
      >
        {status === 'loading' ? '傳送中…' : '與我們聊聊'}
      </button>

      <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(44,40,37,0.38)', marginTop: '16px', lineHeight: 1.6 }}>
        送出後 24 小時內回覆 · 資料僅用於聯絡用途
      </p>
    </form>
  )
}
