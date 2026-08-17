#!/usr/bin/env node

import { readFile } from 'node:fs/promises'

const TARGET_FILES = [
  'src/app/[providerId]/ProviderProfileClient.tsx',
  'src/app/[providerId]/book/page.tsx',
  'src/app/[providerId]/admin/page.tsx',
  'src/app/[providerId]/admin/ScheduleView.tsx',
  'src/app/[providerId]/admin/PortfolioView.tsx',
  'src/components/AvailabilityCalendar.tsx',
  'src/components/ThemePickerPanel.tsx',
]

const MANAGED_LITERALS = [
  { label: '#A68966', pattern: /#a68966/gi },
  { label: '#8a6f4f', pattern: /#8a6f4f/gi },
  { label: '#c4845a', pattern: /#c4845a/gi },
  { label: 'rgba(166,137,102,...)', pattern: /rgba\(\s*166\s*,\s*137\s*,\s*102\s*,/gi },
  { label: 'rgba(196,132,90,...)', pattern: /rgba\(\s*196\s*,\s*132\s*,\s*90\s*,/gi },
  { label: 'legacy canvas #FBF9F4', pattern: /background(?:Color)?\s*:\s*['"`]#fbf9f4['"`]/gi },
  { label: 'fixed white surface', pattern: /background(?:Color)?\s*:\s*['"`](?:#fff(?:fff)?|white)['"`]/gi },
  { label: 'fixed white translucent surface', pattern: /background(?:Color)?\s*:\s*['"`]rgba\(\s*255\s*,\s*255\s*,\s*255\s*,/gi },
  { label: 'fixed neutral ink', pattern: /color\s*:\s*['"`]rgba\(\s*44\s*,\s*40\s*,\s*37\s*,/gi },
  { label: 'legacy neutral #7d736b', pattern: /#7d736b/gi },
  { label: 'legacy neutral #574e48', pattern: /#574e48/gi },
  { label: 'legacy neutral #8a7e76', pattern: /#8a7e76/gi },
  { label: 'legacy neutral #c8c0b8', pattern: /#c8c0b8/gi },
  { label: 'legacy neutral #4e453f', pattern: /#4e453f/gi },
  { label: 'legacy neutral #d0c8c0', pattern: /#d0c8c0/gi },
]

let failed = false
const requestedFiles = process.argv.slice(2)
const files = requestedFiles.length > 0 ? requestedFiles : TARGET_FILES

for (const file of files) {
  const source = await readFile(file, 'utf8')
  const lines = source.split('\n')

  for (const { label, pattern } of MANAGED_LITERALS) {
    for (const [index, line] of lines.entries()) {
      if (line.includes('theme-hardcode-allow: image-overlay')) continue
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
