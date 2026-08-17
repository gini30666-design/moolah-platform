#!/usr/bin/env node

import { readFile } from 'node:fs/promises'

const TARGET_FILES = [
  'src/app/[providerId]/ProviderProfileClient.tsx',
  'src/app/[providerId]/book/page.tsx',
  'src/app/[providerId]/admin/page.tsx',
  'src/app/[providerId]/admin/ScheduleView.tsx',
  'src/app/[providerId]/admin/PortfolioView.tsx',
]

const MANAGED_LITERALS = [
  { label: '#A68966', pattern: /#a68966/gi },
  { label: '#8a6f4f', pattern: /#8a6f4f/gi },
  { label: '#c4845a', pattern: /#c4845a/gi },
  { label: 'rgba(166,137,102,...)', pattern: /rgba\(\s*166\s*,\s*137\s*,\s*102\s*,/gi },
  { label: 'rgba(196,132,90,...)', pattern: /rgba\(\s*196\s*,\s*132\s*,\s*90\s*,/gi },
]

let failed = false

for (const file of TARGET_FILES) {
  const source = await readFile(file, 'utf8')
  const lines = source.split('\n')

  for (const { label, pattern } of MANAGED_LITERALS) {
    for (const [index, line] of lines.entries()) {
      pattern.lastIndex = 0
      if (pattern.test(line)) {
        console.error(`${file}:${index + 1}: managed theme literal ${label}`)
        failed = true
      }
    }
  }
}

if (failed) {
  process.exitCode = 1
} else {
  console.log('No managed provider-theme literals found.')
}
