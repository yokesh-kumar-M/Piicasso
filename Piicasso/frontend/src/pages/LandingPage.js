import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// ─── Minimal inline styles to avoid Tailwind class conflicts ───────────────
const S = {
  page: {
    minHeight: '100vh', background: '#080808', color: '#fff',
    fontFamily: "'Inter', 'Outfit', sans-serif", overflowX: 'hidden',
  },
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 48px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(20px)',
  },
  logo: {
    fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px',
    color: '#fff', textDecoration: 'none',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  logoAccent: { color: '#E11D48' },
  navLinks: { display: 'flex', alignItems: 'center', gap: 32 },
  navLink: {
    color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500,
    textDecoration: 'none', letterSpacing: '0.02em', cursor: 'pointer',
    transition: 'color 0.2s',
  },
  btnOutline: {
    padding: '8px 20px', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 6, fontSize: 13, fontWeight: 600,
    color: '#fff', background: 'transparent', cursor: 'pointer',
    transition: 'all 0.2s', letterSpacing: '0.02em',
  },
  btnPrimary: {
    padding: '8px 20px', background: '#E11D48',
    border: '1px solid #E11D48', borderRadius: 6,
    fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
    transition: 'all 0.2s', letterSpacing: '0.02em',
  },
  hero: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    padding: '120px 24px 80px', position: 'relative',
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 12px', borderRadius: 100,
    border: '1px solid rgba(225,29,72,0.3)',
    background: 'rgba(225,29,72,0.07)', fontSize: 11,
    fontWeight: 600, color: '#E11D48', letterSpacing: '0.08em',
    textTransform: 'uppercase', marginBottom: 32,
  },
  dot: {
    width: 6, height: 6, borderRadius: '50%', background: '#E11D48',
    animation: 'pulse 2s infinite',
  },
  h1: {
    fontSize: 'clamp(42px, 7vw, 88px)', fontWeight: 800,
    lineHeight: 1.0, letterSpacing: '-0.04em', marginBottom: 24,
    color: '#fff',
  },
  h1Red: { color: '#E11D48' },
  sub: {
    fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255,255,255,0.45)',
    maxWidth: 520, lineHeight: 1.65, marginBottom: 48, fontWeight: 400,
  },
  ctaRow: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
  ctaMain: {
    padding: '14px 32px', background: '#E11D48', border: 'none',
    borderRadius: 8, fontSize: 14, fontWeight: 700, color: '#fff',
    cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.02em',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  ctaGhost: {
    padding: '14px 32px', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.02em',
  },
  terminal: {
    marginTop: 80, background: '#0d0d0d',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
    overflow: 'hidden', width: '100%', maxWidth: 640,
    boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(225,29,72,0.1)',
  },
  termBar: {
    padding: '10px 16px', background: '#141414',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  termDot: { width: 10, height: 10, borderRadius: '50%' },
  termBody: {
    padding: '20px 24px', fontFamily: "'Fira Code', monospace",
    fontSize: 13, lineHeight: 1.8, color: 'rgba(255,255,255,0.6)',
    minHeight: 160,
  },
  divider: {
    height: 1, background: 'rgba(255,255,255,0.05)',
    margin: '0 48px',
  },
  section: { padding: '96px 48px', maxWidth: 1100, margin: '0 auto' },
  sectionLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: '#E11D48', marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800,
    letterSpacing: '-0.03em', color: '#fff', marginBottom: 16,
    lineHeight: 1.1,
  },
  sectionSub: {
    fontSize: 15, color: 'rgba(255,255,255,0.4)', maxWidth: 480,
    lineHeight: 1.7, marginBottom: 64,
  },
  modesGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2,
    borderRadius: 12, overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  modeCard: {
    padding: '48px 40px', position: 'relative', overflow: 'hidden',
    cursor: 'pointer', transition: 'all 0.3s',
  },
  modeCardBlue: { background: 'rgba(59,130,246,0.04)' },
  modeCardRed: { background: 'rgba(225,29,72,0.04)' },
  modeIcon: {
    width: 48, height: 48, borderRadius: 12, marginBottom: 24,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22,
  },
  modeTitle: { fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 },
  modeDesc: { fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 24 },
  modeTags: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  modeTag: {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
    padding: '4px 10px', borderRadius: 4, textTransform: 'uppercase',
  },
  featGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1,
  },
  featCard: {
    padding: '36px 32px', background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    transition: 'all 0.3s',
  },
  featIcon: { fontSize: 28, marginBottom: 20 },
  featTitle: { fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.01em' },
  featDesc: { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 1, borderTop: '1px solid rgba(255,255,255,0.05)',
    borderBottom: '1px solid rgba(255,255,255,0.05)', margin: '80px 0',
  },
  statCard: {
    padding: '40px 32px', textAlign: 'center',
    borderLeft: '1px solid rgba(255,255,255,0.05)',
  },
  statNum: { fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', marginBottom: 6 },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 },
  cta: {
    margin: '0 48px 96px', borderRadius: 16,
    background: 'linear-gradient(135deg, rgba(225,29,72,0.12) 0%, rgba(225,29,72,0.04) 100%)',
    border: '1px solid rgba(225,29,72,0.2)',
    padding: '80px 64px', textAlign: 'center', position: 'relative', overflow: 'hidden',
  },
  ctaTitle: {
    fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800,
    letterSpacing: '-0.03em', marginBottom: 16,
  },
  ctaSub: { fontSize: 16, color: 'rgba(255,255,255,0.45)', marginBottom: 40 },
  footer: {
    borderTop: '1px solid rgba(255,255,255,0.05)',
    padding: '32px 48px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  footerText: { fontSize: 12, color: 'rgba(255,255,255,0.25)' },
};

// ─── Typing animation ──────────────────────────────────────────────────────
const LINES = [
  { text: '$ piicasso --target "John Smith" --mode intelligence', color: '#E11D48' },
  { text: '⟳ Initializing Gemini AI engine...', color: 'rgba(255,255,255,0.4)' },
  { text: '⟳ Cross-referencing RockYou database...', color: 'rgba(255,255,255,0.4)' },
  { text: '✓ Generated 847 targeted passwords', color: '#22C55E' },
  { text: '✓ Wordlist ready — jsmith1987, johnny@work, jsmith_admin...', color: '#22C55E' },
  { text: '$ export --format pdf --output threat_report.pdf', color: '#E11D48' },
];

function TerminalAnim() {
  const [lines, setLines] = useState([]);
  const [charIdx, setCharIdx] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    if (lineIdx >= LINES.length) {
      setTimeout(() => { setLines([]); setCharIdx(0); setLineIdx(0); }, 3000);
      return;
    }
    const current = LINES[lineIdx];
    if (charIdx <= current.text.length) {
      const t = setTimeout(() => {
        setLines(prev => {
          const next = [...prev];
          next[lineIdx] = current.text.slice(0, charIdx);
          return next;
        });
        setCharIdx(c => c + 1);
      }, charIdx === 0 ? 400 : 18);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => { setLineIdx(l => l + 1); setCharIdx(0); }, 200);
      return () => clearTimeout(t);
    }
  }, [lineIdx, charIdx]);

  return (
    <div style={S.termBody}>
      {lines.map((line, i) => (
        <div key={i} style={{ color: LINES[i]?.color || '#fff', whiteSpace: 'pre' }}>
          {line}{i === lineIdx && lineIdx < LINES.length ? <span style={{ animation: 'blink 1s infinite', color: '#E11D48' }}>█</span> : ''}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const [hoverBtn, setHoverBtn] = useState(null);

  const go = (path) => navigate(path);

  return (
    <div style={S.page}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes grain {
          0%,100%{transform:translate(0,0)} 10%{transform:translate(-2%,-3%)}
          20%{transform:translate(-4%,2%)} 30%{transform:translate(4%,-1%)}
          40%{transform:translate(-1%,4%)} 50%{transform:translate(3%,-2%)}
          60%{transform:translate(-3%,3%)} 70%{transform:translate(2%,-4%)}
          80%{transform:translate(-2%,1%)} 90%{transform:translate(4%,3%)}
        }
        .land-btn-main:hover { background: #c01639 !important; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(225,29,72,0.4); }
        .land-btn-ghost:hover { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.2) !important; }
        .mode-card:hover { transform: translateY(-4px); }
        .feat-card:hover { background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.1) !important; }
        .nav-link:hover { color: rgba(255,255,255,0.9) !important; }
        .btn-outline:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.25) !important; }
        .btn-primary:hover { background: #c01639 !important; }
        @media (max-width: 768px) {
          .modes-grid { grid-template-columns: 1fr !important; }
          .feat-grid { grid-template-columns: 1fr !important; }
          .stats-row { grid-template-columns: 1fr !important; }
          .section-inner { padding: 64px 24px !important; }
          .cta-inner { margin: 0 24px 64px !important; padding: 48px 32px !important; }
          .footer-inner { flex-direction: column !important; gap: 12px !important; text-align: center !important; }
          .nav-inner { padding: 16px 24px !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={S.nav} className="nav-inner">
        <div style={S.logo}>
          <span style={{ color: '#E11D48', fontFamily: "'Fira Code', monospace" }}>▊</span>
          PII<span style={S.logoAccent}>casso</span>
        </div>
        <div style={S.navLinks} className="hide-mobile">
          <span className="nav-link" style={S.navLink} onClick={() => go('/api')}>Docs</span>
          <span className="nav-link" style={S.navLink}>Security Mode</span>
          <span className="nav-link" style={S.navLink}>User Mode</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAuthenticated ? (
            <button className="btn-primary" style={S.btnPrimary} onClick={() => go('/dashboard')}>Dashboard →</button>
          ) : (
            <>
              <button className="btn-outline" style={S.btnOutline} onClick={() => go('/login')}>Sign In</button>
              <button className="btn-primary" style={S.btnPrimary} onClick={() => go('/register')}>Get Access</button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={S.hero}>
        {/* Noise grain */}
        <div style={{
          position: 'absolute', inset: '-50%', opacity: 0.03, pointerEvents: 'none', zIndex: 0,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          backgroundSize: '200px 200px', animation: 'grain 0.5s steps(1) infinite',
        }} />
        {/* Red glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(225,29,72,0.12) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={S.badge}>
            <span style={S.dot} />
            AI-Powered Security Intelligence
          </div>

          <h1 style={S.h1}>
            Turn PII into<br />
            <span style={S.h1Red}>Attack Intelligence.</span>
          </h1>

          <p style={S.sub}>
            PIIcasso generates hyper-targeted password wordlists from personal data using Gemini AI.
            Built for red teamers, penetration testers, and CTF professionals.
          </p>

          <div style={S.ctaRow}>
            <button
              className="land-btn-main"
              style={S.ctaMain}
              onClick={() => go(isAuthenticated ? '/dashboard' : '/register')}
            >
              Start Free →
            </button>
            <button className="land-btn-ghost" style={S.ctaGhost} onClick={() => go('/api')}>
              View Docs
            </button>
          </div>

          {/* Terminal */}
          <div style={S.terminal}>
            <div style={S.termBar}>
              <div style={{ ...S.termDot, background: '#FF5F56' }} />
              <div style={{ ...S.termDot, background: '#FFBD2E' }} />
              <div style={{ ...S.termDot, background: '#27C93F' }} />
              <span style={{ marginLeft: 8, fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
                piicasso — security mode
              </span>
            </div>
            <TerminalAnim />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div style={{ padding: '0 48px' }}>
        <div style={S.statsRow} className="stats-row">
          {[
            { num: '10K+', label: 'Wordlists Generated' },
            { num: 'Gemini', label: 'AI Engine' },
            { num: '2 Modes', label: 'Security & User' },
          ].map((s, i) => (
            <div key={i} style={S.statCard}>
              <div style={S.statNum}>{s.num}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={S.divider} />

      {/* ── DUAL MODE ── */}
      <div style={S.section} className="section-inner">
        <div style={S.sectionLabel}>Two Modes. One Platform.</div>
        <h2 style={S.sectionTitle}>Built for every context.</h2>
        <p style={S.sectionSub}>
          Switch between Security Mode for offensive research and User Mode for personal password health checks.
        </p>

        <div style={S.modesGrid} className="modes-grid">
          {/* Security Mode */}
          <div
            className="mode-card"
            style={{ ...S.modeCard, ...S.modeCardRed, borderRight: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
            onClick={() => go(isAuthenticated ? '/security/dashboard' : '/register')}
          >
            <div style={{ ...S.modeIcon, background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)' }}>
              ⚔️
            </div>
            <div style={{ ...S.modeTitle, color: '#fff' }}>Security Mode</div>
            <div style={S.modeDesc}>
              Enter target PII. Gemini generates a precision wordlist cross-referenced with RockYou patterns. Export as .txt or PDF threat report.
            </div>
            <div style={S.modeTags}>
              {['Wordlist Gen', 'AI-Powered', 'PDF Reports', 'Rate Limited'].map(t => (
                <span key={t} style={{ ...S.modeTag, background: 'rgba(225,29,72,0.1)', color: '#E11D48', border: '1px solid rgba(225,29,72,0.2)' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* User Mode */}
          <div
            className="mode-card"
            style={{ ...S.modeCard, ...S.modeCardBlue, cursor: 'pointer' }}
            onClick={() => go(isAuthenticated ? '/user/dashboard' : '/register')}
          >
            <div style={{ ...S.modeIcon, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              🛡️
            </div>
            <div style={{ ...S.modeTitle, color: '#fff' }}>User Mode</div>
            <div style={S.modeDesc}>
              Check if your password is PII-derived and dangerously weak. Get a breach count, crack time estimate, and actionable hardening steps.
            </div>
            <div style={S.modeTags}>
              {['Password Health', 'HIBP Check', 'Risk Score', 'Recommendations'].map(t => (
                <span key={t} style={{ ...S.modeTag, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{ ...S.section, paddingTop: 0 }} className="section-inner">
        <div style={S.sectionLabel}>Capabilities</div>
        <h2 style={S.sectionTitle}>Everything you need.</h2>
        <div style={S.featGrid} className="feat-grid">
          {[
            { icon: '🤖', title: 'Gemini AI Core', desc: 'Not brute-force combos — contextually intelligent wordlists that understand human password psychology.' },
            { icon: '📋', title: 'RockYou Crossref', desc: 'Every generated word is cross-checked against the 14M-entry RockYou breach dataset for real-world relevance.' },
            { icon: '📄', title: 'PDF Threat Reports', desc: 'Generate professional security reports ready for client presentations or red team documentation.' },
            { icon: '⚡', title: 'Rate-Limited API', desc: 'Built-in throttling protects against abuse while keeping the tool fast for legitimate security work.' },
            { icon: '👥', title: 'Team Collaboration', desc: 'Create teams, share wordlists, and collaborate on security engagements with role-based access.' },
            { icon: '🌐', title: 'Breach Intelligence', desc: 'Check any email against dark web breach databases via HaveIBeenPwned integration.' },
          ].map((f, i) => (
            <div key={i} className="feat-card" style={S.featCard}>
              <div style={S.featIcon}>{f.icon}</div>
              <div style={S.featTitle}>{f.title}</div>
              <div style={S.featDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={S.cta} className="cta-inner">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(225,29,72,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={S.sectionLabel}>Free. Open. Powerful.</div>
          <h2 style={S.ctaTitle}>Start your first operation.</h2>
          <p style={S.ctaSub}>No credit card. No waitlist. Full access on the free tier.</p>
          <button className="land-btn-main" style={{ ...S.ctaMain, margin: '0 auto', fontSize: 15, padding: '16px 40px' }} onClick={() => go('/register')}>
            Create Free Account →
          </button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={S.footer} className="footer-inner">
        <div style={S.logo}>
          <span style={{ color: '#E11D48', fontFamily: "'Fira Code', monospace" }}>▊</span>
          PII<span style={S.logoAccent}>casso</span>
        </div>
        <div style={S.footerText}>
          For authorized security research only. © {new Date().getFullYear()} PIIcasso
        </div>
        <div style={{ display: 'flex', gap: 24 }} className="hide-mobile">
          <span style={S.footerText}>Privacy</span>
          <span style={{ ...S.footerText, cursor: 'pointer' }} onClick={() => go('/api')}>API Docs</span>
          <span style={S.footerText}>GitHub</span>
        </div>
      </footer>
    </div>
  );
}
