# MooLah Eight-Theme System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship eight selectable provider themes across the provider homepage, booking page, and admin while preserving all existing business behavior and providing deterministic visual rollback evidence.

**Architecture:** Keep one React tree per existing page and apply a validated `data-theme` key at each page shell. A central TypeScript registry owns the eight-key whitelist and labels; CSS custom properties own the visual recipes; Supabase persists only the whitelist key in `providers.theme` (AA/index 26). Preview query parameters override display without persistence, while the owner-only admin API performs the only theme write.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS custom properties, Vitest, Supabase, LIFF bearer authentication, Codex in-app browser screenshots, Pillow pixel comparison.

**Spec:** `docs/superpowers/specs/2026-08-17-moolah-eight-theme-system-design.md`

## Global Constraints

- Do not edit the logic fingerprints or pass/fail logic in `scripts/verify_book_visual.sh`.
- Do not move, recreate, or delete tag `book-visual-safe-v2`.
- Do not modify booking fetch URLs, request options, `authHeader()`, LIFF flow, `handleSubmit`, 409 handling, `res.ok`, required fields, privacy link, or effect dependencies.
- Keep `#06C755`, `#b04040`, and functional charcoal semantics outside provider theme substitution.
- Every production function follows RED → verify failure → GREEN → verify pass.
- Phase 0 before/after screenshots cover three routes at exact 390 and 1440 content widths; every RGBA diff count must equal 0. Any non-zero result stops execution.
- `providers.theme` is AA/index 26. Supabase schema, `TABLE_COLS.providers`, booking range, and provider API range change together.
- Do not merge, push, deploy production, or mutate the database automatically. Code and DDL drafts may be prepared, but every Supabase DDL or data write requires Gini's explicit approval immediately before execution.

---

### Task 1: Deterministic Phase 0 visual harness and baseline

**Files:**
- Create: `scripts/compare_visual_pixels.py`
- Modify: `.gitignore`
- Evidence only (ignored): `.visual-baseline/theme-phase0/before/*.png`

**Interfaces:**
- Consumes: raw PNG files saved from the Codex Browser skill against a local production server.
- Produces: `compare_visual_pixels.py BEFORE_DIR AFTER_DIR`, exit 0 only when all six PNGs have equal dimensions and zero changed RGBA pixels.

- [ ] **Step 1: Write a failing comparator fixture test**

Create two 2×2 RGBA fixtures under a temporary directory: one identical pair and one pair with exactly one different pixel. Execute the planned comparator before it exists and record the expected command-not-found failure.

- [ ] **Step 2: Implement the minimal pixel comparator**

```python
from pathlib import Path
from PIL import Image

EXPECTED = {
    "home-390.png", "home-1440.png",
    "book-390.png", "book-1440.png",
    "admin-390.png", "admin-1440.png",
}

def changed_pixels(before: Path, after: Path) -> int:
    left = Image.open(before).convert("RGBA")
    right = Image.open(after).convert("RGBA")
    if left.size != right.size:
        raise ValueError(f"size mismatch: {left.size} != {right.size}")
    return sum(a != b for a, b in zip(left.getdata(), right.getdata()))
```

The CLI prints one `filename: diff_pixels=N` line and exits 1 when a file is missing, dimensions differ, or any count is non-zero.

- [ ] **Step 3: Verify comparator RED/GREEN behavior**

Run the one-pixel fixture and expect exit 1 with `diff_pixels=1`; run the identical fixture and expect exit 0 with `diff_pixels=0`.

- [ ] **Step 4: Establish deterministic screenshots without changing production output**

Temporarily append the following to `globals.css`, build, capture, and immediately revert it before committing:

```css
/* phase0 screenshot harness — never commit */
*, *::before, *::after {
  animation: none !important;
  transition: none !important;
  caret-color: transparent !important;
}
```

Use the Browser skill's viewport override, calibrated so the saved PNG content widths are exactly 390 and 1440. Save the `Uint8Array` returned by `tab.screenshot()` directly to disk for `designer-003`, `designer-003/book`, and `designer-003/admin`. Repeat the same build/capture once and require comparator exit 0 before accepting the harness. Do not recompress, resize, or render the screenshots through Markdown before comparison.

- [ ] **Step 5: Save the six accepted `before` images**

