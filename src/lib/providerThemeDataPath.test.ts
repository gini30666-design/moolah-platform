import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const readSource = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8')

describe('providers.theme AA data path guard', () => {
  it('requests AA in both provider consumers that need the full row', () => {
    const providerRoute = readSource('../app/api/provider/[id]/route.ts')
    const bookingRoute = readSource('../app/api/booking/route.ts')

    expect(providerRoute).toContain("getSheetData('providers!A2:AA')")
    expect(bookingRoute).toContain("getSheetData('providers!A2:AA')")
    expect(providerRoute).toContain('theme: providerThemeFromRow(r)')
  })

  it('keeps the pending DDL nullable and whitelist constrained', () => {
    const migration = readSource('../../supabase/migrations/20260817_add_provider_theme.sql')

    expect(migration).toContain('add column if not exists theme text;')
    expect(migration).not.toMatch(/theme\s+text\s+not\s+null/i)
    expect(migration).toContain("'moolah-gold'")
    expect(migration).toContain("'orchid-dusk'")
  })
})
