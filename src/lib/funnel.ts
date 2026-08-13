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
  | 'qualified'  // ★ 談過之後確認是真的美業工作室主 ＝ 值錢的那一批
  | 'trial'      // 認領成功、試用開始
  | 'activated'  // 收到第一筆真實客人預約 ＝ 系統真的在他店裡運轉
  | 'paid'       // 月費入帳

/** Meta Pixel / CAPI 的事件名 */
export const META_EVENT: Record<FunnelStage, string> = {
  view:      'ViewContent',
  engaged:   'Engaged',        // 自訂：Meta 沒有對應的標準事件
  contact:   'Contact',
  lead:      'Lead',
  qualified: 'QualifiedLead',  // 自訂：Meta 沒有標準的「合格名單」事件
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
  qualified: 'qualify_lead',    // ⚠️ GA4 已標為重要事件（Day 51 業務目標範本），沿用
  trial:     'start_trial',
  activated: 'activated',
  paid:      'subscribe',
}

/**
 * ⚠️ Meta 該優化哪一階，跟「哪一階最接近錢」是兩件事。
 *
 * 顧問 2026-08-13 的提醒：現在 Lead 全期只有 2 筆。
 * 直接叫 Meta「優化 Lead」它會因為事件量太少而學不動（每組每週要 ~50 次事件）。
 * 所以要走 signal ladder，量夠了才往下一階移：
 *
 *   現在   → CONVERSATIONS（訊息對話，量最大）★ 目前設定，正確，不要動
 *   量夠後 → Lead / StartTrial
 *   再之後 → Activated / Paid
 *
 * 這個常數只是把判斷寫下來備忘，程式不讀它 —— 優化目標設在 Meta 後台的 ad set。
 */
export const OPTIMIZATION_LADDER = ['contact', 'lead', 'qualified', 'trial', 'paid'] as const

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
