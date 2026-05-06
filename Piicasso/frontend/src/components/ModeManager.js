import React, { useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ModeContext } from '../context/ModeContext';

const ModeManager = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const { mode } = useContext(ModeContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && !localStorage.getItem('app_mode')) {
      localStorage.setItem('app_mode', 'user');
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    if (loading || !isAuthenticated) return;

    // Routes that only exist in security mode.
    // /darkweb and /inbox are intentionally omitted — they serve both modes.
    const securityOnlyPages = [
      '/security/dashboard', '/operation', '/dashboard',
      '/teams', '/workspace', '/system-admin',
    ];

    const isAuthPage = ['/login', '/register', '/forgot-password']
      .includes(location.pathname);
    if (isAuthPage) return;

    if (mode === 'user' && securityOnlyPages.includes(location.pathname)) {
      navigate('/user/dashboard', { replace: true });
    }

    if (mode === 'security' && location.pathname.startsWith('/user')) {
      navigate('/security/dashboard', { replace: true }); // was '/dashboard' — fixed
    }
  }, [mode, isAuthenticated, loading, location.pathname, navigate]);

  return null;
};

export default ModeManager;
