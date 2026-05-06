import React, { useState, useMemo, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { ModeContext } from '../context/ModeContext';
import AuthShell from '../components/design/auth/AuthShell';
import Field from '../components/design/auth/Field';
import SsoButtons from '../components/design/auth/SsoButtons';
import Divider from '../components/design/auth/Divider';
import { scorePassword } from '../lib/piiEngine';

const ROLES = [
  {
    value: 'individual',
    title: 'Individual',
    desc: "I want to check if my own passwords are crackable.",
    color: 'var(--usr-500)',
  },
  {
    value: 'security',
    title: 'Security',
    desc: "I'm a red teamer / security pro running missions.",
    color: 'var(--sec-500)',
  },
  {
    value: 'team',
    title: 'Team',
    desc: "We're plugging the SDK into our auth flow.",
    color: 'var(--fg-0)',
  },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { mode: appMode } = useContext(ModeContext) || { mode: 'security' };

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('individual');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  // Live password score using piiEngine
  const result = useMemo(
    () => scorePassword(password, { name, email }),
    [password, name, email]
  );

  const scoreColor =
    result.score < 45
      ? 'var(--accent-500)'
      : result.score < 70
      ? 'var(--warn)'
      : 'var(--good)';

  const handleSsoError = (msg) => setErr(msg || 'Google sign-in failed.');

  const handleSubmit = async () => {
    setErr('');
    setLoading(true);

    // Get location — preserved from original
    let lat = null, lng = null;
    try {
      const pos = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), 3000);
        navigator.geolocation.getCurrentPosition(
          (p) => { clearTimeout(timer); resolve(p); },
          (e) => { clearTimeout(timer); reject(e); },
          { timeout: 3000, maximumAge: 10000 }
        );
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch (_) {
      // location not available — continue without it
    }

    // Simulate provisioning delay — preserved from original
    await new Promise(r => setTimeout(r, 1000));

    try {
      const payload = {
        username: email.split('@')[0],
        email,
        password,
        lat,
        lng,
      };
      const res = await axiosInstance.post('user/register/', payload);
      if (res.status === 201) {
        navigate('/login');
      } else {
        setErr(res.data?.error || 'Registration failed');
        setLoading(false);
      }
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      {/* Progress bars */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
        {[1, 2, 3].map(s => (
          <div
            key={s}
            style={{
              flex: 1,
              height: 3,
              background: s <= step ? 'var(--accent-500)' : 'var(--ink-4)',
              transition: 'background 0.25s',
              borderRadius: 2,
            }}
          />
        ))}
      </div>

      {/* Error banner (shown across steps) */}
      {err && (
        <div
          style={{
            color: 'var(--accent-500)',
            fontSize: 13,
            fontFamily: 'var(--font-mono-v3)',
            padding: '8px 12px',
            background: 'color-mix(in oklab, var(--accent-500) 8%, var(--ink-1))',
            border: '1px solid color-mix(in oklab, var(--accent-500) 30%, transparent)',
            borderRadius: 6,
            marginBottom: 16,
          }}
        >
          ! {err}
        </div>
      )}

      {/* ── STEP 1: Identity ── */}
      {step === 1 && (
        <>
          <h1 className="h-display" style={{ fontSize: 36, marginBottom: 8 }}>
            Create your account
          </h1>
          <p style={{ color: 'var(--fg-2)', marginBottom: 28, fontSize: 14 }}>
            It's free for individuals — forever.
          </p>

          <SsoButtons onError={handleSsoError} />
          <Divider label="or with email" />

          <div style={{ display: 'grid', gap: 14 }}>
            <Field
              label="Work email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="alex@northwind.io"
              autoComplete="email"
            />
            <Field
              label="Full name"
              type="text"
              value={name}
              onChange={setName}
              placeholder="Alex Chen"
              autoComplete="name"
            />
            <button
              type="button"
              disabled={!email || !name}
              onClick={() => email && name && setStep(2)}
              className="v3-btn v3-btn-accent"
              style={{
                marginTop: 8,
                padding: '13px 18px',
                justifyContent: 'center',
                width: '100%',
                opacity: email && name ? 1 : 0.4,
                cursor: email && name ? 'pointer' : 'not-allowed',
              }}
            >
              Continue →
            </button>
          </div>

          <p style={{ marginTop: 20, fontSize: 13, color: 'var(--fg-3)', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-500)', textDecoration: 'underline' }}>
              Sign in
            </Link>
          </p>
        </>
      )}

      {/* ── STEP 2: Password + live score ── */}
      {step === 2 && (
        <>
          <h1 className="h-display" style={{ fontSize: 32, marginBottom: 8, lineHeight: 1.2 }}>
            Pick a password.<br />We'll grade it as you type.
          </h1>
          <p style={{ color: 'var(--fg-2)', marginBottom: 28, fontSize: 14 }}>
            Anything with{' '}
            <strong style={{ color: 'var(--fg-0)' }}>
              {name.split(' ')[0] || 'your name'}
            </strong>{' '}
            in it? We'll know.
          </p>

          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Make it weird"
            autoComplete="new-password"
          />

          {/* Strength panel */}
          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 10,
              background: 'var(--ink-1)',
              border: '1px solid var(--ink-4)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono-v3)',
                  fontSize: 12,
                  color: 'var(--fg-2)',
                  letterSpacing: '0.08em',
                }}
              >
                RESILIENCE
              </span>
              <span style={{ fontSize: 22, fontWeight: 500, color: scoreColor }}>
                {result.score}{' '}
                <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>/ 100</span>
              </span>
            </div>
            {/* Animated progress bar */}
            <div
              style={{
                height: 6,
                background: 'var(--ink-3)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${result.score}%`,
                  height: '100%',
                  background: scoreColor,
                  transition: 'width 0.25s, background 0.25s',
                }}
              />
            </div>
            {/* Reasons list */}
            <div style={{ marginTop: 12, display: 'grid', gap: 4 }}>
              {result.reasons && result.reasons.length > 0
                ? result.reasons.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        fontFamily: 'var(--font-mono-v3)',
                        fontSize: 11,
                        color: 'var(--accent-400)',
                      }}
                    >
                      ✕ {r.label || r}
                    </div>
                  ))
                : password && (
                    <div
                      style={{
                        fontFamily: 'var(--font-mono-v3)',
                        fontSize: 11,
                        color: 'var(--good)',
                      }}
                    >
                      ✓ No PII or pattern matches
                    </div>
                  )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="v3-btn v3-btn-ghost"
              style={{ padding: '12px 16px' }}
            >
              Back
            </button>
            <button
              type="button"
              disabled={result.score < 45}
              onClick={() => result.score >= 45 && setStep(3)}
              className="v3-btn v3-btn-accent"
              style={{
                padding: '13px 18px',
                flex: 1,
                justifyContent: 'center',
                opacity: result.score < 45 ? 0.4 : 1,
                cursor: result.score < 45 ? 'not-allowed' : 'pointer',
              }}
            >
              {result.score < 45 ? 'Make it stronger to continue' : 'Continue →'}
            </button>
          </div>
        </>
      )}

      {/* ── STEP 3: Role picker + submit ── */}
      {step === 3 && (
        <>
          <h1 className="h-display" style={{ fontSize: 32, marginBottom: 12 }}>
            How will you use it?
          </h1>
          <p style={{ color: 'var(--fg-2)', marginBottom: 24, fontSize: 14 }}>
            This sets your default mode. You can switch any time.
          </p>

          <div style={{ display: 'grid', gap: 10 }}>
            {ROLES.map(({ value, title, desc, color }) => {
              const selected = role === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: 16,
                    textAlign: 'left',
                    borderRadius: 10,
                    border: selected ? `1px solid ${color}` : '1px solid var(--ink-4)',
                    background: selected
                      ? `color-mix(in oklab, ${color} 8%, var(--ink-1))`
                      : 'var(--ink-1)',
                    transition: 'all 0.15s',
                    cursor: 'pointer',
                    color: 'var(--fg-0)',
                    width: '100%',
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: `2px solid ${selected ? color : 'var(--ink-5)'}`,
                      display: 'inline-block',
                      marginTop: 2,
                      background: selected ? color : 'transparent',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{title}</div>
                    <div style={{ color: 'var(--fg-2)', fontSize: 13 }}>{desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="v3-btn v3-btn-ghost"
              style={{ padding: '12px 16px' }}
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="v3-btn v3-btn-accent"
              style={{
                flex: 1,
                padding: '13px 18px',
                justifyContent: 'center',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </div>
        </>
      )}
    </AuthShell>
  );
};

export default RegisterPage;
