import Link from 'next/link'

const PLANS = [
  {
    name: '基礎方案',
    en: 'Starter',
    price: '免費',
    priceNote: '永久免費',
    features: [
      '1 位設計師帳號',
      '個人預約頁面',
      'LINE 雙向通知',
      '每日預約上限 20 筆',
      '基礎後台管理',
    ],
    cta: '免費加入',
    href: '/join',
    highlight: false,
  },
  {
    name: '專業方案',
    en: 'Professional',
    price: 'NT$ 299',
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
    href: 'mailto:gini30666@gmail.com',
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
    a: '完全不需要。預約流程完全在 LINE 內完成（LIFF），客人只需要有 LINE 帳號。',
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
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border)] bg-[var(--cream)]/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl text-[var(--charcoal)] tracking-wide">MooLah</Link>
        <div className="flex items-center gap-6 text-sm text-[var(--charcoal)]/60">
          <Link href="/#services" className="hidden sm:inline hover:text-[var(--oak)] transition-colors">服務類別</Link>
          <Link href="/join" className="hover:text-[var(--oak)] transition-colors">加入合作</Link>
          <Link
            href="/designer-001"
            className="px-4 py-2 bg-[var(--charcoal)] text-[var(--cream)] text-xs tracking-widest uppercase rounded-full hover:bg-[var(--oak)] transition-colors"
          >
            立即預約
          </Link>
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <Link href="/" className="font-display text-xl text-[var(--charcoal)] block mb-1">MooLah</Link>
          <p className="text-xs text-[var(--charcoal)]/40">© 2026 MooLah. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap gap-6 text-xs text-[var(--charcoal)]/50">
          <Link href="/join" className="hover:text-[var(--oak)] transition-colors">加入合作</Link>
          <a href="mailto:gini30666@gmail.com" className="hover:text-[var(--oak)] transition-colors">聯絡我們</a>
        </div>
      </div>
    </footer>
  )
}

export default function ServicesPage() {
  return (
    <>
      <Nav />
      <main className="pt-16">

        {/* Header */}
        <section className="py-24 px-6 border-b border-[var(--border)]">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-end">
            <div>
              <p className="text-xs tracking-[0.25em] uppercase text-[var(--oak)] mb-4">Pricing Plans</p>
              <h1 className="font-display text-[clamp(2.8rem,7vw,6rem)] leading-tight text-[var(--charcoal)]">
                合作<br />
                <span className="italic text-[var(--oak)]">方案</span>
              </h1>
            </div>
            <p className="text-base text-[var(--charcoal)]/55 leading-relaxed lg:mb-3">
              從個人設計師到工作室，MooLah 提供適合各種規模的預約管理方案。
              從免費開始，隨業務成長升級。
            </p>
          </div>
        </section>

        {/* Plans */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-px bg-[var(--border)]">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`p-10 flex flex-col ${plan.highlight ? 'bg-[var(--charcoal)]' : 'bg-[var(--cream)]'}`}
                >
                  <div className="mb-8">
                    <p className={`text-xs tracking-[0.2em] uppercase mb-2 ${plan.highlight ? 'text-[var(--oak)]' : 'text-[var(--muted)]'}`}>
                      {plan.en}
                    </p>
                    <h2 className={`font-display text-2xl mb-1 ${plan.highlight ? 'text-[var(--cream)]' : 'text-[var(--charcoal)]'}`}>
                      {plan.name}
                    </h2>
                  </div>

                  <div className="mb-8">
                    <span className={`font-display text-4xl ${plan.highlight ? 'text-[var(--cream)]' : 'text-[var(--charcoal)]'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ml-1 ${plan.highlight ? 'text-white/40' : 'text-[var(--charcoal)]/40'}`}>
                      {plan.priceNote}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-10 flex-1">
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
                        ? 'bg-[var(--oak)] text-white hover:bg-[var(--oak-light)]'
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

        {/* FAQ */}
        <section className="py-24 px-6 bg-[var(--sand-light)]">
          <div className="max-w-6xl mx-auto">
            <div className="mb-14">
              <p className="text-xs tracking-[0.25em] uppercase text-[var(--oak)] mb-3">FAQ</p>
              <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] text-[var(--charcoal)]">常見問題</h2>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {FAQS.map((faq) => (
                <div key={faq.q} className="py-8 grid md:grid-cols-[2fr_3fr] gap-6">
                  <h3 className="font-display text-xl text-[var(--charcoal)]">{faq.q}</h3>
                  <p className="text-sm text-[var(--charcoal)]/60 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA bottom */}
        <section className="py-20 px-6 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="font-display text-4xl text-[var(--charcoal)] mb-4">準備好了嗎？</h2>
            <p className="text-sm text-[var(--charcoal)]/55 mb-8">免費加入，5 分鐘完成設定，今天就開始接受預約。</p>
            <Link
              href="/join"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--charcoal)] text-[var(--cream)] text-sm tracking-widest uppercase rounded-full hover:bg-[var(--oak)] transition-colors duration-300"
            >
              立即申請加入
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
