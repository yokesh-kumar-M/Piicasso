import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, Menu, X, User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import Logo from './Logo';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
        { name: 'Mission Control', path: '/' },
        { name: 'Operation', path: '/operation' },
        { name: 'Squadron', path: '/squadron' },
        { name: 'Dark Web', path: '/darkweb' },
        { name: 'Archives', path: '/dashboard' },
        { name: 'Workspace', path: '/workspace' },
    ];

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
                    <Search className="w-5 h-5 cursor-pointer hover:text-gray-300 hidden sm:block" />
                    <Bell className="w-5 h-5 cursor-pointer hover:text-gray-300 hidden sm:block" />

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

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-black/95 absolute top-16 left-0 w-full p-4 border-t border-gray-800">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className="block py-3 text-center text-gray-300 hover:text-white border-b border-gray-800"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
