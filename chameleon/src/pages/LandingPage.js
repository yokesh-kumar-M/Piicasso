import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModeContext } from '../context/ModeContext';
import MarketingNav from '../components/design/MarketingNav';
import Footer from '../components/design/Footer';
import Reveal from '../components/design/Reveal';
import Section from '../components/design/Section';
import { detectEntities, redactText, scorePassword, generateWordlist } from '../lib/piiEngine';

const HERO_CONTENT = {
  security: {
    badge: 'SECURITY PROTOCOL ACTIVE',
    headline: 'Preemptive Credential & PII',
    accentLine: 'Vulnerability Intelligence.',
    sub: 'Offensive credential assessment and target-informed entropy modeling for red teams, penetration testers, and security engineers.',
    primaryCta: 'Get Started',
  },
  user: {
    badge: 'USER DEFENSE ACTIVE',
    headline: 'Know How Your Personal Data',
    accentLine: 'Exposes Your Passwords.',
    sub: 'Piicasso identifies leaked personal information and calculates the tailored wordlists adversaries use — empowering you to remediate before breaches occur.',
    primaryCta: 'Get Started',
  },
};

/* ─── RedactToken Helper ─────────────────────────────────────────────── */
function RedactToken({ children, label }) {
  return (
    <span style={{ position: 'relative', display: 'inline' }}>
      <span className="redact">{children}</span>
      <sup
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--accent-400)',
          marginLeft: 2,
          verticalAlign: 'super',
        }}
      >
        {label}
      </sup>
    </span>
  );
}

