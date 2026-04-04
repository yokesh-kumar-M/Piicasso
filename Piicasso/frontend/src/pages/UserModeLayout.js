import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Shield, History, Home, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';

const UserModeLayout = () => {
  const location = useLocation();

  const navItems = [
    { path: '/user/dashboard', label: 'Password Check', icon: Shield },
    { path: '/user/history', label: 'History', icon: History },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="bg-[#040B16] min-h-screen text-white font-sans transition-colors duration-300 relative overflow-hidden">
      {/* Cobalt Glass Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <Navbar />
      
      <div className="relative z-10 pt-24 px-4 md:px-8 pb-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-blue-200/60 mb-8">
          <Link to="/" className="hover:text-blue-400 transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" /> Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-blue-400 font-medium tracking-wide">Security Center</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-[#0B162C]/80 backdrop-blur-xl border border-blue-500/10 rounded-2xl p-5 shadow-2xl shadow-blue-900/5">
              <div className="flex items-center gap-4 mb-6 pb-5 border-b border-blue-500/10">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.15)]">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white tracking-tight text-lg">Protection</h3>
                  <p className="text-[10px] text-blue-300/70 font-semibold uppercase tracking-widest mt-0.5">Personal Mode</p>
                </div>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm border ${
                        active
                          ? 'bg-blue-600/20 border-blue-500/30 text-white shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                          : 'border-transparent text-blue-200/60 hover:bg-blue-500/5 hover:border-blue-500/10 hover:text-white'
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-[#0B162C]/80 backdrop-blur-xl border border-blue-500/10 rounded-2xl shadow-2xl shadow-blue-900/10 overflow-hidden min-h-[600px]">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModeLayout;