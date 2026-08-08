import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  OA_B2B, OA_CONSUMER, lineAddFriendScheme, lineAddFriendUrl, openLineOA, lineOaMessage,
} from './lineOA'

// ── 2026-08-08 那個 bug 的回歸測試 ─────────────────────────────
// 26 個按了「加 LINE」的人一個都沒加成好友，因為 https://line.me/R/... 在
// Instagram / Facebook 的 in-app browser 會被攔截，顯示英文中間頁。
// 這組測試鎖住修好後的行為，避免有人改回去。

describe('LINE 連結格式', () => {
  it('加好友用 App scheme（in-app browser 也喚得起）', () => {
    expect(lineAddFriendScheme(OA_B2B)).toBe('line://ti/p/@492ejbwx')
    expect(lineAddFriendScheme(OA_CONSUMER)).toBe('line://ti/p/@881zhkla')
  })

  it('scheme 必須是 line:// 而不是 https（https 會被 in-app browser 攔截）', () => {
    expect(lineAddFriendScheme(OA_B2B).startsWith('line://')).toBe(true)
    expect(lineAddFriendScheme(OA_B2B).startsWith('http')).toBe(false)
  })

  it('https 版保留給 fallback 與無 JS 環境', () => {
    expect(lineAddFriendUrl(OA_B2B)).toBe('https://line.me/R/ti/p/@492ejbwx')
  })

  it('兩支 OA 不可混用（招商/消費者導錯會接不到人）', () => {
    expect(OA_B2B).toBe('@492ejbwx')
    expect(OA_CONSUMER).toBe('@881zhkla')
    expect(OA_B2B).not.toBe(OA_CONSUMER)
  })

  it('oaMessage 會把預填文字編碼（保留給需要預填的情境）', () => {
    const u = lineOaMessage(OA_B2B, '我想了解 MooLah')
    expect(u).toContain('/oaMessage/@492ejbwx/?')
    expect(u).toContain(encodeURIComponent('我想了解 MooLah'))
  })
})

describe('openLineOA — 先 App scheme，必要時才 fallback', () => {
  let hrefLog: string[]
  let hidden = false

  beforeEach(() => {
    vi.useFakeTimers()
    hrefLog = []
    hidden = false
    vi.stubGlobal('document', {
      get hidden() { return hidden },
    })
    vi.stubGlobal('window', {
      location: { set href(v: string) { hrefLog.push(v) }, get href() { return hrefLog.at(-1) ?? '' } },
      setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    })
  })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

  it('第一步一定是 App scheme，使用者不需要多按一次', () => {
    openLineOA(OA_B2B)
    expect(hrefLog[0]).toBe('line://ti/p/@492ejbwx')
  })

  it('★ App 有開起來（頁面轉背景）→ 不再跳 https，避免又看到英文中間頁', () => {
    openLineOA(OA_B2B)
    hidden = true                 // 模擬 LINE App 被喚起、瀏覽器頁面隱藏
    vi.advanceTimersByTime(2000)
    expect(hrefLog).toHaveLength(1)
  })

  it('沒裝 App / scheme 被擋（頁面仍在前景）→ fallback 到 https，不讓使用者卡死', () => {
    openLineOA(OA_B2B)
    vi.advanceTimersByTime(2000)
    expect(hrefLog).toEqual([
      'line://ti/p/@492ejbwx',
      'https://line.me/R/ti/p/@492ejbwx',
    ])
  })

  it('預設走招商 OA（B2B 動線最常用）', () => {
    openLineOA()
    expect(hrefLog[0]).toContain('@492ejbwx')
  })

  it('消費者動線指定 OA 時要用消費者 bot', () => {
    openLineOA(OA_CONSUMER)
    expect(hrefLog[0]).toBe('line://ti/p/@881zhkla')
  })
})
