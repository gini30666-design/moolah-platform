import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  verifyOwner: vi.fn(),
  from: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ verifyOwner: mocks.verifyOwner }))
vi.mock('@/lib/supabase', () => ({ sb: { from: mocks.from } }))
vi.mock('@/lib/providerTheme', async () => import('../../../../lib/providerTheme'))

import { PATCH } from './route'

function request(body: unknown) {
  return new NextRequest('http://localhost/api/admin/theme', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', authorization: 'Bearer test' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.from.mockReturnValue({ update: mocks.update })
  mocks.update.mockReturnValue({ eq: mocks.eq })
  mocks.eq.mockResolvedValue({ error: null })
})

describe('PATCH /api/admin/theme', () => {
  it('saves only an allowed theme for its owner', async () => {
    mocks.verifyOwner.mockResolvedValue({ ok: true, userId: 'U-owner' })

    const response = await PATCH(request({ providerId: 'designer-003', theme: 'ubud-slow' }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, theme: 'ubud-slow' })
    expect(mocks.from).toHaveBeenCalledWith('providers')
    expect(mocks.update).toHaveBeenCalledWith({ theme: 'ubud-slow' })
    expect(mocks.eq).toHaveBeenCalledWith('id', 'designer-003')
  })

  it('rejects an arbitrary theme before writing', async () => {
    const response = await PATCH(request({ providerId: 'designer-003', theme: '\" style=\"color:red' }))

    expect(response.status).toBe(400)
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it.each([
    [{ ok: false, status: 401, error: 'unauthorized' }, 401],
    [{ ok: false, status: 403, error: 'forbidden' }, 403],
    [{ ok: false, status: 404, error: 'provider_not_found' }, 404],
  ] as const)('passes through owner verification failures', async (ownerResult, status) => {
    mocks.verifyOwner.mockResolvedValue(ownerResult)

    const response = await PATCH(request({ providerId: 'designer-003', theme: 'bali-stone' }))

    expect(response.status).toBe(status)
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('reports unavailable storage while the approved DDL is still pending', async () => {
    mocks.verifyOwner.mockResolvedValue({ ok: true, userId: 'U-owner' })
    mocks.eq.mockResolvedValue({
      error: { code: '42703', message: 'column providers.theme does not exist' },
    })

    const response = await PATCH(request({ providerId: 'designer-003', theme: 'bali-stone' }))

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'theme_storage_unavailable' })
  })
})
