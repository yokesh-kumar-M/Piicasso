# PIIcasso UI Overhaul — Design Spec
**Date:** 2026-05-06  
**Status:** Approved  
**Scope:** Batches A–D (Core Layout, Theming, Auth/Landing, Routing). Batches E (Dashboard refactors) and F (CLI) excluded pending permission.

---

## 1. Batch A — Core Layout

### A1 — Logo: Global Visibility & Routing

**Problem:** `Logo.jsx` only renders inside `DesignAppShell`'s sidebar. Auth pages (`LoginPage`, `RegisterPage`, `ForgotPasswordPage`) and `LandingPage` display no logo.

**Fix:** Add `<Logo>` wrapped in a `<Link to="/">` to:
- `AuthShell.jsx` — top-center of the card (above the form, C2 removes the split layout)
- `LandingPage.js` — top-left of the existing header/nav bar

Logo size: increase default `size` prop from `22` to `28` in all header placements. The sidebar instance in `DesignAppShell` already links to `/` via `navigate('/')` — no change needed there.

**Constraints:**
- Do not create a new `GlobalHeader` component. Inject directly into existing layout components.
- Logo must remain a `<Link>` (react-router) not an `<a>` tag to avoid full-page reload.

### A2 — Settings Deduplication

**Problem:** `DesignAppShell` renders `⚙ Settings` twice:
- Sidebar bottom (line ~248) — `navigate('/profile')`
- Topbar right (line ~398) — `navigate('/profile')`

**Fix:** Remove the sidebar bottom `⚙ Settings` button entirely. Keep topbar instance. The topbar is always visible; the sidebar bottom is redundant and clutters the nav.

### A3 — Profile Picture

**Problem:** The user avatar is an initials circle with no photo option.

**Fix:**
- `DesignAppShell` topbar: Replace the initials `<div>` with a `<ProfileAvatar>` component.
- `ProfileAvatar` renders: user's `profile_picture` URL if set, falls back to initials circle.
- `ProfilePage.js`: Add an avatar upload section — a clickable avatar preview that opens a file input (`accept="image/*"`). On change, `POST /user/profile/` with `multipart/form-data` including `profile_picture` field.
- Store avatar URL in `AuthContext.user` so it's available without re-fetch.

**Component location:** `src/components/design/ProfileAvatar.jsx`

### A4 — Copywriting Audit

Replace casual, vague, or "buzz" language with precise professional copy across these files:

| Location | Current | Replace with |
|---|---|---|
| `DesignAppShell` topbar status | `live mission` | `active session` |
| `DesignAppShell` topbar status | `personal vault` | `password vault` |
| `DesignAppShell` topbar user label | `operator` | `analyst` |
| `DesignAppShell` topbar user label | `pro plan` | `standard` |
| `DesignAppShell` mode eyebrow | `● security mode` | `● SECURITY` |
| `DesignAppShell` mode eyebrow | `● user mode` | `● USER` |
| `DesignAppShell` sidebar kbd hint | `⌘ + K to search` | `⌘K search` |
| `LandingPage` | Any occurrences of "game-changing", "supercharge", "next-gen", "powerful" | Replace with function-first descriptions |

Audit rule: if a phrase can be removed without losing meaning, remove it. If a phrase describes a feature, make it a noun phrase (e.g., "Protect your passwords" → "Password protection").

---

## 2. Batch B — Theming & State

### B1 — Mode Toggle Crash (Critical)

Three bugs in the mode switching chain:

**Fix 1 — `DesignAppShell.jsx` line 66:**
```js
// Before
navigate(m === 'security' ? '/dashboard' : '/user/dashboard');
// After
navigate(m === 'security' ? '/security/dashboard' : '/user/dashboard');
```

**Fix 2 — `ModeManager.js` line 38:**
```js
// Before
navigate('/dashboard', { replace: true });
// After
navigate('/security/dashboard', { replace: true });
```

**Fix 3 — `ModeContext.js` — one-time init fetch with `useRef` guard:**
`fetchPreferences` has `mode` as a dependency, so it is recreated on every mode change, causing the `useEffect` to re-fire and potentially revert the mode via a stale API response. Replace with a `useRef`-guarded one-time fetch that only runs on mount.

