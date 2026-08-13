'use client'

// B2B 頁手機版 sticky 底部 CTA：14 天免費試用 → 加 LINE（@492ejbwx）
// 長頁滾動中隨時可行動，避免職人被說服後找不到按鈕而流失
// ⚠️ 這裡原本自己手刻一份「ga.clickLineOA + trackContact + openLineOA」，
//    跟 LineLink 做的事一模一樣。結果 2026-08-13 加 CAPI 鏡像與 CTA 變體時只改了 LineLink，
//    這支就漏掉 —— 它的 Contact 事件沒有 eventId（廣告封鎖器擋掉就消失）、
//    也回報不出使用者被分到哪個 CTA 版本。而它正是 /pro 手機版最容易被按的那顆。
//    → 改用 LineLink，只留一條程式路徑。（同 8/8 併掉 TrackedLineLink 的教訓）
import LineLink from '@/components/LineLink'
import { OA_B2B } from '@/lib/lineOA'

export default function StickyTrialCTA() {
  return (
    <div
      className="sticky-trial-cta"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        padding: '10px 14px calc(10px + env(safe-area-inset-bottom))',
        background: 'rgba(26,23,20,0.92)', backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(166,137,102,0.3)',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}
    >
      {/*
        ⚠️ 不能用 className="md:hidden" 來隱藏：
        行內 style 的 display:flex 優先級高於 class，Tailwind 的 display:none 會被蓋掉，
        結果桌機也會出現這條手機用的底部橫幅（會壓到頁尾內容）。
        行內樣式寫不了 media query → 用這段 scoped CSS 以 !important 收掉。
      */}
      <style>{`
        @media (min-width: 768px) {
          .sticky-trial-cta { display: none !important; }
        }
      `}</style>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cream)', lineHeight: 1.3 }}>14 天免費試用</p>
        <p style={{ fontSize: '11px', color: 'rgba(251,249,244,0.55)' }}>0 抽佣・不綁約・30 秒開通</p>
      </div>
      {/* LineLink 內含：App scheme 優先喚起（in-app browser 會攔截 universal link，
          害使用者卡在 LINE 的英文中間頁）＋ Contact 事件（Pixel + CAPI 同 eventId）
          ＋ CTA 變體回報。不加 target=_blank，開新分頁會讓喚起 App 更容易失敗。 */}
      <LineLink
        track
        source="sticky_cta"
        oaId={OA_B2B}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px', flexShrink: 0,
          background: '#06C755', color: 'white', padding: '11px 18px',
          fontSize: '13px', fontWeight: 700, borderRadius: '10px', textDecoration: 'none',
        }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '16px', height: '16px' }}><path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
        加 LINE 聊
      </LineLink>
    </div>
  )
}
