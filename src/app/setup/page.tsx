import type { Metadata } from 'next'
import SetupForm from './SetupForm'

const oak = '#A68966'
const charcoal = '#2C2825'
const charcoalDeep = '#1a1714'
const cream = '#fbf9f4'
const sand = '#f5efe6'

export const metadata: Metadata = {
  title: '開通你的預約 AI 機器人 | MooLah',
  description: '感謝購買 MooLah 預約 AI 機器人。填寫你的服務資訊，專人將協助你完成開通與設定。',
  robots: { index: false, follow: false },
}

const STEPS = [
  ['1', '填寫服務資訊', '讓我們了解你的服務項目與需求'],
  ['2', '專人聯繫你', '1 個工作天內與你對接'],
  ['3', '開通並設定', '幫你把專屬預約頁設好，開始接單'],
]

export default function SetupPage() {
  return (
    // overflow-x 用 clip：hidden 會讓 overflow-y 變 auto，產生第二條滾軸
    <main style={{ background: cream, color: charcoal, minHeight: '100vh', overflowX: 'clip' }}>
      {/* Hero */}
      <section style={{ position: 'relative', background: charcoalDeep, color: cream, padding: '30px 24px 40px', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, transparent, ${oak}, transparent)` }} />
        <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 22, letterSpacing: '0.18em', marginBottom: 22, color: cream }}>MOOLAH</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: charcoalDeep, background: oak, padding: '7px 16px', borderRadius: 999, marginBottom: 18, fontWeight: 700, letterSpacing: '0.03em' }}>
          🎉 感謝購買
        </div>
        <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300, fontSize: 'clamp(1.9rem, 7vw, 2.8rem)', lineHeight: 1.2, marginBottom: 14 }}>
          開通你的<br />預約 <span style={{ fontStyle: 'italic', color: oak }}>AI</span> 機器人
        </h1>
        <p style={{ fontSize: 'clamp(14px, 3.8vw, 16px)', color: 'rgba(251,249,244,0.72)', lineHeight: 1.8, maxWidth: 460, margin: '0 auto' }}>
          再一步就完成。<br />
          填寫下方資訊，專人會親自幫你把系統設好。
        </p>
      </section>

      {/* Steps */}
      <section style={{ padding: '30px 24px 8px', maxWidth: 560, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {STEPS.map(([n, t, d]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 14, background: sand, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: '50%', background: charcoalDeep, color: oak, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Cormorant Garamond", serif', fontSize: 18, fontWeight: 600 }}>{n}</div>
              <div>
                <p style={{ fontSize: 14.5, fontWeight: 700, color: charcoal, marginBottom: 2 }}>{t}</p>
                <p style={{ fontSize: 12.5, color: 'rgba(44,40,37,0.55)' }}>{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Form card */}
      <section style={{ padding: '20px 24px 56px', maxWidth: 560, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '28px 22px', border: `1px solid ${oak}22`, boxShadow: '0 14px 40px rgba(26,23,20,0.08)' }}>
          <SetupForm />
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(44,40,37,0.4)', marginTop: 22, lineHeight: 1.7 }}>
          MooLah・專為台灣美業職人打造的預約 AI 助理<br />
          有任何問題，加官方 LINE 隨時找我們
        </p>
      </section>
    </main>
  )
}
