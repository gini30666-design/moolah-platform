import type { Metadata } from 'next'
import Link from 'next/link'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'

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

// ── Line-art SVG icons（oak 色、和首頁一致風格） ────────────────────────────
const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  style: { width: '22px', height: '22px' },
}
const IconSearch = () => <svg {...iconProps}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
const IconGallery = () => <svg {...iconProps}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
const IconClock = () => <svg {...iconProps}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
const IconChat = () => <svg {...iconProps}><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
const IconCalendar = () => <svg {...iconProps}><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="16" y1="3" x2="16" y2="7" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="3" y1="11" x2="21" y2="11" /></svg>
const IconPin = () => <svg {...iconProps}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
const IconRepeat = () => <svg {...iconProps}><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>
const IconHelp = () => <svg {...iconProps}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>

const STEP_ICONS = {
  add: <svg {...iconProps}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>,
  menu: <svg {...iconProps}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
  book: <svg {...iconProps}><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="11" x2="21" y2="11" /><circle cx="12" cy="16" r="2" fill="currentColor" /></svg>,
  bell: <svg {...iconProps}><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>,
}

type Step = {
  no: string
  icon: React.ReactNode
  title: string
  desc: string
}

const oak = '#A68966'
const charcoal = '#2C2825'
const charcoalDeep = '#1a1714'
const cream = '#fbf9f4'
const sand = '#f5efe6'

const STEPS: Step[] = [
  { no: '01', icon: STEP_ICONS.add,  title: '加 MooLah 為好友', desc: '用 LINE 搜尋 @881zhkla 加好友。不需要下載 App，不需要註冊帳號。' },
  { no: '02', icon: STEP_ICONS.menu, title: '點圖文選單探索職人', desc: '加好友後，點下方圖文選單「探索職人」，選類別（髮型 / 寵物 / 汽車 / 美甲）→ 選縣市。' },
  { no: '03', icon: STEP_ICONS.book, title: '挑職人 + 選時段預約', desc: '看作品集、評價、價格，挑一位職人 → 選喜歡的時段 → 確認資料 → 送出。整個流程不超過 60 秒。' },
  { no: '04', icon: STEP_ICONS.bell, title: '收 LINE 確認與提醒', desc: '預約成功立刻收到 LINE 確認訊息，前一天系統自動提醒，再也不會忘記預約。' },
]

const FEATURES = [
  { icon: <IconSearch />,   title: '搜尋附近職人', desc: '按類別 × 縣市快速篩選，看評價挑職人' },
  { icon: <IconGallery />,  title: '作品集 + 評價', desc: '挑職人前先看真實作品與星等評分' },
  { icon: <IconClock />,    title: '即時時段查詢', desc: '一眼看完最近 14 天的空檔，挑你方便的' },
  { icon: <IconChat />,     title: 'LINE 雙向通知', desc: '預約成立、前一天提醒、改期通知都自動推播' },
  { icon: <IconCalendar />, title: '加入行事曆',   desc: '預約完成自動產生 .ics 檔，加入你的行事曆 APP' },
  { icon: <IconPin />,      title: '地圖導航',     desc: '預約後直接傳「地圖」，跳出 Google Maps 路線' },
  { icon: <IconRepeat />,   title: '一鍵再約',     desc: '傳「再約」帶入上次同款設計師，2 個 tap 完成' },
  { icon: <IconHelp />,     title: '智能 FAQ',     desc: '傳「改期」「付款」「客服」即時得到答案' },
]

