# PIIcasso UI Overhaul (Batches A–D) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the mode toggle crash, enforce dual-mode theming, simplify auth UX, add profile avatar, and repair broken navigation routes across Security and User modes.

**Architecture:** Surgical edits to 14 existing files + 1 new component. No new routing abstractions. ModeContext gets a one-time-init fetch pattern (useRef guard) to eliminate the state race condition. AuthShell becomes a centered card with the logo. Colors flow through existing CSS variables. Route bugs are one-line string corrections.

**Tech Stack:** React 18, React Router v6, @react-oauth/google, Tailwind CSS + CSS Custom Properties, Axios

---

## File Change Index

| File | Change | Task |
|---|---|---|
| `src/context/ModeContext.js` | Replace fetchPreferences with useRef one-time init | T1 |
| `src/components/ModeManager.js` | Fix navigate route + trim isSecurityPage list | T1 |
| `src/components/design/dashboard/DesignAppShell.jsx` | Fix navigate route + remove sidebar Settings + copy | T1, T2 |
| `src/components/design/ProfileAvatar.jsx` | **NEW** — avatar/initials display component | T3 |
| `src/components/design/dashboard/DesignAppShell.jsx` | Replace initials div with ProfileAvatar | T3 |
| `src/pages/ProfilePage.js` | Add avatar upload section + FormData submit | T3 |
| `public/index.html` | Add Courier Prime Google Fonts `<link>` | T4 |
| `src/index.css` | Add `[data-mode="security"]` font variable override | T4 |
| `src/components/Footer.js` | Replace hardcoded blue Tailwind classes with CSS vars | T5 |
| `src/components/design/auth/AuthShell.jsx` | Rewrite as centered card + Logo | T6 |
| `src/pages/LoginPage.js` | Remove `side` prop + AttackVizSide import | T6 |
| `src/pages/RegisterPage.js` | Remove `side` prop + AttackVizSide import | T6 |
| `src/pages/ForgotPasswordPage.js` | Remove `side` prop + AttackVizSide import if present | T6 |
| `src/components/design/auth/SsoButtons.jsx` | Custom Google button overlay, remove placeholders | T7 |
| `src/pages/LandingPage.js` | Mode-aware hero content | T8 |
| `src/components/design/MarketingNav.jsx` | Verify Logo link exists; add if missing | T8 |
| `src/pages/ApiDocsPage.js` | Wrap in DesignAppShell when authenticated | T9 |

---

## Task 1: Fix Mode Toggle Crash (B1)

**Files:**
- Modify: `src/context/ModeContext.js`
- Modify: `src/components/ModeManager.js`
- Modify: `src/components/design/dashboard/DesignAppShell.jsx`

- [ ] **Step 1: Replace ModeContext.js entirely**

The current `fetchPreferences` has `mode` in its dependency array, so it re-fires on every `switchMode()` call. A stale API response then reverts the mode. Replace with a `useRef`-guarded one-time mount fetch.

Overwrite `src/context/ModeContext.js` with:

```javascript
import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../api/axios';

export const ModeContext = createContext();

export const ModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const stored = localStorage.getItem('app_mode');
    return stored || 'user';
  });

  const [showModeModal, setShowModeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const hasFetchedPrefs = useRef(false);

  // Sync mode to DOM and localStorage on every change.
  useEffect(() => {
    localStorage.setItem('app_mode', mode);
    if (mode === 'security') {
      document.body.classList.add('mode-security');
      document.body.classList.remove('mode-user');
    } else {
      document.body.classList.add('mode-user');
      document.body.classList.remove('mode-security');
    }
    document.documentElement.setAttribute('data-mode', mode);
  }, [mode]);

  // Apply server preference ONCE on mount. The ref guard ensures switchMode calls
  // never trigger a re-fetch that could revert a user's explicit mode selection.
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token || hasFetchedPrefs.current) return;
    hasFetchedPrefs.current = true;
    axiosInstance.get('password/preferences/')
      .then(res => {
        const { last_mode } = res.data;
        if (last_mode) setMode(last_mode);
      })
      .catch(() => {});
  }, []);

  const switchMode = useCallback(async (newMode) => {
    setMode(newMode);
    localStorage.setItem('app_mode', newMode);
    try {
      await axiosInstance.put('password/preferences/', {
        default_mode: newMode,
        last_mode: newMode,
      });
    } catch (err) {
      // silent fail — mode is already switched locally
    }
  }, []);

  const openModeModal = useCallback(() => setShowModeModal(true), []);
  const closeModeModal = useCallback(() => setShowModeModal(false), []);
  const selectModeAndClose = useCallback((selectedMode) => {
    switchMode(selectedMode);
    setShowModeModal(false);
  }, [switchMode]);

  return (
    <ModeContext.Provider value={{
      mode,
      switchMode,
      setMode: switchMode,
      showModeModal,
      openModeModal,
      closeModeModal,
      selectModeAndClose,
      loading,
    }}>
      {children}
    </ModeContext.Provider>
  );
};
```

