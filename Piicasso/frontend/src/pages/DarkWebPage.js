import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShieldAlert,
  Database,
  Globe,
  AlertTriangle,
  Loader2,
  Shield,
  CheckCircle,
  Lock,
} from 'lucide-react';
import DesignAppShell from '../components/design/dashboard/DesignAppShell.jsx';
import { AuthContext } from '../context/AuthContext';
import { ModeContext } from '../context/ModeContext';
import axiosInstance from '../api/axios';

const DarkWebPage = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [query, setQuery] = useState('');
  const { mode: appMode } = useContext(ModeContext) || { mode: 'security' };
  const isSecurityMode = appMode === 'security';

  const theme = {
    accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
    card: isSecurityMode ? 'sec-card' : 'usr-card',
    heading: isSecurityMode ? 'security-heading' : 'user-heading',
    textMuted: isSecurityMode ? 'text-gray-500' : 'text-user-text/70',
    inputBg: isSecurityMode
      ? 'bg-black border border-security-border focus:border-security-red text-white placeholder-gray-600'
      : 'bg-white/5 border border-user-border focus:border-user-cobalt text-user-text placeholder-user-text/40',
    btnPrimary: isSecurityMode ? 'security-btn-primary' : 'user-btn-primary',
  };

  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [statusLogs, setStatusLogs] = useState([]);
  const [error, setError] = useState('');
  const logRef = useRef(null);

  const addLog = (msg) => {
    setStatusLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
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

    addLog('Initializing breach search engine...');

    setTimeout(() => addLog('Querying Have I Been Pwned database...'), 600);
    setTimeout(() => addLog('Checking password exposure databases...'), 1200);
    setTimeout(() => addLog('Scanning internal generation history...'), 1800);

    try {
      const res = await axiosInstance.post('operations/breach-search/', { query: query.trim() });
      const data = res.data;

      addLog(`Search complete. ${data.breaches?.length || 0} breaches found.`);

      if (data.password_exposures > 0) {
        addLog(
          `WARNING: "${query}" found in ${data.password_exposures.toLocaleString()} password dumps!`,
        );
      }

      if (data.internal_matches > 0) {
        addLog(`Internal: ${data.internal_matches} generation records reference this query.`);
      }

      if (data.rate_limited) {
        addLog('NOTICE: HIBP rate limit reached. Try again in a few seconds.');
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
    <DesignAppShell activeKey={isSecurityMode ? 'intel' : 'leaks'}>
      <div
        style={{
          paddingTop: 24,
          paddingBottom: 80,
          paddingLeft: 16,
          paddingRight: 16,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 1100, marginLeft: 'auto', marginRight: 'auto' }}>
          {/* Header */}
          <div
            className={`mb-12 flex flex-col items-start justify-between gap-8 border-b pb-8 md:flex-row ${isSecurityMode ? 'border-security-red/30' : 'border-user-border'}`}
          >
            <div className="space-y-3">
              <div
                className={`flex items-center gap-2 ${theme.accentColor} ${isSecurityMode ? 'animate-pulse' : ''}`}
              >
                <ShieldAlert className="h-5 w-5" />
                <span
                  className={`font-mono text-xs font-bold tracking-[0.3em] ${isSecurityMode ? 'uppercase' : ''}`}
                >
                  Breach Intelligence
                </span>
              </div>
              <h1 className={`text-4xl md:text-5xl ${theme.heading}`}>
                Data Breach <span className={theme.textMuted}>Scanner</span>
              </h1>
              <p
                className={`max-w-xl text-sm ${isSecurityMode ? 'text-gray-500' : 'text-user-text/80'}`}
              >
                Search for compromised accounts and exposed passwords using the Have I Been Pwned
                database. Enter an email address to check for breaches, or any string to check if it
                appears in known password dumps.
              </p>
            </div>

            <div
              className={`w-full rounded-xl border p-5 md:min-w-[300px] ${isSecurityMode ? 'border-security-red/40 bg-security-red/10' : 'border-user-cobalt/30 bg-user-cobalt/10 backdrop-blur-md'}`}
            >
              <div className="mb-4 flex items-center gap-3">
                <Globe className={`h-5 w-5 ${theme.accentColor}`} />
                <span
                  className={`font-mono text-xs font-bold uppercase tracking-widest ${theme.accentColor}`}
                >
                  Data Sources
                </span>
              </div>
              <div
                className={`space-y-3 font-mono text-xs ${isSecurityMode ? 'text-gray-400' : 'text-user-text/80'}`}
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span>Have I Been Pwned:</span>
                  <span className="rounded bg-green-500/10 px-2 py-0.5 font-bold text-green-500">
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span>Password DB:</span>
                  <span className="rounded bg-green-500/10 px-2 py-0.5 font-bold text-green-500">
                    613M+ hashes
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Internal Records:</span>
                  <span className="rounded bg-blue-400/10 px-2 py-0.5 font-bold text-blue-400">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Interface */}
          <div className="mx-auto max-w-4xl">
            <form onSubmit={handleSearch} className="group relative">
              <div
                className={`absolute -inset-1 rounded-xl opacity-25 blur transition duration-1000 group-focus-within:opacity-100 ${isSecurityMode ? 'bg-gradient-to-r from-security-red/40 to-black' : 'bg-gradient-to-r from-user-cobalt/40 to-transparent'}`}
              ></div>
              <div
                className={`relative flex flex-col items-stretch gap-2 rounded-xl border p-2 sm:flex-row sm:items-center sm:gap-0 ${theme.inputBg}`}
              >
                <Search className={`ml-4 hidden h-6 w-6 sm:block ${theme.textMuted}`} />
                <input
                  type="text"
                  placeholder="Enter email address or search term..."
                  className={`flex-1 border-none bg-transparent p-3 font-mono text-sm tracking-wider outline-none sm:p-4 ${isSecurityMode ? 'text-white placeholder-gray-600' : 'text-user-text placeholder-user-text/50'}`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  disabled={isSearching || !query.trim()}
                  className={`shrink-0 rounded-lg px-8 py-3 text-sm font-bold tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 ${theme.btnPrimary}`}
                >
                  {isSearching ? 'Scanning...' : 'Search'}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                <AlertTriangle className="h-5 w-5 shrink-0" />{' '}
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Live Logs Console */}
            {(isSearching || statusLogs.length > 0) && (
              <div
                className={`custom-scrollbar mt-8 max-h-48 overflow-y-auto rounded-xl border p-5 font-mono text-[11px] ${isSecurityMode ? 'border-security-border bg-black text-gray-500' : 'border-user-border bg-black/40 text-user-text/70 backdrop-blur-md'}`}
                ref={logRef}
              >
                {statusLogs.map((log, i) => (
                  <div key={i} className="mb-2 flex gap-4 leading-relaxed">
                    <span className="shrink-0 opacity-50">[{log.time}]</span>
                    <span
                      className={
                        log.msg.includes('ERROR')
                          ? 'font-bold text-red-500'
                          : log.msg.includes('WARNING')
                            ? 'font-bold text-yellow-500'
                            : log.msg.includes('complete') || log.msg.includes('Complete')
                              ? 'font-bold text-green-500'
                              : ''
                      }
                    >
                      {log.msg}
                    </span>
                  </div>
                ))}
                {isSearching && <div className="mt-2 animate-pulse opacity-50">_</div>}
              </div>
            )}

            {/* Results Display */}
            <div className="mb-20 mt-12">
              <AnimatePresence>
                {isSearching && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20"
                  >
                    <Loader2 className={`mb-6 h-12 w-12 animate-spin ${theme.accentColor}`} />
                    <p className={`font-mono text-xs uppercase tracking-widest ${theme.textMuted}`}>
                      Scanning databases...
                    </p>
                  </motion.div>
                )}

                {results && !isSearching && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Risk Summary Card */}
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className={`${theme.card} flex flex-col justify-center p-6 text-center`}>
                        <p
                          className={`mb-3 font-mono text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}
                        >
                          Risk Score
                        </p>
                        <p
                          className={`mb-2 text-5xl ${theme.heading} ${getRiskLevel(results.risk_score).color}`}
                        >
                          {results.risk_score}%
                        </p>
                        <div
                          className={`text-xs font-bold uppercase tracking-widest ${getRiskLevel(results.risk_score).color}`}
                        >
                          {getRiskLevel(results.risk_score).label}
                        </div>
                      </div>
                      <div className={`${theme.card} flex flex-col justify-center p-6 text-center`}>
                        <p
                          className={`mb-3 font-mono text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}
                        >
                          Breaches Found
                        </p>
                        <p
                          className={`text-5xl ${theme.heading} ${results.breaches?.length > 0 ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`}
                        >
                          {results.breaches?.length || 0}
                        </p>
                      </div>
                      <div className={`${theme.card} flex flex-col justify-center p-6 text-center`}>
                        <p
                          className={`mb-3 font-mono text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}
                        >
                          Password Exposures
                        </p>
                        <p
                          className={`text-5xl ${theme.heading} ${results.password_exposures > 0 ? 'text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`}
                        >
                          {results.password_exposures > 0
                            ? results.password_exposures.toLocaleString()
                            : '0'}
                        </p>
                      </div>
                      <div className={`${theme.card} flex flex-col justify-center p-6 text-center`}>
                        <p
                          className={`mb-3 font-mono text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}
                        >
                          Internal Matches
                        </p>
                        <p
                          className={`text-5xl ${theme.heading} ${results.internal_matches > 0 ? 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]' : 'text-gray-500'}`}
                        >
                          {results.internal_matches}
                        </p>
                      </div>
                    </div>

                    {/* Password Exposure Warning */}
                    {results.password_exposures > 0 && (
                      <div className="flex items-start gap-5 rounded-xl border border-orange-500/30 bg-orange-500/10 p-6 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                        <Lock className="h-8 w-8 shrink-0 text-orange-500" />
                        <div>
                          <h3 className="mb-2 text-base font-bold uppercase tracking-wide text-orange-400">
                            Password Compromised
                          </h3>
                          <p
                            className={`text-sm leading-relaxed ${isSecurityMode ? 'text-gray-300' : 'text-user-text/90'}`}
                          >
                            The search term &quot;{results.query}&quot; appears in{' '}
                            <strong className="text-base text-orange-400">
                              {results.password_exposures.toLocaleString()}
                            </strong>{' '}
                            known password data breaches. If this is a password you use, change it
                            immediately on all services.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* No breaches — Good news */}
                    {results.breaches?.length === 0 && results.password_exposures === 0 && (
                      <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-8 text-center shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="mb-2 text-lg font-bold uppercase tracking-wide text-green-400">
                          No Breaches Found
                        </h3>
                        <p
                          className={`text-sm ${isSecurityMode ? 'text-gray-400' : 'text-user-text/80'}`}
                        >
                          Good news! No known breaches were found for &quot;{results.query}&quot; in
                          our databases.
                        </p>
                      </div>
                    )}

                    {/* Breach List */}
                    {results.breaches?.length > 0 && (
                      <div className="pt-4">
                        <h2 className={`mb-6 flex items-center gap-3 text-xl ${theme.heading}`}>
                          <AlertTriangle className="h-6 w-6 text-red-500" />
                          {results.breaches.length} Data Breach
                          {results.breaches.length > 1 ? 'es' : ''} Found
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
                              <div className="flex flex-col justify-between gap-4 md:flex-row">
                                <div className="flex items-start gap-5">
                                  <div
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${isSecurityMode ? 'border border-security-border bg-black' : 'border border-user-border bg-white/5'}`}
                                  >
                                    <Database
                                      className={`h-6 w-6 ${isSecurityMode ? 'text-gray-600 group-hover:text-red-500' : 'text-user-text/50 group-hover:text-red-400'} transition-colors`}
                                    />
                                  </div>
                                  <div>
                                    <div className="mb-1 flex flex-wrap items-center gap-3 text-base font-bold">
                                      {breach.name}
                                      {breach.is_verified && (
                                        <span className="rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-red-500">
                                          Verified
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      className={`mb-3 flex flex-wrap gap-4 font-mono text-xs ${theme.textMuted}`}
                                    >
                                      {breach.domain && (
                                        <span className="flex items-center gap-1">
                                          <Globe className="h-3 w-3" /> {breach.domain}
                                        </span>
                                      )}
                                      <span>Date: {breach.breach_date}</span>
                                    </div>
                                    {breach.data_classes?.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {breach.data_classes.slice(0, 8).map((dc, j) => (
                                          <span
                                            key={j}
                                            className={`rounded border px-2 py-1 text-[10px] font-medium ${isSecurityMode ? 'border-security-border bg-security-surface text-gray-400' : 'border-user-border bg-white/5 text-user-text/80'}`}
                                          >
                                            {dc}
                                          </span>
                                        ))}
                                        {breach.data_classes.length > 8 && (
                                          <span
                                            className={`px-2 py-1 text-[10px] font-medium ${theme.textMuted}`}
                                          >
                                            +{breach.data_classes.length - 8} more
                                          </span>
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
                      <div
                        className={`mt-8 rounded-xl border p-8 text-center shadow-lg ${isSecurityMode ? 'border-security-red/20 bg-security-red/5' : 'border-red-500/20 bg-red-500/10 backdrop-blur-md'}`}
                      >
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                          <Shield className="h-8 w-8 text-red-500" />
                        </div>
                        <h3 className="mb-4 text-base font-bold uppercase tracking-widest text-red-500">
                          Security Recommendations
                        </h3>
                        <div
                          className={`mx-auto max-w-lg space-y-2 text-left text-sm leading-loose ${isSecurityMode ? 'text-gray-400' : 'text-user-text/90'}`}
                        >
                          <p className="flex items-start gap-2">
                            <span className="text-red-500">•</span> Change passwords on all affected
                            accounts immediately
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="text-red-500">•</span> Enable two-factor authentication
                            (2FA) wherever possible
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="text-red-500">•</span> Use unique, complex passwords
                            for each service
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="text-red-500">•</span> Utilize a secure password
                            manager to track credentials
                          </p>
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
    </DesignAppShell>
  );
};

export default DarkWebPage;