export default function HowItWorksPage() {
  return (
    <>
      <SiteNav />
      <main style={{ background: cream, minHeight: '100vh' }} className="pt-16 md:pt-20">

        {/* Hero — match homepage editorial style */}
        <section style={{ background: charcoalDeep, position: 'relative', overflow: 'hidden' }} className="py-20 md:py-28 px-5 lg:px-16">
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(to right, transparent, ${oak}, transparent)` }} />
          {/* 大 M 背景 */}
          <div style={{
            position: 'absolute', right: '-3%', bottom: '-22%', fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(280px,30vw,460px)',
            fontWeight: 300, color: 'rgba(166,137,102,0.045)', lineHeight: 0.85, pointerEvents: 'none', userSelect: 'none',
          }}>M</div>

          <div className="max-w-[1280px] mx-auto relative">
            <p className="text-xs tracking-[0.32em] uppercase mb-5" style={{ color: oak }}>How it works</p>
            <h1 className="font-display" style={{ fontSize: 'clamp(2.6rem, 7vw, 5.5rem)', fontWeight: 300, color: cream, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '20px' }}>
              60 秒看懂<br/>MooLah <span style={{ fontStyle: 'italic', color: oak }}>怎麼用</span>
            </h1>
            <div style={{ width: '48px', height: '1.5px', background: `linear-gradient(to right, ${oak}, transparent)`, marginBottom: '24px' }} />
            <p className="text-sm md:text-base leading-loose max-w-xl" style={{ color: 'rgba(251,249,244,0.55)' }}>
              加 LINE 好友 → 選類別 → 挑職人 → 一鍵預約。<br/>
              不需要下載 App、不需要註冊帳號、不收任何手續費。
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link href="/discover" style={{ background: oak, color: cream }} className="px-7 md:px-9 py-4 text-xs md:text-sm tracking-widest uppercase hover:opacity-90 transition-opacity">
                探索職人
              </Link>
              <Link href="/" style={{ borderColor: 'rgba(251,249,244,.22)', color: cream }} className="px-7 md:px-9 py-4 text-xs md:text-sm tracking-widest uppercase border hover:border-[var(--oak)] transition-colors">
                回首頁
              </Link>
            </div>
          </div>
        </section>

        {/* Steps — vertical timeline */}
        <section className="py-16 md:py-24 px-5 lg:px-16">
          <div className="max-w-[760px] mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <p className="text-xs tracking-[0.28em] uppercase mb-4" style={{ color: oak }}>4 Steps</p>
              <h2 className="font-display" style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: charcoal, fontWeight: 400 }}>
                從加好友到<span style={{ fontStyle: 'italic', color: oak }}>收提醒</span>
              </h2>
            </div>

            <div style={{ position: 'relative' }}>
              {/* 垂直連線（連接 4 個步驟的圖示）*/}
              <div style={{
                position: 'absolute',
                left: '31px',
                top: '32px',
                bottom: '32px',
                width: '1.5px',
                background: `linear-gradient(to bottom, ${oak}55 0%, ${oak}22 50%, ${oak}55 100%)`,
                zIndex: 0,
              }} className="hidden sm:block" />

              <ol style={{ listStyle: 'none', padding: 0, margin: 0 }} className="space-y-8 md:space-y-10">
                {STEPS.map(step => (
                  <li key={step.no} style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', position: 'relative', zIndex: 1 }}>
                    {/* 左側 icon 圓圈（壓在垂直線上）*/}
                    <div style={{
                      width: '64px', height: '64px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: cream,
                      color: oak,
                      borderRadius: '50%',
                      border: `1.5px solid ${oak}`,
                      flexShrink: 0,
                      boxShadow: `0 0 0 6px ${cream}`,  // 蓋住連線
                    }}>
                      {step.icon}
                    </div>
                    {/* 右側內容 */}
                    <div style={{ flex: 1, paddingTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', letterSpacing: '0.2em', color: oak, fontWeight: 700 }}>STEP {step.no}</span>
                      </div>
                      <h3 className="font-display" style={{ fontSize: 'clamp(1.4rem,2.5vw,1.7rem)', fontWeight: 500, color: charcoal, lineHeight: 1.3, marginBottom: '8px' }}>{step.title}</h3>
                      <p style={{ fontSize: '14.5px', color: 'rgba(44,40,37,0.65)', lineHeight: 1.85 }}>{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="py-16 md:py-24 px-5 lg:px-16" style={{ background: sand }}>
          <div className="max-w-[1080px] mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs tracking-[0.28em] uppercase mb-4" style={{ color: oak }}>What you get</p>
              <h2 className="font-display" style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: charcoal, fontWeight: 400 }}>
                你用 MooLah 預約<span style={{ fontStyle: 'italic', color: oak }}>可以做什麼</span>
              </h2>
            </div>
            <div className="grid gap-3 md:gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              {FEATURES.map(f => (
                <div key={f.title} style={{ background: 'white', borderRadius: '14px', padding: '24px 22px 22px', border: `1px solid ${oak}22` }}>
                  <div style={{
                    width: '44px', height: '44px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${oak}12`, color: oak,
                    borderRadius: '10px', border: `1px solid ${oak}25`,
                    marginBottom: '14px',
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

        {/* Promises (dark editorial section) */}
        <section className="py-16 md:py-24 px-5 lg:px-16" style={{ background: charcoalDeep }}>
          <div className="max-w-[1080px] mx-auto">
            <div className="pl-5 md:pl-12 py-4 border-l-4 mb-10" style={{ borderColor: oak }}>
              <p className="text-xs tracking-[0.22em] uppercase mb-3" style={{ color: oak }}>Our promise</p>
              <h2 className="font-display" style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: cream, fontWeight: 300, letterSpacing: '0.01em', lineHeight: 1.25 }}>
                三個承諾
              </h2>
            </div>
            <div className="grid gap-4 md:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {[
                { num: '0', label: '抽佣金', desc: '永遠不收一毛抽成' },
                { num: '0', label: 'App 下載', desc: '加 LINE 就能用，零學習' },
                { num: '0', label: '綁約期', desc: '隨時可離開，無解約金' },
              ].map(p => (
                <div key={p.label} style={{ background: 'rgba(166,137,102,0.06)', border: `1px solid ${oak}33`, borderRadius: '14px', padding: '28px 24px' }}>
                  <p className="font-display" style={{ fontSize: 'clamp(3rem,6vw,4.4rem)', color: oak, fontWeight: 300, lineHeight: 0.9, marginBottom: '8px', letterSpacing: '-0.02em' }}>{p.num}</p>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: cream, marginBottom: '6px', letterSpacing: '0.04em' }}>{p.label}</p>
                  <p style={{ fontSize: '13px', color: 'rgba(251,249,244,0.55)', lineHeight: 1.7 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 px-5 lg:px-16" style={{ background: oak }}>
          <div className="max-w-[760px] mx-auto text-center">
            <p className="font-display mb-3" style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', color: cream, fontWeight: 400 }}>
              準備好開始了嗎？
            </p>
            <p className="text-sm mb-7" style={{ color: 'rgba(251,249,244,0.7)' }}>
              台灣高雄、台中、台北均有合作職人
            </p>
            <Link href="/discover" style={{ background: charcoal, color: cream }} className="inline-block px-9 py-4 text-sm tracking-widest uppercase font-semibold hover:opacity-90 transition-opacity">
              探索職人 →
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
