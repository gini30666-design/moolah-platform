import Link from 'next/link'

// ── Navbar ────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav style={{ background: 'var(--charcoal-deep)' }} className="fixed top-0 w-full z-50 border-b border-[var(--oak)]/20">
      <div className="max-w-[1440px] mx-auto flex justify-between items-center px-16 h-20">
        <Link href="/" className="font-display text-xl tracking-[.2em] uppercase text-[var(--cream)]">MooLah</Link>
        <div className="hidden md:flex items-center gap-10">
          <Link href="/services" className="text-sm text-[var(--oak-dim)] hover:text-[var(--cream)] transition-colors tracking-wide">服務類別</Link>
          <Link href="/services" className="text-sm text-[var(--oak-dim)] hover:text-[var(--cream)] transition-colors tracking-wide">合作方案</Link>
          <Link href="/join" className="text-sm text-[var(--oak-dim)] hover:text-[var(--cream)] transition-colors tracking-wide">加入合作</Link>
          <Link href="/services#faq" className="text-sm text-[var(--oak-dim)] hover:text-[var(--cream)] transition-colors tracking-wide">常見問題</Link>
        </div>
        <Link
          href="/line"
          className="flex items-center gap-2 px-6 py-3 text-xs text-white tracking-widest uppercase transition-opacity hover:opacity-90"
          style={{ background: 'var(--line-green)' }}
        >
          <LineIcon />
          立即預約
        </Link>
      </div>
    </nav>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: 'var(--charcoal-deep)' }}>
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(to right, var(--charcoal-deep) 40%, rgba(26,23,20,.55) 75%, transparent 100%)' }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1800&q=85&fit=crop"
          alt="Premium salon interior"
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(.85) saturate(1.1)' }}
        />
      </div>
      <div className="relative z-20 max-w-[1440px] mx-auto px-16 grid grid-cols-12 gap-6 w-full py-32">
        <div className="col-span-12 md:col-span-7 lg:col-span-6 flex flex-col gap-7">
          <span className="anim-fade-up text-xs tracking-[.22em] uppercase text-[var(--oak)] flex items-center gap-3">
            <span className="inline-block w-8 h-px bg-[var(--oak)]" />
            BEAUTY BOOKING PLATFORM
          </span>
          <h1 className="anim-fade-up-2 font-display text-[clamp(2.8rem,6vw,5rem)] leading-tight text-[var(--cream)]" style={{ fontWeight: 300, letterSpacing: '-.01em' }}>
            質感生活<br />從容預約
          </h1>
          <p className="anim-fade-up-3 text-lg leading-relaxed max-w-md" style={{ color: 'var(--oak-dim)' }}>
            LINE 一鍵預約，讓每次服務都成為享受。<br />深度整合台灣美業，從此不再手忙腳亂。
          </p>
          <div className="anim-fade-up-4 flex items-center gap-4">
            <Link href="/line" className="flex items-center gap-2 px-8 py-4 text-sm text-white tracking-widest uppercase hover:opacity-90 transition-opacity" style={{ background: 'var(--line-green)' }}>
              <LineIcon />立即預約
            </Link>
            <Link href="/services" className="text-sm text-[var(--cream)] px-8 py-4 tracking-widest uppercase border hover:border-[var(--oak)] transition-colors" style={{ borderColor: 'rgba(251,249,244,.3)' }}>
              了解更多
            </Link>
          </div>
          <div className="anim-fade-up-4 flex gap-10 pt-8 mt-2 border-t" style={{ borderColor: 'rgba(166,137,102,.35)' }}>
            {[
              { num: '200+', label: '合作設計師' },
              { num: '98%', label: '預約到場率' },
              { num: '4.9★', label: '使用者評分' },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl" style={{ color: 'var(--oak)' }}>{s.num}</p>
                <p className="text-xs tracking-widest uppercase mt-1" style={{ color: 'var(--oak-dim)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 opacity-40">
        <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--oak-dim)' }}>Scroll</span>
        <div className="w-px h-10" style={{ background: 'var(--oak-dim)' }} />
      </div>
    </section>
  )
}

// ── Marquee ───────────────────────────────────────────────────────────────────
function Marquee() {
  const text = '正在改變台灣美業的預約方式 · REDEFINING BEAUTY APPOINTMENTS IN TAIWAN · 髮型設計 · 寵物美容 · 汽車美容 · 美甲 · LINE 一鍵預約 · 智慧排程 · 雙向通知 · '
  return (
    <div className="border-y py-4 overflow-hidden" style={{ background: 'var(--charcoal-deep)', borderColor: 'rgba(166,137,102,.2)' }}>
      <div style={{ display: 'flex', width: 'max-content', animation: 'marquee 30s linear infinite' }}>
        {[text, text].map((t, i) => (
          <span key={i} className="text-xs tracking-[.2em] uppercase px-4 whitespace-nowrap" style={{ color: 'var(--oak)' }}>{t}</span>
        ))}
      </div>
    </div>
  )
}

// ── Services ──────────────────────────────────────────────────────────────────
const SERVICE_CARDS = [
  { no: '01', label: '髮型設計師', desc: '剪髮、染髮、燙髮，一站搞定預約', img: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&q=80&fit=crop', href: '/discover?category=髮型設計師' },
  { no: '02', label: '寵物美容師', desc: '毛孩的質感日常，從這裡出發',      img: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80&fit=crop', href: '/discover?category=寵物美容師' },
  { no: '03', label: '汽車美容師', desc: '鍍膜、打蠟、清潔，輕鬆預約到府', img: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=600&q=80&fit=crop', href: '/discover?category=汽車美容師' },
  { no: '04', label: '美甲師',     desc: '手繪、凝膠、光療，精緻指尖藝術', img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80&fit=crop', href: '/discover?category=美甲師' },
]

const CARD_DELAYS = ['0', '100', '200', '300']

function Services() {
  return (
    <section id="services" className="py-28 px-16" style={{ background: 'var(--charcoal)' }}>
      <div className="max-w-[1440px] mx-auto">
        <div data-animate className="flex items-end justify-between mb-14 pb-6 border-b" style={{ borderColor: 'rgba(166,137,102,.25)' }}>
          <div>
            <span className="text-xs tracking-[.2em] uppercase block mb-3" style={{ color: 'var(--oak)' }}>OUR SERVICES</span>
            <h2 className="font-display text-4xl" style={{ color: 'var(--cream)', fontWeight: 300, letterSpacing: '.03em' }}>四大服務類別</h2>
          </div>
          <Link href="/services" className="text-xs tracking-widest uppercase pb-1 border-b hover:opacity-70 transition-opacity" style={{ color: 'var(--oak-dim)', borderColor: 'var(--oak-dim)' }}>查看全部 →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: '2px' }}>
          {SERVICE_CARDS.map((card, i) => (
            <Link
              key={card.no}
              href={card.href}
              data-animate
              data-dir="scale"
              data-delay={CARD_DELAYS[i]}
              className="group relative overflow-hidden block card-hover"
              style={{ height: '480px', background: 'var(--charcoal-deep)', border: '1px solid rgba(166,137,102,.25)', borderRadius: '20px' }}
            >
              <div className="absolute inset-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.img} alt={card.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ opacity: .7, filter: 'brightness(.85) saturate(1.1)' }} />
              </div>
              <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(to top, var(--charcoal-deep) 30%, transparent 70%)' }} />
              {/* Hover glow border */}
              <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: 'inset 0 0 0 1px rgba(166,137,102,0.6)', borderRadius: '20px' }} />
              <div className="absolute bottom-0 left-0 right-0 z-20 p-8">
                <span className="text-xs tracking-[.2em] uppercase block mb-2" style={{ color: 'var(--oak)' }}>{card.no}</span>
                <h3 className="font-display text-2xl mb-2" style={{ color: 'var(--cream)', fontWeight: 300 }}>{card.label}</h3>
                <p className="text-sm leading-relaxed mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: 'var(--oak-dim)' }}>{card.desc}</p>
                <span className="text-xs tracking-widest uppercase flex items-center gap-2 transition-transform duration-300 group-hover:translate-x-1" style={{ color: 'var(--oak)' }}>
                  {card.no === '01' ? '立即預約' : '了解更多'} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Feature sections ──────────────────────────────────────────────────────────
function FeatureRow({ imgSrc, imgAlt, label, title, body, points, cta, ctaHref, reverse, bg, extra, light }: {
  imgSrc: string; imgAlt: string; label: string; title: string; body: string;
  points: string[]; cta: string; ctaHref: string; reverse?: boolean; bg?: string; extra?: React.ReactNode; light?: boolean;
}) {
  const textColor = light ? 'var(--charcoal)' : 'var(--cream)'
  const bodyColor = light ? 'rgba(44,40,37,0.60)' : 'var(--oak-dim)'
  const textCol = (
    <div
      data-animate
      data-dir={reverse ? 'left' : 'right'}
      className="col-span-12 md:col-span-5 flex flex-col gap-6"
      style={reverse ? {} : { gridColumn: '8 / span 5' }}
    >
      <span className="text-xs tracking-[.22em] uppercase" style={{ color: 'var(--oak)' }}>{label}</span>
      <h2 className="font-display text-4xl leading-snug" style={{ color: textColor, fontWeight: 300, letterSpacing: '.03em' }}
        dangerouslySetInnerHTML={{ __html: title }} />
      <p className="text-base leading-relaxed" style={{ color: bodyColor }}>{body}</p>
      <ul className="space-y-4 mt-2">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-3">
            <span style={{ color: 'var(--oak)', marginTop: '2px' }}>—</span>
            <span className="text-sm" style={{ color: bodyColor }}>{p}</span>
          </li>
        ))}
      </ul>
      <Link href={ctaHref} className="text-xs tracking-widest uppercase pb-1 border-b w-fit mt-4 hover:opacity-70 transition-opacity" style={{ color: 'var(--oak)', borderColor: 'var(--oak)' }}>
        {cta} →
      </Link>
    </div>
  )
  const imgCol = (
    <div
      data-animate
      data-dir={reverse ? 'right' : 'left'}
      className="col-span-12 md:col-span-6 relative"
      style={{ height: '580px' }}
    >
      {!reverse && <div className="absolute top-6 left-6 w-full h-full border" style={{ borderColor: 'rgba(166,137,102,.25)' }} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imgSrc} alt={imgAlt} className="relative z-10 w-full h-full object-cover" style={{ borderRadius: '16px', filter: light ? 'brightness(.88) saturate(0.9)' : 'brightness(.85) saturate(1.1)' }} />
      {extra}
    </div>
  )
  return (
    <section className="py-28" style={{ background: bg || 'var(--charcoal-deep)', borderTop: light ? '1px solid rgba(166,137,102,0.12)' : 'none' }}>
      <div className="max-w-[1440px] mx-auto px-16 grid grid-cols-12 gap-8 items-center">
        {reverse ? <>{textCol}{imgCol}</> : <>{imgCol}{textCol}</>}
      </div>
    </section>
  )
}

// ── 3-column features ─────────────────────────────────────────────────────────
const PILLARS = [
  {
    icon: <LineIcon size={22} />,
    title: 'LINE 快速預約',
    desc: '透過 LINE OA 官方帳號直接預約，不需要下載 App。客戶點擊連結，選服務、選時段、確認預約，整個流程不超過 60 秒。',
    href: '/features/booking',
    cta: '了解預約流程',
  },
  {
    icon: <CalIcon />,
    title: '智慧時段管理',
    desc: 'Duration-aware 演算法自動計算可用時段，緊湊填補空缺，讓設計師行程效益最大化。',
    href: '/features/scheduling',
    cta: '查看排程功能',
  },
  {
    icon: <BellIcon />,
    title: '雙向即時通知',
    desc: '預約確認、前一日提醒、取消通知，全自動透過 LINE 同時推播設計師與客戶。',
    href: '/features/notification',
    cta: '了解通知機制',
  },
]

function Pillars() {
  return (
    <section className="py-28 px-16" style={{ background: 'var(--charcoal-deep)', borderTop: '1px solid rgba(166,137,102,0.14)' }}>
      <div className="max-w-[1440px] mx-auto">
        <div data-animate className="text-center mb-16">
          <span className="text-xs tracking-[.22em] uppercase block mb-3" style={{ color: 'var(--oak)' }}>PLATFORM FEATURES</span>
          <h2 className="font-display text-4xl" style={{ color: 'var(--cream)', fontWeight: 300, letterSpacing: '.03em' }}>平台核心功能</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PILLARS.map((p, i) => (
            <div
              key={p.title}
              data-animate
              data-delay={String(i * 150)}
              className="flex flex-col gap-5 p-10 card-hover"
              style={{ background: 'rgba(166,137,102,0.06)', border: '1px solid rgba(166,137,102,0.18)', borderRadius: '16px' }}
            >
              <div className="w-12 h-12 border flex items-center justify-center flex-shrink-0" style={{ borderColor: 'rgba(166,137,102,.35)', color: 'var(--oak)', borderRadius: '8px' }}>
                {p.icon}
              </div>
              <h3 className="font-display text-xl" style={{ color: 'var(--cream)' }}>{p.title}</h3>
              <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--oak-dim)' }}>{p.desc}</p>
              <Link href={p.href} className="text-xs tracking-widest uppercase pb-1 border-b w-fit hover:opacity-70 transition-opacity" style={{ color: 'var(--oak)', borderColor: 'rgba(166,137,102,.4)' }}>
                {p.cta} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Partner CTA ───────────────────────────────────────────────────────────────
function PartnerCTA() {
  return (
    <section className="py-28 px-16" style={{ background: 'var(--charcoal-deep)' }}>
      <div className="max-w-[1440px] mx-auto">
        <div data-animate className="pl-12 py-4 border-l-4" style={{ borderColor: 'var(--oak)' }}>
          <span className="text-xs tracking-[.22em] uppercase block mb-4" style={{ color: 'var(--oak)' }}>JOIN MOOLAH</span>
          <h2 className="font-display mb-6" style={{ fontSize: 'clamp(2.5rem,5vw,4rem)', color: 'var(--cream)', fontWeight: 300, letterSpacing: '.02em', lineHeight: 1.2 }}>
            成為 MooLah<br />合作設計師
          </h2>
          <p className="text-lg leading-relaxed mb-10 max-w-xl" style={{ color: 'var(--oak-dim)' }}>
            免費加入，立即擁有專屬預約頁面。讓 MooLah 負責排程、通知、客戶管理，你只需要專注在技術與服務。
          </p>
          <div className="flex items-center gap-4">
            <Link href="/join" className="px-10 py-4 text-sm tracking-widest uppercase transition-opacity hover:opacity-80" style={{ background: 'var(--oak)', color: 'var(--cream)' }}>
              立即申請
            </Link>
            <Link href="/services" className="px-10 py-4 text-sm text-[var(--cream)] tracking-widest uppercase border hover:border-[var(--oak)] transition-colors" style={{ borderColor: 'rgba(251,249,244,.3)' }}>
              查看方案
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: '#0f0e0c', borderTop: '2px solid var(--oak)' }}>
      <div className="max-w-[1440px] mx-auto px-16 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div data-animate>
          <h3 className="font-display text-2xl tracking-widest uppercase mb-4" style={{ color: 'var(--cream)' }}>MooLah</h3>
          <p className="text-xs leading-relaxed mb-6" style={{ color: 'var(--oak-dim)' }}>重新定義台灣美業預約體驗。<br />REDEFINING BEAUTY APPOINTMENTS.</p>
          <a href="https://line.me/R/ti/p/@881zhkla" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs text-white tracking-widest uppercase"
            style={{ background: 'var(--line-green)' }}>
            <LineIcon size={14} />加入 LINE OA
          </a>
        </div>
        <div data-animate data-delay="100">
          <h4 className="text-xs tracking-[.2em] uppercase mb-6" style={{ color: 'var(--oak)' }}>服務</h4>
          <ul className="space-y-3">
            {[['髮型設計師', '/go/chloe'], ['寵物美容師', '/services'], ['汽車美容師', '/services'], ['美甲師', '/services']].map(([l, h]) => (
              <li key={l}><Link href={h} className="text-sm hover:text-[var(--cream)] transition-colors" style={{ color: 'var(--oak-dim)' }}>{l}</Link></li>
            ))}
          </ul>
        </div>
        <div data-animate data-delay="200">
          <h4 className="text-xs tracking-[.2em] uppercase mb-6" style={{ color: 'var(--oak)' }}>平台</h4>
          <ul className="space-y-3">
            {[['合作方案', '/services'], ['加入合作', '/join'], ['常見問題', '/services#faq'], ['聯絡我們', 'mailto:gini30666@gmail.com']].map(([l, h]) => (
              <li key={l}><Link href={h} className="text-sm hover:text-[var(--cream)] transition-colors" style={{ color: 'var(--oak-dim)' }}>{l}</Link></li>
            ))}
          </ul>
        </div>
        <div data-animate data-delay="300">
          <h4 className="text-xs tracking-[.2em] uppercase mb-6" style={{ color: 'var(--oak)' }}>聯絡</h4>
          <ul className="space-y-3">
            {[['gini30666@gmail.com', 'mailto:gini30666@gmail.com'], ['Instagram', 'https://instagram.com'], ['LINE @881zhkla', 'https://line.me/R/ti/p/@881zhkla']].map(([l, h]) => (
              <li key={l}><a href={h} target={h.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="text-sm hover:text-[var(--cream)] transition-colors" style={{ color: 'var(--oak-dim)' }}>{l}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t px-16 py-6 max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center" style={{ borderColor: 'rgba(166,137,102,.2)' }}>
        <p className="text-xs tracking-widest" style={{ color: 'var(--oak-dim)' }}>© 2026 MOOLAH. ALL RIGHTS RESERVED.</p>
        <p className="text-xs tracking-widest mt-2 md:mt-0" style={{ color: 'var(--oak-dim)' }}>DESIGNED IN TAIWAN · 高雄出發</p>
      </div>
    </footer>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function LineIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="white">
      <path d="M24 4C13 4 4 11.6 4 21c0 5.8 3.3 10.9 8.4 14.2-.4 1.4-1.3 4.9-1.5 5.7-.2.9.3 1 .7.7.4-.2 5.5-3.7 7.7-5.2A24 24 0 0024 37c11 0 20-7.6 20-16S35 4 24 4z" />
    </svg>
  )
}
function CalIcon() {
  return (
    <svg width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
function BellIcon() {
  return (
    <svg width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
      <Nav />
      <main className="pt-20">
        <Hero />
        <Marquee />
        <Services />
        <FeatureRow
          imgSrc="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=85&fit=crop"
          imgAlt="設計師諮詢客戶"
          label="01 / LINE 快速預約"
          title="專屬設計師<br/>一鍵連結"
          body="透過 LINE OA 官方帳號直接預約，不需要下載 App。客戶點擊連結，選服務、選時段、確認預約，整個流程不超過 60 秒。"
          points={['無 App、無帳號，LINE 直接操作', '預約即時確認，自動發送 LINE 通知', '支援多位設計師、多門市同時管理']}
          cta="了解預約流程"
          ctaHref="/features/booking"
          light
          bg="#f5efe6"
        />
        <FeatureRow
          imgSrc="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=900&q=85&fit=crop"
          imgAlt="智慧時段管理"
          label="02 / 智慧時段管理"
          title="智能排程<br/>零空窗"
          body="系統根據服務時長自動計算可用時段，緊湊排程策略讓每個空檔都有價值。熱門時段即時標記，幫助客戶做出最佳選擇。"
          points={['Duration-aware 時段佔用自動計算', '熱門時段橘色標記，引導最佳預約', '每日 08:00 自動推播排程給設計師']}
          cta="查看排程功能"
          ctaHref="/features/scheduling"
          reverse
          light
          bg="#ede8dc"
          extra={
            <div className="absolute bottom-8 left-8 z-20 px-8 py-6" style={{ background: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(16px)', border: '1px solid rgba(166,137,102,.35)', borderRadius: '12px' }}>
              <p className="font-display text-3xl" style={{ color: 'var(--oak)' }}>98%</p>
              <p className="text-xs tracking-widest uppercase mt-1" style={{ color: 'rgba(44,40,37,0.50)' }}>預約到場率</p>
            </div>
          }
        />
        <FeatureRow
          imgSrc="https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=900&q=85&fit=crop"
          imgAlt="LINE 通知"
          label="03 / 雙向即時通知"
          title="即時通知<br/>不漏接"
          body="預約成立、取消、提醒三個時間點，系統自動透過 LINE 推播給客戶與設計師。雙向確認，零溝通成本。"
          points={['預約成立 → 雙向 LINE 即時推播', '前一天自動提醒，降低爽約率', '取消預約 → 客戶即時收到通知']}
          cta="了解通知機制"
          ctaHref="/features/notification"
          light
          bg="#f5efe6"
        />
        <Pillars />
        <PartnerCTA />
      </main>
      <Footer />
    </>
  )
}
