import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { ValkyrieSecurityApi } from '../api/apiService';

export const ModeContext = createContext();

export const ModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const stored = localStorage.getItem('app_mode');
    return stored || 'user';
  });

  const [showModeModal, setShowModeModal] = useState(false);
  const [loading] = useState(false);
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

  // Apply server preference ONCE on mount if user hasn't explicitly set mode locally.
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token || hasFetchedPrefs.current) return;
    hasFetchedPrefs.current = true;

    const storedMode = localStorage.getItem('app_mode');
    if (storedMode) return;

    ValkyrieSecurityApi.fetchUserPreferences()
      .then((data) => {
        const lastMode = data?.last_mode;
        if (lastMode) setMode(lastMode);
      })
      .catch(() => {});
  }, []);

  const switchMode = useCallback(async (newMode) => {
    setMode(newMode);
    localStorage.setItem('app_mode', newMode);
    try {
      await ValkyrieSecurityApi.updateUserPreferences({
        default_mode: newMode,
        last_mode: newMode,
      });
    } catch (err) {
      // silent fail — mode is already switched locally
    }
  }, []);

  const openModeModal = useCallback(() => setShowModeModal(true), []);
  const closeModeModal = useCallback(() => setShowModeModal(false), []);
  const selectModeAndClose = useCallback(
    (selectedMode) => {
      switchMode(selectedMode);
      setShowModeModal(false);
    },
    [switchMode],
  );

  return (
    <ModeContext.Provider
      value={{
        mode,
        switchMode,
        setMode: switchMode,
        showModeModal,
        openModeModal,
        closeModeModal,
        selectModeAndClose,
        loading,
      }}
    >
      {children}
    </ModeContext.Provider>
  );
};
