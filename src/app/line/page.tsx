import Link from 'next/link'
import Image from 'next/image'

export default function LinePage() {
  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border)] bg-[var(--cream)]/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-2xl text-[var(--charcoal)] tracking-wide">MooLah</Link>
        </div>
      </nav>

      <main className="pt-16 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">

          {/* label */}
          <p className="text-xs tracking-[0.25em] uppercase text-[var(--oak)] mb-6 anim-fade-up">LINE 官方帳號</p>

          {/* headline */}
          <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] leading-tight text-[var(--charcoal)] mb-4 anim-fade-up-2">
            掃碼加入<br />
            <span className="italic text-[var(--oak)]">MooLah</span>
          </h1>
          <p className="text-sm text-[var(--charcoal)]/55 leading-relaxed mb-10 anim-fade-up-3">
            掃描下方 QR Code，加入 MooLah LINE 官方帳號，<br />即可開始瀏覽設計師並預約服務。
          </p>

          {/* QR Code */}
          <div className="anim-fade-up-4 inline-block border border-[var(--border)] p-6 bg-white mb-8">
            {/* LINE 官方 QR Code 圖片 */}
            <Image
              src="https://qr-official.line.me/gs/M_881zhkla_GW.png"
              alt="MooLah LINE QR Code"
              width={200}
              height={200}
              unoptimized
              className="block mx-auto"
            />
            <p className="text-xs text-[var(--charcoal)]/40 mt-4 tracking-widest uppercase">@881zhkla</p>
          </div>

          {/* CTA button */}
          <div className="flex flex-col gap-4 items-center">
            <a
              href="https://line.me/R/ti/p/@881zhkla"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full max-w-xs flex items-center justify-center gap-3 px-8 py-4 rounded-full text-white text-sm tracking-widest uppercase transition-opacity hover:opacity-90"
              style={{ background: '#06C755' }}
            >
              {/* LINE icon */}
              <svg width="20" height="20" viewBox="0 0 48 48" fill="white">
                <path d="M24 4C13 4 4 11.6 4 21c0 5.8 3.3 10.9 8.4 14.2-.4 1.4-1.3 4.9-1.5 5.7-.2.9.3 1 .7.7.4-.2 5.5-3.7 7.7-5.2A24 24 0 0024 37c11 0 20-7.6 20-16S35 4 24 4z"/>
              </svg>
              開啟 LINE 加入
            </a>
            <Link
              href="/"
              className="text-xs text-[var(--charcoal)]/40 hover:text-[var(--oak)] transition-colors tracking-widest uppercase"
            >
              ← 回到首頁
            </Link>
          </div>

          {/* divider */}
          <div className="border-t border-[var(--border)] my-12" />

          {/* info */}
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { icon: '✂️', label: '髮型設計師' },
              { icon: '🐾', label: '寵物美容師' },
              { icon: '💅', label: '美甲師' },
            ].map((item) => (
              <div key={item.label} className="py-4 border border-[var(--border)]">
                <p className="text-2xl mb-2">{item.icon}</p>
                <p className="text-xs text-[var(--charcoal)]/50 tracking-wide">{item.label}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-[var(--charcoal)]/30 mt-8">加入後即可透過 LINE 選擇設計師、瀏覽服務並完成預約</p>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] py-8 px-6 text-center">
        <p className="text-xs text-[var(--charcoal)]/30">© 2026 MooLah. All rights reserved.</p>
      </footer>
    </>
  )
}