/* ─── HeroDemo: Real-time PII Entity Classifier ──────────────────────── */
function HeroDemo() {
  const samples = [
    'Subject: Identity Verification — Candidate Alex Chen (DOB: 1991-03-14)\nContact: alex.chen@enterprise.io | Mobile: +1-415-555-0198\nLocation: 1247 Mission St, San Francisco, CA 94103\nSSN Verification: ***-**-4421 recorded.',
    'User Profile: Jordan Lee | Direct: jordan.lee@cybervault.org | Phone: (212) 555-8371\nCredential Recovery Seed: Pet "Mochi" · City "Boston" · Birth: 1988\nAssigned IP: 192.168.1.104 at 03:14 UTC.',
    'Executive Record: Maria Lopez | Internal: m.lopez@fintechcorp.com\nSecondary Contact: 555-0142 | Address: 88 Spear St, ZIP 94105\nLast Auth Gateway: Active Token SHA-256 Verified.',
  ];
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState('');
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    setShown('');
    setIsScanning(true);
    const target = samples[idx];
    let i = 0;
    const interval = setInterval(() => {
      i += 3;
      setShown(target.slice(0, i));
      if (i >= target.length) {
        clearInterval(interval);
        setTimeout(() => setIsScanning(false), 300);
        setTimeout(() => setIdx((current) => (current + 1) % samples.length), 5500);
      }
    }, 18);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const entities = useMemo(() => detectEntities(shown), [shown]);
  const segments = useMemo(() => redactText(shown, entities), [shown, entities]);

  return (
    <div
      style={{
        maxWidth: 980,
        margin: '0 auto',
        borderRadius: 16,
        background: 'var(--ink-2)',
        border: '1px solid var(--ink-4)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset',
        overflow: 'hidden',
      }}
    >
      {/* Console Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: '1px solid var(--ink-4)',
          background: 'var(--ink-1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#ef4444', '#f59e0b', '#10b981'].map((color) => (
              <span
                key={color}
                style={{ width: 10, height: 10, borderRadius: '50%', background: color, opacity: 0.6 }}
              />
            ))}
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.12em',
              color: 'var(--fg-3)',
              marginLeft: 12,
              textTransform: 'uppercase',
            }}
          >
            PII EXTRACTION & CLASSIFICATION STREAM
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: isScanning ? 'var(--accent-500)' : 'var(--good)',
              boxShadow: `0 0 8px ${isScanning ? 'var(--accent-500)' : 'var(--good)'}`,
            }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)' }}>
            {isScanning ? 'CLASSIFYING…' : 'ANALYSIS COMPLETE'}
          </span>
        </div>
      </div>

      {/* Main Inspection Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.7fr 1fr',
          minHeight: 220,
        }}
        className="hero-demo-grid"
      >
        {/* Stream Display */}
        <div
          style={{
            padding: '24px 28px',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            lineHeight: 1.7,
            color: 'var(--fg-1)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            borderRight: '1px solid var(--ink-4)',
          }}
        >
          {segments.map((s, i) =>
            s.isEntity ? (
              <RedactToken key={i} label={s.entity.label}>
                {s.text}
              </RedactToken>
            ) : (
              <span key={i}>{s.text}</span>
            ),
          )}
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 15,
              background: 'var(--accent-500)',
              verticalAlign: 'text-bottom',
              marginLeft: 3,
              animation: 'cursor-blink 1s infinite',
            }}
          />
        </div>

        {/* Classified Entities List */}
        <div style={{ padding: '24px 28px', background: 'var(--ink-1)' }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            Discovered Threat Vectors
          </div>
          <div style={{ display: 'grid', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
            {entities.length === 0 ? (
              <div style={{ color: 'var(--fg-3)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                Awaiting input stream…
              </div>
            ) : (
              entities.map((e, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--ink-2)',
                    border: '1px solid var(--ink-4)',
                    borderRadius: 6,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                  }}
                >
                  <span style={{ color: 'var(--fg-1)', fontWeight: 600 }}>{e.label.toUpperCase()}</span>
                  <span style={{ color: 'var(--accent-500)', fontSize: 10 }}>● ISOLATED</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Hero Section ───────────────────────────────────────────────────── */
function Hero() {
  const navigate = useNavigate();
  const { mode } = useContext(ModeContext);
  const hero = HERO_CONTENT[mode] || HERO_CONTENT.user;

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid var(--ink-4)',
      }}
    >
      <div
        className="grid-bg"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.35,
          maskImage: 'radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -180,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          maxWidth: 'var(--max-w)',
          margin: '0 auto',
          padding: '80px var(--gutter) 100px',
          position: 'relative',
          textAlign: 'center',
        }}
      >
        <div
          className="eyebrow fade-up"
          style={{
            color: 'var(--accent-500)',
            marginBottom: 18,
            letterSpacing: '0.2em',
          }}
        >
          ● {hero.badge}
        </div>

        <h1
          className="fade-up"
          style={{
            fontSize: 'clamp(36px, 5.5vw, 68px)',
            fontFamily: mode === 'user' ? 'var(--font-serif-v3)' : "'Unbounded', 'Syne', sans-serif",
            fontWeight: mode === 'user' ? 500 : 700,
            textTransform: mode === 'user' ? 'none' : 'uppercase',
            lineHeight: 1.15,
            letterSpacing: mode === 'user' ? '-0.01em' : '-0.01em',
            maxWidth: 960,
            margin: '0 auto',
          }}
        >
          {hero.headline}{' '}
          <span
            style={{
              color: 'var(--accent-500)',
              fontWeight: mode === 'user' ? 500 : 700,
              fontStyle: mode === 'user' ? 'italic' : 'normal',
            }}
          >
            {hero.accentLine}
          </span>
        </h1>

        <p
          className="fade-up"
          style={{
            color: 'var(--fg-2)',
            fontSize: 18,
            maxWidth: 640,
            margin: '24px auto 0',
            lineHeight: 1.6,
          }}
        >
          {hero.sub}
        </p>

        <div
          className="fade-up"
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 36,
          }}
        >
          <button
            onClick={() => navigate('/register')}
            className="btn btn-accent"
            style={{ padding: '14px 28px', fontSize: 14, fontWeight: 600, letterSpacing: '0.04em' }}
          >
            {hero.primaryCta} <span style={{ opacity: 0.7 }}>→</span>
          </button>
        </div>

        <div className="fade-up" style={{ marginTop: 72 }}>
          <HeroDemo />
        </div>
      </div>
    </section>
  );
}

