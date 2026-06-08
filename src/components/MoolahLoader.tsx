// MoolahLoader — 後台/驗證空窗期的品牌化等待畫面
// 深炭底 + 橡木色大寫 M（流光掃過 + 呼吸感），底部品牌字與脈動點。
// 取代原本廉價的 spinner，讓 LIFF 進場到後台是一段連續、不閃爍的畫面。

const oak = '#A68966'
const charcoalDeep = '#1a1714'

export default function MoolahLoader({ label = '正在為您準備…' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: charcoalDeep,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0',
        fontFamily: "var(--font-cormorant), Georgia, 'Noto Serif TC', serif",
      }}
    >
      <style>{`
        @keyframes ml-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ml-breathe { 0%,100% { transform: scale(1) } 50% { transform: scale(1.035) } }
        @keyframes ml-sheen { 0% { background-position: 160% 0 } 100% { background-position: -60% 0 } }
        @keyframes ml-glow { 0%,100% { opacity: .35 } 50% { opacity: .6 } }
        @keyframes ml-blink { 0%,100% { opacity: .22; transform: translateY(0) } 50% { opacity: 1; transform: translateY(-3px) } }
        @keyframes ml-bar { 0% { transform: translateX(-100%) } 100% { transform: translateX(260%) } }

        .ml-root { animation: ml-fade .4s ease both; }
        .ml-glow {
          position: absolute; width: 280px; height: 280px; border-radius: 50%;
          background: radial-gradient(circle, rgba(166,137,102,0.22), transparent 66%);
          filter: blur(6px); animation: ml-glow 3s ease-in-out infinite;
        }
        .ml-breathe { animation: ml-breathe 3s ease-in-out infinite; }
        .ml-m {
          font-size: 116px; font-weight: 300; line-height: 1; letter-spacing: -0.02em;
          background: linear-gradient(100deg, #6b5740 0%, ${oak} 38%, #e2c79a 50%, ${oak} 62%, #6b5740 100%);
          background-size: 240% 100%;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent; color: transparent;
          animation: ml-sheen 2.8s ease-in-out infinite;
          filter: drop-shadow(0 6px 22px rgba(166,137,102,0.28));
        }
        .ml-word { font-family: var(--font-plus-jakarta), var(--font-dm-sans), sans-serif;
          font-size: 10px; letter-spacing: 0.42em; text-transform: uppercase;
          color: ${oak}; opacity: 0.7; margin-top: 26px; padding-left: 0.42em; }
        .ml-dots { display: flex; gap: 6px; margin-top: 22px; }
        .ml-dot { width: 5px; height: 5px; border-radius: 50%; background: ${oak};
          animation: ml-blink 1.25s ease-in-out infinite; }
        .ml-dot:nth-child(2) { animation-delay: .16s }
        .ml-dot:nth-child(3) { animation-delay: .32s }
        .ml-label { font-family: var(--font-plus-jakarta), var(--font-dm-sans), sans-serif;
          font-size: 12px; color: rgba(251,249,244,0.34); margin-top: 18px; letter-spacing: 0.02em; }
        .ml-track { margin-top: 20px; width: 120px; height: 2px; border-radius: 2px;
          background: rgba(166,137,102,0.16); overflow: hidden; position: relative; }
        .ml-track > span { position: absolute; inset: 0; width: 40%; border-radius: 2px;
          background: linear-gradient(90deg, transparent, ${oak}, transparent);
          animation: ml-bar 1.5s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .ml-breathe, .ml-m, .ml-glow, .ml-dot, .ml-track > span { animation: none !important; }
          .ml-m { -webkit-text-fill-color: ${oak}; color: ${oak}; }
        }
      `}</style>

      <div className="ml-root" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="ml-glow" />
          <div className="ml-breathe" style={{ position: 'relative' }}>
            <span className="ml-m">M</span>
          </div>
        </div>
        <p className="ml-word">MooLah</p>
        <div className="ml-dots"><span className="ml-dot" /><span className="ml-dot" /><span className="ml-dot" /></div>
        <div className="ml-track"><span /></div>
        <p className="ml-label">{label}</p>
      </div>

      {/* 品牌頁尾 */}
      <p style={{ position: 'absolute', bottom: '28px', fontFamily: 'var(--font-plus-jakarta), sans-serif', fontSize: '10px', color: 'rgba(251,249,244,0.16)', letterSpacing: '0.08em' }}>
        MooLah · 永翔數位有限公司
      </p>
    </div>
  )
}
