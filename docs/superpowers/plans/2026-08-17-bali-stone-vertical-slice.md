# MooLah Bali Stone Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Rebuild only `bali-stone` so the provider home, booking flow, and admin feel like one Bali spa environment with distinct spatial compositions, while preserving all existing data, links, handlers, authorization, and booking behavior.

**Architecture:** Keep `ProviderThemeShell` and the existing functional DOM. Add page-region semantic CSS variables that default to the current shared theme roles for all themes, then override only the Bali Stone region roles. Mark existing functional regions with stable class/data hooks and style those hooks from `globals.css`; no theme branching enters API or mutation logic.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS custom properties, Vitest, existing shell scripts, in-app browser visual verification.

**Spec:** `docs/superpowers/specs/2026-08-17-bali-stone-vertical-slice-design.md`

## Global Constraints

- Do not edit `scripts/verify_book_visual.sh`.
- Do not change booking, LINE/LIFF, admin auth, Supabase, provider column mappings, cover permissions, or API request logic.
- Do not run DDL or any Supabase `UPDATE` / `INSERT` / `DELETE`.
- Do not merge, push, deploy, or move tags.
- Use `apply_patch` for source edits and commit each green checkpoint.
- Preserve the current rendering of the other seven themes by aliasing every new region token to the existing semantic token by default.
- A screenshot is not accepted until text contrast and horizontal overflow are checked in the live DOM.

---

## Task 1: Lock the Bali region-token contract

**Files:**

- Modify: `src/lib/providerThemeVisual.test.ts`
- Modify: `src/app/globals.css`

**Step 1: Write the failing test**

Extend `providerThemeVisual.test.ts` with three explicit region token groups:

```ts
const pageRegionTokens = {
  home: ['--theme-home-canvas', '--theme-home-profile', '--theme-home-profile-ink', '--theme-home-gallery', '--theme-home-dock'],
  book: ['--theme-book-canvas', '--theme-book-workbench', '--theme-book-panel', '--theme-book-slot-stage', '--theme-book-slot-ink', '--theme-book-header'],
  admin: ['--theme-admin-canvas', '--theme-admin-header', '--theme-admin-workbench', '--theme-admin-panel', '--theme-admin-field'],
} as const
```

Assert that the shared `[data-theme]` block defines all region roles, that the Bali recipe owns six-digit colors for all of them, and that these Bali pairs are at least `4.5:1`:

- `--theme-home-profile-ink` on `--theme-home-profile`
- `--theme-book-slot-ink` on `--theme-book-slot-stage`
- `--theme-header-ink` on `--theme-admin-header`
- `--theme-ink` on `--theme-book-workbench`
- `--theme-ink` on `--theme-admin-panel`

**Step 2: Run the focused test to verify RED**

Run:

```bash
npx vitest run src/lib/providerThemeVisual.test.ts
```

Expected: failure naming missing `--theme-home-*`, `--theme-book-*`, and `--theme-admin-*` roles.

**Step 3: Implement the minimal region recipes**

In the shared `[data-theme]` block of `globals.css`, alias every new role to the existing theme roles. In `[data-theme="bali-stone"]`, add a restrained limestone/ivory/charred-wood/aged-gold palette:

- home canvas/gallery/dock: warm limestone and ivory
- home profile: charred wood with ivory ink
- booking canvas/workbench/panel: limestone and ivory
- booking header/slot stage: charred wood with ivory ink
- admin canvas/workbench/panel/field: warm light work surfaces
- admin header: charred wood

Do not replace the base Bali semantic tokens yet; the page hooks introduced later consume the region roles.

**Step 4: Run the focused test to verify GREEN**

Run:

```bash
npx vitest run src/lib/providerThemeVisual.test.ts
```

Expected: all provider visual recipe tests pass.

**Step 5: Commit**

```bash
git add src/app/globals.css src/lib/providerThemeVisual.test.ts
git commit -m "feat(theme): define Bali Stone page regions"
```

---

## Task 2: Recompose the provider home as a Bali spa sequence

**Files:**

- Modify: `src/app/[providerId]/ProviderProfileClient.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/lib/providerThemeVisual.test.ts`

**Step 1: Write the failing structural contract**

Add a source-backed test that reads `ProviderProfileClient.tsx` and requires these stable hooks exactly once:

```text
data-theme-region="home-shell"
data-theme-region="home-hero"
data-theme-region="home-dock"
data-theme-region="home-profile"
data-theme-region="home-gallery"
data-theme-region="home-closing"
data-theme-region="home-sticky-cta"
```

The test also asserts that the existing `handleBook`, Instagram link, portfolio lightbox, and `ProviderReveal` markers remain present.

**Step 2: Run the focused test to verify RED**

Run:

```bash
npx vitest run src/lib/providerThemeVisual.test.ts
```

Expected: missing home region hooks.

**Step 3: Add region hooks without changing behavior**

In `ProviderProfileClient.tsx`, annotate the existing root, hero, availability dock, profile section, portfolio section, closing section, and fixed CTA. Replace only their surface/text/border expressions with page-region variables where necessary. Preserve all content order, event callbacks, conditionals, URLs, and data expressions.

