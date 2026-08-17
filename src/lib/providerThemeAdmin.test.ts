import { describe, expect, it } from 'vitest'
import {
  providerThemePreviewHref,
  providerThemeSaveError,
} from './providerThemeAdmin'

describe('provider theme admin helpers', () => {
  it('builds encoded home and booking preview links without changing the saved theme', () => {
    expect(providerThemePreviewHref('spa/gini', 'bali-stone', 'home')).toBe(
      '/spa%2Fgini?previewTheme=bali-stone',
    )
    expect(providerThemePreviewHref('spa/gini', 'orchid-dusk', 'book')).toBe(
      '/spa%2Fgini/book?previewTheme=orchid-dusk',
    )
  })

  it('explains that storage is pending when the approved DDL is not available', () => {
    expect(providerThemeSaveError(503, 'theme_storage_unavailable')).toBe(
      '目前可先預覽；資料庫欄位尚未啟用，核准後才能儲存。',
    )
  })

  it('uses safe, non-technical copy for other save failures', () => {
    expect(providerThemeSaveError(403, 'forbidden')).toBe('沒有權限變更這個頁面風格。')
    expect(providerThemeSaveError(500, 'theme_update_failed')).toBe('儲存失敗，請稍後再試。')
  })
})
