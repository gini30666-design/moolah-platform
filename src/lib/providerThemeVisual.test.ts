import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PROVIDER_THEME_KEYS, PROVIDER_THEME_OPTIONS } from './providerTheme'

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')

const requiredTokens = [
  '--theme-canvas',
  '--theme-canvas-rgb-legacy',
  '--theme-surface',
  '--theme-surface-deep',
  '--theme-panel',
  '--theme-panel-rgb-legacy',
  '--theme-panel-elevated',
  '--theme-field',
  '--theme-ink',
  '--theme-ink-rgb-legacy',
  '--theme-muted',
  '--theme-border',
  '--theme-on-image',
  '--theme-on-image-rgb-legacy',
  '--theme-on-accent',
  '--theme-header',
  '--theme-header-rgb-legacy',
  '--theme-header-ink',
  '--theme-card-radius',
  '--theme-card-shadow',
  '--theme-image-filter',
] as const

function recipeTokens(theme: string): Record<string, string> {
  const block = css.match(new RegExp(`\\[data-theme="${theme}"\\] \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? ''
  return Object.fromEntries(
    [...block.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/gi)].map(([, name, value]) => [name, value.trim()]),
  )
}

function channelToLinear(channel: number): number {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!match) throw new Error(`Expected six-digit hex, received ${hex}`)
  const [, red, green, blue] = match
  return 0.2126 * channelToLinear(parseInt(red, 16))
    + 0.7152 * channelToLinear(parseInt(green, 16))
    + 0.0722 * channelToLinear(parseInt(blue, 16))
}

function contrast(first: string, second: string): number {
  const lighter = Math.max(luminance(first), luminance(second))
  const darker = Math.min(luminance(first), luminance(second))
  return (lighter + 0.05) / (darker + 0.05)
}

describe('provider visual recipe contract', () => {
  it('defines exactly two light, three mid and three dark themes', () => {
    const expectedDepth = {
      'moolah-gold': 'light',
      'quiet-luxury': 'light',
      'ubud-slow': 'mid',
      'terracotta-sunset': 'mid',
      'orchid-dusk': 'mid',
      'bali-stone': 'dark',
      'rainforest-jade': 'dark',
      'indigo-tides': 'dark',
    }

    expect(Object.fromEntries(PROVIDER_THEME_OPTIONS.map(option => [option.key, option.depth]))).toEqual(expectedDepth)
    expect(PROVIDER_THEME_OPTIONS.reduce<Record<string, number>>((counts, option) => {
      counts[option.depth] = (counts[option.depth] ?? 0) + 1
      return counts
    }, {})).toEqual({ light: 2, mid: 3, dark: 3 })
  })

  it.each(PROVIDER_THEME_KEYS)('%s provides every semantic visual role', theme => {
    const tokens = recipeTokens(theme)
    expect(Object.keys(tokens).length, `${theme} recipe exists`).toBeGreaterThan(0)
    for (const token of requiredTokens) {
      expect(tokens[token], `${theme} ${token}`).toBeTruthy()
    }
    for (const token of [
      '--theme-canvas', '--theme-surface', '--theme-surface-deep', '--theme-panel',
      '--theme-panel-elevated', '--theme-field', '--theme-ink', '--theme-muted',
      '--theme-border', '--theme-on-image', '--theme-on-accent', '--theme-header',
      '--theme-header-ink',
    ]) {
      expect(tokens[token], `${theme} ${token}`).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it.each(PROVIDER_THEME_OPTIONS)('$key has the promised canvas depth', option => {
    const canvasLuminance = luminance(recipeTokens(option.key)['--theme-canvas'])
    if (option.depth === 'light') expect(canvasLuminance).toBeGreaterThanOrEqual(0.75)
    if (option.depth === 'mid') expect(canvasLuminance).toBeGreaterThanOrEqual(0.18)
    if (option.depth === 'mid') expect(canvasLuminance).toBeLessThan(0.48)
    if (option.depth === 'dark') expect(canvasLuminance).toBeLessThan(0.035)
  })

  it.each(PROVIDER_THEME_KEYS)('%s keeps text readable on every owned surface', theme => {
    const tokens = recipeTokens(theme)
    const pairs = [
      ['--theme-ink', '--theme-canvas'],
      ['--theme-ink', '--theme-panel'],
      ['--theme-ink', '--theme-field'],
      ['--theme-header-ink', '--theme-header'],
      ['--theme-on-accent', '--theme-accent-strong'],
    ] as const

    for (const [foreground, background] of pairs) {
      expect(
        contrast(tokens[foreground], tokens[background]),
        `${theme}: ${foreground} on ${background}`,
      ).toBeGreaterThanOrEqual(4.5)
    }
  })
})
