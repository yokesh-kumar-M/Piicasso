import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // Ensure path is correct

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-red-500 text-xl animate-pulse">
          Authenticating...
        </div>
      </div>
    );
  }

  // If authenticated, render the child component (e.g., DashboardPage)
  // Otherwise, redirect to the login page
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;