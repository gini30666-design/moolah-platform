// ============================================================
//  方案參數 — 單一真相來源
//  2026-08-06：原本 20 這個數字硬編在 4 個檔（booking / admin / trial-reminder /
//  對外文案），改一次要改四處，很容易漏。集中在這裡。
// ============================================================

/** 免費試用天數 */
export const TRIAL_DAYS = 14

/**
 * 試用期何時起算 —— 2026-08-20 Gini 決定：**從第一筆真實預約那天起算**，不是認領那天。
 *
 * 為什麼改：認領到「真的開始接單」中間常常隔好幾天，甚至一直沒開始。
 * Zuzu 8/10 認領、8/24 到期、期間 0 筆預約 —— 14 天全燒在「還沒開始用」上。
 * 試用的意義是讓職人驗證這東西有沒有用，那就該從他真的用起來的那一刻算。
 *
 * 資料表達：`plan='trial'` 但 `trial_start_at` 為 null ＝ **試用尚未開始**（不會過期）。
 * ⚠️ 筆數上限 TRIAL_BOOKING_LIMIT 不受影響，仍然從第一筆就開始累計。
 */
export function trialWindowFrom(startIso: string): { startAt: string; endsAt: string } {
  const start = new Date(startIso)
  return {
    startAt: start.toISOString(),
    endsAt: new Date(start.getTime() + TRIAL_DAYS * 86400_000).toISOString(),
  }
}

/** 試用是否已經開始計時（plan='trial' 且已有起算日）。 */
export function trialHasStarted(plan: unknown, trialStartAt: unknown): boolean {
  return String(plan ?? '').trim() === 'trial' && !!String(trialStartAt ?? '').trim()
}

/**
 * 試用期間可接受的預約筆數上限（含已完成，不含已取消）。
 * 超過就擋下客人下單 —— 所以這是「會直接影響真實客人」的數字，調整前想清楚。
 * 20 → 30（2026-08-06，Gini 決定）：20 筆對一天可排 14 格的職人只需平均 1.5 筆/天
 * 就會撞到，對正常營業的工作室太緊。
 */
export const TRIAL_BOOKING_LIMIT = 30

/** 用量達到這個比例就先推播提醒業務，不要等撞上限才發現 */
export const TRIAL_WARN_RATIO = 0.8

/** 觸發預警的筆數（= 24 筆） */
export const TRIAL_WARN_AT = Math.floor(TRIAL_BOOKING_LIMIT * TRIAL_WARN_RATIO)

/** 標準方案月費（NT$） */
export const MONTHLY_FEE = 699

/**
 * 未到店（no-show）累計幾次後自動加入黑名單、無法再線上預約。
 *
 * ⚠️ 這個數字現在同時出現在兩端：`lib/blacklist.ts` 的判斷，
 * 以及 book 頁對客人的公告（D1 信用擔保）。兩邊講的必須是同一件事——
 * 規則沒被告知就沒有嚇阻力，而告知的數字跟實際執行的不一樣更糟。
 * 所以放在這裡當單一真相來源，不要在任何一端重新寫死。
 */
export const NO_SHOW_THRESHOLD = 3
