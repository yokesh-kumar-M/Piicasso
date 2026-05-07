# Mobile Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PIIcasso fully usable on mobile (< 640px) by adding a bottom tab bar, hamburger nav, mobile card view for history, and touch-optimized globe.

**Architecture:** Five targeted component edits — new `MobileTabBar` component is the only new file. All other changes are additive to existing files using the existing `useResponsive` hook (breakpoint: `isMobile` = width < 640px). The existing `DesignAppShell` CSS already hides the sidebar at < 1024px; we're adding bottom-tab behavior for < 640px on top of that.

**Tech Stack:** React 18, framer-motion v12, useResponsive hook (src/hooks/useResponsive.js), ModeContext, react-router-dom, react-globe.gl

---

## Task 1: MobileTabBar — new component

**Files:**
- Create: `Piicasso/frontend/src/components/design/dashboard/MobileTabBar.jsx`

- [ ] **Step 1: Create the file**

```jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModeContext } from '../../../context/ModeContext';

/**
 * Fixed bottom navigation bar — visible only on screens < 640px.
 * activeKey matches the nav item keys defined in DesignAppShell.
 */
export default function MobileTabBar({ activeKey }) {
  const navigate = useNavigate();
  const { mode } = useContext(ModeContext);

  const securityTabs = [
    { key: 'mission',   label: 'MISSIONS',  icon: '◈', path: '/security/dashboard' },
    { key: 'wordlists', label: 'WORDLISTS', icon: '≡', path: '/workspace' },
    { key: 'intel',     label: 'INTEL',     icon: '◉', path: '/darkweb' },
    { key: 'targets',   label: 'TARGETS',   icon: '◎', path: '/operation' },
  ];

  const userTabs = [
    { key: 'overview',   label: 'HOME',      icon: '◈', path: '/user/dashboard' },
    { key: 'passwords',  label: 'PASSWORDS', icon: '≡', path: '/user/history' },
    { key: 'leaks',      label: 'LEAKS',     icon: '◉', path: '/darkweb' },
    { key: 'learn',      label: 'LEARN',     icon: '☉', path: '/user/learn' },
  ];

  const tabs = mode === 'security' ? securityTabs : userTabs;

  return (
    <>
      <style>{`
        .mobile-tab-bar {
          display: none;
        }
        @media (max-width: 639px) {
          .mobile-tab-bar {
            display: flex;
          }
        }
      `}</style>
      <div
        className="mobile-tab-bar"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'var(--ink-0)',
          borderTop: '1px solid var(--ink-4)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          height: 'calc(49px + env(safe-area-inset-bottom))',
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
      >
        {tabs.map(({ key, label, icon, path }) => {
          const isActive = key === activeKey;
          return (
            <button
              key={key}
              onClick={() => navigate(path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                flex: 1,
                minHeight: 44,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? 'var(--accent-500)' : 'var(--fg-3)',
                transition: 'color 0.12s',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 16,
                lineHeight: 1,
              }}>
                {icon}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 8,
                letterSpacing: '0.08em',
                fontWeight: isActive ? 700 : 400,
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify the file exists**

Run: `ls Piicasso/frontend/src/components/design/dashboard/`
Expected: `DesignAppShell.jsx` and `MobileTabBar.jsx` both listed.

- [ ] **Step 3: Commit**

```bash
git add Piicasso/frontend/src/components/design/dashboard/MobileTabBar.jsx
git commit -m "feat: add MobileTabBar fixed bottom nav for mobile dashboards"
```

---

## Task 2: DesignAppShell — integrate MobileTabBar + mobile content padding

**Files:**
- Modify: `Piicasso/frontend/src/components/design/dashboard/DesignAppShell.jsx`

The existing CSS already hides the sidebar at < 1024px and shows the mobile top bar. We need to:
1. Import `MobileTabBar`
2. Add `padding-bottom: 57px` to the page body on mobile (prevents content hiding behind bottom bar)
3. Render `<MobileTabBar activeKey={active} />` at the end of the return

- [ ] **Step 1: Add MobileTabBar import at the top of the file (after the ProfileAvatar import)**

Current line 8:
```js
import axios from '../../../api/axios';
```

Add after it:
```js
import MobileTabBar from './MobileTabBar';
```

- [ ] **Step 2: Add mobile padding-bottom to the existing `<style>` block**

Find this block in the file (lines 251–260):
```js
      <style>{`
        @media (max-width: 1023px) {
          .dsh-sidebar { display: none !important; }
          .dsh-mobile-bar { display: flex !important; }
          .dsh-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 1024px) {
          .dsh-mobile-bar { display: none !important; }
        }
      `}</style>
