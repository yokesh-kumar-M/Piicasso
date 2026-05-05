import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ModeContext } from '../context/ModeContext';
import AuthShell from '../components/design/auth/AuthShell';
import AttackVizSide from '../components/design/auth/AttackVizSide';
import Field from '../components/design/auth/Field';
import SsoButtons from '../components/design/auth/SsoButtons';
import Divider from '../components/design/auth/Divider';
import ModePill from '../components/design/ModePill';

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const { mode, switchMode, openModeModal } = useContext(ModeContext) || { mode: 'security' };
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);

    // Simulate brief auth delay (matches original)
    await new Promise(r => setTimeout(r, 800));

    const res = await login(username, password);
    setLoading(false);

    if (res.success) {
      const hasSelectedMode = localStorage.getItem('app_mode');
      if (!hasSelectedMode) openModeModal?.();
      navigate(mode === 'security' ? '/security/dashboard' : '/user/dashboard');
    } else {
      setErr(res.error || 'Authentication denied. Invalid credentials.');
    }
  };

  const handleSsoError = (msg) => setErr(msg || 'Google sign-in failed.');

  return (
    <AuthShell
      side={
        <AttackVizSide
          headline="Welcome back. The wordlist remembers."
          sub="Resume your missions, review your fleet's resilience, and keep the engine warm."
        />
      }
    >
      <h1 className="h-display" style={{ fontSize: 36, marginBottom: 8 }}>Sign in</h1>
      <p style={{ color: 'var(--fg-2)', marginBottom: 32, fontSize: 14 }}>
        New to PIIcasso?{' '}
        <Link to="/register" style={{ color: 'var(--accent-500)', textDecoration: 'underline' }}>
          Create an account
        </Link>
      </p>

      <SsoButtons onError={handleSsoError} />
      <Divider label="or with email" />

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
        <Field
          label="Email or username"
          type="text"
          name="username"
          value={username}
          onChange={setUsername}
          placeholder="alex@northwind.io"
          autoComplete="username"
        />
        <Field
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="current-password"
          rightLink={
            <Link
              to="/forgot-password"
              style={{ fontSize: 12, color: 'var(--fg-2)', textDecoration: 'none' }}
              onMouseEnter={e => (e.target.style.color = 'var(--fg-0)')}
              onMouseLeave={e => (e.target.style.color = 'var(--fg-2)')}
            >
              Forgot?
            </Link>
          }
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
          style={{ marginTop: 8, padding: '13px 18px', justifyContent: 'center', width: '100%', opacity: loading ? 0.7 : 1 }}
        >
          {loading
            ? 'Signing in…'
            : mode === 'security'
            ? 'Continue to Mission Control →'
            : 'Continue to your dashboard →'}
        </button>
      </form>

      {/* Mode switcher card */}
      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: 'var(--ink-1)',
          border: '1px dashed var(--ink-5)',
          borderRadius: 8,
        }}
      >
        <div
          className="eyebrow"
          style={{ marginBottom: 8, color: 'var(--fg-3)', fontSize: 10, letterSpacing: '0.1em' }}
        >
          You're signing in as
        </div>
        <ModePill mode={mode} onChange={switchMode} />
        <p style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 8, lineHeight: 1.5 }}>
          The mode determines which dashboard you'll land in. You can switch any time.
        </p>
      </div>
    </AuthShell>
  );
};

export default LoginPage;
