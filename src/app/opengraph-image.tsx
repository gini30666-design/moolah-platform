import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'MooLah — 質感生活，從容預約'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          background: '#2C2825',
          padding: '64px 72px',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Oak top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#A68966', display: 'flex' }} />

        {/* Background texture dots */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 80% 20%, rgba(166,137,102,0.08) 0%, transparent 60%)',
          display: 'flex',
        }} />

        {/* M logo mark */}
        <div style={{
          position: 'absolute', top: 56, left: 72,
          width: 48, height: 48,
          background: '#A68966',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'serif', fontSize: '22px', fontWeight: 700, color: '#fbf9f4',
        }}>M</div>

        {/* Oak divider */}
        <div style={{ width: 48, height: 2, background: '#A68966', marginBottom: 24, display: 'flex' }} />

        {/* Tagline */}
        <div style={{ fontSize: 18, color: 'rgba(166,137,102,0.8)', letterSpacing: '0.15em', marginBottom: 20, display: 'flex' }}>
          MOOLAH · 美業智慧預約平台
        </div>

        {/* Main headline */}
        <div style={{
          fontSize: 72, fontWeight: 600, color: '#fbf9f4',
          lineHeight: 1.1, marginBottom: 32, display: 'flex', flexDirection: 'column',
        }}>
          <span>質感生活，</span>
          <span style={{ color: '#A68966' }}>從容預約。</span>
        </div>

        {/* Services row */}
        <div style={{ display: 'flex', gap: 12 }}>
          {['髮型設計師', '寵物美容', '汽車美容', '美甲師'].map(s => (
            <div key={s} style={{
              padding: '8px 18px',
              border: '1px solid rgba(166,137,102,0.35)',
              borderRadius: 40,
              fontSize: 16, color: 'rgba(251,249,244,0.7)',
              display: 'flex',
            }}>{s}</div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
