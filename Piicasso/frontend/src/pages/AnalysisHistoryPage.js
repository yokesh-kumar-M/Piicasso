import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { History, AlertTriangle, Clock, Database, Shield, RefreshCw, AlertCircle } from 'lucide-react';
import { HistorySkeleton } from '../components/SkeletonLoader';

const AnalysisHistoryPage = () => {
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
    return colors[level] || 'text-user-text/60';
  };

  const getLevelBg = (level) => {
    const colors = {
      low: 'bg-green-500/20 border border-green-500/30',
      medium: 'bg-yellow-500/20 border border-yellow-500/30',
      high: 'bg-orange-500/20 border border-orange-500/30',
      critical: 'bg-red-500/20 border border-red-500/30'
    };
    return colors[level] || 'bg-white/5 border border-user-border';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-user-cobalt/20 border border-user-cobalt/30 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <History className="w-6 h-6 text-user-cobalt" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white user-heading">Analysis History</h1>
            <p className="text-user-text/70 text-sm">View your past password analyses</p>
          </div>
        </div>
        <button
          onClick={fetchHistory}
          className="p-2 bg-white/5 border border-user-border rounded-lg hover:bg-white/10 transition-colors text-user-text/80 hover:text-white"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {!loading && analyses.length === 0 ? (
        <div className="user-glass-panel p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-user-text/40" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 user-heading">No Analyses Yet</h3>
          <p className="text-user-text/60 text-sm max-w-sm">
            Check your first password on the Dashboard to see your analysis history here.
          </p>
        </div>
      ) : (
        <div className="user-glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-user-border bg-white/5">
                  <th className="p-5 text-xs text-user-text/70 uppercase tracking-widest font-semibold">Date</th>
                  <th className="p-5 text-xs text-user-text/70 uppercase tracking-widest font-semibold">Level</th>
                  <th className="p-5 text-xs text-user-text/70 uppercase tracking-widest font-semibold">Score</th>
                  <th className="p-5 text-xs text-user-text/70 uppercase tracking-widest font-semibold">Crack Time</th>
                  <th className="p-5 text-xs text-user-text/70 uppercase tracking-widest font-semibold">Breaches</th>
                  <th className="p-5 text-xs text-user-text/70 uppercase tracking-widest font-semibold">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-user-border bg-transparent">
                {analyses.map((analysis) => (
                  <tr key={analysis.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-5">
                      <span className="text-sm text-user-text/80 font-medium">{formatDate(analysis.created_at)}</span>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getLevelBg(analysis.vulnerability_level)} ${getLevelColor(analysis.vulnerability_level)}`}>
                        {analysis.vulnerability_level.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              analysis.strength_score >= 75 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' :
                              analysis.strength_score >= 50 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' :
                              analysis.strength_score >= 25 ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                            }`}
                            style={{ width: `${analysis.strength_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-white">{analysis.strength_score}%</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-user-text/80 bg-white/5 px-3 py-1.5 rounded-lg border border-user-border w-fit">
                        <Clock className="w-4 h-4 text-user-cobalt" />
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
                      <div className="flex items-center gap-2 text-user-text/80">
                        <AlertTriangle className={`w-4 h-4 ${analysis.vulnerabilities_count > 0 ? 'text-yellow-500' : 'text-user-text/50'}`} />
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
  );
};

export default AnalysisHistoryPage;
