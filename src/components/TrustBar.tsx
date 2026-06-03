'use client'
import { useEffect, useState } from 'react'

type Stats = { customers: number; providers: number; portfolio: number; bookings: number }

export default function TrustBar() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then((d: Stats) => setStats(d))
      .catch(() => {})
  }, [])

  // 早期數字偏少時不要難看 — 設保底值
  const customers = Math.max(stats?.customers ?? 0, 0)
  const providers = Math.max(stats?.providers ?? 0, 0)
  const portfolio = Math.max(stats?.portfolio ?? 0, 0)

  const items = [
    { value: customers, label: '已服務客人', suffix: '+' },
    { value: providers, label: '合作職人', suffix: '+' },
    { value: portfolio, label: '精選作品', suffix: '+' },
  ]

  return (
    <div
      style={{
        background: 'rgba(166,137,102,0.08)',
        borderTop: '1px solid rgba(166,137,102,0.18)',
        borderBottom: '1px solid rgba(166,137,102,0.18)',
        padding: '14px 20px',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          textAlign: 'center',
        }}
      >
        {items.map(it => (
          <div key={it.label}>
            <p
              className="font-display"
              style={{
                fontSize: 'clamp(1.4rem,3vw,1.9rem)',
                color: 'var(--oak)',
                fontWeight: 400,
                lineHeight: 1,
                letterSpacing: '-0.01em',
                marginBottom: '4px',
              }}
            >
              {stats === null ? '—' : `${it.value}${it.value > 0 ? it.suffix : ''}`}
            </p>
            <p
              style={{
                fontSize: '10.5px',
                color: 'var(--oak-dim)',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              {it.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
