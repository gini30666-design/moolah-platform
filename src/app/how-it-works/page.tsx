import type { Metadata } from 'next'
import Link from 'next/link'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

export const metadata: Metadata = {
  title: '60 秒看懂 MooLah 怎麼用 | 加 LINE 一鍵預約美業職人',
  description: '60 秒看完 MooLah 完整預約流程。不用下載 App、不用註冊帳號，加 LINE 好友就能預約髮型設計師、寵物美容、美甲師、汽車美容師。',
  alternates: { canonical: `${BASE_URL}/how-it-works` },
  openGraph: {
    title: '60 秒看懂 MooLah 怎麼用',
    description: '加 LINE 好友 → 選類別 → 挑職人 → 一鍵預約',
    url: `${BASE_URL}/how-it-works`,
  },
}

type Step = {
  no: string
  title: string
  desc: string
  visual: React.ReactNode
}

const oak = '#A68966'
const charcoal = '#2C2825'
const cream = '#fbf9f4'
const sand = '#f5efe6'

function PhoneFrame({ children, accent = oak }: { children: React.ReactNode; accent?: string }) {
  return (
    <div style={{
      position: 'relative',
      width: '180px',
      height: '320px',
      background: charcoal,
      borderRadius: '24px',
      padding: '10px',
      boxShadow: `0 12px 40px rgba(26,23,20,0.18), inset 0 0 0 1px ${accent}33`,
    }}>
      <div style={{
        width: '100%',
        height: '100%',
        background: cream,
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {children}
      </div>
    </div>
  )
}

const STEPS: Step[] = [
  {
    no: '01',
    title: '加 MooLah 為好友',
    desc: '用 LINE 搜尋 @881zhkla 加好友。不需要下載 App，不需要註冊帳號。',
    visual: (
      <PhoneFrame>
        <div style={{ background: '#06C755', padding: '14px 12px', textAlign: 'center', color: 'white', fontWeight: 700, fontSize: '11px', letterSpacing: '0.06em' }}>LINE 加好友</div>
        <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: charcoal, color: oak, fontFamily: 'serif', fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginBottom: '12px' }}>M</div>
          <p style={{ fontSize: '14px', color: charcoal, fontWeight: 700, marginBottom: '4px' }}>MooLah | 預約平台</p>
          <p style={{ fontSize: '10px', color: '#888' }}>@881zhkla</p>
          <button style={{ marginTop: '14px', padding: '8px 22px', background: '#06C755', color: 'white', border: 'none', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>加入好友</button>
        </div>
      </PhoneFrame>
    ),
  },
  {
    no: '02',
    title: '點圖文選單探索職人',
    desc: '加好友後，點下方圖文選單「探索職人」，選類別（髮型 / 寵物 / 汽車 / 美甲）→ 選縣市。',
    visual: (
      <PhoneFrame>
        <div style={{ background: charcoal, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: oak, fontSize: '10px', letterSpacing: '0.16em', fontWeight: 700 }}>MOOLAH</span>
        </div>
        <div style={{ flex: 1, background: charcoal, padding: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {['探索職人', '我的預約', '我的後台', '聯絡客服'].map((label, i) => (
            <div key={i} style={{ background: i === 0 ? oak : 'rgba(166,137,102,0.18)', borderRadius: '8px', padding: '14px 6px', textAlign: 'center', color: i === 0 ? cream : 'rgba(251,249,244,0.55)', fontSize: '10px', fontWeight: 600, border: i === 0 ? `1.5px solid ${cream}` : 'none' }}>{label}</div>
          ))}
        </div>
      </PhoneFrame>
    ),
  },
  {
    no: '03',
    title: '挑職人 + 選時段預約',
    desc: '看作品集、評價、價格，挑一位職人 → 選喜歡的時段 → 確認資料 → 送出。整個流程不超過 60 秒。',
    visual: (
      <PhoneFrame>
        <div style={{ background: cream, padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: '8px', letterSpacing: '0.16em', color: oak, fontWeight: 700 }}>HAIR DESIGNER</p>
          <p style={{ fontSize: '15px', fontWeight: 700, color: charcoal, marginTop: '4px', marginBottom: '2px' }}>Studio Aurelia</p>
          <p style={{ fontSize: '10px', color: oak, marginBottom: '10px' }}>★ 4.9 (286)</p>
          <div style={{ flex: 1, background: sand, borderRadius: '8px', padding: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px' }}>
            {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'].map((t, i) => (
              <div key={t} style={{ background: i === 2 ? oak : 'white', color: i === 2 ? cream : charcoal, padding: '6px 0', textAlign: 'center', borderRadius: '4px', fontSize: '9px', fontWeight: 700 }}>{t}</div>
            ))}
          </div>
          <button style={{ marginTop: '10px', padding: '8px', background: charcoal, color: cream, border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>確認預約</button>
        </div>
      </PhoneFrame>
    ),
  },
  {
    no: '04',
    title: '收 LINE 確認與提醒',
    desc: '預約成功立刻收到 LINE 確認訊息，前一天系統自動提醒，再也不會忘記預約。',
    visual: (
      <PhoneFrame>
        <div style={{ background: '#06C755', padding: '10px 12px', color: 'white', fontSize: '11px', fontWeight: 700 }}>LINE</div>
        <div style={{ flex: 1, background: '#dceadc', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ background: 'white', borderRadius: '10px', padding: '10px', fontSize: '9px', color: charcoal, lineHeight: 1.6 }}>
            <p style={{ fontWeight: 700, marginBottom: '4px' }}>✅ 預約確認</p>
            <p style={{ color: '#888888' }}>Studio Aurelia</p>
            <p style={{ color: '#888888' }}>6/15 11:00 · 招牌設計</p>
          </div>
          <div style={{ background: 'white', borderRadius: '10px', padding: '10px', fontSize: '9px', color: charcoal, lineHeight: 1.6 }}>
            <p style={{ fontWeight: 700, marginBottom: '4px' }}>🔔 前一天提醒</p>
            <p style={{ color: '#888888' }}>明天 11:00 別忘了 ✨</p>
          </div>
        </div>
      </PhoneFrame>
    ),
  },
]

export default function HowItWorksPage() {
  return (
    <>
      <main style={{ minHeight: '100vh', background: cream }}>
        {/* Hero */}
        <section style={{ background: charcoal, padding: '90px 24px 60px', textAlign: 'center', color: cream, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(to right, transparent, ${oak}, transparent)` }} />
          <p style={{ fontSize: 60, marginBottom: 14 }}>🎬</p>
          <p style={{ fontSize: 11, letterSpacing: '0.3em', color: oak, textTransform: 'uppercase', marginBottom: 18 }}>HOW IT WORKS</p>
          <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(2rem,6vw,3.6rem)', fontWeight: 300, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.01em' }}>
            60 秒看懂<br/>MooLah 怎麼用
          </h1>
          <p style={{ fontSize: 'clamp(14px,2vw,16px)', color: 'rgba(251,249,244,0.65)', maxWidth: 560, margin: '0 auto', lineHeight: 1.8 }}>
            加 LINE 好友 → 選類別 → 挑職人 → 一鍵預約<br/>
            不需要下載 App、不需要註冊帳號、不收任何手續費
          </p>
        </section>

        {/* Steps */}
        <section style={{ maxWidth: '980px', margin: '0 auto', padding: '60px 24px 40px' }}>
          {STEPS.map((step, i) => (
            <div key={step.no} style={{
              display: 'flex',
              flexDirection: i % 2 === 0 ? 'row' : 'row-reverse',
              alignItems: 'center',
              gap: '48px',
              marginBottom: '70px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              <div style={{ flex: 1, minWidth: '260px' }}>
                <p style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: '64px',
                  fontWeight: 300,
                  color: oak,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  marginBottom: '12px',
                  opacity: 0.6,
                }}>{step.no}</p>
                <h2 style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: 'clamp(1.6rem,3vw,2rem)',
                  fontWeight: 500,
                  color: charcoal,
                  marginBottom: '14px',
                  lineHeight: 1.3,
                }}>{step.title}</h2>
                <p style={{
                  fontSize: '15px',
                  color: 'rgba(44,40,37,0.65)',
                  lineHeight: 1.85,
                  maxWidth: '420px',
                }}>{step.desc}</p>
              </div>
              <div style={{ flexShrink: 0 }}>
                {step.visual}
              </div>
            </div>
          ))}
        </section>

        {/* Promises */}
        <section style={{ background: sand, padding: '50px 24px' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: 11, letterSpacing: '0.28em', color: oak, textTransform: 'uppercase', marginBottom: 14 }}>OUR PROMISE</p>
            <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: charcoal, marginBottom: 28, fontWeight: 400 }}>三個承諾</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px' }}>
              {[
                { num: '0', label: '抽佣金', desc: '永遠不收一毛抽成' },
                { num: '0', label: 'App 下載', desc: '加 LINE 就能用，零學習' },
                { num: '0', label: '綁約期', desc: '隨時可離開，無解約金' },
              ].map((p, i) => (
                <div key={i} style={{ background: 'white', padding: '24px 20px', borderRadius: '14px', border: `1px solid ${oak}33` }}>
                  <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '48px', color: oak, fontWeight: 300, lineHeight: 1, marginBottom: '4px' }}>{p.num}</p>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: charcoal, marginBottom: '6px', letterSpacing: '0.04em' }}>{p.label}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(44,40,37,0.55)' }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: oak, padding: '50px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.4rem,3vw,2rem)', color: cream, fontWeight: 400, marginBottom: 14 }}>
            準備好開始了嗎？
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(251,249,244,0.7)', marginBottom: 28 }}>
            台灣高雄、台中、台北均有合作職人
          </p>
          <Link href="/discover"
            style={{ display: 'inline-block', padding: '14px 36px', background: charcoal, color: cream, borderRadius: 8, fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 700 }}>
            探索職人 →
          </Link>
        </section>

        {/* Footer */}
        <footer style={{ padding: '24px', textAlign: 'center', background: '#1a1714', color: 'rgba(166,137,102,0.6)', fontSize: 12 }}>
          <p>© 2026 永翔數位有限公司 MooLah · <Link href="/" style={{ color: oak, textDecoration: 'none' }}>回首頁</Link></p>
        </footer>
      </main>
    </>
  )
}