- [ ] **Step 2: Replace ModeManager.js entirely**

Two bugs: `navigate('/dashboard')` targets a non-existent route (should be `/security/dashboard`), and `isSecurityPage` incorrectly includes `/darkweb` and `/inbox` which are shared between modes (causing the Leak Monitor redirect loop).

Overwrite `src/components/ModeManager.js` with:

```javascript
import React, { useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ModeContext } from '../context/ModeContext';

const ModeManager = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const { mode } = useContext(ModeContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && !localStorage.getItem('app_mode')) {
      localStorage.setItem('app_mode', 'user');
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    if (loading || !isAuthenticated) return;

    // Routes that only exist in security mode.
    // /darkweb and /inbox are intentionally omitted — they serve both modes.
    const securityOnlyPages = [
      '/security/dashboard', '/operation', '/dashboard',
      '/teams', '/workspace', '/system-admin',
    ];

    const isAuthPage = ['/login', '/register', '/forgot-password']
      .includes(location.pathname);
    if (isAuthPage) return;

    if (mode === 'user' && securityOnlyPages.includes(location.pathname)) {
      navigate('/user/dashboard', { replace: true });
    }

    if (mode === 'security' && location.pathname.startsWith('/user')) {
      navigate('/security/dashboard', { replace: true }); // was '/dashboard' — fixed
    }
  }, [mode, isAuthenticated, loading, location.pathname, navigate]);

  return null;
};

export default ModeManager;
```

- [ ] **Step 3: Fix handleModeChange in DesignAppShell.jsx**

Open `src/components/design/dashboard/DesignAppShell.jsx`. Find `handleModeChange` (~line 64). Change the single navigate call:

```javascript
// Before
const handleModeChange = (m) => {
  switchMode(m);
  navigate(m === 'security' ? '/dashboard' : '/user/dashboard');
};

// After
const handleModeChange = (m) => {
  switchMode(m);
  navigate(m === 'security' ? '/security/dashboard' : '/user/dashboard');
};
```

- [ ] **Step 4: Manual test — toggle 5 times rapidly**

Run `cd Piicasso/frontend && npm start`. Sign in, then use the ModePill in the topbar to toggle Security ↔ User mode 5 times in rapid succession.

Expected: Each toggle navigates to the correct dashboard, no 404 at any point. Rapid toggling does not produce stale redirects.

- [ ] **Step 5: Commit**

```bash
git add src/context/ModeContext.js src/components/ModeManager.js src/components/design/dashboard/DesignAppShell.jsx
git commit -m "fix: resolve mode toggle crash — correct navigate routes and remove fetchPreferences race condition"
```

---

## Task 2: DesignAppShell — Settings Dedup + Copywriting (A2 + A4)

**Files:**
- Modify: `src/components/design/dashboard/DesignAppShell.jsx`

- [ ] **Step 1: Remove duplicate sidebar Settings button**

In `DesignAppShell.jsx`, find the `{/* Bottom actions */}` block (~line 231). Delete the entire `<button>` element that calls `navigate('/profile')` and shows `⚙ Settings`. Keep the `⌘K` hint `<div>` below it. The resulting block:

```jsx
{/* Bottom actions */}
<div style={{ marginTop: 'auto', display: 'grid', gap: 10 }}>
  <div style={{
    paddingTop: 12,
    borderTop: '1px solid var(--ink-4)',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--fg-3)',
    letterSpacing: '0.06em',
  }}>
    ⌘K search
  </div>
</div>
```

- [ ] **Step 2: Update topbar status + user label copy**

In `DesignAppShell.jsx`, find the topbar `<div>` that renders the left status text (~line 383). Update:

```jsx
// Before
● {isSecurityMode ? 'live mission' : 'personal vault'} · synced

// After
● {isSecurityMode ? 'active session' : 'password vault'} · synced
```

