import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Terminal, ChevronDown, Check } from 'lucide-react';
import { ModeContext } from '../context/ModeContext';

const ModeSwitcher = () => {
  const { mode, switchMode } = useContext(ModeContext);
  const [isOpen, setIsOpen] = useState(false);

  const modes = [
    {
      id: 'user',
      label: 'User Mode',
      icon: Shield,
      color: 'text-[#22C55E]',
      bgColor: 'bg-[#22C55E]/10',
      description: 'Personal Security'
    },
    {
      id: 'security',
      label: 'Security Mode',
      icon: Terminal,
      color: 'text-[#E50914]',
      bgColor: 'bg-[#E50914]/10',
      description: 'Advanced Operations'
    }
  ];

  const currentMode = modes.find(m => m.id === mode) || modes[0];
  const CurrentIcon = currentMode.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-md border border-white/10 bg-[#181818] transition-all hover:border-white/30 hover:bg-[#232323] shadow-md"
      >
        <CurrentIcon className={`w-5 h-5 ${currentMode.color}`} />
        <span className="text-sm font-semibold text-white hidden md:inline tracking-wide">
          {currentMode.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-3 w-64 bg-[#141414]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-2">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold px-3 py-2 border-b border-white/10 mb-2">
                  Select Environment
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
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded transition-all ${
                        isActive
                          ? 'bg-white/10'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full ${m.bgColor} flex items-center justify-center border border-white/5`}>
                        <Icon className={`w-5 h-5 ${m.color}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>{m.label}</span>
                          {isActive && <Check className={`w-4 h-4 ${m.color}`} />}
                        </div>
                        <span className="text-xs text-gray-500 font-medium">{m.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModeSwitcher;