/* ─── Capabilities Architecture Section ──────────────────────────────── */
function CapabilitiesSection() {
  const pillars = [
    {
      code: 'CERBERUS',
      title: 'Identity & Access Governance',
      desc: 'Cryptographic session tokens, role-based workspace permissions, and secure team collaboration with zero token exposure.',
      points: ['Role-based team workspaces', 'Zero-leakage JWT sessions', 'Audit-ready access logs'],
    },
    {
      code: 'GOLEM',
      title: 'PII Synthesis & Mutation Engine',
      desc: 'Transforms isolated personal attributes into ranked entropy models using deterministic rules, corporate schemes, and AI synthesis.',
      points: ['Multi-tier deterministic patterns', 'Targeted permutation ranking', 'Exportable encrypted wordlists'],
    },
    {
      code: 'VALKYRIE',
      title: 'Breach Surveillance & Entropy',
      desc: 'Real-time credential exposure verification using k-anonymity SHA-1 range checks. Evaluates password resilience without sharing plaintext.',
      points: ['K-anonymity breach search', 'Calculated Shannon entropy bits', 'Zero-knowledge validation'],
    },
    {
      code: 'ARGUS',
      title: 'Telemetry & Operations Monitoring',
      desc: 'Centralized observability, real-time threat map streaming, and immutable audit logs ensuring enterprise platform integrity.',
      points: ['Real-time geo-anonymized map', 'Cryptographically verified logs', 'System health diagnostics'],
    },
  ];

  return (
    <Section id="features" style={{ padding: '96px var(--gutter)' }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div className="eyebrow" style={{ color: 'var(--accent-500)', marginBottom: 14 }}>
          ● CORE ARCHITECTURAL ENGINES
        </div>
        <h2
          className="h-display"
          style={{
            fontSize: 'clamp(32px, 4.5vw, 52px)',
            maxWidth: 780,
            margin: '0 auto',
            letterSpacing: '-0.02em',
          }}
        >
          Engineered for Enterprise Defense.
        </h2>
        <p style={{ color: 'var(--fg-2)', fontSize: 16, maxWidth: 580, margin: '16px auto 0' }}>
          Four decoupled, modular microservices operating synchronously to detect, quantify, and remediate credential risk.
        </p>
      </div>

      <div
        id="architecture"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 20,
        }}
        className="split-modes-grid"
      >
        {pillars.map((p) => (
          <div
            key={p.code}
            style={{
              padding: '36px 32px',
              borderRadius: 14,
              background: 'var(--ink-1)',
              border: '1px solid var(--ink-4)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.25s, border-color 0.25s',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.18em',
                color: 'var(--accent-500)',
                marginBottom: 12,
              }}
            >
              MODULE // {p.code}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, letterSpacing: '-0.01em' }}>
              {p.title}
            </h3>
            <p style={{ color: 'var(--fg-2)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              {p.desc}
            </p>
            <div style={{ marginTop: 'auto', display: 'grid', gap: 8 }}>
              {p.points.map((pt, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: 'var(--fg-1)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span style={{ color: 'var(--accent-500)' }}>✓</span>
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ─── LiveDemo: Target Profile & Resilience Tester ───────────────────── */
function LiveDemo() {
  const [profile, setProfile] = useState({
    name: 'Alex Chen',
    year: '1991',
    pet: 'mochi',
    city: 'boston',
  });
  const [password, setPassword] = useState('Alex1991!');
  const result = useMemo(() => scorePassword(password, profile), [password, profile]);
  const wordlist = useMemo(() => generateWordlist(profile, 14), [profile]);
  const isCracked =
    wordlist.includes(password) || wordlist.some((w) => password.toLowerCase().startsWith(w.toLowerCase()));

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--ink-3)',
    border: '1px solid var(--ink-5)',
    borderRadius: 8,
    color: 'var(--fg-0)',
    outline: 'none',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    boxSizing: 'border-box',
  };

  return (
    <Section id="demo" style={{ padding: '96px var(--gutter)' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div className="eyebrow" style={{ color: 'var(--accent-500)', marginBottom: 14 }}>
          ● INTERACTIVE PROOF OF CONCEPT
        </div>
        <h2
          className="h-display"
          style={{ fontSize: 'clamp(32px, 4.5vw, 50px)', maxWidth: 740, margin: '0 auto' }}
        >
          Test Password Resilience in Real Time.
        </h2>
        <p style={{ color: 'var(--fg-2)', fontSize: 16, maxWidth: 600, margin: '16px auto 0' }}>
          Input target profile data and test candidate passwords. Watch our entropy engine generate probable candidates and reveal algorithmic exposure.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.35fr',
          background: 'var(--ink-1)',
          border: '1px solid var(--ink-4)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        }}
        className="live-demo-grid"
      >
        {/* Left: Input Form */}
        <div style={{ padding: 36, borderRight: '1px solid var(--ink-4)' }}>
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            Target PII Vector
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {[
              ['name', 'Full Name'],
              ['year', 'Birth Year'],
              ['pet', 'Pet or Key Affection'],
              ['city', 'Birth / Current City'],
            ].map(([key, label]) => (
              <label key={key} style={{ display: 'block' }}>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--fg-3)',
                    marginBottom: 6,
                  }}
                >
                  {label}
                </span>
                <input
                  value={profile[key]}
                  onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                  style={inputStyle}
                />
              </label>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--ink-4)', margin: '24px 0' }} />

          <label style={{ display: 'block' }}>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--fg-3)',
                marginBottom: 6,
              }}
            >
              Test Candidate Password
            </span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                ...inputStyle,
                fontSize: 15,
                background: 'var(--ink-0)',
                border: `1px solid ${isCracked ? 'var(--accent-500)' : 'var(--ink-5)'}`,
                boxShadow: isCracked ? '0 0 0 3px var(--accent-glow)' : 'none',
              }}
            />
          </label>
        </div>

        {/* Right: Analysis & Wordlist Results */}
        <div style={{ padding: 36 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <div className="eyebrow">Calculated Resilience</div>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                background: isCracked ? 'var(--accent-500)' : 'var(--ink-3)',
                color: isCracked ? 'var(--ink-0)' : 'var(--fg-1)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {isCracked ? 'VULNERABLE (FOUND IN WORDLIST)' : 'NOT IN TARGET WORDLIST'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 76,
                lineHeight: 1,
                fontWeight: 700,
                color:
                  result.score < 45
                    ? 'var(--accent-500)'
                    : result.score < 70
                      ? 'var(--warn)'
                      : 'var(--good)',
              }}
            >
              {result.score}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{result.rating}</div>
              <div style={{ color: 'var(--fg-2)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                {result.entropy} bits entropy · {isCracked ? '<1s with target profile' : result.time}
              </div>
            </div>
          </div>

          <div
            style={{
              height: 6,
              background: 'var(--ink-3)',
              borderRadius: 3,
              margin: '20px 0 28px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${result.score}%`,
                height: '100%',
                background:
                  result.score < 45
                    ? 'var(--accent-500)'
                    : result.score < 70
                      ? 'var(--warn)'
                      : 'var(--good)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                Algorithmic Risk Factors
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {result.reasons.length === 0 ? (
                  <div style={{ color: 'var(--fg-3)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                    No direct PII patterns identified.
                  </div>
                ) : (
                  result.reasons.map((r, i) => (
                    <div
                      key={i}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-1)' }}
                    >
                      <span style={{ color: 'var(--accent-500)' }}>✕ </span>
                      {r.label}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                Generated Wordlist Sample
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {wordlist.slice(0, 10).map((w, i) => (
                  <span
                    key={i}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      padding: '3px 8px',
                      background: w === password ? 'var(--accent-500)' : 'var(--ink-3)',
                      color: w === password ? 'var(--ink-0)' : 'var(--fg-2)',
                      borderRadius: 4,
                      border: '1px solid var(--ink-5)',
                    }}
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ─── Dual Perspectives Section ──────────────────────────────────────── */
function DualPerspectivesSection() {
  const { mode, switchMode } = useContext(ModeContext);

  return (
    <Section id="perspectives" style={{ padding: '96px var(--gutter)' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div className="eyebrow" style={{ color: 'var(--accent-500)', marginBottom: 14 }}>
          ● ADAPTIVE PLATFORM PERSPECTIVES
        </div>
        <h2 className="h-display" style={{ fontSize: 'clamp(32px, 4.5vw, 50px)' }}>
          Tailored Workflows for Defense & Audit.
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          border: '1px solid var(--ink-4)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
        className="split-modes-grid"
      >
        {/* Security Mode Panel */}
        <div
          onClick={() => mode !== 'security' && switchMode('security')}
          style={{
            padding: '48px 40px',
            background: mode === 'security' ? 'var(--ink-1)' : 'var(--ink-2)',
            borderRight: '1px solid var(--ink-4)',
            cursor: mode === 'security' ? 'default' : 'pointer',
            transition: 'background 0.25s ease, border-color 0.25s ease',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <div className="eyebrow" style={{ color: 'var(--sec-500)', margin: 0 }}>
              ● SECURITY MODE (AUDIT & OPERATIONS)
            </div>
            {mode === 'security' ? (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: 'rgba(225, 29, 72, 0.15)',
                  color: 'var(--sec-500)',
                  border: '1px solid rgba(225, 29, 72, 0.3)',
                }}
              >
                Active
              </span>
            ) : (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--fg-3)',
                }}
              >
                Click to preview
              </span>
            )}
          </div>
          <h3 style={{ fontSize: 28, fontWeight: 700, marginBottom: 14 }}>
            Offensive Credential Auditing
          </h3>
          <p style={{ color: 'var(--fg-2)', lineHeight: 1.6, fontSize: 15, margin: 0 }}>
            Synthesize targeted candidate profiles from exposure vectors. Model adversarial techniques to test enterprise authentication resilience and enforce strict credential hygiene.
          </p>
        </div>

        {/* User Mode Panel */}
        <div
          onClick={() => mode !== 'user' && switchMode('user')}
          style={{
            padding: '48px 40px',
            background: mode === 'user' ? 'var(--ink-1)' : 'var(--ink-2)',
            cursor: mode === 'user' ? 'default' : 'pointer',
            transition: 'background 0.25s ease, border-color 0.25s ease',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <div className="eyebrow" style={{ color: 'var(--usr-500)', margin: 0 }}>
              ● USER MODE (DEFENSIVE HYGIENE)
            </div>
            {mode === 'user' ? (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--usr-500)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                Active
              </span>
            ) : (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--fg-3)',
                }}
              >
                Click to preview
              </span>
            )}
          </div>
          <h3 style={{ fontSize: 28, fontWeight: 700, marginBottom: 14 }}>
            Personal Exposure Remediation
          </h3>
          <p style={{ color: 'var(--fg-2)', lineHeight: 1.6, fontSize: 15, margin: 0 }}>
            Audit personal and organization credentials against known public breaches and exposed PII vectors. Receive clear, actionable remediation guidance with zero technical jargon.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ─── SecurityAssurance Section ──────────────────────────────────────── */
function SecurityAssuranceSection() {
  const assurances = [
    {
      title: 'Zero-Knowledge Privacy',
      desc: 'Passwords are never transmitted in plaintext. Breach validation occurs using k-anonymity SHA-1 truncated prefixes.',
    },
    {
      title: 'AES-256 Field Encryption',
      desc: 'All target profile vectors and audit histories are encrypted at rest using AES-256 with managed secret rotation.',
    },
    {
      title: 'Zero Retention Policy',
      desc: 'Temporary generation caches are ephemeral and scrubbed immediately following generation or export download.',
    },
    {
      title: 'End-to-End Encryption',
      desc: 'All API payloads transit over authenticated, TLS 1.3 encrypted HTTP/2 connections with strict CORS and CSP policies.',
    },
  ];

  return (
    <Section style={{ padding: '64px var(--gutter)' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          background: 'var(--ink-1)',
          border: '1px solid var(--ink-4)',
          borderRadius: 14,
          padding: '36px 28px',
        }}
        className="stats-grid"
      >
        {assurances.map((item, idx) => (
          <div
            key={idx}
            style={{
              borderRight: idx < 3 ? '1px solid var(--ink-4)' : 'none',
              padding: '0 20px',
            }}
          >
            <div style={{ color: 'var(--accent-500)', fontSize: 16, marginBottom: 8 }}>✦</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{item.title}</div>
            <div style={{ color: 'var(--fg-2)', fontSize: 13, lineHeight: 1.55 }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ─── CtaBlock ───────────────────────────────────────────────────────── */
function CtaBlock() {
  const navigate = useNavigate();

  return (
    <Section style={{ padding: '96px var(--gutter)' }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '72px 48px',
          borderRadius: 20,
          background: 'linear-gradient(160deg, var(--ink-1) 0%, var(--ink-2) 100%)',
          border: '1px solid var(--ink-4)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div className="eyebrow" style={{ marginBottom: 16, position: 'relative' }}>
          ● DEPLOYMENT READY
        </div>
        <h2
          className="h-display"
          style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            maxWidth: 720,
            margin: '0 auto',
            position: 'relative',
          }}
        >
          Secure Your Organization Against PII-Driven Attacks.
        </h2>
        <p
          style={{
            color: 'var(--fg-2)',
            fontSize: 16,
            maxWidth: 540,
            margin: '20px auto 32px',
            position: 'relative',
            lineHeight: 1.6,
          }}
        >
          Begin your assessment today or connect with our security architecture team.
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            position: 'relative',
          }}
        >
          <button
            onClick={() => navigate('/register')}
            className="btn btn-accent"
            style={{ padding: '14px 32px', fontSize: 14, fontWeight: 600, letterSpacing: '0.04em' }}
          >
            Get Started <span style={{ opacity: 0.7 }}>→</span>
          </button>
          <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>
            Already have a workspace?{' '}
            <span
              onClick={() => navigate('/login')}
              style={{ color: 'var(--fg-1)', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Sign in
            </span>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ─── LandingPage Root ───────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink-0)', color: 'var(--fg-0)' }}>
      <style>{`
        @keyframes cursor-blink { 50% { opacity: 0; } }
        @media (max-width: 768px) {
          .hero-demo-grid { grid-template-columns: 1fr !important; }
          .hero-demo-grid > *:first-child { border-right: none !important; border-bottom: 1px solid var(--ink-4); }
          .split-modes-grid { grid-template-columns: 1fr !important; }
          .split-modes-grid > *:first-child { border-right: none !important; border-bottom: 1px solid var(--ink-4); }
          .live-demo-grid { grid-template-columns: 1fr !important; }
          .live-demo-grid > *:first-child { border-right: none !important; border-bottom: 1px solid var(--ink-4); }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .stats-grid > * { border-right: none !important; border-bottom: 1px solid var(--ink-4); padding: 16px 0 !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <MarketingNav />
      <Hero />
      <Reveal variant="scale">
        <CapabilitiesSection />
      </Reveal>
      <Reveal variant="up">
        <LiveDemo />
      </Reveal>
      <Reveal variant="left">
        <DualPerspectivesSection />
      </Reveal>
      <Reveal variant="up">
        <SecurityAssuranceSection />
      </Reveal>
      <Reveal variant="scale">
        <CtaBlock />
      </Reveal>
      <Footer />
    </div>
  );
}
