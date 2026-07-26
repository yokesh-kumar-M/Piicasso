import React, { useEffect, useState, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModeContext } from '../context/ModeContext';

const ModeTearTransition = () => {
  const { mode } = useContext(ModeContext);
  const [prevMode, setPrevMode] = useState(mode);
  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionTo, setTransitionTo] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (mode !== prevMode) {
      setTransitionTo(mode);
      setIsAnimating(true);

      // Clear any pending timeout to avoid stale updates
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      // Wait for animation to finish before allowing normal interaction
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
        setPrevMode(mode);
        timeoutRef.current = null;
      }, 1300); // Extended to cover full animation (1.3s total)
    }

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [mode, prevMode]);

  if (!isAnimating) return null;

  const isToSecurity = transitionTo === 'security';

  return (
    <div className="pointer-events-none fixed inset-0 z-[999999] flex flex-col overflow-hidden">
      <AnimatePresence>
        {isAnimating && (
          <>
            {/* Top Half of the tear */}
            <motion.div
              initial={{ y: 0, rotate: 0 }}
              animate={{ y: '-100%', rotate: -2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.77, 0, 0.175, 1], delay: 0.2 }}
              className={`absolute left-0 top-0 flex h-[55%] w-[150%] origin-top-left items-end justify-center border-b-4 pb-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] ${isToSecurity ? 'border-blue-400 bg-user-cobalt' : 'border-red-500 bg-[#E50914]'} `}
              style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)',
              }}
            >
              <span
                className="font-heading text-6xl font-bold tracking-[0.3em] text-white opacity-30 drop-shadow-lg"
                style={{ transform: 'rotate(2deg)' }}
              >
                {isToSecurity ? 'USER MODE' : 'SECURITY MODE'}
              </span>
            </motion.div>

            {/* Bottom Half of the tear */}
            <motion.div
              initial={{ y: 0, rotate: 0 }}
              animate={{ y: '100%', rotate: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.77, 0, 0.175, 1], delay: 0.2 }}
              className={`absolute bottom-0 right-0 flex h-[55%] w-[150%] origin-bottom-right items-start justify-center border-t-4 pt-10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] ${isToSecurity ? 'border-user-cobalt bg-[#0a192f]' : 'border-red-900 bg-[#0a0a0a]'} `}
              style={{
                clipPath: 'polygon(0 20%, 100% 0, 100% 100%, 0 100%)',
              }}
            >
              <span
                className="font-heading text-6xl font-bold tracking-[0.3em] text-white opacity-30 drop-shadow-lg"
                style={{ transform: 'rotate(-2deg)' }}
              >
                SYSTEM OVERRIDE
              </span>
            </motion.div>

            {/* Flash Effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-0 z-[9999999] bg-white mix-blend-overlay"
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModeTearTransition;
