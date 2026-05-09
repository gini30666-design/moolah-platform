import Link from 'next/link'

const BENEFITS = [
  {
    title: '5 分鐘完成設定',
    desc: '提供基本資料，MooLah 團隊協助建立你的專屬預約頁面，當天即可上線。',
    num: '01',
  },
  {
    title: '零技術門檻',
    desc: '不需要寫程式、不需要架設網站。一切透過 LINE 與 Google Sheets 輕鬆管理。',
    num: '02',
  },
  {
    title: '客人輕鬆預約',
    desc: '客人透過你的 LINE OA 或分享連結進入預約頁，全程在 LINE 內完成，不用另外下載 App。',
    num: '03',
  },
  {
    title: '後台即時掌握',
    desc: '設計師專屬後台，今日預約、待服務、歷史紀錄一目瞭然，取消預約系統自動通知客人。',
    num: '04',
  },
]

const PROCESS = [
  { step: '填寫申請表單', detail: '提供姓名、服務項目、聯絡方式' },
  { step: '24 小時內回覆', detail: 'MooLah 團隊審核並聯絡你' },
  { step: '建立預約頁面', detail: '協助設定服務項目、時段與個人資料' },
  { step: '正式上線', detail: '分享連結，立即開始接受預約' },
]

function Nav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border)]" style={{ background: 'rgba(251,249,244,0.92)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-6xl mx-auto px-5 md:px-6 h-14 md:h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-[var(--charcoal)] tracking-wide">MooLah</Link>
        <div className="flex items-center gap-4 md:gap-6 text-sm text-[var(--charcoal)]/60">
          <Link href="/services" className="hidden sm:inline hover:text-[var(--oak)] transition-colors">合作方案</Link>
          <Link
            href="/go/chloe"
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
    <footer className="border-t border-[var(--border)] py-10 md:py-12 px-5 md:px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <Link href="/" className="font-display text-xl text-[var(--charcoal)] block mb-1">MooLah</Link>
          <p className="text-xs text-[var(--charcoal)]/40">© 2026 MooLah. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap gap-4 md:gap-6 text-xs text-[var(--charcoal)]/50">
          <Link href="/services" className="hover:text-[var(--oak)] transition-colors">合作方案</Link>
          <a href="mailto:gini30666@gmail.com" className="hover:text-[var(--oak)] transition-colors">聯絡我們</a>
        </div>
      </div>
    </footer>
  )
}

