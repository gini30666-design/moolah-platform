import Link from 'next/link'

function LineIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="white">
      <path d="M24 4C13 4 4 11.6 4 21c0 5.8 3.3 10.9 8.4 14.2-.4 1.4-1.3 4.9-1.5 5.7-.2.9.3 1 .7.7.4-.2 5.5-3.7 7.7-5.2A24 24 0 0024 37c11 0 20-7.6 20-16S35 4 24 4z" />
    </svg>
  )
}

export default function SiteFooter() {
  return (
    <footer style={{ background: '#0f0e0c', borderTop: '2px solid var(--oak)' }}>
      <div className="max-w-[1440px] mx-auto px-5 md:px-16 py-10 md:py-16 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
        <div data-animate className="col-span-2 md:col-span-1">
          <h3 className="font-display text-2xl tracking-widest uppercase mb-4" style={{ color: 'var(--cream)' }}>MooLah</h3>
          <p className="text-xs leading-relaxed mb-6" style={{ color: 'var(--oak-dim)' }}>重新定義台灣美業預約體驗。<br />REDEFINING BEAUTY APPOINTMENTS.</p>
          <a href="https://line.me/R/ti/p/@881zhkla" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs text-white tracking-widest uppercase"
            style={{ background: 'var(--line-green)' }}>
            <LineIcon size={14} />加入 LINE OA
          </a>
        </div>
        <div data-animate data-delay="100">
          <h4 className="text-xs tracking-[.2em] uppercase mb-4 md:mb-6" style={{ color: 'var(--oak)' }}>服務</h4>
          <ul className="space-y-2.5 md:space-y-3">
            {[['髮型設計師', '/discover?category=髮型設計師'], ['寵物美容師', '/discover?category=寵物美容師'], ['汽車美容師', '/discover?category=汽車美容師'], ['美甲師', '/discover?category=美甲師']].map(([l, h]) => (
              <li key={l}><Link href={h} className="text-sm hover:text-[var(--cream)] transition-colors" style={{ color: 'var(--oak-dim)' }}>{l}</Link></li>
            ))}
          </ul>
        </div>
        <div data-animate data-delay="200">
          <h4 className="text-xs tracking-[.2em] uppercase mb-4 md:mb-6" style={{ color: 'var(--oak)' }}>平台</h4>
          <ul className="space-y-2.5 md:space-y-3">
            {[['顧客 · 怎麼用', '/how-it-works'], ['設計師 · 功能介紹', '/for-providers'], ['合作方案', '/services'], ['加入合作', '/join'], ['常見問題', '/services#faq'], ['隱私政策', '/privacy'], ['使用條款', '/terms'], ['聯絡我們', 'mailto:service@moolah.studio']].map(([l, h]) => (
              <li key={l}><Link href={h} className="text-sm hover:text-[var(--cream)] transition-colors" style={{ color: 'var(--oak-dim)' }}>{l}</Link></li>
            ))}
          </ul>
        </div>
        <div data-animate data-delay="300">
          <h4 className="text-xs tracking-[.2em] uppercase mb-4 md:mb-6" style={{ color: 'var(--oak)' }}>聯絡</h4>
          <ul className="space-y-2.5 md:space-y-3">
            {[['service@moolah.studio', 'mailto:service@moolah.studio'], ['Instagram', 'https://instagram.com'], ['LINE @881zhkla', 'https://line.me/R/ti/p/@881zhkla']].map(([l, h]) => (
              <li key={l}><a href={h} target={h.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="text-sm hover:text-[var(--cream)] transition-colors" style={{ color: 'var(--oak-dim)' }}>{l}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t px-5 md:px-16 py-5 max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-2" style={{ borderColor: 'rgba(166,137,102,.2)' }}>
        <p className="text-xs tracking-widest" style={{ color: 'var(--oak-dim)' }}>© 2026 永翔數位有限公司 MooLah. ALL RIGHTS RESERVED.</p>
        <p className="text-xs tracking-widest" style={{ color: 'var(--oak-dim)' }}>DESIGNED IN TAIWAN · 高雄出發</p>
      </div>
    </footer>
  )
}
