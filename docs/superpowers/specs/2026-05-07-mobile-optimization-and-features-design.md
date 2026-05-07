# PIIcasso — Mobile Optimization + Feature Roadmap Design
**Date:** 2026-05-07
**Scope:** Full mobile responsive pass, production deployment, and prioritized feature backlog

---

## Overview

Two deliverables in this spec:

1. **Mobile optimization** — full sweep of all broken/poor mobile experiences, plus a hybrid bottom tab bar on dashboards
2. **Feature roadmap** — catalogued ideas across UX/polish, Security mode, and User mode, tagged by effort

Production deployment happens after mobile fixes are committed — a single clean push to `main` triggers auto-deploy on both Vercel (frontend) and Render (backend).

---

## Part 1 — Mobile Optimization

### Approach

Option C (full sweep + hybrid nav):
- Fix all 2 BROKEN + 3 POOR items
- Add a bottom tab bar on Security and User dashboards (mobile only)
- Standard hamburger drawer on the marketing/landing nav
- History table becomes a card stack on mobile
- Globe gets a mobile-sized container + touch events

### Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| Mobile | `< 640px` | Bottom tab bar, hamburger nav, card tables |
| Tablet | `640px – 1023px` | Sidebar collapses, no bottom bar |
| Desktop | `≥ 1024px` | Full sidebar, no bottom bar |

---

### 1.1 DesignAppShell (`src/components/design/dashboard/DesignAppShell.jsx`)

**Problem:** The mobile top bar exists in JSX but has `display:none` with no media query to activate it. The sidebar is always `240px` — takes up half the screen on phones.

**Fix:** Inject a `<style>` block inside the component (or add to `index.css`) with:

```css
@media (max-width: 639px) {
  .dsh-mobile-bar { display: flex !important; }
  .dsh-sidebar    { display: none !important; }
  .dsh-grid       { grid-template-columns: 1fr !important; }
}
```

Also add `padding-bottom: 57px` to the main content area on mobile so content doesn't hide behind the bottom tab bar.

---

### 1.2 MobileTabBar — New Component (`src/components/design/dashboard/MobileTabBar.jsx`)

**Purpose:** Fixed bottom navigation bar, visible only on `< 640px`. Reads `mode` from `ModeContext` and `activeKey` prop to highlight the current tab.

**Security mode tabs:**

| Key | Label | Icon | Path |
|---|---|---|---|
| `mission` | MISSIONS | ◈ | `/security/dashboard` |
| `wordlists` | WORDLISTS | ≡ | `/workspace` |
| `intel` | INTEL | ◉ | `/darkweb` |
| `targets` | TARGETS | ◎ | `/operation` |
| `more` | MORE | ⋯ | (opens drawer with Audit if superuser) |

**User mode tabs:**

| Key | Label | Icon | Path |
|---|---|---|---|
| `overview` | HOME | ◈ | `/user/dashboard` |
| `passwords` | PASSWORDS | ≡ | `/user/history` |
| `leaks` | LEAKS | ◉ | `/darkweb` |
| `learn` | LEARN | ☉ | `/user/learn` |

**Styling:**
- `position: fixed; bottom: 0; left: 0; right: 0; z-index: 100`
- Height: `49px` + `env(safe-area-inset-bottom)` for iOS notch
- Background: `var(--ink-0)`, border-top: `1px solid var(--ink-4)`
- Active tab: accent color (`var(--accent-500)`), others: `var(--fg-3)`
- Min touch target: `44px × 44px` per tab

**Integration:** Add `<MobileTabBar activeKey={activeKey} />` at the bottom of `DesignAppShell` return, outside the grid.

---

### 1.3 MarketingNav (`src/components/design/MarketingNav.jsx`)

**Problem:** No hamburger. All nav links render in a horizontal row that overflows and clips below `768px`.

**Fix:**
- Add `isMobileMenuOpen` state (`useState(false)`)
- Add `useEffect` to close menu on route change
- On `< 768px` (Tailwind `md:`): hide the `<nav>` links, show a hamburger button (3-line icon using `<span>` divs or Lucide `Menu`/`X` icons)
- Clicking hamburger toggles a `framer-motion` `AnimatePresence` slide-down drawer:
  - Full-width, `position: fixed`, below the top bar
  - Contains: section label "NAVIGATION", stacked link buttons, divider, Log in (outline) + Get started (filled) CTA buttons
  - Closes on link click or outside tap

**Layout on mobile (top bar):** Logo left — ModePill compact center-right — Hamburger far right.

---

