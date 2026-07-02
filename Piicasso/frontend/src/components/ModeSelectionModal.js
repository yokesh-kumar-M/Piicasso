import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Terminal, X, Check } from 'lucide-react';
import { ModeContext } from '../context/ModeContext';

const ModeSelectionModal = () => {
  const {
    showModeModal,
    closeModeModal,
    selectModeAndClose,
    mode: currentMode,
  } = useContext(ModeContext);

  if (!showModeModal) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl"
        >
          <button
            onClick={closeModeModal}
            className="absolute right-4 top-4 z-20 rounded-full bg-black/50 p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6 md:p-10">
            <div className="mb-10 text-center">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-white/5 p-3 shadow-[0_0_30px_rgba(255,255,255,0.05)] ring-1 ring-white/10">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h2 className="mb-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
                Select Interface Directive
              </h2>
              <p className="text-sm text-zinc-400 md:text-base">
                Choose your operational environment.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              {/* USER MODE CARD */}
              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectModeAndClose('user')}
                className={`group relative overflow-hidden rounded-xl border p-6 text-left transition-all md:p-8 ${
                  currentMode === 'user'
                    ? 'border-user-cobalt bg-user-cobalt/10 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                    : 'border-white/10 bg-white/5 hover:border-user-cobalt/50 hover:bg-white/10'
                }`}
              >
                {/* Background Glow */}
                <div
                  className={`absolute right-0 top-0 -mr-32 -mt-32 h-64 w-64 rounded-full bg-user-cobalt/20 blur-3xl transition-opacity duration-500 ${currentMode === 'user' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}
                ></div>

                {currentMode === 'user' && (
                  <div className="absolute right-4 top-4 rounded-full bg-user-cobalt p-1 text-white shadow-lg">
                    <Check className="h-4 w-4" />
                  </div>
                )}

                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-user-cobalt/20 shadow-inner ring-1 ring-user-cobalt/30">
                  <Shield className="h-7 w-7 text-user-cobalt" />
                </div>

                <h3 className="mb-3 text-xl font-bold tracking-tight text-white">
                  Midnight Cobalt <span className="text-user-cobalt opacity-80">(User)</span>
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-zinc-400">
                  Focus on personal security posture. Analyze password strength, monitor for
                  breaches, and improve credential hygiene through our secure glass-paneled
                  interface.
                </p>

                <div className="mt-auto flex flex-wrap gap-2">
                  <span className="rounded border border-user-cobalt/20 bg-user-cobalt/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-user-cobalt">
                    Password Audits
                  </span>
                  <span className="rounded border border-user-cobalt/20 bg-user-cobalt/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-user-cobalt">
                    Breach Intel
                  </span>
                </div>
              </motion.button>

              {/* SECURITY MODE CARD */}
              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectModeAndClose('security')}
                className={`group relative overflow-hidden rounded-xl border p-6 text-left transition-all md:p-8 ${
                  currentMode === 'security'
                    ? 'border-security-red bg-security-red/10 shadow-[0_0_30px_rgba(220,38,38,0.15)]'
                    : 'border-white/10 bg-white/5 hover:border-security-red/50 hover:bg-white/10'
                }`}
              >
                {/* Background Glow */}
                <div
                  className={`absolute right-0 top-0 -mr-32 -mt-32 h-64 w-64 rounded-full bg-security-red/20 blur-3xl transition-opacity duration-500 ${currentMode === 'security' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}
                ></div>

                {currentMode === 'security' && (
                  <div className="absolute right-4 top-4 rounded-full bg-security-red p-1 text-white shadow-lg">
                    <Check className="h-4 w-4" />
                  </div>
                )}

                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-security-red/20 shadow-inner ring-1 ring-security-red/30">
                  <Terminal className="h-7 w-7 text-security-red" />
                </div>

                <h3 className="mb-3 text-xl font-bold tracking-tight text-white">
                  Tactical Dark <span className="text-security-red opacity-80">(Security)</span>
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-zinc-400">
                  Deploy advanced operations. Gain full access to PII-based wordlist generators,
                  squad deployments, and deep-web analysis terminals in a high-contrast environment.
                </p>

                <div className="mt-auto flex flex-wrap gap-2">
                  <span className="rounded border border-security-red/20 bg-security-red/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-security-red">
                    Wordlist Gen
                  </span>
                  <span className="rounded border border-security-red/20 bg-security-red/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-security-red">
                    Dark Web Scan
                  </span>
                </div>
              </motion.button>
            </div>

            <div className="mt-10 flex flex-col items-center justify-center border-t border-white/5 pt-6 text-center">
              <div className="mb-4 h-1 w-12 rounded-full bg-white/10"></div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                Interface settings can be recalibrated at any time via the top-right control array.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ModeSelectionModal;
