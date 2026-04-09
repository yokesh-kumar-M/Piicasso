import React, { useContext, useEffect, Suspense } from 'react';
import axios from './api/axios';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Footer from './components/Footer';
import CinematicTransition from './components/CinematicTransition';
import NetworkStatus from './components/NetworkStatus';
import { AuthContext } from './context/AuthContext';
import { ModeProvider, ModeContext } from './context/ModeContext';
import ModeSelectionModal from './components/ModeSelectionModal';
import ModeManager from './components/ModeManager';
import ModeTearTransition from './components/ModeTearTransition';

import { GoogleOAuthProvider } from '@react-oauth/google';

// ── Yokesh's Iconic Touch: The HELP Beacon ──
const useHelpBeacon = () => {
  const { isAuthenticated, user } = useContext(AuthContext);

  useEffect(() => {
    if (!isAuthenticated || !user?.is_superuser) return;

    const sendBeacon = () => {
      axios.post('analytics/beacon/', { message: 'HELP' }).catch(() => { });
    };
    sendBeacon();
    const interval = setInterval(sendBeacon, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);
};

const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const ResultPage = React.lazy(() => import('./pages/ResultPage'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const NewOperationPage = React.lazy(() => import('./pages/NewOperationPage'));
const SavedPage = React.lazy(() => import('./pages/SavedPage'));
const TeamsPage = React.lazy(() => import('./pages/TeamsPage'));
const DarkWebPage = React.lazy(() => import('./pages/DarkWebPage'));
const SuperAdminPage = React.lazy(() => import('./pages/SuperAdminPage'));
const InboxPage = React.lazy(() => import('./pages/InboxPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const UserModeLayout = React.lazy(() => import('./pages/UserModeLayout'));
const UserDashboardPage = React.lazy(() => import('./pages/UserDashboardPage'));
const SecurityDashboardPage = React.lazy(() => import('./pages/SecurityDashboardPage'));
const PasswordCheckerPage = React.lazy(() => import('./pages/PasswordCheckerPage'));
const AnalysisHistoryPage = React.lazy(() => import('./pages/AnalysisHistoryPage'));
const FinancialRiskPage = React.lazy(() => import('./pages/FinancialRiskPage'));

function AppContent() {
  useHelpBeacon();
  const { mode } = useContext(ModeContext);

  // Apply theme class to body globally
  useEffect(() => {
    document.body.className = mode === 'user' ? 'theme-user' : 'theme-security';
  }, [mode]);

  return (
    <>
      <ModeTearTransition />
      <ModeSelectionModal />
      <ModeManager />
      {/* App shell uses transparent bg since body handles the gradient/colors */}
      <div className="min-h-screen flex flex-col w-full overflow-x-hidden transition-colors duration-300 bg-transparent">
        <CinematicTransition>
          {(locationToRender) => (
            <div className="flex-1 flex flex-col w-full relative">
              <Suspense fallback={<div className="flex-1 w-full bg-transparent" />}>
                <Routes location={locationToRender} key={locationToRender.pathname}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  <Route path="/user" element={
                    <PrivateRoute>
                      <UserModeLayout />
                    </PrivateRoute>
                  }>
                    <Route path="dashboard" element={<UserDashboardPage />} />
                    <Route path="history" element={<AnalysisHistoryPage />} />
                  </Route>

                  <Route path="/security/dashboard" element={
                    <PrivateRoute>
                      <SecurityDashboardPage />
                    </PrivateRoute>
                  } />
                  <Route path="/operation" element={
                    <PrivateRoute>
                      <NewOperationPage />
                    </PrivateRoute>
                  } />
                  <Route path="/workspace" element={
                    <PrivateRoute>
                      <SavedPage />
                    </PrivateRoute>
                  } />
                  <Route path="/profile" element={
                    <PrivateRoute>
                      <ProfilePage />
                    </PrivateRoute>
                  } />
                  <Route path="/teams" element={
                    <PrivateRoute>
                      <TeamsPage />
                    </PrivateRoute>
                  } />
                  <Route path="/darkweb" element={
                    <PrivateRoute>
                      <DarkWebPage />
                    </PrivateRoute>
                  } />
                  <Route path="/system-admin" element={
                    <PrivateRoute>
                      <SuperAdminPage />
                    </PrivateRoute>
                  } />
                  <Route path="/inbox" element={
                    <PrivateRoute>
                      <InboxPage />
                    </PrivateRoute>
                  } />
                  <Route path="/dashboard" element={
                    <PrivateRoute>
                      <DashboardPage />
                    </PrivateRoute>
                  } />
                  <Route path="/risk" element={
                    <PrivateRoute>
                      <FinancialRiskPage />
                    </PrivateRoute>
                  } />

                  <Route element={<Layout />}>
                    <Route path="/result" element={
                      <PrivateRoute>
                        <ResultPage />
                      </PrivateRoute>
                    } />
                  </Route>

                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </div>
          )}
        </CinematicTransition>
        <div className="shrink-0 w-full">
          <Footer />
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
      <BrowserRouter>
        <ModeProvider>
          <NetworkStatus />
          <ScrollToTop />
          <AppContent />
        </ModeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
