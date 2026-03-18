import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Shield, History, Home, ChevronRight } from 'lucide-react';

const UserModeLayout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/user/dashboard', label: 'Password Check', icon: Shield },
    { path: '/user/history', label: 'History', icon: History },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white font-body">
      <div className="pt-20 px-4 md:px-8 pb-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
          <Link to="/" className="hover:text-white transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" /> Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-green-500">User Mode</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-[#141414] border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-bold text-white">User Mode</h3>
                  <p className="text-xs text-zinc-500">Password Security</p>
                </div>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive(item.path)
                          ? 'bg-green-500/20 text-green-400'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModeLayout;
