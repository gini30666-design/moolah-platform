import type { Metadata } from 'next'
import LineLink from '@/components/LineLink'
import { OA_B2B } from '@/lib/lineOA'
import Link from 'next/link'
import JoinForm from '@/components/JoinForm'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'
import StickyTrialCTA from '@/components/StickyTrialCTA'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

const oak = '#A68966'
const charcoal = '#2C2825'
const charcoalDeep = '#1a1714'
const cream = '#fbf9f4'
const sand = '#f5efe6'

export const metadata: Metadata = {
  title: '美業預約系統 MooLah | 14 天免費試用・LINE 線上預約系統',
  description: 'MooLah 美業預約系統——為髮型設計師、美甲師、美容師、採耳師、按摩舒壓、寵物美容、汽車美容職人打造的 LINE 線上預約系統。14 天免費試用、0 抽佣、不綁約，自動排程、雙向通知、減少爽約。',
  alternates: { canonical: `${BASE_URL}/for-providers` },
  openGraph: {
    title: '美業預約系統 MooLah — 14 天免費試用',
    description: '14 天免費試用 · 0 抽佣 · 不綁約。LINE 線上預約系統，客人自己約、你專心做手藝。',
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
  // 2026-08-11 加：約 1/3 招商進線第一句就問儲值。措辭必須守住「我們不碰錢」這條線。
  { icon: <IconReceipt />,       title: '儲值金・次卡', desc: '客人在店裡付給你，系統只記帳。餘額客人自己在 LINE 看得到，每次扣款自動通知。0 抽佣、錢不經過平台。' },
  { icon: <IconShield />,        title: '客人黑名單', desc: '惡意 no-show 客人系統自動標記，3 次後拒絕再次預約。' },
  { icon: <IconBolt />,          title: '快捷指令操作', desc: '透過 LINE 一句話完成今日查詢、休假設定、no-show 標記。' },
  { icon: <IconCode />,          title: '嵌入式 widget', desc: '把預約時段嵌入你的 IG bio link / 個人網站，零跳轉接單。' },
  { icon: <IconReceipt />,       title: '月度自動對帳', desc: '每月 1 號自動生成 PDF 對帳單，LINE 推播給你。' },
]

const HIGHLIGHTS = [
  { val: 'NT$ 699', label: '月費', sub: '14 天免費試用 · 隨時可終止' },
  // 試用：14 天全功能、上限 30 筆預約；不需試用可直接加入
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
    q: '有儲值卡或次卡功能嗎？',
    a: '有，儲值金和次卡都能開。但錢不經過 MooLah——客人一樣在店裡付給你（現金、轉帳、你自己的刷卡機都可以），系統只負責記帳：餘額多少、扣了幾次、什麼時候到期。客人在 LINE 裡隨時查得到餘額，每次扣款也會自動收到通知；紀錄不能修改或刪除，按錯只能新增一筆更正，原紀錄照樣留著。因為我們不碰金流，所以不抽成，錢也不會卡在平台。',
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
    a: '三件事：① 客人不用下載 App，在 LINE 裡直接完成預約 ② 0% 抽佣，客人付你多少全部是你的 ③ 單一費率 NT$699/月，不分方案、不綁約。',
  },
  {
    q: '我的客戶資料安全嗎？',
    a: '預約資料儲存在你個人後台，MooLah 僅作為平台工具。合約終止後 7 個工作日內移除所有資料。',
  },
  {
    q: 'MooLah 支援哪些行業？',
    a: '髮型設計、美甲美睫、採耳、做臉美容、按摩舒壓、寵物美容、汽車美容，以及各類個人工作室。系統以「服務項目 + 時長 + 價格」為單位，任何需要預約時段的服務業都適用。',
  },
  {
    q: '沒有實體店面可以用嗎？',
    a: '可以。個人工作室、在家接案、到府服務都適用，系統不需要你有店面或櫃檯人員。',
  },
  {
    q: 'MooLah 的月費是多少？',
    a: 'NT$699／月，先 14 天免費試用（全功能、上限 30 筆預約、不需信用卡）。工作室或多人團隊可另外洽詢報價。',
  },
  {
    q: 'MooLah 是誰開發的？',
    a: 'MooLah 由台灣的永翔數位有限公司（統一編號 62130226）開發與營運，公司登記於屏東縣，服務台灣各縣市的美業與服務業職人。',
  },
]

