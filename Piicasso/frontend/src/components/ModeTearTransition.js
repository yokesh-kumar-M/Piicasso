import React, { useEffect, useState, useContext } from 'react';
import { ModeContext } from '../context/ModeContext';
import { motion, AnimatePresence } from 'framer-motion';

const ModeTearTransition = () => {
    const { mode } = useContext(ModeContext);
    const [prevMode, setPrevMode] = useState(mode);
    const [isAnimating, setIsAnimating] = useState(false);
    const [transitionTo, setTransitionTo] = useState(null);

    useEffect(() => {
        if (mode !== prevMode) {
            setTransitionTo(mode);
            setIsAnimating(true);
            
            // Wait for animation to finish before allowing normal interaction
            setTimeout(() => {
                setIsAnimating(false);
                setPrevMode(mode);
            }, 1200); // 1.2s total transition time
        }
    }, [mode, prevMode]);

    if (!isAnimating) return null;

    const isToSecurity = transitionTo === 'security';

    return (
        <div className="fixed inset-0 z-[999999] pointer-events-none overflow-hidden flex flex-col">
            <AnimatePresence>
                {isAnimating && (
                    <>
                        {/* Top Half of the tear */}
                        <motion.div
                            initial={{ y: 0, rotate: 0 }}
                            animate={{ y: '-100%', rotate: -2 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: [0.77, 0, 0.175, 1], delay: 0.2 }}
                            className={`absolute top-0 left-0 w-[150%] h-[55%] origin-top-left flex items-end justify-center pb-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-b-4 
                                ${isToSecurity ? 'bg-user-cobalt border-blue-400' : 'bg-[#E50914] border-red-500'}
                            `}
                            style={{
                                clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)',
                            }}
                        >
                            <span className="text-white font-heading font-bold text-6xl tracking-[0.3em] opacity-30 drop-shadow-lg" style={{ transform: 'rotate(2deg)' }}>
                                {isToSecurity ? 'USER MODE' : 'SECURITY MODE'}
                            </span>
                        </motion.div>

                        {/* Bottom Half of the tear */}
                        <motion.div
                            initial={{ y: 0, rotate: 0 }}
                            animate={{ y: '100%', rotate: 2 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: [0.77, 0, 0.175, 1], delay: 0.2 }}
                            className={`absolute bottom-0 right-0 w-[150%] h-[55%] origin-bottom-right flex items-start justify-center pt-10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] border-t-4 
                                ${isToSecurity ? 'bg-[#0a192f] border-user-cobalt' : 'bg-[#0a0a0a] border-red-900'}
                            `}
                            style={{
                                clipPath: 'polygon(0 20%, 100% 0, 100% 100%, 0 100%)',
                            }}
                        >
                            <span className="text-white font-heading font-bold text-6xl tracking-[0.3em] opacity-30 drop-shadow-lg" style={{ transform: 'rotate(-2deg)' }}>
                                SYSTEM OVERRIDE
                            </span>
                        </motion.div>

                        {/* Flash Effect */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="absolute inset-0 bg-white z-[9999999] mix-blend-overlay"
                        />
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ModeTearTransition;