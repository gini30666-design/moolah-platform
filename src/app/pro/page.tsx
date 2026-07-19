import type { Metadata } from 'next'
import JoinForm from '@/components/JoinForm'
import SiteFooter from '@/components/SiteFooter'
import StickyTrialCTA from '@/components/StickyTrialCTA'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'
const oak = '#A68966'
const charcoal = '#2C2825'
const charcoalDeep = '#1a1714'
const cream = '#fbf9f4'
const sand = '#f5efe6'
const LINE_URL = 'https://line.me/R/ti/p/@492ejbwx'
const DEMO_URL = '/designer-003'

// ⚠️ 廣告專用落地頁 — noindex（不進 Google 索引，避免與 /for-providers SEO 頁重複內容互打）
export const metadata: Metadata = {
  title: '美業職人，該有自己的預約系統 | MooLah 14 天免費試用',
  description: '客人自己約、系統自動提醒、你專心做手藝。0 抽佣、不綁約、免費試用。加 LINE 30 秒開通專屬預約頁。',
  robots: { index: false, follow: false },
  alternates: { canonical: `${BASE_URL}/pro` },
}

function LineIcon({ size = 20 }: { size?: number }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: size, height: size }}><path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
}

export default function ProLandingPage() {
  return (
    <>
      <main style={{ background: cream, color: charcoal, overflowX: 'hidden' }}>

        {/* ══════ HERO：痛點鉤子 + 首屏 LINE 綠鈕（不用滑就能行動）══════ */}
        <section style={{ position: 'relative', background: charcoalDeep, color: cream, minHeight: '92svh', display: 'flex', flexDirection: 'column' }}>
          {/* 背景沙龍圖 + 深色漸層壓字 */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/pro-hero.jpg" alt="溫暖質感的個人工作室" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(26,23,20,0.82) 0%, rgba(26,23,20,0.6) 45%, rgba(26,23,20,0.95) 100%)` }} />
          </div>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(to right, transparent, ${oak}, transparent)`, zIndex: 2 }} />

          {/* 頂條：品牌 + 小登入返回 */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px' }}>
            <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '20px', letterSpacing: '0.18em', color: cream }}>MOOLAH</span>
            <span style={{ fontSize: '11px', color: 'rgba(251,249,244,0.5)' }}>美業預約系統</span>
          </div>

          {/* 主訴求 */}
          <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '10px 24px 40px', maxWidth: '640px', margin: '0 auto', width: '100%', textAlign: 'center' }}>
            <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300, fontSize: 'clamp(2.3rem, 8vw, 3.6rem)', lineHeight: 1.18, letterSpacing: '-0.01em', marginBottom: '20px' }}>
              還在手動回<br />一整天的預約訊息？
            </h1>
            <p style={{ fontSize: 'clamp(15px, 4.2vw, 18px)', lineHeight: 1.85, color: 'rgba(251,249,244,0.82)', marginBottom: '30px' }}>
              讓客人自己線上約、系統自動提醒，<br />
              <span style={{ color: oak, fontWeight: 600 }}>你只要專心做手藝。</span>
            </p>

            {/* 首屏 LINE 綠鈕（主 CTA）*/}
            <a href={LINE_URL} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#06C755', color: '#fff', padding: '18px 24px', borderRadius: '14px', fontSize: '16px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 26px rgba(6,199,85,0.4)', marginBottom: '14px' }}>
              <LineIcon /> 加 LINE 開通免費試用
            </a>
            <a href={DEMO_URL} style={{ display: 'inline-block', fontSize: '13px', color: 'rgba(251,249,244,0.7)', textDecoration: 'underline', textUnderlineOffset: '4px', marginBottom: '26px' }}>
              先看真實範例頁 →
            </a>

            {/* 信任 chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
              {['免費試用', '0 抽佣', '不綁約', '24h 上線', '免下載 App'].map(t => (
                <span key={t} style={{ fontSize: '12px', color: 'rgba(251,249,244,0.85)', padding: '7px 14px', borderRadius: '99px', border: '1px solid rgba(166,137,102,0.4)', background: 'rgba(166,137,102,0.1)' }}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ 痛點 → 解法（精選 4，不倒 9 個功能）══════ */}
        <section style={{ padding: '56px 22px 40px', maxWidth: '620px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.7rem, 6vw, 2.3rem)', fontWeight: 400, color: charcoal, textAlign: 'center', marginBottom: '32px', lineHeight: 1.3 }}>
            你每天煩的事，<br />它都幫你接住了
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              ['做到一半 LINE 一直跳、常常漏單', '客人自己線上約，時段自動排好、不再漏接'],
              ['客人放鳥（no-show）白等一場', '系統前一天自動 LINE 提醒，準時赴約'],
              ['IG 接案要客人一直私訊喬時間', '專屬預約頁貼 IG bio，客人點一下就約'],
              ['不會用電腦、不想學新軟體', 'LINE 一句話操作，零學習門檻'],
            ].map(([pain, sol], i) => (
              <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '18px 20px', border: `1px solid ${oak}22`, boxShadow: '0 1px 8px rgba(26,23,20,0.04)' }}>
                <p style={{ fontSize: '13px', color: '#b4533a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ flexShrink: 0 }}>✕</span>{pain}
                </p>
                <p style={{ fontSize: '15px', color: charcoal, fontWeight: 600, lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                  <span style={{ color: oak, flexShrink: 0 }}>→</span>{sol}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════ 產品證明：看它真的長怎樣 ══════ */}
        <section style={{ padding: '20px 22px 48px', maxWidth: '620px', margin: '0 auto' }}>
          <div style={{ background: charcoalDeep, borderRadius: '22px', padding: '30px 26px', textAlign: 'center', color: cream, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(to right, transparent, ${oak}, transparent)` }} />
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.6rem', fontWeight: 300, marginBottom: '10px' }}>不用想像，直接看</p>
            <p style={{ fontSize: '13.5px', color: 'rgba(251,249,244,0.6)', lineHeight: 1.75, marginBottom: '22px' }}>
              這是一位合作職人的真實預約頁——<br />作品集、服務價格、可約時段，客人在 LINE 裡就能完成預約。
            </p>
            <a href={DEMO_URL} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: oak, color: charcoalDeep, padding: '13px 26px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
              看真實範例頁 →
            </a>
          </div>
        </section>

        {/* ══════ 定價（誠實・無假數據）══════ */}
        <section style={{ padding: '20px 22px 52px', maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ background: sand, borderRadius: '22px', padding: '36px 28px', border: `1px solid ${oak}30` }}>
            <p style={{ fontSize: '13px', color: oak, fontWeight: 600, marginBottom: '14px' }}>標準方案・先免費試用</p>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(2.8rem, 12vw, 4rem)', fontWeight: 300, color: charcoal, lineHeight: 1, marginBottom: '8px' }}>
              NT$ 699<span style={{ fontSize: '0.35em', color: 'rgba(44,40,37,0.5)' }}> / 月</span>
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(44,40,37,0.55)', marginBottom: '24px' }}>先免費試用全功能，喜歡再留下</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'left' }}>
              {['✓ 0% 抽佣，永不抽成', '✓ 不綁約、無解約金', '✓ 免費客製立牌', '✓ 24 小時內上線'].map(t => (
                <p key={t} style={{ fontSize: '13px', color: charcoal, padding: '10px 12px', background: 'rgba(166,137,102,0.1)', borderRadius: '10px', lineHeight: 1.5 }}>{t}</p>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ 最終 CTA：LINE 主 + 表單次 ══════ */}
        <section id="apply" style={{ padding: '10px 22px 60px', maxWidth: '620px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.7rem, 6vw, 2.3rem)', fontWeight: 400, color: charcoal, lineHeight: 1.3, marginBottom: '10px' }}>
              30 秒開通，今天就能接單
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(44,40,37,0.6)', lineHeight: 1.7 }}>
              加 LINE 回「試用」，真人一對一幫你把專屬預約頁設好。
            </p>
          </div>

          <a href={LINE_URL} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#06C755', color: '#fff', padding: '18px 24px', borderRadius: '14px', fontSize: '16px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 26px rgba(6,199,85,0.35)', marginBottom: '20px' }}>
            <LineIcon /> 加 LINE 開通免費試用
          </a>

          <div style={{ background: 'white', padding: '26px 22px', borderRadius: '18px', border: `1px solid ${oak}22` }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: charcoal, marginBottom: '4px' }}>不方便聊？留下資料</p>
            <p style={{ fontSize: '13px', color: 'rgba(44,40,37,0.55)', marginBottom: '22px' }}>我們 24 小時內主動聯絡你，幫你開通試用</p>
            <JoinForm />
          </div>
        </section>

      </main>
      <SiteFooter />
      <StickyTrialCTA />
    </>
  )
}
