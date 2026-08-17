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

  it('uses provider media in the home-page hero without replacing the existing page structure', () => {
    const providerProfile = readSource('../app/[providerId]/ProviderProfileClient.tsx')

    expect(providerProfile).toContain('data-provider-cover')
    expect(providerProfile).toContain('provider.coverUrl')
    expect(providerProfile).toContain('Selected Work')
    expect(providerProfile).toContain('handleBook')
  })

  it('keeps the pending DDL nullable and whitelist constrained', () => {
    const migration = readSource('../../supabase/migrations/20260817_add_provider_theme.sql')

    expect(migration).toContain('add column if not exists theme text;')
    expect(migration).not.toMatch(/theme\s+text\s+not\s+null/i)
    expect(migration).toContain("'moolah-gold'")
    expect(migration).toContain("'orchid-dusk'")
  })
})
