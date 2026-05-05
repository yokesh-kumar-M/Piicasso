import React, { useContext } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../../../context/AuthContext';
import { ModeContext } from '../../../context/ModeContext';
import { useNavigate } from 'react-router-dom';
import GoogleGlyph from '../GoogleGlyph';

/**
 * SsoButtons — Continue with Google + (placeholder) GitHub / Microsoft / SAML.
 * Wraps the real `<GoogleLogin>` from @react-oauth/google but keeps the editorial
 * design language. The non-Google buttons are intentionally placeholders for now —
 * they'll be wired up in a future session.
 */
export default function SsoButtons({ onError }) {
  const { googleLogin } = useContext(AuthContext);
  const { mode, openModeModal } = useContext(ModeContext);
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential || credentialResponse.credential.split('.').length < 3) {
      return;
    }
    const res = await googleLogin(credentialResponse.credential);
    if (res.success) {
      const hasSelectedMode = localStorage.getItem('app_mode');
      if (!hasSelectedMode) openModeModal();
      navigate(mode === 'security' ? '/security/dashboard' : '/user/dashboard');
    } else {
      onError?.(res.error || 'Google sign-in failed');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 8, marginBottom: 8 }}>
      {/* The real Google button is rendered inside the wrapper, but we visually
          overlay it inside a custom-styled container. We use a transparent
          wrapper so the GoogleLogin button is fully clickable while we keep
          our design language consistent via the surrounding flex row. */}
      <div className="v3-google-btn">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => onError?.('Google authentication was cancelled or failed.')}
          theme="filled_black"
          shape="rectangular"
          text="continue_with"
          size="large"
          width="360"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          ['GitHub', '◯'],
          ['Microsoft', '▦'],
          ['SAML', '⌥'],
        ].map(([n, g]) => (
          <button
            key={n}
            type="button"
            disabled
            title="Coming soon"
            className="v3-btn v3-btn-ghost"
            style={{
              padding: '12px',
              fontSize: 12,
              cursor: 'not-allowed',
              opacity: 0.5,
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono-v3)', fontWeight: 700 }}>{g}</span> {n}
          </button>
        ))}
      </div>

      <style>{`
        .v3-google-btn {
          display: flex;
          justify-content: center;
        }
        .v3-google-btn > div {
          width: 100% !important;
          max-width: 100%;
        }
        .v3-google-btn iframe {
          width: 100% !important;
          color-scheme: dark;
        }
      `}</style>
    </div>
  );
}
