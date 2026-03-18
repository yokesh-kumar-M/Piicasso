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

// ── Yokesh's Iconic Touch: The HELP Beacon ──
const useHelpBeacon = () => {
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    if (!isAuthenticated) return;

    const sendBeacon = () => {
      axios.post('analytics/beacon/', { message: 'HELP' }).catch(() => { });
    };
    sendBeacon();
    const interval = setInterval(sendBeacon, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);
};

const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const ResultPage = React.lazy(() => import('./pages/ResultPage'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const NewOperationPage = React.lazy(() => import('./pages/NewOperationPage'));
const SavedPage = React.lazy(() => import('./pages/SavedPage'));
const TeamsPage = React.lazy(() => import('./pages/TeamsPage'));
const DarkWebPage = React.lazy(() => import('./pages/DarkWebPage'));
const SuperAdminPage = React.lazy(() => import('./pages/SuperAdminPage'));
const InboxPage = React.lazy(() => import('./pages/InboxPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const UserModeLayout = React.lazy(() => import('./pages/UserModeLayout'));
const PasswordCheckerPage = React.lazy(() => import('./pages/PasswordCheckerPage'));
const AnalysisHistoryPage = React.lazy(() => import('./pages/AnalysisHistoryPage'));

function AppContent() {
  useHelpBeacon();

  const SuperuserRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return null;
    if (!user?.is_superuser) return <Navigate to="/" replace />;
    return children;
  };

  return (
    <>
      <ModeSelectionModal />
      <ModeManager />
      <div className="bg-black min-h-screen flex flex-col w-full overflow-x-hidden">
        <CinematicTransition>
          {(locationToRender) => (
            <div className="flex-1 flex flex-col relative w-full">
              <Suspense fallback={<div className="flex-1 bg-black w-full" />}>
                <Routes location={locationToRender} key={locationToRender.pathname}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  <Route path="/user" element={
                    <PrivateRoute>
                      <UserModeLayout />
                    </PrivateRoute>
                  }>
                    <Route path="dashboard" element={<PasswordCheckerPage />} />
                    <Route path="history" element={<AnalysisHistoryPage />} />
                  </Route>

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
        <div className="shrink-0 w-full bg-black">
          <Footer />
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ModeProvider>
        <NetworkStatus />
        <ScrollToTop />
        <AppContent />
      </ModeProvider>
    </BrowserRouter>
  );
}

export default App;
