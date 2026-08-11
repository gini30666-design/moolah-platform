import { describe, it, expect } from 'vitest'
import {
  computeBalance,
  isCardExpired,
  canRedeem,
  discountRate,
  exceedsDiscountCap,
  needsWrittenContract,
  needsPerformanceGuarantee,
  formatCredit,
  LEGAL,
} from './credits'

describe('computeBalance — 餘額一律由流水帳算出，不存欄位', () => {
  it('空流水帳 = 0', () => {
    expect(computeBalance([])).toBe(0)
  })

  it('儲值 + 扣款', () => {
    expect(computeBalance([{ delta: 5000 }, { delta: -1200 }, { delta: -800 }])).toBe(3000)
  })

  it('沖正一筆扣款 → 餘額回復', () => {
    // 誤扣 1200 → 新增一筆 +1200 的沖正（不是去改原本那筆）
    expect(computeBalance([{ delta: 5000 }, { delta: -1200 }, { delta: 1200 }])).toBe(5000)
  })

  it('Postgres numeric 會回傳字串，必須容忍', () => {
    expect(computeBalance([{ delta: '5000' }, { delta: '-1200' }])).toBe(3800)
  })

  it('次卡：次數也是同一套算法', () => {
    expect(computeBalance([{ delta: 10 }, { delta: -1 }, { delta: -1 }])).toBe(8)
  })

  it('壞資料（null / 非數字）當 0，不能讓整張卡的餘額變 NaN', () => {
    expect(computeBalance([{ delta: 5000 }, { delta: null }, { delta: 'abc' }])).toBe(5000)
  })
})

describe('isCardExpired — 用台北時區的今天判斷', () => {
  it('沒設期限 = 永不過期', () => {
    expect(isCardExpired(null, '2026-08-11')).toBe(false)
    expect(isCardExpired('', '2026-08-11')).toBe(false)
  })

  it('到期日當天仍可使用（含當日）', () => {
    expect(isCardExpired('2026-08-11', '2026-08-11')).toBe(false)
  })

  it('過了到期日就是過期', () => {
    expect(isCardExpired('2026-08-10', '2026-08-11')).toBe(true)
  })

  it('未來到期日 = 未過期', () => {
    expect(isCardExpired('2027-01-01', '2026-08-11')).toBe(false)
  })
})

describe('canRedeem — 扣款守門', () => {
  const card = { kind: 'amount' as const, status: 'active' as const, expires_on: '2027-01-01' }

  it('餘額足夠 → 放行', () => {
    expect(canRedeem({ card, balance: 3000, amount: 1200, today: '2026-08-11' }).ok).toBe(true)
  })

  it('餘額剛好扣完 → 放行', () => {
    expect(canRedeem({ card, balance: 1200, amount: 1200, today: '2026-08-11' }).ok).toBe(true)
  })

  it('🔴 餘額不足 → 擋下（不可以變負數）', () => {
    const r = canRedeem({ card, balance: 1000, amount: 1200, today: '2026-08-11' })
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.reason).toBe('insufficient')
  })

  it('🔴 過期的卡不能扣', () => {
    const expired = { ...card, expires_on: '2026-08-01' }
    const r = canRedeem({ card: expired, balance: 5000, amount: 100, today: '2026-08-11' })
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.reason).toBe('expired')
  })

  it('🔴 已結清的卡不能扣', () => {
    const closed = { ...card, status: 'closed' as const }
    const r = canRedeem({ card: closed, balance: 5000, amount: 100, today: '2026-08-11' })
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.reason).toBe('closed')
  })

  it('🔴 扣款金額必須大於 0（擋掉 0 與負數，負數等於偷偷加值）', () => {
    expect(canRedeem({ card, balance: 3000, amount: 0, today: '2026-08-11' }).ok).toBe(false)
    expect(canRedeem({ card, balance: 3000, amount: -500, today: '2026-08-11' }).ok).toBe(false)
  })

  it('次卡：扣 1 次的邏輯與金額完全相同', () => {
    const countCard = { ...card, kind: 'count' as const }
    expect(canRedeem({ card: countCard, balance: 3, amount: 1, today: '2026-08-11' }).ok).toBe(true)
    expect(canRedeem({ card: countCard, balance: 0, amount: 1, today: '2026-08-11' }).ok).toBe(false)
  })
})

describe('法規門檻（美容定型化契約應記載及不得記載事項）', () => {
  it('折扣率 = 贈送 ÷ 總額', () => {
    expect(discountRate(5000, 500)).toBeCloseTo(500 / 5500)
    expect(discountRate(5000, 0)).toBe(0)
    expect(discountRate(0, 0)).toBe(0)   // 不能除以 0
  })

  it('🔴 全額預付折扣率不得高於 20%', () => {
    expect(LEGAL.MAX_DISCOUNT_RATE).toBe(0.2)
    expect(exceedsDiscountCap(10000, 2000)).toBe(false)  // 2000/12000 = 16.7% OK
    expect(exceedsDiscountCap(10000, 2500)).toBe(false)  // 剛好 20%
    expect(exceedsDiscountCap(10000, 3000)).toBe(true)   // 23% 超標
  })

  it('消費總額 1 萬以上應簽書面契約', () => {
    expect(LEGAL.WRITTEN_CONTRACT_THRESHOLD).toBe(10000)
    expect(needsWrittenContract(9999)).toBe(false)
    expect(needsWrittenContract(10000)).toBe(true)
    expect(needsWrittenContract(12000)).toBe(true)
  })

  it('未使用餘額逾 5 萬須提供履約保障（逾＝超過，剛好 5 萬不算）', () => {
    expect(LEGAL.PERFORMANCE_GUARANTEE_THRESHOLD).toBe(50000)
    expect(needsPerformanceGuarantee(50000)).toBe(false)
    expect(needsPerformanceGuarantee(50001)).toBe(true)
  })

  it('次卡不適用金額門檻（次數不是錢）', () => {
    expect(needsPerformanceGuarantee(60, 'count')).toBe(false)
  })
})

describe('formatCredit — 顯示', () => {
  it('儲值金加千分位', () => {
    expect(formatCredit('amount', 3800)).toBe('NT$3,800')
    expect(formatCredit('amount', 0)).toBe('NT$0')
  })
  it('次卡用「次」', () => {
    expect(formatCredit('count', 8)).toBe('8 次')
  })
})