**Step 4: Build the Bali-only visual composition**

In `globals.css`, scope all new styling under:

```css
[data-theme="bali-stone"] [data-layout="provider-home"] { ... }
```

Implement:

- warm stone page canvas rather than black full-page canvas
- full-bleed image hero with readable warm overlay
- ivory stone availability dock overlapping the hero
- charred-wood profile stage with ivory name/body and aged-gold details
- bright limestone gallery with restrained square/10px corners
- dark wood closing and sticky CTA with readable ivory text
- low-opacity mineral grain and leaf-shadow pseudo-elements below content with `pointer-events:none`
- desktop centered presentation without changing mobile max-width behavior

Avoid generic gradients, excessive pill shapes, and equal-radius cards.

**Step 5: Verify home contract and compile**

Run:

```bash
npx vitest run src/lib/providerThemeVisual.test.ts
npx tsc --noEmit
```

Expected: tests and TypeScript pass.

**Step 6: Commit**

```bash
git add 'src/app/[providerId]/ProviderProfileClient.tsx' src/app/globals.css src/lib/providerThemeVisual.test.ts
git commit -m "feat(theme): recompose Bali Stone provider home"
```

---

## Task 3: Recompose booking while preserving the booking state machine

**Files:**

- Modify: `src/app/[providerId]/book/page.tsx`
- Modify: `src/components/AvailabilityCalendar.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/lib/providerThemeVisual.test.ts`
- Test: existing booking tests and `src/lib/providerThemeVisual.test.ts`

**Step 1: Write failing structural and behavior-preservation tests**

Require these booking hooks:

```text
data-theme-region="book-shell"
data-theme-region="book-header"
data-theme-region="book-service-summary"
data-theme-region="book-service-picker"
data-theme-region="book-calendar"
data-theme-region="book-slot-stage"
data-theme-region="book-customer"
data-theme-region="book-sticky-cta"
```

Require that the service picker uses a native `<details>` with a visible `summary` labelled `更換服務`, while the option buttons still call `setService(s)`. Keep assertions for `handleSubmit`, `customerPhone`, `409`, required/privacy, and demo-no-write markers so presentation edits cannot erase protected logic.

**Step 2: Run the focused test to verify RED**

Run:

```bash
npx vitest run src/lib/providerThemeVisual.test.ts src/app/[providerId]/book/*.test.ts
```

Expected: missing region hooks and collapsed service picker contract.

**Step 3: Add the booking regions and native disclosure**

Annotate the existing shell, sticky header, summary, service picker, calendar/time chapter, slot stage, customer chapter, and fixed submit bar. Wrap the existing service option list in `<details>`/`<summary>` only when `allServices.length > 1`; preserve the same `visibleServices`, `showAllServices`, and `setService(s)` logic. Do not add an alternate service state or mutate the submit sequence.

**Step 4: Build the Bali-only task composition**

Under `[data-theme="bali-stone"] [data-layout="booking-flow"]` implement:

- charred-wood header and progress with ivory labels and aged-gold active state
- light LINE/service summary workbench
- understated service disclosure so the date reaches the first task viewport
- ivory calendar stage with selected date in dark wood plus gold border
- distinct charred-wood slot stage with all labels and slots using `--theme-book-slot-ink`
- light customer form with readable labels/placeholders/disabled states
- dark CTA with visible enabled and disabled treatments

Use existing component state classes/data attributes; if `AvailabilityCalendar` lacks a region hook, add only a marker/class and no behavior branch.

**Step 5: Verify booking behavior and compile**

Run:

```bash
npx vitest run src/lib/providerThemeVisual.test.ts src/app/[providerId]/book/*.test.ts
npx tsc --noEmit
```

Expected: focused tests and TypeScript pass; no booking test snapshots or protected strings are updated to hide a regression.

**Step 6: Commit**

```bash
git add 'src/app/[providerId]/book/page.tsx' src/components/AvailabilityCalendar.tsx src/app/globals.css src/lib/providerThemeVisual.test.ts
git commit -m "feat(theme): stage Bali Stone booking flow"
```

---

## Task 4: Turn the admin into a light stone workbench with a dark branded frame

**Files:**

- Modify: `src/app/[providerId]/admin/page.tsx`
- Modify: `src/app/[providerId]/admin/ScheduleView.tsx`
- Modify: `src/app/[providerId]/admin/PortfolioView.tsx`
- Modify: `src/components/ThemePickerPanel.tsx`
- Modify: `src/app/globals.css`
- Modify: `scripts/check_theme_hardcodes.mjs`
- Modify: `src/lib/themeHardcodeScanner.test.ts`
- Modify: `src/lib/providerThemeVisual.test.ts`

**Step 1: Write failing scanner and region tests**

Extend the scanner fixture with the known theme-owned legacy neutrals:

```text
#7d736b #574e48 #8a7e76 #c8c0b8 #4e453f #d0c8c0
```

Assert line evidence for each. Extend the structural test to require:

