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
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-2xl mx-4 bg-[#141414] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
        >
          <button
            onClick={closeModeModal}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Choose Your Mode</h2>
              <p className="text-zinc-400">Select how you want to use PIIcasso</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectModeAndClose('user')}
                className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                  currentMode === 'user'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-500'
                }`}
              >
                {currentMode === 'user' && (
                  <div className="absolute top-3 right-3">
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                )}
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 mx-auto">
                  <Shield className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2">User Mode</h3>
                <p className="text-zinc-400 text-sm text-center mb-4">
                  Check your password vulnerability, see if it's been breached, and get recommendations to improve your security.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Password Checker</span>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Breach Alert</span>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Security Score</span>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectModeAndClose('security')}
                className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                  currentMode === 'security'
                    ? 'border-netflix-red bg-red-500/10'
                    : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-500'
                }`}
              >
                {currentMode === 'security' && (
                  <div className="absolute top-3 right-3">
                    <Check className="w-5 h-5 text-netflix-red" />
                  </div>
                )}
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4 mx-auto">
                  <Terminal className="w-8 h-8 text-netflix-red" />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2">Security Mode</h3>
                <p className="text-zinc-400 text-sm text-center mb-4">
                  Full access to PII-based wordlist generation, team collaboration, and advanced security operations.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Wordlist Gen</span>
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Teams</span>
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Terminal</span>
                </div>
              </motion.button>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
              <p className="text-zinc-500 text-sm">
                You can switch modes anytime using the mode switcher in the top-right corner
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ModeSelectionModal;
