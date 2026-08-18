export const PROVIDER_THEME_KEYS = [
  'bali-stone',
  'ubud-slow',
  'quiet-luxury',
  'moolah-gold',
  'rainforest-jade',
  'terracotta-sunset',
  'indigo-tides',
  'orchid-dusk',
] as const

export type ProviderThemeKey = (typeof PROVIDER_THEME_KEYS)[number]

export const DEFAULT_PROVIDER_THEME: ProviderThemeKey = 'moolah-gold'
export const PROVIDER_THEME_COLUMN_INDEX = 26

export type ProviderThemeDepth = 'light' | 'mid' | 'dark'

export type ProviderThemeOption = Readonly<{
  key: ProviderThemeKey
  label: string
  swatches: readonly [string, string, string]
  depth: ProviderThemeDepth
}>

export const PROVIDER_THEME_OPTIONS: readonly ProviderThemeOption[] = [
  { key: 'bali-stone', label: '峇里石境', swatches: ['#b99a71', '#302b24', '#171612'], depth: 'dark' },
  { key: 'ubud-slow', label: '烏布慢居', swatches: ['#3f4b3c', '#c6ccb7', '#8f9780'], depth: 'mid' },
  { key: 'quiet-luxury', label: '靜奢度假', swatches: ['#625344', '#f8f5ee', '#ece8df'], depth: 'light' },
  { key: 'moolah-gold', label: 'MooLah 原生金', swatches: ['#a68966', '#fffdf8', '#fbf8f1'], depth: 'light' },
  { key: 'rainforest-jade', label: '雨林青玉', swatches: ['#94b69c', '#1f4337', '#0f211a'], depth: 'dark' },
  { key: 'terracotta-sunset', label: '赤陶夕照', swatches: ['#713729', '#e2ab8f', '#c98264'], depth: 'mid' },
  { key: 'indigo-tides', label: '海鹽靛藍', swatches: ['#9fb6cc', '#223347', '#101925'], depth: 'dark' },
  { key: 'orchid-dusk', label: '蘭霧夜宴', swatches: ['#4d354c', '#c1a9bd', '#947c91'], depth: 'mid' },
] as const

/**
 * 後台「頁面風格」切換的總開關（2026-08-18 Gini 指示關閉）。
 *
 * 目前八個主題裡只有 bali-stone 真的做完並驗過；其餘七個尚未逐頁實作，
 * 職人選下去會拿到半成品版面。在其餘主題完成並經核准之前，
 * **後台不提供切換**——分頁隱藏，API 也一併 fail-closed（只擋 UI 不擋 API 等於沒擋）。
 *
 * 刻意保留的：`?previewTheme=` 預覽（我們自己審新主題要用）、
 * 既有主題資料與整套 token 系統。要重新開放就把這個常數改成 true。
 */
export const PROVIDER_THEME_PICKER_ENABLED = false

const PROVIDER_THEME_SET = new Set<string>(PROVIDER_THEME_KEYS)

export function isProviderThemeKey(value: unknown): value is ProviderThemeKey {
  return typeof value === 'string' && PROVIDER_THEME_SET.has(value)
}

export function normalizeProviderTheme(value: unknown): ProviderThemeKey {
  const candidate = typeof value === 'string' ? value.trim() : ''
  return isProviderThemeKey(candidate)
    ? (candidate as ProviderThemeKey)
    : DEFAULT_PROVIDER_THEME
}

export function providerThemeFromRow(row: readonly unknown[]): ProviderThemeKey {
  return normalizeProviderTheme(row[PROVIDER_THEME_COLUMN_INDEX])
}

// DDL 尚未執行時，讀跟寫拿到的錯誤碼「不一樣」——2026-08-17 打真實 Supabase 實測：
//   select → 42703    "column providers.theme does not exist"        （Postgres 原生碼）
//   update → PGRST204 "Could not find the 'theme' column ... schema cache" （PostgREST 碼）
// 只認 42703 的話，寫入會掉到 generic 500，而不是預期的 503 theme_storage_unavailable。
const MISSING_COLUMN_CODES = new Set(['42703', 'PGRST204'])

export function isMissingProviderThemeColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const candidate = error as { code?: unknown; message?: unknown }
  const code = typeof candidate.code === 'string' ? candidate.code : ''
  const message = typeof candidate.message === 'string' ? candidate.message : ''
  return MISSING_COLUMN_CODES.has(code) && /(?:providers\.)?theme|theme.*column|column.*theme/i.test(message)
}

export function resolveProviderTheme(
  savedTheme: unknown,
  previewTheme: unknown,
): ProviderThemeKey {
  const previewCandidate = typeof previewTheme === 'string' ? previewTheme.trim() : ''
  if (isProviderThemeKey(previewCandidate)) return previewCandidate
  return normalizeProviderTheme(savedTheme)
}
