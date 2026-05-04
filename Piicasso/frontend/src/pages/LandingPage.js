import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// ─── Color tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#050507', surface: '#0C0C10', border: 'rgba(255,255,255,0.06)',
  text: '#F2F2F2', muted: 'rgba(255,255,255,0.35)', dim: 'rgba(255,255,255,0.15)',
  red: '#FF1744', redDim: 'rgba(255,23,68,0.12)', redBorder: 'rgba(255,23,68,0.25)',
  blue: '#2979FF', blueDim: 'rgba(41,121,255,0.08)', blueBorder: 'rgba(41,121,255,0.2)',
  green: '#00E676',
};

// ─── Shared styles ───────────────────────────────────────────────────────────
const S = {
  page: { minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Space Grotesk', 'Inter', sans-serif", overflowX: 'hidden' },
  display: { fontFamily: "'Space Grotesk', sans-serif" },
  mono: { fontFamily: "'JetBrains Mono', monospace" },
};

// ─── SVG icons (no emoji, no lucide) ─────────────────────────────────────────
const Icon = {
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Brain: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4c0 .74-.2 1.44-.57 2.04A4 4 0 0 1 18 12a4 4 0 0 1-2 3.46V18a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.54A4 4 0 0 1 6 12a4 4 0 0 1 2.57-3.96A4 4 0 0 1 8 6a4 4 0 0 1 4-4z"/><path d="M12 2v20"/></svg>,
  Download: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Alert: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Globe: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Terminal: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  Arrow: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
};

// ─── Typewriter Terminal ─────────────────────────────────────────────────────
function Typewriter({ lines, delay = 18, loop = true, className = '' }) {
  const [displayed, setDisplayed] = useState([]);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (lineIdx >= lines.length) {
      if (loop) {
        const t = setTimeout(() => { setDisplayed([]); setLineIdx(0); setCharIdx(0); setDone(false); }, 3000);
        return () => clearTimeout(t);
      }
      setDone(true);
      return;
    }
    const current = lines[lineIdx];
    if (charIdx <= current.text.length) {
      const t = setTimeout(() => {
        setDisplayed(prev => { const n = [...prev]; n[lineIdx] = current.text.slice(0, charIdx); return n; });
        setCharIdx(c => c + 1);
      }, charIdx === 0 ? 350 : delay);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setLineIdx(l => l + 1); setCharIdx(0); }, 180);
    return () => clearTimeout(t);
  }, [lineIdx, charIdx, lines, delay, loop]);

  return (
    <div className={className} style={{ ...S.mono, fontSize: 13, lineHeight: 1.8 }}>
      {displayed.map((line, i) => (
        <div key={i} style={{ color: lines[i]?.color || C.text, whiteSpace: 'pre' }}>
          {line}{i === lineIdx && !done ? <span style={{ animation: 'pi-blink 1s infinite', color: C.red }}>▌</span> : ''}
        </div>
      ))}
    </div>
  );
}

