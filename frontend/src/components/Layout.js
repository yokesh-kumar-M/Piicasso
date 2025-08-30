import React, { useContext } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, LogOut, Home, BarChart3 } from 'lucide-react';

const Layout = () => {
  const { isAuthenticated, logout, user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Netflix-style Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="group flex items-center">
              <h1 className="text-2xl font-black tracking-tight">
                PII<span className="text-red-600 group-hover:text-red-500 transition-colors">casso</span>
              </h1>
            </Link>
            
            {/* Navigation Links */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-6">
                <Link 
                  to="/" 
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-zinc-800/50"
                >
                  <Home className="w-4 h-4" />
                  <span className="font-medium">Intelligence</span>
                </Link>
                <Link 
                  to="/dashboard" 
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-zinc-800/50"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="font-medium">Dashboard</span>
                </Link>
              </div>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login" 
                  className="text-gray-300 hover:text-white transition-colors font-medium py-2 px-4 rounded-lg hover:bg-zinc-800/50"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                {/* User Info */}
                <div className="hidden md:flex items-center space-x-3 bg-zinc-800/50 rounded-lg px-4 py-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <div className="text-sm">
                    <div className="text-white font-medium">{user?.username}</div>
                    <div className="text-gray-400 text-xs">
                      {user?.emailVerified ? 'Verified' : 'Pending verification'}
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content with padding for fixed navbar */}
      <main className="pt-20">
        <Outlet />
      </main>

      {/* Optional Footer */}
      <footer className="border-t border-zinc-800/50 bg-black/95 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-2xl font-black">PII<span className="text-red-600">casso</span></span>
          </div>
          <p className="text-gray-500 text-sm">
            Advanced Intelligence Platform for Security Professionals
          </p>
          <p className="text-gray-600 text-xs mt-2">
            © 2024 PIIcasso. Built for educational and authorized security testing purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;