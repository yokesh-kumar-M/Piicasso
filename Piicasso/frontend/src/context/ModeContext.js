import { createContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axios';

export const ModeContext = createContext();

export const ModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const stored = localStorage.getItem('app_mode');
    return stored || 'user';
  });
  
  const [showModeModal, setShowModeModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('app_mode', mode);
    // Dynamic Netflix Theme Variables via Body Class
    if (mode === 'security') {
      document.body.classList.add('mode-security');
      document.body.classList.remove('mode-user');
    } else {
      document.body.classList.add('mode-user');
      document.body.classList.remove('mode-security');
    }
  }, [mode]);

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await axiosInstance.get('password/preferences/');
      const { last_mode } = res.data;
      if (last_mode && last_mode !== mode) {
        setMode(last_mode);
      }
    } catch (err) {
      // Silent fail - use localStorage default
    }
  }, [mode]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchPreferences();
    }
  }, [fetchPreferences]);

  const switchMode = useCallback(async (newMode) => {
    setMode(newMode);
    localStorage.setItem('app_mode', newMode);
    
    try {
      await axiosInstance.put('password/preferences/', {
        default_mode: newMode,
        last_mode: newMode
      });
    } catch (err) {
      // Silent fail - mode is already switched locally
    }
  }, []);

  const openModeModal = useCallback(() => {
    setShowModeModal(true);
  }, []);

  const closeModeModal = useCallback(() => {
    setShowModeModal(false);
  }, []);

  const selectModeAndClose = useCallback((selectedMode) => {
    switchMode(selectedMode);
    setShowModeModal(false);
  }, [switchMode]);

  return (
    <ModeContext.Provider value={{
      mode,
      switchMode,
      setMode: switchMode,
      showModeModal,
      openModeModal,
      closeModeModal,
      selectModeAndClose,
      loading
    }}>
      {children}
    </ModeContext.Provider>
  );
};
