import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  DEFAULT_PROVIDER_THEME,
  isMissingProviderThemeColumn,
  normalizeProviderTheme,
  providerThemeFromRow,
  PROVIDER_THEME_KEYS,
  PROVIDER_THEME_OPTIONS,
  resolveProviderTheme,
} from './providerTheme'

describe('normalizeProviderTheme', () => {
  it.each(PROVIDER_THEME_KEYS)('preserves allowed theme %s', theme => {
    expect(normalizeProviderTheme(theme)).toBe(theme)
  })

  it.each([null, undefined, '', 'gold', '\" style=\"color:red'])(
    'falls back for invalid value %s',
    value => {
      expect(normalizeProviderTheme(value)).toBe(DEFAULT_PROVIDER_THEME)
    },
  )
})

describe('provider theme metadata', () => {
  it('defines one safe display option per allowed theme', () => {
    expect(PROVIDER_THEME_OPTIONS).toHaveLength(PROVIDER_THEME_KEYS.length)
    expect(PROVIDER_THEME_OPTIONS.map(option => option.key)).toEqual(PROVIDER_THEME_KEYS)

    for (const option of PROVIDER_THEME_OPTIONS) {
      expect(option.label).not.toBe('')
      expect(option.swatches).toHaveLength(3)
      expect(option.swatches.every(swatch => /^#[0-9a-f]{6}$/i.test(swatch))).toBe(true)
    }
  })

  it('gives every visual recipe its own dark editorial tone', () => {
    const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')

    for (const theme of PROVIDER_THEME_KEYS) {
      const block = css.match(new RegExp(`\\[data-theme="${theme}"\\] \\{([\\s\\S]*?)\\n\\}`))?.[1]
      expect(block, `${theme} CSS recipe`).toBeTruthy()
      expect(block, `${theme} dark tone`).toContain('--charcoal-deep:')
    }
  })
})

describe('resolveProviderTheme', () => {
  it('lets an allowed preview override the saved theme', () => {
    expect(resolveProviderTheme('ubud-slow', 'indigo-tides')).toBe('indigo-tides')
  })

  it('keeps the saved theme when preview is invalid', () => {
    expect(resolveProviderTheme('ubud-slow', 'bad')).toBe('ubud-slow')
    expect(resolveProviderTheme('orchid-dusk', '\" style=\"color:red')).toBe('orchid-dusk')
  })

  it('falls back to the default when neither value is allowed', () => {
    expect(resolveProviderTheme(null, null)).toBe(DEFAULT_PROVIDER_THEME)
  })
})

describe('providerThemeFromRow', () => {
  it('reads providers.theme from AA without shifting A:Z', () => {
    const row = Array.from({ length: 27 }, (_, index) => `column-${index}`)
    row[25] = 'space'
    row[26] = 'rainforest-jade'

    expect(providerThemeFromRow(row)).toBe('rainforest-jade')
    expect(row[25]).toBe('space')
  })

  it('uses the default for legacy 26-column rows', () => {
    expect(providerThemeFromRow(Array(26).fill(''))).toBe(DEFAULT_PROVIDER_THEME)
  })
})

// 2026-08-17：DDL 未執行時，讀寫拿到的錯誤碼不同（真實 Supabase 實測）
describe('缺 theme 欄位的兩種錯誤碼', () => {
  it('select 的 42703 要認得', () => {
    expect(isMissingProviderThemeColumn({
      code: '42703', message: 'column providers.theme does not exist',
    })).toBe(true)
  })
  it('update 的 PGRST204 也要認得（原本會漏，掉成 500）', () => {
    expect(isMissingProviderThemeColumn({
      code: 'PGRST204',
      message: "Could not find the 'theme' column of 'providers' in the schema cache",
    })).toBe(true)
  })
  it('別的欄位缺失不可誤判成 theme', () => {
    expect(isMissingProviderThemeColumn({
      code: 'PGRST204', message: "Could not find the 'plan' column of 'providers' in the schema cache",
    })).toBe(false)
  })
  it('其他錯誤碼一律 false（不可吞掉真的失敗）', () => {
    expect(isMissingProviderThemeColumn({ code: '23505', message: 'duplicate key theme' })).toBe(false)
    expect(isMissingProviderThemeColumn(null)).toBe(false)
  })
})