```

Replace with:
```js
      <style>{`
        @media (max-width: 1023px) {
          .dsh-sidebar { display: none !important; }
          .dsh-mobile-bar { display: flex !important; }
          .dsh-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 1024px) {
          .dsh-mobile-bar { display: none !important; }
        }
        @media (max-width: 639px) {
          .dsh-page-body { padding-bottom: 57px !important; }
        }
      `}</style>
```

- [ ] **Step 3: Add className to the page body div**

Find this line (around line 407):
```jsx
          <div style={{ padding: '24px 32px' }}>
```

Replace with:
```jsx
          <div className="dsh-page-body" style={{ padding: '24px 32px' }}>
```

- [ ] **Step 4: Render MobileTabBar before the closing fragment tag**

Find the closing of the return (the last line before the final `}`):
```jsx
    </>
  );
}
```

Replace with:
```jsx
      <MobileTabBar activeKey={active} />
    </>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add Piicasso/frontend/src/components/design/dashboard/DesignAppShell.jsx
git commit -m "feat: integrate MobileTabBar into DesignAppShell with mobile bottom padding"
```

---

## Task 3: MarketingNav — hamburger + animated drawer

**Files:**
- Modify: `Piicasso/frontend/src/components/design/MarketingNav.jsx`

Currently the nav links always render inline. On mobile they overflow. We add: hamburger state, framer-motion slide-down drawer, close on route change.

- [ ] **Step 1: Replace the entire file contents**

```jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ModeContext } from '../../context/ModeContext';
import { AuthContext } from '../../context/AuthContext';
import Logo from './Logo';
import ModePill from './ModePill';

