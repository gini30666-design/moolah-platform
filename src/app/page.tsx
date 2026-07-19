import type { Metadata } from 'next'
import Link from 'next/link'
import { TextReveal } from '@/components/TextReveal'
import HomeLeadForm from '@/components/HomeLeadForm'
import TrustBar from '@/components/TrustBar'
import TestimonialWall from '@/components/TestimonialWall'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

export const metadata: Metadata = {
  title: 'MooLah — 台灣個人工作室預約系統 | 採耳、做臉、按摩、美甲線上預約',
  description: '為台灣個人工作室與美業職人打造的智慧預約系統。採耳、做臉清粉刺、按摩舒壓、美甲、美髮，透過 LINE 一鍵預約，雙向即時通知、零 App 安裝。全台合作職人。',
  keywords: ['個人工作室預約', '採耳預約', '做臉預約', '按摩預約', '美甲預約', '美業預約系統', 'LINE 預約', '工作室接單', '美業平台'],
  alternates: {
    canonical: BASE_URL,
    languages: { 'zh-Hant-TW': BASE_URL, 'x-default': BASE_URL },
  },
  openGraph: {
    title: 'MooLah — 質感生活，從容預約',
    description: '為台灣個人工作室打造的預約系統。採耳、做臉、按摩、美甲、美髮，透過 LINE 一鍵預約。全台合作職人。',
    url: BASE_URL,
  },
}