Save under `.visual-baseline/theme-phase0/before/`; record SHA-256 for all six in `.visual-baseline/theme-phase0/before.sha256`. Add only `.visual-baseline/` and local screenshot work directories to `.gitignore`, not the images themselves.

- [ ] **Step 6: Run the untouched baseline guard**

Run `bash scripts/verify_book_visual.sh`; expect TypeScript 0 errors, 141 or more tests, all original fingerprint checks green, and Build success.

- [ ] **Step 7: Commit the harness**

```bash
git add .gitignore scripts/compare_visual_pixels.py
git commit -m "test(theme): add deterministic visual pixel guard"
```

---

### Task 2: Theme whitelist and normalization (TDD)

**Files:**
- Create: `src/lib/providerTheme.test.ts`
- Create: `src/lib/providerTheme.ts`

**Interfaces:**
- Produces: `ProviderThemeKey`, `PROVIDER_THEME_KEYS`, `PROVIDER_THEME_OPTIONS`, `DEFAULT_PROVIDER_THEME`, `normalizeProviderTheme(value)`.

- [ ] **Step 1: Write failing behavior tests**

```ts
import { describe, expect, it } from 'vitest'
import { normalizeProviderTheme, PROVIDER_THEME_KEYS } from './providerTheme'

describe('normalizeProviderTheme', () => {
  it.each(PROVIDER_THEME_KEYS)('preserves allowed theme %s', theme => {
    expect(normalizeProviderTheme(theme)).toBe(theme)
  })

  it.each([null, undefined, '', 'gold', '" style="color:red'])('falls back for invalid value %s', value => {
    expect(normalizeProviderTheme(value)).toBe('moolah-gold')
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run `npx vitest run src/lib/providerTheme.test.ts`; expect module-not-found failure.

- [ ] **Step 3: Implement the whitelist**

```ts
export const PROVIDER_THEME_KEYS = [
  'bali-stone', 'ubud-slow', 'quiet-luxury', 'moolah-gold',
  'rainforest-jade', 'terracotta-sunset', 'indigo-tides', 'orchid-dusk',
] as const

export type ProviderThemeKey = typeof PROVIDER_THEME_KEYS[number]
export const DEFAULT_PROVIDER_THEME: ProviderThemeKey = 'moolah-gold'
const THEME_SET = new Set<string>(PROVIDER_THEME_KEYS)

export function normalizeProviderTheme(value: unknown): ProviderThemeKey {
  const candidate = typeof value === 'string' ? value.trim() : ''
  return THEME_SET.has(candidate) ? candidate as ProviderThemeKey : DEFAULT_PROVIDER_THEME
}
```

Add label and three-swatch metadata for all eight keys; metadata contains no CSS supplied by DB.

- [ ] **Step 4: Verify GREEN and full regression**

Run the focused test, then `npm test`; expect all tests green and total test count greater than 141.

- [ ] **Step 5: Commit**

```bash
git add src/lib/providerTheme.ts src/lib/providerTheme.test.ts
git commit -m "feat(theme): define eight safe provider themes"
```

---

### Task 3: Phase 0 semantic color convergence with zero pixel change

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/[providerId]/book/page.tsx`
- Modify: `src/app/[providerId]/admin/page.tsx`
- Modify: `src/app/[providerId]/ProviderProfileClient.tsx`
- Create: `scripts/check_theme_hardcodes.mjs`

**Interfaces:**
- Produces: legacy `--oak*` aliases backed by `--theme-*` variables and an executable hardcode scanner.

- [ ] **Step 1: Write the hardcode scanner expectation and verify RED**

The scanner examines only the three target page files and fails on managed brand literals, including case-insensitive `#A68966`, `#8a6f4f`, `#c4845a`, and `rgba(166,137,102,`. Run it before implementation and record a non-zero exit with file/line evidence.

- [ ] **Step 2: Add default theme tokens without changing computed values**

Add the exact default token values and legacy aliases from the design spec to `:root`. Keep existing charcoal, LINE green, error red, radii, easing, and layout tokens unchanged.

- [ ] **Step 3: Replace managed hardcodes mechanically**

Use:

```css
var(--theme-accent)
var(--theme-accent-strong)
var(--theme-selected)
rgb(var(--theme-accent-rgb) / 0.4)
rgb(var(--theme-selected-rgb) / 0.2)
```

Do not replace semantic LINE, error, success, neutral black/white, or charcoal literals. Do not move JSX or touch event handlers.

