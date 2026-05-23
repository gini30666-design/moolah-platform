import type { Metadata } from 'next'
import Link from 'next/link'
import { TextReveal } from '@/components/TextReveal'

const BASE_URL = 'https://moolah-platform.vercel.app'

export const metadata: Metadata = {
  title: '合作方案與定價 — 美業預約管理平台',
  description: 'MooLah 三大合作方案：基礎入門 NT$600/月、專業職人 NT$1,200/月、工作室客製報價。零技術門檻，5 分鐘設定。高雄、台南髮型設計師、寵物美容、汽車美容、美甲師立即加入。',
  alternates: {
    canonical: `${BASE_URL}/services`,
    languages: { 'zh-Hant-TW': `${BASE_URL}/services`, 'x-default': `${BASE_URL}/services` },
  },
  openGraph: {
    title: '合作方案與定價 | MooLah 美業預約平台',
    description: '三種方案滿足個人職人到工作室的需求。零技術門檻，5 分鐘設定，透過 LINE 接受預約，不用下載 App。',
    url: `${BASE_URL}/services`,
  },
}

const SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '首頁', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: '合作方案', item: `${BASE_URL}/services` },
      ],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${BASE_URL}/#software`,
      name: 'MooLah 美業預約平台',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, LINE',
      description: '透過 LINE 深度整合的美業智慧預約管理系統，支援髮型設計師、寵物美容師、汽車美容師、美甲師使用。',
      url: BASE_URL,
      offers: [
        {
          '@type': 'Offer',
          name: '基礎入門方案',
          description: '1 位設計師帳號、個人預約頁面、LINE 雙向通知、每日預約上限 20 筆、基礎後台管理',
          price: '600',
          priceCurrency: 'TWD',
          billingIncrement: 'P1M',
          eligibleRegion: { '@type': 'Country', name: 'TW' },
        },
        {
          '@type': 'Offer',
          name: '專業職人方案',
          description: '無限預約筆數、作品集上傳 10 張、客戶備註與標籤、每月營業分析報表、優先客服支援',
          price: '1200',
          priceCurrency: 'TWD',
          billingIncrement: 'P1M',
          eligibleRegion: { '@type': 'Country', name: 'TW' },
        },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${BASE_URL}/services#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: '需要自己有 LINE 官方帳號嗎？',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '不需要。MooLah 提供共用 LINE OA，設計師只需要分享個人專屬連結，客人透過連結直接預約。',
          },
        },
        {
          '@type': 'Question',
          name: '客人需要下載 App 嗎？',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '完全不需要。客人只需要有 LINE 帳號，預約流程在 LINE 內直接完成。',
          },
        },
        {
          '@type': 'Question',
          name: '預約資料存在哪裡？',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '所有預約資料存放在 Google Sheets，設計師可隨時匯出，資料完全屬於你自己。',
          },
        },
        {
          '@type': 'Question',
          name: '如何開始？',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '填寫加入表單後，我們會在 24 小時內幫你建立帳號與預約頁面，最快 5 分鐘完成設定。',
          },
        },
      ],
    },
  ],
}

const PLANS = [
  {
    name: '基礎入門方案',
    en: 'Starter',
    price: 'NT$ 600',
    priceNote: '/月',
    features: [
      '1 位設計師帳號',
      '個人預約頁面',
      'LINE 雙向通知',
      '每日預約上限 20 筆',
      '基礎後台管理',
    ],
    cta: '立即加入',
    href: '/join',
    highlight: false,
  },
  {
    name: '專業職人方案',
    en: 'Professional',
    price: 'NT$ 1,200',
    priceNote: '/月',
    features: [
      '無限預約筆數',
      '作品集上傳（10 張）',
      '客戶備註與標籤',
      '每月營業分析報表',
      '優先客服支援',
    ],
    cta: '申請方案',
    href: '/join',
    highlight: true,
  },
  {
    name: '工作室方案',
    en: 'Studio',
    price: '洽詢',
    priceNote: '客製化報價',
    features: [
      '多位設計師帳號',
      '統一品牌預約頁',
      '客戶 CRM 管理',
      '自訂通知範本',
      '專屬客服經理',
    ],
    cta: '聯繫我們',
    href: 'mailto:moolah118@gmail.com',
    highlight: false,
  },
]

const FAQS = [
  {
    q: '需要自己有 LINE 官方帳號嗎？',
    a: '不需要。MooLah 提供共用 LINE OA，設計師只需要分享個人專屬連結，客人透過連結直接預約。',
  },
  {
    q: '客人需要下載 App 嗎？',
    a: '完全不需要。客人只需要有 LINE 帳號，預約流程在 LINE 內直接完成。',
  },
  {
    q: '預約資料存在哪裡？',
    a: '所有預約資料存放在 Google Sheets，設計師可隨時匯出，資料完全屬於你自己。',
  },
  {
    q: '如何開始？',
    a: '填寫加入表單後，我們會在 24 小時內幫你建立帳號與預約頁面，最快 5 分鐘完成設定。',
  },
]

