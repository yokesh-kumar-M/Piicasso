import React from 'react';

/** Field — labeled input for auth forms. */
export default function Field({ label, type = 'text', value, onChange, placeholder, rightLink, autoComplete, name }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono-v3)',
            fontSize: 11,
            color: 'var(--fg-3)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        {rightLink}
      </div>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          width: '100%',
          padding: '12px 14px',
          background: 'var(--ink-1)',
          border: '1px solid var(--ink-5)',
          borderRadius: 8,
          color: 'var(--fg-0)',
          outline: 'none',
          fontSize: 14,
          fontFamily: 'var(--font-sans-v3)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--accent-500)';
          e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--ink-5)';
          e.target.style.boxShadow = 'none';
        }}
      />
    </label>
  );
}
