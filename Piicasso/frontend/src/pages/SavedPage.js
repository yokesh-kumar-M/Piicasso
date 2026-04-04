import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';
import { ModeContext } from '../context/ModeContext';
import { useContext } from 'react';
import { Bookmark, BookmarkCheck, Download, FileDown, Trash2, Search, FileText, RefreshCw } from 'lucide-react';

const SAVED_KEY = 'piicasso_saved_ids';

const getSavedIds = () => {
    try {
        return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    } catch {
        return [];
    }
};

const toggleSaved = (id) => {
    const saved = getSavedIds();
    if (saved.includes(id)) {
        const next = saved.filter(s => s !== id);
        localStorage.setItem(SAVED_KEY, JSON.stringify(next));
        return next;
    } else {
        const next = [...saved, id];
        localStorage.setItem(SAVED_KEY, JSON.stringify(next));
        return next;
    }
};

const SavedPage = () => {
    const [savedIds, setSavedIds] = useState(getSavedIds());
    const { mode } = useContext(ModeContext);
    const isSecurityMode = mode === 'security';

    const theme = {
        bg: isSecurityMode ? 'bg-security-bg text-white' : 'theme-user',
        accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
        accentBg: isSecurityMode ? 'bg-security-red' : 'bg-user-cobalt',
        card: isSecurityMode ? 'security-card group' : 'user-glass-panel group border-white/5 hover:border-user-cobalt/30 transition-all duration-300',
        inputBg: isSecurityMode ? 'bg-[#181818] border-white/10 focus-within:border-security-red' : 'bg-black/20 border-white/10 focus-within:border-user-cobalt',
        btnPrimary: isSecurityMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-user-cobalt text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]',
        btnSecondary: isSecurityMode ? 'bg-[#232323] text-white hover:bg-[#333]' : 'bg-white/10 text-white hover:bg-white/20',
        searchContainer: isSecurityMode ? 'bg-dark-surface focus-within:border-security-red' : 'bg-black/20 focus-within:border-user-cobalt',
        refreshBtn: isSecurityMode ? 'bg-dark-surface hover:bg-[#222]' : 'bg-black/20 hover:bg-black/40',
        cardHeader: isSecurityMode ? 'bg-gradient-to-br from-[#222] to-[#141414]' : 'bg-gradient-to-br from-black/40 to-black/20',
    };

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const ids = getSavedIds();
            if (ids.length === 0) {
                setItems([]);
                setLoading(false);
                return;
            }
            // Fetch all history, then filter by saved IDs
            const res = await axiosInstance.get('history/?page_size=200');
            const data = res.data;
            let all = [];
            if (Array.isArray(data)) {
                all = data;
            } else if (data?.results && Array.isArray(data.results)) {
                all = data.results;
            }
            setItems(all.filter(item => ids.includes(item.id)));
        } catch (err) {
            console.error('Failed to fetch saved items', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleUnsave = (id) => {
        const next = toggleSaved(id);
        setSavedIds(next);
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const getApiBase = () => {
        return (process.env.REACT_APP_API_URL || 'https://piicasso.onrender.com/api/').replace(/\/$/, '');
    };

    const downloadWithSignedToken = async (fileType, id) => {
        try {
            // Request a short-lived signed download token (1.2 fix)
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

    const downloadWordlist = (id) => downloadWithSignedToken('wordlist', id);
    const downloadPDF = (id) => downloadWithSignedToken('report', id);

    const filtered = items.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const name = (item.pii_data?.full_name || item.pii_data?.username || '').toLowerCase();
        return name.includes(term) || String(item.id).includes(term);
    });

    return (
        <div className={`min-h-screen flex flex-col ${theme.bg}`}>
            <Navbar />
            <div className="pt-28 px-4 md:px-12 pb-20 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6 gap-4 ${isSecurityMode ? 'border-security-border' : 'border-user-border'}`}>
                    <div>
                        <h1 className={`text-2xl md:text-3xl font-bold tracking-wide mb-1 flex items-center gap-3 ${isSecurityMode ? 'security-heading' : 'user-heading'}`}>
                            <Bookmark className={`w-6 h-6 ${theme.accentColor}`} />
                            Saved <span className={isSecurityMode ? 'text-gray-500 font-normal font-sans tracking-normal uppercase text-lg' : 'text-user-text/60 font-normal'}>Items</span>
                        </h1>
                        <p className={`text-xs ${isSecurityMode ? 'text-gray-500' : 'text-user-text/70'}`}>
                            Your bookmarked generation records — save items from the History page
                            <span className={`ml-1 ${isSecurityMode ? 'text-yellow-600' : 'text-user-cobalt/80'}`}>(stored locally in this browser only)</span>
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <div className={`flex items-center px-3 py-2 rounded border transition-colors ${theme.searchContainer}`}>
                            <Search className={`w-4 h-4 mr-2 shrink-0 ${isSecurityMode ? 'text-gray-500' : 'text-user-text/50'}`} />
                            <input
                                type="text"
                                placeholder="Search saved..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`bg-transparent border-none outline-none text-sm w-36 ${isSecurityMode ? 'text-white placeholder-gray-600' : 'text-user-text placeholder-user-text/40'}`}
                            />
                        </div>
                        <button
                            onClick={fetchItems}
                            className={`p-2 rounded transition-colors border ${theme.refreshBtn} ${isSecurityMode ? 'border-security-border' : 'border-user-border'}`}
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 ${isSecurityMode ? 'text-gray-400' : 'text-user-text/70'}`} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className={`text-center mt-24 text-sm animate-pulse ${isSecurityMode ? 'text-gray-500' : 'text-user-text/60'}`}>Loading saved items...</div>
                ) : savedIds.length === 0 ? (
                    <div className="text-center mt-24">
                        <Bookmark className={`w-14 h-14 mx-auto mb-5 ${isSecurityMode ? 'text-gray-800' : 'text-user-text/20'}`} />
                        <h2 className={`text-xl font-bold mb-2 ${isSecurityMode ? 'text-gray-400' : 'text-user-text/80'}`}>No saved items yet</h2>
                        <p className={`text-sm max-w-md mx-auto mb-6 ${isSecurityMode ? 'text-gray-600' : 'text-user-text/60'}`}>
                            Go to the <strong className={isSecurityMode ? 'text-gray-400' : 'text-user-text'}>History</strong> page and click the bookmark icon on any record to save it here for quick access.
                        </p>
                        <a href="/dashboard" className={`inline-block text-sm font-bold py-2.5 px-6 rounded transition-colors ${theme.btnPrimary}`}>
                            Go to History
                        </a>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={`text-center mt-24 text-sm ${isSecurityMode ? 'text-gray-500' : 'text-user-text/60'}`}>
                        No saved items match "<span className={isSecurityMode ? 'text-white' : 'text-user-text font-bold'}>{searchTerm}</span>"
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filtered.map(item => {
                            const name = item.pii_data?.full_name || item.pii_data?.username || 'Unnamed Target';
                            const wordCount = item.wordlist_count || (item.wordlist ? item.wordlist.length : 0);
                            return (
                                <div
                                    key={item.id}
                                    className={`${theme.card} overflow-hidden`}
                                >
                                    <div className={`h-24 p-4 relative flex items-end ${theme.cardHeader} border-b ${isSecurityMode ? 'border-security-border' : 'border-user-border'}`}>
                                        <FileText className={`absolute top-4 right-4 w-10 h-10 transition-colors ${isSecurityMode ? 'text-gray-800 group-hover:text-gray-700' : 'text-white/10 group-hover:text-white/20'}`} />
                                        <div className="relative z-10">
                                            <span className={`text-[9px] font-mono uppercase tracking-widest ${isSecurityMode ? 'text-gray-500' : 'text-user-text/60'}`}>Record #{item.id}</span>
                                        </div>
                                        {/* Unsave button */}
                                        <button
                                            onClick={() => handleUnsave(item.id)}
                                            className={`absolute top-3 left-3 transition-colors z-20 ${isSecurityMode ? 'text-yellow-500 hover:text-yellow-400' : 'text-user-cobalt hover:text-blue-400'}`}
                                            title="Remove from saved"
                                        >
                                            <BookmarkCheck className="w-5 h-5 fill-current" />
                                        </button>
                                    </div>

                                    <div className="p-4">
                                        <h3 className={`font-bold text-base mb-1 truncate ${isSecurityMode ? 'text-white' : 'text-user-text'}`} title={name}>{name}</h3>
                                        <p className={`text-[11px] mb-3 ${isSecurityMode ? 'text-gray-500' : 'text-user-text/50'}`}>{new Date(item.timestamp).toLocaleString()}</p>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${isSecurityMode ? 'bg-black border-security-border text-gray-400' : 'bg-white/5 border-user-border text-user-text/70'}`}>
                                                {wordCount} passwords
                                            </span>
                                        </div>

                                        <div className="flex gap-2 mt-auto pt-2">
                                            <button
                                                onClick={() => downloadWordlist(item.id)}
                                                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded transition-colors border ${theme.btnPrimary} ${isSecurityMode ? 'border-transparent' : 'border-transparent'}`}
                                            >
                                                <Download className="w-3 h-3" /> Wordlist
                                            </button>
                                            <button
                                                onClick={() => downloadPDF(item.id)}
                                                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded transition-colors border ${theme.btnSecondary} ${isSecurityMode ? 'border-security-border' : 'border-user-border'}`}
                                            >
                                                <FileDown className="w-3 h-3" /> Report
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// Export both the component and the utility function for other pages
export { getSavedIds, toggleSaved };
export default SavedPage;
