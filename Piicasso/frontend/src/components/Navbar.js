import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, Menu, X, User, Mail, ChevronDown, Lock, Target } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ModeContext } from '../context/ModeContext';
import axiosInstance from '../api/axios';
import Logo from './Logo';
import ModeSwitcher from './ModeSwitcher';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    const { isAuthenticated, logout, user } = useContext(AuthContext);
    const { mode } = useContext(ModeContext); // 'security' or 'user'
    const location = useLocation();

    // Theming logic based on Context
    const isSecurityMode = mode === 'security';
    
    // Theme configurations using new design tokens
    const themeConfig = {
        navBg: isScrolled 
            ? (isSecurityMode ? 'bg-security-surface/95 shadow-xl border-b border-security-border' : 'bg-user-surface/90 backdrop-blur-xl border-b border-user-border shadow-[0_4px_30px_rgba(0,0,0,0.5)]')
            : 'bg-transparent',
        accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
        activeLink: isSecurityMode ? 'text-white font-bold tracking-widest uppercase font-display text-sm' : 'text-white font-semibold tracking-wide text-sm',
        inactiveLink: isSecurityMode ? 'text-security-text-muted hover:text-white uppercase font-display tracking-widest text-sm transition-colors' : 'text-user-text-muted hover:text-white font-medium text-sm transition-colors',
        dropdownBg: isSecurityMode ? 'bg-security-surface/95 border-security-border' : 'bg-user-surface/95 backdrop-blur-3xl border-user-border',
        primaryBtn: isSecurityMode ? 'security-btn-primary' : 'user-btn-primary',
        logoComponent: <Logo className="text-3xl hover:opacity-80 transition-opacity" /> // Can be swapped out if needed
    };

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await axiosInstance.get('operations/notifications/');
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unread_count || 0);
        } catch (err) {
            // Silent fail
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, [fetchNotifications, isAuthenticated]);

    const markAllRead = async () => {
        try {
            await axiosInstance.post('operations/notifications/', { action: 'mark_all_read' });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            // Silent
        }
    };

    const markOneRead = async (id) => {
        try {
            await axiosInstance.post('operations/notifications/', { id });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            // Silent
        }
    };

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Dashboard', path: isSecurityMode ? '/security/dashboard' : '/user/dashboard' },
        ...(isSecurityMode ? [
            { name: 'Intel DB', path: '/dashboard' },
            { name: 'Generators', path: '/operation' },
            { name: 'Risk Radar', path: '/risk' },
        ] : []),
    ];

    if (isAuthenticated) {
        navLinks.push({ name: 'Comms', path: '/inbox' });
    }

    if (user?.is_superuser) {
        navLinks.push({ name: 'System', path: '/system-admin' });
    }

    const getNotifColor = (type) => {
        switch (type) {
            case 'GENERATION': return isSecurityMode ? 'text-security-red' : 'text-user-cobalt';
            case 'TEAM': return 'text-purple-400';
            case 'MESSAGE': return 'text-green-500';
            case 'SECURITY': return 'text-amber-500';
            case 'ADMIN': return 'text-white';
            default: return 'text-gray-400';
        }
    };

    const timeSince = (dateStr) => {
        const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${themeConfig.navBg}`}>
            <div className="px-5 md:px-10 lg:px-16 py-4 flex items-center justify-between mx-auto max-w-screen-2xl">

                {/* Left Side: Logo & Links */}
                <div className="flex items-center gap-14">
                    <Link to="/" className="flex items-center flex-shrink-0 group">
                        {themeConfig.logoComponent}
                    </Link>

                    <div className="hidden lg:flex items-center gap-10 mt-1">
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                            return (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className="relative py-2 group"
                                >
                                    <span className={isActive ? themeConfig.activeLink : themeConfig.inactiveLink}>
                                        {link.name}
                                    </span>
                                    {isActive && (
                                        <motion.div 
                                            layoutId="nav-indicator"
                                            className={`absolute -bottom-[6px] left-0 w-full h-[2px] rounded-full ${isSecurityMode ? 'bg-security-red shadow-[0_0_8px_rgba(225,29,72,0.8)]' : 'bg-user-cobalt shadow-[0_0_8px_rgba(59,130,246,0.8)]'}`}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Right Side: Icons & Profile */}
                <div className="flex items-center gap-7 text-white mt-1">
                    {isAuthenticated && <ModeSwitcher />}

                    <Link to="/darkweb" className="hidden sm:flex items-center text-gray-400 hover:text-white transition-colors" title="Deep Search">
                        <Search className="w-5 h-5" strokeWidth={isSecurityMode ? 2.5 : 2} />
                    </Link>

                    {/* Notification Bell */}
                    {isAuthenticated && (
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                                className="relative flex items-center transition-colors px-2 py-1"
                            >
                                <Bell className={`w-5 h-5 sm:w-[22px] sm:h-[22px] ${unreadCount > 0 ? 'text-white' : 'text-gray-400 hover:text-white'}`} strokeWidth={isSecurityMode ? 2.5 : 2} />
                                {unreadCount > 0 && (
                                    <span className={`absolute -top-1 right-1 sm:-right-1 min-w-[16px] h-[16px] rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-transparent text-white shadow-md ${isSecurityMode ? 'bg-security-red' : 'bg-user-cobalt'}`}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {showNotifDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        className={`absolute top-full -right-16 sm:right-0 mt-5 w-[320px] sm:w-[420px] rounded-xl border shadow-2xl z-50 overflow-hidden ${themeConfig.dropdownBg}`}
                                    >
                                        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${isSecurityMode ? 'border-security-border' : 'border-user-border'}`}>
                                            <h3 className={`font-bold ${isSecurityMode ? 'font-display text-base sm:text-lg uppercase tracking-wide text-white' : 'text-sm sm:text-base tracking-tight text-white'}`}>
                                                Notifications
                                            </h3>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={markAllRead}
                                                    className={`text-[10px] sm:text-xs font-medium text-gray-400 transition-colors ${isSecurityMode ? 'hover:text-security-red uppercase font-display tracking-widest' : 'hover:text-user-cobalt'}`}
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {notifications.length === 0 ? (
                                                <div className="text-sm text-center py-12 sm:py-16 text-gray-500 font-medium">
                                                    No new updates.
                                                </div>
                                            ) : (
                                                notifications.slice(0, 10).map(n => (
                                                    <Link
                                                        key={n.id}
                                                        to={n.link || '#'}
                                                        onClick={() => { markOneRead(n.id); setShowNotifDropdown(false); }}
                                                        className={`block px-4 sm:px-5 py-3 sm:py-4 border-b transition-colors hover:bg-white/[0.04] ${isSecurityMode ? 'border-security-border' : 'border-user-border'} ${!n.is_read ? 'bg-white/[0.02]' : ''}`}
                                                    >
                                                        <div className="flex items-start gap-3 sm:gap-4">
                                                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? (isSecurityMode ? 'bg-security-red shadow-[0_0_8px_rgba(225,29,72,0.8)]' : 'bg-user-cobalt shadow-[0_0_8px_rgba(59,130,246,0.8)]') : 'bg-gray-700'}`} />
                                                            <div className="min-w-0 flex-1">
                                                                <p className={`text-xs sm:text-sm font-bold tracking-tight ${getNotifColor(n.notification_type)} truncate`}>
                                                                    {n.title}
                                                                </p>
                                                                {n.description && (
                                                                    <p className="text-[11px] sm:text-[13px] text-gray-400 mt-1 leading-snug line-clamp-2">{n.description}</p>
                                                                )}
                                                                <p className={`text-[9px] sm:text-[11px] font-medium text-gray-500 mt-2 ${isSecurityMode ? 'font-display uppercase tracking-widest' : ''}`}>{timeSince(n.timestamp)}</p>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))
                                            )}
                                        </div>
                                        <div className={`p-3 sm:p-4 bg-black/20 text-center border-t ${isSecurityMode ? 'border-security-border' : 'border-user-border'}`}>
                                            <Link to="/inbox" className={`text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-colors ${isSecurityMode ? 'font-display uppercase tracking-widest' : ''}`}>View All</Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {isAuthenticated ? (
                        <div className="group relative flex items-center gap-3 cursor-pointer py-2 pl-2">
                            <div className="flex flex-col items-end hidden md:flex mr-1">
                                <span className="text-[13px] font-bold text-white tracking-tight">{user?.username}</span>
                            </div>
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-base shadow-lg ${isSecurityMode ? 'bg-security-red text-white' : 'bg-gradient-to-tr from-user-cobalt to-user-indigo text-white'}`}>
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <ChevronDown className="w-[14px] h-[14px] text-gray-400 group-hover:text-white transition-all duration-300 hidden sm:block" />

                            {/* Dropdown */}
                            <div className={`absolute top-full right-0 mt-3 w-64 rounded-xl border shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden ${themeConfig.dropdownBg}`}>
                                <div className="py-2">
                                    <div className={`px-5 py-4 border-b mb-2 ${isSecurityMode ? 'border-security-border' : 'border-user-border'}`}>
                                        <p className={`text-[10px] text-gray-400 uppercase font-bold mb-1 ${isSecurityMode ? 'font-display tracking-widest' : 'tracking-wider'}`}>Signed in as</p>
                                        <p className="text-sm font-bold text-white truncate">{user?.email || user?.username}</p>
                                    </div>
                                    <Link to="/profile" className="px-5 py-3 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white font-medium flex items-center gap-3">
                                        <User className="w-[18px] h-[18px] text-gray-400" strokeWidth={2} /> Profile
                                    </Link>
                                    <Link to="/inbox" className="px-5 py-3 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white font-medium flex items-center gap-3">
                                        <Mail className="w-[18px] h-[18px] text-gray-400" strokeWidth={2} /> Inbox
                                    </Link>
                                    <div className={`h-px my-2 ${isSecurityMode ? 'bg-security-border' : 'bg-user-border'}`}></div>
                                    <button onClick={logout} className={`w-full text-left px-5 py-3 text-sm transition-colors font-medium flex items-center gap-3 ${isSecurityMode ? 'text-security-red hover:bg-security-red/10' : 'text-red-400 hover:bg-red-500/10'}`}>
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Link to="/login" className={`relative group overflow-hidden px-7 py-2.5 rounded-lg text-sm font-bold transition-all ${themeConfig.primaryBtn}`}>
                            <span className="relative z-10">Sign In</span>
                        </Link>
                    )}

                    {/* Mobile Menu Toggle */}
                    <div className="lg:hidden ml-2">
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white hover:opacity-80 transition-opacity">
                            {isMobileMenuOpen ? <X className="w-8 h-8"/> : <Menu className="w-8 h-8"/>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Click outside to close notification dropdown */}
            {showNotifDropdown && (
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
            )}

                    {/* Mobile Menu Overlay */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                  <motion.div 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`lg:hidden absolute top-full left-0 w-full px-6 pt-6 pb-24 border-t overflow-y-auto shadow-2xl ${themeConfig.dropdownBg}`}
                      style={{ maxHeight: 'calc(100vh - 80px)' }}
                  >
                      <div className="flex flex-col space-y-2">
                          {navLinks.map((link) => (
                              <Link
                                  key={link.name}
                                  to={link.path}
                                  className={`block py-5 text-xl border-b transition-all duration-300 ${isSecurityMode ? 'border-security-border font-display uppercase tracking-widest text-white hover:text-security-red' : 'border-user-border font-semibold text-gray-200 hover:text-white hover:translate-x-2'}`}
                                  onClick={() => setIsMobileMenuOpen(false)}
                              >
                                  {link.name}
                              </Link>
                          ))}

                          {/* Mobile Search/Deep Web link */}
                          <Link
                              to="/darkweb"
                              className={`flex items-center gap-3 py-5 text-xl border-b transition-all duration-300 ${isSecurityMode ? 'border-security-border font-display uppercase tracking-widest text-white hover:text-security-red' : 'border-user-border font-semibold text-gray-200 hover:text-white hover:translate-x-2'}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                          >
                              <Search className="w-5 h-5" /> Deep Search
                          </Link>

                          <div className="pt-10 flex flex-col gap-4">
                              {isAuthenticated ? (
                                  <>
                                      <Link to="/profile" className="flex items-center gap-3 py-4 text-lg font-semibold text-white hover:text-gray-300" onClick={() => setIsMobileMenuOpen(false)}>
                                          <User className="w-5 h-5" /> Account Profile
                                      </Link>
                                      <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className={`w-full py-4 text-sm font-bold tracking-wide rounded-xl mt-4 flex items-center justify-center gap-2 ${themeConfig.primaryBtn}`}>
                                          Sign Out
                                      </button>
                                  </>
                              ) : (
                                  <Link to="/login" className={`w-full py-4 text-center text-sm font-bold tracking-wide rounded-xl mt-4 ${themeConfig.primaryBtn}`} onClick={() => setIsMobileMenuOpen(false)}>
                                      Sign In
                                  </Link>
                              )}
                          </div>
                      </div>
                  </motion.div>
              )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;