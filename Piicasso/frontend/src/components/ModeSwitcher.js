import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Terminal, ChevronDown, Check, Menu, X } from 'lucide-react';
import { ModeContext } from '../context/ModeContext';

const ModeSwitcher = () => {
  const { mode, switchMode, openModeModal } = useContext(ModeContext);
  const [isOpen, setIsOpen] = useState(false);

  const modes = [
    {
      id: 'user',
      label: 'User Mode',
      icon: Shield,
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
      description: 'Password Security'
    },
    {
      id: 'security',
      label: 'Security Mode',
      icon: Terminal,
      color: 'text-netflix-red',
      bgColor: 'bg-red-500/20',
      description: 'Operations'
    }
  ];

  const currentMode = modes.find(m => m.id === mode) || modes[0];
  const CurrentIcon = currentMode.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2 py-2 rounded-lg border transition-all ${
          mode === 'user'
            ? 'border-green-500/50 bg-green-500/10'
            : 'border-netflix-red/50 bg-red-500/10'
        } hover:opacity-80`}
      >
        <CurrentIcon className={`w-5 h-5 ${currentMode.color}`} />
        <span className="text-xs font-medium text-white hidden md:inline">
          {currentMode.label}
        </span>
        <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-56 bg-[#141414] border border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden"
            >
              <div className="p-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider px-3 py-2">
                  Switch Mode
                </p>
                {modes.map((m) => {
                  const Icon = m.icon;
                  const isActive = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        switchMode(m.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-zinc-800'
                          : 'hover:bg-zinc-900'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${m.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${m.color}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{m.label}</span>
                          {isActive && <Check className="w-3 h-3 text-green-500" />}
                        </div>
                        <span className="text-xs text-zinc-500">{m.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              <div className="border-t border-zinc-800 p-2">
                <button
                  onClick={() => {
                    openModeModal();
                    setIsOpen(false);
                  }}
                  className="w-full text-center py-2 text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  Choose mode later
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModeSwitcher;