Find the user role label below the username in the topbar (~line 413). Update:

```jsx
// Before
{isSecurityMode ? 'operator' : 'pro plan'}

// After
{isSecurityMode ? 'analyst' : 'standard'}
```

- [ ] **Step 3: Update sidebar mode eyebrow**

Find the `● {mode} mode` eyebrow `<div>` in the sidebar (~line 89). Update:

```jsx
// Before
● {mode} mode

// After
● {mode === 'security' ? 'SECURITY' : 'USER'}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/design/dashboard/DesignAppShell.jsx
git commit -m "fix: remove duplicate Settings button and update dashboard copy"
```

---

## Task 3: Profile Avatar Component (A3)

**Files:**
- Create: `src/components/design/ProfileAvatar.jsx`
- Modify: `src/components/design/dashboard/DesignAppShell.jsx`
- Modify: `src/pages/ProfilePage.js`

- [ ] **Step 1: Create ProfileAvatar.jsx**

Create `src/components/design/ProfileAvatar.jsx`:

```jsx
import React from 'react';

const ringStyle = {
  boxShadow: '0 0 0 2px var(--ink-0), 0 0 0 3px var(--accent-700)',
};

export default function ProfileAvatar({ user, size = 32, onClick }) {
  const style = {
    ...ringStyle,
    cursor: onClick ? 'pointer' : 'default',
  };

  if (user?.profile_picture) {
    return (
      <img
        src={user.profile_picture}
        alt="Profile"
        onClick={onClick}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
          ...style,
        }}
      />
    );
  }

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '?';

  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--accent-500)',
        color: 'var(--ink-0)',
        display: 'grid',
        placeItems: 'center',
        fontSize: Math.round(size * 0.38),
        fontWeight: 700,
        letterSpacing: '0.02em',
        fontFamily: 'var(--font-mono)',
        ...style,
      }}
    >
      {initials}
    </div>
  );
}
```

- [ ] **Step 2: Replace initials circle in DesignAppShell topbar**

In `src/components/design/dashboard/DesignAppShell.jsx`:

Add import near the top (after existing imports):
```javascript
import ProfileAvatar from '../ProfileAvatar.jsx';
```

Find the `const initials = user?.username ...` line and delete it.

Find the 32×32 initials `<div>` in the topbar (the one with `background: 'var(--accent-500)'`, `placeItems: 'center'`) and replace the entire `<div>` with:
```jsx
<ProfileAvatar user={user} size={32} onClick={() => navigate('/profile')} />
```

- [ ] **Step 3: Add avatar upload to ProfilePage.js**

Open `src/pages/ProfilePage.js`.

Add import at the top:
```javascript
import ProfileAvatar from '../components/design/ProfileAvatar';
```

Find the component function's state declarations (where `useState` calls are grouped). Add two new state variables:
```javascript
const [avatarFile, setAvatarFile] = useState(null);
const [avatarPreview, setAvatarPreview] = useState(null);
```

Also add a `useEffect` to initialize `avatarPreview` from `user.profile_picture`:
```javascript
useEffect(() => {
  if (user?.profile_picture) setAvatarPreview(user.profile_picture);
}, [user]);
```

Find the top of the profile form JSX (before the first name / last name fields). Insert this avatar block:
```jsx
<div style={{
  display: 'flex',
  alignItems: 'center',
  gap: 20,
  marginBottom: 28,
  paddingBottom: 28,
  borderBottom: '1px solid var(--ink-4)',
}}>
  <div style={{ position: 'relative', flexShrink: 0 }}>
    <ProfileAvatar
      user={{ ...user, profile_picture: avatarPreview }}
      size={64}
    />
    <label
      htmlFor="avatar-upload"
      style={{
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: 'var(--accent-500)',
        color: 'var(--ink-0)',
        display: 'grid',
        placeItems: 'center',
        fontSize: 11,
        cursor: 'pointer',
        boxShadow: '0 0 0 2px var(--ink-0)',
      }}
    >
      ✎
    </label>
    <input
      id="avatar-upload"
      type="file"
      accept="image/*"
      style={{ display: 'none' }}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
      }}
    />
  </div>
  <div>
    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-0)' }}>
      {user?.username}
    </div>
    <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>
      {user?.email}
    </div>
  </div>
</div>
```

