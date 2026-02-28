import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import KaliTerminal from '../components/KaliTerminal';
import { Play, Pause, Square, Terminal, Cpu, Clock, Key } from 'lucide-react';

const NewOperationPage = () => {
    return (
        <div className="bg-[#0a0a0a] min-h-screen text-white font-body selection:bg-netflix-red selection:text-white">
            <Navbar />

            <div className="pt-24 px-6 md:px-12 pb-20 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[80vh]">

                    {/* LEFT: Configuration Panel */}
                    <div className="lg:col-span-1 bg-[#141414] border border-zinc-800 rounded p-6 flex flex-col">
                        <h2 className="text-xl font-heading mb-6 flex items-center gap-2">
                            <Cpu className="text-netflix-red w-5 h-5" /> Settings
                        </h2>

                        <div className="space-y-6 flex-1">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 font-bold uppercase">Generation Mode</label>
                                <select className="w-full bg-[#0a0a0a] border border-zinc-700 p-3 rounded text-sm text-gray-300 focus:border-red-500 outline-none">
                                    <option>Standard Analysis</option>
                                    <option>Fast Generation</option>
                                    <option>Historical Correlation</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 font-bold uppercase">Complexity Level</label>
                                <div className="flex gap-2">
                                    {['Low', 'Med', 'High', 'Insane'].map(lvl => (
                                        <button key={lvl} className="flex-1 bg-zinc-900 border border-zinc-800 py-2 text-xs hover:border-red-500 hover:text-white transition-colors text-gray-400 rounded">
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded text-xs text-gray-400 font-mono leading-relaxed">
                                <strong className="text-white block mb-2">Usage Guide:</strong>
                                This terminal is restricted to <span className="text-green-500 font-bold">HYDRA</span> commands only.
                                <br /><br />
                                Example:<br />
                                <span className="text-gray-500">hydra -l user -P wordlist.txt 192.168.1.1 ssh</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Kali Terminal restricted environment */}
                    <div className="lg:col-span-2">
                        <KaliTerminal />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default NewOperationPage;
