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
      description: 'Personal Security',
    },
    {
      id: 'security',
      label: 'Security Mode',
      icon: Terminal,
      color: 'text-[#E50914]',
      bgColor: 'bg-[#E50914]/10',
      description: 'Advanced Operations',
    },
  ];

  const currentMode = modes.find((m) => m.id === mode) || modes[0];
  const CurrentIcon = currentMode.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-md border border-white/10 bg-[#181818] px-3 py-2 shadow-md transition-all hover:border-white/30 hover:bg-[#232323]"
      >
        <CurrentIcon className={`h-5 w-5 ${currentMode.color}`} />
        <span className="hidden text-sm font-semibold tracking-wide text-white md:inline">
          {currentMode.label}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
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
              className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-lg border border-white/10 bg-[#141414]/95 shadow-2xl backdrop-blur-xl"
            >
              <div className="p-2">
                <p className="mb-2 border-b border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-gray-400">
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
                      className={`flex w-full items-center gap-3 rounded px-3 py-3 transition-all ${
                        isActive ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div
                        className={`h-10 w-10 rounded-full ${m.bgColor} flex items-center justify-center border border-white/5`}
                      >
                        <Icon className={`h-5 w-5 ${m.color}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}
                          >
                            {m.label}
                          </span>
                          {isActive && <Check className={`h-4 w-4 ${m.color}`} />}
                        </div>
                        <span className="text-xs font-medium text-gray-500">{m.description}</span>
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
