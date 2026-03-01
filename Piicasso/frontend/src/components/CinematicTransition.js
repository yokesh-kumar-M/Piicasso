import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_LABELS = {
    '/': 'PIIcasso',
    '/operation': 'Generate Wordlist',
    '/workspace': 'Saved Wordlists',
    '/login': 'Sign In',
    '/register': 'Create Account',
    '/forgot-password': 'Reset Password',
    '/profile': 'My Profile',
    '/teams': 'Teams',
    '/darkweb': 'Dark Web Search',
    '/system-admin': 'Admin Panel',
    '/dashboard': 'History',
    '/result': 'Results',
    '/inbox': 'Inbox',
};

const CinematicTransition = ({ children }) => {
    const location = useLocation();
    const [displayLocation, setDisplayLocation] = useState(location);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        if (location.pathname !== displayLocation.pathname && !isTransitioning) {
            setIsTransitioning(true);

            setTimeout(() => {
                setDisplayLocation(location);
            }, 250);

            setTimeout(() => {
                setIsTransitioning(false);
            }, 900);
        }
    }, [location.pathname, displayLocation.pathname, isTransitioning]);

    const label = PAGE_LABELS[location.pathname] || 'Loading';

    return (
        <div className="relative w-full h-full flex-1 flex flex-col">
            <div className="flex-1 flex flex-col w-full h-full">
                {children(displayLocation)}
            </div>

            <AnimatePresence>
                {isTransitioning && (
                    <motion.div
                        className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 0.15 } }}
                        exit={{ opacity: 0, transition: { duration: 0.5, delay: 0.2, ease: 'easeIn' } }}
                    >
                        <motion.div
                            className="flex flex-col items-center gap-3"
                            initial={{ opacity: 0, y: 12, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } }}
                            exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.35 } }}
                        >
                            {/* Brand mark */}
                            <span className="text-[10px] tracking-[0.4em] text-zinc-500 font-mono uppercase">PIIcasso</span>

                            {/* Page name — clean, no buzzwords */}
                            <span className="text-white text-xl md:text-2xl font-bold tracking-wide">
                                {label}
                            </span>

                            {/* Loading bar */}
                            <div className="w-32 h-[2px] bg-zinc-800 rounded-full overflow-hidden mt-1">
                                <motion.div
                                    className="h-full bg-red-600"
                                    initial={{ width: '0%' }}
                                    animate={{ width: '100%', transition: { duration: 0.7, ease: 'easeInOut' } }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CinematicTransition;
