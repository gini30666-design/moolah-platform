# MooLah Bold Theme Depth System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing eight provider themes into two light, three immersive mid-tone, and three dark art directions across provider home, booking, and admin without changing business behavior.

**Architecture:** Keep the current React trees, provider theme whitelist, and persistence path. Expand the CSS theme contract into semantic canvas/surface/panel/field/ink/header/on-image tokens, then replace page-owned neutral literals with those roles; add a LIFF-aware preview opener while preserving real anchor fallbacks.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS custom properties, Vitest, LIFF SDK, Node hardcode scanner, local production screenshots.

**Spec:** `docs/superpowers/specs/2026-08-17-moolah-bold-theme-depth-system-design.md`

## Global Constraints

- Do not edit `scripts/verify_book_visual.sh`, its logic fingerprints, or rollback tags.
- Do not modify booking handlers, fetch URLs/options, validation, 409 handling, LIFF identity, owner authorization, provider AA/index 26, or cover permissions.
- Do not execute Supabase DDL, UPDATE, INSERT, DELETE, merge, push, or deployment.
- Keep LINE green, error red, booking statuses, and image-overlay colors semantic rather than converting them blindly.
- All behavioral production changes follow RED → observed expected failure → GREEN → focused regression.
- Preserve one functional DOM per page; theme keys never enter event handlers or API payloads beyond the existing theme save/preview paths.
- Use the approved distribution: light `moolah-gold`, `quiet-luxury`; mid `ubud-slow`, `terracotta-sunset`, `orchid-dusk`; dark `bali-stone`, `rainforest-jade`, `indigo-tides`.

---

### Task 1: Lock the 2/3/3 visual contract and implement eight semantic recipes

**Files:**
- Create: `src/lib/providerThemeVisual.test.ts`
- Modify: `src/lib/providerTheme.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces `ProviderThemeDepth = 'light' | 'mid' | 'dark'` and `depth` on each `ProviderThemeOption`.
- Produces, for every theme, `--theme-canvas`, `--theme-canvas-rgb-legacy`, `--theme-surface`, `--theme-surface-deep`, `--theme-panel`, `--theme-panel-rgb-legacy`, `--theme-panel-elevated`, `--theme-field`, `--theme-ink`, `--theme-ink-rgb-legacy`, `--theme-muted`, `--theme-border`, `--theme-on-image`, `--theme-on-image-rgb-legacy`, `--theme-on-accent`, `--theme-header`, `--theme-header-rgb-legacy`, `--theme-header-ink`, `--theme-card-radius`, `--theme-card-shadow`, and `--theme-image-filter`.

- [ ] **Step 1: Write the failing recipe-contract test**

Parse the actual CSS recipe blocks and assert literal, independently listed requirements:

```ts
const expectedDepth = {
  'moolah-gold': 'light', 'quiet-luxury': 'light',
  'ubud-slow': 'mid', 'terracotta-sunset': 'mid', 'orchid-dusk': 'mid',
  'bali-stone': 'dark', 'rainforest-jade': 'dark', 'indigo-tides': 'dark',
} as const

