import React from 'react';
import DesignAppShell from '../components/design/dashboard/DesignAppShell.jsx';

export default function LearnPage() {
  return (
    <DesignAppShell activeKey="learn">
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '60vh', textAlign: 'center',
        padding: '48px 24px',
      }}>
        <div className="eyebrow" style={{ color: 'var(--accent-500)', marginBottom: 16 }}>
          ● LEARNING HUB
        </div>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 700,
          letterSpacing: '-0.03em', marginBottom: 20,
        }}>
          Coming Soon
        </h1>
        <p style={{ color: 'var(--fg-2)', fontSize: 16, maxWidth: 480, lineHeight: 1.6 }}>
          Guides, tutorials, and deep-dives on password security, PII exposure,
          and how PIIcasso thinks about cracking. Check back soon.
        </p>
        <div style={{
          marginTop: 40, padding: '10px 20px',
          background: 'var(--ink-2)', border: '1px solid var(--ink-4)',
          borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--fg-3)',
        }}>
          // status: under_construction
        </div>
      </div>
    </DesignAppShell>
  );
}
