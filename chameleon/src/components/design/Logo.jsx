import React, { useContext } from 'react';
import { ModeContext } from '../../context/ModeContext';

/**
 * Enterprise Design Wordmark & Emblem for Marketing & Shell layouts.
 * Matches the core brand identity with theme-aware accenting.
 */
export default function Logo({ size = 26, showWord = true, color }) {
  const modeContext = useContext(ModeContext);
  const mode = modeContext?.mode || 'user';
  const isSecurity = mode === 'security';

  const accentColor = isSecurity ? 'var(--sec-500, #e11d48)' : 'var(--usr-500, #3b82f6)';
  const c = color || 'currentColor';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, userSelect: 'none' }}>
      {/* Engineered Emblem */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <polygon
          points="20,2 36,11 36,29 20,38 4,29 4,11"
          fill="var(--ink-1, #0a0e17)"
          stroke="var(--ink-4, rgba(255,255,255,0.15))"
          strokeWidth="1.5"
        />
        <path
          d="M20 9L30 15V25L20 31L10 25V15L20 9Z"
          fill="none"
          stroke={accentColor}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="20" r="3.5" fill={accentColor} />
      </svg>

      {showWord && (
        <div
          style={{
            fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
            fontWeight: 700,
            letterSpacing: '0.14em',
            fontSize: size * 0.65,
            color: c,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span>PIICASSO</span>
          <span
            style={{
              display: 'inline-block',
              width: 5,
              height: 5,
              borderRadius: '50%',
              backgroundColor: accentColor,
              marginLeft: 4,
            }}
          />
        </div>
      )}
    </div>
  );
}
