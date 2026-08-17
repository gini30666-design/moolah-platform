import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { afterEach, describe, expect, it } from 'vitest'

const created: string[] = []
const scanner = resolve(process.cwd(), 'scripts/check_theme_hardcodes.mjs')

function fixture(source: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'moolah-theme-scanner-'))
  created.push(dir)
  const file = join(dir, 'fixture.tsx')
  writeFileSync(file, source)
  return file
}

function runScanner(file: string) {
  return spawnSync(process.execPath, [scanner, file], { encoding: 'utf8' })
}

afterEach(() => {
  for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('provider theme hardcode scanner', () => {
  it('reports old canvas, white panel, and neutral ink literals with line evidence', () => {
    const file = fixture([
      "const canvas = { background: '#FBF9F4' }",
      "const panel = { background: 'white' }",
      "const copy = { color: 'rgba(44,40,37,.6)' }",
    ].join('\n'))

    const result = runScanner(file)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain(`${file}:1: managed theme literal legacy canvas #FBF9F4`)
    expect(result.stderr).toContain(`${file}:2: managed theme literal fixed white surface`)
    expect(result.stderr).toContain(`${file}:3: managed theme literal fixed neutral ink`)
  })

  it('allows functional status colors and a documented image overlay', () => {
    const file = fixture([
      "const line = { background: '#06C755' }",
      "const error = { color: '#b04040' }",
      "const overlay = { background: 'rgba(10,8,7,0.94)' } // theme-hardcode-allow: image-overlay",
    ].join('\n'))

    const result = runScanner(file)

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('No managed provider-theme literals found.')
  })
})
