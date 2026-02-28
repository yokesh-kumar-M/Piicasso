import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ShieldAlert, Database, Globe,
    AlertTriangle, Server, Loader2, Skull,
    Terminal, Lock, Eye
} from 'lucide-react';

const MOCK_LEAKS = [
    { id: 1, name: 'MegaCorp_Internal_2023.txt', size: '2.4 GB', count: '1.2M entries', type: 'Employee Data' },
    { id: 2, name: 'Global_Bank_SQL_Dump.sql', size: '840 MB', count: '450k entries', type: 'Financial Docs' },
    { id: 3, name: 'SocialNet_User_PII_v4.csv', size: '12 GB', count: '45M entries', type: 'User Profiles' },
    { id: 4, name: 'Gov_Portal_Backup_Shadow.rar', size: '5.1 GB', count: '89k entries', type: 'Government' },
    { id: 5, name: 'Crypto_Exchange_KYC.zip', size: '1.2 GB', count: '120k entries', type: 'KYC Images/Data' },
];

const DarkWebPage = () => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState(null);
    const [statusLogs, setStatusLogs] = useState([]);
    const logRef = useRef(null);

    const addLog = (msg) => {
        setStatusLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
    };

    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [statusLogs]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!query) return;

        setIsSearching(true);
        setResults(null);
        setStatusLogs([]);

        addLog("Initializing search...");

        setTimeout(() => addLog("Connecting to Database..."), 800);
        setTimeout(() => addLog("Searching records for: " + query.toUpperCase()), 1500);
        setTimeout(() => addLog("Filtering results..."), 2200);
        setTimeout(() => addLog("Compiling matches..."), 3000);

        setTimeout(() => {
            setIsSearching(false);
            // Simulate results
            const foundCount = Math.floor(Math.random() * 8) + 1;
            const mockHits = MOCK_LEAKS.slice(0, foundCount).map(leak => ({
                ...leak,
                matchType: Math.random() > 0.5 ? 'Exact Match' : 'Fuzzy Match',
                riskScore: Math.floor(Math.random() * 40) + 60
            }));
            setResults(mockHits);
            addLog(`Search Complete: ${foundCount} results found`);
        }, 4500);
    };

    return (
        <div className="bg-black min-h-screen text-white font-body selection:bg-red-600/50">
            <Navbar />

            {/* Matrix/Glitch Style Background Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-5 overflow-hidden">
                <div className="absolute top-0 w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%]"></div>
            </div>

            <div className="pt-24 px-4 md:px-12 max-w-7xl mx-auto relative z-10">

                {/* Header Information Area */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8 border-b border-red-900/30 pb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-red-600 animate-pulse">
                            <ShieldAlert className="w-5 h-5" />
                            <span className="text-xs font-mono font-bold tracking-[0.3em]">Restricted Access</span>
                        </div>
                        <h1 className="text-4xl font-heading tracking-tighter">Search <span className="text-gray-600">v4.0</span></h1>
                        <p className="max-w-xl text-gray-500 text-sm">
                            Querying live databases for potential data exposure.
                        </p>
                    </div>

                    <div className="bg-red-900/10 border border-red-900/40 p-4 rounded min-w-[300px]">
                        <div className="flex items-center gap-3 mb-4">
                            <Globe className="w-5 h-5 text-red-500" />
                            <span className="text-xs font-mono uppercase tracking-widest text-red-500">Connection Status</span>
                        </div>
                        <div className="space-y-2 text-[10px] font-mono">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Network:</span>
                                <span className="text-green-500">Connected</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Encryption:</span>
                                <span>Secured</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">IP Mask:</span>
                                <span className="text-blue-400">Hidden</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Search Interface */}
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSearch} className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 to-zinc-900/50 rounded-lg blur opacity-25 group-focus-within:opacity-100 transition duration-1000"></div>
                        <div className="relative bg-[#0a0a0a] border border-zinc-800 rounded-lg p-2 flex items-center">
                            <Search className="w-6 h-6 text-zinc-600 ml-4" />
                            <input
                                type="text"
                                placeholder="Enter Target Name, Email, or Username"
                                className="bg-transparent border-none outline-none flex-1 p-4 text-sm font-mono tracking-widest text-white placeholder-zinc-700"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <button
                                disabled={isSearching}
                                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded font-heading text-sm transition-all disabled:opacity-50"
                            >
                                {isSearching ? "Searching..." : "Search"}
                            </button>
                        </div>
                    </form>

                    {/* Simulation Logs Console */}
                    {(isSearching || statusLogs.length > 0) && (
                        <div className="mt-8 bg-black/80 border border-zinc-800/50 p-4 rounded font-mono text-[10px] text-gray-500 max-h-40 overflow-y-auto custom-scrollbar" ref={logRef}>
                            {statusLogs.map((log, i) => (
                                <div key={i} className="mb-1 flex gap-4">
                                    <span className="text-zinc-700">[{log.time}]</span>
                                    <span className={i === statusLogs.length - 1 ? "text-green-500" : ""}>{log.msg}</span>
                                </div>
                            ))}
                            {isSearching && <div className="animate-pulse">_</div>}
                        </div>
                    )}

                    {/* Results Display */}
                    <div className="mt-12 mb-20">
                        <AnimatePresence>
                            {isSearching && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-20"
                                >
                                    <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
                                    <p className="text-zinc-600 font-mono text-xs uppercase tracking-widest">Searching...</p>
                                </motion.div>
                            )}

                            {results && !isSearching && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-heading flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-red-500" />
                                            {results.length} Matches Found
                                        </h2>
                                        <div className="text-[10px] text-zinc-500 uppercase">Search took 4.5s</div>
                                    </div>

                                    <div className="grid gap-4">
                                        {results.map((leak, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="bg-zinc-900/30 border border-zinc-800 rounded p-4 flex flex-col md:flex-row justify-between items-center group hover:border-red-600/30 transition-all"
                                            >
                                                <div className="flex items-center gap-4 w-full md:w-auto">
                                                    <div className="w-10 h-10 rounded bg-black border border-zinc-800 flex items-center justify-center">
                                                        <Database className="w-5 h-5 text-zinc-600 group-hover:text-red-500 transition-colors" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold flex items-center gap-2">
                                                            {leak.name}
                                                            <span className="bg-red-900/20 text-red-500 text-[8px] px-1.5 py-0.5 rounded border border-red-900/40 uppercase">
                                                                {leak.matchType}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] text-zinc-500 mt-1 flex gap-3 font-mono">
                                                            <span>Type: {leak.type}</span>
                                                            <span>|</span>
                                                            <span>Count: {leak.count}</span>
                                                            <span>|</span>
                                                            <span>Size: {leak.size}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-end border-t md:border-t-0 border-zinc-900 pt-4 md:pt-0">
                                                    <div className="text-right">
                                                        <div className="text-[9px] text-zinc-600 uppercase mb-1">Risk Score</div>
                                                        <div className="text-lg font-heading text-red-500">{leak.riskScore}%</div>
                                                    </div>
                                                    <button className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded transition-all">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className="bg-red-600/5 border border-red-900/20 p-6 rounded-lg mt-12 text-center">
                                        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
                                        <h3 className="text-sm font-bold text-red-500 uppercase mb-2">Notice</h3>
                                        <p className="text-xs text-zinc-500 max-w-lg mx-auto leading-relaxed">
                                            The data found may indicate potential security risks.
                                            We recommend reviewing security practices and changing passwords.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DarkWebPage;
