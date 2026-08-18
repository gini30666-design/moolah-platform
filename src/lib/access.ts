/**
 * 後台存取角色與權限層級（純邏輯，無 I/O —— 方便單獨測試）。
 *
 * 角色來源有兩個，不要混淆：
 *   owner            ← providers.line_user_id（認領流程寫入，也是 LINE 推播的收件人）
 *   manager / staff  ← provider_members（協作夥伴，不收推播）
 *
 * ⚠️ owner 永遠不會出現在 provider_members 裡。「誰是老闆」只有一個真相來源。
 */
export type AccessRole = 'owner' | 'manager' | 'staff'

/**
 * 一個操作需要的最低權限。
 *
 * 'staff' ＝ 日常接單（看預約、標完成／取消／爽約、手動建單、客戶備註、候補）
 * 'owner' ＝ 會動到「店本身」的設定與金錢（服務價格、排班、作品集、儲值卡、頁面風格）
 *
 * 🔴 預設值刻意是 'owner'（fail-safe）：
 *    以後新增 admin API 忘了標，行為是「最嚴」而不是意外放行。
 */
export type AccessNeed = 'staff' | 'owner'

export function roleSatisfies(role: AccessRole, need: AccessNeed): boolean {
  if (need === 'staff') return true            // 三種角色都能做日常接單
  return role === 'owner' || role === 'manager' // owner 級操作：只有老闆與 manager
}

const ROLE_SET = new Set<string>(['manager', 'staff'])

/** provider_members.role 的正規化：不認得的值一律降為最低權限的 staff，不是拋錯也不是放行。 */
export function normalizeMemberRole(value: unknown): 'manager' | 'staff' {
  const v = typeof value === 'string' ? value.trim() : ''
  return ROLE_SET.has(v) ? (v as 'manager' | 'staff') : 'staff'
}
