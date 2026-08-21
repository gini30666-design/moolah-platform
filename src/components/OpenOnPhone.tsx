'use client'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import CopyableUrl from './CopyableUrl'

/**
 * 桌機專用：「請用手機開啟」＋ QR。
 *
 * 🔴 為什麼桌機不能用「在 LINE 中開啟」那顆按鈕（見 lib/device.ts）：
 *    liff.line.me 在桌機喚不起 App，會把人送回 /dashboard → 又叫他「在 LINE 中開啟」→ 無限迴圈。
 *
 * QR 用 `qrcode` 套件在瀏覽器端產生 —— 不打第三方 QR 服務
 * （2026-07-28 已把即時打 api.qrserver.com 的做法拿掉：對方掛掉就破圖）。
 */
export default function OpenOnPhone({
  url,
  title = '請用手機開啟',
  hint = '預約需要在手機的 LINE 裡完成。\n用手機掃下面的 QR，或把網址傳到手機打開。',
}: {
  /** 要讓手機開啟的完整網址（公開頁，不是 liff.line.me） */
  url: string
  title?: string
  hint?: string
}) {
  const [qr, setQr] = useState('')
  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 460, margin: 1, errorCorrectionLevel: 'M',
      color: { dark: '#2C2825', light: '#fbf9f4' },
    }).then(setQr).catch(() => setQr(''))
  }, [url])

  return (
    <div style={{
      minHeight: '100dvh', background: '#1a1714', color: '#fbf9f4',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center', fontFamily: 'sans-serif',
    }}>
      <p style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#a68966', textTransform: 'uppercase', marginBottom: '26px' }}>MooLah</p>

      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.65rem', fontWeight: 300, marginBottom: '12px' }}>{title}</p>
      <p style={{ fontSize: '13px', color: 'rgba(251,249,244,0.5)', lineHeight: 1.85, marginBottom: '26px', whiteSpace: 'pre-line' }}>{hint}</p>

      {qr
        ? <img src={qr} alt="用手機掃描開啟" width={200} height={200}
            style={{ width: '200px', height: '200px', borderRadius: '14px', background: '#fbf9f4', padding: '10px' }} />
        : <div style={{ width: '200px', height: '200px', borderRadius: '14px', background: 'rgba(251,249,244,0.06)' }} />}

      <div style={{ width: '100%', maxWidth: '360px', marginTop: '24px' }}>
        {/* 掃不了就複製網址傳到手機（LINE webview 常常沒有剪貼簿 API，CopyableUrl 有三層退路） */}
        <CopyableUrl url={url} />
      </div>

      <p style={{ fontSize: '11px', color: 'rgba(251,249,244,0.3)', marginTop: '22px', lineHeight: 1.8 }}>
        預約成功後會用 LINE 傳確認訊息給你<br />前一天也會自動提醒一次
      </p>

      <p style={{ fontSize: '10px', color: 'rgba(251,249,244,0.15)', marginTop: '40px', letterSpacing: '0.08em' }}>
        MooLah · 永翔數位有限公司
      </p>
    </div>
  )
}
