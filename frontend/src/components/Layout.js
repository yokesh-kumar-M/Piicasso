// src/components/Layout.js
import React, { useContext } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Layout = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white font-mono">
      {/* 🔻 Navbar */}
      <nav className="bg-zinc-950 text-white px-6 py-4 flex justify-between items-center shadow shadow-red-700">
        <div className="text-2xl font-bold tracking-wider">
          <Link to="/" className="text-red-600 hover:text-red-400">PII<span className="text-white">casso</span></Link>
        </div>
        <div className="space-x-6 text-sm">
          <Link to="/" className="hover:text-red-500">Home</Link>
          {isAuthenticated && (
            <Link to="/dashboard" className="hover:text-red-500">Dashboard</Link>
          )}
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="hover:text-red-500">Login</Link>
              <Link to="/register" className="hover:text-red-500">Register</Link>
            </>
          ) : (
            <button
              onClick={logout}
              className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition duration-200"
            >
              Logout
            </button>
          )}
        </div>
      </nav>

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;