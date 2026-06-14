import type { Metadata } from 'next'
import Link from 'next/link'
import JoinForm from '@/components/JoinForm'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

const oak = '#A68966'
const charcoal = '#2C2825'
const charcoalDeep = '#1a1714'
const cream = '#fbf9f4'
const sand = '#f5efe6'

export const metadata: Metadata = {
  title: '設計師加入 MooLah | 美業職人專屬預約管理平台',
  description: 'MooLah 為髮型設計師、寵物美容師、汽車美容師、美甲師打造的智慧預約管理平台。NT$699 月費、14 天免費試用、0 抽佣、不綁約。LINE 一鍵預約，自動排程，雙向通知。',
  alternates: { canonical: `${BASE_URL}/for-providers` },
  openGraph: {
    title: '設計師加入 MooLah',
    description: '14 天免費試用 · NT$699 月費 · 0 抽佣 · 不綁約。LINE 一鍵預約管理平台',
    url: `${BASE_URL}/for-providers`,
  },
}

type Feature = {
  icon: React.ReactNode
  title: string
  desc: string
}

// 線條圖示元件 — oak 色、細線、24x24 viewBox（match MooLah 視覺）
const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  style: { width: '24px', height: '24px' },
}

const IconCalendarSmart = () => (
  <svg {...iconProps}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 11h18M9 16l2 2 4-4" /></svg>
)
const IconLineChat = () => (
  <svg {...iconProps}><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
)
const IconWorkPortfolio = () => (
  <svg {...iconProps}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></svg>
)
const IconChart = () => (
  <svg {...iconProps}><line x1="3" y1="21" x2="21" y2="21" /><rect x="6" y="13" width="3" height="8" /><rect x="11" y="9" width="3" height="12" /><rect x="16" y="5" width="3" height="16" /></svg>
)
const IconRetention = () => (
  <svg {...iconProps}><path d="M21 12a9 9 0 11-3-6.7" /><polyline points="21 4 21 10 15 10" /></svg>
)
const IconShield = () => (
  <svg {...iconProps}><path d="M12 2L4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z" /><line x1="9" y1="12" x2="15" y2="12" /></svg>
)
const IconBolt = () => (
  <svg {...iconProps}><polygon points="13 2 4 14 12 14 11 22 20 10 12 10 13 2" /></svg>
)
const IconCode = () => (
  <svg {...iconProps}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
)
const IconReceipt = () => (
  <svg {...iconProps}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></svg>
)

// 功能介紹 — 只講「能做什麼」、不講「怎麼做」（避免抄襲）
const FEATURES: Feature[] = [
  { icon: <IconCalendarSmart />, title: '智慧時段管理', desc: '自動排程、衝突阻擋、緊湊填補空檔，讓你每天最佳化營收。' },
  { icon: <IconLineChat />,      title: 'LINE 雙向通知', desc: '客人預約你收到、你確認客人也收到，前一天系統自動推播提醒。' },
  { icon: <IconWorkPortfolio />, title: '專屬作品頁面', desc: '個人預約頁含作品集、評價、服務項目，貼到 IG bio 即可接案。' },
  { icon: <IconChart />,         title: '本月對帳儀表板', desc: '今日成交、本月營收、應付月費、回購率一目了然。' },
  { icon: <IconRetention />,     title: '回購率分析', desc: '近 90 天回頭客 vs 新客比例 + 平均回購間隔，幫你看清經營體質。' },
  { icon: <IconShield />,        title: '客人黑名單', desc: '惡意 no-show 客人系統自動標記，3 次後拒絕再次預約。' },
  { icon: <IconBolt />,          title: '快捷指令操作', desc: '透過 LINE 一句話完成今日查詢、休假設定、no-show 標記。' },
  { icon: <IconCode />,          title: '嵌入式 widget', desc: '把預約時段嵌入你的 IG bio link / 個人網站，零跳轉接單。' },
  { icon: <IconReceipt />,       title: '月度自動對帳', desc: '每月 1 號自動生成 PDF 對帳單，LINE 推播給你。' },
]

const HIGHLIGHTS = [
  { val: 'NT$ 699', label: '月費', sub: '14 天免費試用 · 隨時可終止' },
  // 試用：14 天全功能、上限 20 筆預約；不需試用可直接加入
  { val: '0%', label: '抽佣', sub: '永不收佣金' },
  { val: '0 天', label: '綁約期', sub: '提前 1 週通知' },
]

