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

export type ProviderThemeOption = Readonly<{
  key: ProviderThemeKey
  label: string
  swatches: readonly [string, string, string]
}>

export const PROVIDER_THEME_OPTIONS: readonly ProviderThemeOption[] = [
  { key: 'bali-stone', label: '峇里石境', swatches: ['#8b765d', '#d8ccbb', '#f3eee6'] },
  { key: 'ubud-slow', label: '烏布慢居', swatches: ['#68725a', '#bdac8c', '#f1ede3'] },
  { key: 'quiet-luxury', label: '靜奢度假', swatches: ['#8d795d', '#c9bca8', '#f7f4ee'] },
  { key: 'moolah-gold', label: 'MooLah 原生金', swatches: ['#a68966', '#d9c5b2', '#fbf9f4'] },
  { key: 'rainforest-jade', label: '雨林青玉', swatches: ['#477064', '#99afa2', '#edf2ee'] },
  { key: 'terracotta-sunset', label: '赤陶夕照', swatches: ['#b36f55', '#d8aa8e', '#faf0e8'] },
  { key: 'indigo-tides', label: '海鹽靛藍', swatches: ['#53677b', '#a8b8c3', '#edf2f3'] },
  { key: 'orchid-dusk', label: '蘭霧夜宴', swatches: ['#765f75', '#b7a0b3', '#f3edf2'] },
] as const

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