Find the profile form submit handler (the function that POSTs to `user/profile/`). Update it to send `FormData` when a new avatar file is selected:

```javascript
// Replace the existing profile POST call with:
const formData = new FormData();
// Add all the existing text fields (first_name, last_name etc.) to formData:
formData.append('first_name', firstName);   // use whatever variable names already exist
formData.append('last_name', lastName);
if (avatarFile) formData.append('profile_picture', avatarFile);

await axiosInstance.post('user/profile/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
```

Note: Look for the existing variable names in the profile form handler (`firstName`, `first_name`, etc.) and match them in the `formData.append` calls above.

- [ ] **Step 4: Commit**

```bash
git add src/components/design/ProfileAvatar.jsx src/components/design/dashboard/DesignAppShell.jsx src/pages/ProfilePage.js
git commit -m "feat: add ProfileAvatar component with photo upload on profile page"
```

---

## Task 4: Font Contrast — Security Mode Monospace Body (B3)

**Files:**
- Modify: `public/index.html`
- Modify: `src/index.css`

- [ ] **Step 1: Add Courier Prime to public/index.html**

Open `public/index.html`. Inside `<head>`, locate existing Google Fonts `<link>` tags (for Space Grotesk, JetBrains Mono, Oswald). After them, add:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
```

If there are no existing Google Fonts links (they may be loaded via `@import` in CSS), add these before `</head>`.

- [ ] **Step 2: Add CSS variable override in index.css**

Open `src/index.css`. Find the `[data-mode="user"]` rule block (the one that contains `--accent-h: 255`). Directly after that block, add:

```css
[data-mode="security"] {
  --font-sans-v3: 'Courier Prime', 'Courier New', monospace;
}
```

This overrides body font to monospace in Security Mode. Headings already use `--font-display` (Oswald, uppercase) which is unaffected.

- [ ] **Step 3: Visual test**

In browser: toggle to Security Mode. Body text (nav labels, descriptions, form fields) should shift to Courier Prime. Toggle to User Mode — body text returns to Space Grotesk. Headings should stay Oswald in both modes.

- [ ] **Step 4: Commit**

```bash
git add public/index.html src/index.css
git commit -m "feat: Courier Prime monospace font for security mode body contrast"
```

---

## Task 5: Footer Color Enforcement (B2)

**Files:**
- Modify: `src/components/Footer.js`

- [ ] **Step 1: Replace hardcoded blue classes with CSS variable inline styles**

Open `src/components/Footer.js`. Make these targeted replacements:

**Newsletter submit button** — change class `bg-blue-600 hover:bg-blue-700` to hover handler:
```jsx
// Before
<button className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white sm:rounded-r-lg rounded-lg sm:rounded-l-none transition-colors">

// After
<button
  className="px-4 py-3 text-white sm:rounded-r-lg rounded-lg sm:rounded-l-none transition-colors"
  style={{ background: 'var(--accent-500)' }}
  onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-700)'; }}
  onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-500)'; }}
>
```

**Newsletter email input** — remove `focus:border-blue-500`:
```jsx
// Before (find className containing focus:border-blue-500)
className="... focus:outline-none focus:border-blue-500"

// After
className="... focus:outline-none"
```

**Twitter social icon** — change `hover:bg-blue-600` to inline handler:
```jsx
// Before
<a href="#" className="w-11 h-11 rounded-lg bg-slate-900 hover:bg-blue-600 flex items-center justify-center text-slate-400 hover:text-white transition-all">

// After
<a href="#"
  className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white transition-all"
  onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-500)'; }}
  onMouseLeave={e => { e.currentTarget.style.background = ''; }}
>
```

**LinkedIn social icon** — change `hover:bg-blue-700` to inline handler:
```jsx
// Before
<a href="#" className="w-11 h-11 rounded-lg bg-slate-900 hover:bg-blue-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">

// After
<a href="#"
  className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white transition-all"
  onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-700)'; }}
  onMouseLeave={e => { e.currentTarget.style.background = ''; }}
>
```

**Shield icon** — change `text-blue-500` to inline style:
```jsx
// Before
<Shield className="w-4 h-4 text-blue-500" />

