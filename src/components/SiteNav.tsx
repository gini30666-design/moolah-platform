import Link from 'next/link'

export default function SiteNav() {
  return (
    <nav style={{ background: 'var(--charcoal-deep)' }} className="fixed top-0 w-full z-50 border-b border-[var(--oak)]/20">
      <div className="max-w-[1440px] mx-auto flex justify-between items-center px-5 md:px-16 h-16 md:h-20">
        <Link href="/" className="font-display text-lg md:text-xl tracking-[.2em] uppercase text-[var(--cream)]">MooLah</Link>
        <div className="hidden md:flex items-center gap-10">
          <Link href="/how-it-works" className="text-sm text-[var(--oak-dim)] hover:text-[var(--cream)] transition-colors tracking-wide">顧客怎麼用</Link>
          <Link href="/for-providers" className="text-sm text-[var(--oak-dim)] hover:text-[var(--cream)] transition-colors tracking-wide">設計師加入</Link>
          <Link href="/discover" className="text-sm text-[var(--oak-dim)] hover:text-[var(--cream)] transition-colors tracking-wide">探索職人</Link>
          <Link href="/services" className="text-sm text-[var(--oak-dim)] hover:text-[var(--cream)] transition-colors tracking-wide">合作方案</Link>
        </div>
        <Link
          href="/discover"
          className="flex items-center gap-1.5 px-4 md:px-6 py-2.5 md:py-3 text-xs tracking-widest uppercase transition-opacity hover:opacity-90"
          style={{ background: 'var(--oak)', color: 'var(--cream)' }}
        >
          <span className="hidden sm:inline">探索職人</span>
          <span className="sm:hidden">預約</span>
        </Link>
      </div>
    </nav>
  )
}
