import Link from 'next/link'

const STEPS = [
  {
    no: '01',
    title: '預約成立，雙向即時推播',
    desc: '客人完成預約後，系統在 3 秒內自動透過 LINE 同時通知設計師與客人。設計師收到新預約提醒，客人收到確認訊息，不需要人工回覆。',
    tag: '預約確認',
  },
  {
    no: '02',
    title: '前一天自動提醒，降低爽約率',
    desc: '系統每天 08:00 自動推播隔日排程給設計師，並在預約時間前 24 小時傳送提醒訊息給客人，有效降低臨時爽約率。',
    tag: '提醒通知',
  },
  {
    no: '03',
    title: '取消預約，客人即時知道',
    desc: '若設計師從後台取消預約，系統立即推播取消通知給客人，並附上客服聯絡資訊，保持專業溝通體驗。',
    tag: '取消通知',
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

export default function NotificationPage() {
  return (
    <>
      <Nav />
      <main className="pt-16">

        {/* Hero */}
        <section className="relative overflow-hidden py-20 md:py-28 px-5 md:px-6" style={{ background: 'var(--charcoal)' }}>
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, var(--oak) 0px, var(--oak) 1px, transparent 1px, transparent 44px)' }} />
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(to right, transparent, var(--oak), transparent)' }} />
          <div className="relative max-w-5xl mx-auto">
            <p className="text-xs tracking-[0.25em] uppercase mb-5 anim-fade-up" style={{ color: 'var(--oak)' }}>通知機制</p>
            <h1 className="font-display leading-tight mb-8 anim-fade-up-2" style={{ fontSize: 'clamp(2.8rem,8vw,6.5rem)', color: 'var(--cream)', fontWeight: 300 }}>
              雙向即時通知<br />
              <span className="italic" style={{ color: 'var(--oak)' }}>不漏接</span>
            </h1>
            <p className="text-base md:text-lg max-w-xl leading-relaxed anim-fade-up-3" style={{ color: 'rgba(251,249,244,0.55)' }}>
              預約確認、行程提醒、取消通知，全部透過 LINE 自動處理。設計師與客人同步掌握最新狀態，零溝通成本。
            </p>
          </div>
        </section>
        <div className="h-[2px]" style={{ background: 'linear-gradient(to right, var(--oak), rgba(166,137,102,0.1))' }} />

        {/* LINE mockup + intro */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            {/* mockup */}
            <div data-animate className="bg-[#f5efe6] p-8 border border-[var(--border)]">
              <p className="text-xs tracking-widest uppercase text-[var(--oak)] mb-6">LINE 通知預覽</p>
              <div className="space-y-3">
                {[
                  { label: '✅ 預約確認', msg: '您的預約已成立！\n服務：剪髮造型\n日期：明天 14:00\n設計師：Chloe ✂️' },
                  { label: '🔔 行程提醒', msg: '提醒您，明天 14:00 有預約\n請準時前往 📍\n如需調整請提前告知' },
                  { label: '❌ 取消通知', msg: '很抱歉，您的預約已取消\n如有疑問請聯繫客服\n期待再次為您服務 🙏' },
                ].map((item) => (
                  <div key={item.label} className="bg-white border border-[var(--border)] p-4">
                    <p className="text-xs font-medium text-[var(--oak)] mb-2">{item.label}</p>
                    <p className="text-sm text-[var(--charcoal)]/70 whitespace-pre-line leading-relaxed">{item.msg}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* text */}
            <div data-animate data-delay="100">
              <h2 className="font-display text-3xl text-[var(--charcoal)] mb-6">LINE 推播　零 App 安裝</h2>
              <p className="text-sm text-[var(--charcoal)]/60 leading-relaxed mb-8">
                MooLah 深度整合 LINE 生態系，所有通知透過客人已有的 LINE 帳號直接推送。不需要安裝任何 App，不需要記住帳號密碼，通知自然融入日常使用習慣。
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { num: '3秒', label: '預約成立後推播速度' },
                  { num: '98%', label: '通知到達率' },
                  { num: '08:00', label: '每日設計師排程推播' },
                  { num: '24hr', label: '提前提醒時間' },
                ].map((stat) => (
                  <div key={stat.label} className="border border-[var(--border)] p-5">
                    <p className="font-display text-3xl text-[var(--oak)] mb-1">{stat.num}</p>
                    <p className="text-xs text-[var(--charcoal)]/50 leading-snug">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-20 px-6 bg-[#f5efe6]">
          <div className="max-w-5xl mx-auto">
            <h2 data-animate className="font-display text-4xl text-[var(--charcoal)] mb-14">三種通知　自動觸發</h2>
            <div className="divide-y divide-[var(--border)]">
              {STEPS.map((step, i) => (
                <div key={step.no} data-animate data-delay={String(i * 100)} className="py-10 grid md:grid-cols-[120px_1fr_auto] gap-6 items-start">
                  <span className="font-display text-5xl text-[var(--oak)]/30">{step.no}</span>
                  <div>
                    <h3 className="font-display text-2xl text-[var(--charcoal)] mb-3">{step.title}</h3>
                    <p className="text-sm text-[var(--charcoal)]/60 leading-relaxed max-w-lg">{step.desc}</p>
                  </div>
                  <span className="text-xs border border-[var(--oak)] text-[var(--oak)] px-3 py-1 tracking-widest uppercase whitespace-nowrap self-start">
                    {step.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden py-16 md:py-24 px-5 md:px-6 text-center" style={{ background: 'var(--charcoal)' }}>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, var(--oak) 0px, var(--oak) 1px, transparent 1px, transparent 44px)' }} />
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(to right, transparent, var(--oak), transparent)' }} />
          <div className="relative max-w-lg mx-auto">
            <h2 data-animate className="font-display text-4xl md:text-5xl mb-4" style={{ color: 'var(--cream)', fontWeight: 300 }}>準備好了嗎？</h2>
            <p data-animate data-delay="100" className="text-sm mb-8 md:mb-10" style={{ color: 'rgba(251,249,244,0.55)' }}>立即加入，讓 MooLah 幫你處理所有通知。</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/line" className="px-8 py-4 text-sm tracking-widest uppercase transition-opacity hover:opacity-80" style={{ background: 'var(--oak)', color: 'var(--cream)' }}>
                立即預約
              </Link>
              <Link href="/join" className="px-8 py-4 border text-sm tracking-widest uppercase hover:border-[var(--oak)] transition-colors" style={{ color: 'rgba(251,249,244,0.65)', borderColor: 'rgba(251,249,244,0.20)' }}>
                加入合作
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
