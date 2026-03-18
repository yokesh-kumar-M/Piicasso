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
    return colors[level] || 'text-zinc-400';
  };

  const getLevelBg = (level) => {
    const colors = {
      low: 'bg-green-500/20',
      medium: 'bg-yellow-500/20',
      high: 'bg-orange-500/20',
      critical: 'bg-red-500/20'
    };
    return colors[level] || 'bg-zinc-500/20';
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
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <History className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Analysis History</h1>
            <p className="text-zinc-400 text-sm">View your past password analyses</p>
          </div>
        </div>
        <button
          onClick={fetchHistory}
          className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {!loading && analyses.length === 0 ? (
        <div className="bg-[#141414] border border-zinc-800 rounded-lg p-12 text-center">
          <Shield className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Analyses Yet</h3>
          <p className="text-zinc-500 text-sm">
            Check your first password to see analysis history here.
          </p>
        </div>
      ) : (
        <div className="bg-[#141414] border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-4 text-xs text-zinc-500 uppercase tracking-wider">Date</th>
                  <th className="text-left p-4 text-xs text-zinc-500 uppercase tracking-wider">Level</th>
                  <th className="text-left p-4 text-xs text-zinc-500 uppercase tracking-wider">Score</th>
                  <th className="text-left p-4 text-xs text-zinc-500 uppercase tracking-wider">Crack Time</th>
                  <th className="text-left p-4 text-xs text-zinc-500 uppercase tracking-wider">Breaches</th>
                  <th className="text-left p-4 text-xs text-zinc-500 uppercase tracking-wider">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {analyses.map((analysis) => (
                  <tr key={analysis.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="p-4">
                      <span className="text-sm text-zinc-400">{formatDate(analysis.created_at)}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getLevelBg(analysis.vulnerability_level)} ${getLevelColor(analysis.vulnerability_level)}`}>
                        {analysis.vulnerability_level.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              analysis.strength_score >= 75 ? 'bg-green-500' :
                              analysis.strength_score >= 50 ? 'bg-yellow-500' :
                              analysis.strength_score >= 25 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${analysis.strength_score}%` }}
                          />
                        </div>
                        <span className="text-sm text-zinc-400">{analysis.strength_score}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{analysis.crack_time_estimate}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`flex items-center gap-2 ${analysis.breach_count > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        <Database className="w-4 h-4" />
                        <span className="text-sm">{analysis.breach_count}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm">{analysis.vulnerabilities_count}</span>
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
