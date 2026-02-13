import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ResultPage from './pages/ResultPage';

import HomePage from './pages/HomePage';
import NewOperationPage from './pages/NewOperationPage';
import SavedPage from './pages/SavedPage';
import SquadronPage from './pages/SquadronPage';
import DarkWebPage from './pages/DarkWebPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Home Page (Netflix Style) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/operation" element={<NewOperationPage />} />
        <Route path="/workspace" element={<SavedPage />} />
        <Route path="/login" element={<LoginPage />} />
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
    </BrowserRouter>
  );
}

export default App;