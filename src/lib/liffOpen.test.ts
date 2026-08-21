import { describe, expect, it } from 'vitest'
import { liffHttpsUrl, liffSchemeUrl } from './liffOpen'

// 2026-08-21：手機點「開始預約」跳不進 LINE。
// 根因與 8/08 的「加 LINE」同一個：universal link 由 JS 觸發時常常只開網頁版。
// 解法是先用 App scheme —— 這組測試鎖住兩種 URL 的形狀，避免有人改回只剩 https。
const ID = process.env.NEXT_PUBLIC_LIFF_ID

describe('LIFF 開啟連結', () => {
  it('scheme 版用 line://app/（不是 universal link，in-app browser 也吃得動）', () => {
    expect(liffSchemeUrl('/tong/book', 'L1')).toBe('line://app/L1?to=%2Ftong%2Fbook')
  })

  it('https 版保留（fallback 與無 JS 時用）', () => {
    expect(liffHttpsUrl('/tong/book', 'L1')).toBe('https://liff.line.me/L1?to=%2Ftong%2Fbook')
  })

  it('🔴 path 的 query 要被完整編碼，不能把 ? 直接洩到外層', () => {
    const p = '/tong/book?service=tong-svc01'
    expect(liffSchemeUrl(p, 'L1')).toBe('line://app/L1?to=%2Ftong%2Fbook%3Fservice%3Dtong-svc01')
    expect(liffHttpsUrl(p, 'L1').split('?to=')[1]).not.toContain('?')
  })

  it('兩種版本指向同一個 path', () => {
    const p = '/my-bookings'
    const q = (u: string) => decodeURIComponent(u.split('?to=')[1])
    expect(q(liffSchemeUrl(p, 'L1'))).toBe(q(liffHttpsUrl(p, 'L1')))
  })

  it('環境有設 LIFF_ID 時預設參數可用', () => {
    if (ID) expect(liffSchemeUrl('/x')).toContain(ID)
  })
})