- [ ] **Step 4: Run scanner and focused compiler checks**

Run `node scripts/check_theme_hardcodes.mjs` and `npx tsc --noEmit`; expect zero managed literals and zero TS errors.

- [ ] **Step 5: Capture six `after` screenshots under the identical frozen-motion harness**

Reapply the exact uncommitted freeze CSS from Task 1, build, capture, revert the freeze CSS, and run:

```bash
python3 scripts/compare_visual_pixels.py \
  .visual-baseline/theme-phase0/before \
  .visual-baseline/theme-phase0/after
```

Expected: all six lines `diff_pixels=0`, exit 0. Any non-zero result stops the plan and is reported; do not continue to Task 4.

- [ ] **Step 6: Run untouched guard and commit Phase 0**

Run `bash scripts/verify_book_visual.sh`; only after full green:

```bash
git add src/app/globals.css 'src/app/[providerId]/book/page.tsx' \
  'src/app/[providerId]/admin/page.tsx' \
  'src/app/[providerId]/ProviderProfileClient.tsx' scripts/check_theme_hardcodes.mjs
git commit -m "refactor(theme): converge provider brand colors"
```

---

### Task 4: Eight CSS recipes and safe preview selection

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/lib/providerTheme.ts`
- Modify: `src/lib/providerTheme.test.ts`
- Create: `src/components/ProviderThemeShell.tsx`
- Create: `src/components/ProviderThemeShell.test.tsx` only if the current Vitest environment supports React DOM; otherwise test the pure resolver in `providerTheme.test.ts`.

**Interfaces:**
- Consumes: `normalizeProviderTheme`.
- Produces: `resolveProviderTheme(savedTheme, previewTheme)` and `<ProviderThemeShell theme previewTheme>`.

- [ ] **Step 1: Write failing precedence tests**

```ts
expect(resolveProviderTheme('ubud-slow', 'indigo-tides')).toBe('indigo-tides')
expect(resolveProviderTheme('ubud-slow', 'bad')).toBe('ubud-slow')
expect(resolveProviderTheme(null, null)).toBe('moolah-gold')
```

- [ ] **Step 2: Verify RED, implement minimal resolver, verify GREEN**

Only a valid preview overrides a valid saved theme. Unknown values never reach `data-theme`.

- [ ] **Step 3: Add eight CSS recipes**

Each `[data-theme="key"]` assigns the semantic tokens only. Do not change component dimensions, display, order, click targets, or functional charcoal semantics. Add one shared `.provider-theme-shell::before` atmosphere layer controlled by token values; it must be `pointer-events:none` and respect `prefers-reduced-motion`.

- [ ] **Step 4: Run focused tests, scanner, TypeScript, untouched guard**

All must pass before commit.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/lib/providerTheme.ts src/lib/providerTheme.test.ts src/components/ProviderThemeShell.tsx
git commit -m "feat(theme): add eight visual theme recipes"
```

---

### Task 5: AA/index-26 provider data path and owner-only save API (TDD)

**Files:**
- Modify: `src/lib/sheets.ts`
- Modify: `src/lib/providerData.ts`
- Modify: `src/app/api/provider/[id]/route.ts`
- Modify: `src/app/api/booking/route.ts`
- Create: `src/app/api/admin/theme/route.ts`
- Create: `src/lib/providerColumns.test.ts`
- Create: `src/app/api/admin/theme/route.test.ts`
- Modify: `supabase/schema.sql`
- Create: `supabase/migrations/20260817_add_provider_theme.sql`

**Interfaces:**
- Produces: provider API `provider.theme: ProviderThemeKey`; protected `PATCH /api/admin/theme` accepting `{ providerId, theme }`.

- [ ] **Step 1: Write failing AA mapping test**

Export a readonly provider column list from `sheets.ts` without changing `getSheetData` behavior. Assert index 26 is `theme`, length is 27, and the literal row fixture keeps columns 0–25 unchanged.

- [ ] **Step 2: Verify RED and add `theme` to AA**

Append only; never insert before existing columns. Update both `providers!A2:Z` ranges to `providers!A2:AA` in the same commit.

- [ ] **Step 3: Write route RED tests**

Cover 400 invalid key, 401 no token, 403 non-owner, 404 missing provider, and 200 owner update. Mock only LINE token verification and Supabase external IO; assert returned status/payload, not mock existence.

