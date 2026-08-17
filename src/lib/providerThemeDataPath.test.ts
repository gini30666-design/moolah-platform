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

  it('uses the shared theme shell on the provider home, booking, and admin pages', () => {
    const providerPage = readSource('../app/[providerId]/page.tsx')
    const bookingPage = readSource('../app/[providerId]/book/page.tsx')
    const adminPage = readSource('../app/[providerId]/admin/page.tsx')

    expect(providerPage).toContain('<ProviderThemeShell')
    expect(bookingPage).toContain('<ProviderThemeShell')
    expect(adminPage).toContain('<ProviderThemeShell')
    expect(adminPage).toContain('<ThemePickerPanel')
    expect(adminPage).toContain("['theme', '頁面風格']")
  })

  it('keeps the pending DDL nullable and whitelist constrained', () => {
    const migration = readSource('../../supabase/migrations/20260817_add_provider_theme.sql')

    expect(migration).toContain('add column if not exists theme text;')
    expect(migration).not.toMatch(/theme\s+text\s+not\s+null/i)
    expect(migration).toContain("'moolah-gold'")
    expect(migration).toContain("'orchid-dusk'")
  })
})
