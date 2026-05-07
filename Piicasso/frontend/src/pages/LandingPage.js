import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModeContext } from '../context/ModeContext';
import MarketingNav from '../components/design/MarketingNav';
import Footer from '../components/design/Footer';
import Reveal from '../components/design/Reveal';
import Section from '../components/design/Section';
import { detectEntities, redactText, scorePassword, generateWordlist } from '../lib/piiEngine';

const HERO = {
  security: {
    eyebrow: '● SECURITY MODE',
    headline: 'Attack surface mapped.',
    accentLine: 'Credentials ready.',
    sub: 'Offensive security tooling for red teams and security analysts. Generate targeted wordlists from real PII exposure data.',
    ctaLabel: 'Launch operation',
    ctaPath: '/register',
  },
  user: {
    eyebrow: '● USER MODE',
    headline: 'Your password',
    accentLine: "isn't yours anymore.",
    sub: 'PIIcasso detects your leaked personal data and generates the wordlist that could crack you — before someone else does.',
    ctaLabel: 'Check my password',
    ctaPath: '/register',
  },
};

/* ─── RedactToken helper ─────────────────────────────────────── */
function RedactToken({ children, label }) {
  return (
    <span style={{ position: 'relative', display: 'inline' }}>
      <span className="redact">{children}</span>
      <sup style={{
        fontFamily: 'var(--font-mono)', fontSize: 9,
        color: 'var(--accent-400)', marginLeft: 2, verticalAlign: 'super'
      }}>{label}</sup>
    </span>
  );
}

/* ─── colorize helper for ApiSnippet ────────────────────────── */
function colorize(code) {
  const KW  = /\b(import|from|const|let|await|if|throw|new|return|async|function)\b/g;
  const STR = /"[^"]*"|'[^']*'|`[^`]*`/g;
  const COM = /\/\/[^\n]*/g;
  const NUM = /\b\d+\b/g;
  let nodes = [{ t: code }];
  const apply = (re, color) => {
    const next = [];
    for (const n of nodes) {
      if (n.c) { next.push(n); continue; }
      let last = 0; let m;
      const txt = n.t;
      const r = new RegExp(re.source, re.flags);
      while ((m = r.exec(txt)) !== null) {
        if (m.index > last) next.push({ t: txt.slice(last, m.index) });
        next.push({ t: m[0], c: color });
        last = m.index + m[0].length;
      }
      if (last < txt.length) next.push({ t: txt.slice(last) });
    }
    nodes = next;
  };
  apply(COM, 'var(--fg-3)');
  apply(STR, 'var(--accent-400)');
  apply(KW,  'var(--usr-400, #7aa2f7)');
  apply(NUM, 'var(--good)');
  return nodes.map((n, i) =>
    n.c ? <span key={i} style={{ color: n.c }}>{n.t}</span> : <span key={i}>{n.t}</span>
  );
}

