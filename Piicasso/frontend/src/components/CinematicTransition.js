import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const getPageTitle = (pathname) => {
    if (pathname === '/') return 'AEGIS';
    if (pathname === '/operation') return 'GENERATE';
    if (pathname === '/workspace') return 'SAVED';
    if (pathname === '/login') return 'LOGIN';
    if (pathname === '/register') return 'REGISTER';
    if (pathname === '/forgot-password') return 'FORGOT PASSWORD';
    if (pathname === '/profile') return 'PROFILE';
    if (pathname === '/squadron') return 'TEAMS';
    if (pathname === '/darkweb') return 'SEARCH';
    if (pathname === '/omega-admin') return 'ADMIN PANEL';
    if (pathname === '/dashboard') return 'HISTORY';
    if (pathname === '/result') return 'RESULTS';
    return 'LOADING';
};

const CinematicTransition = ({ children }) => {
    const location = useLocation();
    const [displayLocation, setDisplayLocation] = useState(location);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        // If the location changes, we freeze the background to the OLD page,
        // fade in the black screen and the word animation,
        // then swap the location to the NEW page secretly in the background,
        // then zoom the black veil out to reveal the NEW page.
        if (location.pathname !== displayLocation.pathname && !isTransitioning) {
            setIsTransitioning(true);

            // Wait for black overlay to become briefly opaque before swapping the background DOM
            setTimeout(() => {
                setDisplayLocation(location);
            }, 300); // Shorter swap time for speed

            // Finish the animation and remove overlay within rapid 1.3s
            setTimeout(() => {
                setIsTransitioning(false);
            }, 1300);
        }
    }, [location.pathname, displayLocation.pathname, isTransitioning]);

    const title = getPageTitle(location.pathname);
    const letters = title.split("");

    return (
        <div className="relative w-full h-full flex-1 flex flex-col">
            {/* The actual underlying page content */}
            <div className="flex-1 flex flex-col w-full h-full">
                {/* We render the delayed route location so it swaps exactly when hidden */}
                {children(displayLocation)}
            </div>

            {/* The cinematic overlay (Netflix style) */}
            <AnimatePresence>
                {isTransitioning && (
                    <motion.div
                        className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 0.2 } }}
                        exit={{ opacity: 0, transition: { duration: 0.6, delay: 0.3, ease: "easeIn" } }}
                    >
                        <motion.div
                            className="flex overflow-visible pb-4"
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={{
                                exit: { scale: 35, filter: "blur(3px)", transition: { duration: 0.8, ease: "easeInOut" } }
                            }}
                        >
                            {letters.map((char, index) => (
                                <motion.span
                                    key={index}
                                    variants={{
                                        hidden: { opacity: 0, y: 15, scale: 0.9 },
                                        visible: {
                                            opacity: 1,
                                            y: 0,
                                            scale: 1,
                                            transition: {
                                                duration: 0.2,
                                                delay: index * 0.02,
                                                ease: "easeOut"
                                            }
                                        },
                                        exit: { opacity: 0, transition: { duration: 0.4, delay: 0.3 } }
                                    }}
                                    className={`text-netflix-red text-lg md:text-2xl lg:text-3xl font-bold font-logo uppercase tracking-widest origin-center ${char === ' ' ? 'w-2 md:w-3' : ''}`}
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CinematicTransition;
