import { describe, it, expect } from 'vitest'
import { colToIndex } from './colRef'

/**
 * 🔴 這組測試存在的理由（2026-08-12）：
 * 舊版的欄位字母解析是 `'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(letters)`。
 * 單字母都對，所以一直沒被發現；但雙字母會**靜默回傳錯的索引**——
 * 'AB' 會得到 0（因為它是 'ABCD…' 的子字串），讀 A2:AB 會只拿到第一欄。
 * providers 表已經用到 Z（第 26 欄），下一個新欄位就會踩到。
 */
describe('colToIndex — 試算表欄位字母 → 0-based 索引', () => {
  it('單字母（既有全部範圍都靠這個，不能壞）', () => {
    expect(colToIndex('A')).toBe(0)
    expect(colToIndex('B')).toBe(1)
    expect(colToIndex('M')).toBe(12)   // bookings!A2:M
    expect(colToIndex('Y')).toBe(24)
    expect(colToIndex('Z')).toBe(25)   // providers 目前最後一欄 portfolio_mode
  })

  it('★ 雙字母：舊版在這裡靜默給錯答案', () => {
    expect(colToIndex('AA')).toBe(26)  // 舊版 -1
    expect(colToIndex('AB')).toBe(27)  // 舊版 0 ← 最危險的一個
    expect(colToIndex('AZ')).toBe(51)
    expect(colToIndex('BA')).toBe(52)
    expect(colToIndex('ZZ')).toBe(701)
  })

  it('遞增且不重複（bijective base-26 的基本性質）', () => {
    const letters = ['X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD']
    const idx = letters.map(colToIndex)
    expect(idx).toEqual([23, 24, 25, 26, 27, 28, 29])
    expect(new Set(idx).size).toBe(idx.length)
  })
})
