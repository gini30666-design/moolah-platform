import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PROVIDER_THEME,
  normalizeProviderTheme,
  PROVIDER_THEME_KEYS,
  PROVIDER_THEME_OPTIONS,
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
})