// After
<Shield className="w-4 h-4" style={{ color: 'var(--accent-500)' }} />
```

- [ ] **Step 2: Visual test**

Toggle to Security Mode. Scroll to the footer. Verify: newsletter button, Twitter/LinkedIn hover, and Shield icon are red (not blue). Toggle to User Mode — verify they are blue.

- [ ] **Step 3: Commit**

```bash
git add src/components/Footer.js
git commit -m "fix: replace hardcoded blue Tailwind classes in Footer with CSS variable accent colors"
```

---

## Task 6: AuthShell Simplify + Logo on Auth Pages (C2 + A1)

**Files:**
- Modify: `src/components/design/auth/AuthShell.jsx`
- Modify: `src/pages/LoginPage.js`
- Modify: `src/pages/RegisterPage.js`
- Modify: `src/pages/ForgotPasswordPage.js`

- [ ] **Step 1: Rewrite AuthShell.jsx as centered card with Logo**

The current `AuthShell` is a two-column split-screen with a `side` prop. Remove the `side` prop, remove the left panel entirely, and replace with a single centered card that renders `<Logo>` at the top.

Overwrite `src/components/design/auth/AuthShell.jsx` with:

```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../Logo';

export default function AuthShell({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--ink-0)',
      padding: '40px 24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'var(--ink-1)',
        border: '1px solid var(--ink-4)',
        borderRadius: 16,
        padding: '40px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', textDecoration: 'none' }}>
            <Logo size={28} />
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update LoginPage.js — remove AttackVizSide**

Open `src/pages/LoginPage.js`.

Remove this import line:
```javascript
import AttackVizSide from '../components/design/auth/AttackVizSide';
```

Remove the `ModePill` import if it is not used anywhere in the form body (check for `<ModePill` in the JSX — if absent, remove the import):
```javascript
// Remove if unused:
import ModePill from '../components/design/ModePill';
```

Change `<AuthShell side={...}>` to `<AuthShell>` — delete the entire `side` prop and its value:
```jsx
// Before
<AuthShell
  side={
    <AttackVizSide
      headline="Welcome back. The wordlist remembers."
      sub="Resume your missions, review your fleet's resilience, and keep the engine warm."
    />
  }
>

// After
<AuthShell>
```

- [ ] **Step 3: Update RegisterPage.js — remove AttackVizSide**

Open `src/pages/RegisterPage.js`.

Remove this import line:
```javascript
import AttackVizSide from '../components/design/auth/AttackVizSide';
```

Find the `<AuthShell` usage and remove its `side` prop:
```jsx
// Before (find the <AuthShell with a side prop — exact headline text may differ)
<AuthShell side={<AttackVizSide headline="..." sub="..." />}>

// After
<AuthShell>
```

- [ ] **Step 4: Update ForgotPasswordPage.js — remove AttackVizSide**

Open `src/pages/ForgotPasswordPage.js`.

If it imports `AttackVizSide`, remove that import. If it uses `<AuthShell side={...}>`, remove the `side` prop. If `ForgotPasswordPage` does not use `AuthShell` at all, wrap its root container in `<AuthShell>` and remove its own outer container div.

- [ ] **Step 5: Visual test**

Navigate to `/login`, `/register`, `/forgot-password` in the browser. Each page should render as a single centered card (max-width 440px) with the `piicasso.` logo at top-center, form content below it, on a dark page background. No side panel or animation.

- [ ] **Step 6: Commit**

```bash
git add src/components/design/auth/AuthShell.jsx src/pages/LoginPage.js src/pages/RegisterPage.js src/pages/ForgotPasswordPage.js
git commit -m "feat: simplify auth pages to centered card layout and add logo (A1 + C2)"
```

---

## Task 7: Google OAuth Button Redesign (C3)

**Files:**
- Modify: `src/components/design/auth/SsoButtons.jsx`

- [ ] **Step 1: Rewrite SsoButtons.jsx**

The new design: a custom-styled pill row (Google G icon + "Continue with Google" text) with the real `GoogleLogin` component overlaid transparently on top for interaction. This preserves the existing auth flow (credential/id_token) while giving full visual control.

Overwrite `src/components/design/auth/SsoButtons.jsx` with:

