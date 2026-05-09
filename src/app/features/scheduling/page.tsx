import Link from 'next/link'

const FEATURES = [
  {
    no: '01',
    title: 'Duration-Aware 時段計算',
    desc: '系統根據每項服務的實際時長，自動計算哪些時段可以安排。剪髮 60 分鐘、染髮 120 分鐘各自佔用不同時段，設計師不需要手動調整，避免重複預約。',
  },
  {
    no: '02',
    title: '熱門時段標記，引導最佳選擇',
    desc: '快要額滿的時段會自動標記為「熱門」，以橘色提示客人盡早預約。已滿的時段灰色鎖定，不可選取，杜絕超額預約。',
  },
  {
    no: '03',
    title: '緊湊排程，最大化坪效',
    desc: 'MooLah 採緊湊填補策略，優先將空檔安排到已有預約的時段附近，讓設計師的行程更集中，減少零碎空等時間。',
  },
  {
    no: '04',
    title: '每日 08:00 自動推播排程',
    desc: '每天早上 8 點，系統自動將當日預約清單透過 LINE 推播給設計師，讓你一起床就掌握今日行程，從容準備。',
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

export default function SchedulingPage() {
  return (
    <>
      <Nav />
      <main className="pt-16">

        {/* Hero */}
        <section className="py-28 px-6 border-b border-[var(--border)]">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs tracking-[0.25em] uppercase text-[var(--oak)] mb-5 anim-fade-up">排程功能</p>
            <h1 className="font-display text-[clamp(3rem,8vw,6.5rem)] leading-tight text-[var(--charcoal)] mb-8 anim-fade-up-2">
              智能排程<br />
              <span className="italic text-[var(--oak)]">零空窗</span>
            </h1>
            <p className="text-lg text-[var(--charcoal)]/55 max-w-xl leading-relaxed anim-fade-up-3">
              MooLah 的智慧時段引擎自動計算可用時段、標記熱門時間、緊湊填補空缺，讓設計師的每一分鐘都發揮最大價值。
            </p>
          </div>
        </section>

        {/* Stats bar */}
        <section className="py-10 px-6 border-b border-[var(--border)] bg-[var(--charcoal)]">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { num: '自動', label: '時段佔用計算' },
              { num: '熱門標記', label: '快額滿時段提示' },
              { num: '08:00', label: '每日排程推播' },
              { num: '緊湊填補', label: '零碎空等最小化' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-2xl text-[var(--oak)] mb-1">{s.num}</p>
                <p className="text-xs text-white/40 tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Feature list */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-4xl text-[var(--charcoal)] mb-14">四大排程核心功能</h2>
            <div className="divide-y divide-[var(--border)]">
              {FEATURES.map((f) => (
                <div key={f.no} className="py-10 grid md:grid-cols-[100px_1fr] gap-8 items-start">
                  <span className="font-display text-5xl text-[var(--oak)]/25">{f.no}</span>
                  <div>
                    <h3 className="font-display text-2xl text-[var(--charcoal)] mb-4">{f.title}</h3>
                    <p className="text-sm text-[var(--charcoal)]/60 leading-relaxed max-w-2xl">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Visual: time slots mockup */}
        <section className="py-20 px-6 bg-[#f5efe6]">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-3xl text-[var(--charcoal)] mb-6">時段狀態一目了然</h2>
              <p className="text-sm text-[var(--charcoal)]/60 leading-relaxed mb-8">
                客人在預約頁面看到的時段清楚區分三種狀態，引導他們快速做出選擇，設計師不需要手動管理任何空檔。
              </p>
              <div className="space-y-3">
                {[
                  { color: 'bg-white border border-[var(--border)]', text: '可預約', note: '開放選取' },
                  { color: 'bg-orange-100 border border-orange-300', text: '🔥 熱門', note: '即將額滿，建議盡早預約' },
                  { color: 'bg-[var(--border)] opacity-60', text: '已額滿', note: '無法選取' },
                ].map((slot) => (
                  <div key={slot.text} className="flex items-center gap-4">
                    <div className={`px-4 py-2 text-sm text-[var(--charcoal)] min-w-[100px] text-center ${slot.color}`}>{slot.text}</div>
                    <p className="text-xs text-[var(--charcoal)]/50">{slot.note}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* calendar mockup */}
            <div className="bg-white border border-[var(--border)] p-6">
              <p className="text-xs tracking-widest uppercase text-[var(--oak)] mb-4">今日排程 · Chloe</p>
              <div className="space-y-2">
                {[
                  { time: '10:00', service: '染髮造型', client: '王小姐', dur: '120 min', status: 'confirmed' },
                  { time: '12:00', service: '——', client: '——', dur: '', status: 'empty' },
                  { time: '13:00', service: '剪髮', client: '林先生', dur: '60 min', status: 'confirmed' },
                  { time: '14:00', service: '造型燙', client: '陳小姐', dur: '90 min', status: 'confirmed' },
                  { time: '15:30', service: '剪髮', client: '張小姐', dur: '60 min', status: 'hot' },
                  { time: '16:30', service: '——', client: '開放中', dur: '', status: 'open' },
                ].map((slot) => (
                  <div
                    key={slot.time}
                    className={`flex items-center gap-3 p-3 text-sm ${
                      slot.status === 'confirmed' ? 'bg-[#f5efe6]' :
                      slot.status === 'hot' ? 'bg-orange-50 border border-orange-200' :
                      slot.status === 'empty' ? 'opacity-30' : 'bg-white border border-dashed border-[var(--border)]'
                    }`}
                  >
                    <span className="font-display text-[var(--charcoal)] w-12 shrink-0">{slot.time}</span>
                    <span className="text-[var(--charcoal)]/70 flex-1">{slot.service}</span>
                    <span className="text-[var(--charcoal)]/40 text-xs">{slot.dur}</span>
                    {slot.status === 'hot' && <span className="text-orange-500 text-xs">🔥 熱門</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 text-center">
          <div className="max-w-lg mx-auto">
            <h2 className="font-display text-5xl text-[var(--charcoal)] mb-4">讓排程自動運作</h2>
            <p className="text-sm text-[var(--charcoal)]/55 mb-10">加入 MooLah，從今天起告別手動記帳。</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/line" className="px-8 py-4 bg-[var(--charcoal)] text-[var(--cream)] text-sm tracking-widest uppercase rounded-full hover:bg-[var(--oak)] transition-colors">
                立即預約
              </Link>
              <Link href="/join" className="px-8 py-4 border border-[var(--charcoal)]/20 text-[var(--charcoal)] text-sm tracking-widest uppercase rounded-full hover:border-[var(--oak)] hover:text-[var(--oak)] transition-colors">
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
