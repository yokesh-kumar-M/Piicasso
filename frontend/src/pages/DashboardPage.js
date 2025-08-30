import React, { useEffect, useState, useContext } from 'react';
import axiosInstance from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Trash2, Download, Eye, Calendar, MapPin, Shield, Activity, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { logout, token, loading: authLoading, user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`history/?page=${page}&page_size=12`);
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
  }, [token, authLoading, logout, page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this intelligence scan?')) return;
    try {
      await axiosInstance.delete(`history/${id}/`);
      setHistory((prev) => prev.filter((entry) => entry.id !== id));
    } catch (e) {
      alert('Delete failed');
    }
  };

  const handleDownload = (wordlist, id) => {
    const blob = new Blob([wordlist.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `piicasso-wordlist-${id}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskColor = (piiData) => {
    const highRiskFields = ['full_name', 'birth_year', 'gov_id', 'phone_suffix', 'bank_suffix'];
    const hasHighRisk = highRiskFields.some(field => piiData[field]);
    if (hasHighRisk) return 'from-red-600/20 to-red-800/20 border-red-500/30';
    return 'from-yellow-600/20 to-yellow-800/20 border-yellow-500/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white text-xl font-medium">Loading your intelligence data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-black via-zinc-900 to-black px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-white mb-4">
                Intelligence Hub
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl">
                Welcome back, <span className="text-red-400 font-semibold">{user?.username}</span>. 
                Manage your intelligence scans and access generated wordlists.
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-3 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>New Scan</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 pb-16">
        {error && (
          <div className="max-w-7xl mx-auto mb-8 bg-red-900/20 border border-red-500 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-red-400 mr-3" />
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Intelligence Scans Section */}
        {history.length > 0 ? (
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-8">
              <h2 className="text-3xl font-bold text-white mr-4">Recent Intelligence Scans</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-600 to-transparent"></div>
              <span className="text-gray-400 ml-4">{history.length} scans</span>
            </div>

            {/* Netflix-style Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className={`group relative bg-gradient-to-br ${getRiskColor(entry.pii_data)} rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl backdrop-blur-sm border cursor-pointer`}
                  onClick={() => setSelectedEntry(entry)}
                >
                  {/* Header with Date */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg px-2 py-1">
                      <span className="text-xs font-bold text-green-400">
                        {entry.wordlist?.length || 0} passwords
                      </span>
                    </div>
                  </div>

                  {/* PII Preview */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
                      Target: {entry.pii_data.full_name || 'Anonymous'}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-400">
                      {entry.pii_data.hometown && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{entry.pii_data.hometown}</span>
                        </div>
                      )}
                      {entry.pii_data.birth_year && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Born {entry.pii_data.birth_year}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Activity className="w-3 h-3" />
                        <span>IP: {entry.ip_address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEntry(entry);
                      }}
                      className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-medium py-2 px-3 rounded-lg transition-all flex items-center justify-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(entry.wordlist || [], entry.id);
                      }}
                      className="flex-1 bg-green-600/20 hover:bg-green-600/40 backdrop-blur-sm text-green-400 text-sm font-medium py-2 px-3 rounded-lg transition-all flex items-center justify-center space-x-1"
                    >
                      <Download className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(entry.id);
                      }}
                      className="bg-red-600/20 hover:bg-red-600/40 backdrop-blur-sm text-red-400 text-sm font-medium py-2 px-3 rounded-lg transition-all flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Hover Gradient Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/10 to-red-600/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-12">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center space-x-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        page === i + 1 
                          ? 'bg-red-600 text-white' 
                          : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto text-center py-16">
            <div className="bg-zinc-900/50 rounded-2xl p-12 backdrop-blur-sm border border-zinc-800">
              <Shield className="w-16 h-16 text-gray-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-400 mb-4">No Intelligence Scans Yet</h3>
              <p className="text-gray-500 mb-8 text-lg">
                Start your first intelligence gathering operation to see results here.
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105"
              >
                Create Your First Scan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Selected Entry */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl max-w-6xl w-full max-h-[80vh] overflow-hidden border border-zinc-800">
            <div className="p-6 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  Intelligence Scan Details
                </h2>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-gray-400 hover:text-white transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Target Intelligence
                  </h3>
                  <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                    <pre className="text-sm text-gray-300 overflow-auto">
                      {JSON.stringify(selectedEntry.pii_data, null, 2)}
                    </pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Generated Wordlist ({(selectedEntry.wordlist || []).length})
                  </h3>
                  <div className="bg-black/50 p-4 rounded-xl border border-zinc-800 max-h-80 overflow-auto">
                    <div className="space-y-1">
                      {(selectedEntry.wordlist || []).map((word, i) => (
                        <div key={i} className="text-sm text-gray-300 font-mono py-1 px-2 hover:bg-zinc-800 rounded">
                          {word}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center space-x-4 mt-8">
                <button
                  onClick={() => handleDownload(selectedEntry.wordlist || [], selectedEntry.id)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Wordlist</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;