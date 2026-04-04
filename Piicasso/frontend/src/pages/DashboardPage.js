import React, { useState, useEffect, useCallback, useContext } from 'react';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';
import { getSavedIds, toggleSaved } from './SavedPage';
import { ModeContext } from '../context/ModeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid, List, Search, Download, Trash2,
  FileText, FileDown, Clock, AlertCircle,
  Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, RefreshCw, Server, Activity, ArrowUpRight, Database
} from 'lucide-react';

const DashboardPage = () => {
  const [view, setView] = useState('grid');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [savedIds, setSavedIds] = useState(getSavedIds());
  
  const { mode: appMode } = useContext(ModeContext) || { mode: 'security' };
  const isSecurityMode = appMode === 'security';

  const theme = {
    accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
    accentBg: isSecurityMode ? 'bg-security-red' : 'bg-user-cobalt',
    card: isSecurityMode ? 'security-card' : 'user-glass-panel',
    inputBg: isSecurityMode ? 'bg-black/50 border-white/10 focus-within:border-security-red/50 text-white' : 'bg-white/5 border-white/10 focus-within:border-user-cobalt/50 text-white',
    btnPrimary: isSecurityMode ? 'security-btn-primary' : 'user-btn-primary',
    btnSecondary: isSecurityMode ? 'bg-black/50 text-white border border-white/10 hover:bg-white/10' : 'bg-white/10 text-white border border-white/10 hover:bg-white/20',
    tableHeader: isSecurityMode ? 'bg-black/60 text-security-muted border-b border-white/10' : 'bg-black/30 text-user-muted border-b border-white/10',
    tableRow: isSecurityMode ? 'border-b border-white/5 hover:bg-white/5' : 'border-b border-white/5 hover:bg-white/10',
    textMuted: isSecurityMode ? 'text-security-muted' : 'text-user-muted',
    border: isSecurityMode ? 'border-white/10' : 'border-white/10',
    iconMuted: isSecurityMode ? 'text-security-muted hover:text-white' : 'text-user-muted hover:text-white',
    hoverBg: isSecurityMode ? 'hover:bg-security-red/10' : 'hover:bg-user-cobalt/10',
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({ total: 0, saved: 0, recent: 0, avgCount: 0 });
  const pageSize = 12;

  const handleToggleSave = (id) => {
    const next = toggleSaved(id);
    setSavedIds(next);
  };

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`history/?page=${page}&page_size=${pageSize}`);
      const data = res.data;
      let records = [];
      if (Array.isArray(data)) {
        records = data;
        setHistory(records);
        setTotalPages(1);
        setTotalItems(records.length);
      } else if (data?.results && Array.isArray(data.results)) {
        records = data.results;
        setHistory(records);
        setTotalPages(data.total_pages || 1);
        setTotalItems(data.total || records.length);
        setCurrentPage(data.page || page);
      } else {
        setHistory([]);
      }
      
      // Compute dashboard stats client-side based on fetched records (since backend might not provide a summary endpoint here)
      if (records.length > 0) {
        const avg = Math.round(records.reduce((acc, curr) => acc + (curr.wordlist_count || curr.wordlist?.length || 0), 0) / records.length);
        const recentCount = records.filter(r => (Date.now() - new Date(r.timestamp).getTime()) < 604800000).length; // 7 days
        setDashboardStats({
          total: data.total || records.length,
          saved: getSavedIds().length,
          recent: recentCount,
          avgCount: avg
        });
      }

      setError('');
    } catch (err) {
      console.error('Failed to fetch history', err);
      setError('Failed to retrieve history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchHistory(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getApiBase = () => {
    return (process.env.REACT_APP_API_URL || 'https://piicasso.onrender.com/api/').replace(/\/$/, '');
  };

  const downloadWithSignedToken = async (fileType, id) => {
    try {
      const res = await axiosInstance.post('download-token/', {
        file_type: fileType,
        record_id: id,
      });
      const downloadToken = res.data.download_token;
      const url = `${getApiBase()}/file/${fileType}/${id}/?token=${encodeURIComponent(downloadToken)}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to generate download token:', err);
      alert('Download failed. Please try again.');
    }
  };

  const downloadPDF = (id) => downloadWithSignedToken('report', id);
  const downloadWordlist = (id) => downloadWithSignedToken('wordlist', id);

  const deleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;
    try {
      await axiosInstance.delete(`history/${id}/`);
      setHistory(prev => prev.filter(item => item.id !== id));
      setTotalItems(prev => prev - 1);
      setDashboardStats(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (e) {
      alert('Deletion failed. Please try again.');
    }
  };

  const exportCSV = async () => {
    try {
      const res = await axiosInstance.get('export/csv/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'piicasso_history.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('CSV export failed.');
    }
  };

  const filteredHistory = (history || []).filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = (item.pii_data?.full_name || item.pii_data?.username || '').toLowerCase();
    const id = String(item.id);
    return name.includes(term) || id.includes(term);
  });

  const getWordCount = (item) => item.wordlist_count || (item.wordlist ? item.wordlist.length : 0);

  const getPageRange = () => {
    const range = [];
    const delta = 2;
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      range.push(i);
    }
    if (range[0] > 1) { range.unshift('...'); range.unshift(1); }
    if (range[range.length - 1] < totalPages) { range.push('...'); range.push(totalPages); }
    return range;
  };

  return (
    <div className="w-full relative min-h-screen bg-transparent text-white font-sans overflow-x-hidden">
      <Navbar />

      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-20">
        
        {/* 1. Header: Title + subtitle & Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className={`flex items-center gap-3 text-3xl font-bold tracking-tight uppercase ${theme.accentColor}`}>
              <Database className="w-7 h-7" />
              Intelligence Database
            </h1>
            <p className={`mt-1.5 text-sm ${theme.textMuted}`}>
              Review, search, and export your generated records.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-end h-10">
            <button
              onClick={() => fetchHistory(currentPage)}
              className={`h-full aspect-square flex items-center justify-center rounded-md transition-colors ${theme.btnSecondary}`}
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={exportCSV}
              className={`h-full flex items-center gap-2 px-5 rounded-md font-bold text-xs uppercase tracking-wider transition-colors ${theme.btnPrimary}`}
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 2. Hero summary strip / top metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Records', value: dashboardStats.total, icon: Database, trend: '+12%' },
            { label: 'Saved Items', value: savedIds.length, icon: BookmarkCheck, trend: 'Active' },
            { label: 'Generated This Week', value: dashboardStats.recent, icon: Activity, trend: 'High' },
            { label: 'Avg. Wordlist Size', value: dashboardStats.avgCount, icon: Server, trend: 'Stable' }
          ].map((stat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              key={i} 
              className={`p-6 rounded-2xl relative overflow-hidden group flex flex-col justify-between h-32 border ${theme.border} bg-gradient-to-br from-black/60 to-black/20 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all hover:border-white/20`}
            >
              <div className={`absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-500 ease-out ${theme.accentColor}`}>
                <stat.icon className="w-14 h-14" />
              </div>
              <div className="relative z-10 flex justify-between items-start">
                <span className={`text-[10px] font-bold font-sans uppercase tracking-widest text-white/60`}>{stat.label}</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full border border-white/10 bg-black/50 text-white/50 flex items-center gap-1 font-mono uppercase shadow-sm group-hover:border-white/30 transition-colors`}>
                  {stat.trend} <ArrowUpRight className="w-2.5 h-2.5" />
                </span>
              </div>
              <div className="relative z-10 text-4xl font-black tracking-tighter text-white drop-shadow-md">
                {stat.value.toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>

        {/* 3. Search + filters + view toggle (Sticky Control Bar) */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`sticky top-20 z-40 flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 mb-8 p-4 rounded-2xl bg-black/40 backdrop-blur-2xl border ${theme.border} shadow-[0_10px_40px_rgba(0,0,0,0.4)]`}>
          <div className="relative w-full sm:w-[400px] flex-1 group">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${isSecurityMode ? 'text-security-red/50 group-focus-within:text-security-red' : 'text-user-cobalt/50 group-focus-within:text-user-cobalt'}`} />
            <input
              type="text"
              placeholder="Search intelligence records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-black/50 text-sm font-medium transition-all outline-none shadow-inner placeholder-white/20 focus:ring-2 focus:border-transparent ${isSecurityMode ? 'border-security-red/20 focus:ring-security-red/50 text-white' : 'border-user-cobalt/20 focus:ring-user-cobalt/50 text-white'}`}
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className={`flex items-center rounded-xl border p-1 ${theme.border} bg-black/60 shadow-inner`}>
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg transition-all flex items-center gap-2 ${
                  view === 'grid' ? `bg-white/10 text-white shadow-sm ring-1 ring-white/20` : `${theme.iconMuted} hover:bg-white/5`
                }`}
              >
                <Grid className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest pr-1">Grid</span>
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-all flex items-center gap-2 ${
                  view === 'list' ? `bg-white/10 text-white shadow-sm ring-1 ring-white/20` : `${theme.iconMuted} hover:bg-white/5`
                }`}
              >
                <List className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest pr-1">List</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Content & Right Rail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 4. Main content area */}
          <div className="lg:col-span-9 w-full min-w-0 flex flex-col gap-6">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-red-900/20 border border-red-500/50 flex items-start gap-3 text-red-400 shadow-lg">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}

            {loading && history.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-32 border border-dashed rounded-2xl ${theme.border} bg-black/10 backdrop-blur-sm`}>
                <RefreshCw className={`w-10 h-10 animate-spin mb-4 ${theme.accentColor}`} />
                <p className={`text-sm font-mono uppercase tracking-widest ${theme.textMuted}`}>Querying Database...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`flex flex-col items-center justify-center py-32 border border-dashed rounded-2xl ${theme.border} bg-black/10 backdrop-blur-sm`}>
                <div className={`w-20 h-20 rounded-full bg-black/30 flex items-center justify-center mb-6 border ${theme.border}`}>
                  <Search className={`w-10 h-10 opacity-40 ${theme.textMuted}`} />
                </div>
                <p className={`text-lg font-bold tracking-wider text-white mb-2`}>No records found</p>
                {searchTerm ? (
                  <p className={`text-sm ${theme.textMuted} text-center max-w-sm`}>We couldn't find any targets matching "{searchTerm}". Adjust your parameters.</p>
                ) : (
                  <div className="flex flex-col items-center mt-4">
                    <p className={`text-sm ${theme.textMuted} mb-6 text-center max-w-sm`}>Your database is currently empty. Start a new operation to generate target intelligence.</p>
                    <a href="/new-operation" className={`px-6 py-3 rounded-lg font-bold text-sm tracking-wider uppercase transition-all ${theme.btnPrimary}`}>
                      Deploy Operation
                    </a>
                  </div>
                )}
              </motion.div>
            ) : view === 'grid' ? (
              
              /* GRID VIEW */
              <motion.div variants={{hidden:{opacity:0}, show:{opacity:1, transition:{staggerChildren: 0.05}}}} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredHistory.map(item => {
                  const name = item.pii_data?.full_name || item.pii_data?.username || 'Unknown Target';
                  const wordCount = getWordCount(item);
                  const isSaved = savedIds.includes(item.id);
                  
                  return (
                    <motion.div
                      variants={{hidden:{opacity:0, y:15}, show:{opacity:1, y:0}}}
                      key={item.id}
                      className={`flex flex-col overflow-hidden rounded-2xl border ${theme.border} bg-black/40 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] hover:border-white/20 group relative`}
                    >
                      {/* Subtly colored gradient glow behind the card content */}
                      <div className={`absolute -inset-24 bg-gradient-to-b opacity-0 group-hover:opacity-20 transition-opacity duration-700 blur-3xl pointer-events-none ${isSecurityMode ? 'from-security-red/50' : 'from-user-cobalt/50'} to-transparent`} />
                      
                      {/* Card Header */}
                      <div className={`p-5 flex items-start justify-between border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent relative z-10`}>
                        <div className="flex-1 min-w-0 pr-4">
                          <p className={`text-[10px] font-mono font-bold tracking-widest mb-1.5 opacity-80 ${theme.accentColor}`}>REC // #{item.id}</p>
                          <h3 className="font-bold text-lg truncate text-white/90 group-hover:text-white transition-colors">{name}</h3>
                        </div>
                        <button
                          onClick={() => handleToggleSave(item.id)}
                          className={`p-2.5 rounded-xl transition-all duration-300 bg-black/40 border ${theme.border} ${isSaved ? theme.accentColor + ' shadow-[0_0_10px_currentColor]' : theme.iconMuted} hover:bg-white/10 hover:border-white/30`}
                          title={isSaved ? "Remove from Workspace" : "Save to Workspace"}
                        >
                          {isSaved ? <BookmarkCheck className="w-4 h-4 fill-current" /> : <Bookmark className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Card Body */}
                      <div className="p-6 flex-1 space-y-6 relative z-10 bg-black/20">
                        <div>
                          <p className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${theme.textMuted}`}>Volume Extracted</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black tracking-tighter text-white">{wordCount.toLocaleString()}</span>
                            <span className={`text-[11px] uppercase tracking-widest font-bold ${theme.textMuted}`}>keys</span>
                          </div>
                        </div>
                        <div>
                          <p className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${theme.textMuted}`}>Timestamp</p>
                          <p className="text-xs font-mono text-white/70 flex items-center gap-2">
                            <Clock className={`w-3.5 h-3.5 ${theme.accentColor} opacity-70`} />
                            {new Date(item.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className={`p-4 border-t border-white/5 flex items-center justify-between bg-black/60 relative z-10`}>
                        <div className="flex gap-2">
                          <button
                            onClick={() => downloadWordlist(item.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-white/80`}
                            title="Download Wordlist (.txt)"
                          >
                            <FileDown className="w-3.5 h-3.5" /> TXT
                          </button>
                          <button
                            onClick={() => downloadPDF(item.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-white/80`}
                            title="Download Report (.pdf)"
                          >
                            <FileText className="w-3.5 h-3.5" /> PDF
                          </button>
                        </div>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className={`p-2.5 rounded-lg transition-all duration-300 text-white/30 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 border border-transparent`}
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

            ) : (

              /* LIST VIEW */
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`rounded-2xl border overflow-hidden ${theme.border} bg-black/20 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.5)]`}>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className={`${theme.tableHeader} font-sans text-xs font-semibold text-white/60 tracking-wide bg-gradient-to-r from-black/40 to-transparent`}>
                      <tr>
                        <th className="px-6 py-5 font-semibold w-24 uppercase tracking-widest text-[10px]">Record ID</th>
                        <th className="px-6 py-5 font-semibold uppercase tracking-widest text-[10px]">Target Identity</th>
                        <th className="px-6 py-5 font-semibold w-32 uppercase tracking-widest text-[10px]">Volume</th>
                        <th className="px-6 py-5 font-semibold w-48 uppercase tracking-widest text-[10px]">Timestamp</th>
                        <th className="px-6 py-5 font-semibold text-right w-48 uppercase tracking-widest text-[10px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme.border}`}>
                      {filteredHistory.map(item => {
                        const name = item.pii_data?.full_name || item.pii_data?.username || 'Unknown Target';
                        const wordCount = getWordCount(item);
                        const isSaved = savedIds.includes(item.id);
                        
                        return (
                          <tr key={item.id} className={`transition-all duration-200 ${theme.tableRow} group hover:shadow-inner cursor-default`}>
                            <td className={`px-6 py-4 font-mono font-bold text-[11px] ${theme.accentColor} group-hover:text-white transition-colors`}>#{item.id}</td>
                            <td className="px-6 py-4 font-medium text-white/90 group-hover:text-white transition-colors flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full border ${theme.border} flex items-center justify-center bg-black/40 text-xs font-bold text-white/50 group-hover:border-white/30 transition-all`}>
                                {name.charAt(0).toUpperCase()}
                              </div>
                              {name}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1.5 rounded-md bg-black/40 border ${theme.border} text-xs font-mono text-white/70 group-hover:border-white/20 transition-all`}>
                                {wordCount.toLocaleString()}
                              </span>
                            </td>
                            <td className={`px-6 py-4 text-xs font-mono text-white/50 group-hover:text-white/80 transition-colors`}>
                              {new Date(item.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-all duration-300">
                                <button
                                  onClick={() => handleToggleSave(item.id)}
                                  className={`p-2 rounded-lg transition-colors bg-black/40 border ${theme.border} ${isSaved ? theme.accentColor : 'text-white/50'} hover:bg-white/10 hover:border-white/30`}
                                  title={isSaved ? "Remove from Workspace" : "Save to Workspace"}
                                >
                                  {isSaved ? <BookmarkCheck className="w-4 h-4 fill-current" /> : <Bookmark className="w-4 h-4" />}
                                </button>
                                <div className="w-px h-6 bg-white/10 mx-1"></div>
                                <button onClick={() => downloadWordlist(item.id)} className={`p-2 rounded-lg transition-colors ${theme.btnSecondary} hover:text-white`} title="Download TXT">
                                  <FileDown className="w-4 h-4" />
                                </button>
                                <button onClick={() => downloadPDF(item.id)} className={`p-2 rounded-lg transition-colors ${theme.btnSecondary} hover:text-white`} title="Download PDF">
                                  <FileText className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteItem(item.id)} className={`p-2 rounded-lg transition-colors text-white/40 hover:text-red-500 hover:bg-red-500/20 hover:border-red-500/30 border border-transparent ml-1`} title="Delete">
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
              </motion.div>
            )}
          </div>

          {/* 5. Right Rail (Sticky support column) */}
          <div className="lg:col-span-3 w-full shrink-0 hidden lg:block">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="sticky top-28 space-y-6">
              
              <div className={`p-6 rounded-2xl border ${theme.border} bg-black/40 backdrop-blur-xl shadow-2xl`}>
                <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-5">
                  <Activity className={`w-4 h-4 ${theme.accentColor}`} />
                  <h4 className={`text-[10px] font-bold font-sans uppercase tracking-widest text-white/60`}>Command Center</h4>
                </div>
                <div className="space-y-3">
                  <a href="/new-operation" className={`w-full flex items-center justify-between p-4 rounded-xl border font-bold transition-all group ${isSecurityMode ? 'bg-security-red/10 border-security-red/30 text-security-red hover:bg-security-red hover:text-white shadow-[0_0_15px_rgba(255,0,0,0.1)]' : 'bg-user-cobalt/10 border-user-cobalt/30 text-user-cobalt hover:bg-user-cobalt hover:text-white shadow-[0_0_15px_rgba(0,100,255,0.1)]'}`}>
                    <span className="text-sm tracking-wide">New Operation</span>
                    <Server className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </a>
                  <a href="/saved" className={`w-full flex items-center justify-between p-4 rounded-xl border text-sm font-semibold transition-all group bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white/80 hover:text-white`}>
                    <span className="tracking-wide">Workspace</span>
                    <Bookmark className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </a>
                </div>
              </div>

              <div className={`p-6 rounded-2xl border ${theme.border} bg-black/40 backdrop-blur-xl shadow-2xl`}>
                <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-5">
                  <Server className={`w-4 h-4 ${theme.textMuted}`} />
                  <h4 className={`text-[10px] font-bold font-sans uppercase tracking-widest text-white/60`}>System Telemetry</h4>
                </div>
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-white/50 font-medium">Storage Quota</span>
                      <span className="text-white font-mono font-bold text-[10px]">42%</span>
                    </div>
                    <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5 shadow-inner">
                      <motion.div initial={{ width: 0 }} animate={{ width: '42%' }} transition={{ duration: 1, ease: 'easeOut' }} className={`h-full ${theme.accentBg} shadow-[0_0_10px_currentColor]`} />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/50 font-medium">Node Connection</span>
                      <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1.5 uppercase tracking-wider font-bold">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div> Secure
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        </div>

        {/* 6. Pagination Footer (Breathing Space) */}
        {totalPages > 1 && !loading && (
          <div className={`mt-12 pt-8 border-t ${theme.border} flex flex-col md:flex-row items-center justify-between gap-4`}>
            
            <div className={`text-xs font-mono uppercase tracking-widest ${theme.textMuted} order-2 md:order-1`}>
              Showing page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-1.5 order-1 md:order-2 bg-black/20 p-1.5 rounded-lg border border-white/5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-md transition-colors ${theme.btnSecondary} disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex gap-1 px-2">
                {getPageRange().map((page, i) => (
                  page === '...' ? (
                    <span key={`ellipsis-${i}`} className={`px-2 py-2 flex items-end text-lg leading-none ${theme.textMuted}`}>...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[36px] h-9 rounded-md text-xs font-bold transition-colors border ${
                        currentPage === page
                          ? `${isSecurityMode ? 'bg-security-red/20 border-security-red text-security-red' : 'bg-user-cobalt/20 border-user-cobalt text-user-cobalt'}`
                          : `bg-transparent border-transparent text-white hover:bg-white/10`
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md transition-colors ${theme.btnSecondary} disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className={`text-xs font-mono uppercase tracking-widest ${theme.textMuted} order-3 hidden md:block`}>
              {totalItems} total records
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default DashboardPage;