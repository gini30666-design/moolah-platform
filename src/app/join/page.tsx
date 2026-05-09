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
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border)] bg-[var(--cream)]/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl text-[var(--charcoal)] tracking-wide">MooLah</Link>
        <div className="flex items-center gap-6 text-sm text-[var(--charcoal)]/60">
          <Link href="/services" className="hidden sm:inline hover:text-[var(--oak)] transition-colors">合作方案</Link>
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
      <main className="pt-16">

        {/* Hero */}
        <section className="py-24 px-6 border-b border-[var(--border)] relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 80% at 90% 50%, #e8d5b7 0%, transparent 70%)' }}
          />
          <div className="relative max-w-6xl mx-auto">
            <p className="text-xs tracking-[0.25em] uppercase text-[var(--oak)] mb-4">Join MooLah</p>
            <h1 className="font-display text-[clamp(2.8rem,7vw,6.5rem)] leading-tight text-[var(--charcoal)] mb-8 max-w-3xl">
              讓預約管理<br />
              <span className="italic text-[var(--oak)]">更聰明</span>
            </h1>
            <p className="text-base text-[var(--charcoal)]/55 leading-relaxed max-w-xl mb-10">
              加入 MooLah 合作計畫，建立你的專屬預約頁面。客人透過 LINE 預約，
              你透過後台管理，一切自動化運作，讓你專注在服務本身。
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:gini30666@gmail.com?subject=申請加入 MooLah 合作&body=姓名：%0A服務類別：%0ALINE ID：%0A備註："
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[var(--charcoal)] text-[var(--cream)] text-sm tracking-widest uppercase rounded-full hover:bg-[var(--oak)] transition-colors duration-300"
              >
                立即申請
              </a>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-7 py-3.5 border border-[var(--charcoal)]/20 text-[var(--charcoal)] text-sm tracking-widest uppercase rounded-full hover:border-[var(--oak)] hover:text-[var(--oak)] transition-colors duration-300"
              >
                查看方案
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-14">
              <p className="text-xs tracking-[0.25em] uppercase text-[var(--oak)] mb-3">Why MooLah</p>
              <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] text-[var(--charcoal)]">為什麼選擇我們</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-px bg-[var(--border)]">
              {BENEFITS.map((b) => (
                <div key={b.num} className="bg-[var(--cream)] p-10 hover:bg-[#f5efe6] transition-colors duration-300">
                  <span className="font-display text-6xl text-[var(--oak)]/15 leading-none block mb-6">{b.num}</span>
                  <h3 className="font-display text-2xl text-[var(--charcoal)] mb-4">{b.title}</h3>
                  <p className="text-sm text-[var(--charcoal)]/55 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-24 px-6 bg-[var(--charcoal)]">
          <div className="max-w-6xl mx-auto">
            <div className="mb-14">
              <p className="text-xs tracking-[0.25em] uppercase text-[var(--oak)] mb-3">Onboarding</p>
              <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] text-[var(--cream)]">申請流程</h2>
            </div>
            <div className="space-y-0 divide-y divide-white/10">
              {PROCESS.map((p, i) => (
                <div key={i} className="py-7 grid grid-cols-[auto_1fr_auto] gap-6 items-center">
                  <span className="font-display text-2xl text-[var(--oak)]/30 w-8 text-center">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="text-[var(--cream)] font-medium mb-1">{p.step}</p>
                    <p className="text-sm text-white/40">{p.detail}</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--oak)]/40 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-24 px-6 bg-[#f5efe6]">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-4xl text-[var(--charcoal)] mb-4">
              準備好開始了嗎？
            </h2>
            <p className="text-sm text-[var(--charcoal)]/55 leading-relaxed mb-10">
              發送 Email 給我們，包含你的姓名、服務類別，
              以及你希望提供的服務項目。我們在 24 小時內回覆。
            </p>

            <div className="inline-flex flex-col items-center gap-4">
              <a
                href="mailto:gini30666@gmail.com?subject=申請加入 MooLah 合作&body=姓名：%0A服務類別（髮型/寵物美容/汽車美容/美甲）：%0ALINE ID：%0A服務項目：%0A備註："
                className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--charcoal)] text-[var(--cream)] text-sm tracking-widest uppercase rounded-full hover:bg-[var(--oak)] transition-colors duration-300"
              >
                gini30666@gmail.com
              </a>
              <span className="text-xs text-[var(--charcoal)]/40">點擊即可發送申請 Email</span>
            </div>

            <div className="mt-12 pt-8 border-t border-[var(--oak)]/20 text-center">
              <p className="text-sm text-[var(--charcoal)]/50 mb-3">或查看現有設計師頁面體驗預約流程</p>
              <Link
                href="/designer-001"
                className="text-sm text-[var(--oak)] underline underline-offset-4 hover:text-[var(--charcoal)] transition-colors"
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
