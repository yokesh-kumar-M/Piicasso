import React from 'react';

/**
 * Section — page section wrapper with consistent max-width + gutter.
 * Use for marketing-page sections; defaults to 96px vertical padding.
 */
export default function Section({ children, id, style, className }) {
  return (
    <section
      id={id}
      className={className}
      style={{
        maxWidth: 'var(--max-w)',
        margin: '0 auto',
        padding: '96px var(--gutter)',
        ...style,
      }}
    >
      {children}
    </section>
  );
}
