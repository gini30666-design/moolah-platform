import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
// auth.ts 連帶 import sheets.ts / supabase.ts → 會在 module load 初始化 Supabase client，
// 測試環境沒有 env。兩支都擋掉，測試才跑得起來。
const dbMocks = vi.hoisted(() => ({
  getSheetData: vi.fn(async () => [] as string[][]),
  maybeSingle: vi.fn(async (): Promise<{ data: { role: string } | null; error: { message: string } | null }> =>
    ({ data: null, error: null })),
}))
vi.mock('./sheets', () => ({ getSheetData: dbMocks.getSheetData }))
vi.mock('./supabase', () => ({
  sb: {
    from: () => ({
      select: () => ({
        eq: () => ({ eq: () => ({ maybeSingle: dbMocks.maybeSingle }) }),
      }),
    }),
  },
}))

import { getAuthUserId, verifyAccess } from './auth'
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

// ── verifyAccess：全後台唯一的守門，改壞＝別人能進客戶的後台 ──────────────
describe('verifyAccess — owner / 協作夥伴 / 陌生人', () => {
  const OWNER = 'U_owner'
  const STAFF = 'U_staff'
  const MANAGER = 'U_manager'

  // providers!A2:E → id(0) name(1) category(2) description(3) line_user_id(4)
  const providersRows = [['tong', 'Tong 彤', '按摩舒壓師', '', OWNER]]

  const asUser = (userId: string | null) => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      userId ? { ok: true, json: async () => ({ userId }) } : { ok: false, json: async () => ({}) }))
    return reqWith('Bearer token')
  }

  beforeEach(() => {
    dbMocks.getSheetData.mockResolvedValue(providersRows)
    dbMocks.maybeSingle.mockResolvedValue({ data: null, error: null })
  })

  it('owner 兩種等級都過，role=owner', async () => {
    expect(await verifyAccess(asUser(OWNER), 'tong', 'staff')).toMatchObject({ ok: true, role: 'owner' })
    expect(await verifyAccess(asUser(OWNER), 'tong', 'owner')).toMatchObject({ ok: true, role: 'owner' })
  })

  it('staff 過 staff 級，🔴 被 owner 級擋下（insufficient_role）', async () => {
    dbMocks.maybeSingle.mockResolvedValue({ data: { role: 'staff' }, error: null })
    expect(await verifyAccess(asUser(STAFF), 'tong', 'staff')).toMatchObject({ ok: true, role: 'staff' })
    expect(await verifyAccess(asUser(STAFF), 'tong', 'owner'))
      .toMatchObject({ ok: false, status: 403, error: 'insufficient_role' })
  })

  it('manager 兩種等級都過', async () => {
    dbMocks.maybeSingle.mockResolvedValue({ data: { role: 'manager' }, error: null })
    expect(await verifyAccess(asUser(MANAGER), 'tong', 'owner')).toMatchObject({ ok: true, role: 'manager' })
  })

  it('🔴 不是成員 → 403（連 staff 級都不給）', async () => {
    expect(await verifyAccess(asUser('U_stranger'), 'tong', 'staff'))
      .toMatchObject({ ok: false, status: 403, error: 'forbidden' })
  })

  it('🔴 被移除後立刻失效', async () => {
    dbMocks.maybeSingle.mockResolvedValue({ data: { role: 'manager' }, error: null })
    expect(await verifyAccess(asUser(MANAGER), 'tong', 'owner')).toMatchObject({ ok: true })
    dbMocks.maybeSingle.mockResolvedValue({ data: null, error: null })   // 名單被刪
    expect(await verifyAccess(asUser(MANAGER), 'tong', 'staff')).toMatchObject({ ok: false, status: 403 })
  })

  it('🔴 members 查詢出錯 → fail-closed（不可因 DB 抖動放行）', async () => {
    dbMocks.maybeSingle.mockResolvedValue({ data: null, error: { message: 'boom' } })
    expect(await verifyAccess(asUser(STAFF), 'tong', 'staff')).toMatchObject({ ok: false, status: 403 })
  })

  it('🔴 DB 被塞 role=owner 也只當 staff（owner 只能來自 providers.line_user_id）', async () => {
    dbMocks.maybeSingle.mockResolvedValue({ data: { role: 'owner' }, error: null })
    expect(await verifyAccess(asUser(STAFF), 'tong', 'owner'))
      .toMatchObject({ ok: false, error: 'insufficient_role' })
  })

  it('沒帶 token → 401；沒帶 providerId → 400；職人不存在 → 404', async () => {
    expect(await verifyAccess(asUser(null), 'tong', 'staff')).toMatchObject({ ok: false, status: 401 })
    expect(await verifyAccess(asUser(OWNER), '', 'staff')).toMatchObject({ ok: false, status: 400 })
    expect(await verifyAccess(asUser(OWNER), 'nobody', 'staff')).toMatchObject({ ok: false, status: 404 })
  })

  it('need 省略時預設 owner 級（fail-safe，新 API 忘了標不會意外放行）', async () => {
    dbMocks.maybeSingle.mockResolvedValue({ data: { role: 'staff' }, error: null })
    expect(await verifyAccess(asUser(STAFF), 'tong')).toMatchObject({ ok: false, error: 'insufficient_role' })
  })
})
