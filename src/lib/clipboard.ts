/**
 * 複製文字到剪貼簿 — 三層退路，回傳是否成功。
 *
 * ⚠️ 為什麼不能只用 navigator.clipboard：
 * 那個 API 需要「安全環境 + 使用者手勢」，在以下情況會直接不存在或丟錯：
 *   · LINE / Instagram / Facebook 的 in-app webview（部分版本沒有掛載）
 *   · 非 HTTPS（區網測試）
 *   · 舊版 Android WebView
 * 原本的寫法是 `try { ...writeText() } catch {}` —— 失敗完全靜默，
 * 還是照樣顯示「已複製」。職人以為複製好了，貼出去是空的。
 * （2026-08-08 架構掃描發現）
 *
 * 三層：
 *   1) navigator.clipboard.writeText（現代瀏覽器）
 *   2) document.execCommand('copy')（舊 API，webview 相容性最好）
 *   3) 都失敗 → 回 false，由呼叫端改成「請長按下面文字複製」
 */
export async function copyText(text: string): Promise<boolean> {
  // 1) 現代 API
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch { /* 落到第 2 層 */ }

  // 2) execCommand fallback（已 deprecated 但 webview 支援度最好）
  try {
    if (typeof document === 'undefined') return false
    const ta = document.createElement('textarea')
    ta.value = text
    // 不能用 display:none／visibility:hidden，那樣選取不到
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '0'
    ta.style.left = '0'
    ta.style.opacity = '0'
    ta.style.pointerEvents = 'none'
    document.body.appendChild(ta)
    ta.select()
    ta.setSelectionRange(0, text.length)   // iOS 需要這行才選得到
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