- [ ] **Step 4: Implement protected PATCH route**

Resolve bearer user with `getAuthUserId`; read `line_user_id`; compare owner; normalize only after rejecting invalid input; update only `{ theme }`.

- [ ] **Step 5: Extend public/provider reads**

Add `theme` to `PublicProvider`, direct Supabase select, provider API row mapping `r[26]`, and API response. Booking may read AA without changing any pre-existing index.

- [ ] **Step 6: Add non-destructive SQL**

```sql
alter table public.providers
  add column if not exists theme text;

alter table public.providers
  drop constraint if exists providers_theme_check;

alter table public.providers
  add constraint providers_theme_check
  check (theme is null or theme in (
    'bali-stone','ubud-slow','quiet-luxury','moolah-gold',
    'rainforest-jade','terracotta-sunset','indigo-tides','orchid-dusk'
  ));
```

Update `schema.sql` to match. Do not execute against production in this task.

- [ ] **Step 7: Verify focused tests, full tests, TypeScript, untouched guard, Build**

Expected total test count is greater than the Phase 0 count; all zero failures.

- [ ] **Step 8: Commit all AA-linked files together**

```bash
git add src/lib/sheets.ts src/lib/providerData.ts \
  'src/app/api/provider/[id]/route.ts' src/app/api/booking/route.ts \
  src/app/api/admin/theme/route.ts src/lib/providerColumns.test.ts \
  src/app/api/admin/theme/route.test.ts supabase/schema.sql \
  supabase/migrations/20260817_add_provider_theme.sql
git commit -m "feat(theme): persist provider theme in AA"
```

---

### Task 6: Apply theme shell to all three pages and add preview URLs

**Files:**
- Modify: `src/app/[providerId]/page.tsx`
- Modify: `src/app/[providerId]/ProviderProfileClient.tsx`
- Modify: `src/app/[providerId]/book/page.tsx`
- Modify: `src/app/[providerId]/admin/page.tsx`

**Interfaces:**
- Consumes: saved `provider.theme`, optional `previewTheme` search parameter.
- Produces: validated `data-theme` on each actual page shell.

- [ ] **Step 1: Write resolver behavior test for server/client inputs and verify RED**

Assert a malicious preview never reaches output and valid preview wins without persistence.

- [ ] **Step 2: Pass SSR theme into the public client page**

`ProviderPage` passes `initialTheme={normalizeProviderTheme(p.theme)}`. `ProviderProfileClient` accepts the prop and immediately wraps content with it; it may later reconcile with API data but must not flash gold first.

- [ ] **Step 3: Apply theme after existing loader in booking/admin**

Read theme from the existing provider response and apply only to the presentation shell. Do not edit fetch or LIFF blocks. Parse `previewTheme` with `useSearchParams` through the whitelist resolver.

- [ ] **Step 4: Run full guard suite and manually compare logic fingerprints**

The untouched script must report the same minimum counts; any loss stops.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/[providerId]/page.tsx' 'src/app/[providerId]/ProviderProfileClient.tsx' \
  'src/app/[providerId]/book/page.tsx' 'src/app/[providerId]/admin/page.tsx'
git commit -m "feat(theme): apply provider theme across three pages"
```

---

### Task 7: Admin theme gallery, live preview, and save states

**Files:**
- Create: `src/app/[providerId]/admin/ThemePicker.tsx`
- Modify: `src/app/[providerId]/admin/page.tsx`
- Add focused pure tests to: `src/lib/providerTheme.test.ts`

**Interfaces:**
- Consumes: `PROVIDER_THEME_OPTIONS`, saved theme, `authHeader`, provider id.
- Produces: eight theme cards, dirty state, save action, homepage/booking preview links.

- [ ] **Step 1: Write failing state-transition tests for pure picker reducer**

Test select makes state dirty, successful save updates persisted key, failed save retains dirty selection and error, reset restores persisted key.

- [ ] **Step 2: Implement the pure reducer and verify GREEN**

Keep network IO in the component; reducer only handles deterministic state.

- [ ] **Step 3: Build eight-card selector**

Place in schedule settings. Every card has at least 40px target; save button 44px; selected card has both visual ring and check, not color alone. Preview links include the validated query key.

- [ ] **Step 4: Preserve save failure visibility**

PATCH with existing `authHeader()`. On non-OK response, show inline error and do not update persisted key. Disable duplicate submissions while saving.

- [ ] **Step 5: Run tests, TypeScript, untouched guard, Build and commit**

```bash
git add 'src/app/[providerId]/admin/ThemePicker.tsx' \
  'src/app/[providerId]/admin/page.tsx' src/lib/providerTheme.test.ts
