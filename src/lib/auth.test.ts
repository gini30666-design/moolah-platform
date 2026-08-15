import { describe, it, expect, vi, afterEach } from 'vitest'
// auth.ts 連帶 import sheets.ts → 會初始化 Supabase client，測試環境沒有 env。
// 這裡只測 getAuthUserId（不碰 DB），把 sheets 擋掉即可。
vi.mock('./sheets', () => ({ getSheetData: vi.fn(async () => []) }))

import { getAuthUserId } from './auth'
import type { NextRequest } from 'next/server'

// 只帶 header 的最小 NextRequest 替身 —— getAuthUserId 只用到 headers
const reqWith = (auth?: string) =>
  ({ headers: { get: (k: string) => (k.toLowerCase() === 'authorization' ? auth ?? null : null) } }) as unknown as NextRequest

afterEach(() => { vi.unstubAllGlobals() })

describe('getAuthUserId — 身分只認 LINE token', () => {
  it('沒有 Authorization header → null（不可退回信任 body/query）', async () => {
    expect(await getAuthUserId(reqWith())).toBeNull()
  })

  it('不是 Bearer 格式 → null', async () => {
    expect(await getAuthUserId(reqWith('Basic abc'))).toBeNull()
  })

  it('空的 Bearer → null，且不會去打 LINE', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    expect(await getAuthUserId(reqWith('Bearer   '))).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('LINE 說 token 無效（401）→ null', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401 })))
    expect(await getAuthUserId(reqWith('Bearer forged'))).toBeNull()
  })

  it('token 有效 → 回 LINE 給的 userId（不是呼叫端宣稱的那個）', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ userId: 'U_real' }) })))
    expect(await getAuthUserId(reqWith('Bearer good'))).toBe('U_real')
  })

  it('LINE 回了但沒有 userId 欄位 → null', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({}) })))
    expect(await getAuthUserId(reqWith('Bearer weird'))).toBeNull()
  })

  it('LINE 掛掉／逾時 → null，不可 throw（否則預約整支 500）', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('timeout') }))
    await expect(getAuthUserId(reqWith('Bearer x'))).resolves.toBeNull()
  })

  it('打 LINE 時有帶逾時（signal），避免卡住使用者等待路徑', async () => {
    const spy = vi.fn(async (_url: unknown, init?: { signal?: unknown }) => { void init; return { ok: true, json: async () => ({ userId: 'U1' }) } })
    vi.stubGlobal('fetch', spy)
    await getAuthUserId(reqWith('Bearer x'))
    expect(spy.mock.calls[0]?.[1]).toHaveProperty('signal')
  })
})
