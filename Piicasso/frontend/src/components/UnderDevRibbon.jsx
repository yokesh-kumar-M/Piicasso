import React from 'react';

export default function UnderDevRibbon() {
  return (
    <div style={{
      position: 'absolute',
      top: 28,
      right: -36,
      width: 160,
      padding: '5px 0',
      background: 'var(--accent-500)',
      color: '#fff',
      fontSize: 8,
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textAlign: 'center',
      transform: 'rotate(45deg)',
      boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
      pointerEvents: 'none',
      zIndex: 100,
      overflow: 'hidden',
    }}>
      UNDER DEVELOPMENT
    </div>
  );
}
