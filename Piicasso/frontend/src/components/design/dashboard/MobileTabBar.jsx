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
