import Link from 'next/link'

// ── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border)] bg-[var(--cream)]/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="font-display text-2xl text-[var(--charcoal)] tracking-wide">MooLah</span>
        <div className="hidden sm:flex items-center gap-8 text-sm text-[var(--charcoal)]/60">
          <a href="#services" className="hover:text-[var(--oak)] transition-colors">服務類別</a>
          <a href="#how" className="hover:text-[var(--oak)] transition-colors">如何運作</a>
          <Link href="/join" className="hover:text-[var(--oak)] transition-colors">加入合作</Link>
          <Link
            href="/line"
            className="px-4 py-2 bg-[var(--charcoal)] text-[var(--cream)] text-xs tracking-widest uppercase rounded-full hover:bg-[var(--oak)] transition-colors"
          >
            立即預約
          </Link>
        </div>
        {/* Mobile CTA */}
        <Link
          href="/line"
          className="sm:hidden px-4 py-1.5 bg-[var(--charcoal)] text-[var(--cream)] text-xs tracking-widest uppercase rounded-full"
        >
          預約
        </Link>
      </div>
    </nav>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Warm radial background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 70% at 70% 50%, #e8d5b7 0%, transparent 65%)' }}
      />

      <div className="relative max-w-6xl mx-auto px-6 w-full grid lg:grid-cols-[1fr_auto] gap-12 lg:gap-20 items-center py-24">

        {/* Left: text */}
        <div>
          <p className="anim-fade-up text-xs tracking-[0.3em] uppercase text-[var(--oak)] mb-6">
            Taiwan Beauty Platform
          </p>
          <h1 className="anim-fade-up-2 font-display text-[clamp(3.5rem,9vw,7.5rem)] leading-[1.05] text-[var(--charcoal)] mb-8">
            質感生活，<br />
            <span className="italic text-[var(--oak)]">從容預約。</span>
          </h1>
          <p className="anim-fade-up-3 text-base text-[var(--charcoal)]/60 leading-relaxed max-w-md mb-10">
            透過 LINE，一鍵預約你喜愛的美業設計師。<br />
            智慧時段管理，雙向即時通知，讓每次預約都是享受。
          </p>
          <div className="anim-fade-up-4 flex flex-wrap gap-3">
            <Link
              href="/line"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[var(--charcoal)] text-[var(--cream)] text-sm tracking-widest uppercase rounded-full hover:bg-[var(--oak)] transition-colors duration-300"
            >
              立即預約
            </Link>
            <Link
              href="/join"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-[var(--charcoal)]/20 text-[var(--charcoal)] text-sm tracking-widest uppercase rounded-full hover:border-[var(--oak)] hover:text-[var(--oak)] transition-colors duration-300"
            >
              加入合作
            </Link>
          </div>
        </div>

        {/* Right: arch decorative */}
        <div className="anim-fade-in hidden lg:flex items-center justify-center">
          <div className="relative w-[260px] h-[360px]">
            {/* Outer arch frame */}
            <div
              className="absolute inset-0 border-2 border-[var(--oak)]"
              style={{ borderRadius: '130px 130px 0 0' }}
            />
            {/* Inner warm fill */}
            <div
              className="absolute inset-[2px] overflow-hidden"
              style={{
                borderRadius: '128px 128px 0 0',
                background: 'linear-gradient(to bottom, #e8d5b7 0%, #f4ede3 50%, #fbf9f4 100%)',
              }}
            />
            {/* Brand inside arch */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <span
                className="font-display italic text-5xl text-[var(--oak)]"
                style={{ letterSpacing: '-0.01em' }}
              >
                MooLah
              </span>
              <div className="w-8 h-[1px] bg-[var(--oak)]/40 mx-auto" />
              <span className="text-[10px] tracking-[0.25em] text-[var(--muted)] uppercase">
                Beauty Platform
              </span>
            </div>
            {/* Decorative small dot */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--oak)]" />
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--charcoal)]/30">
        <span className="text-[10px] tracking-[0.2em] uppercase">Scroll</span>
        <div className="w-[1px] h-8 bg-[var(--charcoal)]/20" />
      </div>
    </section>
  )
}

