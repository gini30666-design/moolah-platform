# MooLah Reference Layout Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recompose provider home, booking, and admin to match the supplied three-screen information architecture while preserving every data source, link, event, API, and validation behavior.

**Architecture:** Keep the existing page components and state machines; add semantic visual landmarks and reorganize only their JSX presentation. Continue using the shared provider theme shell and tokens, with a light-surface admin recipe. Each page is an independent commit and rollback boundary.

**Tech Stack:** Next.js 16, React 19, TypeScript, inline React styles plus existing CSS theme tokens, Vitest source guards, Codex browser screenshots.

**Spec:** `docs/superpowers/specs/2026-08-17-moolah-reference-layout-redesign.md`

## Global Constraints

- Preserve every existing string source, link target, event handler, fetch call, LIFF branch, form field, validation branch, and API payload.
- Do not add fake reference-image data or inactive share/favorite controls.
- Do not change or bypass LINE authentication.
- Do not mutate any database or execute the pending theme DDL.
- Do not edit `scripts/verify_book_visual.sh` or tag `book-visual-safe-v2`.
- Do not merge, push, or deploy.

---

### Task 1: Add three-page composition guards

**Files:**
- Modify: `src/lib/providerThemeDataPath.test.ts`

**Interfaces:**
- Consumes: source of `ProviderProfileClient.tsx`, `book/page.tsx`, and `admin/page.tsx`.
- Produces: regression assertions for `data-layout="provider-home"`, `data-layout="booking-flow"`, and `data-layout="provider-admin-light"`, plus existing handler fingerprints.

- [ ] **Step 1: Write failing source-structure assertions**

```ts
expect(providerProfile).toContain('data-layout="provider-home"')
expect(bookingPage).toContain('data-layout="booking-flow"')
expect(adminPage).toContain('data-layout="provider-admin-light"')
expect(providerProfile).toContain('onClick={handleBook}')
expect(bookingPage).toContain("fetch('/api/booking'")
expect(adminPage).toContain('authHeader()')
```

- [ ] **Step 2: Run focused test and verify RED**

Run `npx vitest run src/lib/providerThemeDataPath.test.ts`; expect failure only for the three missing `data-layout` landmarks.

- [ ] **Step 3: Commit only after each page independently makes its own landmark green**

The test remains the shared acceptance gate; production edits occur in Tasks 2–4.

---

### Task 2: Recompose provider homepage

**Files:**
- Modify: `src/app/[providerId]/ProviderProfileClient.tsx`
- Modify: `src/app/globals.css` only for reusable layout selectors and reduced-motion behavior.

**Interfaces:**
- Consumes: existing provider, services, portfolio, `nextAvail`, `fromPrice`, `handleBook`, Lightbox, theme tokens.
- Produces: root `data-layout="provider-home"` and semantic hero/profile/gallery/booking-dock groups.

- [ ] **Step 1: Add only the homepage landmark and grouping JSX**

Move existing rendered expressions without changing them. Do not change `handleBook`, fetch effects, `COPY`, `specialties`, or Lightbox props.

- [ ] **Step 2: Apply image-led hero and light profile styling**

Use `coverUrl` as the background image, `--theme-hero-overlay` for readability, and existing surface tokens for the profile section. Keep no-cover fallback and 44px controls.

- [ ] **Step 3: Verify focused test GREEN**

Run `npx vitest run src/lib/providerThemeDataPath.test.ts`, `npx tsc --noEmit`, and `node scripts/check_theme_hardcodes.mjs`.

- [ ] **Step 4: Capture 390 and 1440 screenshots for `moolah-gold` and one chromatic theme**

Check long name wrapping, cover crop, no horizontal overflow, fixed CTA safe area, and portfolio visibility.

- [ ] **Step 5: Run untouched guard and commit**

```bash
bash scripts/verify_book_visual.sh
git add 'src/app/[providerId]/ProviderProfileClient.tsx' src/app/globals.css src/lib/providerThemeDataPath.test.ts
git commit -m "feat(layout): recompose provider profile home"
```

---

### Task 3: Recompose booking flow presentation

**Files:**
- Modify: `src/app/[providerId]/book/page.tsx`

