import React, { useState, useEffect, useContext } from 'react';
import axiosInstance from '../api/axios';
import { ModeContext } from '../context/ModeContext';
import { History, AlertTriangle, Clock, Database, Shield, RefreshCw, AlertCircle } from 'lucide-react';
import { HistorySkeleton } from '../components/SkeletonLoader';

const AnalysisHistoryPage = () => {
  const { mode: appMode } = useContext(ModeContext) || { mode: 'security' };
  const isSecurityMode = appMode === 'security';

  const theme = {
    card: isSecurityMode ? 'sec-card' : 'usr-card',
    accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
    accentBg: isSecurityMode ? 'bg-security-red' : 'bg-user-cobalt',
    heading: isSecurityMode ? 'security-heading' : 'user-heading',
    textMuted: isSecurityMode ? 'text-gray-500' : 'text-user-text/70',
    textPrimary: isSecurityMode ? 'text-gray-300' : 'text-user-text/90',
    divider: isSecurityMode ? 'border-security-border' : 'border-user-border',
    tableHeader: isSecurityMode ? 'bg-black border-b border-security-border text-gray-500' : 'bg-white/10 border-b border-user-border text-user-text/70',
    tableRowHover: isSecurityMode ? 'hover:bg-white/5' : 'hover:bg-white/10',
    cardInner: isSecurityMode ? 'bg-black/50 border-security-border' : 'bg-white/5 border-user-border',
    refreshBtn: isSecurityMode ? 'bg-security-surface border border-security-border hover:bg-white/5' : 'bg-white/5 border border-user-border hover:bg-white/10',
    iconBg: isSecurityMode ? 'bg-security-red/20 border border-security-red/30' : 'bg-user-cobalt/20 border border-user-cobalt/30',
  };

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('password/history/');
      setAnalyses(res.data.analyses || []);
    } catch (err) {
      setError('Failed to load analysis history');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      low: 'text-green-500',
      medium: 'text-yellow-500',
      high: 'text-orange-500',
      critical: 'text-red-500'
    };
    return colors[level] || (isSecurityMode ? 'text-gray-400' : 'text-user-text/60');
  };

  const getLevelBg = (level) => {
    const colors = {
      low: 'bg-green-500/20 border border-green-500/30',
      medium: 'bg-yellow-500/20 border border-yellow-500/30',
      high: 'bg-orange-500/20 border border-orange-500/30',
      critical: 'bg-red-500/20 border border-red-500/30'
    };
    return colors[level] || theme.cardInner;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <HistorySkeleton />;
  }

  return (
    <div className={`min-h-screen flex flex-col ${isSecurityMode ? 'bg-security-bg' : 'bg-user-bg'}`}>
      <div className="pt-28 px-4 md:px-12 pb-20 max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${theme.iconBg} flex items-center justify-center ${isSecurityMode ? 'shadow-[0_0_15px_rgba(225,29,72,0.2)]' : 'shadow-[0_0_15px_rgba(59,130,246,0.2)]'}`}>
              <History className={`w-6 h-6 ${theme.accentColor}`} />
            </div>
            <div>
              <h1 className={`text-2xl md:text-3xl mb-1 ${theme.heading}`}>
                {isSecurityMode ? 'ANALYSIS HISTORY' : 'Analysis History'}
              </h1>
              <p className={`text-sm ${theme.textMuted}`}>
                {isSecurityMode ? 'Past credential scan records.' : 'View your past password analyses'}
              </p>
            </div>
          </div>
          <button
            onClick={fetchHistory}
            className={`p-2 rounded-lg transition-colors ${theme.refreshBtn} ${theme.textMuted} hover:text-white`}
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className={`rounded-lg p-4 flex items-center gap-3 text-red-400 border ${isSecurityMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {!loading && analyses.length === 0 ? (
          <div className={`${theme.card} p-12 text-center flex flex-col items-center justify-center min-h-[300px]`}>
            <div className={`w-16 h-16 rounded-full ${isSecurityMode ? 'bg-white/5' : 'bg-white/5'} flex items-center justify-center mb-4`}>
              <Shield className={`w-8 h-8 ${isSecurityMode ? 'text-gray-600' : 'text-user-text/40'}`} />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${theme.heading}`}>
              {isSecurityMode ? 'NO RECORDS FOUND' : 'No Analyses Yet'}
            </h3>
            <p className={`text-sm max-w-sm ${theme.textMuted}`}>
              {isSecurityMode ? 'Run a password scan from the dashboard to populate this log.' : 'Check your first password on the Dashboard to see your analysis history here.'}
            </p>
          </div>
        ) : (
          <div className={`${theme.card} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className={`text-xs uppercase tracking-widest font-semibold ${theme.tableHeader}`}>
                    <th className="p-5">Date</th>
                    <th className="p-5">Level</th>
                    <th className="p-5">Score</th>
                    <th className="p-5">Crack Time</th>
                    <th className="p-5">Breaches</th>
                    <th className="p-5">Issues</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isSecurityMode ? 'divide-security-border' : 'divide-user-border'}`}>
                  {analyses.map((analysis) => (
                    <tr key={analysis.id} className={`transition-colors ${theme.tableRowHover}`}>
                      <td className="p-5">
                        <span className={`text-sm ${theme.textPrimary} font-medium`}>{formatDate(analysis.created_at)}</span>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getLevelBg(analysis.vulnerability_level)} ${getLevelColor(analysis.vulnerability_level)}`}>
                          {analysis.vulnerability_level.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-1.5 bg-black/30 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                analysis.strength_score >= 75 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' :
                                analysis.strength_score >= 50 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' :
                                analysis.strength_score >= 25 ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                              }`}
                              style={{ width: `${analysis.strength_score}%` }}
                            />
                          </div>
                          <span className={`text-sm font-bold ${isSecurityMode ? 'text-white' : 'text-user-text'}`}>{analysis.strength_score}%</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className={`flex items-center gap-2 ${theme.textPrimary} ${theme.cardInner} px-3 py-1.5 rounded-lg border w-fit`}>
                          <Clock className={`w-4 h-4 ${theme.accentColor}`} />
                          <span className="text-sm font-medium">{analysis.crack_time_estimate}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className={`flex items-center gap-2 font-bold ${analysis.breach_count > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          <Database className="w-4 h-4" />
                          <span className="text-sm">{analysis.breach_count}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className={`flex items-center gap-2 ${theme.textPrimary}`}>
                          <AlertTriangle className={`w-4 h-4 ${analysis.vulnerabilities_count > 0 ? 'text-yellow-500' : theme.textMuted}`} />
                          <span className="text-sm font-medium">{analysis.vulnerabilities_count}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisHistoryPage;
