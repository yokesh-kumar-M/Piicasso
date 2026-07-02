import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, Menu, X, User, Mail, ChevronDown, TerminalSquare } from 'lucide-react';
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
      ? isSecurityMode
        ? 'bg-security-surface/95 shadow-xl border-b border-security-border'
        : 'bg-user-surface/90 backdrop-blur-xl border-b border-user-border shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
      : 'bg-transparent',
    accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
    activeLink: isSecurityMode
      ? 'text-white font-bold tracking-widest uppercase font-display text-sm'
      : 'text-white font-semibold tracking-wide text-sm',
    inactiveLink: isSecurityMode
      ? 'text-security-text-muted hover:text-white uppercase font-display tracking-widest text-sm transition-colors'
      : 'text-user-text-muted hover:text-white font-medium text-sm transition-colors',
    dropdownBg: isSecurityMode
      ? 'bg-security-surface/95 border-security-border'
      : 'bg-user-surface/95 backdrop-blur-3xl border-user-border',
    primaryBtn: isSecurityMode ? 'security-btn-primary' : 'user-btn-primary',
    logoComponent: <Logo className="text-3xl transition-opacity hover:opacity-80" />, // Can be swapped out if needed
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
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      // Silent
    }
  };

  const markOneRead = async (id) => {
    try {
      await axiosInstance.post('operations/notifications/', { id });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Dashboard', path: isSecurityMode ? '/security/dashboard' : '/user/dashboard' },
    ...(isSecurityMode
      ? [
          { name: 'Intel DB', path: '/darkweb' },
          { name: 'Generators', path: '/operation' },
          { name: 'Risk Radar', path: '/risk' },
        ]
      : []),
  ];

  if (isAuthenticated) {
    navLinks.push({ name: 'Comms', path: '/inbox' });
  }

  if (user?.is_superuser) {
    navLinks.push({ name: 'System', path: '/system-admin' });
  }

  const getNotifColor = (type) => {
    switch (type) {
      case 'GENERATION':
        return isSecurityMode ? 'text-security-red' : 'text-user-cobalt';
      case 'TEAM':
        return 'text-purple-400';
      case 'MESSAGE':
        return 'text-green-500';
      case 'SECURITY':
        return 'text-amber-500';
      case 'ADMIN':
        return 'text-white';
      default:
        return 'text-gray-400';
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
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-700 ease-spring ${themeConfig.navBg}`}
    >
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3 sm:px-5 sm:py-4 md:px-10 lg:px-16">
        {/* Left Side: Logo & Links */}
        <div className="flex items-center gap-4 sm:gap-6 md:gap-10 lg:gap-14">
          <Link to="/" className="group flex flex-shrink-0 items-center">
            {themeConfig.logoComponent}
          </Link>

          <div className="mt-1 hidden items-center gap-6 md:gap-8 lg:flex lg:gap-10">
            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.path ||
                (link.path !== '/' && location.pathname.startsWith(link.path));
              return (
                <Link key={link.name} to={link.path} className="group relative py-2">
                  <span className={isActive ? themeConfig.activeLink : themeConfig.inactiveLink}>
                    {link.name}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className={`absolute -bottom-[6px] left-0 h-[2px] w-full rounded-full ${isSecurityMode ? 'bg-security-red shadow-[0_0_8px_rgba(225,29,72,0.8)]' : 'bg-user-cobalt shadow-[0_0_8px_rgba(59,130,246,0.8)]'}`}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Side: Icons & Profile */}
        <div className="mt-1 flex items-center gap-3 text-white sm:gap-5 md:gap-7">
          {isAuthenticated && <ModeSwitcher />}

          <Link
            to="/darkweb"
            className="hidden items-center text-gray-400 transition-colors hover:text-white sm:flex"
            title="Deep Search"
          >
            <Search
              className="h-5 w-5 sm:h-[22px] sm:w-[22px]"
              strokeWidth={isSecurityMode ? 2.5 : 2}
            />
          </Link>

          {/* Notification Bell */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative flex items-center px-1.5 py-1 transition-colors sm:px-2"
              >
                <Bell
                  className={`h-5 w-5 sm:h-[22px] sm:w-[22px] ${unreadCount > 0 ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                  strokeWidth={isSecurityMode ? 2.5 : 2}
                />
                {unreadCount > 0 && (
                  <span
                    className={`absolute -top-1 right-0 flex h-[16px] min-w-[16px] items-center justify-center rounded-full border-2 border-transparent text-[9px] font-bold text-white shadow-md sm:-right-1 ${isSecurityMode ? 'bg-security-red' : 'bg-user-cobalt'}`}
                  >
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
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className={`xs:w-[calc(100vw-2rem)] absolute right-0 top-full z-50 mt-3 w-[calc(100vw-1rem)] max-w-[420px] overflow-hidden rounded-xl border shadow-2xl sm:-right-16 sm:mt-5 sm:w-[320px] ${themeConfig.dropdownBg}`}
                  >
                    <div
                      className={`xs:p-4 flex items-center justify-between border-b p-3 sm:p-5 ${isSecurityMode ? 'border-security-border' : 'border-user-border'}`}
                    >
                      <h3
                        className={`font-bold ${isSecurityMode ? 'xs:text-base font-display text-sm uppercase tracking-wide text-white sm:text-lg' : 'xs:text-sm text-xs tracking-tight text-white sm:text-base'}`}
                      >
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className={`xs:text-[10px] text-[9px] font-medium text-gray-400 transition-colors sm:text-xs ${isSecurityMode ? 'font-display uppercase tracking-widest hover:text-security-red' : 'hover:text-user-cobalt'}`}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="xs:max-h-[300px] custom-scrollbar max-h-[250px] overflow-y-auto sm:max-h-[400px]">
                      {notifications.length === 0 ? (
                        <div className="xs:text-sm xs:py-12 py-8 text-center text-xs font-medium text-gray-500 sm:py-16">
                          No new updates.
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <Link
                            key={n.id}
                            to={n.link || '#'}
                            onClick={() => {
                              markOneRead(n.id);
                              setShowNotifDropdown(false);
                            }}
                            className={`xs:px-4 xs:py-3 block border-b px-3 py-2 transition-colors hover:bg-white/[0.04] sm:px-5 sm:py-4 ${isSecurityMode ? 'border-security-border' : 'border-user-border'} ${!n.is_read ? 'bg-white/[0.02]' : ''}`}
                          >
                            <div className="xs:gap-3 flex items-start gap-2 sm:gap-4">
                              <div
                                className={`xs:w-2 xs:h-2 mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${!n.is_read ? (isSecurityMode ? 'bg-security-red shadow-[0_0_8px_rgba(225,29,72,0.8)]' : 'bg-user-cobalt shadow-[0_0_8px_rgba(59,130,246,0.8)]') : 'bg-gray-700'}`}
                              />
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`xs:text-xs text-[11px] font-bold tracking-tight sm:text-sm ${getNotifColor(n.notification_type)} truncate`}
                                >
                                  {n.title}
                                </p>
                                {n.description && (
                                  <p className="xs:text-[11px] xs:mt-1 mt-0.5 line-clamp-2 text-[10px] leading-snug text-gray-400 sm:text-[13px]">
                                    {n.description}
                                  </p>
                                )}
                                <p
                                  className={`xs:text-[9px] xs:mt-2 mt-1 text-[8px] font-medium text-gray-500 sm:text-[11px] ${isSecurityMode ? 'font-display uppercase tracking-widest' : ''}`}
                                >
                                  {timeSince(n.timestamp)}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                    <div
                      className={`border-t bg-black/20 p-3 text-center sm:p-4 ${isSecurityMode ? 'border-security-border' : 'border-user-border'}`}
                    >
                      <Link
                        to="/inbox"
                        className={`text-xs font-semibold text-gray-300 transition-colors hover:text-white sm:text-sm ${isSecurityMode ? 'font-display uppercase tracking-widest' : ''}`}
                      >
                        View All
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {isAuthenticated ? (
            <div className="group relative flex cursor-pointer items-center gap-2 py-2 pl-1 sm:gap-3 sm:pl-2">
              <div className="mr-1 flex hidden flex-col items-end md:flex">
                <span className="text-[11px] font-bold tracking-tight text-white sm:text-[13px]">
                  {user?.email ? user.email.split('@')[0].slice(0, 5) : user?.username?.slice(0, 5)}
                </span>
              </div>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shadow-lg sm:h-9 sm:w-9 sm:text-base ${isSecurityMode ? 'bg-security-red text-white' : 'bg-gradient-to-tr from-user-cobalt to-user-indigo text-white'}`}
              >
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <ChevronDown className="hidden h-[12px] w-[12px] text-gray-400 transition-all duration-300 group-hover:text-white sm:block sm:h-[14px] sm:w-[14px]" />

              {/* Dropdown */}
              <div
                className={`invisible absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:opacity-100 sm:mt-3 sm:w-64 ${themeConfig.dropdownBg}`}
              >
                <div className="py-2">
                  <div
                    className={`mb-2 border-b px-4 py-3 sm:px-5 sm:py-4 ${isSecurityMode ? 'border-security-border' : 'border-user-border'}`}
                  >
                    <p
                      className={`mb-1 text-[9px] font-bold uppercase text-gray-400 sm:text-[10px] ${isSecurityMode ? 'font-display tracking-widest' : 'tracking-wider'}`}
                    >
                      Signed in as
                    </p>
                    <p className="truncate text-xs font-bold text-white sm:text-sm">
                      {user?.email || user?.username}
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white sm:gap-3 sm:px-5 sm:py-3 sm:text-sm"
                  >
                    <User
                      className="h-[16px] w-[16px] text-gray-400 sm:h-[18px] sm:w-[18px]"
                      strokeWidth={2}
                    />{' '}
                    Profile
                  </Link>
                  <Link
                    to="/inbox"
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white sm:gap-3 sm:px-5 sm:py-3 sm:text-sm"
                  >
                    <Mail
                      className="h-[16px] w-[16px] text-gray-400 sm:h-[18px] sm:w-[18px]"
                      strokeWidth={2}
                    />{' '}
                    Inbox
                  </Link>
                  <Link
                    to="/terminal"
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white sm:gap-3 sm:px-5 sm:py-3 sm:text-sm ${isSecurityMode ? 'font-mono uppercase tracking-widest' : ''}`}
                  >
                    <TerminalSquare
                      className={`h-[16px] w-[16px] sm:h-[18px] sm:w-[18px] ${isSecurityMode ? 'text-security-red' : 'text-user-cobalt'}`}
                      strokeWidth={2}
                    />{' '}
                    Terminal
                  </Link>
                  <div
                    className={`my-1.5 h-px sm:my-2 ${isSecurityMode ? 'bg-security-border' : 'bg-user-border'}`}
                  ></div>
                  <button
                    onClick={logout}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium transition-colors sm:gap-3 sm:px-5 sm:py-3 sm:text-sm ${isSecurityMode ? 'text-security-red hover:bg-security-red/10' : 'text-red-400 hover:bg-red-500/10'}`}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className={`group relative overflow-hidden rounded-lg px-7 py-2.5 text-sm font-bold transition-all ${themeConfig.primaryBtn}`}
            >
              <span className="relative z-10">Sign In</span>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <div className="ml-1 sm:ml-2 lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center p-1.5 text-white transition-opacity hover:opacity-80 sm:p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 sm:h-7 sm:w-7" />
              ) : (
                <Menu className="h-6 w-6 sm:h-7 sm:w-7" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close notification dropdown. Invisible
                full-screen backdrop, not a discrete interactive control —
                keyboard users can already Tab away or close via the trigger. */}
      {showNotifDropdown && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
      )}

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`xs:w-[85vw] fixed inset-y-0 left-0 z-50 w-[80vw] max-w-sm overflow-y-auto shadow-2xl lg:hidden ${themeConfig.dropdownBg}`}
            >
              <div className="xs:pt-24 xs:px-6 xs:pb-12 px-4 pb-8 pt-20">
                <div className="flex flex-col space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={`xs:py-4 xs:px-4 xs:text-lg block rounded-lg px-3 py-3 text-base transition-all duration-300 ${isSecurityMode ? 'text-white hover:bg-white/5 hover:text-security-red' : 'text-gray-200 hover:translate-x-1 hover:bg-white/5 hover:text-white'}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}

                  {/* Mobile Search/Deep Search link */}
                  <Link
                    to="/darkweb"
                    className={`xs:gap-3 xs:py-4 xs:px-4 xs:text-lg flex items-center gap-2 rounded-lg px-3 py-3 text-base transition-all duration-300 ${isSecurityMode ? 'text-white hover:bg-white/5 hover:text-security-red' : 'text-gray-200 hover:translate-x-1 hover:bg-white/5 hover:text-white'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Search className="xs:w-5 xs:h-5 h-4 w-4" /> Deep Search
                  </Link>

                  <div className="xs:pt-6 xs:gap-3 flex flex-col gap-2 pt-4">
                    {isAuthenticated ? (
                      <>
                        <Link
                          to="/profile"
                          className="xs:gap-3 xs:py-4 xs:px-4 xs:text-lg flex items-center gap-2 rounded-lg px-3 py-3 text-base font-semibold text-white hover:bg-white/5"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <User className="xs:w-5 xs:h-5 h-4 w-4" /> Account Profile
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setIsMobileMenuOpen(false);
                          }}
                          className={`xs:py-4 xs:text-sm flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold tracking-wide ${themeConfig.primaryBtn}`}
                        >
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <Link
                        to="/login"
                        className={`xs:py-4 xs:text-sm w-full rounded-xl py-3 text-center text-xs font-bold tracking-wide ${themeConfig.primaryBtn}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
