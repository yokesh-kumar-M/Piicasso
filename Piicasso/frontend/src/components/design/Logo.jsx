import React from 'react';

/**
 * Logo — wordmark + glyph, custom monospace with redaction motif.
 * The trailing dot picks up the active accent (red in security, blue in user).
 */
export default function Logo({ size = 22, showWord = true, color }) {
  const c = color || 'currentColor';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect x="2" y="2" width="28" height="28" rx="6" stroke={c} strokeWidth="1.5" />
        <rect x="7" y="9" width="10" height="3" fill="var(--accent-500)" />
        <rect x="7" y="14.5" width="14" height="3" fill={c} opacity="0.85" />
        <rect x="7" y="20" width="7" height="3" fill="var(--accent-500)" />
      </svg>
      {showWord && (
        <span
          style={{
            fontFamily: 'var(--font-sans-v3)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            fontSize: size * 0.78,
            color: c,
          }}
        >
          piicasso<span style={{ color: 'var(--accent-500)' }}>.</span>
        </span>
      )}
    </div>
  );
}
