import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Terminal, X, Check } from 'lucide-react';
import { ModeContext } from '../context/ModeContext';

const ModeSelectionModal = () => {
  const { showModeModal, closeModeModal, selectModeAndClose, mode: currentMode } = useContext(ModeContext);

  if (!showModeModal) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-4xl bg-black/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        >
          <button
            onClick={closeModeModal}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-20 bg-black/50 p-2 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 md:p-10">
            <div className="text-center mb-10">
               <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-full mb-4 ring-1 ring-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                  <Shield className="w-8 h-8 text-white" />
               </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">Select Interface Directive</h2>
              <p className="text-sm md:text-base text-zinc-400">Choose your operational environment.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              
              {/* USER MODE CARD */}
              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectModeAndClose('user')}
                className={`relative p-6 md:p-8 rounded-xl border transition-all text-left overflow-hidden group ${
                  currentMode === 'user'
                    ? 'border-user-cobalt bg-user-cobalt/10 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                    : 'border-white/10 bg-white/5 hover:border-user-cobalt/50 hover:bg-white/10'
                }`}
              >
                {/* Background Glow */}
                <div className={`absolute top-0 right-0 w-64 h-64 bg-user-cobalt/20 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity duration-500 ${currentMode === 'user' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></div>

                {currentMode === 'user' && (
                  <div className="absolute top-4 right-4 bg-user-cobalt text-white p-1 rounded-full shadow-lg">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                
                <div className="w-14 h-14 rounded-xl bg-user-cobalt/20 flex items-center justify-center mb-6 ring-1 ring-user-cobalt/30 shadow-inner">
                  <Shield className="w-7 h-7 text-user-cobalt" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Midnight Cobalt <span className="text-user-cobalt opacity-80">(User)</span></h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  Focus on personal security posture. Analyze password strength, monitor for breaches, and improve credential hygiene through our secure glass-paneled interface.
                </p>
                
                <div className="flex flex-wrap gap-2 mt-auto">
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-user-cobalt/10 border border-user-cobalt/20 text-user-cobalt px-2.5 py-1 rounded">Password Audits</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-user-cobalt/10 border border-user-cobalt/20 text-user-cobalt px-2.5 py-1 rounded">Breach Intel</span>
                </div>
              </motion.button>

              {/* SECURITY MODE CARD */}
              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectModeAndClose('security')}
                className={`relative p-6 md:p-8 rounded-xl border transition-all text-left overflow-hidden group ${
                  currentMode === 'security'
                    ? 'border-security-red bg-security-red/10 shadow-[0_0_30px_rgba(220,38,38,0.15)]'
                    : 'border-white/10 bg-white/5 hover:border-security-red/50 hover:bg-white/10'
                }`}
              >
                {/* Background Glow */}
                <div className={`absolute top-0 right-0 w-64 h-64 bg-security-red/20 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity duration-500 ${currentMode === 'security' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></div>

                {currentMode === 'security' && (
                  <div className="absolute top-4 right-4 bg-security-red text-white p-1 rounded-full shadow-lg">
                    <Check className="w-4 h-4" />
                  </div>
                )}

                <div className="w-14 h-14 rounded-xl bg-security-red/20 flex items-center justify-center mb-6 ring-1 ring-security-red/30 shadow-inner">
                  <Terminal className="w-7 h-7 text-security-red" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Tactical Dark <span className="text-security-red opacity-80">(Security)</span></h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  Deploy advanced operations. Gain full access to PII-based wordlist generators, squad deployments, and deep-web analysis terminals in a high-contrast environment.
                </p>
                
                <div className="flex flex-wrap gap-2 mt-auto">
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-security-red/10 border border-security-red/20 text-security-red px-2.5 py-1 rounded">Wordlist Gen</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-security-red/10 border border-security-red/20 text-security-red px-2.5 py-1 rounded">Dark Web Scan</span>
                </div>
              </motion.button>

            </div>

            <div className="mt-10 pt-6 border-t border-white/5 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-1 bg-white/10 rounded-full mb-4"></div>
              <p className="text-zinc-500 text-[11px] font-mono uppercase tracking-widest">
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
