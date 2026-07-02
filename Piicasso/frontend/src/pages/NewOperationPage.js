import React, { useState, useContext } from 'react';
import { Cpu, Shield, BookOpen, Terminal } from 'lucide-react';
import DesignAppShell from '../components/design/dashboard/DesignAppShell.jsx';
import KaliTerminal from '../components/KaliTerminal';
import { AuthContext } from '../context/AuthContext';
import { ModeContext } from '../context/ModeContext';

const NewOperationPage = () => {
  const { user } = useContext(AuthContext);
  const [config, setConfig] = useState({
    mode: 'standard',
    complexity: 'Med',
  });
  const { mode: appMode } = useContext(ModeContext) || { mode: 'security' };
  const isSecurityMode = appMode === 'security';

  const theme = {
    bg: 'bg-transparent', // Handled globally by body class
    accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
    card: isSecurityMode ? 'security-card' : 'user-glass-panel',
    inputBg: isSecurityMode
      ? 'bg-black border border-security-border focus:border-security-red text-white'
      : 'bg-white/[0.05] border border-user-border focus:border-user-cobalt text-white backdrop-blur-md',
    btnPrimary: isSecurityMode ? 'security-btn-primary' : 'user-btn-primary',
    btnSecondary: isSecurityMode
      ? 'bg-security-surface text-gray-300 border border-security-border hover:bg-white/5'
      : 'bg-white/5 text-user-text border border-user-border hover:bg-white/10 backdrop-blur-md',
    heading: isSecurityMode ? 'security-heading' : 'user-heading',
  };

  const isGod = user?.is_superuser;

  return (
    <DesignAppShell activeKey="operation">
      <div
        className="mx-auto w-full max-w-7xl flex-1 px-4 pb-20 pt-20 md:px-12 md:pt-28"
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        <div className="responsive-dashboard-height grid h-full grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* LEFT: Configuration Panel */}
          <div className={`flex flex-col p-5 md:p-6 lg:col-span-1 lg:p-8 ${theme.card}`}>
            <h2
              className={`mb-6 flex items-center gap-3 text-xl md:mb-8 md:text-2xl ${theme.heading}`}
            >
              <Cpu className={`h-5 w-5 md:h-6 md:w-6 ${theme.accentColor}`} /> Terminal Settings
            </h2>

            <div className="flex-1 space-y-8">
              {/* Generation Mode */}
              <div className="space-y-3">
                <label
                  className="text-xs font-bold uppercase tracking-widest text-gray-400"
                  htmlFor="operation-mode"
                >
                  Generation Mode
                </label>
                <select
                  id="operation-mode"
                  value={config.mode}
                  onChange={(e) => setConfig({ ...config, mode: e.target.value })}
                  className={`w-full rounded-lg p-3 text-sm outline-none transition-colors ${theme.inputBg}`}
                >
                  <option value="standard">Standard Analysis</option>
                  <option value="fast">Fast Generation</option>
                  <option value="historical">Historical Correlation</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {config.mode === 'standard' &&
                    'Balanced approach using AI + dictionary analysis.'}
                  {config.mode === 'fast' &&
                    'Quick generation using algorithmic permutations only.'}
                  {config.mode === 'historical' &&
                    'Cross-references with previously generated wordlists.'}
                </p>
              </div>

              {/* Complexity Level */}
              <div className="space-y-3">
                {/* Not a native form control — a button-group toggle, so this is a
                                    <span>, not a <label> (labels must pair with an input/select/textarea). */}
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Complexity Level
                </span>
                <div className="flex flex-wrap gap-2">
                  {['Low', 'Med', 'High', 'Insane'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setConfig({ ...config, complexity: lvl })}
                      className={`min-w-[60px] flex-1 rounded py-3 text-sm font-bold transition-all ${
                        config.complexity === lvl ? theme.btnPrimary : theme.btnSecondary
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {config.complexity === 'Low' && 'Simple patterns: name123, name!'}
                  {config.complexity === 'Med' && 'Mixed patterns: Name@2024, n4m3!23'}
                  {config.complexity === 'High' &&
                    'Complex: L33tSp34k, symbol combos, date permutations'}
                  {config.complexity === 'Insane' &&
                    'All permutations including multi-word combos and special patterns'}
                </p>
              </div>

              {/* Access Level Indicator */}
              <div
                className={`rounded-xl border p-5 font-mono text-sm leading-relaxed ${
                  isGod
                    ? isSecurityMode
                      ? 'border-security-red/40 bg-security-red/10 text-red-300'
                      : 'border-user-cobalt/40 bg-user-cobalt/10 text-blue-300'
                    : isSecurityMode
                      ? 'border-security-border bg-black/50 text-gray-400'
                      : 'border-user-border bg-white/5 text-user-text/70'
                }`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <Shield className={`h-5 w-5 ${isGod ? theme.accentColor : 'text-gray-500'}`} />
                  <strong className={isSecurityMode ? 'text-white' : 'text-user-text'}>
                    {isGod ? 'GOD MODE — Unrestricted Access' : 'Restricted Shell'}
                  </strong>
                </div>
                {isGod ? (
                  <p>All commands available. Full system access granted.</p>
                ) : (
                  <p>
                    This terminal is restricted to{' '}
                    <span className="font-bold text-green-500">HYDRA</span> commands only.
                  </p>
                )}
              </div>

              {/* Quick Reference */}
              <div
                className={`rounded-xl p-5 font-mono text-sm ${isSecurityMode ? 'border border-security-border bg-black text-gray-400' : 'border border-user-border bg-white/5 text-user-text/80'}`}
              >
                <div className="mb-4 flex items-center gap-2">
                  <BookOpen
                    className={`h-5 w-5 ${isSecurityMode ? 'text-gray-500' : 'text-user-cobalt'}`}
                  />
                  <strong className={isSecurityMode ? 'text-gray-300' : 'text-white'}>
                    Quick Reference
                  </strong>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-green-500">hydra</span> — Launch brute force attack
                  </div>
                  <div
                    className={`text-xs ${isSecurityMode ? 'text-gray-600' : 'text-user-text/50'}`}
                  >
                    hydra -l user -P wordlist.txt 192.168.1.1 ssh
                  </div>
                  {isGod && (
                    <>
                      <div
                        className={`mt-3 border-t pt-3 ${isSecurityMode ? 'border-security-border' : 'border-user-border'}`}
                      >
                        <span className={isSecurityMode ? 'text-blue-500' : 'text-user-cobalt'}>
                          nmap
                        </span>{' '}
                        — Network scanner
                      </div>
                      <div
                        className={`text-xs ${isSecurityMode ? 'text-gray-600' : 'text-user-text/50'}`}
                      >
                        nmap -sV 192.168.1.0/24
                      </div>
                    </>
                  )}
                  <div>
                    <span className="text-yellow-500">help</span> — Show available commands
                  </div>
                  <div>
                    <span className={isSecurityMode ? 'text-gray-500' : 'text-user-text/70'}>
                      clear
                    </span>{' '}
                    — Clear terminal
                  </div>
                </div>
              </div>

              {/* Tip for generated wordlists */}
              <div
                className={`flex items-start gap-3 rounded-xl border p-4 ${isSecurityMode ? 'border-security-border bg-black/50 text-gray-400' : 'border-user-border bg-white/5 text-user-text/80'}`}
              >
                <Terminal className={`mt-0.5 h-5 w-5 shrink-0 ${theme.accentColor}`} />
                <p className="text-xs leading-relaxed">
                  <strong>Tip:</strong> Generate a wordlist from the Home page, then it will be
                  automatically injected into this terminal for immediate use.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Kali Terminal */}
          <div className="flex h-full min-h-[300px] flex-col md:min-h-[500px] lg:col-span-2">
            <KaliTerminal />
          </div>
        </div>
      </div>
    </DesignAppShell>
  );
};

export default NewOperationPage;