```text
data-theme-region="admin-shell"
data-theme-region="admin-header"
data-theme-region="admin-kpis"
data-theme-region="admin-workbench"
data-theme-region="admin-tabs"
data-theme-region="admin-footer"
```

Add a negative assertion that the former `borderLeft: \`3px solid` side-tab recipe no longer exists.

**Step 2: Run the focused tests to verify RED**

Run:

```bash
npx vitest run src/lib/themeHardcodeScanner.test.ts src/lib/providerThemeVisual.test.ts
```

Expected: legacy neutrals are not yet detected and admin hooks are missing.

**Step 3: Extend the scanner without banning functional colors**

Add exact neutral-family patterns only. Preserve documented exceptions for LINE green, error red, booking status colors, and explicitly annotated image overlays. Do not weaken existing rules or add blanket allow comments.

**Step 4: Clean theme-owned neutrals and add admin hooks**

Replace the detected legacy text/border neutrals in `page.tsx`, `ScheduleView.tsx`, `PortfolioView.tsx`, and `ThemePickerPanel.tsx` with semantic tokens. Remove the CreditsPanel one-sided stripe and use a complete border/surface. Add region hooks to the existing shell, header, KPI block, workbench, navigation, and footer; preserve all fetch/mutation handlers, main-view keys, labels, and conditional panels.

**Step 5: Build the Bali-only admin composition**

Under `[data-theme="bali-stone"] [data-layout="provider-admin"]` implement:

- dark branded header with ivory provider name and a visible light menu button
- warm limestone canvas and ivory KPI/workbench panels
- active tabs, primary actions, timeline emphasis, and key metrics using aged gold or dark wood
- 44px minimum interactive targets where existing controls are smaller
- a visible right-edge fade/containment cue for horizontally scrollable tabs
- readable status, disabled, placeholder, and empty-state text

Keep admin operations light; do not make the full tool surface dark.

**Step 6: Run scanner, focused tests, and compile**

Run:

```bash
node scripts/check_theme_hardcodes.mjs
npx vitest run src/lib/themeHardcodeScanner.test.ts src/lib/providerThemeVisual.test.ts
npx tsc --noEmit
```

Expected: scanner reports clean, tests pass, TypeScript passes.

**Step 7: Commit**

```bash
git add 'src/app/[providerId]/admin/page.tsx' 'src/app/[providerId]/admin/ScheduleView.tsx' 'src/app/[providerId]/admin/PortfolioView.tsx' src/components/ThemePickerPanel.tsx src/app/globals.css scripts/check_theme_hardcodes.mjs src/lib/themeHardcodeScanner.test.ts src/lib/providerThemeVisual.test.ts
git commit -m "feat(theme): build Bali Stone admin workbench"
```

---

## Task 5: Run complete gates and capture the real system

**Files:**

- Verify only: `scripts/verify_book_visual.sh`
- Create screenshots in: `/Users/gini/Documents/Codex/2026-08-15/new-chat/outputs/moolah-bali-stone-v2/`

**Step 1: Prove the protected guard script is unchanged**

Run:

```bash
git diff theme-rollback-v1 -- scripts/verify_book_visual.sh
```

Expected: no output.

**Step 2: Run complete automated verification**

Run in this order:

```bash
node scripts/check_theme_hardcodes.mjs
npx vitest run
npx tsc --noEmit
npm run build
bash scripts/verify_book_visual.sh
```

Expected: scanner clean, all Vitest tests pass, TypeScript 0 errors, production build succeeds, and all protected booking fingerprints pass.

**Step 3: Start the clean production server**

Run:

```bash
npm run start -- --hostname 127.0.0.1 --port 3100
```

Use `previewTheme=bali-stone` so no database write is required.

**Step 4: Capture and inspect six screenshots**

Capture home, booking, and admin at `390×844` and `1440×1000`. For each page, check in the live DOM:

- `document.documentElement.scrollWidth === document.documentElement.clientWidth`
- no dark text appears on the dark profile/header/slot stages
- normal, muted, placeholder, inactive, disabled, and status text contrast against the computed background
- all primary controls have at least 44px tap height
- home CTA, booking date/slot/submit, and admin tabs/timeline are visible and usable

If admin requires the established local-only QA bypass, make the temporary edit with `apply_patch`, capture, restore in the same work session, verify the bypass marker has zero matches, and rebuild clean source before continuing.

**Step 5: Create user-facing contact sheet**

Create three mobile screenshots and one three-page contact sheet in the output directory. Do not fabricate a mockup: the deliverables must come from the running application.

**Step 6: Re-run the final safety subset after any screenshot-only bypass restore**

Run:

```bash
rg -n "QA_|bypass|DEV_AUTH" src middleware.ts proxy.ts || true
npx tsc --noEmit
npm run build
bash scripts/verify_book_visual.sh
git status --short
```

Expected: no bypass residue, all gates green, and only intentional tracked changes remain.

**Step 7: Commit final visual audit adjustments, if any**

```bash
git add <intentional-source-files-only>
git commit -m "fix(theme): polish Bali Stone visual audit"
```

Do not commit screenshots into the application repository.
