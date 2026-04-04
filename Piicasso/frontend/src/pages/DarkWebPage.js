import React, { useState, useEffect, useRef, useContext } from 'react';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { ModeContext } from '../context/ModeContext';
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
  const { mode: appMode } = useContext(ModeContext) || { mode: 'security' };
  const isSecurityMode = appMode === 'security';

  const theme = {
    bg: 'bg-transparent', // Handled globally
    accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
    accentBg: isSecurityMode ? 'bg-security-red' : 'bg-user-cobalt',
    card: isSecurityMode ? 'security-card' : 'user-glass-panel',
    inputBg: isSecurityMode ? 'bg-black border-security-border focus-within:border-security-red' : 'bg-white/5 border-user-border focus-within:border-user-cobalt backdrop-blur-md',
    btnPrimary: isSecurityMode ? 'security-btn-primary' : 'user-btn-primary',
    heading: isSecurityMode ? 'security-heading' : 'user-heading',
    textMuted: isSecurityMode ? 'text-gray-500' : 'text-user-text/70',
    border: isSecurityMode ? 'border-security-border' : 'border-user-border',
  };

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
        <div className={`min-h-screen flex flex-col ${theme.bg}`}>
            <Navbar />

            {/* Scan line effect (only relevant for security mode, but harmless in user mode if subtle) */}
            {isSecurityMode && (
                <div className="fixed inset-0 pointer-events-none opacity-5 overflow-hidden z-0">
                    <div className="absolute top-0 w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%]"></div>
                </div>
            )}

            <div className="pt-28 px-4 md:px-12 max-w-7xl mx-auto relative z-10 pb-20 w-full">

                {/* Header */}
                <div className={`flex flex-col md:flex-row justify-between items-start mb-12 gap-8 border-b pb-8 ${isSecurityMode ? 'border-security-red/30' : 'border-user-border'}`}>
                    <div className="space-y-3">
                        <div className={`flex items-center gap-2 ${theme.accentColor} ${isSecurityMode ? 'animate-pulse' : ''}`}>
                            <ShieldAlert className="w-5 h-5" />
                            <span className={`text-xs font-mono font-bold tracking-[0.3em] ${isSecurityMode ? 'uppercase' : ''}`}>Breach Intelligence</span>
                        </div>
                        <h1 className={`text-4xl md:text-5xl ${theme.heading}`}>Data Breach <span className={theme.textMuted}>Scanner</span></h1>
                        <p className={`max-w-xl text-sm ${isSecurityMode ? 'text-gray-500' : 'text-user-text/80'}`}>
                            Search for compromised accounts and exposed passwords using the Have I Been Pwned database.
                            Enter an email address to check for breaches, or any string to check if it appears in known password dumps.
                        </p>
                    </div>

                    <div className={`p-5 rounded-xl w-full md:min-w-[300px] border ${isSecurityMode ? 'bg-security-red/10 border-security-red/40' : 'bg-user-cobalt/10 border-user-cobalt/30 backdrop-blur-md'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <Globe className={`w-5 h-5 ${theme.accentColor}`} />
                            <span className={`text-xs font-mono uppercase tracking-widest font-bold ${theme.accentColor}`}>Data Sources</span>
                        </div>
                        <div className={`space-y-3 text-xs font-mono ${isSecurityMode ? 'text-gray-400' : 'text-user-text/80'}`}>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span>Have I Been Pwned:</span>
                                <span className="text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded">Connected</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span>Password DB:</span>
                                <span className="text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded">613M+ hashes</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Internal Records:</span>
                                <span className="text-blue-400 font-bold bg-blue-400/10 px-2 py-0.5 rounded">Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Interface */}
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSearch} className="relative group">
                        <div className={`absolute -inset-1 rounded-xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000 ${isSecurityMode ? 'bg-gradient-to-r from-security-red/40 to-black' : 'bg-gradient-to-r from-user-cobalt/40 to-transparent'}`}></div>
                        <div className={`relative border rounded-xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 ${theme.inputBg}`}>
                            <Search className={`w-6 h-6 ml-4 hidden sm:block ${theme.textMuted}`} />
                            <input
                                type="text"
                                placeholder="Enter email address or search term..."
                                className={`bg-transparent border-none outline-none flex-1 p-3 sm:p-4 text-sm font-mono tracking-wider ${isSecurityMode ? 'text-white placeholder-gray-600' : 'text-user-text placeholder-user-text/50'}`}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <button
                                disabled={isSearching || !query.trim()}
                                className={`px-8 py-3 sm:py-4 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 font-bold tracking-wide ${theme.btnPrimary}`}
                            >
                                {isSearching ? "Scanning..." : "Search"}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="mt-4 bg-red-500/10 border border-red-500/30 p-4 rounded-lg text-sm text-red-400 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 shrink-0" /> <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {/* Live Logs Console */}
                    {(isSearching || statusLogs.length > 0) && (
                        <div className={`mt-8 p-5 rounded-xl font-mono text-[11px] max-h-48 overflow-y-auto custom-scrollbar border ${isSecurityMode ? 'bg-black border-security-border text-gray-500' : 'bg-black/40 border-user-border text-user-text/70 backdrop-blur-md'}`} ref={logRef}>
                            {statusLogs.map((log, i) => (
                                <div key={i} className="mb-2 flex gap-4 leading-relaxed">
                                    <span className="opacity-50 shrink-0">[{log.time}]</span>
                                    <span className={
                                        log.msg.includes('ERROR') ? 'text-red-500 font-bold' :
                                        log.msg.includes('WARNING') ? 'text-yellow-500 font-bold' :
                                        log.msg.includes('complete') || log.msg.includes('Complete') ? 'text-green-500 font-bold' :
                                        ''
                                    }>{log.msg}</span>
                                </div>
                            ))}
                            {isSearching && <div className="animate-pulse opacity-50 mt-2">_</div>}
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
                                    <Loader2 className={`w-12 h-12 animate-spin mb-6 ${theme.accentColor}`} />
                                    <p className={`font-mono text-xs uppercase tracking-widest ${theme.textMuted}`}>Scanning databases...</p>
                                </motion.div>
                            )}

                            {results && !isSearching && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Risk Summary Card */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className={`${theme.card} p-6 text-center flex flex-col justify-center`}>
                                            <p className={`text-[10px] uppercase font-mono mb-3 tracking-widest font-bold ${theme.textMuted}`}>Risk Score</p>
                                            <p className={`text-5xl mb-2 ${theme.heading} ${getRiskLevel(results.risk_score).color}`}>
                                                {results.risk_score}%
                                            </p>
                                            <div className={`text-xs font-bold tracking-widest uppercase ${getRiskLevel(results.risk_score).color}`}>
                                                {getRiskLevel(results.risk_score).label}
                                            </div>
                                        </div>
                                        <div className={`${theme.card} p-6 text-center flex flex-col justify-center`}>
                                            <p className={`text-[10px] uppercase font-mono mb-3 tracking-widest font-bold ${theme.textMuted}`}>Breaches Found</p>
                                            <p className={`text-5xl ${theme.heading} ${results.breaches?.length > 0 ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`}>
                                                {results.breaches?.length || 0}
                                            </p>
                                        </div>
                                        <div className={`${theme.card} p-6 text-center flex flex-col justify-center`}>
                                            <p className={`text-[10px] uppercase font-mono mb-3 tracking-widest font-bold ${theme.textMuted}`}>Password Exposures</p>
                                            <p className={`text-5xl ${theme.heading} ${results.password_exposures > 0 ? 'text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`}>
                                                {results.password_exposures > 0 ? results.password_exposures.toLocaleString() : '0'}
                                            </p>
                                        </div>
                                        <div className={`${theme.card} p-6 text-center flex flex-col justify-center`}>
                                            <p className={`text-[10px] uppercase font-mono mb-3 tracking-widest font-bold ${theme.textMuted}`}>Internal Matches</p>
                                            <p className={`text-5xl ${theme.heading} ${results.internal_matches > 0 ? 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]' : 'text-gray-500'}`}>{results.internal_matches}</p>
                                        </div>
                                    </div>

                                    {/* Password Exposure Warning */}
                                    {results.password_exposures > 0 && (
                                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 flex items-start gap-5 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                                            <Lock className="w-8 h-8 text-orange-500 shrink-0" />
                                            <div>
                                                <h3 className="font-bold text-orange-400 text-base mb-2 uppercase tracking-wide">Password Compromised</h3>
                                                <p className={`text-sm leading-relaxed ${isSecurityMode ? 'text-gray-300' : 'text-user-text/90'}`}>
                                                    The search term "{results.query}" appears in <strong className="text-orange-400 text-base">{results.password_exposures.toLocaleString()}</strong> known
                                                    password data breaches. If this is a password you use, change it immediately on all services.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* No breaches — Good news */}
                                    {results.breaches?.length === 0 && results.password_exposures === 0 && (
                                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8 text-center shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle className="w-8 h-8 text-green-500" />
                                            </div>
                                            <h3 className="font-bold text-green-400 text-lg mb-2 uppercase tracking-wide">No Breaches Found</h3>
                                            <p className={`text-sm ${isSecurityMode ? 'text-gray-400' : 'text-user-text/80'}`}>
                                                Good news! No known breaches were found for "{results.query}" in our databases.
                                            </p>
                                        </div>
                                    )}

                                    {/* Breach List */}
                                    {results.breaches?.length > 0 && (
                                        <div className="pt-4">
                                            <h2 className={`text-xl flex items-center gap-3 mb-6 ${theme.heading}`}>
                                                <AlertTriangle className="w-6 h-6 text-red-500" />
                                                {results.breaches.length} Data Breach{results.breaches.length > 1 ? 'es' : ''} Found
                                            </h2>

                                            <div className="grid gap-4">
                                                {results.breaches.map((breach, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        className={`${theme.card} p-5 hover:border-red-500/50`}
                                                    >
                                                        <div className="flex flex-col md:flex-row justify-between gap-4">
                                                            <div className="flex items-start gap-5">
                                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${isSecurityMode ? 'bg-black border border-security-border' : 'bg-white/5 border border-user-border'}`}>
                                                                    <Database className={`w-6 h-6 ${isSecurityMode ? 'text-gray-600 group-hover:text-red-500' : 'text-user-text/50 group-hover:text-red-400'} transition-colors`} />
                                                                </div>
                                                                <div>
                                                                    <div className="text-base font-bold flex items-center gap-3 flex-wrap mb-1">
                                                                        {breach.name}
                                                                        {breach.is_verified && (
                                                                            <span className="bg-red-500/10 text-red-500 text-[10px] px-2 py-0.5 rounded border border-red-500/30 uppercase tracking-wider">
                                                                                Verified
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className={`text-xs flex gap-4 font-mono flex-wrap mb-3 ${theme.textMuted}`}>
                                                                        {breach.domain && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {breach.domain}</span>}
                                                                        <span>Date: {breach.breach_date}</span>
                                                                    </div>
                                                                    {breach.data_classes?.length > 0 && (
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {breach.data_classes.slice(0, 8).map((dc, j) => (
                                                                                <span key={j} className={`text-[10px] px-2 py-1 rounded font-medium border ${isSecurityMode ? 'bg-security-surface border-security-border text-gray-400' : 'bg-white/5 border-user-border text-user-text/80'}`}>
                                                                                    {dc}
                                                                                </span>
                                                                            ))}
                                                                            {breach.data_classes.length > 8 && (
                                                                                <span className={`text-[10px] font-medium px-2 py-1 ${theme.textMuted}`}>+{breach.data_classes.length - 8} more</span>
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
                                        <div className={`mt-8 border p-8 rounded-xl text-center shadow-lg ${isSecurityMode ? 'bg-security-red/5 border-security-red/20' : 'bg-red-500/10 border-red-500/20 backdrop-blur-md'}`}>
                                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-5">
                                                <Shield className="w-8 h-8 text-red-500" />
                                            </div>
                                            <h3 className="text-base font-bold text-red-500 uppercase tracking-widest mb-4">Security Recommendations</h3>
                                            <div className={`text-sm max-w-lg mx-auto leading-loose space-y-2 text-left ${isSecurityMode ? 'text-gray-400' : 'text-user-text/90'}`}>
                                                <p className="flex items-start gap-2"><span className="text-red-500">•</span> Change passwords on all affected accounts immediately</p>
                                                <p className="flex items-start gap-2"><span className="text-red-500">•</span> Enable two-factor authentication (2FA) wherever possible</p>
                                                <p className="flex items-start gap-2"><span className="text-red-500">•</span> Use unique, complex passwords for each service</p>
                                                <p className="flex items-start gap-2"><span className="text-red-500">•</span> Utilize a secure password manager to track credentials</p>
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
