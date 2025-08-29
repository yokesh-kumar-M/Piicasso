//frontend/src/components/GoogleOAuthButton.js - Modern Implementation
import React, { useEffect, useRef } from 'react';

const GoogleOAuthButton = ({ onSuccess, onFailure, disabled = false }) => {
  const buttonRef = useRef(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Wait for Google script to load
    const initializeGoogleOAuth = () => {
      if (window.google && window.google.accounts && !isInitialized.current) {
        isInitialized.current = true;
        
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        // Render the button
        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          });
        }
      }
    };

    const handleCredentialResponse = (response) => {
      if (response.credential) {
        onSuccess({
          credential: response.credential,
          tokenId: response.credential // For backward compatibility
        });
      } else {
        onFailure({ error: 'No credential received' });
      }
    };

    // Check if Google script is already loaded
    if (window.google && window.google.accounts) {
      initializeGoogleOAuth();
    } else {
      // Wait for script to load
      const checkGoogleLoaded = setInterval(() => {
        if (window.google && window.google.accounts) {
          clearInterval(checkGoogleLoaded);
          initializeGoogleOAuth();
        }
      }, 100);

      // Cleanup interval after 10 seconds
      setTimeout(() => clearInterval(checkGoogleLoaded), 10000);
    }
  }, [onSuccess, onFailure]);

  return (
    <div className="w-full">
      <div 
        ref={buttonRef} 
        className={`w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        style={{ minHeight: '44px' }}
      />
      {disabled && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-50 rounded-lg"></div>
      )}
    </div>
  );
};

export default GoogleOAuthButton;

// Alternative Custom Button (if you prefer your own styling)
const CustomGoogleOAuthButton = ({ onSuccess, onFailure, disabled = false, children }) => {
  const handleClick = () => {
    if (disabled || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.credential) {
          onSuccess({
            credential: response.credential,
            tokenId: response.credential
          });
        } else {
          onFailure({ error: 'Authentication failed' });
        }
      }
    });

    // Use the One Tap prompt
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        console.log('Google One Tap not displayed:', notification.getNotDisplayedReason());
        onFailure({ error: 'Google sign-in not available' });
      } else if (notification.isSkippedMoment()) {
        console.log('Google One Tap skipped:', notification.getSkippedReason());
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className="flex items-center justify-center w-full bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-lg border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
    >
      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {children || 'Continue with Google'}
    </button>
  );
};

export { CustomGoogleOAuthButton };