import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../api/axios';

export const ModeContext = createContext();

export const ModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const stored = localStorage.getItem('app_mode');
    return stored || 'user';
  });

  const [showModeModal, setShowModeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const hasFetchedPrefs = useRef(false);

  // Sync mode to DOM and localStorage on every change.
  useEffect(() => {
    localStorage.setItem('app_mode', mode);
    if (mode === 'security') {
      document.body.classList.add('mode-security');
      document.body.classList.remove('mode-user');
    } else {
      document.body.classList.add('mode-user');
      document.body.classList.remove('mode-security');
    }
    document.documentElement.setAttribute('data-mode', mode);
  }, [mode]);

  // Apply server preference ONCE on mount. The ref guard ensures switchMode calls
  // never trigger a re-fetch that could revert a user's explicit mode selection.
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token || hasFetchedPrefs.current) return;
    hasFetchedPrefs.current = true;
    axiosInstance.get('password/preferences/')
      .then(res => {
        const { last_mode } = res.data;
        if (last_mode) setMode(last_mode);
      })
      .catch(() => {});
  }, []);

  const switchMode = useCallback(async (newMode) => {
    setMode(newMode);
    localStorage.setItem('app_mode', newMode);
    try {
      await axiosInstance.put('password/preferences/', {
        default_mode: newMode,
        last_mode: newMode,
      });
    } catch (err) {
      // silent fail — mode is already switched locally
    }
  }, []);

  const openModeModal = useCallback(() => setShowModeModal(true), []);
  const closeModeModal = useCallback(() => setShowModeModal(false), []);
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
      loading,
    }}>
      {children}
    </ModeContext.Provider>
  );
};