/**
 * AEO / 結構化資料：讓 Google 與 AI 引擎（AI Overviews、ChatGPT、Perplexity）
 * 讀得懂 MooLah 是什麼產品、多少錢、解決什麼問題，並可直接引用 FAQ 答案。
 */
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': `${BASE_URL}/for-providers#software`,
      name: 'MooLah 美業預約系統',
      alternateName: ['MooLah', 'MooLah 線上預約系統'],
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: '預約管理系統',
      operatingSystem: 'Web, LINE LIFF（免下載 App）',
      url: `${BASE_URL}/for-providers`,
      inLanguage: 'zh-TW',
      description:
        'MooLah 是為台灣美業與服務業職人打造的 LINE 線上預約系統。消費者不需下載 App，在 LINE 內即可完成預約；職人透過後台管理服務項目、時段排班、作品集與客戶紀錄，系統自動發送預約確認與到店提醒。',
      featureList: [
        'LINE 一鍵預約（消費者免下載 App、免註冊）',
        '依服務時長自動鎖定時段，避免重複預約',
        '雙向 LINE 自動通知（預約成功、前一日提醒、取消通知）',
        '專屬職人預約頁與作品集',
        '排班、公休與休假日設定',
        '客戶備註、標籤與服務歷史照片紀錄',
        '候補名單與爽約標記',
        '每週與每月營運成績單推播',
        '免費客製實體立牌（QR 掃碼預約）',
      ],
      offers: {
        '@type': 'Offer',
        '@id': `${BASE_URL}/for-providers#offer`,
        price: '699',
        priceCurrency: 'TWD',
        availability: 'https://schema.org/InStock',
        url: `${BASE_URL}/for-providers`,
        description: 'NT$699／月，0% 抽佣、不綁約，提供 14 天免費試用（全功能，上限 30 筆預約）。',
        eligibleRegion: { '@type': 'Country', name: 'Taiwan' },
      },
      provider: {
        '@type': 'Organization',
        name: '永翔數位有限公司',
        taxID: '62130226',
        url: BASE_URL,
        email: 'service@moolah.studio',
      },
      audience: {
        '@type': 'BusinessAudience',
        name: '美業與服務業職人',
        audienceType: '髮型設計師、美甲師、美睫師、採耳師、美容師、按摩舒壓師、寵物美容師、汽車美容師、個人工作室',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': `${BASE_URL}/for-providers#faq`,
      mainEntity: FAQ.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
}

export default function ForProvidersPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteNav />
      <main style={{ minHeight: '100vh', background: cream }} className="pt-16 md:pt-20">
        {/* Hero */}
        <section style={{ background: charcoalDeep, padding: '90px 24px 60px', textAlign: 'center', color: cream, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(to right, transparent, ${oak}, transparent)` }} />
          <p style={{ fontSize: '11px', letterSpacing: '0.3em', color: oak, textTransform: 'uppercase', marginBottom: '16px' }}>FOR BEAUTY PROFESSIONALS</p>
          <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(2.4rem,7vw,4.5rem)', fontWeight: 300, lineHeight: 1.15, marginBottom: '20px', letterSpacing: '-0.01em' }}>
            為台灣美業職人<br/>
            <span style={{ fontStyle: 'italic', color: oak }}>量身打造</span>的智慧預約系統
          </h1>
          <p style={{ fontSize: 'clamp(15px,2.2vw,18px)', color: 'rgba(251,249,244,0.65)', maxWidth: '640px', margin: '0 auto 32px', lineHeight: 1.8 }}>
            告別 LINE 個人帳號的亂、紙本排程的累<br/>
            讓系統替你接單、排程、催客人、收評價
          </p>
          <div style={{ display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
            <a href="#apply" style={{ background: oak, color: cream, padding: '14px 32px', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 600 }}>開通 14 天免費試用 →</a>
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
        <section data-animate style={{ padding: '70px 24px 40px', maxWidth: '980px', margin: '0 auto' }}>
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
        <section id="features" data-animate style={{ padding: '60px 24px', background: sand }}>
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
        <section data-animate style={{ padding: '60px 24px', background: cream }}>
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
              <p style={{ fontSize: '13px', color: 'rgba(251,249,244,0.5)', marginBottom: '28px' }}>14 天免費試用（全功能・上限 30 筆預約）· 不需試用可直接加入</p>
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
        <section id="apply" data-animate style={{ padding: '70px 24px', background: sand }}>
          <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
            <div>
              <p style={{ fontSize: '11px', letterSpacing: '0.28em', color: oak, textTransform: 'uppercase', marginBottom: '14px' }}>FREE TRIAL</p>
              <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: charcoal, marginBottom: '16px', fontWeight: 400, lineHeight: 1.25 }}>
                加 LINE 回「試用」<br/>30 秒開通免費試用
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(44,40,37,0.65)', lineHeight: 1.8, marginBottom: '24px' }}>
                14 天全功能免費體驗，你的專屬預約頁、作品集、自動提醒一次備好。<br/>
                不用會技術、真人一對一協助上線。
              </p>

              <LineLink source="for_providers_1" oaId={OA_B2B} track style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#06C755', color: 'white', padding: '17px 24px', fontSize: '15px', fontWeight: 700, borderRadius: '12px', textDecoration: 'none', marginBottom: '16px', boxShadow: '0 4px 14px rgba(6,199,85,0.35)' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}><path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                加 LINE 開通 14 天免費試用
              </LineLink>

              <div style={{ background: 'white', padding: '18px 20px', borderRadius: '14px', border: `1px solid ${oak}33`, display: 'flex', alignItems: 'center', gap: '18px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/line_oa_partner_qr.png" alt="MooLah 招商 LINE QR" width={92} height={92} style={{ display: 'block', borderRadius: '8px' }} />
                <div>
                  <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: oak, textTransform: 'uppercase', marginBottom: '4px' }}>電腦瀏覽？掃 QR 加 LINE</p>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: charcoal }}>@492ejbwx</p>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', padding: '32px 28px', borderRadius: '16px', border: `1px solid ${oak}22` }}>
              <p style={{ fontSize: '12px', letterSpacing: '0.2em', color: oak, textTransform: 'uppercase', marginBottom: '8px' }}>不想聊？留下資料</p>
              <p style={{ fontSize: '14px', color: 'rgba(44,40,37,0.55)', marginBottom: '24px' }}>我們 24 小時內主動聯絡你，幫你開通試用</p>
              <JoinForm />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section data-animate style={{ padding: '60px 24px 80px', maxWidth: '760px', margin: '0 auto' }}>
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
      <SiteFooter b2b />
      <StickyTrialCTA />
    </>
  )
}
