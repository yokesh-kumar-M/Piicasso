import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';
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

    const downloadWordlist = (id) => {
        const token = localStorage.getItem('access_token');
        const url = `${getApiBase()}/file/wordlist/${id}/?token=${encodeURIComponent(token)}`;
        window.open(url, '_blank');
    };

    const downloadPDF = (id) => {
        const token = localStorage.getItem('access_token');
        const url = `${getApiBase()}/file/report/${id}/?token=${encodeURIComponent(token)}`;
        window.open(url, '_blank');
    };

    const filtered = items.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const name = (item.pii_data?.full_name || item.pii_data?.username || '').toLowerCase();
        return name.includes(term) || String(item.id).includes(term);
    });

    return (
        <div className="bg-[#0a0a0a] min-h-screen text-white">
            <Navbar />
            <div className="pt-24 px-4 md:px-12 pb-20 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-zinc-800 pb-6 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-wide mb-1 flex items-center gap-3">
                            <Bookmark className="w-6 h-6 text-red-600" />
                            Saved <span className="text-zinc-500 font-normal">Items</span>
                        </h1>
                        <p className="text-xs text-zinc-500">
                            Your bookmarked generation records — save items from the History page
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <div className="bg-zinc-900 flex items-center px-3 py-2 rounded border border-zinc-800 focus-within:border-red-600 transition-colors">
                            <Search className="w-4 h-4 text-zinc-500 mr-2 shrink-0" />
                            <input
                                type="text"
                                placeholder="Search saved..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm text-white w-36 placeholder-zinc-600"
                            />
                        </div>
                        <button
                            onClick={fetchItems}
                            className="bg-zinc-900 border border-zinc-800 p-2 rounded hover:bg-zinc-800 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-4 h-4 text-zinc-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center text-zinc-500 mt-24 text-sm animate-pulse">Loading saved items...</div>
                ) : savedIds.length === 0 ? (
                    <div className="text-center mt-24">
                        <Bookmark className="w-14 h-14 text-zinc-800 mx-auto mb-5" />
                        <h2 className="text-xl font-bold text-zinc-400 mb-2">No saved items yet</h2>
                        <p className="text-zinc-600 text-sm max-w-md mx-auto mb-6">
                            Go to the <strong className="text-zinc-400">History</strong> page and click the bookmark icon on any record to save it here for quick access.
                        </p>
                        <a href="/dashboard" className="inline-block bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2.5 px-6 rounded transition-colors">
                            Go to History
                        </a>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center text-zinc-500 mt-24 text-sm">
                        No saved items match "<span className="text-white">{searchTerm}</span>"
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filtered.map(item => {
                            const name = item.pii_data?.full_name || item.pii_data?.username || 'Unnamed Target';
                            const wordCount = item.wordlist_count || (item.wordlist ? item.wordlist.length : 0);
                            return (
                                <div
                                    key={item.id}
                                    className="bg-[#141414] border border-zinc-800 rounded-lg group hover:border-yellow-600/40 transition-all duration-200 overflow-hidden"
                                >
                                    <div className="h-24 bg-gradient-to-br from-zinc-900 to-black p-4 relative flex items-end">
                                        <FileText className="absolute top-4 right-4 w-10 h-10 text-zinc-800 group-hover:text-zinc-700 transition-colors" />
                                        <div>
                                            <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">Record #{item.id}</span>
                                        </div>
                                        {/* Unsave button */}
                                        <button
                                            onClick={() => handleUnsave(item.id)}
                                            className="absolute top-3 left-3 text-yellow-500 hover:text-yellow-400 transition-colors"
                                            title="Remove from saved"
                                        >
                                            <BookmarkCheck className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="p-4">
                                        <h3 className="font-bold text-base mb-1 truncate text-white" title={name}>{name}</h3>
                                        <p className="text-[11px] text-zinc-500 mb-2">{new Date(item.timestamp).toLocaleString()}</p>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
                                                {wordCount} passwords
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => downloadWordlist(item.id)}
                                                className="flex-1 flex items-center justify-center gap-1.5 bg-white text-black text-xs font-bold py-2 rounded hover:bg-zinc-200 transition-colors"
                                            >
                                                <Download className="w-3 h-3" /> Wordlist
                                            </button>
                                            <button
                                                onClick={() => downloadPDF(item.id)}
                                                className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 text-white text-xs font-bold py-2 rounded hover:bg-zinc-700 transition-colors"
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