```js
// Remove the fetchPreferences useCallback and its useEffect entirely.
// Replace with a single mount-only effect:

const hasFetchedPrefs = useRef(false);

useEffect(() => {
  const token = localStorage.getItem('access_token');
  if (!token || hasFetchedPrefs.current) return;
  hasFetchedPrefs.current = true;

  axiosInstance.get('password/preferences/')
    .then(res => {
      const { last_mode } = res.data;
      if (last_mode) setMode(last_mode);
    })
    .catch(() => {}); // silent fail — localStorage default remains
}, []); // runs exactly once on mount
```

This ensures: server preference is applied once on app load, but subsequent `switchMode` calls are never overridden by a stale re-fetch.

### B2 — Color Enforcement (No Cross-Mode Bleed)

**Problem:** Some components use hardcoded hex values or Tailwind color classes (e.g., `blue-500`, `red-500`) that render regardless of mode.

**Audit targets:**
- `Footer.js` (or wherever the footer is defined) — check for hardcoded blue link colors
- `LandingPage.js` — check for any hardcoded brand colors
- `LoginPage.js`, `RegisterPage.js` — form focus rings, button colors

**Rule:** All color values must reference CSS variables:
- Accent/primary action: `var(--accent-500)` (auto-rotates with `data-mode`)
- Text: `var(--fg-0)` through `var(--fg-4)`
- Background: `var(--ink-0)` through `var(--ink-5)`

Replace any Tailwind hardcoded color class (`text-blue-*`, `bg-red-*`, `border-blue-*`) on non-content elements with inline styles using CSS variables or mode-agnostic Tailwind classes.

### B3 — Typography Contrast Between Modes

**Problem:** Font change between modes is imperceptible. Both modes use `Space Grotesk` for body text.

**Design decision:** Both fonts remain professional but must be immediately distinct in feel:
- **Security Mode:** Monospace-first. Body text switches to `'Courier Prime'` (loaded via Google Fonts already or add import). Headers stay `Oswald` uppercase. Feel: terminal, tactical, dense.
- **User Mode:** Humanist sans-serif. Body text stays `'Space Grotesk'`. Headers use `'Inter'` or remain Space Grotesk. Feel: clean, approachable, modern.

**Implementation:**
In `index.css`, add to the `[data-mode="security"]` block:
```css
[data-mode="security"] {
  --font-sans-v3: 'Courier Prime', 'Courier New', monospace;
}
```
Add Google Fonts import for `Courier Prime` if not already present.

**Scope:** This single CSS variable change propagates across all components that use `var(--font-sans-v3)` for body text. No component-level changes needed.

---

## 3. Batch C — Auth & Landing Pages

### C1 — Dynamic Landing Page

**Problem:** `LandingPage` content is static; it doesn't respond to mode state.

**Fix:** Import `ModeContext` in `LandingPage.js`. Branch the hero section, tagline, and feature copy:

| Section | Security Mode | User Mode |
|---|---|---|
| Hero headline | "Penetrate. Enumerate. Exploit." | "Protect. Monitor. Stay Secure." |
| Hero subline | "Offensive security tooling for red teams and security analysts." | "Personal password security and breach monitoring." |
| Feature cards | OSINT, wordlist generation, operation management, threat intel | Password health, breach detection, vault history, leak monitor |
| CTA button | "Launch Operation" → `/login` | "Protect My Passwords" → `/login` |
| Visual accent color | Red (`var(--sec-500)`) | Blue (`var(--usr-500)`) |

The mode state persists via `localStorage`, so returning users see the correct landing version. For new/logged-out users, default to User Mode content (current default).

### C2 — Auth Pages: Simplified UI

**Problem:** `LoginPage` and `RegisterPage` use `AuthShell` (split layout: form left, `AttackVizSide` animation right). The layout is visually complex and slow to parse.

**Fix:** Replace the split layout with a single centered card:
- Remove `AttackVizSide` from auth pages entirely.
- `AuthShell` becomes a centered flex container: `min-h-screen flex items-center justify-center`.
- Card: max-width `420px`, padding `40px`, uses `var(--ink-1)` background with a subtle border.
- Logo at top-center of the card (links to `/`).
- Form below logo. No sidebar, no animation panel.
- Keep `ForgotPasswordPage` consistent with same card layout.

