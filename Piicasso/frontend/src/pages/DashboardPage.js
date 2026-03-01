import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';
import {
  Grid, List, Search, Filter, Download, Trash2,
  MoreHorizontal, Eye, ShieldAlert, FileText, FileDown
} from 'lucide-react';

const DashboardPage = () => {
  const [view, setView] = useState('grid');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axiosInstance.get('history/');
      setHistory(res.data.results);
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (id) => {
    // Remove trailing slash if present to avoid double slash issues
    const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
    const url = `${baseUrl}/pdf/${id}/`;
    window.open(url, '_blank');
  };

  const deleteItem = async (id) => {
    if (!window.confirm("CONFIRM DELETION: This intelligence record will be permanently erased.")) return;
    try {
      await axiosInstance.delete(`history/${id}/`);
      fetchHistory();
    } catch (e) {
      console.error("Deletion failed", e);
    }
  };

  const filteredHistory = history.filter(item => {
    const term = searchTerm.toLowerCase();
    const name = (item.pii_data?.full_name || item.pii_data?.username || 'Unknown Target').toLowerCase();
    const id = item.id.toString();
    return name.includes(term) || id.includes(term);
  });

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white font-body selection:bg-netflix-red selection:text-white">
      <Navbar />

      <div className="pt-24 px-6 md:px-12 pb-20">
        {/* ... Header ... */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-3xl font-heading tracking-wide mb-1">GENERATION <span className="text-gray-500">HISTORY</span></h1>
            <p className="text-xs text-gray-500 font-mono">View your previously generated wordlists</p>
          </div>

          <div className="flex gap-4 mt-4 md:mt-0">
            <div className="bg-zinc-900 flex items-center px-3 py-2 rounded border border-zinc-800 focus-within:border-netflix-red transition-colors">
              <Search className="w-4 h-4 text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Search archives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-white w-40 placeholder-gray-600"
              />
            </div>

            <div className="flex bg-zinc-900 rounded border border-zinc-800">
              <button
                onClick={() => setView('grid')}
                className={`p-2 hover:bg-zinc-800 ${view === 'grid' ? 'bg-zinc-800 text-white' : 'text-gray-500'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 hover:bg-zinc-800 ${view === 'list' ? 'bg-zinc-800 text-white' : 'text-gray-500'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center text-gray-500 mt-20 font-mono animate-pulse">Loading History...</div>
        ) : history.length === 0 ? (
          <div className="text-center text-gray-500 mt-20 font-mono">No records found. Generate a wordlist to get started.</div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center text-gray-500 mt-20 font-mono">No matching records found for "{searchTerm}".</div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredHistory.map(item => {
              const name = item.pii_data?.full_name || item.pii_data?.username || 'Unknown Target';
              const risk = (item.id * 7) % 100; // Deterministic fake risk

              return (
                <div key={item.id} className="bg-[#141414] border border-zinc-800 rounded group hover:border-netflix-red transition-colors relative overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-zinc-800 to-black p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="bg-black/50 px-2 py-0.5 text-[10px] rounded border border-zinc-700 uppercase tracking-wider text-gray-400">PERSON</span>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <FileText className="w-12 h-12 text-zinc-700 absolute bottom-4 right-4 group-hover:text-zinc-600 transition-colors" />
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 truncate" title={name}>{name}</h3>
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                      <span>OP-#{item.id}</span>
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden flex border border-white/5">
                        <div
                          className={`h-full transition-all duration-1000 ${risk > 80 ? 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]' : risk > 50 ? 'bg-yellow-600' : 'bg-green-600'}`}
                          style={{ width: `${risk}%` }}
                        ></div>
                      </div>
                      <div className="flex flex-col items-end leading-none">
                        <span className={`text-[10px] font-mono font-bold ${risk > 80 ? 'text-red-500 animate-pulse' : 'text-zinc-400'}`}>{risk}%</span>
                        <span className="text-[7px] font-mono text-zinc-600 uppercase">Score</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => downloadPDF(item.id)} className="flex-1 bg-white text-black text-xs font-bold py-2 rounded hover:bg-gray-200 flex items-center justify-center gap-2">
                        <FileDown className="w-3 h-3" /> Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#141414] border border-zinc-800 rounded overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap lg:whitespace-normal">
              <thead className="bg-[#1f1f1f] text-gray-400 font-mono text-xs uppercase">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredHistory.map(item => {
                  const name = item.pii_data?.full_name || item.pii_data?.username || 'Unknown Target';
                  const risk = (item.id * 7) % 100;

                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-gray-500">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        {name}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${risk > 80 ? 'bg-red-900/30 text-red-500 border border-red-900' :
                          risk > 50 ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-900' :
                            'bg-green-900/30 text-green-500 border border-green-900'
                          }`}>
                          {risk}% CRITICAL
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 font-mono">{new Date(item.timestamp).toLocaleString()}</td>
                      <td className="p-4 text-gray-300">Complete</td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => downloadPDF(item.id)} className="text-gray-400 hover:text-netflix-red" title="Download PDF Report">
                          <FileDown className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="text-gray-400 hover:text-red-500" title="Delete Record">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
