import Link from 'next/link'
import Image from 'next/image'

const LINE_PATH = "M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.630 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.630 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"

const SERVICES = [
  {
    no: '01', label: '髮型設計師', en: 'Hair Designer',
    desc: '剪髮・染髮・燙髮，一站搞定',
    img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80&fit=crop',
    href: '/discover?category=髮型設計師',
  },
  {
    no: '02', label: '寵物美容師', en: 'Pet Grooming',
    desc: '毛孩質感 SPA，焦點造型',
    img: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80&fit=crop',
    href: '/discover?category=寵物美容師',
  },
  {
    no: '03', label: '汽車美容師', en: 'Auto Detailing',
    desc: '鍍膜・拋光・深層清潔',
    img: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&q=80&fit=crop',
    href: '/discover?category=汽車美容師',
  },
  {
    no: '04', label: '美甲師', en: 'Nail Artist',
    desc: '凝膠・光療・精緻彩繪',
    img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80&fit=crop',
    href: '/discover?category=美甲師',
  },
]

export default function LinePage() {
  return (
    <>
      {/* NAV */}
      <nav style={{ background: 'var(--charcoal-deep)', borderBottom: '1px solid rgba(166,137,102,0.20)' }}
        className="fixed top-0 w-full z-50">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center px-5 md:px-16 h-16 md:h-20">
          <Link href="/" className="font-display text-xl tracking-[.2em] uppercase text-[var(--cream)]">MooLah</Link>
          <Link href="/discover"
            className="text-xs tracking-widest uppercase px-5 py-2.5 border hover:border-[var(--oak)] transition-colors"
            style={{ color: 'var(--oak-dim)', borderColor: 'rgba(166,137,102,0.30)' }}>
            瀏覽職人 →
          </Link>
        </div>
      </nav>

      <main className="pt-20" style={{ background: 'var(--charcoal-deep)' }}>

        {/* HERO STRIP */}
        <section className="relative overflow-hidden" style={{ background: 'var(--charcoal-deep)', borderBottom: '1px solid rgba(166,137,102,0.18)' }}>
          {/* Oak accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(to right, transparent, var(--oak), transparent)' }} />
          <div className="max-w-[1440px] mx-auto px-5 md:px-16 py-16 md:py-24 grid grid-cols-12 gap-8 md:gap-12 items-center">
            <div data-animate data-dir="left" className="col-span-12 lg:col-span-6 flex flex-col gap-8">
              <span className="text-xs tracking-[.22em] uppercase flex items-center gap-3" style={{ color: 'var(--oak)' }}>
                <span className="inline-block w-8 h-px" style={{ background: 'var(--oak)' }} />
                LINE OFFICIAL ACCOUNT
              </span>
              <h1 className="font-display leading-tight" style={{ fontSize: 'clamp(2.5rem,5.5vw,4.5rem)', fontWeight: 300, letterSpacing: '-0.01em', color: 'var(--cream)' }}>
                掃碼加入<br />
                <em style={{ fontStyle: 'italic', color: 'var(--oak)' }}>MooLah</em> 官方帳號
              </h1>
              <p className="text-base leading-relaxed max-w-md" style={{ color: 'var(--oak-dim)' }}>
                加入後即可瀏覽全台合作職人、預約喜愛的服務、接收即時通知。<br />
                不需下載 App，LINE 直接操作。
              </p>
              {/* Stats */}
              <div className="flex gap-10 pt-6 mt-2 border-t" style={{ borderColor: 'rgba(166,137,102,0.30)' }}>
                {[['200+','合作職人'],['60 秒','完成預約'],['4.9 ★','使用者評分']].map(([n,l]) => (
                  <div key={l}>
                    <p className="font-display text-2xl" style={{ color: 'var(--oak)' }}>{n}</p>
                    <p className="text-xs tracking-widest uppercase mt-1" style={{ color: 'var(--oak-dim)' }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Code Card */}
            <div data-animate data-dir="right" className="col-span-12 lg:col-span-5 lg:col-start-8 flex justify-center">
              <div className="relative" style={{ padding: '2px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(166,137,102,0.6), rgba(166,137,102,0.15), rgba(166,137,102,0.5))' }}>
                <div className="flex flex-col items-center gap-6 px-10 py-10" style={{ background: 'rgba(20,18,15,0.95)', borderRadius: '22px', backdropFilter: 'blur(20px)' }}>
                  {/* Corner accents */}
                  <div className="relative">
                    <div className="absolute -top-3 -left-3 w-5 h-5 border-t-2 border-l-2" style={{ borderColor: 'var(--oak)' }} />
                    <div className="absolute -top-3 -right-3 w-5 h-5 border-t-2 border-r-2" style={{ borderColor: 'var(--oak)' }} />
                    <div className="absolute -bottom-3 -left-3 w-5 h-5 border-b-2 border-l-2" style={{ borderColor: 'var(--oak)' }} />
                    <div className="absolute -bottom-3 -right-3 w-5 h-5 border-b-2 border-r-2" style={{ borderColor: 'var(--oak)' }} />
                    <div style={{ background: 'white', padding: '16px', borderRadius: '12px' }}>
                      <Image
                        src="https://qr-official.line.me/gs/M_881zhkla_GW.png"
                        alt="MooLah LINE QR Code"
                        width={200} height={200}
                        unoptimized
                        className="block"
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: 'var(--oak)' }}>LINE ID</p>
                    <p className="font-display text-lg tracking-widest" style={{ color: 'var(--cream)' }}>@881zhkla</p>
                  </div>
                  <a
                    href="https://line.me/R/ti/p/@881zhkla"
                    target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium tracking-widest uppercase transition-opacity hover:opacity-88"
                    style={{ background: '#06C755', color: '#fff', borderRadius: '999px' }}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="white"><path d={LINE_PATH}/></svg>
                    開啟 LINE 加入
                  </a>
                  <Link
                    href="/discover"
                    className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium tracking-widest uppercase transition-opacity hover:opacity-80"
                    style={{ border: '1.5px solid rgba(166,137,102,0.55)', color: 'var(--oak)', borderRadius: '999px' }}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}><path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd"/></svg>
                    瀏覽所有職人
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES GRID */}
        <section style={{ background: 'var(--charcoal)', borderBottom: '1px solid rgba(166,137,102,0.14)' }} className="py-16 md:py-24 px-5 md:px-16">
          <div className="max-w-[1440px] mx-auto">
            <div data-animate className="flex items-end justify-between mb-12 pb-6 border-b" style={{ borderColor: 'rgba(166,137,102,.20)' }}>
              <div>
                <span className="text-xs tracking-[.2em] uppercase block mb-3" style={{ color: 'var(--oak)' }}>可預約服務</span>
                <h2 className="font-display text-3xl" style={{ color: 'var(--cream)', fontWeight: 300 }}>四大服務類別</h2>
              </div>
              <Link href="/discover" className="text-xs tracking-widest uppercase pb-1 border-b hover:opacity-70" style={{ color: 'var(--oak-dim)', borderColor: 'var(--oak-dim)' }}>
                開始搜尋職人 →
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {SERVICES.map((s, i) => (
                <Link key={s.no} href={s.href}
                  data-animate
                  data-dir="scale"
                  data-delay={String(i * 100)}
                  className="group relative overflow-hidden block card-hover"
                  style={{ height: '280px', borderRadius: '16px', border: '1px solid rgba(166,137,102,.20)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.img} alt={s.label} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ opacity: 0.7, filter: 'brightness(.80) saturate(1.0)' }} />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(20,16,12,0.92) 30%, transparent 70%)' }} />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-xs tracking-[.2em] uppercase mb-1.5" style={{ color: 'var(--oak)' }}>{s.no}</p>
                    <h3 className="font-display text-lg mb-1" style={{ color: 'var(--cream)', fontWeight: 300 }}>{s.label}</h3>
                    <p className="text-xs" style={{ color: 'var(--oak-dim)' }}>{s.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ background: '#f5efe6' }} className="py-16 md:py-24 px-5 md:px-16">
          <div className="max-w-[1440px] mx-auto">
            <div data-animate className="text-center mb-14">
              <span className="text-xs tracking-[.22em] uppercase block mb-3" style={{ color: 'var(--oak)' }}>HOW IT WORKS</span>
              <h2 className="font-display text-3xl" style={{ color: 'var(--charcoal)', fontWeight: 300 }}>三步驟完成預約</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '01', title: '加入 LINE OA', desc: '掃描 QR Code 或搜尋 @881zhkla，加入 MooLah 官方帳號，開啟預約入口。' },
                { step: '02', title: '選擇職人', desc: '依服務類別與所在縣市搜尋，瀏覽作品集、服務項目與定價，找到最適合的職人。' },
                { step: '03', title: '確認預約', desc: '選擇服務項目與時段，送出後雙方立即收到 LINE 確認通知，零溝通成本。' },
              ].map((item, i) => (
                <div key={item.step}
                  data-animate
                  data-delay={String(i * 150)}
                  className="flex flex-col gap-4 p-8 card-hover" style={{ background: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(10px)', border: '1px solid rgba(166,137,102,0.18)', borderRadius: '16px' }}>
                  <div className="font-display text-5xl" style={{ color: 'rgba(166,137,102,0.25)', lineHeight: 1 }}>{item.step}</div>
                  <h3 className="font-display text-xl" style={{ color: 'var(--charcoal)', fontWeight: 400 }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(44,40,37,0.60)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FOOTER */}
        <section style={{ background: 'var(--charcoal-deep)', borderTop: '1px solid rgba(166,137,102,0.20)' }} className="py-14 md:py-20 px-5 md:px-16 text-center">
          <div data-animate className="max-w-2xl mx-auto">
            <p className="text-xs tracking-[.22em] uppercase mb-4" style={{ color: 'var(--oak)' }}>加入合作</p>
            <h2 className="font-display mb-6" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 300, color: 'var(--cream)' }}>
              您是美業職人？
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: 'var(--oak-dim)' }}>
              免費建立專屬預約頁，讓 MooLah 幫你處理排程與通知。<br />5 分鐘完成建檔，立即接受線上預約。
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/join"
                className="px-10 py-4 text-sm tracking-widest uppercase hover:opacity-90 transition-opacity"
                style={{ background: 'var(--oak)', color: 'var(--cream)', borderRadius: '4px' }}>
                申請加入
              </Link>
              <Link href="/services"
                className="px-10 py-4 text-sm tracking-widest uppercase border hover:border-[var(--oak)] transition-colors"
                style={{ color: 'var(--cream)', borderColor: 'rgba(251,249,244,.25)', borderRadius: '4px' }}>
                查看方案
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ background: '#0f0e0c', borderTop: '2px solid var(--oak)' }} className="py-6 px-5 md:px-16 text-center">
        <p className="text-xs tracking-widest" style={{ color: 'var(--oak-dim)' }}>© 2026 MOOLAH · 高雄，台灣</p>
      </footer>
    </>
  )
}
