import React, { useState, useContext } from 'react';
import Navbar from '../components/Navbar';
import KaliTerminal from '../components/KaliTerminal';
import { AuthContext } from '../context/AuthContext';
import { Cpu, Shield, BookOpen, Terminal, AlertTriangle } from 'lucide-react';

const NewOperationPage = () => {
    const { isAuthenticated, user } = useContext(AuthContext);
    const [config, setConfig] = useState({
        mode: 'standard',
        complexity: 'Med',
    });

    const isGod = user?.is_superuser;

    return (
        <div className="bg-[#0a0a0a] min-h-screen text-white font-body selection:bg-netflix-red selection:text-white">
            <Navbar />

            <div className="pt-24 px-4 md:px-12 pb-20 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 lg:h-[80vh]">

                    {/* LEFT: Configuration Panel */}
                    <div className="lg:col-span-1 bg-[#141414] border border-zinc-800 rounded p-6 flex flex-col">
                        <h2 className="text-xl font-heading mb-6 flex items-center gap-2">
                            <Cpu className="text-netflix-red w-5 h-5" /> Terminal Settings
                        </h2>

                        <div className="space-y-6 flex-1">
                            {/* Generation Mode */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 font-bold uppercase">Generation Mode</label>
                                <select
                                    value={config.mode}
                                    onChange={(e) => setConfig({ ...config, mode: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-zinc-700 p-3 rounded text-sm text-gray-300 focus:border-red-500 outline-none transition-colors"
                                >
                                    <option value="standard">Standard Analysis</option>
                                    <option value="fast">Fast Generation</option>
                                    <option value="historical">Historical Correlation</option>
                                </select>
                                <p className="text-[10px] text-zinc-600">
                                    {config.mode === 'standard' && 'Balanced approach using AI + dictionary analysis.'}
                                    {config.mode === 'fast' && 'Quick generation using algorithmic permutations only.'}
                                    {config.mode === 'historical' && 'Cross-references with previously generated wordlists.'}
                                </p>
                            </div>

                            {/* Complexity Level */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 font-bold uppercase">Complexity Level</label>
                                <div className="flex gap-2">
                                    {['Low', 'Med', 'High', 'Insane'].map(lvl => (
                                        <button
                                            key={lvl}
                                            onClick={() => setConfig({ ...config, complexity: lvl })}
                                            className={`flex-1 border py-2 text-xs rounded transition-all font-bold ${
                                                config.complexity === lvl
                                                    ? 'bg-red-600 border-red-500 text-white shadow-[0_0_10px_rgba(229,9,20,0.3)]'
                                                    : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:border-zinc-600 hover:text-white'
                                            }`}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-zinc-600">
                                    {config.complexity === 'Low' && 'Simple patterns: name123, name!'}
                                    {config.complexity === 'Med' && 'Mixed patterns: Name@2024, n4m3!23'}
                                    {config.complexity === 'High' && 'Complex: L33tSp34k, symbol combos, date permutations'}
                                    {config.complexity === 'Insane' && 'All permutations including multi-word combos and special patterns'}
                                </p>
                            </div>

                            {/* Access Level Indicator */}
                            <div className={`p-4 rounded border text-xs font-mono leading-relaxed ${
                                isGod 
                                    ? 'bg-red-900/10 border-red-900/40 text-red-300'
                                    : 'bg-zinc-900/50 border-zinc-800 text-gray-400'
                            }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className={`w-4 h-4 ${isGod ? 'text-red-500' : 'text-zinc-500'}`} />
                                    <strong className="text-white">
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
                            <div className="p-4 bg-black/50 border border-zinc-800 rounded text-xs text-gray-400 font-mono">
                                <div className="flex items-center gap-2 mb-3">
                                    <BookOpen className="w-4 h-4 text-zinc-500" />
                                    <strong className="text-zinc-300">Quick Reference</strong>
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-green-500">hydra</span> — Launch brute force attack
                                    </div>
                                    <div className="text-zinc-600">
                                        hydra -l user -P wordlist.txt 192.168.1.1 ssh
                                    </div>
                                    {isGod && (
                                        <>
                                            <div className="border-t border-zinc-800 pt-2 mt-2">
                                                <span className="text-blue-500">nmap</span> — Network scanner
                                            </div>
                                            <div className="text-zinc-600">
                                                nmap -sV 192.168.1.0/24
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <span className="text-yellow-500">help</span> — Show available commands
                                    </div>
                                    <div>
                                        <span className="text-zinc-500">clear</span> — Clear terminal
                                    </div>
                                </div>
                            </div>

                            {/* Tip for generated wordlists */}
                            <div className="bg-blue-900/10 border border-blue-900/30 p-3 rounded flex items-start gap-2">
                                <Terminal className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-blue-300">
                                    <strong>Tip:</strong> Generate a wordlist from the Home page, then it will be automatically injected into this terminal for immediate use.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Kali Terminal */}
                    <div className="lg:col-span-2 min-h-[500px]">
                        <KaliTerminal />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default NewOperationPage;
