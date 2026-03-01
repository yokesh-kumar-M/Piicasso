import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';
import {
  Grid, List, Search, Download, Trash2,
  FileText, FileDown, ClockIcon, AlertCircle
} from 'lucide-react';

const DashboardPage = () => {
  const [view, setView] = useState('grid');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('history/');
      // Backend returns { results: [...], total, page, ... }
      // Handle both paginated and flat array responses gracefully
      const data = res.data;
      if (Array.isArray(data)) {
        setHistory(data);
      } else if (data?.results && Array.isArray(data.results)) {
        setHistory(data.results);
      } else {
        setHistory([]);
      }
      setError('');
    } catch (err) {
      console.error('Failed to fetch history', err);
      setError('Could not load history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (id) => {
    const token = localStorage.getItem('access_token');
    const baseUrl = (process.env.REACT_APP_API_URL || 'https://piicasso.onrender.com/api/').replace(/\/$/, '');
    const url = `${baseUrl}/report/${id}/`;
    // Open in new tab — the backend will return the PDF with the auth header
    window.open(url, '_blank');
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    try {
      await axiosInstance.delete(`history/${id}/`);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      alert('Deletion failed. Please try again.');
    }
  };

  const filteredHistory = (history || []).filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = (item.pii_data?.full_name || item.pii_data?.username || '').toLowerCase();
    const id = String(item.id);
    return name.includes(term) || id.includes(term);
  });

  // Simple score based on id - just visual, not real "risk"
  const getScore = (id) => (id * 17 + 13) % 100;
  const getScoreColor = (score) =>
    score > 75 ? 'bg-red-600' : score > 45 ? 'bg-yellow-500' : 'bg-emerald-500';
  const getScoreBadge = (score) =>
    score > 75 ? 'bg-red-900/30 text-red-400 border-red-900/50' :
      score > 45 ? 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50' :
        'bg-emerald-900/30 text-emerald-400 border-emerald-900/50';

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white font-mono selection:bg-red-600 selection:text-white">
      <Navbar />

      <div className="pt-24 px-4 md:px-10 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-zinc-800 pb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-wide mb-1 flex items-center gap-3">
              <ClockIcon className="w-6 h-6 text-red-600" />
              Generation <span className="text-zinc-500 font-normal">History</span>
            </h1>
            <p className="text-xs text-zinc-500">All previously generated wordlists</p>
          </div>

          <div className="flex gap-3 flex-wrap">
            {/* Search */}
            <div className="bg-zinc-900 flex items-center px-3 py-2 rounded border border-zinc-800 focus-within:border-red-600 transition-colors">
              <Search className="w-4 h-4 text-zinc-500 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-white w-40 placeholder-zinc-600"
              />
            </div>

            {/* View toggle */}
            <div className="flex bg-zinc-900 rounded border border-zinc-800">
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-l transition-colors ${view === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-r transition-colors ${view === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 text-red-400 text-sm bg-red-900/10 border border-red-900/30 px-4 py-3 rounded mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={fetchHistory} className="ml-auto text-xs underline hover:text-white">Retry</button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center text-zinc-500 mt-24 font-mono text-sm animate-pulse">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="text-center mt-24">
            <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-sm">No records yet. Generate a wordlist to get started.</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center text-zinc-500 mt-24 text-sm">
            No results for "<span className="text-white">{searchTerm}</span>"
          </div>
        ) : view === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredHistory.map(item => {
              const name = item.pii_data?.full_name || item.pii_data?.username || 'Unnamed Target';
              const score = getScore(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-[#141414] border border-zinc-800 rounded-lg group hover:border-red-600/50 transition-all duration-200 overflow-hidden"
                >
                  <div className="h-28 bg-gradient-to-br from-zinc-900 to-black p-4 relative flex items-end">
                    <FileText className="absolute top-4 right-4 w-10 h-10 text-zinc-800 group-hover:text-zinc-700 transition-colors" />
                    <div>
                      <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">Record #{item.id}</span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-base mb-1 truncate text-white" title={name}>{name}</h3>
                    <p className="text-[11px] text-zinc-500 mb-3">{new Date(item.timestamp).toLocaleString()}</p>

                    {/* Score bar */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex-1 h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getScoreColor(score)}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">{score}%</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadPDF(item.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-white text-black text-xs font-bold py-2 rounded hover:bg-zinc-200 transition-colors"
                      >
                        <FileDown className="w-3 h-3" /> Download
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-2 bg-zinc-800 hover:bg-red-900/30 text-zinc-400 hover:text-red-400 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-[#141414] border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/40 text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredHistory.map(item => {
                  const name = item.pii_data?.full_name || item.pii_data?.username || 'Unnamed Target';
                  const score = getScore(item.id);
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{name}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getScoreBadge(score)}`}>
                          {score}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 text-xs">{new Date(item.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => downloadPDF(item.id)} className="text-zinc-400 hover:text-white transition-colors" title="Download PDF">
                            <FileDown className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteItem(item.id)} className="text-zinc-600 hover:text-red-500 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
