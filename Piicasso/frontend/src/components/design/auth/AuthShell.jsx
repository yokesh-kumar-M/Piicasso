import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../Logo';

export default function AuthShell({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--ink-0)',
      padding: '40px 24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'var(--ink-1)',
        border: '1px solid var(--ink-4)',
        borderRadius: 16,
        padding: '40px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', textDecoration: 'none' }}>
            <Logo size={28} />
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
