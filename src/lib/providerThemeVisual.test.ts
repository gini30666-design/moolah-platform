import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PROVIDER_THEME_KEYS, PROVIDER_THEME_OPTIONS } from './providerTheme'

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
const providerHomeSource = readFileSync(new URL('../app/[providerId]/ProviderProfileClient.tsx', import.meta.url), 'utf8')
const bookingSource = readFileSync(new URL('../app/[providerId]/book/page.tsx', import.meta.url), 'utf8')

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

const pageRegionTokens = {
  home: [
    '--theme-home-canvas',
    '--theme-home-ink',
    '--theme-home-profile',
    '--theme-home-profile-ink',
    '--theme-home-gallery',
    '--theme-home-dock',
  ],
  book: [
    '--theme-book-canvas',
    '--theme-book-ink',
    '--theme-book-workbench',
    '--theme-book-panel',
    '--theme-book-slot-stage',
    '--theme-book-slot-ink',
    '--theme-book-selection-ink',
    '--theme-book-header',
  ],
  admin: [
    '--theme-admin-canvas',
    '--theme-admin-ink',
    '--theme-admin-header',
    '--theme-admin-workbench',
    '--theme-admin-panel',
    '--theme-admin-field',
  ],
} as const

function recipeTokens(theme: string): Record<string, string> {
  const block = css.match(new RegExp(`\\[data-theme="${theme}"\\] \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? ''
  return Object.fromEntries(
    [...block.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/gi)].map(([, name, value]) => [name, value.trim()]),
  )
}

function scopedAliasTokens(): Record<string, string> {
  const block = css.match(/\[data-theme\] \{([\s\S]*?)\n\}/)?.[1] ?? ''
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

  it('rebinds every legacy theme alias on the data-theme scope', () => {
    const tokens = scopedAliasTokens()
    expect(tokens['--charcoal']).toBe('var(--theme-ink)')
    expect(tokens['--cream']).toBe('var(--theme-canvas)')
    expect(tokens['--oak']).toBe('var(--theme-accent)')
    expect(tokens['--oak-light']).toBe('var(--theme-accent-light)')
    expect(tokens['--oak-pale']).toBe('var(--theme-accent-pale)')
    expect(tokens['--oak-dim']).toBe('var(--theme-accent-dim)')
    expect(tokens['--oak-40']).toBe('rgba(var(--theme-accent-rgb-legacy),0.40)')
    expect(tokens['--sand']).toBe('var(--theme-surface)')
    expect(tokens['--sand-deep']).toBe('var(--theme-surface-deep)')
    expect(tokens['--border']).toBe('var(--theme-border)')
    expect(tokens['--glass-bg']).toBe('rgba(var(--theme-background-rgb-legacy),0.10)')
    expect(tokens['--glass-border']).toBe('rgba(var(--theme-accent-rgb-legacy),0.22)')
  })

  it('aliases every page region to the existing semantic recipe by default', () => {
    const tokens = scopedAliasTokens()
    const expected = {
      '--theme-home-canvas': 'var(--theme-canvas)',
      '--theme-home-ink': 'var(--theme-ink)',
      '--theme-home-profile': 'var(--theme-surface)',
      '--theme-home-profile-ink': 'var(--theme-ink)',
      '--theme-home-gallery': 'var(--theme-canvas)',
      '--theme-home-dock': 'var(--theme-panel-elevated)',
      '--theme-book-canvas': 'var(--theme-canvas)',
      '--theme-book-ink': 'var(--theme-ink)',
      '--theme-book-workbench': 'var(--theme-surface)',
      '--theme-book-panel': 'var(--theme-panel)',
      '--theme-book-slot-stage': 'var(--theme-surface)',
      '--theme-book-slot-ink': 'var(--theme-ink)',
      '--theme-book-selection-ink': 'var(--theme-canvas)',
      '--theme-book-header': 'var(--theme-header)',
      '--theme-admin-canvas': 'var(--theme-canvas)',
      '--theme-admin-ink': 'var(--theme-ink)',
      '--theme-admin-header': 'var(--theme-header)',
      '--theme-admin-workbench': 'var(--theme-surface)',
      '--theme-admin-panel': 'var(--theme-panel)',
      '--theme-admin-field': 'var(--theme-field)',
    }

    for (const token of Object.values(pageRegionTokens).flat()) {
      expect(tokens[token], token).toBe(expected[token as keyof typeof expected])
    }
  })

  it('gives Bali Stone distinct, readable page-region surfaces', () => {
    const tokens = recipeTokens('bali-stone')

    for (const token of Object.values(pageRegionTokens).flat()) {
      expect(tokens[token], token).toMatch(/^#[0-9a-f]{6}$/i)
    }

    const pairs = [
      ['--theme-home-profile-ink', '--theme-home-profile'],
      ['--theme-book-slot-ink', '--theme-book-slot-stage'],
      ['--theme-header-ink', '--theme-admin-header'],
      ['--theme-home-ink', '--theme-home-gallery'],
      ['--theme-book-ink', '--theme-book-workbench'],
      ['--theme-book-ink', '--theme-book-panel'],
      ['--theme-admin-ink', '--theme-admin-panel'],
      ['--theme-admin-ink', '--theme-admin-field'],
    ] as const

    for (const [foreground, background] of pairs) {
      expect(
        contrast(tokens[foreground], tokens[background]),
        `bali-stone: ${foreground} on ${background}`,
      ).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('keeps the provider home behavior inside seven stable visual regions', () => {
    const regions = [
      'home-shell',
      'home-hero',
      'home-dock',
      'home-profile',
      'home-gallery',
      'home-closing',
      'home-sticky-cta',
    ]

    for (const region of regions) {
      expect(
        providerHomeSource.match(new RegExp(`data-theme-region=["']${region}["']`, 'g')),
        region,
      ).toHaveLength(1)
    }

    for (const behaviorMarker of [
      'onClick={handleBook}',
      'https://instagram.com/',
      'setLightbox(i)',
      '<ProviderReveal',
    ]) {
      expect(providerHomeSource, behaviorMarker).toContain(behaviorMarker)
    }
  })

  it('keeps the booking state machine inside eight stable visual regions', () => {
    const regions = [
      'book-shell',
      'book-header',
      'book-service-summary',
      'book-service-picker',
      'book-calendar',
      'book-slot-stage',
      'book-customer',
      'book-sticky-cta',
    ]

    for (const region of regions) {
      expect(
        bookingSource.match(new RegExp(`data-theme-region=["']${region}["']`, 'g')),
        region,
      ).toHaveLength(1)
    }

    expect(bookingSource).toMatch(/<details[^>]*data-theme-region="book-service-picker"/)
    expect(bookingSource).toContain('<summary>更換服務')
    expect(bookingSource).toContain('onClick={() => setService(s)}')

    for (const behaviorMarker of [
      'async function handleSubmit',
      'res.status === 409',
      'customerPhone',
      'provider.isDemo',
      '/privacy',
      '<form onSubmit={handleSubmit}',
    ]) {
      expect(bookingSource, behaviorMarker).toContain(behaviorMarker)
    }
  })
})