// Nav 已抽至 SiteNav component（共用）

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: 'var(--charcoal-deep)' }}>

      {/* Background image + multi-stop gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 z-10" style={{
          background: 'linear-gradient(to right, var(--charcoal-deep) 0%, var(--charcoal-deep) 35%, rgba(26,23,20,.82) 55%, rgba(26,23,20,.35) 75%, transparent 100%)',
        }} />
        {/* Bottom fade for readability */}
        <div className="absolute bottom-0 left-0 right-0 h-40 z-10" style={{ background: 'linear-gradient(to top, rgba(26,23,20,0.6), transparent)' }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1800&q=85&fit=crop"
          alt="Premium salon interior"
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(.8) saturate(1.15)', transform: 'scale(1.03)' }}
        />
      </div>

      {/* Decorative large background letter */}
      <div className="absolute right-0 bottom-0 z-10 select-none pointer-events-none hidden lg:block" style={{
        fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(260px,28vw,420px)',
        fontWeight: 300, color: 'rgba(166,137,102,0.045)',
        lineHeight: 0.85, letterSpacing: '-0.05em',
        transform: 'translateX(8%) translateY(10%)',
      }}>M</div>

      {/* Top right corner accent line */}
      <div className="absolute top-0 right-0 w-px h-28 z-20 hidden md:block" style={{ background: 'linear-gradient(to bottom, var(--oak), transparent)', opacity: 0.5 }} />

      {/* Main content */}
      <div className="relative z-20 max-w-[1440px] mx-auto px-5 md:px-16 grid grid-cols-12 gap-6 w-full py-24 md:py-32">
        <div className="col-span-12 md:col-span-7 lg:col-span-5 flex flex-col gap-6 md:gap-7 pl-0 md:pl-4 border-l-0 md:border-l" style={{ borderColor: 'rgba(166,137,102,0.3)' }}>

          {/* Eyebrow label */}
          <div className="anim-fade-up flex items-center gap-4">
            <span className="inline-block w-10 h-px" style={{ background: 'var(--oak)' }} />
            <span className="text-xs tracking-[.28em] uppercase" style={{ color: 'var(--oak)' }}>
              Beauty Booking Platform
            </span>
          </div>

          {/* H1 with word reveal */}
          <h1 className="font-display text-[var(--cream)]" style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)', fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            <TextReveal as="span" delay={150} stagger={55} className="block">質感生活</TextReveal>
            <TextReveal as="span" delay={430} stagger={55} className="block">從容預約</TextReveal>
          </h1>

          {/* Thin oak line below h1 */}
          <div className="anim-fade-up" style={{ width: '48px', height: '1.5px', background: 'linear-gradient(to right, var(--oak), transparent)', marginTop: '-8px' }} />

          <p className="anim-fade-up-3 text-sm md:text-base leading-loose max-w-sm" style={{ color: 'rgba(251,249,244,0.55)' }}>
            LINE 一鍵預約，讓每次服務都成為享受。<br className="hidden sm:block" />深度整合台灣美業，從此不再手忙腳亂。
          </p>

          {/* CTAs — 雙入口：消費者 vs 設計師 */}
          <div className="anim-fade-up-4 flex flex-wrap items-center gap-3">
            <Link href="/discover" className="flex items-center gap-2 px-7 md:px-9 py-4 md:py-4.5 text-xs md:text-sm tracking-widest uppercase hover:opacity-90 transition-opacity" style={{ background: 'var(--oak)', color: 'var(--cream)' }}>
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '14px', height: '14px' }}><path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd"/></svg>
              探索職人
            </Link>
            <Link href="/for-providers" className="flex items-center gap-2 text-xs md:text-sm text-[var(--cream)] px-7 md:px-9 py-4 tracking-widest uppercase border hover:border-[var(--oak)] transition-colors" style={{ borderColor: 'rgba(251,249,244,.22)' }}>
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '14px', height: '14px', opacity: 0.7 }}><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg>
              設計師加入
            </Link>
          </div>

          {/* Stats row */}
          <div className="anim-fade-up-4 grid grid-cols-3 gap-4 pt-6 mt-2 border-t" style={{ borderColor: 'rgba(166,137,102,.25)' }}>
            {[
              { num: '0%', label: '訂單抽成' },
              { num: '4類', label: '嚴選職人服務' },
              { num: 'LINE', label: '一鍵預約・雙向提醒' },
            ].map((s) => (
              <div key={s.label} style={{ paddingLeft: '0' }}>
                <p className="font-display" style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', color: 'var(--oak)', fontWeight: 300, lineHeight: 1 }}>{s.num}</p>
                <p className="text-xs tracking-widest uppercase mt-2" style={{ color: 'rgba(251,249,244,0.35)', letterSpacing: '0.2em' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-8 md:left-16 z-20 flex items-center gap-3" style={{ opacity: 0.45 }}>
        <div className="w-px h-12" style={{ background: 'linear-gradient(to bottom, transparent, var(--oak))' }} />
        <span className="text-xs tracking-[0.3em] uppercase" style={{ color: 'var(--oak)', writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>Scroll</span>
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
  { no: '01', label: '髮型設計師', desc: '剪髮、染髮、燙髮，一站搞定預約', img: '/images/hair_stylist.png',    href: '/discover?category=髮型設計師' },
  { no: '02', label: '寵物美容師', desc: '毛孩的質感日常，從這裡出發',      img: '/images/pet_grooming.png',   href: '/discover?category=寵物美容師' },
  { no: '03', label: '汽車美容師', desc: '鍍膜、打蠟、清潔，輕鬆預約到府', img: '/images/auto_detailing.png', href: '/discover?category=汽車美容師' },
  { no: '04', label: '美甲師',     desc: '手繪、凝膠、光療，精緻指尖藝術', img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80&fit=crop', href: '/discover?category=美甲師' },
]

const CARD_DELAYS = ['0', '100', '200', '300']

function Services() {
  return (
    <section id="services" className="py-16 lg:py-28 px-5 lg:px-16" style={{ background: 'var(--charcoal)' }}>
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 lg:mb-14 pb-6 border-b" style={{ borderColor: 'rgba(166,137,102,.25)' }}>
          <div>
            <span data-animate className="text-xs tracking-[.2em] uppercase block mb-3" style={{ color: 'var(--oak-light)' }}>OUR SERVICES</span>
            <TextReveal as="h2" delay={80} className="font-display text-3xl md:text-4xl" style={{ color: 'var(--cream)', fontWeight: 300, letterSpacing: '.03em' }}>四大服務類別</TextReveal>
          </div>
          <Link data-animate data-delay="200" href="/services" className="text-xs tracking-widest uppercase pb-1 border-b hover:opacity-70 transition-opacity self-start sm:self-auto" style={{ color: 'var(--oak-dim)', borderColor: 'var(--oak-dim)' }}>查看全部 →</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: '2px' }}>
          {SERVICE_CARDS.map((card, i) => (
            <Link
              key={card.no}
              href={card.href}
              data-animate
              data-dir="scale"
              data-delay={CARD_DELAYS[i]}
              className="group relative overflow-hidden block card-hover"
              style={{ height: 'clamp(220px, 42vw, 480px)', background: 'var(--charcoal-deep)', border: '1px solid rgba(166,137,102,.25)', borderRadius: '12px' }}
            >
              <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: '12px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.img} alt={card.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ opacity: .7, filter: 'brightness(.85) saturate(1.1)' }} />
              </div>
              <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(to top, var(--charcoal-deep) 30%, transparent 70%)', borderRadius: '12px' }} />
              <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: 'inset 0 0 0 1px rgba(166,137,102,0.6)', borderRadius: '12px' }} />
              <div className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-8">
                <h3 className="font-display text-base md:text-2xl mb-1 md:mb-2" style={{ color: 'var(--cream)', fontWeight: 300 }}>{card.label}</h3>
                <p className="text-xs md:text-sm leading-relaxed mb-2 md:mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block" style={{ color: 'var(--oak-dim)' }}>{card.desc}</p>
                <span className="text-[10px] md:text-xs tracking-widest uppercase flex items-center gap-2 transition-transform duration-300 group-hover:translate-x-1" style={{ color: 'var(--oak)' }}>
                  {card.label === '髮型設計師' ? '立即預約' : '了解更多'} →
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
      className={`col-span-12 flex flex-col gap-5 md:gap-6 ${reverse ? 'md:col-span-5' : 'md:col-start-8 md:col-span-5'}`}
    >
      <span className="text-xs tracking-[.22em] uppercase" style={{ color: 'var(--oak)' }}>{label}</span>
      <h2 data-animate data-dir="reveal" data-delay="100" className="font-display text-3xl md:text-4xl leading-snug" style={{ color: textColor, fontWeight: 300, letterSpacing: '.03em' }}
        dangerouslySetInnerHTML={{ __html: title }} />
      <p className="text-sm md:text-base leading-relaxed" style={{ color: bodyColor }}>{body}</p>
      <ul className="space-y-3 mt-2">
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
      style={{ height: 'clamp(260px, 50vw, 580px)' }}
    >
      {!reverse && <div className="absolute top-4 left-4 md:top-6 md:left-6 w-full h-full border hidden md:block" style={{ borderColor: 'rgba(166,137,102,.25)' }} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imgSrc} alt={imgAlt} className="relative z-10 w-full h-full object-cover" style={{ borderRadius: '12px', filter: light ? 'brightness(.88) saturate(0.9)' : 'brightness(.85) saturate(1.1)' }} />
      {extra}
    </div>
  )

  return (
    <section className="py-16 lg:py-28" style={{ background: bg || 'var(--charcoal-deep)', borderTop: light ? '1px solid rgba(166,137,102,0.12)' : 'none' }}>
      <div className="max-w-[1440px] mx-auto px-5 lg:px-16 grid grid-cols-12 gap-6 md:gap-8 items-center">
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
    <section className="py-16 lg:py-28 px-5 lg:px-16" style={{ background: 'var(--charcoal-deep)', borderTop: '1px solid rgba(166,137,102,0.14)' }}>
      <div className="max-w-[1440px] mx-auto">
        <div className="text-center mb-12 lg:mb-16">
          <span data-animate className="text-xs tracking-[.22em] uppercase block mb-3" style={{ color: 'var(--oak-light)' }}>PLATFORM FEATURES</span>
          <TextReveal as="h2" delay={80} className="font-display text-3xl md:text-4xl" style={{ color: 'var(--cream)', fontWeight: 300, letterSpacing: '.03em' }}>平台核心功能</TextReveal>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {PILLARS.map((p, i) => (
            <div
              key={p.title}
              data-animate
              data-delay={String(i * 150)}
              className="flex flex-col gap-4 md:gap-5 p-7 md:p-10 card-hover"
              style={{ background: 'rgba(166,137,102,0.06)', border: '1px solid rgba(166,137,102,0.18)', borderRadius: '16px' }}
            >
              <div className="w-11 h-11 border flex items-center justify-center flex-shrink-0" style={{ borderColor: 'rgba(166,137,102,.35)', color: 'var(--oak)', borderRadius: '8px' }}>
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
    <section id="apply" className="py-16 lg:py-28 px-5 lg:px-16" style={{ background: 'var(--charcoal-deep)' }}>
      <div className="max-w-[1440px] mx-auto grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        {/* Left: pitch */}
        <div className="lg:col-span-7 py-4">
          <span data-animate className="text-xs tracking-[.22em] uppercase block mb-4" style={{ color: 'var(--oak-light)' }}>JOIN MOOLAH</span>
          <h2 className="font-display mb-6" style={{ fontSize: 'clamp(2rem,5vw,4rem)', color: 'var(--cream)', fontWeight: 300, letterSpacing: '.02em', lineHeight: 1.2 }}>
            <TextReveal as="span" delay={80} stagger={52} className="block">成為 MooLah</TextReveal>
            <TextReveal as="span" delay={320} stagger={52} className="block">合作設計師</TextReveal>
          </h2>
          <p className="text-base leading-relaxed mb-6 md:mb-8 max-w-xl" style={{ color: 'var(--oak-dim)' }}>
            擁有專屬預約頁面，讓 MooLah 負責排程、通知、客戶管理，你只需要專注在技術與服務。
          </p>
          <ul className="space-y-2 mb-8 max-w-lg">
            {['LINE 一鍵預約，客戶零學習成本', '不抽佣金、不綁約、30 天可終止', '專人 onboard 協助上線設定'].map(t => (
              <li key={t} className="flex items-start gap-3 text-sm" style={{ color: 'var(--cream)' }}>
                <span style={{ width: '6px', height: '6px', background: 'var(--oak)', borderRadius: '50%', marginTop: '8px', flexShrink: 0 }} />
                {t}
              </li>
            ))}
          </ul>
          <Link href="/services" className="inline-block text-sm tracking-widest uppercase border-b pb-1 hover:opacity-80 transition-opacity" style={{ color: 'var(--oak)', borderColor: 'var(--oak)' }}>
            查看完整方案說明 →
          </Link>
        </div>

        {/* Right: lead form + LINE QR */}
        <div className="lg:col-span-5" data-animate data-delay="180">
          <div style={{ padding: '28px 24px', background: 'rgba(166,137,102,0.06)', border: '1px solid rgba(166,137,102,0.22)', borderRadius: '20px' }}>
            <p className="text-xs tracking-[.18em] uppercase mb-2" style={{ color: 'var(--oak)' }}>30 秒申請</p>
            <h3 className="font-display mb-5" style={{ fontSize: 'clamp(1.4rem,3vw,1.8rem)', color: 'var(--cream)', fontWeight: 400, lineHeight: 1.25 }}>
              留下資料<br/>讓 MooLah 聯絡你
            </h3>
            <HomeLeadForm />

            {/* LINE OA QR — 也可以直接加 LINE 私訊 */}
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(166,137,102,0.2)' }}>
              <p className="text-xs text-center mb-3" style={{ color: 'rgba(251,249,244,0.55)', letterSpacing: '0.06em' }}>
                或掃 QR Code 加 LINE 直接聯繫
              </p>
              <div className="flex items-center justify-center gap-4">
                <div style={{ background: 'white', padding: '8px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.18)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/line_oa_partner_qr.png" alt="MooLah 招商 LINE QR Code" width={96} height={96} style={{ display: 'block', borderRadius: '4px' }} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: 'var(--oak)' }}>LINE OA</p>
                  <p className="text-base font-semibold" style={{ color: 'var(--cream)' }}>@492ejbwx</p>
                  <a
                    href="https://line.me/R/ti/p/@492ejbwx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs mt-2 px-3 py-1.5 transition-opacity hover:opacity-80"
                    style={{ background: 'var(--line-green)', color: 'white', borderRadius: '6px' }}
                  >
                    加好友 →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Footer 已抽至 SiteFooter component（共用）

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
      <SiteNav />
      <main className="pt-16 md:pt-20">
        <Hero />
        <TrustBar />
        <Marquee />
        <Services />
        <FeatureRow
          imgSrc="/images/designer_link.png"
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
            <div className="absolute bottom-5 left-5 md:bottom-8 md:left-8 z-20 px-5 md:px-8 py-4 md:py-6" style={{ background: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(16px)', border: '1px solid rgba(166,137,102,.35)', borderRadius: '12px' }}>
              <p className="font-display text-2xl md:text-3xl" style={{ color: 'var(--oak)' }}>98%</p>
              <p className="text-xs tracking-widest uppercase mt-1" style={{ color: 'rgba(44,40,37,0.50)' }}>預約到場率</p>
            </div>
          }
        />
        <FeatureRow
          imgSrc="/images/notification.png"
          imgAlt="LINE 即時通知"
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
        <TestimonialWall />
        <PartnerCTA />
      </main>
      <SiteFooter />
    </>
  )
}