export default function MarketingNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, switchMode } = useContext(ModeContext);
  const { isAuthenticated } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  const items = [
    ['Product', '/#features'],
    ['Solutions', '/#solutions'],
    ['Pricing', '/#pricing'],
    ['Docs', '/api'],
    ['Blog', '/#blog'],
  ];

  const isActive = (href) => {
    if (href.startsWith('/#')) return location.pathname === '/' && location.hash === href.slice(1);
    return location.pathname === href;
  };

  return (
    <>
      <style>{`
        .mkt-nav-links { display: flex; }
        .mkt-hamburger { display: none; }
        @media (max-width: 767px) {
          .mkt-nav-links { display: none; }
          .mkt-hamburger { display: flex; }
        }
      `}</style>

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(14px) saturate(140%)',
          WebkitBackdropFilter: 'blur(14px) saturate(140%)',
          background: 'color-mix(in oklab, var(--ink-0) 72%, transparent)',
          borderBottom: '1px solid var(--ink-4)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--max-w)',
            margin: '0 auto',
            padding: '14px var(--gutter)',
            display: 'flex',
            alignItems: 'center',
            gap: 32,
          }}
        >
          <button
            onClick={() => navigate('/')}
            style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--fg-0)' }}
            aria-label="Home"
          >
            <Logo />
          </button>

          {/* Desktop nav links */}
          <nav style={{ display: 'flex', gap: 4, marginLeft: 8 }} className="mkt-nav-links">
            {items.map(([label, href]) => (
              <Link
                key={href}
                to={href}
                style={{
                  padding: '8px 12px',
                  fontSize: 13,
                  color: isActive(href) ? 'var(--fg-0)' : 'var(--fg-2)',
                  borderRadius: 6,
                  transition: 'color 0.15s',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fg-0)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = isActive(href) ? 'var(--fg-0)' : 'var(--fg-2)')}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <ModePill mode={mode} onChange={switchMode} compact />

            {/* Desktop CTAs */}
            {isAuthenticated ? (
              <button
                onClick={() => navigate(mode === 'security' ? '/security/dashboard' : '/user/dashboard')}
                className="v3-btn v3-btn-accent mkt-nav-links"
              >
                Open dashboard <span style={{ opacity: 0.6 }}>→</span>
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="v3-btn v3-btn-link mkt-nav-links">
                  Log in
                </button>
                <button onClick={() => navigate('/register')} className="v3-btn v3-btn-accent mkt-nav-links">
                  Get started <span style={{ opacity: 0.6 }}>→</span>
                </button>
              </>
            )}

            {/* Hamburger — mobile only */}
            <button
              className="mkt-hamburger"
              onClick={() => setMobileOpen(o => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              style={{
                background: 'var(--ink-3)',
                border: '1px solid var(--ink-5)',
                borderRadius: 6,
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
              }}
            >
              {mobileOpen ? (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--fg-1)', lineHeight: 1 }}>✕</span>
              ) : (
                <>
                  <span style={{ display: 'block', width: 16, height: 1.5, background: 'var(--fg-1)', borderRadius: 1 }} />
                  <span style={{ display: 'block', width: 16, height: 1.5, background: 'var(--fg-1)', borderRadius: 1 }} />
                  <span style={{ display: 'block', width: 16, height: 1.5, background: 'var(--fg-1)', borderRadius: 1 }} />
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile slide-down drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mkt-drawer"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: 53,
              left: 0,
              right: 0,
              zIndex: 49,
              background: 'var(--ink-1)',
              borderBottom: '1px solid var(--ink-4)',
              padding: '16px var(--gutter)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
              Navigation
            </div>
            {items.map(([label, href]) => (
              <Link
                key={href}
                to={href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'block',
                  padding: '11px 12px',
                  marginBottom: 2,
                  fontSize: 14,
                  color: isActive(href) ? 'var(--fg-0)' : 'var(--fg-2)',
                  borderRadius: 6,
                  background: isActive(href) ? 'var(--ink-3)' : 'transparent',
                  textDecoration: 'none',
                }}
              >
                {label}
              </Link>
            ))}
            <div style={{ height: 1, background: 'var(--ink-4)', margin: '12px 0' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              {isAuthenticated ? (
                <button
                  onClick={() => { navigate(mode === 'security' ? '/security/dashboard' : '/user/dashboard'); setMobileOpen(false); }}
                  className="v3-btn v3-btn-accent"
                  style={{ flex: 1 }}
                >
                  Open dashboard →
                </button>
              ) : (
                <>
                  <button onClick={() => { navigate('/login'); setMobileOpen(false); }} className="v3-btn v3-btn-ghost" style={{ flex: 1 }}>
                    Log in
                  </button>
                  <button onClick={() => { navigate('/register'); setMobileOpen(false); }} className="v3-btn v3-btn-accent" style={{ flex: 1 }}>
                    Get started →
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add Piicasso/frontend/src/components/design/MarketingNav.jsx
git commit -m "feat: add hamburger menu with animated drawer to MarketingNav for mobile"
```

---

## Task 4: AnalysisHistoryPage — mobile card view

**Files:**
- Modify: `Piicasso/frontend/src/pages/AnalysisHistoryPage.js`

On mobile (`isMobile === true`) render cards instead of the table. The existing table renders unchanged on tablet/desktop.

- [ ] **Step 1: Add useResponsive import**

Find line 1:
```js
import React, { useState, useEffect, useContext, useMemo } from 'react';
```

Replace with:
```js
import React, { useState, useEffect, useContext, useMemo } from 'react';
import useResponsive from '../hooks/useResponsive';
```

- [ ] **Step 2: Add the hook call inside the component**

Find line 9 (inside the component, after `const isSecurityMode` line):
```js
  const isSecurityMode = appMode === 'security';
```

Add after it:
```js
  const { isMobile } = useResponsive();
```

- [ ] **Step 3: Add the mobile card renderer before the return statement**

Find the line:
```js
  if (loading) {
    return <HistorySkeleton />;
  }
```

Add this mobile card renderer function BEFORE that block:

```js
  const renderMobileCards = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {analyses.map((analysis) => {
        const levelColor = getLevelColor(analysis.vulnerability_level);
        const scoreColor = getScoreColor(analysis.strength_score);
        const isExpanded = expandedId === analysis.id;
        return (
          <div
            key={analysis.id}
            className="card"
            onClick={() => toggleExpand(analysis.id)}
            style={{ padding: '14px 16px', cursor: 'pointer' }}
          >
            {/* Card header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isExpanded ? 12 : 0 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', marginBottom: 4 }}>
                  {formatDate(analysis.created_at)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-flex',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 9,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: levelColor,
                    background: `color-mix(in oklab, ${levelColor} 12%, var(--ink-1))`,
                    border: `1px solid color-mix(in oklab, ${levelColor} 30%, transparent)`,
                  }}>
                    {analysis.vulnerability_level.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: scoreColor, fontWeight: 700 }}>
                    {analysis.strength_score}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>
                    {analysis.vulnerabilities_count} issues
                  </span>
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                ›
              </span>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid var(--ink-4)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    Issues Found
                  </div>
                  {(analysis.vulnerabilities_found || []).length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--good)', fontFamily: 'var(--font-mono)' }}>✓ No issues</div>
                  ) : (
                    (analysis.vulnerabilities_found || []).map((v, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'var(--accent-200)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>▲ {v}</div>
                    ))
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    Recommendations
                  </div>
                  {(analysis.recommendations || []).length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>None recorded</div>
                  ) : (
                    (analysis.recommendations || []).map((r, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'var(--fg-1)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>→ {r}</div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
```

- [ ] **Step 4: Replace the table block with a chained ternary**

The existing render structure is a ternary:
`{!loading && analyses.length === 0 ? (<empty state>) : (<div className="card"...>...table...</div>)}`

We need to extend it to a **chained** ternary so both branches remain valid JSX:

Find the `) : (` + table div opener (around lines 151–154):
```jsx
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--ink-4)' }}>
              <div className="eyebrow">ANALYSIS RECORDS</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%' }}>
```

Replace from `) : (` through the closing of the entire `</div>` (line 304 `        )}`) with:

```jsx
        ) : isMobile ? (
          <div>
            <div style={{ marginBottom: 8 }}>
              <div className="eyebrow">ANALYSIS RECORDS</div>
            </div>
            {renderMobileCards()}
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--ink-4)' }}>
                <div className="eyebrow">ANALYSIS RECORDS</div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--ink-4)', background: 'var(--ink-1)' }}>
                      <th style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', fontWeight: '600' }}>Date</th>
                      <th style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', fontWeight: '600' }}>Level</th>
                      <th style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', fontWeight: '600' }}>Score</th>
                      <th style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', fontWeight: '600' }}>Crack Time</th>
                      <th style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', fontWeight: '600' }}>Breaches</th>
                      <th style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', fontWeight: '600' }}>Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyses.map((analysis) => {
                      const levelColor = getLevelColor(analysis.vulnerability_level);
                      const scoreColor = getScoreColor(analysis.strength_score);
                      const levelBg = getLevelBg(analysis.vulnerability_level);
                      const isExpanded = expandedId === analysis.id;
                      return (
                        <React.Fragment key={analysis.id}>
                          <tr
                            onClick={() => toggleExpand(analysis.id)}
                            style={{ borderBottom: '1px solid var(--ink-4)', transition: 'background-color 0.2s', cursor: 'pointer' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ink-2)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--fg-0)', fontWeight: '500' }}>{formatDate(analysis.created_at)}</td>
                            <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                              <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: '700', letterSpacing: '0.08em', color: levelColor, ...levelBg, border: `1px solid ${levelBg.borderColor}` }}>
                                {analysis.vulnerability_level.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '80px', height: '4px', background: 'var(--ink-3)', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ width: `${analysis.strength_score}%`, height: '100%', background: scoreColor, transition: 'width 0.4s' }} />
                                </div>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: scoreColor, fontWeight: '600' }}>{analysis.strength_score}</span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--fg-0)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock style={{ width: '14px', height: '14px', color: 'var(--fg-2)' }} />
                                <span>{analysis.crack_time_estimate}</span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: '600' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: analysis.breach_count > 0 ? 'var(--warn)' : 'var(--good)' }}>
                                <Database style={{ width: '14px', height: '14px' }} />
                                <span>{analysis.breach_count}</span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--fg-0)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertTriangle style={{ width: '14px', height: '14px', color: analysis.vulnerabilities_count > 0 ? 'var(--warn)' : 'var(--fg-2)' }} />
                                <span>{analysis.vulnerabilities_count}</span>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr style={{ background: 'var(--ink-1)' }}>
                              <td colSpan={6} style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                  <div>
                                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Issues Found</div>
                                    {(analysis.vulnerabilities_found || []).length === 0 ? (
                                      <div style={{ fontSize: 12, color: 'var(--good)', fontFamily: 'var(--font-mono)' }}>✓ No issues recorded</div>
                                    ) : (
                                      (analysis.vulnerabilities_found || []).map((v, i) => (
                                        <div key={i} style={{ fontSize: 12, color: 'var(--accent-200)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>▲ {v}</div>
                                      ))
                                    )}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Recommendations</div>
                                    {(analysis.recommendations || []).length === 0 ? (
                                      <div style={{ fontSize: 12, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>None recorded</div>
                                    ) : (
                                      (analysis.recommendations || []).map((r, i) => (
                                        <div key={i} style={{ fontSize: 12, color: 'var(--fg-1)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>→ {r}</div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
```

- [ ] **Step 5: Commit**

```bash
git add Piicasso/frontend/src/pages/AnalysisHistoryPage.js
git commit -m "feat: mobile card view for AnalysisHistoryPage replaces table on small screens"
```

---

## Task 5: GlobalMap — mobile container height + touch interaction

**Files:**
- Modify: `Piicasso/frontend/src/components/GlobalMap.js`

The ResizeObserver already handles width from the last bug-fix session. We need to:
1. Add `useResponsive` to get `isMobile`
2. On mobile, cap the container height at `min(50vw, 280px)`
3. Add `enablePointerInteraction={true}` to the Globe
4. Reduce `pointAltitude` on mobile for performance

- [ ] **Step 1: Add useResponsive import**

Find line 1:
```js
import React, { useEffect, useRef, useState, useCallback, useContext } from 'react';
```

Add after line 4 (`import { AuthContext } from '../context/AuthContext';`):
```js
import useResponsive from '../hooks/useResponsive';
```

- [ ] **Step 2: Add the hook call inside the component**

Find this line inside `GlobalMap` (line 14):
```js
    const { isAuthenticated } = useContext(AuthContext);
```

Add after it:
```js
    const { isMobile } = useResponsive();
```

- [ ] **Step 3: Update the container div to apply mobile height cap**

Find the return JSX (line 115):
```jsx
        <div ref={containerRef} className="w-full h-full relative group flex items-center justify-center bg-transparent overflow-hidden">
```

Replace with:
```jsx
        <div
          ref={containerRef}
          className="w-full relative group flex items-center justify-center bg-transparent overflow-hidden"
          style={isMobile ? { height: 'min(50vw, 280px)' } : { height: '100%' }}
        >
```

- [ ] **Step 4: Add enablePointerInteraction and mobile pointAltitude to the Globe component**

Find:
```jsx
                pointAltitude={0.02}
```

Replace with:
```jsx
                pointAltitude={isMobile ? 0.01 : 0.02}
                enablePointerInteraction={true}
```

- [ ] **Step 5: Commit**

```bash
git add Piicasso/frontend/src/components/GlobalMap.js
git commit -m "feat: mobile height cap and touch interaction for GlobalMap globe"
```

---

## Task 6: Build check + push to production

- [ ] **Step 1: Run the build**

```bash
cd Piicasso/frontend && CI=false npm run build
```

Expected: `Compiled successfully.` with no errors. Warnings about bundle size are acceptable.

- [ ] **Step 2: Fix any build errors before continuing**

If there are import errors, check:
- `MobileTabBar` import path in `DesignAppShell.jsx` is `'./MobileTabBar'`
- `useResponsive` import paths are `'../hooks/useResponsive'` (from `pages/`) or `'../../hooks/useResponsive'` (from `components/design/`)
- Wait — `GlobalMap.js` is in `src/components/`, so `useResponsive` import should be `'../hooks/useResponsive'` ✓
- `AnalysisHistoryPage.js` is in `src/pages/`, so `useResponsive` import is `'../hooks/useResponsive'` ✓

- [ ] **Step 3: Push to production**

```bash
cd ../.. && git push origin main
```

Expected output: `Branch 'main' set up to track remote branch 'main'` or similar push confirmation.

Vercel auto-deploys frontend (~2 min). Render auto-deploys backend (~5–8 min).

- [ ] **Step 4: Verify deploys**

Check Vercel dashboard or visit `pii-casso.vercel.app` on a phone / browser devtools at 375px width and confirm:
- Landing page shows hamburger button at mobile width
- Security dashboard shows bottom tab bar at mobile width
- No console errors on: `/`, `/security/dashboard`, `/user/dashboard`
