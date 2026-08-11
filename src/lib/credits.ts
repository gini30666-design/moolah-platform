import { todayInTaipei } from './slots'

/**
 * 儲值卡／次卡的純運算層。
 *
 * ▍設計前提（法規，2026-08-11 查證）
 * MooLah **不經手任何一塊錢**。錢由職人在線下自己收（現金／轉帳／他自己的刷卡機），
 * 系統只記帳。原因：《電子支付機構管理條例》第 3 條把「收受儲值款項」列為
 * 電子支付機構業務，需金管會許可＋最低實收資本額——我們做不到，也不該做。
 *
 * ⚠️ 紅線：餘額只能綁單一職人。做成「跨職人通用錢包」＝條文中的「多用途支付使用」
 *    ＝電子支付業務＝違法。
 *
 * ▍為什麼餘額是「算」出來的而不是「存」的
 * 這個功能讓 MooLah 變成「錢的紀錄者」，數字錯了糾紛會落在職人與客人之間。
 * 餘額若存成一個欄位，永遠說不清是誰改的。改成 sum(流水帳)，
 * 加上 DB trigger 禁止 UPDATE/DELETE，每一塊錢的來歷都可追溯。
 */

/** 《美容定型化契約應記載及不得記載事項》（衛福部，112/7/1 生效）的門檻 */
export const LEGAL = {
  /** 消費總額達此金額應簽訂書面契約 */
  WRITTEN_CONTRACT_THRESHOLD: 10000,
  /** 未使用預付金額「逾」此金額，超過部分應提供履約保障 */
  PERFORMANCE_GUARANTEE_THRESHOLD: 50000,
  /** 全額預付之折扣率不得高於此比例 */
  MAX_DISCOUNT_RATE: 0.2,
  /** 契約審閱期不得少於此天數 */
  MIN_REVIEW_DAYS: 3,
} as const

export type CreditKind = 'amount' | 'count'
export type CreditStatus = 'active' | 'closed'

export type LedgerEntry = { delta: number | string | null | undefined }

export type CreditCard = {
  kind: CreditKind
  status: CreditStatus
  expires_on?: string | null
}

/** 安全轉數字：Postgres 的 numeric 會以字串回傳；壞資料一律當 0，絕不讓餘額變 NaN */
function num(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : 0
}

/** 餘額 = 流水帳 delta 加總。這是唯一權威來源，不要另外存 balance 欄位。 */
export function computeBalance(entries: LedgerEntry[]): number {
  return entries.reduce((sum, e) => sum + num(e?.delta), 0)
}

/** 是否已過期。沒設期限＝永不過期；到期日「當天」仍可使用。 */
export function isCardExpired(expiresOn: string | null | undefined, today = todayInTaipei()): boolean {
  if (!expiresOn) return false
  return expiresOn < today
}

export type RedeemCheck = { ok: true } | { ok: false; reason: 'closed' | 'expired' | 'insufficient' | 'invalid_amount' }

/**
 * 扣款守門。四道檢查缺一不可 —— 餘額變負數是這個功能最不能出的錯。
 */
export function canRedeem(params: {
  card: CreditCard
  balance: number
  amount: number
  today?: string
}): RedeemCheck {
  const { card, balance, amount, today = todayInTaipei() } = params

  // 負數扣款 = 偷偷加值，一定要擋
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, reason: 'invalid_amount' }
  if (card.status === 'closed') return { ok: false, reason: 'closed' }
  if (isCardExpired(card.expires_on, today)) return { ok: false, reason: 'expired' }
  if (amount > balance) return { ok: false, reason: 'insufficient' }
  return { ok: true }
}

/** 折扣率 = 贈送 ÷（實付＋贈送） */
export function discountRate(paid: number, bonus: number): number {
  const total = num(paid) + num(bonus)
  if (total <= 0) return 0
  return num(bonus) / total
}

/** 是否超過法定 20% 折扣上限（剛好 20% 不算超過） */
export function exceedsDiscountCap(paid: number, bonus: number): boolean {
  return discountRate(paid, bonus) > LEGAL.MAX_DISCOUNT_RATE
}

/** 單次消費總額是否達「應簽書面契約」門檻 */
export function needsWrittenContract(paid: number): boolean {
  return num(paid) >= LEGAL.WRITTEN_CONTRACT_THRESHOLD
}

/** 未使用餘額是否「逾」5 萬（次卡是次數不是錢，不適用） */
export function needsPerformanceGuarantee(balance: number, kind: CreditKind = 'amount'): boolean {
  if (kind !== 'amount') return false
  return num(balance) > LEGAL.PERFORMANCE_GUARANTEE_THRESHOLD
}

/** 顯示用：儲值金加千分位、次卡用「次」 */
export function formatCredit(kind: CreditKind, value: number): string {
  const n = num(value)
  return kind === 'count' ? `${n} 次` : `NT$${n.toLocaleString('en-US')}`
}

export const REDEEM_REASON_TEXT: Record<Exclude<RedeemCheck, { ok: true }>['reason'], string> = {
  closed: '這張卡已結清',
  expired: '這張卡已過期',
  insufficient: '餘額不足',
  invalid_amount: '扣款金額必須大於 0',
}
