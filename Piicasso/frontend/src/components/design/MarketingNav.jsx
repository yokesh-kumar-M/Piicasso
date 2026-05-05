import React, { useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ModeContext } from '../../context/ModeContext';
import { AuthContext } from '../../context/AuthContext';
import Logo from './Logo';
import ModePill from './ModePill';

/**
 * MarketingNav — sticky nav for marketing pages. Glass blur, mode-aware.
 * Login/CTA on the right; mode pill is compact on this nav.
 */
export default function MarketingNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, switchMode } = useContext(ModeContext);
  const { isAuthenticated } = useContext(AuthContext);

  // Marketing routes — point at hash sections on the landing page when standalone
  // pages don't yet exist, but support real routes once they do.
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
          {isAuthenticated ? (
            <button
              onClick={() => navigate(mode === 'security' ? '/security/dashboard' : '/user/dashboard')}
              className="v3-btn v3-btn-accent"
            >
              Open dashboard <span style={{ opacity: 0.6 }}>→</span>
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="v3-btn v3-btn-link">
                Log in
              </button>
              <button onClick={() => navigate('/register')} className="v3-btn v3-btn-accent">
                Get started <span style={{ opacity: 0.6 }}>→</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
