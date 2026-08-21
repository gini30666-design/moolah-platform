/**
 * 是不是「行動裝置」——決定能不能靠 liff.line.me 喚起 LINE App。
 *
 * 🔴 為什麼需要（2026-08-21 桌機 Chrome 實測到無限迴圈）：
 * `https://liff.line.me/{id}?to=X` 在**手機**是 universal link，點了會喚起 LINE App；
 * 在**桌機**不會 —— LINE 直接把使用者送到 LIFF endpoint 的網頁版（/dashboard），
 * 那裡因為 `!isInClient()` 又顯示「請在 LINE 裡開啟」，按下去又回 liff.line.me → ♾️
 *
 *   moolah.studio/tong → 開始預約
 *     → liff.line.me/{id}?to=/tong/book
 *     → moolah.studio/dashboard?to=/tong/book
 *     → 「請在 LINE 裡開啟」→ 按鈕 → 回到第 2 步 → 無限迴圈
 *
 * 所以桌機**不能**給那顆按鈕，要改成「用手機掃 QR」。
 *
 * ⚠️ 判斷刻意用 userAgent 而不是螢幕寬度：
 *    決定成敗的是「這台裝置有沒有 LINE App 能被喚起」，不是視窗多寬。
 *    桌機把視窗縮到很窄仍然喚不起 App。
 */
export function isMobileDevice(ua?: string): boolean {
  const s = ua ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '')
  if (!s) return false          // 取不到就當桌機（fail-safe：寧可給 QR，也不要把人丟進迴圈）
  // iPadOS 13+ 的 Safari 會偽裝成 Mac；靠 maxTouchPoints 補判
  const iPadOS = /Macintosh/i.test(s)
    && typeof navigator !== 'undefined'
    && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints > 1
  return /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(s) || iPadOS
}

/** 已經在 LINE 內建瀏覽器裡（此時什麼都不用做，直接走站內路徑）。 */
export function isInLineApp(ua?: string): boolean {
  const s = ua ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '')
  return /Line\//i.test(s)
}