function Nav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border)]" style={{ background: 'rgba(251,249,244,0.92)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-6xl mx-auto px-5 md:px-6 h-14 md:h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-[var(--charcoal)] tracking-wide">MooLah</Link>
        <div className="flex items-center gap-4 md:gap-6 text-sm text-[var(--charcoal)]/60">
          <Link href="/#services" className="hidden sm:inline hover:text-[var(--oak)] transition-colors">服務類別</Link>
          <Link href="/join" className="hover:text-[var(--oak)] transition-colors">加入合作</Link>
          <Link
            href="/discover"
            className="px-4 py-2 bg-[var(--charcoal)] text-[var(--cream)] text-xs tracking-widest uppercase rounded-full hover:bg-[var(--oak)] transition-colors"
          >
            探索職人
          </Link>
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-10 md:py-12 px-5 md:px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <Link href="/" className="font-display text-xl text-[var(--charcoal)] block mb-1">MooLah</Link>
          <p className="text-xs text-[var(--charcoal)]/40">© 2026 永祥數位有限公司 MooLah. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap gap-4 md:gap-6 text-xs text-[var(--charcoal)]/50">
          <Link href="/join" className="hover:text-[var(--oak)] transition-colors">加入合作</Link>
          <Link href="/privacy" className="hover:text-[var(--oak)] transition-colors">隱私政策</Link>
          <Link href="/terms" className="hover:text-[var(--oak)] transition-colors">使用條款</Link>
          <a href="mailto:moolah118@gmail.com" className="hover:text-[var(--oak)] transition-colors">聯絡我們</a>
        </div>
      </div>
    </footer>
  )
}

