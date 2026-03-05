import React, { useState, useEffect, useRef, useContext } from 'react';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ShieldAlert, Database, Globe,
    AlertTriangle, Loader2, Eye, Shield,
    CheckCircle, XCircle, Lock
} from 'lucide-react';

const DarkWebPage = () => {
    const { isAuthenticated } = useContext(AuthContext);
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState(null);
    const [statusLogs, setStatusLogs] = useState([]);
    const [error, setError] = useState('');
    const logRef = useRef(null);

    const addLog = (msg) => {
        setStatusLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
    };

    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [statusLogs]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        if (!isAuthenticated) {
            setError('Please sign in to use breach search.');
            return;
        }

        setIsSearching(true);
        setResults(null);
        setError('');
        setStatusLogs([]);

        addLog("Initializing breach search engine...");
        
        setTimeout(() => addLog("Querying Have I Been Pwned database..."), 600);
        setTimeout(() => addLog("Checking password exposure databases..."), 1200);
        setTimeout(() => addLog("Scanning internal generation history..."), 1800);

        try {
            const res = await axiosInstance.post('operations/breach-search/', { query: query.trim() });
            const data = res.data;
            
            addLog(`Search complete. ${data.breaches?.length || 0} breaches found.`);
            
            if (data.password_exposures > 0) {
                addLog(`WARNING: "${query}" found in ${data.password_exposures.toLocaleString()} password dumps!`);
            }
            
            if (data.internal_matches > 0) {
                addLog(`Internal: ${data.internal_matches} generation records reference this query.`);
            }
            
            if (data.rate_limited) {
                addLog("NOTICE: HIBP rate limit reached. Try again in a few seconds.");
            }
            
            setResults(data);
        } catch (err) {
            const errMsg = err.response?.data?.error || 'Search failed. Please try again.';
            setError(errMsg);
            addLog(`ERROR: ${errMsg}`);
        } finally {
            setIsSearching(false);
        }
    };

    const getRiskLevel = (score) => {
        if (score >= 70) return { label: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-500' };
        if (score >= 40) return { label: 'HIGH', color: 'text-orange-500', bg: 'bg-orange-500' };
        if (score >= 15) return { label: 'MEDIUM', color: 'text-yellow-500', bg: 'bg-yellow-500' };
        return { label: 'LOW', color: 'text-green-500', bg: 'bg-green-500' };
    };

    return (
        <div className="bg-black min-h-screen text-white font-body selection:bg-red-600/50">
            <Navbar />

            {/* Scan line effect */}
            <div className="fixed inset-0 pointer-events-none opacity-5 overflow-hidden">
                <div className="absolute top-0 w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%]"></div>
            </div>

            <div className="pt-24 px-4 md:px-12 max-w-7xl mx-auto relative z-10 pb-20">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8 border-b border-red-900/30 pb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-red-600 animate-pulse">
                            <ShieldAlert className="w-5 h-5" />
                            <span className="text-xs font-mono font-bold tracking-[0.3em]">Breach Intelligence</span>
                        </div>
                        <h1 className="text-4xl font-heading tracking-tighter">Data Breach <span className="text-gray-600">Scanner</span></h1>
                        <p className="max-w-xl text-gray-500 text-sm">
                            Search for compromised accounts and exposed passwords using the Have I Been Pwned database.
                            Enter an email address to check for breaches, or any string to check if it appears in known password dumps.
                        </p>
                    </div>

                    <div className="bg-red-900/10 border border-red-900/40 p-4 rounded min-w-[300px]">
                        <div className="flex items-center gap-3 mb-4">
                            <Globe className="w-5 h-5 text-red-500" />
                            <span className="text-xs font-mono uppercase tracking-widest text-red-500">Data Sources</span>
                        </div>
                        <div className="space-y-2 text-[10px] font-mono">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Have I Been Pwned:</span>
                                <span className="text-green-500">Connected</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Password DB:</span>
                                <span className="text-green-500">613M+ hashes</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Internal Records:</span>
                                <span className="text-blue-400">Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Interface */}
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSearch} className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 to-zinc-900/50 rounded-lg blur opacity-25 group-focus-within:opacity-100 transition duration-1000"></div>
                        <div className="relative bg-[#0a0a0a] border border-zinc-800 rounded-lg p-2 flex items-center">
                            <Search className="w-6 h-6 text-zinc-600 ml-4" />
                            <input
                                type="text"
                                placeholder="Enter email address or search term..."
                                className="bg-transparent border-none outline-none flex-1 p-4 text-sm font-mono tracking-widest text-white placeholder-zinc-700"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <button
                                disabled={isSearching || !query.trim()}
                                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded font-heading text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSearching ? "Scanning..." : "Search"}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="mt-4 bg-red-900/20 border border-red-900/50 p-3 rounded text-sm text-red-300 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                        </div>
                    )}

                    {/* Live Logs Console */}
                    {(isSearching || statusLogs.length > 0) && (
                        <div className="mt-8 bg-black/80 border border-zinc-800/50 p-4 rounded font-mono text-[10px] text-gray-500 max-h-40 overflow-y-auto custom-scrollbar" ref={logRef}>
                            {statusLogs.map((log, i) => (
                                <div key={i} className="mb-1 flex gap-4">
                                    <span className="text-zinc-700">[{log.time}]</span>
                                    <span className={
                                        log.msg.includes('ERROR') ? 'text-red-500' :
                                        log.msg.includes('WARNING') ? 'text-yellow-500' :
                                        log.msg.includes('complete') || log.msg.includes('Complete') ? 'text-green-500' :
                                        ''
                                    }>{log.msg}</span>
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
                                    <p className="text-zinc-600 font-mono text-xs uppercase tracking-widest">Scanning databases...</p>
                                </motion.div>
                            )}

                            {results && !isSearching && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Risk Summary Card */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 text-center">
                                            <p className="text-[10px] text-zinc-500 uppercase font-mono mb-2">Risk Score</p>
                                            <p className={`text-4xl font-heading ${getRiskLevel(results.risk_score).color}`}>
                                                {results.risk_score}%
                                            </p>
                                            <div className={`text-[10px] font-bold mt-2 ${getRiskLevel(results.risk_score).color}`}>
                                                {getRiskLevel(results.risk_score).label}
                                            </div>
                                        </div>
                                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 text-center">
                                            <p className="text-[10px] text-zinc-500 uppercase font-mono mb-2">Breaches Found</p>
                                            <p className={`text-4xl font-heading ${results.breaches?.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                {results.breaches?.length || 0}
                                            </p>
                                        </div>
                                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 text-center">
                                            <p className="text-[10px] text-zinc-500 uppercase font-mono mb-2">Password Exposures</p>
                                            <p className={`text-4xl font-heading ${results.password_exposures > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                                                {results.password_exposures > 0 ? results.password_exposures.toLocaleString() : '0'}
                                            </p>
                                        </div>
                                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 text-center">
                                            <p className="text-[10px] text-zinc-500 uppercase font-mono mb-2">Internal Matches</p>
                                            <p className="text-4xl font-heading text-blue-400">{results.internal_matches}</p>
                                        </div>
                                    </div>

                                    {/* Password Exposure Warning */}
                                    {results.password_exposures > 0 && (
                                        <div className="bg-orange-900/10 border border-orange-900/40 rounded-lg p-5 flex items-start gap-4">
                                            <Lock className="w-6 h-6 text-orange-500 shrink-0 mt-1" />
                                            <div>
                                                <h3 className="font-bold text-orange-400 text-sm mb-1">Password Compromised</h3>
                                                <p className="text-xs text-zinc-400">
                                                    The search term "{results.query}" appears in <strong className="text-orange-300">{results.password_exposures.toLocaleString()}</strong> known
                                                    password data breaches. If this is a password you use, change it immediately on all services.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* No breaches — Good news */}
                                    {results.breaches?.length === 0 && results.password_exposures === 0 && (
                                        <div className="bg-green-900/10 border border-green-900/40 rounded-lg p-6 text-center">
                                            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                                            <h3 className="font-bold text-green-400 text-sm mb-1">No Breaches Found</h3>
                                            <p className="text-xs text-zinc-500">
                                                Good news! No known breaches were found for "{results.query}" in our databases.
                                            </p>
                                        </div>
                                    )}

                                    {/* Breach List */}
                                    {results.breaches?.length > 0 && (
                                        <div>
                                            <h2 className="text-lg font-heading flex items-center gap-2 mb-4">
                                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                                {results.breaches.length} Data Breach{results.breaches.length > 1 ? 'es' : ''} Found
                                            </h2>

                                            <div className="grid gap-4">
                                                {results.breaches.map((breach, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.08 }}
                                                        className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-5 group hover:border-red-600/30 transition-all"
                                                    >
                                                        <div className="flex flex-col md:flex-row justify-between gap-4">
                                                            <div className="flex items-start gap-4">
                                                                <div className="w-10 h-10 rounded bg-black border border-zinc-800 flex items-center justify-center shrink-0">
                                                                    <Database className="w-5 h-5 text-zinc-600 group-hover:text-red-500 transition-colors" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold flex items-center gap-2 flex-wrap">
                                                                        {breach.name}
                                                                        {breach.is_verified && (
                                                                            <span className="bg-red-900/20 text-red-500 text-[8px] px-1.5 py-0.5 rounded border border-red-900/40 uppercase">
                                                                                Verified
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[10px] text-zinc-500 mt-1 flex gap-3 font-mono flex-wrap">
                                                                        {breach.domain && <span>Domain: {breach.domain}</span>}
                                                                        <span>Date: {breach.breach_date}</span>
                                                                    </div>
                                                                    {breach.data_classes?.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                                            {breach.data_classes.slice(0, 8).map((dc, j) => (
                                                                                <span key={j} className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                                                                                    {dc}
                                                                                </span>
                                                                            ))}
                                                                            {breach.data_classes.length > 8 && (
                                                                                <span className="text-[9px] text-zinc-600">+{breach.data_classes.length - 8} more</span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Advisory */}
                                    {(results.breaches?.length > 0 || results.password_exposures > 0) && (
                                        <div className="bg-red-600/5 border border-red-900/20 p-6 rounded-lg text-center">
                                            <Shield className="w-8 h-8 text-red-600 mx-auto mb-4" />
                                            <h3 className="text-sm font-bold text-red-500 uppercase mb-2">Security Recommendations</h3>
                                            <div className="text-xs text-zinc-500 max-w-lg mx-auto leading-relaxed space-y-2">
                                                <p>• Change passwords on all affected accounts immediately</p>
                                                <p>• Enable two-factor authentication (2FA) wherever possible</p>
                                                <p>• Use unique passwords for each service</p>
                                                <p>• Consider using a password manager</p>
                                            </div>
                                        </div>
                                    )}
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
