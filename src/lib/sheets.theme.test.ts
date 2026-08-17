import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({ sb: {} }))

import { TABLE_COLS } from './sheets'

describe('providers theme column compatibility', () => {
  it('keeps all existing provider columns in place and appends theme at AA', () => {
    expect(TABLE_COLS.providers).toHaveLength(27)
    expect(TABLE_COLS.providers[25]).toBe('portfolio_mode')
    expect(TABLE_COLS.providers[26]).toBe('theme')
  })
})