```jsx
import React, { useContext } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../../../context/AuthContext';
import { ModeContext } from '../../../context/ModeContext';
import { useNavigate } from 'react-router-dom';

export default function SsoButtons({ onError }) {
  const { googleLogin } = useContext(AuthContext);
  const { mode, openModeModal } = useContext(ModeContext);
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential || credentialResponse.credential.split('.').length < 3) {
      return;
    }
    const res = await googleLogin(credentialResponse.credential);
    if (res.success) {
      if (!localStorage.getItem('app_mode')) openModeModal();
      navigate(mode === 'security' ? '/security/dashboard' : '/user/dashboard');
    } else {
      onError?.(res.error || 'Google sign-in failed');
    }
  };

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Fixed-height container: custom visual layer sits behind,
          transparent GoogleLogin iframe sits on top for click handling */}
      <div style={{ position: 'relative', height: 46 }}>

        {/* Visual layer — no pointer events, purely decorative */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          borderRadius: 10,
          border: '1px solid var(--ink-5)',
          background: 'var(--ink-2)',
          pointerEvents: 'none',
          transition: 'border-color 0.15s, background 0.15s',
        }}>
          {/* Google G logo SVG */}
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.169 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          <span style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--fg-0)',
            fontFamily: 'var(--font-sans-v3)',
          }}>
            Continue with Google
          </span>
        </div>

        {/* Interaction layer — GoogleLogin iframe covers the button; opacity ~0 makes it
            visually invisible while keeping it clickable */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.01,
          overflow: 'hidden',
          borderRadius: 10,
        }}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => onError?.('Google authentication was cancelled or failed.')}
            theme="filled_black"
            shape="rectangular"
            size="large"
            width="400"
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Visual test**

Navigate to `/login`. The OAuth button should show: Google G color icon on the left, "Continue with Google" label, dark card background, thin border. Clicking it should still trigger the Google sign-in popup normally.

- [ ] **Step 3: Commit**

```bash
git add src/components/design/auth/SsoButtons.jsx
git commit -m "feat: redesign Google OAuth button to custom branded pill with icon"
```

---

## Task 8: Dynamic Landing Page + Logo in Nav (C1 + A1)

**Files:**
- Modify: `src/pages/LandingPage.js`
- Modify: `src/components/design/MarketingNav.jsx`

- [ ] **Step 1: Verify Logo in MarketingNav**

Open `src/components/design/MarketingNav.jsx`. Check if it renders `<Logo>` wrapped in a link to `/`. If it does, skip this step. If not, add:

```jsx
// At the top of MarketingNav, add import:
import Logo from './Logo';
import { Link } from 'react-router-dom';

// In the nav JSX, in the leftmost section of the bar:
<Link to="/" style={{ display: 'inline-flex', textDecoration: 'none' }}>
  <Logo size={24} />
</Link>
```

- [ ] **Step 2: Add mode-aware hero data to LandingPage.js**

Open `src/pages/LandingPage.js`. The file already imports `ModeContext` at the top. Add this constant at the module level (before any component function definitions):

```javascript
const HERO = {
  security: {
    eyebrow: '● SECURITY MODE',
    headline: 'Attack surface mapped.',
    accentLine: 'Credentials ready.',
    sub: 'Offensive security tooling for red teams and security analysts. Generate targeted wordlists from real PII exposure data.',
    ctaLabel: 'Launch operation',
    ctaPath: '/register',
  },
  user: {
    eyebrow: '● USER MODE',
    headline: 'Your password',
    accentLine: "isn't yours anymore.",
    sub: 'PIIcasso detects your leaked personal data and generates the wordlist that could crack you — before someone else does.',
    ctaLabel: 'Check my password',
    ctaPath: '/register',
  },
};
```

- [ ] **Step 3: Wire HERO data into HeroSection**

In `LandingPage.js`, find the component function that renders the hero `<h1>` (search for `"Your password"` or `"isn't yours"`). At the top of that function body, add:

```javascript
const { mode } = useContext(ModeContext);
const hero = HERO[mode] || HERO.user;
```

Replace the static `<h1>` and eyebrow with:

```jsx
<div className="eyebrow fade-up" style={{ color: 'var(--accent-500)', marginBottom: 16 }}>
  {hero.eyebrow}
</div>
<h1 className="fade-up" style={{
  fontSize: 'clamp(40px, 6vw, 72px)',
  fontWeight: 700,
  lineHeight: 1.08,
  letterSpacing: '-0.03em',
}}>
  {hero.headline}{' '}
  <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, color: 'var(--accent-500)' }}>
    {hero.accentLine}
  </span>
</h1>
```

Replace the static `<p>` subline with:

```jsx
<p className="fade-up" style={{
  color: 'var(--fg-2)',
  fontSize: 19,
  maxWidth: 620,
  margin: '28px auto 0',
  lineHeight: 1.5,
  animationDelay: '.1s',
}}>
  {hero.sub}
