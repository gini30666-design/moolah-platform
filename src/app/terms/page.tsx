import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '使用條款 | MooLah',
  description: 'MooLah 美業預約平台使用條款 — 使用本服務前請詳閱本條款',
}

function Nav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border)]" style={{ background: 'rgba(251,249,244,0.92)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-6xl mx-auto px-5 md:px-6 h-14 md:h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-[var(--charcoal)] tracking-wide">MooLah</Link>
        <div className="flex items-center gap-4 md:gap-6 text-sm text-[var(--charcoal)]/60">
          <Link href="/services" className="hidden sm:inline hover:text-[var(--oak)] transition-colors">合作方案</Link>
          <Link
            href="/discover"
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
          <Link href="/terms" className="hover:text-[var(--oak)] transition-colors">使用條款</Link>
          <a href="mailto:moolah118@gmail.com" className="hover:text-[var(--oak)] transition-colors">聯絡我們</a>
        </div>
      </div>
    </footer>
  )
}

const SECTIONS = [
  {
    title: '一、服務說明',
    content: `MooLah 是一個美業預約媒合平台，提供消費者與合作職人（髮型設計師、寵物美容師、汽車美容師、美甲師）之間的線上預約服務。

本平台與 LINE 深度整合，消費者以 LINE 帳號綁定後即可使用預約功能。MooLah 本身為媒合平台，不直接提供美業服務，實際服務由各合作職人獨立提供。`,
  },
  {
    title: '二、使用資格',
    content: `使用 MooLah 服務，您須符合以下條件：

• 擁有有效的 LINE 帳號
• 年滿 18 歲，或在法定監護人同意下使用
• 提供真實、準確的個人資訊
• 遵守本使用條款及相關法規

如您不符合上述條件，請勿使用本服務。`,
  },
  {
    title: '三、預約規則',
    content: `（一）預約確認
完成預約送出後，系統將透過 LINE 傳送確認通知給您及合作職人。預約以系統確認通知為準。

（二）取消與修改
• 如需取消預約，請透過「我的預約」頁面操作，或聯絡合作職人
• 各職人可能有不同的取消政策，請於預約前確認
• 爽約（未事先取消）可能影響後續預約權益

（三）準時到場
請於預約時間準時到場。若有延誤，請提前聯絡職人，以免影響後續客人的預約安排。`,
  },
  {
    title: '四、消費者責任',
    content: `使用 MooLah 服務時，您同意：

• 不得提供虛假資訊進行預約
• 不得惡意佔用時段（重複預約後爽約）
• 不得以任何方式干擾平台正常運作
• 不得利用本平台從事任何違法行為

違反上述規定，MooLah 有權暫停或終止您的使用權限。`,
  },
  {
    title: '五、合作職人責任',
    content: `MooLah 合作職人須遵守以下規範：

• 依約定時間提供服務，不得無故爽約
• 所提供之服務須符合台灣相關法規（含食品安全、衛生標準）
• 維護消費者個人資料之保密義務
• 自行負責服務品質及相關法律責任

MooLah 為媒合平台，不對職人提供之服務品質負責，但將協助處理消費糾紛。`,
  },
  {
    title: '六、責任限制',
    content: `MooLah 不對以下情況承擔責任：

• 消費者與職人之間的服務糾紛（MooLah 協助溝通但不承擔連帶責任）
• 因網路中斷、系統維護等不可抗力因素導致的服務中斷
• LINE 平台本身的服務異常
• 消費者提供錯誤資訊所導致的問題

如遇消費糾紛，建議雙方先行協商，必要時可聯絡 MooLah 協助調處。`,
  },
  {
    title: '七、智慧財產權',
    content: `MooLah 平台所有內容，包含但不限於文字、圖片、設計、程式碼，均受著作權法保護，屬 MooLah 所有。

未經書面授權，不得複製、修改、散佈或商業使用本平台任何內容。合作職人授權 MooLah 使用其提供之作品集圖片用於平台展示，不另行支付費用。`,
  },
  {
    title: '八、服務變更與終止',
    content: `MooLah 保留以下權利：

• 隨時修改、暫停或終止部分或全部服務功能
• 更新本使用條款，並於本頁面公告
• 因違反條款而暫停或終止特定用戶的使用權限

重大條款變更將提前於 LINE 官方帳號公告。繼續使用本服務視為同意變更後之條款。`,
  },
  {
    title: '九、準據法與管轄',
    content: `本使用條款依中華民國法律解釋及執行。

如因本條款或使用本服務發生爭議，雙方同意以台灣高雄地方法院為第一審管轄法院。`,
  },
  {
    title: '十、聯絡方式',
    content: `如對本使用條款有任何疑問，請透過以下方式聯絡：

Email：moolah118@gmail.com
LINE 官方帳號：@881zhkla

我們將於 5 個工作日內回覆。

最後更新日期：2026 年 5 月 15 日`,
  },
]

export default function TermsPage() {
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
            <p data-animate className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: 'var(--oak)' }}>Terms of Service</p>
            <h1 data-animate data-delay="100" className="font-display mb-4" style={{ fontSize: 'clamp(2.2rem,5vw,4rem)', color: 'var(--cream)', fontWeight: 300 }}>
              使用條款
            </h1>
            <p data-animate data-delay="200" className="text-sm" style={{ color: 'rgba(251,249,244,0.45)' }}>
              使用 MooLah 服務前，請詳閱以下條款。繼續使用本服務即表示您同意本條款之內容。
            </p>
          </div>
        </section>

        <div className="h-px" style={{ background: 'linear-gradient(to right, var(--oak), rgba(166,137,102,0.1))' }} />

        {/* Content */}
        <section className="py-12 md:py-20 px-5 md:px-6" style={{ background: 'white' }}>
          <div className="max-w-3xl mx-auto">
            <div className="divide-y divide-[var(--border)]">
              {SECTIONS.map((s, i) => (
                <div key={s.title} data-animate data-delay={String(Math.min(i * 80, 400))} className="py-8 md:py-10">
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
