import Link from 'next/link'
import { OA_CONSUMER, OA_B2B, lineAddFriendUrl } from '@/lib/lineOA'
import LineLink from '@/components/LineLink'

function LineIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="white">
      <path d="M24 4C13 4 4 11.6 4 21c0 5.8 3.3 10.9 8.4 14.2-.4 1.4-1.3 4.9-1.5 5.7-.2.9.3 1 .7.7.4-.2 5.5-3.7 7.7-5.2A24 24 0 0024 37c11 0 20-7.6 20-16S35 4 24 4z" />
    </svg>
  )
}

/** ⚠️ B2B 頁面（/pro、/for-providers 等招商動線）必須傳 b2b，
 *  否則職人點頁尾會進到消費者 bot，看到「探索職人/我的預約」選單，接不到招商。
 *  OA 常數與預填連結的來源見 `@/lib/lineOA`。 */
export default function SiteFooter({ b2b = false }: { b2b?: boolean }) {
  const oa = b2b ? OA_B2B : OA_CONSUMER
  return (
    <footer style={{ background: '#0f0e0c', borderTop: '2px solid var(--oak)' }}>
      <div className="max-w-[1440px] mx-auto px-5 md:px-16 py-10 md:py-16 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
        <div data-animate className="col-span-2 md:col-span-1">
          <h3 className="font-display text-2xl tracking-widest uppercase mb-4" style={{ color: 'var(--cream)' }}>MooLah</h3>
          <p className="text-xs leading-relaxed mb-6" style={{ color: 'var(--oak-dim)' }}>重新定義台灣美業預約體驗。<br />REDEFINING BEAUTY APPOINTMENTS.</p>
          {/* ⚠️ 消費者版頁尾刻意「不放」LINE 入口。
              消費者 OA(@881zhkla) 已轉為內部帳號——只給拿到設計師連結／下過預約單的客人加；
              招商 OA 放在消費者頁又不對題。所以這裡改成給職人的入口。 */}
          {b2b ? (
            /* 用 LineLink：App scheme 優先，避開 in-app browser 的英文中間頁，
               同時補上原本頁尾漏掉的點擊追蹤 */
            <LineLink track source="footer_b2b" oaId={OA_B2B}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs text-white tracking-widest uppercase"
              style={{ background: 'var(--line-green)' }}>
              <LineIcon size={14} />洽詢合作
            </LineLink>
          ) : (
            <Link href="/pro"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs tracking-widest uppercase"
              style={{ background: 'var(--oak)', color: 'var(--cream)' }}>
              我是職人 · 了解合作
            </Link>
          )}
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
            {[['顧客 · 怎麼用', '/how-it-works'], ['設計師 · 功能介紹', '/for-providers'], ['合作方案', '/services'], ['部落格', '/blog'], ['加入合作', '/join'], ['常見問題', '/services#faq'], ['隱私政策', '/privacy'], ['使用條款', '/terms'], ['聯絡我們', 'mailto:service@moolah.studio']].map(([l, h]) => (
              <li key={l}><Link href={h} className="text-sm hover:text-[var(--cream)] transition-colors" style={{ color: 'var(--oak-dim)' }}>{l}</Link></li>
            ))}
          </ul>
        </div>
        <div data-animate data-delay="300">
          <h4 className="text-xs tracking-[.2em] uppercase mb-4 md:mb-6" style={{ color: 'var(--oak)' }}>聯絡</h4>
          <ul className="space-y-2.5 md:space-y-3">
            {[['service@moolah.studio', 'mailto:service@moolah.studio'], ['Instagram', 'https://instagram.com/moolah.tw']].map(([l, h]) => (
              <li key={l}><a href={h} target={h.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="text-sm hover:text-[var(--cream)] transition-colors" style={{ color: 'var(--oak-dim)' }}>{l}</a></li>
            ))}
            {/* LINE 要走 LineLink（App scheme），不能跟上面的 email/IG 混在同一個 map 裡 */}
            {b2b && (
              <li>
                <LineLink source="footer_contact" oaId={OA_B2B} track
                  className="text-sm hover:text-[var(--cream)] transition-colors" style={{ color: 'var(--oak-dim)' }}>
                  {`LINE ${oa}`}
                </LineLink>
              </li>
            )}
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