</p>
```

Replace the CTA buttons:

```jsx
<div className="fade-up" style={{
  display: 'flex',
  justifyContent: 'center',
  gap: 12,
  marginTop: 36,
  flexWrap: 'wrap',
  animationDelay: '.15s',
}}>
  <button
    onClick={() => navigate(hero.ctaPath)}
    className="btn btn-accent"
    style={{ padding: '14px 22px', fontSize: 14 }}
  >
    {hero.ctaLabel} <span style={{ opacity: 0.6 }}>→</span>
  </button>
  <button
    onClick={() => navigate('/api')}
    className="btn btn-ghost"
    style={{ padding: '14px 22px', fontSize: 14 }}
  >
    <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.6 }}>$</span> Read the docs
  </button>
</div>
```

If the hero function component does not already call `useContext(ModeContext)`, ensure `useContext` is imported: `import React, { useState, useEffect, useContext, useMemo } from 'react';` (it's already in the file's import on line 1).

- [ ] **Step 4: Visual test**

Navigate to `/`. If logged in, toggle mode — verify hero headline, eyebrow, subline, and CTA label all change. Security mode shows attack-oriented copy in red; User mode shows defensive copy in blue.

- [ ] **Step 5: Commit**

```bash
git add src/pages/LandingPage.js src/components/design/MarketingNav.jsx
git commit -m "feat: dynamic landing page hero content reacts to active mode (C1 + A1)"
```

---

## Task 9: ApiDocsPage Shell Wrap — Learn Route Fix (D2)

**Files:**
- Modify: `src/pages/ApiDocsPage.js`

- [ ] **Step 1: Wrap ApiDocsPage in DesignAppShell when authenticated**

Open `src/pages/ApiDocsPage.js`. Add imports near the top:

```javascript
import { useContext } from 'react';  // add useContext if not already imported
import { AuthContext } from '../context/AuthContext';
import DesignAppShell from '../components/design/dashboard/DesignAppShell';
```

Inside the `ApiDocsPage` component function, add auth detection before the `return` statement:

```javascript
const { isAuthenticated } = useContext(AuthContext);
```

Wrap the existing JSX with a conditional. The component currently returns a large JSX block — call it `pageContent` and return it wrapped when authenticated:

```jsx
// Replace the return statement with:
const pageContent = (
  // — paste the existing entire return JSX here, unchanged —
);

if (isAuthenticated) {
  return (
    <DesignAppShell activeKey="learn">
      {pageContent}
    </DesignAppShell>
  );
}

return pageContent;
```

`activeKey="learn"` matches the `['learn', 'Learn', '☉', '/api']` entry in `DesignAppShell`'s `userItems`, which highlights the Learn nav link when on this page.

- [ ] **Step 2: Manual test**

Sign in → User Mode → sidebar → Learn. Verify:
- Page renders inside the `DesignAppShell` sidebar layout
- "Learn" nav item is highlighted in the sidebar
- Clicking other sidebar items navigates away without issue

Also visit `/api` while logged out. Verify: standalone page renders as before (no sidebar).

- [ ] **Step 3: Commit**

```bash
git add src/pages/ApiDocsPage.js
git commit -m "fix: wrap ApiDocsPage in DesignAppShell for authenticated users so Learn nav doesn't trap users"
```

---

## Spec Coverage Checklist

| Spec Item | Task |
|---|---|
| A1 — Logo globally on auth pages | T6 (AuthShell rewrite, Logo at card top-center) |
| A1 — Logo in LandingPage nav | T8 Step 1 (MarketingNav check) |
| A2 — Settings deduplication | T2 Step 1 |
| A3 — Profile picture component | T3 |
| A4 — Copywriting audit | T2 Steps 2–3 |
| B1 — Mode toggle crash (navigate bug) | T1 Steps 2–3 |
| B1 — Mode toggle crash (fetchPreferences race) | T1 Step 1 |
| B2 — No blue in Security Mode footer | T5 |
| B3 — Font contrast Security/User | T4 |
| C1 — Dynamic landing page content | T8 Steps 2–3 |
| C2 — Auth pages simplified | T6 |
| C3 — OAuth button redesign | T7 |
| D2 — Leak Monitor redirect loop | T1 Step 2 (ModeManager isSecurityPage) |
| D2 — Learn `/api` traps user | T9 |
