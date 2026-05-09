import Link from 'next/link'

const STEPS = [
  {
    no: '01',
    title: '掃描 QR Code 或點擊連結',
    desc: '設計師分享個人專屬短連結（如 moolah-platform.vercel.app/go/chloe），客人透過 LINE 訊息、IG 簡介或名片掃描進入。',
    detail: '無需下載 App，有 LINE 就能用',
  },
  {
    no: '02',
    title: '瀏覽設計師個人頁面',
    desc: '客人看到設計師的作品集、服務項目、價格與營業資訊，清楚了解後再選擇。',
    detail: '作品集、服務、價格一頁呈現',
  },
  {
    no: '03',
    title: '選擇服務 + 填寫資訊',
    desc: '選好服務項目後，填入姓名、電話、備註（如特殊需求、髮況說明），並選擇性別與目前髮長。',
    detail: '支援備註與特殊需求輸入',
  },
  {
    no: '04',
    title: '選擇預約時段',
    desc: '系統顯示可預約時段，標示熱門時段供參考。客人選定後點擊送出，整個過程不超過 60 秒。',
    detail: '智慧時段，即時顯示可用狀態',
  },
  {
    no: '05',
    title: 'LINE 雙向確認通知',
    desc: '預約成立後 3 秒內，設計師與客人同時收到 LINE 確認訊息。預約時間前 24 小時再自動提醒一次。',
    detail: '雙向通知，零溝通成本',
  },
]

function Nav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border)] bg-[var(--cream)]/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl text-[var(--charcoal)] tracking-wide">MooLah</Link>
        <Link
          href="/line"
          className="px-4 py-2 bg-[var(--charcoal)] text-[var(--cream)] text-xs tracking-widest uppercase rounded-full hover:bg-[var(--oak)] transition-colors"
        >
          立即預約
        </Link>
      </div>
    </nav>
  )
}

export default function BookingGuidePage() {
  return (
    <>
      <Nav />
      <main className="pt-16">

        {/* Hero */}
        <section className="relative overflow-hidden py-20 md:py-28 px-5 md:px-6" style={{ background: 'var(--charcoal)' }}>
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, var(--oak) 0px, var(--oak) 1px, transparent 1px, transparent 44px)' }} />
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(to right, transparent, var(--oak), transparent)' }} />
          <div className="relative max-w-5xl mx-auto">
            <p className="text-xs tracking-[0.25em] uppercase mb-5 anim-fade-up" style={{ color: 'var(--oak)' }}>預約流程</p>
            <h1 className="font-display leading-tight mb-8 anim-fade-up-2" style={{ fontSize: 'clamp(2.8rem,8vw,6.5rem)', color: 'var(--cream)', fontWeight: 300 }}>
              LINE 一鍵預約<br />
              <span className="italic" style={{ color: 'var(--oak)' }}>60 秒完成</span>
            </h1>
            <p className="text-base md:text-lg max-w-xl leading-relaxed anim-fade-up-3" style={{ color: 'rgba(251,249,244,0.55)' }}>
              從點擊連結到預約確認，MooLah 將整個預約流程壓縮在 60 秒以內。客人不需要安裝任何 App，設計師不需要手動回覆任何訊息。
            </p>
          </div>
        </section>
        <div className="h-[2px]" style={{ background: 'linear-gradient(to right, var(--oak), rgba(166,137,102,0.1))' }} />

        {/* Quick stats */}
        <section className="grid grid-cols-3 divide-x divide-[var(--border)] border-b border-[var(--border)]">
          {[
            { num: '60 秒', label: '完成整個預約流程' },
            { num: '0 個', label: 'App 需要下載' },
            { num: '3 秒', label: '確認通知到達' },
          ].map((s) => (
            <div key={s.label} className="py-10 px-8 text-center">
              <p className="font-display text-4xl text-[var(--oak)] mb-2">{s.num}</p>
              <p className="text-xs text-[var(--charcoal)]/50 tracking-wide">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Steps */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-4xl text-[var(--charcoal)] mb-14">五步驟預約流程</h2>
            <div className="relative">
              {/* vertical line */}
              <div className="absolute left-[47px] top-0 bottom-0 w-px bg-[var(--border)] hidden md:block" />
              <div className="space-y-0 divide-y divide-[var(--border)]">
                {STEPS.map((step) => (
                  <div key={step.no} className="py-10 grid md:grid-cols-[96px_1fr] gap-6 items-start">
                    <div className="relative z-10 bg-[var(--cream)]">
                      <span className="font-display text-5xl text-[var(--oak)]/30">{step.no}</span>
                    </div>
                    <div>
                      <h3 className="font-display text-2xl text-[var(--charcoal)] mb-3">{step.title}</h3>
                      <p className="text-sm text-[var(--charcoal)]/60 leading-relaxed mb-4 max-w-xl">{step.desc}</p>
                      <span className="text-xs border border-[var(--oak)]/40 text-[var(--oak)] px-3 py-1 tracking-widest uppercase">
                        {step.detail}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Who is it for */}
        <section className="py-20 px-6 bg-[#f5efe6]">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-4xl text-[var(--charcoal)] mb-12">適合哪些設計師？</h2>
            <div className="grid md:grid-cols-2 gap-px bg-[var(--border)]">
              {[
                { title: '髮型設計師', desc: '剪髮、染髮、燙髮、護髮，各項服務設定不同時長，系統自動計算時段。' },
                { title: '寵物美容師', desc: '根據毛孩品種與體型設定服務時長，客人提前填寫備註，溝通更順暢。' },
                { title: '汽車美容師', desc: '鍍膜、打蠟、清潔分開設定，支援到府服務備註，彈性排程。' },
                { title: '美甲師', desc: '手繪、凝膠、光療各自設定時長，熱門設計提前顯示供客人參考。' },
              ].map((item) => (
                <div key={item.title} className="bg-[var(--cream)] p-10">
                  <h3 className="font-display text-2xl text-[var(--charcoal)] mb-3">{item.title}</h3>
                  <p className="text-sm text-[var(--charcoal)]/60 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 px-5 md:px-6 text-center" style={{ background: 'var(--charcoal)' }}>
          <div className="max-w-lg mx-auto">
            <h2 className="font-display text-4xl md:text-5xl mb-4" style={{ color: 'var(--cream)', fontWeight: 300 }}>立即體驗</h2>
            <p className="text-sm mb-8 md:mb-10" style={{ color: 'rgba(251,249,244,0.50)' }}>掃描下方 QR Code，現在就試試 MooLah 預約流程。</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/line"
                className="px-8 py-4 bg-[var(--oak)] text-white text-sm tracking-widest uppercase rounded-full hover:bg-[var(--oak-light)] transition-colors"
              >
                掃碼立即預約
              </Link>
              <Link
                href="/join"
                className="px-8 py-4 border border-white/20 text-white text-sm tracking-widest uppercase rounded-full hover:border-[var(--oak)] transition-colors"
              >
                我要加入設計師
              </Link>
            </div>
          </div>
        </section>

      </main>
      <footer className="border-t border-[var(--border)] py-8 px-6 text-center">
        <Link href="/" className="font-display text-xl text-[var(--charcoal)] hover:text-[var(--oak)] transition-colors">MooLah</Link>
        <p className="text-xs text-[var(--charcoal)]/30 mt-2">© 2026 MooLah. All rights reserved.</p>
      </footer>
    </>
  )
}
