import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MarketingNav from '../components/design/MarketingNav';

/**
 * 404 — terminal-lookup motif. Big editorial 4·0·4 with the 0 in accent,
 * a faux CLI block describing a failed lookup, and a CTA back home.
 */
const NotFoundPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = '404 · PIIcasso';
  }, []);

  const lines = [
    '$ piicasso lookup --route=/wherever',
    '→ entity not found',
    '→ no leak record',
    '→ no audit trail',
    '→ this page does not exist.',
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink-0)', display: 'flex', flexDirection: 'column' }}>
      <MarketingNav />
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 32 }}>
        <div style={{ textAlign: 'center', maxWidth: 640 }}>
          <div
            style={{
              fontFamily: 'var(--font-sans-v3)',
              fontSize: 'clamp(120px, 22vw, 240px)',
              fontWeight: 500,
              letterSpacing: '-0.06em',
              lineHeight: 1,
              marginBottom: 32,
              background: 'linear-gradient(180deg, var(--fg-0), var(--fg-3))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            4
            <span
              style={{
                color: 'var(--accent-500)',
                WebkitTextFillColor: 'var(--accent-500)',
              }}
            >
              0
            </span>
            4
          </div>

          <div
            style={{
              background: 'var(--ink-1)',
              border: '1px solid var(--ink-4)',
              borderRadius: 12,
              padding: '20px 24px',
              fontFamily: 'var(--font-mono-v3)',
              fontSize: 13,
              textAlign: 'left',
              color: 'var(--fg-1)',
              lineHeight: 1.7,
              marginBottom: 32,
            }}
          >
            {lines.map((l, i) => (
              <div
                key={i}
                style={{
                  color:
                    i === 0
                      ? 'var(--fg-0)'
                      : i === lines.length - 1
                      ? 'var(--accent-500)'
                      : 'var(--fg-2)',
                }}
              >
                {l}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/')}
              className="v3-btn v3-btn-accent"
              style={{ padding: '12px 20px' }}
            >
              ← Back to safety
            </button>
            <button
              onClick={() => navigate('/login')}
              className="v3-btn v3-btn-ghost"
              style={{ padding: '12px 20px' }}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
