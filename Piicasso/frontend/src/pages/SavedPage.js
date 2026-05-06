import React, { useState, useEffect, useCallback } from 'react';
import DesignAppShell from '../components/design/dashboard/DesignAppShell';
import axiosInstance from '../api/axios';
import { ModeContext } from '../context/ModeContext';
import { useContext } from 'react';
import { Bookmark, BookmarkCheck, Download, FileDown, Search, FileText, RefreshCw } from 'lucide-react';

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
        return (process.env.REACT_APP_API_URL || '/api/').replace(/\/$/, '');
    };

    const downloadWithSignedToken = async (fileType, id) => {
        try {
            // Request a short-lived signed download token
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
        <DesignAppShell activeKey="wordlists">
            {/* Header */}
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 32,
                paddingBottom: 16,
                borderBottom: '1px solid var(--ink-4)',
                gap: 16
            }}>
                <div>
                    <h1 style={{
                        fontSize: 28,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        marginBottom: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        color: 'var(--fg-0)'
                    }}>
                        <Bookmark style={{ width: 24, height: 24, color: 'var(--accent-500)' }} />
                        Saved
                        <span style={{
                            color: 'var(--fg-3)',
                            fontWeight: 400,
                            fontSize: 16,
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase'
                        }}>
                            Items
                        </span>
                    </h1>
                    <p style={{
                        fontSize: 12,
                        color: 'var(--fg-2)',
                        maxWidth: 500
                    }}>
                        Your bookmarked generation records — save items from the History page
                        <span style={{ color: 'var(--accent-500)', marginLeft: 4 }}>
                            (stored locally in this browser only)
                        </span>
                    </p>
                </div>

                {/* Search & Refresh */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 8,
                        paddingBottom: 8,
                        borderRadius: 6,
                        border: '1px solid var(--ink-4)',
                        transition: 'border-color 0.2s',
                        backgroundColor: 'var(--ink-3)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--ink-5)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--ink-4)';
                    }}>
                        <Search style={{
                            width: 16,
                            height: 16,
                            marginRight: 8,
                            flexShrink: 0,
                            color: 'var(--fg-3)'
                        }} />
                        <input
                            type="text"
                            placeholder="Search saved..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                fontSize: 13,
                                width: 160,
                                color: 'var(--fg-0)',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>
                    <button
                        onClick={fetchItems}
                        style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid var(--ink-4)',
                            backgroundColor: 'var(--ink-1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--ink-3)';
                            e.currentTarget.style.borderColor = 'var(--ink-5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--ink-1)';
                            e.currentTarget.style.borderColor = 'var(--ink-4)';
                        }}
                        title="Refresh"
                    >
                        <RefreshCw style={{
                            width: 16,
                            height: 16,
                            color: 'var(--fg-2)'
                        }} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div style={{
                    textAlign: 'center',
                    marginTop: 96,
                    fontSize: 13,
                    color: 'var(--fg-2)',
                    animation: 'pulse 2s infinite'
                }}>
                    Loading saved items...
                </div>
            ) : savedIds.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: 96 }}>
                    <Bookmark style={{
                        width: 56,
                        height: 56,
                        margin: '0 auto 20px',
                        color: 'var(--ink-3)'
                    }} />
                    <h2 style={{
                        fontSize: 18,
                        fontWeight: 700,
                        marginBottom: 8,
                        color: 'var(--fg-2)'
                    }}>
                        No saved items yet
                    </h2>
                    <p style={{
                        fontSize: 13,
                        maxWidth: 400,
                        margin: '0 auto 24px',
                        color: 'var(--fg-2)'
                    }}>
                        Go to the <strong style={{ color: 'var(--fg-0)' }}>History</strong> page and click the bookmark icon on any record to save it here for quick access.
                    </p>
                    <a
                        href="/dashboard"
                        style={{
                            display: 'inline-block',
                            fontSize: 13,
                            fontWeight: 700,
                            padding: '12px 24px',
                            borderRadius: 6,
                            backgroundColor: 'var(--accent-500)',
                            color: '#fff',
                            textDecoration: 'none',
                            transition: 'opacity 0.2s',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        Go to History
                    </a>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    marginTop: 96,
                    fontSize: 13,
                    color: 'var(--fg-2)'
                }}>
                    No saved items match "<span style={{
                        color: 'var(--fg-0)',
                        fontWeight: 700
                    }}>
                        {searchTerm}
                    </span>"
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 16
                }}>
                    {filtered.map(item => {
                        const name = item.pii_data?.full_name || item.pii_data?.username || 'Unnamed Target';
                        const wordCount = item.wordlist_count || (item.wordlist ? item.wordlist.length : 0);
                        return (
                            <div
                                key={item.id}
                                style={{
                                    backgroundColor: 'var(--ink-1)',
                                    border: '1px solid var(--ink-4)',
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--ink-5)';
                                    e.currentTarget.style.backgroundColor = 'var(--ink-3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--ink-4)';
                                    e.currentTarget.style.backgroundColor = 'var(--ink-1)';
                                }}
                            >
                                {/* Card Header */}
                                <div style={{
                                    height: 96,
                                    padding: 16,
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    position: 'relative',
                                    backgroundColor: 'var(--ink-3)',
                                    borderBottom: '1px solid var(--ink-4)',
                                    background: 'linear-gradient(135deg, var(--ink-3), var(--ink-1))'
                                }}>
                                    <FileText style={{
                                        position: 'absolute',
                                        top: 16,
                                        right: 16,
                                        width: 40,
                                        height: 40,
                                        color: 'var(--ink-4)',
                                        opacity: 0.5,
                                        transition: 'opacity 0.2s'
                                    }} />

                                    {/* Unsave button */}
                                    <button
                                        onClick={() => handleUnsave(item.id)}
                                        style={{
                                            position: 'absolute',
                                            top: 12,
                                            left: 12,
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--accent-500)',
                                            transition: 'color 0.2s',
                                            zIndex: 20,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-glow)'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent-500)'}
                                        title="Remove from saved"
                                    >
                                        <BookmarkCheck style={{ width: 20, height: 20 }} />
                                    </button>

                                    <div style={{ position: 'relative', zIndex: 10 }}>
                                        <span style={{
                                            fontSize: 9,
                                            fontFamily: 'var(--font-mono)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            color: 'var(--fg-3)',
                                            fontWeight: 700
                                        }}>
                                            Record #{item.id}
                                        </span>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div style={{
                                    padding: 16,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    flex: 1
                                }}>
                                    <h3 style={{
                                        fontWeight: 700,
                                        fontSize: 14,
                                        marginBottom: 4,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        color: 'var(--fg-0)'
                                    }} title={name}>
                                        {name}
                                    </h3>
                                    <p style={{
                                        fontSize: 11,
                                        marginBottom: 12,
                                        color: 'var(--fg-3)',
                                        fontFamily: 'var(--font-mono)'
                                    }}>
                                        {new Date(item.timestamp).toLocaleString()}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                        <span style={{
                                            fontSize: 10,
                                            paddingLeft: 8,
                                            paddingRight: 8,
                                            paddingTop: 4,
                                            paddingBottom: 4,
                                            borderRadius: 4,
                                            fontFamily: 'var(--font-mono)',
                                            border: '1px solid var(--ink-4)',
                                            backgroundColor: 'var(--ink-1)',
                                            color: 'var(--fg-3)'
                                        }}>
                                            {wordCount} passwords
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                                        <button
                                            onClick={() => downloadWordlist(item.id)}
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 6,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                paddingTop: 8,
                                                paddingBottom: 8,
                                                borderRadius: 6,
                                                border: 'none',
                                                backgroundColor: 'var(--accent-500)',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                transition: 'opacity 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                        >
                                            <Download style={{ width: 12, height: 12 }} />
                                            Wordlist
                                        </button>
                                        <button
                                            onClick={() => downloadPDF(item.id)}
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 6,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                paddingTop: 8,
                                                paddingBottom: 8,
                                                borderRadius: 6,
                                                border: '1px solid var(--ink-4)',
                                                backgroundColor: 'var(--ink-1)',
                                                color: 'var(--fg-0)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--ink-3)';
                                                e.currentTarget.style.borderColor = 'var(--ink-5)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--ink-1)';
                                                e.currentTarget.style.borderColor = 'var(--ink-4)';
                                            }}
                                        >
                                            <FileDown style={{ width: 12, height: 12 }} />
                                            Report
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </DesignAppShell>
    );
};

// Export both the component and the utility function for other pages
export { getSavedIds, toggleSaved };
export default SavedPage;
