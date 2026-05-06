import React, { useContext } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../../../context/AuthContext';
import { ModeContext } from '../../../context/ModeContext';
import { useNavigate } from 'react-router-dom';

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
      if (!localStorage.getItem('app_mode')) openModeModal();
      navigate(mode === 'security' ? '/security/dashboard' : '/user/dashboard');
    } else {
      onError?.(res.error || 'Google sign-in failed');
    }
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ position: 'relative', height: 46 }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          borderRadius: 10,
          border: '1px solid var(--ink-5)',
          background: 'var(--ink-2)',
          pointerEvents: 'none',
          transition: 'border-color 0.15s, background 0.15s',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.169 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          <span style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--fg-0)',
            fontFamily: 'var(--font-sans-v3)',
          }}>
            Continue with Google
          </span>
        </div>
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.01,
          overflow: 'hidden',
          borderRadius: 10,
        }}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => onError?.('Google authentication was cancelled or failed.')}
            theme="filled_black"
            shape="rectangular"
            size="large"
            width="400"
          />
        </div>
      </div>
    </div>
  );
}