expect(Object.fromEntries(PROVIDER_THEME_OPTIONS.map(o => [o.key, o.depth]))).toEqual(expectedDepth)
expect(recipeTokens(theme)).toEqual(expect.objectContaining({
  '--theme-canvas': expect.stringMatching(/^#[0-9a-f]{6}$/i),
  '--theme-panel': expect.stringMatching(/^#[0-9a-f]{6}$/i),
  '--theme-field': expect.stringMatching(/^#[0-9a-f]{6}$/i),
  '--theme-ink': expect.stringMatching(/^#[0-9a-f]{6}$/i),
  '--theme-header': expect.stringMatching(/^#[0-9a-f]{6}$/i),
  '--theme-on-image': expect.stringMatching(/^#[0-9a-f]{6}$/i),
}))
```

Assert exact depth counts `{ light: 2, mid: 3, dark: 3 }`. Hand-calculate WCAG contrast from parsed hex values and require ink/canvas, ink/panel, ink/field, header-ink/header, on-accent/accent-strong ≥ 4.5.

- [ ] **Step 2: Run RED**

Run `npx vitest run src/lib/providerThemeVisual.test.ts`; expect failure because `depth` and the new semantic tokens are absent.

- [ ] **Step 3: Add the minimal metadata contract**

Add `depth` to `ProviderThemeOption` and assign the eight approved literal values. Update picker swatches so the third swatch reflects the actual canvas rather than the old near-white palette.

- [ ] **Step 4: Implement the eight complete CSS recipes**

Use these art-direction anchors:

```text
moolah-gold       canvas #fbf8f1  panel #fffdf8  ink #2c2825  header #f2e6d7
quiet-luxury      canvas #ece8df  panel #f8f5ee  ink #262521  header #d8d0c2
ubud-slow         canvas #8f9780  panel #c6ccb7  ink #20261f  header #3d493b
terracotta-sunset canvas #c98264  panel #e2ab8f  ink #2f1d18  header #7c3f31
orchid-dusk       canvas #947c91  panel #c1a9bd  ink #271f28  header #50394f
bali-stone        canvas #171612  panel #302b24  ink #f4eee3  header #211e19
rainforest-jade   canvas #0f211a  panel #1f4337  ink #eef5ed  header #122a22
indigo-tides      canvas #101925  panel #223347  ink #eff3f4  header #152335
```

Derive surface, field, border, muted, header ink, button text and RGB companions per recipe. Set legacy aliases `--theme-background`, `--cream`, `--charcoal`, `--sand`, and `--sand-deep` to semantic roles so unchanged consumers inherit the correct scheme.

- [ ] **Step 5: Run GREEN and focused regressions**

Run `npx vitest run src/lib/providerThemeVisual.test.ts src/lib/providerTheme.test.ts`; expect both files green and exactly 2/3/3 depths.

- [ ] **Step 6: Commit the recipe contract**

```bash
git add src/lib/providerThemeVisual.test.ts src/lib/providerTheme.ts src/app/globals.css
git commit -m "feat(theme): define bold light mid and dark recipes"
```

---

### Task 2: Theme every booking state without touching booking behavior

**Files:**
- Modify: `src/lib/providerThemeDataPath.test.ts`
- Modify: `src/app/[providerId]/book/page.tsx`
- Modify: `src/components/AvailabilityCalendar.tsx`

**Interfaces:**
- Consumes Task 1 semantic tokens.
- Produces themed normal flow, LINE gate, demo completion, booking completion, service/date/slot panels, fields, sticky header and CTA.

- [ ] **Step 1: Write the failing booking visual safety assertions**

Read the booking and calendar source and assert the previous lock cannot return:

```ts
expect(bookPage).not.toMatch(/const cream\s*=\s*['"]#FBF9F4['"]/)
expect(bookPage).toContain("background: 'var(--theme-canvas)'")
expect(bookPage).toContain("background: 'var(--theme-panel)'")
expect(bookPage).toContain("color: 'var(--theme-ink)'")
expect(calendar).toContain('var(--theme-field)')
```

Retain the existing source fingerprints for `handleSubmit`, `/api/booking`, `/api/availability`, `res.ok`, 409, phone, required, privacy, `LineRequiredScreen`, and `DemoCompletionScreen`.

- [ ] **Step 2: Run RED**

Run `npx vitest run src/lib/providerThemeDataPath.test.ts`; expect only the new semantic visual assertions to fail.

- [ ] **Step 3: Replace the two confirmed locked backgrounds first**

Change only gate/completion visual constants: canvas → `var(--theme-canvas)`, ink → `var(--theme-ink)`, panel → `var(--theme-panel)`, muted → `var(--theme-muted)`, preserving all copy, hrefs and callbacks.

- [ ] **Step 4: Semanticize booking neutral surfaces**

Replace page-owned `rgba(44,40,37,...)`, white panels/fields, fixed `#FBF9F4`, and neutral shadows with semantic tokens. Keep image-overlay white, LINE green, status colors and error red in their functional roles. Add scoped booking classes only when an inline style cannot express focus/placeholder/disabled states.

- [ ] **Step 5: Theme AvailabilityCalendar**

Use field/panel/ink/muted/border tokens for day cells, weekday labels and legends. Preserve date calculations, disabled logic, selected callbacks and availability status colors byte-for-byte.

- [ ] **Step 6: Verify GREEN and untouched logic guard**

Run the focused test, `npx tsc --noEmit`, then `bash scripts/verify_book_visual.sh`. Any fingerprint count change stops this task.

- [ ] **Step 7: Commit booking presentation**

```bash
git add src/lib/providerThemeDataPath.test.ts 'src/app/[providerId]/book/page.tsx' src/components/AvailabilityCalendar.tsx
git commit -m "fix(theme): carry visual recipes through booking states"
```

---

### Task 3: Carry the same art direction through provider home and admin

**Files:**
- Modify: `src/lib/providerThemeDataPath.test.ts`
- Modify: `src/app/[providerId]/ProviderProfileClient.tsx`
- Modify: `src/app/[providerId]/admin/page.tsx`
- Modify: `src/app/[providerId]/admin/ScheduleView.tsx`
- Modify: `src/app/[providerId]/admin/PortfolioView.tsx`
- Modify: `src/components/ThemePickerPanel.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes Task 1 tokens and current `data-theme` shell.
- Produces full-theme home hero/filter/dock/content and full-theme admin header/summary/tabs/forms/modals without theme-dependent functional markup.

- [ ] **Step 1: Write failing cross-page semantic assertions**

Require provider home and all admin view sources to use `--theme-panel`, `--theme-field`, `--theme-ink`, and `--theme-muted`; require the admin root to stop identifying itself as permanently light by changing the visual-only landmark to `data-layout="provider-admin"` while keeping `MainView` and handler fingerprints.

- [ ] **Step 2: Run RED**

Run `npx vitest run src/lib/providerThemeDataPath.test.ts`; expect failures for the new cross-page contract only.

- [ ] **Step 3: Theme provider home**

Apply `--theme-image-filter` to cover/gallery imagery, keep `--theme-hero-overlay`, replace neutral profile/gallery/dock surfaces with semantic tokens, and use on-image tokens only over imagery. Do not change `handleBook`, router calls, Lightbox, provider fields or portfolio order.

- [ ] **Step 4: Theme admin shell and operational surfaces**

Make the header an intentional theme carrier using header/header-ink tokens. Convert summary, tabs, data cards, inputs, empty states and modal panels in admin, schedule and portfolio to surface/panel/field/ink/muted tokens. Keep booking status green/yellow/red semantic and preserve every handler/API call.

- [ ] **Step 5: Theme the picker itself**

Cards use each option's actual swatches and automatically choose readable preview text from `depth`. The containing panel uses the selected theme's semantic tokens; save button uses on-accent, while save messages keep success/error semantics.

- [ ] **Step 6: Verify GREEN and commit**

Run focused tests, `npx tsc --noEmit`, `node scripts/check_theme_hardcodes.mjs`, and the untouched guard. Then:

```bash
git add src/lib/providerThemeDataPath.test.ts src/app/globals.css \
  'src/app/[providerId]/ProviderProfileClient.tsx' \
  'src/app/[providerId]/admin/page.tsx' \
  'src/app/[providerId]/admin/ScheduleView.tsx' \
  'src/app/[providerId]/admin/PortfolioView.tsx' src/components/ThemePickerPanel.tsx
git commit -m "feat(theme): immerse home and admin in selected art direction"
```

---

### Task 4: Make preview links reliable inside LIFF with browser fallback

**Files:**
- Modify: `src/lib/providerThemeAdmin.test.ts`
- Modify: `src/lib/providerThemeAdmin.ts`
- Modify: `src/components/ThemePickerPanel.tsx`

**Interfaces:**
- Produces `absoluteProviderThemePreviewUrl(href: string, origin: string): string`.
- The anchor remains a real `href`; LIFF-only click interception opens `external:false`, then `window.open`, then same-window navigation when popup opening is unavailable.

- [ ] **Step 1: Write failing URL behavior tests**

```ts
expect(absoluteProviderThemePreviewUrl('/designer/book?previewTheme=bali-stone', 'https://moolah.app')).toBe(
  'https://moolah.app/designer/book?previewTheme=bali-stone',
)
expect(() => absoluteProviderThemePreviewUrl('javascript:alert(1)', 'https://moolah.app')).toThrow()
```

- [ ] **Step 2: Run RED**

Run `npx vitest run src/lib/providerThemeAdmin.test.ts`; expect missing export failure.

- [ ] **Step 3: Implement URL normalization and LIFF click behavior**

Allow only same-origin `http:`/`https:` results. In `ThemePickerPanel`, do nothing on click outside LIFF so the native anchor opens normally. Inside LIFF call `preventDefault()`, then `liff.openWindow({ url, external: false })`; on exception try `window.open`, and if it returns null use `window.location.assign(url)`.

- [ ] **Step 4: Verify GREEN and commit**

Run the focused test, TypeScript, and untouched guard; then commit the three exact files with `fix(theme): open previews through LIFF safely`.

---

### Task 5: Expand the hardcode guard without false positives

**Files:**
- Create: `src/lib/themeHardcodeScanner.test.ts`
- Modify: `scripts/check_theme_hardcodes.mjs`

**Interfaces:**
- Scanner accepts optional CLI file paths for isolated fixture tests; without arguments it scans the production target list.
- It reports managed canvas/surface/panel/field/ink literals while allowing LINE green, error/status colors and explicitly documented image overlay neutrals.

- [ ] **Step 1: Write failing executable scanner tests**

Create temporary fixture files during the test and spawn the actual script. A fixture containing `background:'#FBF9F4'`, `background:'white'`, and `color:'rgba(44,40,37,.6)'` must exit 1 with three file/line findings; a fixture containing `#06C755`, `#b04040`, and a named image overlay declaration must exit 0.

- [ ] **Step 2: Run RED**

Run `npx vitest run src/lib/themeHardcodeScanner.test.ts`; expect failure because CLI targets and the expanded literal families do not exist.

- [ ] **Step 3: Implement precise managed literal families**

Add case-insensitive old canvas/surface hexes, neutral ink RGBA, neutral white panels/fields, and their labels. The scanner should ignore a line only when it contains `theme-hardcode-allow: image-overlay` and a documented on-image use; no file-wide exclusions.

- [ ] **Step 4: Clean remaining managed literals with semantic tokens**

Run the production scanner and replace only reported page-owned theme neutrals. Do not weaken patterns or add allow comments to make a page panel green.

- [ ] **Step 5: Verify GREEN and commit**

Run scanner tests, production scanner, TypeScript, full Vitest and untouched guard; commit scanner, test, and only the exact visual files it forced to semantic tokens.

---

### Task 6: Produce the eight-theme visual matrix and final safety evidence

**Files:**
- Evidence only: `/Users/gini/Documents/Codex/2026-08-15/new-chat/outputs/moolah-bold-themes/`
- Create: `/Users/gini/Documents/Codex/2026-08-15/new-chat/outputs/給阿東_八主題深度改造_檢查包.md`

**Interfaces:**
- Produces representative contact sheets plus 48 route/viewport screenshots and a code review handoff; no deployment or database mutation.

- [ ] **Step 1: Run all automated gates from clean HEAD**

```bash
npm test
npx tsc --noEmit
npm run build
node scripts/check_theme_hardcodes.mjs
bash scripts/verify_book_visual.sh
git diff --exit-code theme-rollback-v1 -- scripts/verify_book_visual.sh
```

- [ ] **Step 2: Start the local production build and capture 48 combinations**

For each whitelist theme, capture provider home, booking and authorized admin at 390×844 and 1440×1000 using `previewTheme`. Never click save and never use a real Supabase write. If admin requires the documented temporary local QA bypass, restore it in the same session and require zero auth/proxy diff before proceeding.

- [ ] **Step 3: Inspect every screenshot**

Reject horizontal overflow, CTA overlap, white islands in mid/dark themes, unreadable input/placeholder/focus/disabled/error states, clipped long provider names, missing cover fallback, incorrect selected state, and a theme that cannot be distinguished in the first viewport.

- [ ] **Step 4: Produce Gini-facing comparison sheets**

Create one mobile contact sheet per page with all eight themes labeled in approved light/mid/dark order. Do not use AI-generated replacement UI; these must be screenshots from the real code.

- [ ] **Step 5: Re-run full gates after any visual adjustment**

Only report pass counts and build status from this fresh run. Record commit range, protected-file diff, pending DDL status and manual LIFF checks in the handoff document.

- [ ] **Step 6: Stop before deployment**

No merge, push, Vercel deployment, theme DDL or database write. Present the images and handoff to Gini for visual choice and 阿東 review.
