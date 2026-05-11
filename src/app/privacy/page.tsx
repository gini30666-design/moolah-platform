import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '隱私政策 | MooLah',
  description: 'MooLah 美業預約平台隱私政策 — 說明我們如何蒐集、使用及保護您的個人資料',
}

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
          <Link href="/join" className="hover:text-[var(--oak)] transition-colors">加入合作</Link>
          <Link href="/privacy" className="hover:text-[var(--oak)] transition-colors">隱私政策</Link>
          <a href="mailto:moolah118@gmail.com" className="hover:text-[var(--oak)] transition-colors">聯絡我們</a>
        </div>
      </div>
    </footer>
  )
}

const SECTIONS = [
  {
    title: '一、資料蒐集範圍',
    content: `當您使用 MooLah 預約服務時，我們會蒐集以下資料：
• LINE 用戶基本資料（顯示名稱、LINE 使用者 ID）
• 您自願填寫的資料（性別、目前髮長等預約相關資訊）
• 預約資料（服務項目、預約日期與時段、備註）

我們不會蒐集您的電話號碼、地址或付款資訊。`,
  },
  {
    title: '二、資料使用目的',
    content: `蒐集之個人資料僅用於以下目的：
• 管理您的預約紀錄，並傳送預約確認與提醒
• 透過 LINE 推播通知您的預約狀態（確認、取消等）
• 協助合作設計師管理客戶預約與服務紀錄
• 統計整體服務使用量（不涉及個人識別）`,
  },
  {
    title: '三、資料保存方式',
    content: `您的預約資料儲存於 Google Sheets（Google 雲端試算表），並受 Google 企業級安全機制保護。存取權限僅限於您預約的合作設計師及 MooLah 管理人員。

資料保存期限：預約完成後至多保存 24 個月，期滿後定期清除。`,
  },
  {
    title: '四、資料分享',
    content: `MooLah 不會將您的個人資料出售、出租或提供給任何第三方商業用途。

以下情況除外：
• 法律要求或主管機關命令
• 保護 MooLah 或用戶之合法權益`,
  },
  {
    title: '五、LINE 平台授權',
    content: `本服務透過 LINE LIFF（LINE 前端框架）運作。您在登入時授權 MooLah 讀取您的 LINE 基本個人資料（顯示名稱與 LINE 使用者 ID）。您可隨時在 LINE 應用程式設定中撤銷此授權。`,
  },
  {
    title: '六、您的權利',
    content: `依據台灣《個人資料保護法》，您有權：
• 查詢或請求閱覽 MooLah 所持有的您的個人資料
• 請求製給複製本
• 請求補充或更正
• 請求停止蒐集、處理或利用
• 請求刪除

如需行使上述權利，請透過以下方式聯絡我們。`,
  },
  {
    title: '七、聯絡方式',
    content: `如您對本隱私政策有任何疑問，或需要行使個人資料相關權利，請聯絡：

Email：moolah118@gmail.com
LINE 官方帳號：@881zhkla

我們將於 5 個工作日內回覆。`,
  },
  {
    title: '八、政策更新',
    content: `本隱私政策如有變更，將於本頁面公告。重大變更時，我們會透過 LINE 通知曾使用本服務的用戶。

最後更新日期：2026 年 5 月 11 日`,
  },
]

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className="pt-14 md:pt-16">

        {/* Header */}
        <section className="relative overflow-hidden py-16 md:py-24 px-5 md:px-6" style={{ background: 'var(--charcoal)' }}>
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, var(--oak) 0px, var(--oak) 1px, transparent 1px, transparent 44px)'
          }} />
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(to right, transparent, var(--oak), transparent)' }} />
          <div className="relative max-w-3xl mx-auto">
            <p className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: 'var(--oak)' }}>Privacy Policy</p>
            <h1 className="font-display mb-4" style={{ fontSize: 'clamp(2.2rem,5vw,4rem)', color: 'var(--cream)', fontWeight: 300 }}>
              隱私政策
            </h1>
            <p className="text-sm" style={{ color: 'rgba(251,249,244,0.45)' }}>
              本政策說明 MooLah 如何蒐集、使用及保護您的個人資料，符合台灣《個人資料保護法》規定。
            </p>
          </div>
        </section>

        <div className="h-px" style={{ background: 'linear-gradient(to right, var(--oak), rgba(166,137,102,0.1))' }} />

        {/* Content */}
        <section className="py-12 md:py-20 px-5 md:px-6" style={{ background: 'white' }}>
          <div className="max-w-3xl mx-auto">
            <div className="divide-y divide-[var(--border)]">
              {SECTIONS.map((s) => (
                <div key={s.title} className="py-8 md:py-10">
                  <h2 className="font-display text-xl md:text-2xl mb-4" style={{ color: 'var(--charcoal)', fontWeight: 400 }}>
                    {s.title}
                  </h2>
                  <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'rgba(44,40,37,0.65)' }}>
                    {s.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t" style={{ borderColor: 'rgba(166,137,102,0.2)' }}>
              <p className="text-xs text-center" style={{ color: 'rgba(44,40,37,0.35)' }}>
                如有疑問，請透過{' '}
                <a href="mailto:moolah118@gmail.com" className="underline underline-offset-2 hover:opacity-70 transition-opacity" style={{ color: 'var(--oak)' }}>
                  moolah118@gmail.com
                </a>
                {' '}聯絡我們
              </p>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
