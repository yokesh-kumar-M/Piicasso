import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

/**
 * Footer — editorial footer for the marketing site.
 * Four column nav, brand block with compliance badges, mono colophon strip.
 */
export default function Footer() {
  const cols = [
    ['Product',   [['Features', '/#features'], ['Pricing', '/#pricing'], ['Docs', '/api'], ['Changelog', '/#changelog']]],
    ['Solutions', [['Security teams', '/#solutions-security'], ['Developers', '/#solutions-dev'], ['Individuals', '/#solutions-ind']]],
    ['Company',   [['About', '/#about'], ['Blog', '/#blog'], ['Contact', '/#contact'], ['Careers', '/#careers']]],
    ['Legal',     [['Privacy', '/#privacy'], ['Terms', '/#terms'], ['Security', '/#security-policy'], ['DPA', '/#dpa']]],
  ];

  return (
    <footer
      style={{
        borderTop: '1px solid var(--ink-4)',
        background: 'var(--ink-1)',
        marginTop: 80,
      }}
    >
      <div
        style={{
          maxWidth: 'var(--max-w)',
          margin: '0 auto',
          padding: '56px var(--gutter) 32px',
        }}
      >
        <div className="v3-footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr repeat(4, 1fr)', gap: 32 }}>
          <div>
            <Logo />
            <p style={{ color: 'var(--fg-2)', fontSize: 13, maxWidth: 260, marginTop: 16, lineHeight: 1.5 }}>
              Wordlist intelligence for the era of leaked PII. Built for red teams. Trusted by everyone else.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <span className="v3-badge"><span className="dot pulse" /> SOC 2 Type II</span>
              <span className="v3-badge">ISO 27001</span>
            </div>
          </div>
          {cols.map(([h, rows]) => (
            <div key={h}>
              <div className="eyebrow" style={{ marginBottom: 14 }}>{h}</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {rows.map(([label, href]) => (
                  <Link
                    key={label}
                    to={href}
                    style={{ textAlign: 'left', color: 'var(--fg-1)', fontSize: 13, textDecoration: 'none' }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <hr className="hairline" style={{ margin: '40px 0 20px' }} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: 'var(--fg-3)',
            fontSize: 12,
            fontFamily: 'var(--font-mono-v3)',
          }}
        >
          <span>© {new Date().getFullYear()} PIICASSO LABS, INC.</span>
          <span>Built in the dark.</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .v3-footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .v3-footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
