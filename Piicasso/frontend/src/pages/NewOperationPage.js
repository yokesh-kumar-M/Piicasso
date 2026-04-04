import React, { useState, useContext } from 'react';
import Navbar from '../components/Navbar';
import KaliTerminal from '../components/KaliTerminal';
import { AuthContext } from '../context/AuthContext';
import { ModeContext } from '../context/ModeContext';
import { Cpu, Shield, BookOpen, Terminal, AlertTriangle } from 'lucide-react';

const NewOperationPage = () => {
    const { isAuthenticated, user } = useContext(AuthContext);
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
    inputBg: isSecurityMode ? 'bg-black border border-security-border focus:border-security-red text-white' : 'bg-white/[0.05] border border-user-border focus:border-user-cobalt text-white backdrop-blur-md',
    btnPrimary: isSecurityMode ? 'security-btn-primary' : 'user-btn-primary',
    btnSecondary: isSecurityMode ? 'bg-security-surface text-gray-300 border border-security-border hover:bg-white/5' : 'bg-white/5 text-user-text border border-user-border hover:bg-white/10 backdrop-blur-md',
    heading: isSecurityMode ? 'security-heading' : 'user-heading',
  };

    const isGod = user?.is_superuser;

    return (
        <div className={`min-h-screen ${theme.bg} flex flex-col`}>
            <Navbar />

            <div className="pt-28 px-4 md:px-12 pb-20 max-w-7xl mx-auto w-full flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 h-full min-h-[80vh]">

                    {/* LEFT: Configuration Panel */}
                    <div className={`lg:col-span-1 flex flex-col p-6 lg:p-8 ${theme.card}`}>
                        <h2 className={`text-2xl mb-8 flex items-center gap-3 ${theme.heading}`}>
                            <Cpu className={`w-6 h-6 ${theme.accentColor}`} /> Terminal Settings
                        </h2>

                        <div className="space-y-8 flex-1">
                            {/* Generation Mode */}
                            <div className="space-y-3">
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Generation Mode</label>
                                <select
                                    value={config.mode}
                                    onChange={(e) => setConfig({ ...config, mode: e.target.value })}
                                    className={`w-full p-3 rounded-lg text-sm outline-none transition-colors ${theme.inputBg}`}
                                >
                                    <option value="standard">Standard Analysis</option>
                                    <option value="fast">Fast Generation</option>
                                    <option value="historical">Historical Correlation</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {config.mode === 'standard' && 'Balanced approach using AI + dictionary analysis.'}
                                    {config.mode === 'fast' && 'Quick generation using algorithmic permutations only.'}
                                    {config.mode === 'historical' && 'Cross-references with previously generated wordlists.'}
                                </p>
                            </div>

                            {/* Complexity Level */}
                            <div className="space-y-3">
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Complexity Level</label>
                                <div className="flex gap-2">
                                    {['Low', 'Med', 'High', 'Insane'].map(lvl => (
                                        <button
                                            key={lvl}
                                            onClick={() => setConfig({ ...config, complexity: lvl })}
                                            className={`flex-1 py-2 text-sm rounded transition-all font-bold ${
                                                config.complexity === lvl
                                                    ? theme.btnPrimary
                                                    : theme.btnSecondary
                                            }`}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {config.complexity === 'Low' && 'Simple patterns: name123, name!'}
                                    {config.complexity === 'Med' && 'Mixed patterns: Name@2024, n4m3!23'}
                                    {config.complexity === 'High' && 'Complex: L33tSp34k, symbol combos, date permutations'}
                                    {config.complexity === 'Insane' && 'All permutations including multi-word combos and special patterns'}
                                </p>
                            </div>

                            {/* Access Level Indicator */}
                            <div className={`p-5 rounded-xl border text-sm font-mono leading-relaxed ${
                                isGod 
                                    ? (isSecurityMode ? 'bg-security-red/10 border-security-red/40 text-red-300' : 'bg-user-cobalt/10 border-user-cobalt/40 text-blue-300')
                                    : (isSecurityMode ? 'bg-black/50 border-security-border text-gray-400' : 'bg-white/5 border-user-border text-user-text/70')
                            }`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Shield className={`w-5 h-5 ${isGod ? theme.accentColor : 'text-gray-500'}`} />
                                    <strong className={isSecurityMode ? 'text-white' : 'text-user-text'}>
                                        {isGod ? 'GOD MODE — Unrestricted Access' : 'Restricted Shell'}
                                    </strong>
                                </div>
                                {isGod ? (
                                    <p>All commands available. Full system access granted.</p>
                                ) : (
                                    <p>This terminal is restricted to <span className="text-green-500 font-bold">HYDRA</span> commands only.</p>
                                )}
                            </div>

                            {/* Quick Reference */}
                            <div className={`p-5 rounded-xl font-mono text-sm ${isSecurityMode ? 'bg-black border border-security-border text-gray-400' : 'bg-white/5 border border-user-border text-user-text/80'}`}>
                                <div className="flex items-center gap-2 mb-4">
                                    <BookOpen className={`w-5 h-5 ${isSecurityMode ? 'text-gray-500' : 'text-user-cobalt'}`} />
                                    <strong className={isSecurityMode ? 'text-gray-300' : 'text-white'}>Quick Reference</strong>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-green-500">hydra</span> — Launch brute force attack
                                    </div>
                                    <div className={`text-xs ${isSecurityMode ? 'text-gray-600' : 'text-user-text/50'}`}>
                                        hydra -l user -P wordlist.txt 192.168.1.1 ssh
                                    </div>
                                    {isGod && (
                                        <>
                                            <div className={`border-t pt-3 mt-3 ${isSecurityMode ? 'border-security-border' : 'border-user-border'}`}>
                                                <span className={isSecurityMode ? 'text-blue-500' : 'text-user-cobalt'}>nmap</span> — Network scanner
                                            </div>
                                            <div className={`text-xs ${isSecurityMode ? 'text-gray-600' : 'text-user-text/50'}`}>
                                                nmap -sV 192.168.1.0/24
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <span className="text-yellow-500">help</span> — Show available commands
                                    </div>
                                    <div>
                                        <span className={isSecurityMode ? 'text-gray-500' : 'text-user-text/70'}>clear</span> — Clear terminal
                                    </div>
                                </div>
                            </div>

                            {/* Tip for generated wordlists */}
                            <div className={`p-4 rounded-xl flex items-start gap-3 border ${isSecurityMode ? 'bg-black/50 border-security-border text-gray-400' : 'bg-white/5 border-user-border text-user-text/80'}`}>
                                <Terminal className={`w-5 h-5 shrink-0 mt-0.5 ${theme.accentColor}`} />
                                <p className="text-xs leading-relaxed">
                                    <strong>Tip:</strong> Generate a wordlist from the Home page, then it will be automatically injected into this terminal for immediate use.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Kali Terminal */}
                    <div className="lg:col-span-2 h-full min-h-[600px] flex flex-col">
                        <KaliTerminal />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default NewOperationPage;