### 1.4 AnalysisHistoryPage (`src/pages/AnalysisHistoryPage.js` or similar)

**Problem:** Multi-column table overflows horizontally on narrow screens. Expanded vulnerability rows don't adapt.

**Fix:** Use existing `useResponsive` hook.

- `isMobile === true` → render card stack instead of `<table>`
- Each card: date badge + score badge + vulnerability count + chevron
- Tap card → expands inline to show vulnerability list + recommendations (same data, different layout)
- `isMobile === false` → existing table unchanged

No backend changes needed.

---

### 1.5 GlobalMap (`src/components/GlobalMap.js`)

**Problem:** Globe renders at a fixed size. No touch optimization. Can be slow on low-end Android.

**Fix:**
- Wrap the globe in a container `div` with `useResponsive`
- On mobile: set container height to `min(50vw, 280px)` — fits in the viewport without dominating
- Pass `enablePointerInteraction={true}` explicitly (touch pan + pinch zoom)
- Add a `ResizeObserver` on the container to call `globe.current.width(container.offsetWidth)` on resize
- On mobile, reduce `pointsData` render resolution (set `pointAltitude` to a smaller value) to improve frame rate

---

## Part 2 — Production Deployment

### Setup

- **Frontend:** Vercel (`pii-casso.vercel.app`) — auto-deploys on push to `main`
- **Backend:** Render (`core-engine-woeg.onrender.com`) — auto-deploys on push to `main`

### Process

1. Implement all mobile fixes (Part 1)
2. Commit all changes with a single descriptive commit message
3. `git push origin main`
4. Vercel picks up the frontend build automatically (~2 min)
5. Render picks up the backend Docker build automatically (~5–8 min)

### Pre-push checklist

- [ ] `ensure_admin.py` uncommitted change included in commit
- [ ] `npm run build` passes locally (`CI=false` is already set in `package.json`)
- [ ] No console errors on the three key pages: Landing, Security Dashboard, User Dashboard

---

## Part 3 — Feature Roadmap

### Quick Wins (1–3 hours each)

| Feature | Area | Description |
|---|---|---|
| Onboarding tour | UX | First-login overlay highlighting key features and explaining two modes |
| Toast consolidation | UX | Unify all error/success messages to use existing Radix Toast component |
| Empty states | UX | Helpful illustration + CTA on empty History, Missions, Wordlists pages |
| Export wordlists (.txt/.csv) | Security | Download button on wordlist results — essential for pentesting use |
| Target risk score badge | Security | Computed 0–100 risk score on each target card (red/amber/green) |
| Email breach check (HIBP) | User | Enter email → instant check against HaveIBeenPwned API |
| Password strength history chart | User | Line chart of score over time using Chart.js (already in project) |

### Medium (0.5–1 day each)

| Feature | Area | Description |
|---|---|---|
| Dark/light mode toggle | UX | Light theme CSS variable set + toggle in settings (darkMode: ["class"] already configured) |
| Keyboard shortcut layer | UX | `⌘K` command palette, `G+D` go-to-dashboard, `G+S` switch mode |
| Operation PDF report export | Security | Structured PDF for completed operation — summary, wordlists, findings, timeline |
| Real-time breach feed | Security | Stream recent breach events into Dark Web intel page via HIBP or similar API |
| PII scanner for pasted text | User | Paste any text → highlight PII using existing `piiEngine.js` — needs UI only |
| Weekly privacy digest email | User | Celery beat job: weekly breach + score summary email to each user |

### Big (multi-day)

| Feature | Area | Description |
|---|---|---|
| Team / workspace collaboration | Security | Shared operations, shared wordlists, role-based access (owner/analyst/viewer) |
| Privacy score dashboard widget | User | Composite 0–100 score: breach exposure + password strength + PII risk + recency |

---

## Implementation Order

1. Mobile optimization (Part 1) — all 5 fixes + `MobileTabBar`
2. Commit + push to production (Part 2)
3. Quick win features in the next sprint (Part 3, starting with HIBP + empty states + wordlist export)

---

## Files Changed (Mobile Optimization)

| File | Change type |
|---|---|
| `src/components/design/dashboard/DesignAppShell.jsx` | Add CSS media queries, inject `MobileTabBar` |
| `src/components/design/dashboard/MobileTabBar.jsx` | **New file** — bottom tab bar component |
| `src/components/design/MarketingNav.jsx` | Add hamburger state + animated drawer |
| `src/pages/AnalysisHistoryPage.js` | Mobile card view using `useResponsive` |
| `src/components/GlobalMap.js` | Mobile size cap + touch events + resize observer |