**Removed complexity:**
- No split panels
- No `AttackVizSide` animation on auth pages
- No mode-switcher embedded in login (mode is already persisted; don't force users to select it on login)

### C3 — OAuth Button Redesign

**Problem:** Google OAuth renders as a standard wide rectangular bar (generic, visually heavy).

**Fix:** Replace with a compact, modern treatment:
- A circular or pill button containing only the Google `G` SVG logo (standard Google brand colors: white `G` on `#4285F4` circle, or multicolor `G` on white pill with border).
- Label: `Continue with Google` in small text below or inline, right of the icon.
- On hover: subtle scale-up (`transform: scale(1.05)`) and shadow.
- Separator: a thin `—— or ——` divider between OAuth button and the email/password form.

The `SsoButtons` component wraps the `@react-oauth/google` `GoogleLogin` component. Customize using its `render` prop or wrap it with a custom `useGoogleLogin` hook that fires on button click.

---

## 4. Batch D — Routing Fixes

### D1 — Security Mode Routes

All four Security nav items in `DesignAppShell` already point to correct routes. No changes needed.

### D2 — User Mode Routes

**Leak Monitor redirect loop:**
`ModeManager.js` includes `/darkweb` in `isSecurityPage` — so when a User Mode visitor navigates to `/darkweb` (Leak Monitor), `ModeManager` redirects them back to `/user/dashboard`.

Fix: Remove `/darkweb` and `/inbox` from the `isSecurityPage` array in `ModeManager.js`. These routes are shared between modes. `DarkWebPage` and `InboxPage` already use `DesignAppShell` which renders mode-appropriate nav.

```js
// Before
const isSecurityPage = ['/security/dashboard', '/operation', '/dashboard', '/teams', '/workspace', '/darkweb', '/inbox', '/system-admin'];

// After
const isSecurityPage = ['/security/dashboard', '/operation', '/dashboard', '/teams', '/workspace', '/system-admin'];
```

**Learn → `/api` traps user:**
`ApiDocsPage` is a public page with no `DesignAppShell` wrapper. When a logged-in user navigates to it from the sidebar, they lose the nav shell entirely and have no way back.

Fix: Wrap `ApiDocsPage` in `DesignAppShell` when the user is authenticated. In `App.js`, conditionally wrap:
```jsx
<Route path="/api" element={
  isAuthenticated
    ? <PrivateRoute><DesignAppShellWrappedApiDocs /></PrivateRoute>
    : <ApiDocsPage />
} />
```

Or simpler: modify `ApiDocsPage.js` to detect `isAuthenticated` and render `DesignAppShell` as its layout wrapper, with `activeKey="learn"`.

---

## 5. Excluded from This Spec

| Batch | Items | Status |
|---|---|---|
| E | Security Dashboard grid refactor, User Dashboard overlap fix, Password Checker positioning, Inbox debug | Requires explicit permission |
| F | CLI/Terminal version, SDK wrappers (Python/Go/Ruby), color-coded terminal output | Separate milestone |

---

## 6. File Change Index

| File | Changes |
|---|---|
| `src/context/ModeContext.js` | Fix `fetchPreferences` deps (B1-Fix3) |
| `src/components/ModeManager.js` | Fix navigate route + remove shared routes from isSecurityPage (B1-Fix2, D2) |
| `src/components/design/dashboard/DesignAppShell.jsx` | Fix navigate route, remove sidebar Settings, copywriting, ProfileAvatar (A1, A2, A3, A4, B1-Fix1) |
| `src/components/design/ProfileAvatar.jsx` | New component (A3) |
| `src/components/design/auth/AuthShell.jsx` | Simplify to centered card (C2) |
| `src/pages/LoginPage.js` | Remove AttackVizSide, use simplified AuthShell (C2, C3) |
| `src/pages/RegisterPage.js` | Remove AttackVizSide, use simplified AuthShell (C2) |
| `src/pages/ForgotPasswordPage.js` | Consistent card layout (C2) |
| `src/pages/LandingPage.js` | Dynamic mode-aware content + Logo in header (A1, C1) |
| `src/pages/ProfilePage.js` | Avatar upload section (A3) |
| `src/pages/ApiDocsPage.js` | Wrap in DesignAppShell when authenticated (D2) |
| `src/index.css` | Security mode font variable, color bleed audit (B2, B3) |
| `public/index.html` or `index.css` | Add Courier Prime Google Fonts import (B3) |
