import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';
import { getSavedIds, toggleSaved } from './SavedPage';
import {
  Grid, List, Search, Download, Trash2,
  FileText, FileDown, ClockIcon, AlertCircle,
  Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';

const DashboardPage = () => {
  const [view, setView] = useState('grid');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [savedIds, setSavedIds] = useState(getSavedIds());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
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
      if (Array.isArray(data)) {
        setHistory(data);
        setTotalPages(1);
        setTotalItems(data.length);
      } else if (data?.results && Array.isArray(data.results)) {
        setHistory(data.results);
        setTotalPages(data.total_pages || 1);
        setTotalItems(data.total || data.results.length);
        setCurrentPage(data.page || page);
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
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    try {
      await axiosInstance.delete(`history/${id}/`);
      setHistory(prev => prev.filter(item => item.id !== id));
      setTotalItems(prev => prev - 1);
    } catch (e) {
      alert('Deletion failed. Please try again.');
    }
  };

  const exportCSV = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const url = `${getApiBase()}/history/export/`;
      const res = await axiosInstance.get('history/export/', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const dlUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = dlUrl;
      link.download = 'piicasso_history.csv';
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

  // Pagination range with ellipsis
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
            <p className="text-xs text-zinc-500">
              {totalItems > 0 ? `${totalItems} total records` : 'All previously generated wordlists'} — download as PDF report or raw wordlist
            </p>
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

            {/* Export CSV */}
            <button
              onClick={exportCSV}
              className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded hover:bg-zinc-800 transition-colors flex items-center gap-2 text-xs text-zinc-400"
              title="Export all as CSV"
            >
              <FileDown className="w-4 h-4" /> CSV
            </button>

            {/* Refresh */}
            <button
              onClick={() => fetchHistory(currentPage)}
              className="bg-zinc-900 border border-zinc-800 p-2 rounded hover:bg-zinc-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-zinc-400" />
            </button>

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
            <button onClick={() => fetchHistory(currentPage)} className="ml-auto text-xs underline hover:text-white">Retry</button>
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
              const wordCount = getWordCount(item);
              return (
                <div
                  key={item.id}
                  className="bg-[#141414] border border-zinc-800 rounded-lg group hover:border-red-600/50 transition-all duration-200 overflow-hidden"
                >
                  <div className="h-28 bg-gradient-to-br from-zinc-900 to-black p-4 relative flex items-end">
                    <FileText className="absolute top-4 right-4 w-10 h-10 text-zinc-800 group-hover:text-zinc-700 transition-colors" />
                    <button
                      onClick={() => handleToggleSave(item.id)}
                      className="absolute top-3 left-3 transition-colors z-10"
                      title={savedIds.includes(item.id) ? 'Remove from saved' : 'Save for later'}
                    >
                      {savedIds.includes(item.id)
                        ? <BookmarkCheck className="w-5 h-5 text-yellow-500" />
                        : <Bookmark className="w-5 h-5 text-zinc-600 hover:text-yellow-500" />
                      }
                    </button>
                    <div>
                      <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">Record #{item.id}</span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-base mb-1 truncate text-white" title={name}>{name}</h3>
                    <p className="text-[11px] text-zinc-500 mb-3">{new Date(item.timestamp).toLocaleString()}</p>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
                        {wordCount} passwords
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadWordlist(item.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-white text-black text-xs font-bold py-2 rounded hover:bg-zinc-200 transition-colors"
                        title="Download raw wordlist (.txt)"
                      >
                        <Download className="w-3 h-3" /> Wordlist
                      </button>
                      <button
                        onClick={() => downloadPDF(item.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 text-white text-xs font-bold py-2 rounded hover:bg-zinc-700 transition-colors"
                        title="Download PDF report"
                      >
                        <FileDown className="w-3 h-3" /> Report
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[600px]">
                <thead className="bg-black/40 text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Passwords</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {filteredHistory.map(item => {
                    const name = item.pii_data?.full_name || item.pii_data?.username || 'Unnamed Target';
                    const wordCount = getWordCount(item);
                    return (
                      <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{name}</td>
                        <td className="px-6 py-4">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded border bg-zinc-900 border-zinc-800 text-zinc-300">
                            {wordCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400 text-xs">{new Date(item.timestamp).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => handleToggleSave(item.id)} className="transition-colors" title={savedIds.includes(item.id) ? 'Saved' : 'Save'}>
                              {savedIds.includes(item.id)
                                ? <BookmarkCheck className="w-4 h-4 text-yellow-500" />
                                : <Bookmark className="w-4 h-4 text-zinc-600 hover:text-yellow-500" />
                              }
                            </button>
                            <button onClick={() => downloadWordlist(item.id)} className="text-zinc-400 hover:text-white transition-colors" title="Download Wordlist">
                              <Download className="w-4 h-4" />
                            </button>
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
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageRange().map((page, i) => (
              page === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-zinc-600">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${
                    currentPage === page
                      ? 'bg-netflix-red text-white'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              )
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs text-zinc-600 ml-4">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