const FAQ = [
  {
    q: '需要綁約嗎？',
    a: '不需要。MooLah 採月費制（14 天免費試用，之後 NT$699/月），不抽佣、無綁約、無解約金。任何時候想停止合作，提前 1 週書面通知即可。',
  },
  {
    q: '客人需要下載 App 嗎？',
    a: '不用。客戶透過 LINE 一鍵預約，零學習門檻，這也是 MooLah 跟其他平台最大的差異。',
  },
  {
    q: '上線需要多久？',
    a: '24 小時內。提供基本資料（姓名 / 服務項目 / 作品照）後，MooLah 團隊會在 24 小時內完成設定，你只需要點連結認領帳號即可開始接案。',
  },
  {
    q: '價格會漲嗎？',
    a: '如果價格調整，會提前 30 天通知。初期合作夥伴享有原價保證。',
  },
  {
    q: 'MooLah 跟其他平台差在哪？',
    a: '三件事：① 客人不用下載 App（LINE 直接預約）② 0% 抽佣（永不抽成）③ 月費比競品低 60–80%。',
  },
  {
    q: '我的客戶資料安全嗎？',
    a: '預約資料儲存在你個人後台，MooLah 僅作為平台工具。合約終止後 7 個工作日內移除所有資料。',
  },
]

