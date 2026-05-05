import React from 'react';

/**
 * ModePill — segmented control for switching between security and user modes.
 * Mode swap rotates the global accent hue (red ↔ blue) via `data-mode` on root.
 */
export default function ModePill({ mode, onChange, compact = false }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        padding: 3,
        borderRadius: 999,
        border: '1px solid var(--ink-5)',
        background: 'var(--ink-2)',
        fontFamily: 'var(--font-mono-v3)',
        fontSize: 11,
      }}
    >
      {[
        ['security', 'Security', 'var(--sec-500)'],
        ['user',     'User',     'var(--usr-500)'],
      ].map(([v, label, color]) => {
        const active = mode === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            style={{
              padding: compact ? '4px 10px' : '6px 14px',
              borderRadius: 999,
              background: active ? color : 'transparent',
              color: active ? 'var(--ink-0)' : 'var(--fg-2)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              transition: 'all 0.18s',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