export default function JoinPage() {
  return (
    <>
      <Nav />
      <main className="pt-14 md:pt-16">

        {/* Hero — dark with texture */}
        <section className="relative overflow-hidden py-20 md:py-28 px-5 md:px-6" style={{ background: 'var(--charcoal)' }}>
          {/* Diagonal texture */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, var(--oak) 0px, var(--oak) 1px, transparent 1px, transparent 44px)'
          }} />
          {/* Radial warm glow */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 60% 80% at 90% 50%, rgba(166,137,102,0.15) 0%, transparent 70%)'
          }} />
          {/* Oak accent top */}
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(to right, transparent, var(--oak), transparent)' }} />

          <div className="relative max-w-6xl mx-auto">
            <p data-animate className="text-xs tracking-[0.25em] uppercase mb-4" style={{ color: 'var(--oak)' }}>Join MooLah</p>
            <h1 data-animate data-delay="100" className="font-display leading-tight mb-8 max-w-3xl" style={{ fontSize: 'clamp(2.8rem,7vw,6.5rem)', color: 'var(--cream)', fontWeight: 300 }}>
              讓預約管理<br />
              <span className="italic" style={{ color: 'var(--oak)' }}>更聰明</span>
            </h1>
            <p data-animate data-delay="200" className="text-sm md:text-base leading-relaxed max-w-xl mb-10" style={{ color: 'rgba(251,249,244,0.55)' }}>
              加入 MooLah 合作計畫，建立你的專屬預約頁面。客人透過 LINE 預約，
              你透過後台管理，一切自動化運作，讓你專注在服務本身。
            </p>
            <div data-animate data-delay="300" className="flex flex-wrap gap-3">
              <a
                href="mailto:gini30666@gmail.com?subject=申請加入 MooLah 合作&body=姓名：%0A服務類別：%0ALINE ID：%0A備註："
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm tracking-widest uppercase transition-opacity hover:opacity-80"
                style={{ background: 'var(--oak)', color: 'var(--cream)' }}
              >
                立即申請
              </a>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-7 py-3.5 border text-sm tracking-widest uppercase hover:border-[var(--oak)] transition-colors"
                style={{ color: 'rgba(251,249,244,0.65)', borderColor: 'rgba(251,249,244,0.20)' }}
              >
                查看方案
              </Link>
            </div>
          </div>
        </section>

        {/* Oak divider */}
        <div className="h-[2px]" style={{ background: 'linear-gradient(to right, var(--oak), rgba(166,137,102,0.15))' }} />

        {/* Benefits */}
        <section className="py-16 md:py-24 px-5 md:px-6" style={{ background: '#f5efe6' }}>
          <div className="max-w-6xl mx-auto">
            <div data-animate className="mb-10 md:mb-14">
              <p className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: 'var(--oak)' }}>Why MooLah</p>
              <h2 className="font-display" style={{ fontSize: 'clamp(2rem,4vw,3.5rem)', color: 'var(--charcoal)', fontWeight: 400 }}>為什麼選擇我們</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 md:gap-px md:bg-[var(--border)]">
              {BENEFITS.map((b, i) => (
                <div key={b.num}
                  data-animate
                  data-delay={String(i * 100)}
                  className="bg-white p-8 md:p-10 hover:bg-[#faf8f5] transition-colors duration-300 card-hover">
                  <span className="font-display text-5xl md:text-6xl leading-none block mb-5 md:mb-6" style={{ color: 'rgba(166,137,102,0.15)' }}>{b.num}</span>
                  <h3 className="font-display text-xl md:text-2xl mb-3 md:mb-4" style={{ color: 'var(--charcoal)' }}>{b.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(44,40,37,0.55)' }}>{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process — dark */}
        <section className="relative overflow-hidden py-16 md:py-24 px-5 md:px-6" style={{ background: 'var(--charcoal)' }}>
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'repeating-linear-gradient(-45deg, var(--oak) 0px, var(--oak) 1px, transparent 1px, transparent 44px)'
          }} />
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(to right, transparent, var(--oak), transparent)' }} />
          <div className="relative max-w-6xl mx-auto">
            <div data-animate className="mb-10 md:mb-14">
              <p className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: 'var(--oak)' }}>Onboarding</p>
              <h2 className="font-display" style={{ fontSize: 'clamp(2rem,4vw,3.5rem)', color: 'var(--cream)', fontWeight: 300 }}>申請流程</h2>
            </div>
            <div className="space-y-0 divide-y divide-white/10">
              {PROCESS.map((p, i) => (
                <div key={i}
                  data-animate
                  data-delay={String(i * 100)}
                  className="py-6 md:py-7 grid grid-cols-[auto_1fr_auto] gap-4 md:gap-6 items-center">
                  <span className="font-display text-xl md:text-2xl w-7 md:w-8 text-center" style={{ color: 'rgba(166,137,102,0.30)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="text-sm md:text-base font-medium mb-0.5" style={{ color: 'var(--cream)' }}>{p.step}</p>
                    <p className="text-xs md:text-sm" style={{ color: 'rgba(251,249,244,0.40)' }}>{p.detail}</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'rgba(166,137,102,0.40)' }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="relative overflow-hidden py-16 md:py-24 px-5 md:px-6" style={{ background: 'white' }}>
          {/* Decorative watermark */}
          <div className="absolute left-0 bottom-0 font-display leading-none pointer-events-none select-none" style={{ fontSize: 'clamp(5rem,20vw,16rem)', color: 'rgba(166,137,102,0.04)', lineHeight: 0.9 }}>Join</div>
          <div data-animate className="relative max-w-2xl mx-auto text-center">
            <p className="text-xs tracking-[0.22em] uppercase mb-3" style={{ color: 'var(--oak)' }}>APPLY NOW</p>
            <h2 className="font-display text-3xl md:text-4xl mb-4" style={{ color: 'var(--charcoal)', fontWeight: 400 }}>
              準備好開始了嗎？
            </h2>
            <p className="text-sm leading-relaxed mb-10" style={{ color: 'rgba(44,40,37,0.55)' }}>
              發送 Email 給我們，包含你的姓名、服務類別，
              以及你希望提供的服務項目。我們在 24 小時內回覆。
            </p>

            <div className="inline-flex flex-col items-center gap-4">
              <a
                href="mailto:gini30666@gmail.com?subject=申請加入 MooLah 合作&body=姓名：%0A服務類別（髮型/寵物美容/汽車美容/美甲）：%0ALINE ID：%0A服務項目：%0A備註："
                className="inline-flex items-center gap-2 px-7 md:px-8 py-3.5 md:py-4 text-sm tracking-widest uppercase transition-opacity hover:opacity-80"
                style={{ background: 'var(--charcoal)', color: 'var(--cream)' }}
              >
                gini30666@gmail.com
              </a>
              <span className="text-xs" style={{ color: 'rgba(44,40,37,0.40)' }}>點擊即可發送申請 Email</span>
            </div>

            <div className="mt-12 pt-8 border-t text-center" style={{ borderColor: 'rgba(166,137,102,0.20)' }}>
              <p className="text-sm mb-3" style={{ color: 'rgba(44,40,37,0.50)' }}>或查看現有設計師頁面體驗預約流程</p>
              <Link
                href="/go/chloe"
                className="text-sm underline underline-offset-4 hover:opacity-70 transition-opacity"
                style={{ color: 'var(--oak)' }}
              >
                體驗 Demo 預約頁面 →
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
