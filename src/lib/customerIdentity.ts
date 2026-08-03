/**
 * 客戶身分識別 — 以「電話」為主鍵的比對工具。
 *
 * ▍為什麼需要這支
 * 系統原本假設「客人一定從 LINE 進來」（LIFF 流程），所以黑名單、no-show 計數、
 * 客戶備註全部以 `customer_line_user_id` 為主鍵、姓名為輔。
 * 但 2026-06-16 起開放 web 訪客直接預約（不卡 LINE 登入）——
 * 這些人**沒有 LINE ID**，於是：
 *   · 黑名單只能靠姓名比對 → 改個名字就繞過
 *   · no-show 累計 3 次自動封鎖 → 認不出是同一人，永遠累計不到
 * 2026-08-01 實例：有人以「開看看 / 0985555555」從網頁下測試單，無從封鎖。
 *
 * ▍為什麼是電話而不是別的
 * 電話在預約流程是**必填**，在現實世界唯一，而且客人不會為了繞過黑名單換電話
 * ——換了設計師就聯絡不到他，預約本身就失去意義。這讓電話成為成本最高、
 * 因此最可靠的識別碼。
 */

/**
 * 電話正規化：讓 `0912-345-678`、`+886912345678`、`0912 345 678` 都對得起來。
 * 只做格式統一，不做真偽驗證。
 */
export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return ''
  let s = String(raw).replace(/[\s\-().]/g, '')
  // 國碼 → 本地格式：+886912345678 / 886912345678 → 0912345678
  if (s.startsWith('+886')) s = '0' + s.slice(4)
  else if (s.startsWith('886') && s.length >= 12) s = '0' + s.slice(3)
  return s
}

/** 姓名正規化：去所有空白 + 轉小寫，避免「王 小明」vs「王小明」被當成兩個人。 */
export function normalizeName(raw: string | null | undefined): string {
  return (raw ?? '').replace(/\s+/g, '').toLowerCase()
}

export type CustomerIdent = {
  lineUserId?: string | null
  name?: string | null
  phone?: string | null
}

/**
 * 判斷兩筆客戶資料是否為同一人。
 *
 * 比對優先序（由強到弱）：
 *   1. LINE userId — 最強，平台保證唯一
 *   2. 電話        — 次強，現實世界唯一且更換成本高
 *   3. 姓名        — 最弱，僅在前兩者都缺時作為最後手段
 *
 * ⚠️ 姓名比對留著是為了向後相容（舊資料只有姓名），但它擋不住有心人換名字。
 *    真正的防線是電話。
 */
export function isSameCustomer(a: CustomerIdent, b: CustomerIdent): boolean {
  if (a.lineUserId && b.lineUserId && a.lineUserId === b.lineUserId) return true

  const pa = normalizePhone(a.phone)
  const pb = normalizePhone(b.phone)
  if (pa && pb && pa === pb) return true

  // 兩邊都沒有更強的識別碼時，才退回姓名
  const bothLackStrongId = !(a.lineUserId && b.lineUserId) && !(pa && pb)
  if (bothLackStrongId) {
    const na = normalizeName(a.name)
    const nb = normalizeName(b.name)
    if (na && nb && na === nb) return true
  }
  return false
}

/**
 * 客戶備註／作品歷史用的統一鍵。
 * `customer_notes` 的 primary key 含 `customer_line_user_id` 且為 NOT NULL，
 * 改 PK 風險過高，因此 web 訪客改存 `phone:0912345678` 這種前綴鍵，
 * 讓同一套 upsert 邏輯能同時服務 LINE 客與 web 客。
 */
export function customerKey(ident: CustomerIdent): string {
  if (ident.lineUserId) return ident.lineUserId
  const p = normalizePhone(ident.phone)
  return p ? `phone:${p}` : ''
}
