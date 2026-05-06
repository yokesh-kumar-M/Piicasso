import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '32px' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px' }}>
          {/* 404 Display */}
          <div
            style={{
              fontFamily: 'var(--font-sans-v3)',
              fontSize: 'clamp(120px, 22vw, 240px)',
              fontWeight: '500',
              letterSpacing: '-0.06em',
              lineHeight: '1',
              marginBottom: '32px',
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

          {/* Eyebrow label */}
          <div className="eyebrow" style={{ marginBottom: '20px' }}>ERROR — ROUTE NOT FOUND</div>

          {/* Faux CLI block */}
          <div
            style={{
              background: 'var(--ink-1)',
              border: '1px solid var(--ink-4)',
              borderRadius: '8px',
              padding: '20px 24px',
              fontFamily: 'var(--font-mono-v3)',
              fontSize: '13px',
              textAlign: 'left',
              color: 'var(--fg-1)',
              lineHeight: '1.7',
              marginBottom: '32px',
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

          {/* Message */}
          <p style={{ fontSize: '14px', color: 'var(--fg-2)', marginBottom: '32px', margin: '0 0 32px 0' }}>
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/')}
              className="v3-btn v3-btn-accent"
              style={{ padding: '12px 20px' }}
            >
              Go Home
            </button>
            <button
              onClick={() => navigate(-1)}
              className="v3-btn v3-btn-ghost"
              style={{ padding: '12px 20px' }}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