/* ─── HeroDemo ───────────────────────────────────────────────── */
function HeroDemo() {
  const samples = [
    "From: alex.chen@northwind.io  •  555-410-9882  •  DOB 03/14/1991\nSubject: account recovery — last 4 of SSN ending 4421\nNote: shipping to 1247 Mission St, San Francisco, 94103",
    "User Maria Lopez — phone (415) 555-0192 — card 4242 4242 4242 4242\nLast login from 192.168.42.7 at 02:14 UTC. Address: 88 Spear Street.",
    "Hi Dr. Jordan Lee, your appointment 09/22/2025 — confirmation jordan.lee@hospital.org\nID 123-45-6789. Pickup at 4501 Wilshire Blvd, ZIP 90010."
  ];
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState('');
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    setShown('');
    setScanning(true);
    const target = samples[idx];
    let i = 0;
    const t = setInterval(() => {
      i += 2;
      setShown(target.slice(0, i));
      if (i >= target.length) {
        clearInterval(t);
        setTimeout(() => setScanning(false), 400);
        setTimeout(() => setIdx(x => (x + 1) % samples.length), 5400);
      }
    }, 14);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const entities = useMemo(() => detectEntities(shown), [shown]);
  const segments = useMemo(() => redactText(shown, entities), [shown, entities]);

  return (
    <div style={{
      maxWidth: 980, margin: '0 auto',
      borderRadius: 16,
      background: 'var(--ink-2)',
      border: '1px solid var(--ink-5)',
      boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset',
      overflow: 'hidden'
    }}>
      {/* Window chrome */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid var(--ink-4)',
        background: 'var(--ink-1)'
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#ff5f56', '#ffbd2e', '#27c93f'].map(c =>
            <span key={c} style={{ width: 10, height: 10, borderRadius: 5, background: c, opacity: 0.55 }} />
          )}
        </div>
        <div style={{
          marginLeft: 16,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--fg-3)', letterSpacing: '0.04em'
        }}>
          piicasso.ingest <span style={{ color: 'var(--fg-4)' }}>—</span> live stream
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="dot pulse" style={{ background: scanning ? 'var(--accent-500)' : 'var(--good)' }} />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: scanning ? 'var(--accent-500)' : 'var(--good)'
          }}>
            {scanning ? 'scanning…' : `${entities.length} entities classified`}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', minHeight: 280 }} className="hero-demo-grid">
        {/* Left: redacted stream */}
        <div style={{
          padding: '24px 28px',
          fontFamily: 'var(--font-mono)', fontSize: 14,
          lineHeight: 1.7, whiteSpace: 'pre-wrap',
          color: 'var(--fg-1)',
          borderRight: '1px solid var(--ink-4)'
        }}>
          {segments.map((s, i) =>
            s.kind === 'redact'
              ? <RedactToken key={i} label={s.label}>{s.text}</RedactToken>
              : <span key={i}>{s.text}</span>
          )}
          <span style={{
            display: 'inline-block', width: 8, height: 16,
            background: 'var(--accent-500)', verticalAlign: 'text-bottom',
            marginLeft: 2, animation: 'cursor-blink 1s infinite'
          }} />
        </div>

        {/* Right: entity list */}
        <div style={{ padding: '24px 28px', background: 'var(--ink-1)' }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Classified entities</div>
          <div style={{ display: 'grid', gap: 8, maxHeight: 240, overflow: 'hidden' }}>
            {entities.length === 0 && (
              <div style={{ color: 'var(--fg-3)', fontSize: 13 }}>Awaiting input…</div>
            )}
            {entities.map((e, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'var(--ink-2)',
                border: '1px solid var(--ink-4)',
                borderRadius: 6,
                fontFamily: 'var(--font-mono)', fontSize: 12
              }}>
                <span style={{ color: 'var(--fg-2)' }}>{e.label.toUpperCase()}</span>
                <span style={{ color: 'var(--accent-500)' }}>●</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Hero ───────────────────────────────────────────────────── */
function Hero() {
  const navigate = useNavigate();
  const { mode } = useContext(ModeContext);
  const hero = HERO[mode] || HERO.user;
  return (
    <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--ink-4)' }}>
      <div className="grid-bg" style={{
        position: 'absolute', inset: 0, opacity: 0.4,
        maskImage: 'radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)'
      }} />
      <div style={{
        position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 800, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        maxWidth: 'var(--max-w)', margin: '0 auto',
        padding: '80px var(--gutter) 120px',
        position: 'relative', textAlign: 'center'
      }}>
        <div className="eyebrow fade-up" style={{ color: 'var(--accent-500)', marginBottom: 16 }}>{hero.eyebrow}</div>

        <h1 className="fade-up" style={{
          fontSize: 'clamp(40px, 6vw, 72px)',
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
        }}>
          {hero.headline}{' '}
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, color: 'var(--accent-500)' }}>
            {hero.accentLine}
          </span>
        </h1>

        <p className="fade-up" style={{
          color: 'var(--fg-2)',
          fontSize: 19,
          maxWidth: 620,
          margin: '28px auto 0',
          lineHeight: 1.5,
          animationDelay: '.1s',
        }}>
          {hero.sub}
        </p>

        <div className="fade-up" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          marginTop: 36,
          flexWrap: 'wrap',
          animationDelay: '.15s',
        }}>
          <button
            onClick={() => navigate(hero.ctaPath)}
            className="btn btn-accent"
            style={{ padding: '14px 22px', fontSize: 14 }}
          >
            {hero.ctaLabel} <span style={{ opacity: 0.6 }}>→</span>
          </button>
          <button
            onClick={() => navigate('/api')}
            className="btn btn-ghost"
            style={{ padding: '14px 22px', fontSize: 14 }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.6 }}>$</span> Read the docs
          </button>
        </div>

        <div className="fade-up" style={{ marginTop: 80, animationDelay: '.25s' }}>
          <HeroDemo />
        </div>
      </div>
    </section>
  );
}

