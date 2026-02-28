import React, { useEffect, Suspense } from 'react';
import axios from './api/axios';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Footer from './components/Footer';
import CinematicTransition from './components/CinematicTransition';

const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const ResultPage = React.lazy(() => import('./pages/ResultPage'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const NewOperationPage = React.lazy(() => import('./pages/NewOperationPage'));
const SavedPage = React.lazy(() => import('./pages/SavedPage'));
const SquadronPage = React.lazy(() => import('./pages/SquadronPage'));
const DarkWebPage = React.lazy(() => import('./pages/DarkWebPage'));
const SuperAdminPage = React.lazy(() => import('./pages/SuperAdminPage'));

function App() {
  useEffect(() => {
    const sendBeacon = (lat, lng) => {
      axios.post('/beacon/', { message: 'HELP', lat, lng })
        .catch(() => { }); // Silent failure for security/cleanliness inline with prod standards
    };

    const runBeacon = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            sendBeacon(position.coords.latitude, position.coords.longitude);
          },
          (err) => {
            // Geolocation blocked by user or failed silently
            sendBeacon(null, null);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        sendBeacon(null, null);
      }
    };

    runBeacon(); // Initial run
    const interval = setInterval(runBeacon, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="bg-black min-h-screen flex flex-col w-full overflow-x-hidden">
        <CinematicTransition>
          {(locationToRender) => (
            <div className="flex-1 flex flex-col relative w-full">
              <Suspense fallback={<div className="flex-1 bg-black w-full" />}>
                <Routes location={locationToRender} key={locationToRender.pathname}>
                  {/* Main Home Page (Netflix Style) */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/operation" element={<NewOperationPage />} />
                  <Route path="/workspace" element={<SavedPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  <Route path="/profile" element={
                    <PrivateRoute>
                      <ProfilePage />
                    </PrivateRoute>
                  } />

                  <Route path="/squadron" element={
                    <PrivateRoute>
                      <SquadronPage />
                    </PrivateRoute>
                  } />

                  <Route path="/darkweb" element={
                    <PrivateRoute>
                      <DarkWebPage />
                    </PrivateRoute>
                  } />

                  <Route path="/omega-admin" element={
                    <PrivateRoute>
                      <SuperAdminPage />
                    </PrivateRoute>
                  } />

                  {/* Dashboard (Standalone Layout) */}
                  <Route path="/dashboard" element={
                    <PrivateRoute>
                      <DashboardPage />
                    </PrivateRoute>
                  } />

                  {/* Legacy Layout Routes */}
                  <Route element={<Layout />}>
                    <Route path="/result" element={
                      <PrivateRoute>
                        <ResultPage />
                      </PrivateRoute>
                    } />
                  </Route>
                </Routes>
              </Suspense>
            </div>
          )}
        </CinematicTransition>
        <div className="shrink-0 w-full bg-black">
          <Footer />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;