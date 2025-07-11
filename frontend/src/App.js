import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import ResultPage from './pages/ResultPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
// Import your AuthProvider component
import { AuthProvider } from './context/AuthContext'; // <--- ASSUMPTION: Your AuthContext is defined in context/AuthContext.js

const App = () => {
  return (
    <ErrorBoundary>
      {/* Wrap the entire Router with AuthProvider */}
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* The Layout component likely contains navigation that might also need auth context */}
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/results" element={<ResultPage />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <DashboardPage />
                  </PrivateRoute>
                }
              />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;