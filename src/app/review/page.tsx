'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ReviewForm() {
  const params = useSearchParams()
  const bookingId = params.get('b') ?? ''
  const providerId = params.get('p') ?? ''
  const customerName = params.get('n') ?? ''
  const customerUserId = params.get('u') ?? ''

  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error' | 'duplicate'>('idle')

  useEffect(() => {
    document.title = '評價服務 | MooLah'
  }, [])

  async function submit() {
    if (!rating) return
    setStatus('submitting')
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, providerId, customerLineUserId: customerUserId, customerName, rating, comment }),
      })
      if (res.status === 409) { setStatus('duplicate'); return }
      if (!res.ok) throw new Error()
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  const stars = [1, 2, 3, 4, 5]

  if (status === 'done') return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.checkCircle}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#A68966" />
            <path d="M11 20l7 7 11-14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p style={styles.doneTitle}>感謝您的評價！</p>
        <p style={styles.doneSub}>您的回饋幫助更多人找到優質職人。</p>
        <div style={styles.stars}>
          {stars.map(s => (
            <span key={s} style={{ fontSize: 28, color: s <= rating ? '#A68966' : '#e0d6cc' }}>★</span>
          ))}
        </div>
      </div>
    </div>
  )

  if (status === 'duplicate') return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.doneTitle}>已評價過了</p>
        <p style={styles.doneSub}>這筆預約已經完成評價，感謝您！</p>
      </div>
    </div>
  )

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.label}>服務評價</p>
        <p style={styles.title}>您對這次服務的評分</p>

        <div style={styles.starsRow}>
          {stars.map(s => (
            <button
              key={s}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(s)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontSize: 36,
                color: s <= (hover || rating) ? '#A68966' : '#ddd',
                transform: s <= (hover || rating) ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.15s ease' }}
            >★</button>
          ))}
        </div>

        {rating > 0 && (
          <p style={{ textAlign: 'center', color: '#A68966', fontSize: 13, margin: '4px 0 16px', fontFamily: 'DM Sans, sans-serif' }}>
            {['', '很糟', '不太好', '普通', '不錯', '非常棒！'][rating]}
          </p>
        )}

        <textarea
          placeholder="留下您的感想（選填）"
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={200}
          style={styles.textarea}
        />

        <button
          onClick={submit}
          disabled={!rating || status === 'submitting'}
          style={{ ...styles.btn, opacity: !rating ? 0.4 : 1 }}
        >
          {status === 'submitting' ? '送出中…' : '送出評價'}
        </button>

        {status === 'error' && (
          <p style={{ color: '#c0392b', textAlign: 'center', fontSize: 13, marginTop: 8 }}>送出失敗，請再試一次</p>
        )}
      </div>
    </div>
  )
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#fbf9f4' }} />}>
      <ReviewForm />
    </Suspense>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#fbf9f4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: 'DM Sans, sans-serif',
  },
  card: {
    background: 'white',
    borderRadius: 20,
    padding: '36px 28px',
    maxWidth: 400,
    width: '100%',
    boxShadow: '0 4px 32px rgba(44,40,37,0.10)',
  },
  label: {
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#A68966',
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: '#2C2825',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Cormorant Garamond, serif',
  },
  starsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 8,
  },
  stars: {
    display: 'flex',
    justifyContent: 'center',
    gap: 4,
    margin: '16px 0 0',
  },
  textarea: {
    width: '100%',
    minHeight: 96,
    border: '1px solid #e8e0d6',
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 14,
    color: '#2C2825',
    background: '#fbf9f4',
    resize: 'none',
    outline: 'none',
    marginBottom: 16,
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%',
    padding: '14px',
    background: '#2C2825',
    color: '#fbf9f4',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  checkCircle: { display: 'flex', justifyContent: 'center', marginBottom: 16 },
  doneTitle: { fontSize: 22, fontWeight: 600, color: '#2C2825', textAlign: 'center', fontFamily: 'Cormorant Garamond, serif', marginBottom: 8 },
  doneSub: { fontSize: 14, color: '#7a6e68', textAlign: 'center', marginBottom: 16 },
}
