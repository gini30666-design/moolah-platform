'use client'
import { useEffect, useState } from 'react'
import { isMobileDevice } from '@/lib/device'
import OpenOnPhone from './OpenOnPhone'
import { openLiff, liffHttpsUrl } from '@/lib/liffOpen'

/**
 * 「請在 LINE 裡開啟」畫面 — 防止外部瀏覽器的 liff.login() 無限跳轉。
 *
 * 🔴 為什麼需要這個（2026-08-10 Zuzu 實機踩到，有螢幕錄影）：
 * 需要 LINE 身分的頁面，在未登入時會呼叫 liff.login()。
 * 在「外部瀏覽器」裡，liff.login() 會去喚起 LINE App 認證 →
 * LINE 跳回瀏覽器（可能是另一個 browser context，localStorage 不共用）→
 * 又進同一頁 → isLoggedIn() 仍是 false → 又 login → ♾️ 死循環。
 *
 * 正解：偵測到 `!liff.isInClient()` 就不要自動跳，改給一個按鈕讓使用者
 * 主動用 liff.line.me 連結回到 LINE。使用者點擊觸發才喚得起 App
 * （同 Day 32 教訓：頁面載入時自動跳轉喚不起 App）。
 *
 * ⚠️ 用了這個元件的頁面，呼叫 liff.login() 前一定要先檢查 liff.isInClient()。
 */
export function liffOpenUrl(path: string): string {
  return liffHttpsUrl(path)
}

export default function OpenInLine({
  path,
  title = '請在 LINE 裡開啟',
  hint = '這個頁面需要確認你的 LINE 身分，\n請按下方按鈕在 LINE 中繼續。',
}: {
  /** 回到 LINE 後要前往的站內路徑，例如 `/my-bookings` */
  path: string
  title?: string
  hint?: string
}) {
  // 🔴 2026-08-21：桌機不能給下面那顆按鈕 —— liff.line.me 在桌機喚不起 App，
  //    會被送回 /dashboard 又叫他「在 LINE 中開啟」，形成無限迴圈（實測重現）。
  //    桌機改給 QR 讓他用手機接續。
  //    ⚠️ 用 state 而非直接判斷：SSR 時沒有 navigator，直接判斷會造成 hydration mismatch。
  const [desktop, setDesktop] = useState(false)
  useEffect(() => { setDesktop(!isMobileDevice()) }, [])

  if (desktop) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://moolah.studio'
    return <OpenOnPhone url={`${origin}${path.startsWith('/') ? path : `/${path}`}`} />
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#1a1714', color: '#fbf9f4',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', textAlign: 'center', fontFamily: 'sans-serif',
    }}>
      <p style={{
        fontFamily: '"Cormorant Garamond", serif', fontSize: '1.6rem',
        fontWeight: 300, marginBottom: '12px',
      }}>{title}</p>

      <p style={{
        fontSize: '13px', color: 'rgba(251,249,244,0.5)',
        lineHeight: 1.8, marginBottom: '28px', whiteSpace: 'pre-line',
      }}>{hint}</p>

      <a
        href={liffOpenUrl(path)}
        onClick={e => { e.preventDefault(); openLiff(path) }}
        style={{
          display: 'inline-block', padding: '14px 34px', borderRadius: '12px',
          background: '#06C755', color: '#fff', fontSize: '15px', fontWeight: 600,
          textDecoration: 'none', minHeight: '44px', lineHeight: '1.2',
        }}
      >
        在 LINE 中開啟
      </a>

      <p style={{
        fontSize: '11px', color: 'rgba(251,249,244,0.3)',
        marginTop: '22px', lineHeight: 1.7,
      }}>
        如果按了沒反應，請回到 LINE 聊天室<br />直接點我們傳給你的連結
      </p>

      <p style={{
        fontSize: '10px', color: 'rgba(251,249,244,0.15)',
        marginTop: '44px', letterSpacing: '0.08em',
      }}>MooLah · 永翔數位有限公司</p>
    </div>
  )
}