// ─── Scroll-triggered fade-in ────────────────────────────────────────────────
function FadeIn({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Interactive Demo Terminal ───────────────────────────────────────────────
function InteractiveDemo({ onAuth }) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState([]);
  const [running, setRunning] = useState(false);
  const inputRef = useRef(null);

  const generateMock = (name) => {
    const n = name.trim();
    if (!n) return [];
    const parts = n.toLowerCase().split(' ');
    const first = parts[0] || 'user';
    const last = parts[1] || '';
    const initials = first[0] + (last ? last[0] : '');
    const years = ['1990', '1985', '2024', '01', '99', '2000'];
    const specials = ['!', '@', '#', '$'];
    const bases = [
      first.toLowerCase(), `${first}${last}`, `${first}_${last}`,
      `${initials}${years[0]}`, `${first}.${last}`, `${first}${specials[0]}${years[1]}`,
      `${last}${years[2]}`, `${first}Admin${years[3]}`, `${initials}_${years[4]}`,
      `${first}${specials[1]}${years[5]}`, `${last}${specials[2]}${years[0]}`,
      `${first}${last}${specials[3]}${years[1]}`,
    ];
    return bases.slice(0, 8).map((w, i) => ({ text: `  ${String(i + 1).padStart(3, '0')}. ${w}`, color: C.muted }));
  };

  const handleSubmit = () => {
    if (!input.trim() || running) return;
    setRunning(true);
    setOutput([
      { text: `$ piicasso --target "${input}"`, color: C.red },
      { text: '⟳ Analyzing target profile...', color: C.muted },
    ]);

    setTimeout(() => {
      const mock = generateMock(input);
      setOutput(prev => [
        ...prev,
        { text: `✓ Generated ${mock.length} password hypotheses`, color: C.green },
        ...mock,
        { text: '', color: C.text },
        { text: 'Create a free account to see real Gemini AI results →', color: C.red },
      ]);
      setRunning(false);
    }, 1200);
  };

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden',
      maxWidth: 720, margin: '0 auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    }}>
      <div style={{ padding: '10px 16px', background: '#0a0a0e', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        {[['#FF5F56'], ['#FFBD2E'], ['#27C93F']].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c[0] }} />)}
        <span style={{ ...S.mono, fontSize: 11, color: C.dim }}>interactive demo</span>
      </div>
      <div style={{ padding: '20px 24px' }}>
        <div style={{ ...S.mono, fontSize: 13, color: C.muted, marginBottom: 12 }}>Enter a name to see mock wordlist generation:</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <span style={{ ...S.mono, color: C.red, fontSize: 14, lineHeight: '40px' }}>$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="John Smith"
            disabled={running}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              ...S.mono, fontSize: 14, color: C.text, caretColor: C.red,
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={running || !input.trim()}
            style={{
              padding: '8px 20px', background: running ? 'transparent' : C.red,
              border: `1px solid ${C.red}`, borderRadius: 6,
              ...S.mono, fontSize: 12, color: running ? C.muted : '#fff',
              cursor: running || !input.trim() ? 'default' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {running ? '...' : 'Generate'}
          </button>
        </div>
        {output.length > 0 && (
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            {output.map((line, i) => (
              <div key={i} style={{ color: line.color, ...S.mono, fontSize: 13, lineHeight: 1.7 }}>
                {line.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Landing Page ───────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const go = (path) => navigate(path);

  // ── Terminal lines ──
  const termLines = [
    { text: '$ piicasso --target "John Smith" --mode intel', color: C.red },
    { text: '⟳ Querying Gemini AI engine...', color: C.muted },
    { text: '⟳ Cross-referencing RockYou 14M...', color: C.muted },
    { text: '✓ 847 password hypotheses generated', color: C.green },
    { text: '✓ Top: jsmith1987, johnny@work, js_admin!', color: C.green },
    { text: '$ export --format pdf --report threat.pdf', color: C.red },
  ];

  // ── Marquee items ──
  const marquee = ['Gemini AI', 'RockYou 14M', 'PDF Reports', 'HIBP Integration', 'Redis Queue', 'REST API', 'JWT Auth', 'Rate Limiting'];

  return (
    <div style={S.page}>
      <style>{`
        @keyframes pi-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pi-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.3)} }
        @keyframes pi-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes pi-scan { 0%{top:-2px} 100%{top:100%} }
        @keyframes pi-gradient { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .pi-nav-link:hover { color: ${C.text} !important; }
        .pi-btn:hover { transform: translateY(-2px); }
        .pi-btn-red:hover { background: #d50032 !important; box-shadow: 0 8px 32px rgba(255,23,68,0.35); }
        .pi-btn-ghost:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.15) !important; }
        .pi-card:hover { background: rgba(255,255,255,0.03) !important; border-color: rgba(255,255,255,0.1) !important; }
        .pi-mode-security:hover { background: rgba(255,23,68,0.08) !important; }
        .pi-mode-user:hover { background: rgba(41,121,255,0.08) !important; }
        @media (max-width: 900px) {
          .pi-hero-grid { grid-template-columns: 1fr !important; }
          .pi-hero-right { display: none !important; }
          .pi-split { grid-template-columns: 1fr !important; }
          .pi-bento { grid-template-columns: 1fr !important; }
          .pi-bento-big { grid-row: auto !important; }
          .pi-hide-sm { display: none !important; }
          .pi-section { padding-left: 20px !important; padding-right: 20px !important; }
        }
      `}</style>

      {/* ═══════════════════════════════════════════ NAVBAR ════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 60,
        background: scrolled ? 'rgba(5,5,7,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ ...S.display, fontSize: 20, fontWeight: 900, letterSpacing: '-0.04em', cursor: 'pointer' }} onClick={() => go('/')}>
          P<span style={{ color: C.red }}>II</span>CASSO
        </div>
        <div className="pi-hide-sm" style={{ display: 'flex', gap: 32 }}>
          {['Docs', 'Features'].map(l => (
            <span key={l} className="pi-nav-link" style={{ fontSize: 13, color: C.muted, cursor: 'pointer', transition: 'color 0.15s', fontWeight: 500 }}
              onClick={() => l === 'Docs' ? go('/api') : null}>{l}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAuthenticated ? (
            <button className="pi-btn pi-btn-red" style={{ padding: '7px 18px', background: C.red, border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'all 0.15s' }} onClick={() => go('/dashboard')}>Dashboard</button>
          ) : (
            <>
              <button className="pi-btn pi-btn-ghost" style={{ padding: '7px 18px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontWeight: 500, color: C.text, cursor: 'pointer', transition: 'all 0.15s' }} onClick={() => go('/login')}>Sign In</button>
              <button className="pi-btn pi-btn-red" style={{ padding: '7px 18px', background: C.red, border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'all 0.15s' }} onClick={() => go('/register')}>Get Access →</button>
            </>
          )}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════ HERO ═════════════════════ */}
      <section style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 440px', alignItems: 'center', padding: '100px 48px 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />
        {/* Red blob — top right */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 600, height: 600, background: 'radial-gradient(circle, rgba(255,23,68,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        {/* Blue blob — bottom left */}
        <div style={{ position: 'absolute', bottom: -150, left: -150, width: 600, height: 600, background: 'radial-gradient(circle, rgba(41,121,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        {/* Scanline */}
        <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'rgba(255,23,68,0.04)', animation: 'pi-scan 4s linear infinite', pointerEvents: 'none' }} />

        {/* LEFT: Copy */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <FadeIn delay={0}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, border: `1px solid ${C.redBorder}`, background: C.redDim, fontSize: 11, fontWeight: 700, color: C.red, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 32 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.red, animation: 'pi-pulse 2s infinite' }} />
              Red Team Tool
            </div>
          </FadeIn>

          <h1 style={{ ...S.display, fontSize: 'clamp(48px, 6.5vw, 88px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.04em', marginBottom: 24 }}>
            <FadeIn delay={0.15}>Your target's name</FadeIn>
            <br />
            <FadeIn delay={0.25}>is their</FadeIn>
            <span style={{ color: C.red }}> password.</span>
          </h1>

          <FadeIn delay={0.4}>
            <p style={{ fontSize: 18, color: C.muted, maxWidth: 460, lineHeight: 1.65, marginBottom: 40, fontWeight: 400 }}>
              PIIcasso turns personal data into precision wordlists using Gemini AI + RockYou patterns. Built for authorized penetration testing.
            </p>
          </FadeIn>

          <FadeIn delay={0.5}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
              <button className="pi-btn pi-btn-red" style={{ padding: '14px 32px', background: C.red, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8 }}
                onClick={() => go(isAuthenticated ? '/dashboard' : '/register')}>
                Start Free <Icon.Arrow />
              </button>
              <button className="pi-btn pi-btn-ghost" style={{ padding: '14px 32px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontWeight: 500, color: C.muted, cursor: 'pointer', transition: 'all 0.15s' }}
                onClick={() => go('/api')}>
                Docs
              </button>
            </div>
          </FadeIn>

          <FadeIn delay={0.6}>
            <p style={{ fontSize: 12, color: C.dim, maxWidth: 320, lineHeight: 1.6 }}>
              ✦ For authorized penetration testing and CTF use only.
            </p>
          </FadeIn>
        </div>

        {/* RIGHT: Terminal + floating badge */}
        <div className="pi-hero-right" style={{ position: 'relative', zIndex: 1, paddingLeft: 40 }}>
          <div style={{ background: '#0a0a0e', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,23,68,0.08)' }}>
            <div style={{ padding: '10px 16px', background: '#0d0d11', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              {['#FF5F56', '#FFBD2E', '#27C93F'].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
              <span style={{ ...S.mono, fontSize: 11, color: C.dim }}>piicasso — security mode</span>
            </div>
            <div style={{ padding: '20px 24px', minHeight: 180 }}>
              <Typewriter lines={termLines} />
            </div>
          </div>
          {/* Floating badge */}
          <div style={{
            position: 'absolute', bottom: -20, right: -20,
            background: C.red, borderRadius: 8, padding: '10px 18px',
            ...S.mono, fontSize: 13, fontWeight: 700, color: '#fff',
            boxShadow: '0 8px 32px rgba(255,23,68,0.4)',
            animation: 'pi-blink 3s infinite',
          }}>
            847 words
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ SOCIAL PROOF MARQUEE ═════════════ */}
      <div style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '16px 0', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 120, background: `linear-gradient(to right, ${C.bg}, transparent)`, zIndex: 1 }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 120, background: `linear-gradient(to left, ${C.bg}, transparent)`, zIndex: 1 }} />
        <div style={{ display: 'flex', gap: 48, animation: 'pi-scroll 30s linear infinite', width: 'max-content' }}>
          {[...marquee, ...marquee, ...marquee, ...marquee].map((item, i) => (
            <span key={i} style={{ ...S.mono, fontSize: 12, color: C.dim, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>{item}</span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════ SPLIT: TWO MODES ═════════════════ */}
      <section className="pi-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: `1px solid ${C.border}`, position: 'relative' }}>
        {/* Glowing center divider */}
        <div style={{
          position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, zIndex: 2,
          background: C.border, transform: 'translateX(-50%)',
        }} />

        {/* Security */}
        <FadeIn delay={0} style={{ padding: '80px 48px', background: 'rgba(255,23,68,0.02)', borderRight: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden', transition: 'all 0.3s' }}>
          <div style={{ position: 'absolute', top: 40, right: -20, ...S.display, fontSize: 120, fontWeight: 900, color: C.dim, opacity: 0.06, pointerEvents: 'none', lineHeight: 1 }}>SEC</div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ ...S.mono, fontSize: 11, color: C.red, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>Security Mode</div>
            <h2 style={{ ...S.display, fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>For red teamers.</h2>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 32, maxWidth: 360 }}>
              Enter target PII. Gemini generates precision wordlists cross-referenced with RockYou. Export as .txt or PDF threat report.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {['AI wordlist generation', 'RockYou 14M cross-reference', 'PDF threat reports', 'Rate-limited API'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.text }}>
                  <span style={{ color: C.red }}><Icon.Check /></span>{f}
                </div>
              ))}
            </div>
            <button className="pi-btn pi-btn-red" style={{ padding: '12px 24px', background: C.red, border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={() => go(isAuthenticated ? '/security/dashboard' : '/register')}>
              Enter Security Mode <Icon.Arrow />
            </button>
          </div>
        </FadeIn>

        {/* User */}
        <FadeIn delay={0.1} style={{ padding: '80px 48px', background: 'rgba(41,121,255,0.02)', position: 'relative', overflow: 'hidden', transition: 'all 0.3s' }}>
          <div style={{ position: 'absolute', top: 40, right: -20, ...S.display, fontSize: 120, fontWeight: 900, color: C.dim, opacity: 0.06, pointerEvents: 'none', lineHeight: 1 }}>USR</div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ ...S.mono, fontSize: 11, color: C.blue, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>User Mode</div>
            <h2 style={{ ...S.display, fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>For everyone.</h2>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 32, maxWidth: 360 }}>
              Check if your password is PII-derived and dangerously weak. Get breach count, crack time estimate, and hardening steps.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {['Password breach check', 'Crack time estimate', 'PII weakness detection', 'Fix recommendations'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.text }}>
                  <span style={{ color: C.blue }}><Icon.Check /></span>{f}
                </div>
              ))}
            </div>
            <button className="pi-btn" style={{ padding: '12px 24px', background: C.blue, border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={() => go(isAuthenticated ? '/user/dashboard' : '/register')}>
              Check My Password <Icon.Arrow />
            </button>
          </div>
        </FadeIn>
      </section>

      {/* Mode split keyboard hint */}
      <div style={{ textAlign: 'center', padding: '12px 0', borderTop: `1px solid ${C.border}`, background: C.surface }}>
        <span style={{ ...S.mono, fontSize: 11, color: C.dim, letterSpacing: '0.05em' }}>
          ← User <span style={{ color: C.border }}>|</span> Security →
        </span>
      </div>

      {/* ═══════════════════════════════════ HOW IT WORKS ═════════════════════ */}
      <section className="pi-section" style={{ padding: '96px 48px', maxWidth: 900, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ ...S.mono, fontSize: 11, color: C.red, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>How It Works</div>
          <h2 style={{ ...S.display, fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 64 }}>Three steps. That's it.</h2>
        </FadeIn>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, position: 'relative' }}>
          {/* Connector line */}
          <div style={{ position: 'absolute', top: 28, left: '16%', right: '16%', height: 1, background: C.border, zIndex: 0 }} />

          {[
            { step: '01', title: 'Input', desc: 'Enter what you know — name, DOB, hometown, pet names.', icon: <Icon.Users /> },
            { step: '02', title: 'Generate', desc: 'Gemini AI constructs password hypotheses from human patterns.', icon: <Icon.Brain /> },
            { step: '03', title: 'Export', desc: 'Get a ranked .txt wordlist or PDF threat report for delivery.', icon: <Icon.Download /> },
          ].map((item, i) => (
            <FadeIn key={i} delay={i * 0.1} style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: C.surface, border: `1px solid ${C.border}`, marginBottom: 20, color: C.red,
                }}>
                  {item.icon}
                </div>
                <div style={{ ...S.mono, fontSize: 10, color: C.dim, letterSpacing: '0.1em', marginBottom: 8 }}>{item.step}</div>
                <div style={{ ...S.display, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, maxWidth: 220 }}>{item.desc}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════ BENTO FEATURES ═══════════════════ */}
      <section className="pi-section" style={{ padding: '0 48px 96px', maxWidth: 1100, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ ...S.mono, fontSize: 11, color: C.red, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>Capabilities</div>
          <h2 style={{ ...S.display, fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 48 }}>Everything you need.</h2>
        </FadeIn>

        <div className="pi-bento" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 1, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}` }}>
          {/* Big card: Gemini AI */}
          <FadeIn delay={0} className="pi-bento-big" style={{ padding: '48px 40px', background: C.surface, gridRow: 'span 2' }}>
            <div style={{ color: C.red, marginBottom: 16 }}><Icon.Brain /></div>
            <div style={{ ...S.display, fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Gemini AI Core</div>
            <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>Not brute-force combos — contextually intelligent wordlists that understand how humans actually create passwords.</div>
            <div style={{ background: '#0a0a0e', borderRadius: 8, padding: '16px 20px', border: `1px solid ${C.border}` }}>
              <div style={{ ...S.mono, fontSize: 11, color: C.dim, marginBottom: 8 }}>Sample output:</div>
              {['jsmith1987', 'johnny@work', 'js_admin!', 'smith_01', 'john#2024'].map((w, i) => (
                <div key={i} style={{ ...S.mono, fontSize: 12, color: C.muted, padding: '2px 0' }}>{String(i + 1).padStart(2, '0')}. {w}</div>
              ))}
            </div>
          </FadeIn>

          {/* Small cards */}
          {[
            { icon: <Icon.Download />, title: 'PDF Reports', desc: 'Professional threat reports ready for client delivery.' },
            { icon: <Icon.Globe />, title: 'Breach Intelligence', desc: 'HIBP integration for dark web breach checks.' },
            { icon: <Icon.Shield />, title: 'RockYou Crossref', desc: '14M-entry breach dataset cross-reference.' },
            { icon: <Icon.Users />, title: 'Team Access', desc: 'Role-based collaboration for security engagements.' },
            { icon: <Icon.Alert />, title: 'Rate-Limited API', desc: 'Built-in throttling protects against abuse.' },
          ].map((f, i) => (
            <FadeIn key={i} delay={i * 0.05} className="pi-card" style={{ padding: '32px 28px', background: C.surface, transition: 'all 0.2s' }}>
              <div style={{ color: C.red, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ ...S.display, fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{f.desc}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════ INTERACTIVE DEMO ═════════════════ */}
      <section className="pi-section" style={{ padding: '80px 48px 96px', textAlign: 'center' }}>
        <FadeIn>
          <div style={{ ...S.mono, fontSize: 11, color: C.red, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Icon.Terminal /> Try It Now
          </div>
          <h2 style={{ ...S.display, fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>See it in action.</h2>
          <p style={{ fontSize: 15, color: C.muted, maxWidth: 440, lineHeight: 1.6, margin: '0 auto 48px' }}>
            Type a name below to see how PIIcasso would generate password hypotheses. No account needed.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <InteractiveDemo />
        </FadeIn>

        <FadeIn delay={0.3}>
          <p style={{ marginTop: 32, fontSize: 14, color: C.muted }}>
            See real Gemini AI results — <span style={{ color: C.red, cursor: 'pointer', fontWeight: 600 }} onClick={() => go('/register')}>create a free account</span>
          </p>
        </FadeIn>
      </section>

      {/* ═══════════════════════════════════ CTA ══════════════════════════════ */}
      <section className="pi-section" style={{ margin: '0 48px 96px', borderRadius: 16, overflow: 'hidden', position: 'relative', textAlign: 'center', padding: '80px 48px', border: `1px solid ${C.redBorder}`, background: 'linear-gradient(135deg, rgba(255,23,68,0.08) 0%, rgba(5,5,7,0.95) 60%)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(270deg, rgba(255,23,68,0.06), rgba(255,23,68,0.02), rgba(255,23,68,0.06))', backgroundSize: '200% 100%', animation: 'pi-gradient 6s ease infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <FadeIn>
            <h2 style={{ ...S.display, fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1.05 }}>
              Stop guessing.<br />Start generating.
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p style={{ fontSize: 16, color: C.muted, marginBottom: 40 }}>Free account. No card. Full access.</p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <button className="pi-btn pi-btn-red" style={{ padding: '16px 40px', background: C.red, border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer', transition: 'all 0.15s' }}
              onClick={() => go('/register')}>
              Create Free Account →
            </button>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p style={{ marginTop: 24, fontSize: 12, color: C.dim }}>For authorized security research only.</p>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════ FOOTER ═══════════════════════════ */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '32px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ ...S.display, fontSize: 16, fontWeight: 900, letterSpacing: '-0.02em' }}>
            P<span style={{ color: C.red }}>II</span>CASSO
          </div>
          <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>Security research tool.</div>
        </div>
        <div className="pi-hide-sm" style={{ display: 'flex', gap: 32 }}>
          {['Docs', 'API', 'GitHub'].map(l => (
            <span key={l} className="pi-nav-link" style={{ fontSize: 13, color: C.dim, cursor: 'pointer', transition: 'color 0.15s' }}
              onClick={() => l === 'Docs' || l === 'API' ? go('/api') : null}>{l}</span>
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.dim }}>© {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
}
