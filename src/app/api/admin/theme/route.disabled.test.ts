import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// 這一組驗「總開關關閉時」的行為 —— 用真實的 providerTheme（現值 false）。
// 重點：只藏 UI 不擋 API 等於沒擋，所以必須連身分驗證都還沒跑就先回 403，
// 而且絕對不能碰資料庫。
const mocks = vi.hoisted(() => ({
  verifyOwner: vi.fn(),
  from: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ verifyOwner: mocks.verifyOwner }))
vi.mock('@/lib/supabase', () => ({ sb: { from: mocks.from } }))
// vitest 沒有設 '@' alias（見同目錄 route.test.ts 也是用相對路徑餵 mock），
// 這裡照樣把真實模組接上去，開關值就是現行值。
vi.mock('@/lib/providerTheme', async () => import('../../../../lib/providerTheme'))

import { PATCH } from './route'
import { PROVIDER_THEME_PICKER_ENABLED } from '../../../../lib/providerTheme'

beforeEach(() => vi.clearAllMocks())

describe('PATCH /api/admin/theme（總開關關閉時）', () => {
  it('開關預設是關的', () => {
    expect(PROVIDER_THEME_PICKER_ENABLED).toBe(false)
  })

  it('即使是合法主題也回 403，且不查身分、不碰 DB', async () => {
    const res = await PATCH(new NextRequest('http://localhost/api/admin/theme', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', authorization: 'Bearer test' },
      body: JSON.stringify({ providerId: 'designer-003', theme: 'bali-stone' }),
    }))

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'theme_picker_disabled' })
    expect(mocks.verifyOwner).not.toHaveBeenCalled()
    expect(mocks.from).not.toHaveBeenCalled()
  })
})
