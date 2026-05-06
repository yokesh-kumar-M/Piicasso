import React, { useState, useMemo, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.js';
import { scorePassword } from '../lib/piiEngine.js';

/* ─────────────────────────────────────────────
   Mock account list — 5 entries matching the reference.
   TODO: wire to /api/password/history/ + /api/operations/breach-search/
───────────────────────────────────────────── */
const MOCK_ACCOUNTS = [
  { site: 'github.com',       email: 'alex@nw.io',     score: 88, last: '2 weeks ago',  reused: false },
  { site: 'northwind.io',     email: 'alex@nw.io',     score: 42, last: '8 months ago', reused: true  },
  { site: 'amazon.com',       email: 'alex@gmail.com', score: 67, last: '3 months ago', reused: false },
  { site: 'old-banking.com',  email: 'alex@nw.io',     score: 22, last: '2 years ago',  reused: true  },
  { site: 'linkedin.com',     email: 'alex@gmail.com', score: 71, last: '1 month ago',  reused: false },
];

/* ─────────────────────────────────────────────
   UserQuickCheck — inline password tester
───────────────────────────────────────────── */
function UserQuickCheck({ username }) {
  const [pw, setPw] = useState('');
  const profile = useMemo(() => ({ name: username || 'User', year: '1991' }), [username]);
  const r = useMemo(() => scorePassword(pw, profile), [pw, profile]);

  const scoreColor = r.score < 45
    ? 'var(--accent-500)'
    : r.score < 70
    ? 'var(--warn)'
    : 'var(--good)';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
      <input
        value={pw}
        onChange={e => setPw(e.target.value)}
        placeholder="Type a password to test…"
        style={{
          padding: '16px 18px',
          background: 'var(--ink-3)',
          border: '1px solid var(--ink-5)',
          borderRadius: 8,
          color: 'var(--fg-0)',
          outline: 'none',
          fontFamily: 'var(--font-mono)',
          fontSize: 15,
          width: '100%',
          transition: 'border-color .15s',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent-500)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--ink-5)'; }}
      />
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 18px',
        background: 'var(--ink-1)',
        borderRadius: 8,
        border: '1px solid var(--ink-4)',
      }}>
        <div style={{ fontSize: 36, fontWeight: 500, color: pw ? scoreColor : 'var(--fg-3)' }}>
          {pw ? r.score : '—'}
        </div>
        <div>
          <div style={{ fontSize: 13, color: 'var(--fg-0)', fontWeight: 500 }}>
            {pw ? r.rating : 'Waiting…'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {r.entropy ? `${r.entropy} bits` : '—'} · {r.time}
          </div>
          {r.reasons.length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {r.reasons.slice(0, 2).map((reason, i) => (
                <div key={i} style={{ fontSize: 10, color: 'var(--accent-500)', fontFamily: 'var(--font-mono)' }}>
                  ▲ {reason.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   UserDashboardPage — "Your security overview"
───────────────────────────────────────────── */
const UserDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const username = user?.username || 'User';
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);

  const accounts = MOCK_ACCOUNTS;
  const overall = Math.round(accounts.reduce((a, b) => a + b.score, 0) / accounts.length);
  const reusedCount = accounts.filter(a => a.reused).length;

  const overallColor = overall < 45
    ? 'var(--accent-500)'
    : overall < 70
    ? 'var(--warn)'
    : 'var(--good)';

  return (
    <>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow" style={{ color: 'var(--accent-500)' }}>● Your security overview</div>
        <h1
          className="h-display"
          style={{ fontSize: 38, marginTop: 4, color: 'var(--fg-0)' }}
        >
          Hi, {displayName}.
        </h1>
        <p style={{ color: 'var(--fg-2)', fontSize: 14, fontFamily: 'var(--font-mono)', marginTop: 4 }}>
          Here's how you'd hold up against someone who knows you.
        </p>
      </div>

      {/* ── Quick check — CORE feature, top position ── */}
      <div className="card" style={{ padding: 32, marginBottom: 28 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Quick check</div>
        <h2
          className="h-display"
          style={{ fontSize: 24, marginBottom: 20, color: 'var(--fg-0)' }}
        >
          Test any password against your profile.
        </h2>
        <UserQuickCheck username={username} />
      </div>

      {/* ── Top row: 3 metric cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 12, marginBottom: 24 }}>

        {/* Overall resilience — giant glow number */}
        <div className="card" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div className="eyebrow" style={{ marginBottom: 12 }}>Overall resilience</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
            <div style={{
              fontSize: 80,
              fontWeight: 500,
              letterSpacing: '-0.05em',
              lineHeight: 1,
              color: overallColor,
              textShadow: `0 0 40px var(--accent-glow)`,
            }}>
              {overall}
            </div>
            <div style={{ color: 'var(--fg-2)', fontSize: 14 }}>/ 100</div>
          </div>
          <div style={{ height: 8, background: 'var(--ink-3)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{
              width: `${overall}%`,
              height: '100%',
              background: overallColor,
              transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ color: 'var(--fg-1)', fontSize: 13 }}>
            You're <strong>moderate</strong>. Two accounts are dragging you down — fix those first.
          </div>
        </div>

        {/* Reused passwords */}
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Reused passwords</div>
          <div style={{
            fontSize: 56,
            fontWeight: 500,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            color: reusedCount > 0 ? 'var(--accent-500)' : 'var(--good)',
          }}>
            {reusedCount}
          </div>
          <div style={{ color: 'var(--fg-2)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 6 }}>
            across {accounts.length} accounts
          </div>
        </div>

        {/* Found in leaks */}
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Found in leaks</div>
          <div style={{ fontSize: 56, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--good)' }}>
            0
          </div>
          <div style={{ color: 'var(--fg-2)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 6 }}>
            last scan: 14 min ago
          </div>
        </div>
      </div>

      {/* ── Accounts table ── */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--ink-4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div className="eyebrow">Your accounts</div>
          <button
            className="btn btn-ghost"
            style={{ padding: '6px 12px', fontSize: 12 }}
          >
            + Add account
          </button>
        </div>
        <div>
          {accounts.map((a, i) => {
            const scoreColor = a.score < 45
              ? 'var(--accent-500)'
              : a.score < 70
              ? 'var(--warn)'
              : 'var(--good)';
            return (
              <div
                key={i}
                style={{
                  padding: '16px 24px',
                  borderBottom: i < accounts.length - 1 ? '1px solid var(--ink-4)' : 'none',
                  display: 'grid',
                  gridTemplateColumns: '2fr 2fr 1fr 1.5fr 1fr',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                {/* Site + email */}
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--fg-0)' }}>{a.site}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{a.email}</div>
                </div>

                {/* Score bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 4, background: 'var(--ink-3)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      width: `${a.score}%`,
                      height: '100%',
                      background: scoreColor,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: scoreColor,
                    width: 28,
                    textAlign: 'right',
                  }}>
                    {a.score}
                  </span>
                </div>

                {/* REUSED badge */}
                <div>
                  {a.reused && (
                    <span
                      className="badge"
                      style={{
                        background: 'color-mix(in oklab, var(--accent-500) 12%, transparent)',
                        color: 'var(--accent-200)',
                        borderColor: 'var(--accent-700)',
                      }}
                    >
                      REUSED
                    </span>
                  )}
                </div>

                {/* Last changed */}
                <div style={{ fontSize: 12, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>
                  last changed {a.last}
                </div>

                {/* Action */}
                <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>
                  Improve →
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default UserDashboardPage;
