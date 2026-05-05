import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo';

/**
 * AuthShell — split-screen layout for auth pages.
 * Left: brand panel + live attack viz (passed as `side` prop).
 * Right: the form (passed as children).
 */
export default function AuthShell({ children, side }) {
  const navigate = useNavigate();
  return (
    <div className="v3-auth-shell" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1.05fr', background: 'var(--ink-0)' }}>
      <div
        className="v3-auth-side"
        style={{
          position: 'relative',
          background: 'var(--ink-1)',
          borderRight: '1px solid var(--ink-4)',
          padding: '32px 40px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{ display: 'inline-flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--fg-0)' }}
          aria-label="Home"
        >
          <Logo />
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>{side}</div>
        <div style={{ fontFamily: 'var(--font-mono-v3)', fontSize: 11, color: 'var(--fg-3)', display: 'flex', justifyContent: 'space-between' }}>
          <span>piicasso.io</span>
          <span>secure</span>
        </div>
      </div>
      <div
        className="v3-auth-form-wrap"
        style={{
          padding: '80px 64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440 }}>{children}</div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .v3-auth-shell {
            grid-template-columns: 1fr !important;
          }
          .v3-auth-side {
            display: none !important;
          }
          .v3-auth-form-wrap {
            padding: 32px 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
