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

        {/* ══════ 痛點 → 解法（緊湊掃讀、有圖示、破單調白卡）══════ */}
        <section style={{ padding: '48px 22px 42px', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.6rem, 5.5vw, 2.1rem)', fontWeight: 400, color: charcoal, textAlign: 'center', marginBottom: '8px', lineHeight: 1.3 }}>
            你每天煩的事，它都接住了
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(44,40,37,0.5)', textAlign: 'center', marginBottom: '26px' }}>左邊是現在，右邊是用了之後</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              ['📱', 'LINE 訊息淹沒、常漏單', '客人自己約，時段自動排好'],
              ['🕐', '客人放鳥、白等一場', '前一天自動提醒，準時赴約'],
              ['🔗', 'IG 接案一直私訊喬時間', '預約頁貼 bio，點一下就約'],
              ['✨', '不會電腦、不想學軟體', 'LINE 一句話操作，零門檻'],
            ].map(([icon, pain, sol], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'stretch', borderRadius: '14px', overflow: 'hidden', border: `1px solid ${oak}22` }}>
                {/* 左：痛（淡紅底、劃掉感）*/}
                <div style={{ flex: 1, background: 'rgba(180,83,58,0.06)', padding: '15px 14px', display: 'flex', alignItems: 'center', gap: '8px', borderRight: `1px solid ${oak}18` }}>
                  <span style={{ fontSize: '17px', flexShrink: 0, filter: 'grayscale(0.3)', opacity: 0.85 }}>{icon}</span>
                  <span style={{ fontSize: '12.5px', color: 'rgba(120,60,48,0.85)', lineHeight: 1.45, textDecoration: 'line-through', textDecorationColor: 'rgba(180,83,58,0.4)' }}>{pain}</span>
                </div>
                {/* 右：解（橡木金強調）*/}
                <div style={{ flex: 1.05, background: 'white', padding: '15px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: oak, fontSize: '15px', flexShrink: 0, fontWeight: 700 }}>→</span>
                  <span style={{ fontSize: '13px', color: charcoal, fontWeight: 600, lineHeight: 1.45 }}>{sol}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════ 產品證明：主動秀真實截圖（不只給連結）══════ */}
        <section style={{ padding: '30px 0 48px', background: charcoalDeep, color: cream, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(to right, transparent, ${oak}, transparent)` }} />
          <div style={{ textAlign: 'center', padding: '10px 24px 22px', maxWidth: '600px', margin: '0 auto' }}>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.6rem, 6vw, 2.1rem)', fontWeight: 300, marginBottom: '8px' }}>你的客人，會看到這個</p>
            <p style={{ fontSize: '13.5px', color: 'rgba(251,249,244,0.6)', lineHeight: 1.7 }}>
              選服務、挑時段、送出——全程在 LINE 裡完成，不用下載 App。
            </p>
          </div>
          {/* 兩張真實手機截圖橫向排 */}
          <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', padding: '4px 24px 6px', scrollSnapType: 'x proximity', WebkitOverflowScrolling: 'touch' }}>
            {[
              { src: '/pro-screen-1.jpg', cap: '選服務・看價格' },
              { src: '/pro-screen-2.jpg', cap: '挑喜歡的時段' },
            ].map(s => (
              <figure key={s.src} style={{ flex: '0 0 auto', width: '210px', scrollSnapAlign: 'center', margin: 0 }}>
                <div style={{ borderRadius: '20px', overflow: 'hidden', border: `1px solid rgba(166,137,102,0.35)`, boxShadow: '0 12px 34px rgba(0,0,0,0.4)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt={s.cap} style={{ width: '100%', display: 'block' }} />
                </div>
                <figcaption style={{ fontSize: '12px', color: 'rgba(251,249,244,0.55)', textAlign: 'center', marginTop: '10px' }}>{s.cap}</figcaption>
              </figure>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <a href={DEMO_URL} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: oak, color: charcoalDeep, padding: '13px 26px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
              親手體驗真實範例頁 →
            </a>
          </div>
        </section>

        {/* ══════ 定價：免費試用為主角、699 為次要（降低衝動客的價格戒心）══════ */}
        <section style={{ padding: '20px 22px 52px', maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ background: charcoalDeep, color: cream, borderRadius: '22px', padding: '38px 28px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(to right, transparent, ${oak}, transparent)` }} />
            {/* 主角：免費試用 */}
            <span style={{ display: 'inline-block', fontSize: '12px', fontWeight: 700, color: charcoalDeep, background: oak, padding: '6px 16px', borderRadius: '99px', marginBottom: '18px', letterSpacing: '0.04em' }}>限時開放</span>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(2.6rem, 11vw, 3.8rem)', fontWeight: 300, color: cream, lineHeight: 1.05, marginBottom: '10px' }}>
              先<span style={{ color: oak, fontStyle: 'italic' }}>免費</span>試用<br />全部功能
            </p>
            <p style={{ fontSize: '13.5px', color: 'rgba(251,249,244,0.6)', marginBottom: '22px', lineHeight: 1.7 }}>
              專屬預約頁、自動提醒、後台管理，<br />先用起來，喜歡再留下。
            </p>
            {/* 次要：699 一行帶過 */}
            <p style={{ fontSize: '12.5px', color: 'rgba(251,249,244,0.42)', marginBottom: '26px' }}>
              試用後 NT$699／月・0 抽佣・不綁約・隨時可停
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px', textAlign: 'left' }}>
              {['✓ 0% 抽佣', '✓ 不綁約無解約金', '✓ 免費客製立牌', '✓ 24h 上線'].map(t => (
                <p key={t} style={{ fontSize: '12.5px', color: 'rgba(251,249,244,0.82)', padding: '10px 12px', background: 'rgba(166,137,102,0.14)', borderRadius: '10px', border: '1px solid rgba(166,137,102,0.22)' }}>{t}</p>
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
