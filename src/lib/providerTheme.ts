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

export function resolveProviderTheme(
  savedTheme: unknown,
  previewTheme: unknown,
): ProviderThemeKey {
  const previewCandidate = typeof previewTheme === 'string' ? previewTheme.trim() : ''
  if (isProviderThemeKey(previewCandidate)) return previewCandidate
  return normalizeProviderTheme(savedTheme)
}
