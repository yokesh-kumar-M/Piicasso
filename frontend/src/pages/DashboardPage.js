// src/pages/DashboardPage.js
import React, { useEffect, useState, useContext } from 'react';
import axiosInstance from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Trash2, Download, Eye } from 'lucide-react';
import Pagination from '../components/Pagination';

const DashboardPage = () => {
  const { logout, token, loading: authLoading } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch History
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`history/?page=${page}&page_size=${pageSize}`);
        setHistory(res.data.results);
        setTotalPages(res.data.total_pages);
      } catch (e) {
        if (e.response?.status === 401) {
          logout();
        } else if (e.response?.status === 429) {
          setError('Rate limit exceeded. Please try again later.');
        } else {
          setError(e.message || 'Failed to fetch history');
        }
      } finally {
        setLoading(false);
      }
    };

    if (token && !authLoading) fetchHistory();
  }, [token, authLoading, logout, page, pageSize]);

  // Delete Entry
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await axiosInstance.delete(`history/${id}/`);
      setHistory((prev) => prev.filter((entry) => entry.id !== id));
    } catch (e) {
      alert('Delete failed');
    }
  };

  // Download Wordlist
  const handleDownload = (wordlist) => {
    const blob = new Blob([wordlist.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wordlist.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white p-6">
      <h1 className="text-4xl font-bold text-red-600 mb-6 tracking-wide">
        🎬 PIIcasso Intelligence Hub
      </h1>

      {loading && <div className="text-zinc-400 animate-pulse">Loading your data...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {/* History Section */}
      {!loading && history.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Recent PII Scans</h2>
          <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="bg-zinc-900 rounded-lg shadow-lg p-4 w-72 flex-shrink-0 hover:scale-105 transition-transform"
              >
                <div className="text-sm text-zinc-400">
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
                <div className="mt-2 text-sm text-green-400">IP: {entry.ip_address}</div>
                <div className="mt-2 text-xs text-zinc-300 line-clamp-2">
                  {JSON.stringify(entry.pii_data)}
                </div>
                <div className="mt-3 text-red-400">
                  Wordlist Count: {entry.wordlist?.length || 0}
                </div>

                <div className="flex mt-4 space-x-2">
                  <button
                    onClick={() => setSelectedEntry(entry)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-sm px-2 py-1 rounded flex items-center justify-center"
                  >
                    <Eye size={16} className="mr-1" /> View
                  </button>
                  <button
                    onClick={() => handleDownload(entry.wordlist || [])}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-sm px-2 py-1 rounded flex items-center justify-center"
                  >
                    <Download size={16} className="mr-1" /> Save
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="flex-1 bg-zinc-700 hover:bg-zinc-800 text-sm px-2 py-1 rounded flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No history message */}
      {!loading && history.length === 0 && (
        <div className="text-zinc-500 mt-8">No PII scans yet. Run your first scan!</div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(newPage) => setPage(newPage)}
        />
      )}

      {/* Modal for Selected Entry */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg p-6 max-w-4xl w-full relative">
            <button
              onClick={() => setSelectedEntry(null)}
              className="absolute top-3 right-3 text-red-500 hover:text-red-400"
            >
              ✖
            </button>
            <h2 className="text-2xl font-bold text-red-500 mb-4">Scan Details</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg text-green-400 mb-2">PII Data</h3>
                <pre className="bg-zinc-800 p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(selectedEntry.pii_data, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="text-lg text-green-400 mb-2">Wordlist</h3>
                <div className="bg-zinc-800 p-3 rounded text-xs overflow-auto max-h-64">
                  {(selectedEntry.wordlist || []).map((word, i) => (
                    <div key={i}>{word}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
