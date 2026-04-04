import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, CheckCircle, Activity, Cpu } from 'lucide-react';
import { ModeContext } from '../context/ModeContext';

export const GenerationModal = ({ isOpen, logs, progress, status }) => {
  const { mode: appMode } = useContext(ModeContext) || { mode: 'security' };
  const isSecurityMode = appMode === 'security';

  if (!isOpen) return null;

  const theme = {
    card: isSecurityMode ? 'security-card' : 'user-glass-panel',
    accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
    accentBg: isSecurityMode ? 'bg-security-red' : 'bg-user-cobalt',
    gradientFrom: isSecurityMode ? 'from-security-red' : 'from-user-cobalt',
    glowShadow: isSecurityMode ? 'shadow-[0_0_20px_rgba(220,38,38,0.8)]' : 'shadow-[0_0_20px_rgba(37,99,235,0.8)]',
    iconBg: isSecurityMode ? 'bg-security-red/20' : 'bg-user-cobalt/20',
    progressBg: isSecurityMode ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-gradient-to-r from-user-cobalt to-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.5)]',
    cursorColor: isSecurityMode ? 'bg-security-red' : 'bg-user-cobalt',
    step1Active: isSecurityMode ? 'bg-red-900/20 border-security-red/30' : 'bg-user-cobalt/10 border-user-cobalt/30',
    step2Active: isSecurityMode ? 'bg-orange-900/20 border-orange-500/30 text-orange-500' : 'bg-user-indigo/10 border-user-indigo/30 text-user-indigo',
    step2Icon: isSecurityMode ? 'text-orange-500' : 'text-user-indigo',
    step1Icon: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`relative w-full max-w-2xl border-white/10 rounded-2xl overflow-hidden backdrop-blur-2xl ${theme.card}`}
        >
          {/* Subtle Glow */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-gradient-to-r from-transparent via-current to-transparent ${theme.gradientFrom} ${theme.glowShadow}`}></div>

          {/* Header */}
          <div className="border-b border-white/5 bg-black/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${theme.iconBg} ${theme.accentColor}`}>
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-white font-bold tracking-tight text-base">
                  Analysis Engine
                </h3>
                <p className={`text-xs font-medium tracking-wide uppercase ${theme.accentColor}`}>Processing Target Vectors</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/5 self-end sm:self-auto">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSecurityMode ? 'bg-red-400' : 'bg-green-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isSecurityMode ? 'bg-red-500' : 'bg-green-500'}`}></span>
              </span>
              <span className="text-[10px] text-gray-300 font-semibold tracking-wider uppercase">Active Thread</span>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
            {/* Progress Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-sm font-semibold text-gray-200 tracking-wide truncate pr-4">{status}</span>
                <span className={`text-xl font-bold tracking-tighter ${theme.accentColor}`}>{progress}%</span>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                {/* Simulated background processing pattern */}
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[glass-shine_2s_linear_infinite]"></div>
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={`h-full rounded-full relative ${theme.progressBg}`}
                >
                    <div className="absolute top-0 right-0 w-4 h-full bg-white/50 blur-[2px]"></div>
                </motion.div>
              </div>
            </div>

            {/* Terminal Logs */}
            <div className="bg-black/60 rounded-xl p-4 sm:p-5 h-48 sm:h-64 overflow-y-auto font-mono text-xs space-y-2.5 border border-white/5 shadow-inner custom-scrollbar relative">
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-start gap-3 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-gray-300'}`}
                >
                  <span className="text-gray-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className="flex-1 leading-relaxed break-words">{log.message}</span>
                </motion.div>
              ))}
              {/* Blinking cursor */}
              {progress < 100 && (
                 <motion.div 
                    animate={{ opacity: [1, 0, 1] }} 
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className={`w-2 h-3 mt-2 inline-block ${theme.cursorColor}`}
                 />
              )}
            </div>

            {/* Status Icons */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 border-t border-white/5 pt-4 sm:pt-6">
              <div className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-colors duration-500 ${progress >= 20 ? theme.step1Active : 'bg-black/20 border-white/5'} border`}>
                <Shield className={`w-5 h-5 sm:w-6 sm:h-6 mb-2 sm:mb-3 transition-colors ${progress >= 20 ? theme.step1Icon : 'text-gray-600'}`} strokeWidth={2} />
                <span className={`text-[9px] sm:text-[11px] font-bold tracking-wider uppercase transition-colors ${progress >= 20 ? theme.step1Icon : 'text-gray-500'}`}>Vectoring</span>
              </div>
              <div className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-colors duration-500 ${progress >= 50 ? theme.step2Active : 'bg-black/20 border-white/5'} border`}>
                <Cpu className={`w-5 h-5 sm:w-6 sm:h-6 mb-2 sm:mb-3 transition-colors ${progress >= 50 ? theme.step2Icon : 'text-gray-600'}`} strokeWidth={2} />
                <span className={`text-[9px] sm:text-[11px] font-bold tracking-wider uppercase transition-colors ${progress >= 50 ? theme.step2Icon : 'text-gray-500'}`}>Compute</span>
              </div>
              <div className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-colors duration-500 ${progress >= 100 ? 'bg-green-500/10 border-green-500/30' : 'bg-black/20 border-white/5'} border`}>
                <CheckCircle className={`w-5 h-5 sm:w-6 sm:h-6 mb-2 sm:mb-3 transition-colors ${progress >= 100 ? 'text-green-400' : 'text-gray-600'}`} strokeWidth={2} />
                <span className={`text-[9px] sm:text-[11px] font-bold tracking-wider uppercase transition-colors ${progress >= 100 ? 'text-green-400' : 'text-gray-500'}`}>Finalize</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
