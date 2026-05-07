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

            {/* Hamburger -- mobile only */}
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
