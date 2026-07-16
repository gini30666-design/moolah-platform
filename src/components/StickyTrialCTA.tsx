// B2B 頁手機版 sticky 底部 CTA：14 天免費試用 → 加 LINE（@492ejbwx）
// 長頁滾動中隨時可行動，避免職人被說服後找不到按鈕而流失
export default function StickyTrialCTA() {
  return (
    <div
      className="md:hidden"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        padding: '10px 14px calc(10px + env(safe-area-inset-bottom))',
        background: 'rgba(26,23,20,0.92)', backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(166,137,102,0.3)',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cream)', lineHeight: 1.3 }}>14 天免費試用</p>
        <p style={{ fontSize: '11px', color: 'rgba(251,249,244,0.55)' }}>0 抽佣・不綁約・30 秒開通</p>
      </div>
      <a
        href="https://line.me/R/ti/p/@492ejbwx"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px', flexShrink: 0,
          background: '#06C755', color: 'white', padding: '11px 18px',
          fontSize: '13px', fontWeight: 700, borderRadius: '10px', textDecoration: 'none',
        }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '16px', height: '16px' }}><path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
        加 LINE 聊
      </a>
    </div>
  )
}
