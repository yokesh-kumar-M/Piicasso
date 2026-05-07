import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo.jsx';
import ModePill from '../ModePill.jsx';
import ProfileAvatar from '../ProfileAvatar.jsx';
import { AuthContext } from '../../../context/AuthContext.js';
import { ModeContext } from '../../../context/ModeContext.js';
import axios from '../../../api/axios';

/**
 * DesignAppShell — sidebar + topbar wrapper for both security and user dashboards.
 * Used by DashboardPage (security) and UserDashboardPage (user).
 *
 * Props:
 *   children    — page body content
 *   activeKey   — which nav item is highlighted (string)
 */
export default function DesignAppShell({ children, activeKey }) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { mode, switchMode } = useContext(ModeContext);
const [inboxOpen, setInboxOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    axios.get('operations/notifications/').then(r => setNotifications(r.data.notifications || []));
  }, []);

  const handleMarkAllRead = () => {
    axios.patch('operations/notifications/', { mark_all_read: true }).catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const isSecurityMode = mode === 'security';

  const securityItems = [
    ['mission',   'Missions',     '◈', '/security/dashboard'],
    ['wordlists', 'Wordlists',    '≡', '/workspace'],
    ['intel',     'Threat Intel', '◉', '/darkweb'],
    ['targets',   'Targets',      '◎', '/operation'],
    ...(user?.is_superuser ? [['audit', 'Audit', '☷', '/system-admin']] : []),
  ];

  const userItems = [
    ['overview',  'Overview',     '◈', '/user/dashboard'],
    ['passwords', 'My Passwords', '≡', '/user/history'],
    ['leaks',     'Leak Monitor', '◉', '/darkweb'],
    ['learn',     'Learn',        '☉', '/user/learn'],
  ];

  const items = isSecurityMode ? securityItems : userItems;
  const active = activeKey || items[0][0];

  const relativeTime = (ts) => {
    if (!ts) return '';
    const diff = (Date.now() - new Date(ts)) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const unread = notifications.filter(n => !n.is_read).length;

  const handleModeChange = (m) => {
    switchMode(m);
    navigate(m === 'security' ? '/security/dashboard' : '/user/dashboard');
  };

  const sidebar = (
    <aside style={{
      background: 'var(--ink-1)',
      borderRight: '1px solid var(--ink-4)',
      padding: 20,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
    }}>
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        style={{ marginBottom: 28, display: 'inline-flex', background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
      >
        <Logo />
      </button>

      {/* Mode eyebrow */}
      <div className="eyebrow" style={{ marginBottom: 12, color: 'var(--accent-500)' }}>
        ● {mode === 'security' ? 'SECURITY' : 'USER'}
      </div>

      {/* Nav links */}
      <nav style={{ display: 'grid', gap: 2 }}>
        {items.map(([k, label, icon, path]) => {
          const isActive = k === active;
          return (
            <button
              key={k}
              onClick={() => navigate(path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: isActive ? '8px 10px 8px 12px' : '8px 10px',
                borderRadius: 6,
                fontSize: 13,
                color: isActive ? 'var(--fg-0)' : 'var(--fg-2)',
                background: isActive ? 'var(--ink-3)' : 'transparent',
                textAlign: 'left',
                borderLeft: isActive ? '2px solid var(--accent-500)' : '2px solid transparent',
                transition: 'all .12s',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-500)', width: 14, flexShrink: 0 }}>
                {icon}
              </span>
              {label}
            </button>
          );
        })}

        {/* Inbox toggle */}
        <button
          onClick={() => setInboxOpen(o => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            borderRadius: 6,
            fontSize: 13,
            color: inboxOpen ? 'var(--fg-0)' : 'var(--fg-2)',
            background: inboxOpen ? 'var(--ink-3)' : 'transparent',
            textAlign: 'left',
            position: 'relative',
            cursor: 'pointer',
            border: 'none',
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-500)', width: 14 }}>✉</span>
          Inbox
          {unread > 0 && (
            <span style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 999,
              background: 'var(--accent-500)',
              color: 'var(--ink-0)',
            }}>
              {unread}
            </span>
          )}
        </button>
      </nav>

      {/* Inbox dropdown */}
      {inboxOpen && (
        <div style={{
          marginTop: 12,
          background: 'var(--ink-0)',
          border: '1px solid var(--ink-4)',
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--ink-4)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--ink-1)',
          }}>
            <span className="eyebrow">Inbox</span>
            <button onClick={handleMarkAllRead} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', background: 'none', border: 0, cursor: 'pointer' }}>
              MARK READ
            </button>
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {notifications.map((n, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 14px',
                  borderBottom: i < notifications.length - 1 ? '1px solid var(--ink-4)' : 'none',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  marginTop: 6,
                  background: (n.notification_type === 'SECURITY' || n.notification_type === 'SYSTEM') ? 'var(--accent-500)' : 'var(--fg-3)',
                  boxShadow: (n.notification_type === 'SECURITY' || n.notification_type === 'SYSTEM') ? '0 0 6px var(--accent-glow)' : 'none',
                  flexShrink: 0,
                  display: 'inline-block',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-0)' }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-2)', lineHeight: 1.4, marginTop: 2 }}>{n.description}</div>
                  <div style={{ fontSize: 10, color: 'var(--fg-4)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>{relativeTime(n.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{
            padding: '8px 14px',
            textAlign: 'center',
            borderTop: '1px solid var(--ink-4)',
            background: 'var(--ink-1)',
          }}>
            <button
              onClick={() => navigate('/inbox')}
              style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-500)', background: 'none', border: 0, cursor: 'pointer' }}
            >
              VIEW ALL →
            </button>
          </div>
        </div>
      )}

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
    </aside>
  );

  return (
    <>
      {/* Mobile top bar (< 1024px) */}
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

      {/* Mobile top bar */}
      <div
        className="dsh-mobile-bar"
        style={{
          display: 'none',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'var(--ink-1)',
          borderBottom: '1px solid var(--ink-4)',
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
        >
          <Logo size={18} />
        </button>
        <ModePill mode={mode} onChange={handleModeChange} compact />
        <button
          onClick={() => setMobileMenuOpen(o => !o)}
          style={{
            background: 'var(--ink-3)',
            border: '1px solid var(--ink-5)',
            borderRadius: 6,
            padding: '6px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--fg-1)',
            cursor: 'pointer',
          }}
        >
          {mobileMenuOpen ? '✕ close' : '☰ menu'}
        </button>
      </div>

      {/* Mobile slide-down nav */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: 49,
          left: 0,
          right: 0,
          zIndex: 40,
          background: 'var(--ink-1)',
          borderBottom: '1px solid var(--ink-4)',
          padding: '12px 16px',
        }}>
          {items.map(([k, label, icon, path]) => (
            <button
              key={k}
              onClick={() => { navigate(path); setMobileMenuOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 12px',
                marginBottom: 4,
                borderRadius: 6,
                fontSize: 14,
                color: k === active ? 'var(--fg-0)' : 'var(--fg-2)',
                background: k === active ? 'var(--ink-3)' : 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-500)' }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Desktop shell grid */}
      <div
        className="dsh-grid"
        style={{
          minHeight: '100vh',
          display: 'grid',
          gridTemplateColumns: '240px 1fr',
        }}
      >
        <div className="dsh-sidebar">
          {sidebar}
        </div>

        <main style={{ padding: 0, maxWidth: '100%', overflow: 'hidden' }}>
          {/* Top bar */}
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            padding: '14px 32px',
            borderBottom: '1px solid var(--ink-4)',
            background: 'color-mix(in oklab, var(--ink-0) 88%, transparent)',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
              ● {isSecurityMode ? 'active session' : 'password vault'} · synced
            </div>
            <ModePill mode={mode} onChange={handleModeChange} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
              <button
                onClick={() => navigate('/profile')}
                style={{
                  fontSize: 16,
                  color: 'var(--fg-3)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                ⚙
              </button>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                paddingLeft: 12,
                marginLeft: 4,
                borderLeft: '1px solid var(--ink-4)',
              }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-0)', lineHeight: 1.2 }}>
                    {user?.username || 'User'}
                  </div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)' }}>
                    {isSecurityMode ? 'analyst' : 'standard'}
                  </div>
                </div>
                <ProfileAvatar user={user} size={32} onClick={() => navigate('/profile')} />
              </div>
            </div>
          </div>

          {/* Page body */}
          <div style={{ padding: '24px 32px' }}>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
