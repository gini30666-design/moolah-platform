import type { ProviderThemeKey } from './providerTheme'

export type ProviderThemePreviewTarget = 'home' | 'book'

export function providerThemePreviewHref(
  providerId: string,
  theme: ProviderThemeKey,
  target: ProviderThemePreviewTarget,
): string {
  const path = target === 'book' ? `/${encodeURIComponent(providerId)}/book` : `/${encodeURIComponent(providerId)}`
  return `${path}?previewTheme=${encodeURIComponent(theme)}`
}

export function absoluteProviderThemePreviewUrl(href: string, origin: string): string {
  const base = new URL(origin)
  const target = new URL(href, base)
  if (!['http:', 'https:'].includes(target.protocol) || target.origin !== base.origin) {
    throw new Error('Unsafe provider theme preview URL')
  }
  return target.toString()
}

export function providerThemeSaveError(status: number, error: unknown): string {
  if (status === 503 && error === 'theme_storage_unavailable') {
    return '目前可先預覽；資料庫欄位尚未啟用，核准後才能儲存。'
  }
  if (status === 401 || status === 403) return '沒有權限變更這個頁面風格。'
  return '儲存失敗，請稍後再試。'
}
