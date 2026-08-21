/**
 * 喚起 LINE App 並前往站內某個路徑（LIFF）。
 *
 * 🔴 2026-08-21 Gini 手機實測：點「開始預約」跳不過去，卡在原地。
 *
 * 根因跟 2026-08-08 修「加 LINE」那次**完全一樣**，只是當時只修了加好友、沒修 LIFF：
 *   `https://liff.line.me/{id}` 是 universal link。
 *   universal link 由 JS 設 `location.href` 觸發時，iOS / in-app browser 常常
 *   **不喚起 App，改用網頁版開啟** —— 於是被送到 LIFF endpoint 的網頁（/dashboard），
 *   那裡偵測到「不在 LINE 裡」又叫他「在 LINE 中開啟」，按下去再回來 → 死路。
 *
 * 解法（沿用已驗證有效的那套）：
 *   先用 **App scheme `line://app/{liffId}`** 喚起 —— scheme 不是 universal link，
 *   in-app browser 與 JS 導航都吃得動；1.2 秒內沒跳走才 fallback 回 https 版。
 *   使用者不需要多按任何一次。
 *
 * ⚠️ Day 32 的教訓「頁面載入自動跳轉喚不起 App」講的是 **universal link**；
 *    App scheme 不受這個限制，所以死路頁面可以在載入時自動試一次。
 */
export function liffHttpsUrl(path: string, liffId = process.env.NEXT_PUBLIC_LIFF_ID): string {
  return `https://liff.line.me/${liffId}?to=${encodeURIComponent(path)}`
}

export function liffSchemeUrl(path: string, liffId = process.env.NEXT_PUBLIC_LIFF_ID): string {
  return `line://app/${liffId}?to=${encodeURIComponent(path)}`
}

/**
 * 開啟 LINE 並前往 `path`。
 * @param path 站內路徑，例如 `/tong/book?service=xxx`
 */
export function openLiff(path: string): void {
  if (typeof window === 'undefined') return
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID
  if (!liffId) return
  const t = Date.now()
  window.location.href = liffSchemeUrl(path, liffId)
  window.setTimeout(() => {
    // 頁面已隱藏 = App 開起來了，不要再跳（否則回到瀏覽器會看到多開一頁）
    if (document.hidden || Date.now() - t > 2500) return
    window.location.href = liffHttpsUrl(path, liffId)
  }, 1200)
}