git commit -m "feat(admin): add provider theme gallery"
```

---

### Task 8: Provider homepage image-led hero and quick booking dock

**Files:**
- Modify: `src/app/[providerId]/ProviderProfileClient.tsx`

**Interfaces:**
- Consumes: existing `coverUrl`, `storeName`, district, rating, tagline, `nextAvail`, service minimum price, and unchanged `handleBook`.
- Produces: image hero when cover exists, existing header fallback when absent, quick booking dock calling the existing handler.

- [ ] **Step 1: Write a failing pure view-model test**

Extract `buildProviderHeroModel(provider, services, nextAvail)` and assert: real cover is preserved, no-cover chooses fallback, minimum price is literal minimum, missing rating remains absent, and no fake value is invented.

- [ ] **Step 2: Verify RED, implement the pure model, verify GREEN**

No network or router logic enters the view model.

- [ ] **Step 3: Replace only the current header presentation**

Use the real cover image, overlay store/location/rating/tagline, and quick dock. Retain the existing provider intro, marquee/specialty semantics, portfolio masonry, content-flow CTA, fixed CTA, reveal and lightbox behavior. Keep portfolio images unfiltered.

- [ ] **Step 4: Verify no fake content**

Run test fixtures with missing rating, years, tagline, cover and next availability. The UI must omit or use honest fallback copy.

- [ ] **Step 5: Run all guards and commit**

```bash
git add 'src/app/[providerId]/ProviderProfileClient.tsx' src/lib/providerHero.test.ts src/lib/providerHero.ts
git commit -m "feat(profile): add image-led booking hero"
```

---

### Task 9: Full visual matrix and release evidence

**Files:**
- Evidence only (ignored): `.visual-baseline/themes/<theme>/<route>-<width>.png`
- Modify only if defects are found: files from Tasks 4–8, with a new failing test before each fix.

**Interfaces:**
- Produces: 48 screenshots, contrast report, command logs, and an explicit list of manual-only checks.

- [ ] **Step 1: Build once with fresh network-enabled font fetch**

Run `npm run build`; require exit 0. Start the production server, not dev watcher.

- [ ] **Step 2: Capture 8 × 3 × 2 screenshot matrix**

Use each `previewTheme` URL at calibrated 390 and 1440 widths. Save raw PNGs and SHA-256. Inspect provider homepage, actual booking content, and admin preview content for every theme.

- [ ] **Step 3: Verify accessibility and contrast**

For each recipe, calculate contrast for text/accent on background/surface/dark panel. Require 4.5:1 normal text and 3:1 large text. Adjust recipe tokens only; never change layout or business logic to fix contrast.

- [ ] **Step 4: Run final untouched guard and complete commands fresh**

```bash
bash scripts/verify_book_visual.sh
npm test
npx tsc --noEmit
npm run build
node scripts/check_theme_hardcodes.mjs
```

Record exact pass counts and exits. Do not claim completion from an earlier run.

- [ ] **Step 5: Inspect Git evidence**

Run `git status --short`, `git diff book-visual-safe-v2 --stat`, and a focused diff of every booking logic fingerprint area. Confirm no untracked secrets, generated assets, or baseline PNGs are staged.

- [ ] **Step 6: Hand off for Gini's mandatory real-device checks**

Do not merge/deploy. Provide preview URLs and require Gini to verify demo booking completion, LINE add-friend deep link, privacy round-trip, non-LINE gate, and Lia's long service list. Production Supabase migration and deployment remain separate confirmed actions after this acceptance.

## Plan self-review

- Spec coverage: eight keys, Phase 0 zero-pixel gate, AA/index 26 chain, SSR/no-flash, preview, owner save, homepage hero, safety and rollback are each assigned to a task.
- Placeholder scan: no TBD/TODO/implement-later instructions remain.
- Type consistency: `ProviderThemeKey`, `normalizeProviderTheme`, `resolveProviderTheme`, provider API `theme`, and admin PATCH payload names are stable across tasks.
- Scope: tasks are sequential because each guard depends on the prior verified phase; no independent subsystem is dispatched in parallel.
