// src/components/Layout.js
import React, { useContext } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Layout = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div className="text-xl font-bold">
          <Link to="/" className="hover:text-red-400">PIIcasso</Link>
        </div>
        <div className="space-x-4">
          <Link to="/" className="hover:underline">Home</Link>
          {isAuthenticated && (
            <Link to="/dashboard" className="hover:underline">Dashboard</Link>
          )}
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="hover:underline">Login</Link>
              <Link to="/register" className="hover:underline">Register</Link>
            </>
          ) : (
            <button
              onClick={logout}
              className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 text-white"
            >
              Logout
            </button>
          )}
        </div>
      </nav>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;