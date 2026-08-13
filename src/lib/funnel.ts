// 招商漏斗的事件階梯 —— 這是唯一真相來源。
//
// 為什麼要有階梯（2026-08-13 顧問診斷）：
//   在這之前我們只送 PageView / Contact / Lead 三個事件，
//   Meta 只能學到「誰喜歡按按鈕」，學不到「誰最後真的變成付費職人」。
//   把 Trial / Activated / Paid 也餵回去，優化目標才對得上真正的商業結果。
//
// ⚠️ 命名原則：能用 Meta 標準事件就用標準事件（ViewContent / Contact / Lead /
//    StartTrial / Subscribe）—— 標準事件 Meta 的模型認得，自訂事件它只能當黑箱計數。
//    只有真的沒有對應標準事件的（Engaged / Activated）才用自訂名稱。

export type FunnelStage =
  | 'view'       // 看到招商頁
  | 'engaged'    // 停留夠久／捲夠深 ＝ 真的在讀，不是誤觸
  | 'contact'    // 點了「加 LINE」
  | 'lead'       // 送出招商表單
  | 'trial'      // 認領成功、試用開始
  | 'activated'  // 收到第一筆真實客人預約 ＝ 系統真的在他店裡運轉
  | 'paid'       // 月費入帳

/** Meta Pixel / CAPI 的事件名 */
export const META_EVENT: Record<FunnelStage, string> = {
  view:      'ViewContent',
  engaged:   'Engaged',        // 自訂：Meta 沒有對應的標準事件
  contact:   'Contact',
  lead:      'Lead',
  trial:     'StartTrial',
  activated: 'Activated',      // 自訂
  paid:      'Subscribe',      // 月費訂閱制 → Subscribe 比 Purchase 貼切
}

/** GA4 的事件名（沿用既有命名，不要改動已在報表裡的事件） */
export const GA_EVENT: Record<FunnelStage, string> = {
  view:      'view_pro_page',
  engaged:   'engaged_view',
  contact:   'click_line_oa',   // ⚠️ 既有事件，GA4 報表在用，不可改名
  lead:      'generate_lead',   // ⚠️ 同上，且是 Google Ads 匯入的轉換
  trial:     'start_trial',
  activated: 'activated',
  paid:      'subscribe',
}

/** 判定「有在讀」的門檻 —— 兩個條件任一達成即算 engaged */
export const ENGAGED_DWELL_MS = 10_000
export const ENGAGED_SCROLL_PCT = 25

/**
 * 產生 event_id 供 Pixel 與 CAPI 去重。
 * 同一個動作瀏覽器端與伺服器端各送一次、帶同一個 event_id，
 * Meta 會自動合併成一筆 —— 這樣廣告封鎖器擋掉瀏覽器那邊時，伺服器這邊仍然算得到。
 */
export function newEventId(stage: FunnelStage): string {
  const rand = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${stage}.${rand}`
}