**Interfaces:**
- Consumes: all existing booking state, date/slot components, LINE panels, form controls, `handleSubmit`.
- Produces: root `data-layout="booking-flow"`, light header, compact service/date/slot panels, unchanged form semantics.

- [ ] **Step 1: Make booking landmark assertion GREEN with the minimal root attribute**

Add the attribute to the actual loaded booking root, not loaders or completion screens.

- [ ] **Step 2: Recompose existing blocks in the reference order**

Keep component invocations and handler props verbatim. Change only wrappers and inline style values to theme background/surface/border tokens.

- [ ] **Step 3: Verify behavioral fingerprints before styling further**

Run `bash scripts/verify_book_visual.sh`; `authHeader`, LIFF, LineRequiredScreen, DemoCompletionScreen, phone, required, privacy, `/api/booking`, `/api/availability`, `res.ok`, and 409 counts must remain green.

- [ ] **Step 4: Validate mobile flow states**

Capture initial service/date screen and inspect step 2/3 states where reachable without bypassing LINE. Check sticky CTA does not obscure privacy text or fields.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/[providerId]/book/page.tsx' src/lib/providerThemeDataPath.test.ts
git commit -m "feat(layout): recompose booking flow"
```

---

### Task 4: Convert admin to light operational layout

**Files:**
- Modify: `src/app/[providerId]/admin/page.tsx`
- Modify: `src/app/[providerId]/admin/ScheduleView.tsx`
- Modify: `src/app/[providerId]/admin/PortfolioView.tsx`
- Modify: `src/components/ThemePickerPanel.tsx`
- Modify: `src/app/globals.css` for light admin surface tokens only if existing tokens are insufficient.

**Interfaces:**
- Consumes: all current admin data, navigation, callbacks, modal components, theme picker.
- Produces: `data-layout="provider-admin-light"` and a light-surface dashboard across every subview.

- [ ] **Step 1: Make admin landmark assertion GREEN at the authorized main root**

Do not change loading, load-error, or unauthorized branching.

- [ ] **Step 2: Convert shell and summary to light surfaces**

Use `--theme-background`, `--theme-surface`, `--theme-border`, and accent tokens. Keep status/error/LINE colors semantic.

- [ ] **Step 3: Convert navigation and subviews**

Keep the existing `MainView` values, click handlers, fetch callbacks, schedule form events, portfolio upload/delete events, and theme save API calls unchanged.

- [ ] **Step 4: Run scanner and full regression**

Run `node scripts/check_theme_hardcodes.mjs`, `npm test`, `npx tsc --noEmit`, then the untouched guard.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/[providerId]/admin/page.tsx' \
  'src/app/[providerId]/admin/ScheduleView.tsx' \
  'src/app/[providerId]/admin/PortfolioView.tsx' \
  src/components/ThemePickerPanel.tsx src/app/globals.css \
  src/lib/providerThemeDataPath.test.ts
git commit -m "feat(layout): redesign admin with light surfaces"
```

---

### Task 5: Full visual and safety verification

**Files:**
- Evidence only: `/Users/gini/Documents/Codex/2026-08-15/new-chat/outputs/moolah-reference-layout/`

**Interfaces:**
- Produces: 48 local screenshots and a final verification report; no production mutation.

- [ ] **Step 1: Run all automated gates**

```bash
npm test
npx tsc --noEmit
node scripts/check_theme_hardcodes.mjs
bash scripts/verify_book_visual.sh
```

- [ ] **Step 2: Confirm protected assets are unchanged**

```bash
git diff --exit-code main..HEAD -- scripts/verify_book_visual.sh
git show-ref --tags book-visual-safe-v2
```

- [ ] **Step 3: Capture the 8 × 3 × 2 matrix**

Use the local production build, set viewport 390×844 and 1440×1000, force scroll top before each screenshot, and never click save or bypass auth.

- [ ] **Step 4: Inspect accessibility and responsive failures**

Check horizontal overflow, clipped controls, 44px primary targets, text contrast, long names, no-cover/no-portfolio states, fixed CTA overlap, reduced motion, and theme distinction.

- [ ] **Step 5: Stop before database or deployment**

Report the pending nullable `providers.theme` DDL separately and request explicit approval again before any database operation.

