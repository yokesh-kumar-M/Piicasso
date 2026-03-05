import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, Menu, X, User, Mail } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import Logo from './Logo';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    const { isAuthenticated, logout, user } = useContext(AuthContext);
    const location = useLocation();

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
        const handleScroll = () => setIsScrolled(window.scrollY > 0);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Generate', path: '/operation' },
        { name: 'Teams', path: '/teams' },
        { name: 'History', path: '/dashboard' },
        { name: 'Saved', path: '/workspace' },
    ];

    // All authenticated users get Inbox
    if (isAuthenticated) {
        navLinks.push({ name: 'Inbox', path: '/inbox' });
    }

    if (user?.is_superuser) {
        navLinks.push({ name: 'Admin Panel', path: '/system-admin' });
    }

    const getNotifColor = (type) => {
        switch (type) {
            case 'GENERATION': return 'text-purple-500';
            case 'TEAM': return 'text-blue-500';
            case 'MESSAGE': return 'text-green-500';
            case 'SECURITY': return 'text-red-500';
            case 'ADMIN': return 'text-yellow-500';
            default: return 'text-zinc-400';
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
        <nav className={`fixed top-0 w-full z-50 transition-colors duration-300 ${isScrolled ? 'bg-[#141414]' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
            <div className="px-4 md:px-12 py-4 flex items-center justify-between">

                {/* Left Side: Logo & Links */}
                <div className="flex items-center gap-8">
                    <Link to="/">
                        <Logo className="text-2xl md:text-3xl hover:opacity-80 transition-opacity" />
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`text-sm font-medium transition-colors hover:text-gray-300 ${location.pathname === link.path ? 'text-white font-bold' : 'text-gray-400'}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Right Side: Icons & Profile */}
                <div className="flex items-center gap-6 text-white">
                    <Link to="/darkweb" className="hidden sm:block" title="Breach Search">
                        <Search className="w-5 h-5 cursor-pointer text-gray-400 hover:text-white transition-colors" />
                    </Link>

                    {/* Notification Bell */}
                    {isAuthenticated && (
                        <div className="relative hidden sm:block">
                            <button
                                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                                className="relative"
                            >
                                <Bell className="w-5 h-5 cursor-pointer text-gray-400 hover:text-white transition-colors" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-netflix-red rounded-full border-2 border-black text-[9px] font-bold flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {showNotifDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="absolute top-full right-0 mt-3 w-80 bg-[#141414] border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden"
                                    >
                                        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-white">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={markAllRead}
                                                    className="text-[10px] text-netflix-red hover:text-red-400 font-bold uppercase"
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                            {notifications.length === 0 ? (
                                                <div className="text-xs text-center text-gray-500 py-10">
                                                    No notifications yet.
                                                </div>
                                            ) : (
                                                notifications.slice(0, 10).map(n => (
                                                    <Link
                                                        key={n.id}
                                                        to={n.link || '#'}
                                                        onClick={() => { markOneRead(n.id); setShowNotifDropdown(false); }}
                                                        className={`block px-4 py-3 border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors ${!n.is_read ? 'bg-zinc-900/30' : ''}`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-netflix-red' : 'bg-zinc-700'}`} />
                                                            <div className="min-w-0">
                                                                <p className={`text-xs font-bold ${getNotifColor(n.notification_type)} truncate`}>
                                                                    {n.title}
                                                                </p>
                                                                {n.description && (
                                                                    <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{n.description}</p>
                                                                )}
                                                                <p className="text-[9px] text-zinc-600 font-mono mt-1">{timeSince(n.timestamp)}</p>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {isAuthenticated ? (
                        <div className="group relative flex items-center gap-2 cursor-pointer">
                            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>

                            {/* Dropdown */}
                            <div className="absolute top-full right-0 mt-2 w-48 bg-black border border-gray-800 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <div className="py-2">
                                    <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-800 mb-2">
                                        Signed in as {user?.username}
                                    </div>
                                    <Link to="/profile" className="block px-4 py-2 text-sm hover:underline">Account</Link>
                                    <Link to="/inbox" className="block px-4 py-2 text-sm hover:underline flex items-center gap-2">
                                        <Mail className="w-3 h-3" /> Inbox
                                    </Link>
                                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm hover:underline text-netflix-red">
                                        Sign out of PIIcasso
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Link to="/login" className="bg-netflix-red px-4 py-1 rounded text-sm font-bold hover:bg-red-700 transition">
                            Sign In
                        </Link>
                    )}

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden">
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Click outside to close notification dropdown */}
            {showNotifDropdown && (
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
            )}

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-[#0a0a0a]/95 backdrop-blur-md absolute top-[68px] left-0 w-full px-6 pt-6 pb-12 border-t border-zinc-900 shadow-2xl h-[calc(100vh-68px)] overflow-y-auto">
                    <div className="flex flex-col space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className="block py-4 text-center font-bold tracking-widest uppercase text-gray-400 hover:text-white border-b border-zinc-800/50 hover:bg-zinc-900/30 rounded transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}

                        <div className="pt-8 flex flex-col gap-4">
                            {isAuthenticated ? (
                                <>
                                    <Link to="/profile" className="flex items-center justify-center gap-2 py-4 text-xs font-bold tracking-widest uppercase text-gray-300 hover:text-white bg-zinc-900/50 rounded border border-zinc-800" onClick={() => setIsMobileMenuOpen(false)}>
                                        <User className="w-4 h-4" /> My Profile
                                    </Link>
                                    <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full py-4 text-xs font-bold tracking-widest uppercase text-netflix-red bg-red-900/10 border border-red-900/30 rounded hover:bg-red-900/30 transition-colors flex items-center justify-center">
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <Link to="/login" className="w-full py-4 text-center text-xs font-bold tracking-widest uppercase text-white bg-netflix-red rounded shadow-lg hover:bg-red-700 transition" onClick={() => setIsMobileMenuOpen(false)}>
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
