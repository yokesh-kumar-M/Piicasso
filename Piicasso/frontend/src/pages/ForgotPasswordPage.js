import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import AuthShell from '../components/design/auth/AuthShell';
import AttackVizSide from '../components/design/auth/AttackVizSide';
import Field from '../components/design/auth/Field';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const [stage, setStage] = useState('email'); // 'email' | 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const refs = useRef([]);

  const setDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...code];
    next[i] = v;
    setCode(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  // Backspace: move focus back
  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setErr('');
    if (!email) { setErr('Please enter your email address.'); return; }
    setLoading(true);
    try {
      await axiosInstance.post('user/auth/password/reset/', { email });
      setStage('code');
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setErr('');
    const otp = code.join('');
    if (otp.length < 6) { setErr('Enter all 6 digits.'); return; }
    if (!newPassword) { setErr('New password is required.'); return; }
    if (newPassword.length < 6) { setErr('New password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await axiosInstance.post('user/auth/password/reset/verify/', {
        email,
        otp,
        new_password: newPassword,
      });
      navigate('/login', { state: { message: 'Password reset successful. Sign in with your new password.' } });
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Verification failed. Check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      side={
        <AttackVizSide
          headline="Even password resets are an attack surface."
          sub="We rate-limit, we challenge, we never email codes that resolve to PII tokens. The full audit trail is yours."
        />
      }
    >
      {/* ── Stage: email ── */}
      {stage === 'email' && (
        <>
          <h1 className="h-display" style={{ fontSize: 36, marginBottom: 8 }}>
            Reset password
          </h1>
          <p style={{ color: 'var(--fg-2)', marginBottom: 28, fontSize: 14 }}>
            We'll send a 6-digit code to your email.
          </p>

          <form onSubmit={handleSendCode} style={{ display: 'grid', gap: 14 }}>
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="alex@northwind.io"
              autoComplete="email"
            />

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
                }}
              >
                ! {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="v3-btn v3-btn-accent"
              style={{
                marginTop: 8,
                padding: '13px 18px',
                justifyContent: 'center',
                width: '100%',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Sending…' : 'Send code →'}
            </button>
          </form>

          <p style={{ marginTop: 20, fontSize: 13, color: 'var(--fg-3)', textAlign: 'center' }}>
            <Link to="/login" style={{ color: 'var(--fg-2)', textDecoration: 'underline' }}>
              ← Back to sign in
            </Link>
          </p>
        </>
      )}

      {/* ── Stage: code ── */}
      {stage === 'code' && (
        <>
          <h1 className="h-display" style={{ fontSize: 32, marginBottom: 8 }}>
            Two-factor verify
          </h1>
          <p style={{ color: 'var(--fg-2)', marginBottom: 28, fontSize: 14 }}>
            Code sent to{' '}
            <span style={{ color: 'var(--fg-0)', fontFamily: 'var(--font-mono-v3)' }}>
              {email}
            </span>
            . Expires in 10:00.
          </p>

          <form onSubmit={handleVerify} style={{ display: 'grid', gap: 14 }}>
            {/* 6-digit OTP grid */}
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono-v3)',
                  fontSize: 11,
                  color: 'var(--fg-3)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                6-digit code
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {code.map((d, i) => (
                  <input
                    key={i}
                    ref={el => (refs.current[i] = el)}
                    value={d}
                    maxLength={1}
                    inputMode="numeric"
                    onChange={e => setDigit(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    style={{
                      flex: 1,
                      height: 64,
                      textAlign: 'center',
                      fontSize: 28,
                      fontFamily: 'var(--font-mono-v3)',
                      background: 'var(--ink-1)',
                      border: `1px solid ${d ? 'var(--accent-500)' : 'var(--ink-5)'}`,
                      borderRadius: 8,
                      color: 'var(--fg-0)',
                      outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'var(--accent-500)';
                      e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = d ? 'var(--accent-500)' : 'var(--ink-5)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                ))}
              </div>
            </div>

            <Field
              label="New password"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="••••••••"
              autoComplete="new-password"
            />

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
                }}
              >
                ! {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="v3-btn v3-btn-accent"
              style={{
                marginTop: 8,
                padding: '13px 18px',
                justifyContent: 'center',
                width: '100%',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Verifying…' : 'Verify & reset →'}
            </button>
          </form>

          <div
            style={{
              marginTop: 16,
              fontSize: 12,
              color: 'var(--fg-2)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <button
              type="button"
              style={{ color: 'var(--fg-2)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
              onClick={() => { setStage('email'); setErr(''); setCode(['','','','','','']); }}
            >
              Use a different email
            </button>
            <Link to="/login" style={{ color: 'var(--fg-2)' }}>
              Back to sign in
            </Link>
          </div>
        </>
      )}
    </AuthShell>
  );
};

export default ForgotPasswordPage;
