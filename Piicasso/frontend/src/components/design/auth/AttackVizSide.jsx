import React, { useEffect, useMemo, useState } from 'react';

/**
 * AttackVizSide — animated wordlist crack visualization on the auth side panel.
 * Cycles through candidate passwords with a moving highlight to imply live activity.
 */
export default function AttackVizSide({ headline, sub }) {
  const candidates = useMemo(
    () => [
      'alex1991',
      'Alex.1991',
      'MochiBoston!',
      'ALEX@1991',
      'alex.chen91',
      'Boston2024',
      'AlexChen!',
      'Mochi1991',
      'Alex_91!',
      'boston.alex',
    ],
    []
  );
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % candidates.length), 280);
    return () => clearInterval(t);
  }, [candidates]);

  return (
    <div style={{ width: '100%' }}>
      <div
        className="grid-bg"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.3,
          maskImage: 'radial-gradient(ellipse at 30% 50%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 30% 50%, black 30%, transparent 75%)',
        }}
      />
      <div style={{ position: 'relative' }}>
        <div className="eyebrow" style={{ color: 'var(--accent-500)', marginBottom: 16 }}>● live engine</div>
        <h2 className="h-display" style={{ fontSize: 44, marginBottom: 16, maxWidth: 420 }}>
          {headline}
        </h2>
        <p style={{ color: 'var(--fg-2)', maxWidth: 380, marginBottom: 32, lineHeight: 1.5 }}>{sub}</p>

        <div
          style={{
            background: 'var(--ink-2)',
            border: '1px solid var(--ink-5)',
            borderRadius: 10,
            padding: '16px 20px',
            fontFamily: 'var(--font-mono-v3)',
            fontSize: 13,
            maxWidth: 420,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--fg-3)', fontSize: 11, marginBottom: 12 }}>
            <span>cracking · profile-aware</span>
            <span>{idx + 1}/{candidates.length}</span>
          </div>
          {candidates.slice(0, 6).map((c, i) => {
            const active = i === idx % 6;
            return (
              <div
                key={i}
                style={{
                  padding: '5px 8px',
                  marginBottom: 3,
                  borderRadius: 4,
                  color: active ? 'var(--ink-0)' : 'var(--fg-2)',
                  background: active ? 'var(--accent-500)' : 'transparent',
                  transition: 'all 0.15s',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  <span style={{ opacity: 0.6 }}>{(i + 1).toString().padStart(2, '0')}  </span>
                  {c}
                </span>
                {active && <span>●</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