export default function ForProvidersPage() {
  return (
    <>
      <SiteNav />
      <main style={{ minHeight: '100vh', background: cream }} className="pt-16 md:pt-20">
        {/* Hero */}
        <section style={{ background: charcoalDeep, padding: '90px 24px 60px', textAlign: 'center', color: cream, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(to right, transparent, ${oak}, transparent)` }} />
          <p style={{ fontSize: '11px', letterSpacing: '0.3em', color: oak, textTransform: 'uppercase', marginBottom: '16px' }}>FOR BEAUTY PROFESSIONALS</p>
          <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(2.4rem,7vw,4.5rem)', fontWeight: 300, lineHeight: 1.15, marginBottom: '20px', letterSpacing: '-0.01em' }}>
            為台灣美業職人<br/>
            <span style={{ fontStyle: 'italic', color: oak }}>量身打造</span>的智慧預約平台
          </h1>
          <p style={{ fontSize: 'clamp(15px,2.2vw,18px)', color: 'rgba(251,249,244,0.65)', maxWidth: '640px', margin: '0 auto 32px', lineHeight: 1.8 }}>
            告別 LINE 個人帳號的亂、紙本排程的累<br/>
            讓系統替你接單、排程、催客人、收評價
          </p>
          <div style={{ display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
            <a href="#apply" style={{ background: oak, color: cream, padding: '14px 32px', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 600 }}>立即申請 →</a>
            <a href="#features" style={{ border: `1px solid ${oak}66`, color: cream, padding: '14px 32px', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none' }}>看功能介紹</a>
          </div>

          {/* Stats highlight */}
          <div style={{ marginTop: '56px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '760px', margin: '56px auto 0' }}>
            {HIGHLIGHTS.map(h => (
              <div key={h.label} style={{ borderTop: `1px solid ${oak}33`, paddingTop: '18px' }}>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 300, color: oak, lineHeight: 1, marginBottom: '8px' }}>{h.val}</p>
                <p style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(251,249,244,0.55)', textTransform: 'uppercase', marginBottom: '4px' }}>{h.label}</p>
                <p style={{ fontSize: '10px', color: 'rgba(251,249,244,0.35)' }}>{h.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pain Points → Solutions */}
        <section style={{ padding: '70px 24px 40px', maxWidth: '980px', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.28em', color: oak, textTransform: 'uppercase', textAlign: 'center', marginBottom: '16px' }}>YOUR PAIN, OUR SOLUTION</p>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: charcoal, textAlign: 'center', marginBottom: '40px', fontWeight: 400 }}>
            你每天遇到的事，我們已經幫你想好了
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {[
              ['客人 LINE 訊息淹沒，常常漏單', '所有預約自動排表，永不漏接'],
              ['客人 no-show 一個月損失數千', 'LINE 自動前一天提醒，no-show 降 60%'],
              ['不會用電腦、不想學新軟體', '一句話就能完成的 LINE OA 操作'],
              ['IG 接案要客人私訊很麻煩', '專屬預約頁，連結貼 bio 直接收單'],
            ].map(([pain, sol], i) => (
              <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '20px 22px', border: `1px solid ${oak}22` }}>
                <p style={{ fontSize: '13px', color: '#c25', marginBottom: '8px' }}>✕ {pain}</p>
                <p style={{ fontSize: '14px', color: charcoal, fontWeight: 600, lineHeight: 1.6 }}>→ {sol}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" style={{ padding: '60px 24px', background: sand }}>
          <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.28em', color: oak, textTransform: 'uppercase', textAlign: 'center', marginBottom: '16px' }}>FEATURES</p>
            <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: charcoal, textAlign: 'center', marginBottom: '12px', fontWeight: 400 }}>
              完整功能 · <span style={{ fontStyle: 'italic', color: oak }}>一次到位</span>
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(44,40,37,0.6)', textAlign: 'center', marginBottom: '36px', maxWidth: '560px', margin: '0 auto 36px' }}>
              所有功能在月費內，沒有隱藏費用、沒有加購方案
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {FEATURES.map(f => (
                <div key={f.title} style={{ background: 'white', borderRadius: '14px', padding: '24px 22px 22px', border: `1px solid ${oak}22`, transition: 'all 0.25s' }}>
                  <div style={{
                    width: '44px', height: '44px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${oak}12`,
                    color: oak,
                    borderRadius: '10px',
                    marginBottom: '14px',
                    border: `1px solid ${oak}25`,
                  }}>
                    {f.icon}
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: charcoal, marginBottom: '6px', letterSpacing: '0.02em' }}>{f.title}</p>
                  <p style={{ fontSize: '12.5px', color: 'rgba(44,40,37,0.6)', lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section style={{ padding: '60px 24px', background: cream }}>
          <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.28em', color: oak, textTransform: 'uppercase', marginBottom: '14px' }}>PRICING</p>
            <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: charcoal, marginBottom: '32px', fontWeight: 400 }}>
              透明定價 · 沒有意外
            </h2>
            <div style={{ background: charcoalDeep, color: cream, borderRadius: '20px', padding: '40px 30px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(to right, transparent, ${oak}, transparent)` }} />
              <p style={{ fontSize: '11px', letterSpacing: '0.24em', color: oak, marginBottom: '14px' }}>標準方案 · 14 天免費試用</p>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(3rem,8vw,5rem)', fontWeight: 300, color: cream, lineHeight: 1, marginBottom: '6px' }}>
                NT$ 699<span style={{ fontSize: '0.4em', color: 'rgba(251,249,244,0.55)' }}> / 月</span>
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(251,249,244,0.5)', marginBottom: '28px' }}>14 天免費試用（全功能・上限 20 筆預約）· 不需試用可直接加入</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', textAlign: 'left' }}>
                {['✓ 0% 抽佣', '✓ 不綁約', '✓ 無解約金', '✓ 24h 上線'].map(t => (
                  <p key={t} style={{ fontSize: '13px', color: oak, padding: '8px 12px', background: 'rgba(166,137,102,0.1)', borderRadius: '6px' }}>{t}</p>
                ))}
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(44,40,37,0.45)', marginTop: '20px' }}>
              寵物美容、汽車美容、美甲類別開放中，方案另議。聯絡我們了解詳情。
            </p>
          </div>
        </section>

        {/* Apply Form + LINE QR */}
        <section id="apply" style={{ padding: '70px 24px', background: sand }}>
          <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
            <div>
              <p style={{ fontSize: '11px', letterSpacing: '0.28em', color: oak, textTransform: 'uppercase', marginBottom: '14px' }}>APPLY NOW</p>
              <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: charcoal, marginBottom: '16px', fontWeight: 400, lineHeight: 1.25 }}>
                準備好開始了嗎？
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(44,40,37,0.65)', lineHeight: 1.8, marginBottom: '32px' }}>
                填寫下方表單，我們在 24 小時內聯絡你，協助完成上線設定。<br/>
                或直接掃 QR 加 LINE，跟 MooLah 團隊聊聊。
              </p>

              <div style={{ background: 'white', padding: '24px', borderRadius: '14px', border: `1px solid ${oak}33`, display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/line_oa_partner_qr.png" alt="MooLah 招商 LINE QR" width={120} height={120} style={{ display: 'block', borderRadius: '8px' }} />
                <div>
                  <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: oak, textTransform: 'uppercase', marginBottom: '6px' }}>LINE OA</p>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: charcoal, marginBottom: '10px' }}>@492ejbwx</p>
                  <a href="https://line.me/R/ti/p/@492ejbwx" target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-block', background: '#06C755', color: 'white', padding: '8px 18px', fontSize: '12px', fontWeight: 600, borderRadius: '6px', textDecoration: 'none' }}>
                    加好友 →
                  </a>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', padding: '32px 28px', borderRadius: '16px', border: `1px solid ${oak}22` }}>
              <p style={{ fontSize: '12px', letterSpacing: '0.2em', color: oak, textTransform: 'uppercase', marginBottom: '8px' }}>申請表單</p>
              <p style={{ fontSize: '14px', color: 'rgba(44,40,37,0.55)', marginBottom: '24px' }}>填完 24 小時內專人聯絡</p>
              <JoinForm />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: '60px 24px 80px', maxWidth: '760px', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.28em', color: oak, textTransform: 'uppercase', textAlign: 'center', marginBottom: '14px' }}>FAQ</p>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: charcoal, textAlign: 'center', marginBottom: '32px', fontWeight: 400 }}>
            常見問題
          </h2>
          {FAQ.map((f, i) => (
            <details key={i} style={{ background: 'white', borderRadius: '12px', marginBottom: '10px', padding: '16px 22px', border: `1px solid ${oak}22` }}>
              <summary style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: charcoal, listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{f.q}</span>
                <span style={{ color: oak, fontSize: '18px' }}>+</span>
              </summary>
              <p style={{ marginTop: '14px', fontSize: '13px', color: 'rgba(44,40,37,0.7)', lineHeight: 1.9 }}>{f.a}</p>
            </details>
          ))}
        </section>

      </main>
      <SiteFooter />
    </>
  )
}
