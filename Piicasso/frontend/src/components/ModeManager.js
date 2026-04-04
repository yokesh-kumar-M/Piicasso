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

    const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);
    const isPublicPage = location.pathname === '/';

    if (isAuthenticated && !localStorage.getItem('app_mode') && !isAuthPage) {
      localStorage.setItem('app_mode', 'user');
    }
  }, [isAuthenticated, loading, location.pathname]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;

    const isUserMode = mode === 'user';
    const isSecurityPage = ['/security/dashboard', '/operation', '/dashboard', '/teams', '/workspace', '/darkweb', '/inbox', '/system-admin'].includes(location.pathname);
    const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);

    if (isAuthPage) return;

    if (isUserMode && isSecurityPage) {
      navigate('/user/dashboard', { replace: true });
    }

    if (!isUserMode && location.pathname.startsWith('/user')) {
      navigate('/dashboard', { replace: true });
    }
  }, [mode, isAuthenticated, loading, location.pathname, navigate]);

  return null;
};

export default ModeManager;
