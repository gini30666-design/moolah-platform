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
