import React from 'react';

/** Divider — horizontal rule with a centered label, for auth flows. */
export default function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <hr className="hairline" style={{ flex: 1 }} />
      <span
        style={{
          fontFamily: 'var(--font-mono-v3)',
          fontSize: 10,
          color: 'var(--fg-3)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <hr className="hairline" style={{ flex: 1 }} />
    </div>
  );
}
