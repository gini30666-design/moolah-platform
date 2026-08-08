/** MooLah 的兩個 LINE 官方帳號 — 用途嚴格分開，別混用。
 *
 *  · OA_CONSUMER (@881zhkla) = 營運 bot：消費者預約、通知推播、圖文選單。接 webhook。
 *  · OA_B2B      (@492ejbwx) = 招商窗口：職人洽詢，Gini 本人親回。無 webhook。
 *
 *  ⚠️ B2B 動線（/pro、/for-providers、/join、招商廣告）一律用 OA_B2B。
 *     導錯會讓職人進到消費者 bot 的「探索職人/我的預約」選單，完全接不到招商。
 */
export const OA_CONSUMER = '@881zhkla'
export const OA_B2B = '@492ejbwx'

/**
 * 產生「加好友並預填一句話」的連結。
 *
 * 為什麼不用 `line.me/R/ti/p/{id}`（純加好友）：
 * 2026-07-31 實測發現有人加了 OA 卻沒傳訊息 → LINE OA Manager 的聊天列表
 * 只會顯示「傳過訊息」的用戶，純加好友者**無法被主動聯繫**，等於斷線。
 * `oaMessage` 會在聊天室預填文字，把「想一句話 + 打字」降級成「按一下送出」。
 */
export function lineOaMessage(oaId: string, prefill: string): string {
  return `https://line.me/R/oaMessage/${oaId}/?${encodeURIComponent(prefill)}`
}

/** 招商動線統一用這句預填，方便在 OA 端一眼辨識來源。 */
export const B2B_PREFILL = '我想了解 MooLah 的免費試用'

/** 招商 CTA 連結（預填版）。 */
export const LINE_B2B_URL = lineOaMessage(OA_B2B, B2B_PREFILL)

/**
 * 「加好友」的 App scheme。
 *
 * ⚠️ 2026-08-08 修的重大流失點：
 * 原本所有 CTA 都直接連 `https://line.me/R/...`，那是 universal link——
 * 在 Safari 點通常會直接開 App，但**在 Instagram / Facebook 的 in-app browser 裡會被攔截**，
 * 改為顯示 LINE 的英文中間頁「Open LINE to continue / Download LINE」。
 * 而 Reels 廣告的流量 100% 都在 in-app browser 內。
 *
 * 8/3–8/8 有 26 個人按了「加 LINE」卻沒有變成好友，這是最可能的原因——
 * 他們是意圖最強的一批人，卻卡在這一步。
 *
 * 解法：點擊時先用 App scheme 直接喚起 LINE（in-app browser 也吃這個），
 * 喚不起來才 fallback 回 https。使用者不需要多按任何一次。
 */
export const lineAddFriendScheme = (oaId: string) => `line://ti/p/${oaId}`

/** 加好友的 https 版（fallback 用，也是沒有 JS 時的預設行為）。 */
export const lineAddFriendUrl = (oaId: string) => `https://line.me/R/ti/p/${oaId}`

/**
 * 點擊「加 LINE」時呼叫：強制跳進 LINE App 的加好友畫面。
 *
 * 為什麼用「加好友」而不是 oaMessage（預填訊息）：
 * oaMessage 要求先成為好友才有聊天室，路徑更長。改成直接加好友後，
 * OA 的歡迎詞會自動送出（已設定成引導對方回「試用」），效果相同但少一步。
 */
export function openLineOA(oaId: string = OA_B2B): void {
  if (typeof window === 'undefined') return
  const t = Date.now()
  // App scheme：in-app browser 也能喚起，且不會被彈窗阻擋（非 window.open）
  window.location.href = lineAddFriendScheme(oaId)
  // 沒裝 App / scheme 被擋 → 退回 https。頁面若已隱藏代表 App 開起來了，就不要再跳。
  window.setTimeout(() => {
    if (document.hidden || Date.now() - t > 2500) return
    window.location.href = lineAddFriendUrl(oaId)
  }, 1200)
}
