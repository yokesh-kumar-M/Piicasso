import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, Menu, X, User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import Logo from './Logo';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Notifications State
    const [notifications, setNotifications] = useState([
        { id: 1, title: "Data Sync Complete", desc: "Your data has been successfully synced.", time: "Just now", color: "netflix-red" },
        { id: 2, title: "Server Connected", desc: "Server is online and running.", time: "1 hour ago", color: "green-500" }
    ]);
    const hasUnread = notifications.length > 0;

    const { isAuthenticated, logout, user } = useContext(AuthContext);
    const location = useLocation();

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 0) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Generate', path: '/operation' },
        { name: 'Teams', path: '/squadron' },
        { name: 'History', path: '/dashboard' },
        { name: 'Saved', path: '/workspace' },
        { name: 'Inbox', path: '/inbox' },
    ];

    if (user?.username === 'Yokesh-superuser') {
        navLinks.push({ name: 'Admin Panel', path: '/omega-admin' });
    }

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
                    <Link to="/darkweb" className="hidden sm:block" title="Search">
                        <Search className="w-5 h-5 cursor-pointer text-gray-400 hover:text-white transition-colors" />
                    </Link>

                    <div className="relative group/bell hidden sm:block">
                        <Bell className="w-5 h-5 cursor-pointer text-gray-400 hover:text-white transition-colors" title="Notifications" />
                        {/* Red unread indicator dot */}
                        {hasUnread && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-netflix-red rounded-full border border-black"></span>}

                        {/* Dropdown Menu */}
                        <div className="absolute top-full right-0 mt-6 w-72 bg-[#141414] border border-zinc-800 rounded shadow-2xl opacity-0 invisible group-hover/bell:opacity-100 group-hover/bell:visible transition-all duration-200 z-50">
                            <div className="p-4">
                                <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-2 mb-3">Notifications</h3>
                                <div className="space-y-4">
                                    {hasUnread ? (
                                        notifications.map(n => (
                                            <div key={n.id} className="text-xs text-gray-300 flex flex-col gap-1">
                                                <span className={`text-${n.color} font-bold flex items-center gap-2`}>
                                                    <span className={`w-1.5 h-1.5 bg-${n.color} rounded-full`}></span>
                                                    {n.title}
                                                </span>
                                                <span className="text-gray-400">{n.desc}</span>
                                                <span className="text-[10px] text-zinc-600 font-mono">{n.time}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-xs text-center text-gray-500 py-6">
                                            No new notifications.
                                        </div>
                                    )}
                                </div>
                                {hasUnread && (
                                    <div className="mt-4 pt-3 border-t border-zinc-800 text-center">
                                        <button
                                            onClick={() => setNotifications([])}
                                            className="text-xs text-netflix-red hover:text-red-400 cursor-pointer font-bold bg-transparent border-none outline-none"
                                        >
                                            Mark all as read
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

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
                                    <Link to="/help" className="block px-4 py-2 text-sm hover:underline">Help Center</Link>
                                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm hover:underline text-netflix-red">
                                        Sign out of AEGIS
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

                        {/* Mobile Additional Options */}
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