// ── Services ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    label: '髮型設計師',
    en: 'Hair Designer',
    icon: '✦',
    desc: '剪髮、燙髮、染髮，各式造型服務',
    href: '/designer-001',
    live: true,
  },
  {
    label: '寵物美容師',
    en: 'Pet Groomer',
    icon: '✦',
    desc: '寵物洗澡、剃毛、修剪、造型',
    href: null,
    live: false,
  },
  {
    label: '汽車美容師',
    en: 'Auto Detailer',
    icon: '✦',
    desc: '洗車、打蠟、鍍膜、內裝清潔',
    href: null,
    live: false,
  },
  {
    label: '美甲師',
    en: 'Nail Artist',
    icon: '✦',
    desc: '凝膠美甲、光療指甲、手足保養',
    href: null,
    live: false,
  },
]

function Services() {
  return (
    <section id="services" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="flex items-end justify-between mb-16 gap-4">
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-[var(--oak)] mb-3">Our Services</p>
            <h2 className="font-display text-[clamp(2.2rem,5vw,3.8rem)] leading-tight text-[var(--charcoal)]">
              合作服務類別
            </h2>
          </div>
          <div className="hidden sm:block w-32 h-[1px] bg-[var(--oak)]/30 mb-4 flex-shrink-0" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border)]">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.label}
              className="group bg-[var(--cream)] p-8 hover:bg-[var(--sand-light)] transition-colors duration-300"
            >
              <span className="text-[var(--oak)] text-xs mb-4 block">{cat.icon}</span>
              <h3 className="font-display text-2xl text-[var(--charcoal)] mb-1">{cat.label}</h3>
              <p className="text-xs tracking-[0.15em] uppercase text-[var(--muted)] mb-5">{cat.en}</p>
              <p className="text-sm text-[var(--charcoal)]/55 leading-relaxed mb-8">{cat.desc}</p>
              {cat.live && cat.href ? (
                <Link
                  href={cat.href}
                  className="inline-flex items-center gap-1.5 text-xs tracking-widest uppercase text-[var(--oak)] group-hover:gap-3 transition-all duration-300"
                >
                  <span>立即預約</span>
                  <span>→</span>
                </Link>
              ) : (
                <span className="inline-block text-xs tracking-widest uppercase text-[var(--charcoal)]/25">
                  即將推出
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── How it works ──────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    title: '加入好友',
    desc: '掃描設計師的 LINE QR Code 或點擊分享連結，進入專屬預約頁面。',
  },
  {
    num: '02',
    title: '選擇服務',
    desc: '挑選喜愛的服務項目與時段，填寫基本資料後輕鬆送出。',
  },
  {
    num: '03',
    title: '即時確認',
    desc: '你與設計師同步收到 LINE 預約通知，一切盡在掌握。',
  },
]