export default function ServicesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }}
      />
      <Nav />
      <main className="pt-14 md:pt-16">

        {/* Header — dark editorial */}
        <section className="relative overflow-hidden py-20 md:py-28 px-5 md:px-6" style={{ background: 'var(--charcoal)' }}>
          {/* Diagonal texture */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, var(--oak) 0px, var(--oak) 1px, transparent 1px, transparent 44px)'
          }} />
          {/* Oak top bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(to right, transparent, var(--oak), transparent)' }} />
          {/* Radial glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 60% at 80% 50%, rgba(166,137,102,0.12) 0%, transparent 70%)' }} />

          <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 md:gap-12 items-end">
            <div>
              <p data-animate className="text-xs tracking-[0.25em] uppercase mb-4" style={{ color: 'var(--oak)' }}>Pricing Plans</p>
              <h1 className="font-display leading-tight" style={{ fontSize: 'clamp(2.8rem,7vw,6rem)', color: 'var(--cream)', fontWeight: 300, lineHeight: 1.1 }}>
                <TextReveal as="span" delay={120} stagger={60} className="block">合作</TextReveal>
                <TextReveal as="span" delay={340} stagger={60} className="block italic" style={{ color: 'var(--oak)' }}>方案</TextReveal>
              </h1>
            </div>
            <p data-animate data-dir="right" className="text-sm md:text-base leading-relaxed lg:mb-3" style={{ color: 'rgba(251,249,244,0.55)' }}>
              從個人設計師到工作室，MooLah 提供適合各種規模的預約管理方案。
              從免費開始，隨業務成長升級。
            </p>
          </div>
        </section>

        {/* Thin oak divider */}
        <div className="h-px" style={{ background: 'linear-gradient(to right, var(--oak), rgba(166,137,102,0.1))' }} />

        {/* Platform intro — SEO content */}
        <section className="py-14 md:py-20 px-5 md:px-6" style={{ background: 'white' }}>
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-16">
            <div data-animate>
              <p className="text-xs tracking-[0.22em] uppercase mb-3" style={{ color: 'var(--oak)' }}>ABOUT MOOLAH</p>
              <h2 className="font-display text-2xl md:text-3xl mb-5" style={{ color: 'var(--charcoal)', fontWeight: 400, lineHeight: 1.3 }}>
                為台灣美業職人設計的<br />智慧預約管理系統
              </h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(44,40,37,0.65)' }}>
                MooLah 是台灣第一個以 LINE 為核心的美業預約平台，讓消費者無需下載 App、無需額外帳號，直接在 LINE 內完成選服務、選時段、確認預約的全程操作。設計師只需提供基本資料，MooLah 團隊協助建立個人專屬頁面，當天即可上線接受預約。
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(44,40,37,0.65)' }}>
                目前服務涵蓋高雄市、台南市、台中市、台北市等地的髮型設計師、寵物美容師、汽車美容師與美甲師，合作職人每月持續增加中。
              </p>
            </div>
            <div data-animate data-delay="150">
              <p className="text-xs tracking-[0.22em] uppercase mb-3" style={{ color: 'var(--oak)' }}>WHY MOOLAH</p>
              <h2 className="font-display text-2xl md:text-3xl mb-5" style={{ color: 'var(--charcoal)', fontWeight: 400, lineHeight: 1.3 }}>
                與其他平台的差異
              </h2>
              <ul className="space-y-4">
                {[
                  ['零 App 安裝', '消費者透過既有 LINE 帳號直接預約，無需下載新 App，轉換門檻最低。'],
                  ['資料完全自主', '所有預約資料存放在你自己的 Google Sheets，隨時匯出，無廠商綁定。'],
                  ['前一日自動提醒', '系統於前一天下午自動推播提醒消費者與設計師，爽約率有效降低。'],
                  ['顧客筆記功能', '後台可記錄每位顧客的偏好與備註，提升回訪率與服務品質。'],
                ].map(([title, desc]) => (
                  <li key={title} className="flex gap-3 items-start">
                    <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--oak)' }}>—</span>
                    <div>
                      <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--charcoal)' }}>{title}</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(44,40,37,0.60)' }}>{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Plans */}
        <section className="py-16 md:py-24 px-5 md:px-6" style={{ background: '#f5efe6' }}>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-4 md:gap-px md:bg-[var(--border)]">
              {PLANS.map((plan, i) => (
                <div
                  key={plan.name}
                  data-animate
                  data-delay={String(i * 120)}
                  className={`p-7 md:p-10 flex flex-col card-hover ${plan.highlight ? 'bg-[var(--charcoal)]' : 'bg-white'}`}
                  style={{ borderRadius: 'var(--radius-sm)' }}
                >
                  <div className="mb-6 md:mb-8">
                    <p className={`text-xs tracking-[0.2em] uppercase mb-2 ${plan.highlight ? 'text-[var(--oak)]' : 'text-[var(--muted)]'}`}>
                      {plan.en}
                    </p>
                    <h2 className={`font-display text-2xl mb-1 ${plan.highlight ? 'text-[var(--cream)]' : 'text-[var(--charcoal)]'}`}>
                      {plan.name}
                    </h2>
                  </div>

                  <div className="mb-6 md:mb-8">
                    <span className={`font-display text-4xl ${plan.highlight ? 'text-[var(--cream)]' : 'text-[var(--charcoal)]'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ml-1 ${plan.highlight ? 'text-white/40' : 'text-[var(--charcoal)]/40'}`}>
                      {plan.priceNote}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8 md:mb-10 flex-1">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className={`flex items-start gap-3 text-sm ${plan.highlight ? 'text-white/70' : 'text-[var(--charcoal)]/60'}`}
                      >
                        <span className="text-[var(--oak)] mt-0.5 flex-shrink-0">—</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.href}
                    className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-xs tracking-widest uppercase rounded-full transition-colors duration-300 ${
                      plan.highlight
                        ? 'bg-[var(--oak)] text-white hover:opacity-90'
                        : 'border border-[var(--charcoal)]/20 text-[var(--charcoal)] hover:border-[var(--oak)] hover:text-[var(--oak)]'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Oak accent divider */}
        <div className="relative overflow-hidden" style={{ background: 'var(--charcoal)', height: '3px' }}>
          <div style={{ background: 'linear-gradient(to right, transparent, var(--oak) 30%, rgba(166,137,102,0.3) 70%, transparent)', height: '100%' }} />
        </div>

        {/* FAQ */}
        <section className="py-16 md:py-24 px-5 md:px-6 relative overflow-hidden" style={{ background: 'white' }}>
          {/* Decorative number watermark */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 font-display text-[18rem] pointer-events-none select-none leading-none" style={{ color: 'rgba(166,137,102,0.04)', lineHeight: 1 }}>FAQ</div>
          <div className="relative max-w-6xl mx-auto">
            <div data-animate className="mb-10 md:mb-14">
              <p className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: 'var(--oak)' }}>FAQ</p>
              <h2 className="font-display" style={{ fontSize: 'clamp(2rem,4vw,3.5rem)', color: 'var(--charcoal)', fontWeight: 400 }}>常見問題</h2>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {FAQS.map((faq, i) => (
                <div key={faq.q}
                  data-animate
                  data-delay={String(i * 80)}
                  className="py-7 md:py-8 grid md:grid-cols-[2fr_3fr] gap-4 md:gap-6">
                  <h3 className="font-display text-lg md:text-xl" style={{ color: 'var(--charcoal)' }}>{faq.q}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(44,40,37,0.60)' }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA bottom — dark */}
        <section className="relative overflow-hidden py-16 md:py-20 px-5 md:px-6 text-center" style={{ background: 'var(--charcoal)' }}>
          <div className="absolute inset-0 opacity-[0.05]" style={{
            backgroundImage: 'repeating-linear-gradient(-45deg, var(--oak) 0px, var(--oak) 1px, transparent 1px, transparent 44px)'
          }} />
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(to right, transparent, var(--oak), transparent)' }} />
          <div data-animate className="relative max-w-xl mx-auto">
            <p className="text-xs tracking-[.22em] uppercase mb-3" style={{ color: 'var(--oak)' }}>GET STARTED</p>
            <h2 className="font-display text-4xl mb-4" style={{ color: 'var(--cream)', fontWeight: 300 }}>準備好了嗎？</h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(251,249,244,0.50)' }}>免費加入，5 分鐘完成設定，今天就開始接受預約。</p>
            <a
              href="https://line.me/R/ti/p/@492ejbwx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 text-sm tracking-widest uppercase transition-opacity hover:opacity-80"
              style={{ background: 'var(--oak)', color: 'var(--cream)' }}
            >
              立即申請加入
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
