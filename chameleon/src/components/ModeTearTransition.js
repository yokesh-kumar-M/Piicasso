import React, { useEffect, useState, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModeContext } from '../context/ModeContext';

/**
 * High-performance 2-Phase Mode Transition Component.
 * Guaranteed opening and closing animation on every mode toggle:
 * Phase 1 ("closing"): The split diagonal cyber-plates slide in and converge at the center seam with an override pulse.
 * Phase 2 ("opening"): The plates part and slide outward to the screen boundaries, revealing the newly activated environment.
 */
const ModeTearTransition = () => {
  const { mode } = useContext(ModeContext);
  const [prevMode, setPrevMode] = useState(mode);
  const [stage, setStage] = useState('idle'); // 'idle' | 'closing' | 'opening'
  const [targetMode, setTargetMode] = useState(mode);
  const timerRef = useRef([]);

  const clearTimers = () => {
    timerRef.current.forEach((t) => clearTimeout(t));
    timerRef.current = [];
  };

  useEffect(() => {
    if (mode !== prevMode) {
      clearTimers();
      setTargetMode(mode);
      setStage('closing');

      // After plates converge, initiate the opening/reveal phase
      const t1 = setTimeout(() => {
        setStage('opening');
        setPrevMode(mode);
      }, 500);

      // Complete the transition and return to idle
      const t2 = setTimeout(() => {
        setStage('idle');
      }, 1050);

      timerRef.current = [t1, t2];
    }

    return () => clearTimers();
  }, [mode, prevMode]);

  if (stage === 'idle') return null;

  const isToSecurity = targetMode === 'security';
  const accentColor = isToSecurity ? '#e11d48' : '#3b82f6';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[999999] flex flex-col overflow-hidden"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={targetMode}
          className="relative h-full w-full"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Top Plate */}
          <motion.div
            initial={{ y: '-110%', rotate: -1 }}
            animate={
              stage === 'closing'
                ? { y: '0%', rotate: 0 }
                : { y: '-115%', rotate: -1.5 }
            }
            transition={{
              duration: stage === 'closing' ? 0.42 : 0.48,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute left-0 top-0 flex h-[58%] w-[130%] origin-top-left items-end justify-center border-b-2 shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 75%, 0 100%)',
              borderColor: accentColor,
              backgroundColor: isToSecurity ? '#0f172a' : '#090d16',
            }}
          >
            <div className="flex items-center gap-3 pb-8 opacity-50">
              <span className="font-mono text-xs tracking-[0.3em] uppercase text-neutral-300">
                {isToSecurity ? 'SECURITY ENVIRONMENT' : 'USER ENVIRONMENT'}
              </span>
            </div>
          </motion.div>

          {/* Bottom Plate */}
          <motion.div
            initial={{ y: '110%', rotate: 1 }}
            animate={
              stage === 'closing'
                ? { y: '0%', rotate: 0 }
                : { y: '115%', rotate: 1.5 }
            }
            transition={{
              duration: stage === 'closing' ? 0.42 : 0.48,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute bottom-0 right-0 flex h-[58%] w-[130%] origin-bottom-right items-start justify-center border-t-2 shadow-[0_-25px_60px_rgba(0,0,0,0.9)]"
            style={{
              clipPath: 'polygon(0 25%, 100% 0, 100% 100%, 0 100%)',
              borderColor: accentColor,
              backgroundColor: isToSecurity ? '#070a12' : '#030712',
            }}
          >
            <div className="flex items-center gap-3 pt-8 opacity-50">
              <span className="font-mono text-xs tracking-[0.3em] uppercase text-neutral-300">
                SYNCHRONIZING CONFIGURATION
              </span>
            </div>
          </motion.div>

          {/* Convergence Seam Light Pulse */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={
              stage === 'closing'
                ? { opacity: [0, 0.8, 0.3] }
                : { opacity: [0.3, 0] }
            }
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute inset-0 bg-white mix-blend-overlay"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ModeTearTransition;