function HowItWorks() {
  return (
    <section id="how" className="py-28 px-6 bg-[var(--charcoal)]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <p className="text-xs tracking-[0.25em] uppercase text-[var(--oak)] mb-3">How It Works</p>
          <h2 className="font-display text-[clamp(2.2rem,5vw,3.8rem)] leading-tight text-[var(--cream)]">
            三步驟，輕鬆預約
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {STEPS.map((step) => (
            <div key={step.num} className="px-0 md:px-10 py-10 md:py-0 first:pl-0 last:pr-0">
              <span className="font-display text-7xl text-[var(--oak)]/20 leading-none block mb-6">
                {step.num}
              </span>
              <h3 className="font-display text-2xl text-[var(--cream)] mb-4">{step.title}</h3>
              <p className="text-sm text-white/45 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* LINE badge */}
        <div className="mt-16 pt-10 border-t border-white/10 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#06C755] flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.064-.022.136-.033.2-.033.211 0 .391.09.51.25l2.444 3.317V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
            </div>
            <span className="text-sm text-white/60">全程透過 LINE 完成，無需另外下載 App</span>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    title: 'LINE 快速預約',
    desc: '客戶透過設計師的 LINE OA 直接進入預約流程，零學習成本，轉換率更高。',
    num: '01',
    href: '/features/booking',
    cta: '了解預約流程',
  },
  {
    title: '智慧時段管理',
    desc: '動態庫存系統自動計算服務時長，避免重複預約，熱門時段即時標示。',
    num: '02',
    href: '/features/scheduling',
    cta: '查看排程功能',
  },
  {
    title: '雙向即時通知',
    desc: '預約成立、取消或異動，客戶與設計師同步收到 LINE 通知，不漏接任何訊息。',
    num: '03',
    href: '/features/notification',
    cta: '了解通知機制',
  },
]

function Features() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-16 items-start">
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-[var(--oak)] mb-3">Platform Features</p>
            <h2 className="font-display text-[clamp(2.2rem,5vw,3.8rem)] leading-tight text-[var(--charcoal)]">
              為設計師<br />打造的<br />
              <span className="italic text-[var(--oak)]">智慧工具</span>
            </h2>
          </div>
          <div className="space-y-0 divide-y divide-[var(--border)]">
            {FEATURES.map((f) => (
              <div key={f.num} className="py-8 grid grid-cols-[auto_1fr] gap-6 items-start group">
                <span className="font-display text-sm text-[var(--oak)]/40 pt-1">{f.num}</span>
                <div>
                  <h3 className="font-display text-xl text-[var(--charcoal)] mb-3 group-hover:text-[var(--oak)] transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-sm text-[var(--charcoal)]/55 leading-relaxed mb-4">{f.desc}</p>
                  <Link
                    href={f.href}
                    className="text-xs text-[var(--oak)] tracking-widest uppercase border-b border-[var(--oak)]/40 pb-0.5 hover:border-[var(--oak)] transition-colors"
                  >
                    {f.cta} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Join CTA ──────────────────────────────────────────────────────────────────
function JoinCTA() {
  return (
    <section className="py-28 px-6 bg-[var(--sand-light)]">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <p className="text-xs tracking-[0.25em] uppercase text-[var(--oak)] mb-4">For Designers</p>
          <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-tight text-[var(--charcoal)] mb-6">
            想讓更多客人<br />
            <span className="italic">找到你？</span>
          </h2>
          <p className="text-base text-[var(--charcoal)]/60 leading-relaxed mb-10 max-w-xl">
            加入 MooLah 合作計畫，建立你的專屬預約頁面，讓客人透過 LINE 隨時預約，
            後台即時掌握排程與客戶資料。
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/join"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[var(--charcoal)] text-[var(--cream)] text-sm tracking-widest uppercase rounded-full hover:bg-[var(--oak)] transition-colors duration-300"
            >
              成為合作設計師
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-[var(--charcoal)]/20 text-[var(--charcoal)] text-sm tracking-widest uppercase rounded-full hover:border-[var(--oak)] hover:text-[var(--oak)] transition-colors duration-300"
            >
              了解合作方案
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-16 pt-10 border-t border-[var(--oak)]/20 grid grid-cols-3 gap-8 max-w-lg">
          {[
            { num: '5 分鐘', label: '設定完成' },
            { num: '零成本', label: '免費加入' },
            { num: '24/7', label: '自動化運作' },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-3xl text-[var(--oak)] mb-1">{s.num}</p>
              <p className="text-xs text-[var(--charcoal)]/50 tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="font-display text-xl text-[var(--charcoal)] block mb-1">MooLah</span>
          <p className="text-xs text-[var(--charcoal)]/40">© 2026 MooLah. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap gap-6 text-xs text-[var(--charcoal)]/50">
          <Link href="/join" className="hover:text-[var(--oak)] transition-colors">加入合作</Link>
          <Link href="/services" className="hover:text-[var(--oak)] transition-colors">合作方案</Link>
          <a href="mailto:gini30666@gmail.com" className="hover:text-[var(--oak)] transition-colors">聯絡我們</a>
        </div>
      </div>
    </footer>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Services />
        <HowItWorks />
        <Features />
        <JoinCTA />
      </main>
      <Footer />
    </>
  )
}