/* ─── LogoWall ───────────────────────────────────────────────── */
function LogoWall() {
  const logos = ['NORTHWIND', 'AXIOM', 'HELIX', 'MERIDIAN', 'BLACKBIRD', 'QUANTA', 'STRATUM', 'CYPHERON'];
  return (
    <Section style={{ padding: '48px var(--gutter)' }}>
      <div className="eyebrow" style={{ textAlign: 'center', marginBottom: 28 }}>
        Trusted by security teams shipping in production
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)',
        gap: 24, opacity: 0.7
      }} className="logo-wall-grid">
        {logos.map(l => (
          <div key={l} style={{
            fontFamily: 'var(--font-mono)', fontSize: 12,
            letterSpacing: '0.18em', textAlign: 'center',
            color: 'var(--fg-2)', padding: '12px 0',
            borderTop: '1px solid var(--ink-4)',
            borderBottom: '1px solid var(--ink-4)'
          }}>{l}</div>
        ))}
      </div>
    </Section>
  );
}

/* ─── ModePanel ──────────────────────────────────────────────── */
function ModePanel({ tone, eyebrow, title, desc, stat, statLabel, cta, onCta, accentVar }) {
  return (
    <div style={{
      padding: '48px 40px 40px',
      background: tone === 'security' ? 'var(--ink-1)' : 'var(--ink-2)',
      borderRight: tone === 'security' ? '1px solid var(--ink-4)' : 'none',
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 240, height: 240, borderRadius: '50%',
        background: `radial-gradient(circle, color-mix(in oklab, var(${accentVar}) 30%, transparent) 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />
      <div className="eyebrow" style={{ color: `var(${accentVar})`, marginBottom: 16 }}>● {eyebrow}</div>
      <h3 className="h-display" style={{ fontSize: 36, marginBottom: 16 }}>{title}</h3>
      <p style={{ color: 'var(--fg-2)', maxWidth: 420, marginBottom: 32 }}>{desc}</p>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 12,
        paddingBottom: 24, borderBottom: '1px solid var(--ink-4)'
      }}>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 64,
          fontWeight: 500, letterSpacing: '-0.04em',
          color: `var(${accentVar})`, lineHeight: 1
        }}>{stat}</div>
        <div style={{ color: 'var(--fg-2)', fontSize: 13, maxWidth: 160 }}>{statLabel}</div>
      </div>
      <button
        onClick={onCta}
        style={{
          marginTop: 24, padding: '12px 18px',
          background: `var(${accentVar})`,
          color: 'var(--ink-0)', border: 'none',
          borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', transition: 'opacity .15s'
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        {cta} →
      </button>
    </div>
  );
}

/* ─── SplitModes ─────────────────────────────────────────────── */
function SplitModes() {
  const navigate = useNavigate();
  const { switchMode } = useContext(ModeContext);
  return (
    <Section>
      <div className="eyebrow" style={{ marginBottom: 16 }}>One platform, two perspectives</div>
      <h2 className="h-display" style={{ fontSize: 'clamp(36px, 5vw, 56px)', maxWidth: 720, marginBottom: 40 }}>
        Same password.<br />
        <span style={{ color: 'var(--fg-3)' }}>Two very different conclusions.</span>
      </h2>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        border: '1px solid var(--ink-4)', borderRadius: 16, overflow: 'hidden'
      }} className="split-modes-grid">
        <ModePanel
          tone="security"
          eyebrow="Security mode"
          title="See like an attacker."
          desc="Profile a target. Generate a hyper-personal wordlist. Run it through your engine. Watch which credentials fall first."
          stat="9.4s"
          statLabel="median time to crack with profile"
          cta="Open Mission Control"
          onCta={() => { switchMode('security'); navigate('/login'); }}
          accentVar="--sec-500"
        />
        <ModePanel
          tone="user"
          eyebrow="User mode"
          title="Defend like a target."
          desc="See your password through the eyes of someone who just bought your data on the dark web. No jargon. Just a number, and what to fix."
          stat="0–100"
          statLabel="resilience score, in plain English"
          cta="Check my password"
          onCta={() => { switchMode('user'); navigate('/login'); }}
          accentVar="--usr-500"
        />
      </div>
    </Section>
  );
}

/* ─── FeatureGrid ────────────────────────────────────────────── */
function FeatureGrid() {
  const features = [
    { eb: '01', t: 'Profile-aware mutation', d: 'Combine names, dates, places, pets, employers, ZIPs into millions of plausible candidates ranked by likelihood.' },
    { eb: '02', t: 'Threat intel visualization', d: 'A 3D Mission Control surface that lights up the relationships between leaked records and weak credentials.' },
    { eb: '03', t: 'Policy enforcement at scale', d: 'Drop our SDK into auth flows. Reject passwords that contain the user\'s own PII before they ever ship.' },
    { eb: '04', t: 'Air-gapped & on-prem', d: 'Run the engine entirely inside your VPC. Nothing leaves. Nothing phones home.' },
    { eb: '05', t: 'Streaming detection', d: 'Sub-millisecond classification across 14 entity types. PCRE-clean. Unicode-safe.' },
    { eb: '06', t: 'Open audit trail', d: 'Every detection, every redaction, every rejected password — cryptographically signed and exportable.' },
  ];
  return (
    <Section>
      <div className="eyebrow" style={{ marginBottom: 16 }}>The full stack</div>
      <h2 className="h-display" style={{ fontSize: 'clamp(36px, 5vw, 56px)', maxWidth: 720, marginBottom: 56 }}>
        Built like infrastructure.<br />
        <span style={{ color: 'var(--fg-3)' }}>Used like a paintbrush.</span>
      </h2>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        border: '1px solid var(--ink-4)', borderRadius: 12, overflow: 'hidden'
      }} className="feature-grid">
        {features.map((f, i) => (
          <div
            key={f.t}
            style={{
              padding: '32px 28px',
              borderRight: (i + 1) % 3 !== 0 ? '1px solid var(--ink-4)' : 'none',
              borderBottom: i < 3 ? '1px solid var(--ink-4)' : 'none',
              background: 'var(--ink-1)',
              transition: 'background .2s, transform .3s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--ink-2)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--ink-1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-500)', marginBottom: 12 }}>// {f.eb}</div>
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 10, letterSpacing: '-0.01em' }}>{f.t}</div>
            <div style={{ color: 'var(--fg-2)', fontSize: 14, lineHeight: 1.55 }}>{f.d}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ─── LiveDemo ───────────────────────────────────────────────── */
function LiveDemo() {
  const [profile, setProfile] = useState({ name: 'Alex Chen', year: '1991', pet: 'mochi', city: 'boston' });
  const [pw, setPw] = useState('Alex1991!');
  const result = useMemo(() => scorePassword(pw, profile), [pw, profile]);
  const wordlist = useMemo(() => generateWordlist(profile, 12), [profile]);
  const cracked = wordlist.includes(pw) || wordlist.some(w => pw.toLowerCase().startsWith(w.toLowerCase()));

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: 'var(--ink-3)', border: '1px solid var(--ink-5)',
    borderRadius: 6, color: 'var(--fg-0)', outline: 'none',
    fontFamily: 'var(--font-mono)', fontSize: 13, boxSizing: 'border-box'
  };

  return (
    <Section>
      <div className="eyebrow" style={{ marginBottom: 16 }}>Try it</div>
      <h2 className="h-display" style={{ fontSize: 'clamp(36px, 5vw, 56px)', maxWidth: 800, marginBottom: 16 }}>
        Type a password. Watch us guess it.
      </h2>
      <p style={{ color: 'var(--fg-2)', fontSize: 17, maxWidth: 620, marginBottom: 48 }}>
        Edit the profile. Edit the password. Our engine generates a tailored wordlist in real time —
        and tells you exactly why it would (or wouldn't) crack you.
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1.4fr',
        background: 'var(--ink-1)', border: '1px solid var(--ink-4)',
        borderRadius: 16, overflow: 'hidden'
      }} className="live-demo-grid">
        {/* Left: profile editor */}
        <div style={{ padding: 32, borderRight: '1px solid var(--ink-4)' }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Target profile</div>
          <div style={{ display: 'grid', gap: 14 }}>
            {[['name', 'Full name'], ['year', 'Birth year'], ['pet', "Pet's name"], ['city', 'City']].map(([k, label]) => (
              <label key={k} style={{ display: 'block' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', marginBottom: 6 }}>{label}</div>
                <input
                  value={profile[k]}
                  onChange={e => setProfile({ ...profile, [k]: e.target.value })}
                  style={inputStyle}
                />
              </label>
            ))}
          </div>
          <hr className="hairline" style={{ margin: '24px 0' }} />
          <div className="eyebrow" style={{ marginBottom: 12 }}>Test password</div>
          <input
            value={pw}
            onChange={e => setPw(e.target.value)}
            style={{
              ...inputStyle, padding: '12px 14px', fontSize: 16,
              background: 'var(--ink-0)',
              border: `1px solid ${cracked ? 'var(--accent-500)' : 'var(--ink-5)'}`,
              borderRadius: 8,
              boxShadow: cracked ? '0 0 0 3px var(--accent-glow)' : 'none',
              transition: 'all .2s'
            }}
          />
        </div>

        {/* Right: score + wordlist */}
        <div style={{ padding: 32, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div className="eyebrow">Resilience score</div>
            <div style={{
              padding: '4px 10px', borderRadius: 999,
              background: cracked ? 'var(--accent-500)' : 'var(--ink-3)',
              color: cracked ? 'var(--ink-0)' : 'var(--fg-1)',
              fontFamily: 'var(--font-mono)', fontSize: 11
            }}>
              {cracked ? 'FOUND IN WORDLIST' : 'NOT IN WORDLIST'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <div style={{
              fontFamily: 'var(--font-sans)', fontSize: 88, lineHeight: 1,
              fontWeight: 500, letterSpacing: '-0.05em',
              color: result.score < 45 ? 'var(--accent-500)' : result.score < 70 ? 'var(--warn)' : 'var(--good)'
            }}>{result.score}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 500 }}>{result.rating}</div>
              <div style={{ color: 'var(--fg-2)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                {result.entropy} bits · cracks in{' '}
                <span style={{ color: cracked ? 'var(--accent-500)' : 'var(--fg-0)' }}>
                  {cracked ? '<1s with profile' : result.time}
                </span>
              </div>
            </div>
          </div>

          <div style={{ height: 8, background: 'var(--ink-3)', borderRadius: 4, margin: '20px 0 28px', overflow: 'hidden' }}>
            <div style={{
              width: `${result.score}%`, height: '100%',
              background: result.score < 45 ? 'var(--accent-500)' : result.score < 70 ? 'var(--warn)' : 'var(--good)',
              transition: 'width .25s ease'
            }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Why</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {result.reasons.length === 0 && <div style={{ color: 'var(--fg-3)', fontSize: 13 }}>No PII or pattern matches. Nice.</div>}
                {result.reasons.map((r, i) => (
                  <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-1)' }}>
                    <span style={{ color: 'var(--accent-500)' }}>✕ </span>{r.label}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Generated wordlist</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {wordlist.map((w, i) => (
                  <span key={i} style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    padding: '3px 7px',
                    background: w === pw ? 'var(--accent-500)' : 'var(--ink-3)',
                    color: w === pw ? 'var(--ink-0)' : 'var(--fg-2)',
                    borderRadius: 3, border: '1px solid var(--ink-5)'
                  }}>{w}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ─── ApiSnippet ─────────────────────────────────────────────── */
function ApiSnippet() {
  const [copied, setCopied] = useState(false);
  const code = `import { piicasso } from "@piicasso/sdk";

// Reject passwords made from the user's own leaked PII
const result = await piicasso.policy.evaluate({
  password: "Alex1991!",
  profile: {
    name: "Alex Chen",
    dob: "1991-03-14",
    email: "alex@northwind.io"
  }
});

if (result.crackable) {
  throw new Error(result.reasons[0]);
  // → "Contains 'Alex' (name) + year suffix '1991'"
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Section>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 64, alignItems: 'center' }} className="api-snippet-grid">
        <div>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Drop-in policy</div>
          <h2 className="h-display" style={{ fontSize: 'clamp(32px, 4vw, 48px)', marginBottom: 16 }}>
            Six lines of code.<br />One fewer breach.
          </h2>
          <p style={{ color: 'var(--fg-2)', fontSize: 16, marginBottom: 24 }}>
            Plug into your sign-up flow. We'll reject passwords made of the user's own
            leaked information before they ever hit your hash function.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span className="badge font-mono">npm i @piicasso/sdk</span>
            <span className="badge font-mono">python · go · ruby</span>
          </div>
        </div>

        <div style={{
          background: 'var(--ink-1)', border: '1px solid var(--ink-4)',
          borderRadius: 12, overflow: 'hidden',
          fontFamily: 'var(--font-mono)', fontSize: 13
        }}>
          <div style={{
            padding: '10px 16px', borderBottom: '1px solid var(--ink-4)',
            color: 'var(--fg-3)', fontSize: 11,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>policy.ts</span>
            <button
              onClick={handleCopy}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: copied ? 'var(--good)' : 'var(--fg-3)',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px 6px', borderRadius: 4,
                transition: 'color .2s'
              }}
            >
              {copied ? 'copied!' : 'copy'}
            </button>
          </div>
          <pre style={{ margin: 0, padding: '20px 24px', color: 'var(--fg-1)', lineHeight: 1.6, overflow: 'auto', fontSize: 13 }}>
            <code>{colorize(code)}</code>
          </pre>
        </div>
      </div>
    </Section>
  );
}

/* ─── Stats ──────────────────────────────────────────────────── */
function Stats() {
  const stats = [
    ['2.4B',    'leaked records indexed'],
    ['14',      'PII entity types classified'],
    ['<3ms',    'median classification latency'],
    ['99.97%',  'policy uptime, last 90 days'],
  ];
  return (
    <Section style={{ padding: '60px var(--gutter)' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        background: 'var(--ink-1)', border: '1px solid var(--ink-4)',
        borderRadius: 12, padding: '40px 32px'
      }} className="stats-grid">
        {stats.map(([n, l], i) => (
          <div key={i} style={{
            borderRight: i < 3 ? '1px solid var(--ink-4)' : 'none',
            padding: '0 24px'
          }}>
            <div style={{
              fontFamily: 'var(--font-sans)', fontSize: 48,
              fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1
            }}>{n}</div>
            <div style={{ color: 'var(--fg-2)', fontSize: 13, marginTop: 8 }}>{l}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ─── Testimonials ───────────────────────────────────────────── */
function Testimonials() {
  const items = [
    { quote: 'We replaced three different tools — leak monitoring, password policy, and a homegrown wordlist generator — with PIIcasso in an afternoon.', who: 'Priya Raman', role: 'Head of Security, Helix' },
    { quote: 'The mutation engine found credentials that twelve months of internal red-teaming missed. Embarrassing. Useful.', who: 'Marcus Webb', role: 'Principal Red Team, Northwind' },
    { quote: "I'm not technical and I finally understand why my password is bad. The score speaks for itself.", who: 'Sam K.', role: 'Marketing director, on User mode' },
  ];
  return (
    <Section>
      <div className="eyebrow" style={{ marginBottom: 16 }}>Field reports</div>
      <h2 className="h-display" style={{ fontSize: 'clamp(32px, 4vw, 48px)', marginBottom: 48, maxWidth: 700 }}>
        From the people who actually break things for a living.
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="testimonials-grid">
        {items.map((t, i) => (
          <div key={i} style={{
            padding: 32, background: 'var(--ink-1)',
            border: '1px solid var(--ink-4)', borderRadius: 12,
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: 22,
              lineHeight: 1.35, fontStyle: 'italic',
              marginBottom: 24, color: 'var(--fg-0)'
            }}>
              "{t.quote}"
            </div>
            <div style={{ marginTop: 'auto' }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{t.who}</div>
              <div style={{ color: 'var(--fg-3)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{t.role}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ─── CtaBlock ───────────────────────────────────────────────── */
function CtaBlock() {
  const navigate = useNavigate();
  return (
    <Section style={{ padding: '120px var(--gutter)' }}>
      <div style={{
        position: 'relative', overflow: 'hidden',
        padding: '80px 48px', borderRadius: 24,
        background: 'linear-gradient(160deg, var(--ink-1) 0%, var(--ink-2) 100%)',
        border: '1px solid var(--ink-4)', textAlign: 'center'
      }}>
        <div style={{
          position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)',
          pointerEvents: 'none'
        }} />
        <div className="eyebrow" style={{ marginBottom: 20, position: 'relative' }}>● The work</div>
        <h2 className="h-display" style={{
          fontSize: 'clamp(36px, 6vw, 64px)', maxWidth: 800,
          margin: '0 auto', position: 'relative'
        }}>
          Find out what an attacker already knows.
        </h2>
        <p style={{
          color: 'var(--fg-2)', fontSize: 17, maxWidth: 540,
          margin: '20px auto 36px', position: 'relative'
        }}>
          Free for individuals. Generous for teams. On-prem for the paranoid.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, position: 'relative', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/register')} className="btn btn-accent" style={{ padding: '14px 22px', fontSize: 14 }}>
            Start free — no card
          </button>
          <button onClick={() => navigate('/#contact')} className="btn btn-ghost" style={{ padding: '14px 22px', fontSize: 14 }}>
            Book a demo
          </button>
        </div>
      </div>
    </Section>
  );
}

/* ─── LandingPage (default export) ──────────────────────────── */
export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink-0)', color: 'var(--fg-0)' }}>
      <style>{`
        @keyframes cursor-blink { 50% { opacity: 0; } }
        @media (max-width: 768px) {
          .hero-demo-grid { grid-template-columns: 1fr !important; }
          .hero-demo-grid > *:first-child { border-right: none !important; border-bottom: 1px solid var(--ink-4); }
          .logo-wall-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .split-modes-grid { grid-template-columns: 1fr !important; }
          .split-modes-grid > *:first-child { border-right: none !important; border-bottom: 1px solid var(--ink-4); }
          .feature-grid { grid-template-columns: 1fr !important; }
          .feature-grid > * { border-right: none !important; }
          .live-demo-grid { grid-template-columns: 1fr !important; }
          .live-demo-grid > *:first-child { border-right: none !important; border-bottom: 1px solid var(--ink-4); }
          .api-snippet-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .stats-grid > * { border-right: none !important; border-bottom: 1px solid var(--ink-4); padding: 16px 0 !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .logo-wall-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <MarketingNav />
      <Hero />
      <Reveal variant="up"><LogoWall /></Reveal>
      <div id="solutions"><Reveal variant="scale"><SplitModes /></Reveal></div>
      <div id="features"><Reveal variant="up"><FeatureGrid /></Reveal></div>
      <Reveal variant="left"><LiveDemo /></Reveal>
      <Reveal variant="right"><ApiSnippet /></Reveal>
      <Reveal variant="up"><Stats /></Reveal>
      <div id="blog"><Reveal variant="up"><Testimonials /></Reveal></div>
      <div id="pricing"><Reveal variant="scale"><CtaBlock /></Reveal></div>
      <Footer />
    </div>
  );
}
