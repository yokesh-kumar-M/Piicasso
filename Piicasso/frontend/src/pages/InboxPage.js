import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from '../api/axios';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ModeContext } from '../context/ModeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Mail, Users, ChevronRight, Search,
    AlertCircle, MessageCircle, ArrowLeft, Circle
} from 'lucide-react';
import Navbar from '../components/Navbar';

/**
 * InboxPage: Dual-purpose messaging interface.
 * - Superusers: Manage all user conversations.
 * - Regular Users: Private, focused communication with the System Admin.
 */

const InboxPage = () => {
    const { user } = useContext(AuthContext);
    const isSuperuser = user?.is_superuser;

    // State for Admin management
    const [conversations, setConversations] = useState([]);
    const { mode: appMode } = useContext(ModeContext) || { mode: 'security' };
    const isSecurityMode = appMode === 'security';

    const theme = {
        card: isSecurityMode ? 'security-card' : 'user-glass-panel',
        accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
        accentBg: isSecurityMode ? 'bg-security-red' : 'bg-user-cobalt',
        accentBorder: isSecurityMode ? 'border-security-red/30' : 'border-user-cobalt/30',
        hoverAccent: isSecurityMode ? 'hover:bg-security-red/10' : 'hover:bg-user-cobalt/10',
        inputBg: isSecurityMode ? 'bg-black/50 border-white/10 focus-within:border-security-red/50' : 'bg-white/5 border-white/10 focus-within:border-user-cobalt/50',
        btnPrimary: isSecurityMode ? 'security-btn-primary' : 'user-btn-primary',
        btnSecondary: isSecurityMode ? 'bg-black/50 text-white border border-white/10 hover:bg-white/10' : 'bg-white/10 text-white border border-white/10 hover:bg-white/20',
        textMuted: isSecurityMode ? 'text-security-muted' : 'text-user-muted',
        border: isSecurityMode ? 'border-security-red/20' : 'border-user-cobalt/20',
        chatBubbleMe: isSecurityMode ? 'bg-security-red text-white border border-security-red/50' : 'bg-user-cobalt text-white border border-user-cobalt/50',
        chatBubbleOther: isSecurityMode ? 'bg-black/60 text-white border border-white/10' : 'bg-white/10 text-white border border-white/10',
    };

    const [allUsers, setAllUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Shared Messaging State
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [showNewConv, setShowNewConv] = useState(false);

    const messagesEndRef = useRef(null);
    const pollRef = useRef(null);
    const location = useLocation();

    // Initial Data Fetch
    useEffect(() => {
        const init = async () => {
            if (isSuperuser) {
                const users = await fetchAllUsers();
                await fetchConversations();

                // Handle deep-linking from Admin dashboard
                const params = new URLSearchParams(location.search);
                const recipientId = params.get('recipient');
                if (recipientId && users) {
                    const target = users.find(u => String(u.id) === String(recipientId));
                    if (target) selectUser(target);
                }
            } else {
                await fetchThread(null);
                pollRef.current = setInterval(() => fetchThread(null), 5000);
            }
            setLoading(false);
        };
        init();
        return () => clearInterval(pollRef.current);
    }, [isSuperuser, location.search]);

    // Admin Thread Polling
    useEffect(() => {
        if (isSuperuser && selectedUser) {
            fetchThread(selectedUser.id);
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = setInterval(() => fetchThread(selectedUser.id), 5000);
        }
        return () => clearInterval(pollRef.current);
    }, [selectedUser, isSuperuser]);

    // Auto-scroll to latest message
    useEffect(() => {
        if (messagesEndRef.current && messagesEndRef.current.parentNode) {
            messagesEndRef.current.parentNode.scrollTop = messagesEndRef.current.parentNode.scrollHeight;
        }
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const { data } = await axios.get('admin/messages/');
            setConversations(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to load conversations', e);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const { data } = await axios.get('admin/users/');
            const users = Array.isArray(data) ? data : [];
            setAllUsers(users);
            return users;
        } catch (e) {
            return [];
        }
    };

    const fetchThread = async (userId) => {
        try {
            const url = userId ? `admin/messages/?user_id=${userId}` : `admin/messages/`;
            const { data } = await axios.get(url);
            setMessages(Array.isArray(data) ? data : []);
        } catch (e) { }
    };

    const selectUser = (u) => {
        setSelectedUser(u);
        setShowNewConv(false);
        setError('');
        setSidebarOpen(false);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!content) return;
        if (isSuperuser && !selectedUser) return;

        setSending(true);
        setError('');
        try {
            await axios.post('admin/messages/', {
                recipient_id: isSuperuser ? selectedUser.id : null,
                content: content,
            });
            setNewMessage('');
            if (isSuperuser) {
                await fetchThread(selectedUser.id);
                fetchConversations();
            } else {
                fetchThread(null);
            }
        } catch (e) {
            setError(e.response?.data?.error || 'Failed to send message.');
        } finally {
            setSending(false);
        }
    };

    const filteredConversations = conversations.filter(c =>
        c.username?.toLowerCase().includes(search.toLowerCase())
    );
    const filteredAllUsers = allUsers.filter(u =>
        u.username?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading && !isSuperuser) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <div className={`${theme.textMuted} animate-pulse text-xs font-mono tracking-[0.5em] uppercase`}>Securing Connection...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent text-white">
            <Navbar />

            <div className="pt-24 pb-8 h-screen flex flex-col">
                <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full px-4 gap-4">

                    {/* ── Admin Sidebar (Conditional) ── */}
                    {isSuperuser && (
                        <>
                            {/* Mobile toggle for sidebar */}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className={`lg:hidden fixed bottom-6 left-6 z-50 ${theme.accentBg} text-white p-3 rounded-full shadow-lg transition-colors`}
                            >
                                <Mail className="w-5 h-5" />
                            </button>

                            {/* Overlay */}
                            {sidebarOpen && (
                                <div className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                            )}

                            <div className={`
                                fixed lg:relative inset-y-0 left-0 z-40
                                w-80 shrink-0 flex flex-col ${theme.card} !p-0
                                transform transition-transform duration-300 ease-in-out
                                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                            `}>
                                <div className={`p-4 border-b ${theme.border} bg-black/20`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h1 className={`font-bold flex items-center gap-2 text-sm tracking-wider uppercase ${theme.accentColor}`}>
                                            <Mail className="w-4 h-4" /> {isSecurityMode ? 'ADMIN TERMINAL' : 'MESSAGES'}
                                        </h1>
                                        <button
                                            onClick={() => { setShowNewConv(!showNewConv); setSelectedUser(null); }}
                                            className={`text-[10px] font-bold uppercase tracking-tighter transition-colors ${theme.accentColor} hover:opacity-80`}
                                        >
                                            + New
                                        </button>
                                    </div>
                                    <div className={`flex items-center ${theme.inputBg} rounded-lg px-3 py-2 gap-2 transition-all border`}>
                                        <Search className={`w-3.5 h-3.5 ${theme.textMuted} shrink-0`} />
                                        <input
                                            type="text"
                                            placeholder="Search directory..."
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            className={`bg-transparent text-xs outline-none w-full placeholder-white/40`}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                    {showNewConv ? (
                                        <>
                                            <p className={`text-[10px] uppercase tracking-widest px-3 py-2 ${theme.textMuted}`}>Directory</p>
                                            {filteredAllUsers.map(u => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => selectUser(u)}
                                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-left group ${theme.hoverAccent}`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full ${theme.btnSecondary} flex items-center justify-center text-xs font-bold shrink-0`}>
                                                        {u.username[0].toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate text-white">{u.username}</p>
                                                        <p className={`text-[10px] uppercase font-mono tracking-tighter ${theme.textMuted}`}>{u.is_active ? 'Active' : 'Offline'}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </>
                                    ) : filteredConversations.length === 0 ? (
                                        <div className={`text-center py-16 px-4 flex flex-col items-center gap-4 ${theme.textMuted} opacity-50`}>
                                            <MessageCircle className="w-8 h-8" />
                                            <p className="text-xs uppercase tracking-widest">No Active Traffic</p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className={`text-[10px] uppercase tracking-widest px-3 py-2 ${theme.textMuted}`}>Active Channels</p>
                                            {filteredConversations.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => selectUser(c)}
                                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-left relative overflow-hidden group 
                                                        ${selectedUser?.id === c.id ? `bg-white/10 border ${theme.border}` : `border border-transparent ${theme.hoverAccent}`}`}
                                                >
                                                    <div className={`w-9 h-9 rounded-full ${theme.btnSecondary} flex items-center justify-center text-xs font-bold shrink-0 relative z-10`}>
                                                        {c.username[0].toUpperCase()}
                                                        {c.unread > 0 && (
                                                            <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${theme.accentBg} border-2 border-black animate-pulse`} />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1 relative z-10">
                                                        <p className={`text-sm font-medium truncate ${c.unread > 0 ? 'text-white' : 'text-white/70'}`}>{c.username}</p>
                                                        <p className={`text-[10px] truncate font-mono uppercase tracking-tighter ${theme.textMuted}`}>Secure Link</p>
                                                    </div>
                                                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${selectedUser?.id === c.id ? `${theme.accentColor} translate-x-1` : theme.textMuted}`} />
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── Main Chat Area ── */}
                    <div className={`flex-1 flex flex-col ${theme.card} !p-0 overflow-hidden relative`}>
                        {isSuperuser && !selectedUser ? (
                            <div className={`flex-1 flex items-center justify-center flex-col gap-6 ${theme.textMuted} opacity-30`}>
                                <Mail className="w-20 h-20" />
                                <div className="text-center space-y-1">
                                    <p className="text-xs font-mono uppercase tracking-[0.4em]">Standby Status</p>
                                    <p className="text-[10px] uppercase font-mono">Select endpoint to initiate handshake</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div className={`flex items-center justify-between px-6 py-4 border-b ${theme.border} bg-black/20`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full ${theme.btnSecondary} flex items-center justify-center font-bold text-sm shadow-inner`}>
                                            {isSuperuser ? selectedUser.username[0].toUpperCase() : 'A'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-wide text-white">
                                                {isSuperuser ? selectedUser.username : 'SYSTEM ADMINISTRATOR'}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                                <p className={`text-[10px] uppercase tracking-widest font-mono ${theme.textMuted}`}>Connected</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 bg-white/5 border ${theme.border} rounded-full text-[10px] font-mono tracking-widest uppercase ${theme.accentColor}`}>
                                        E2E Encrypted
                                    </div>
                                </div>

                                {/* Chat Messages */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
                                    {messages.length === 0 ? (
                                        <div className={`h-full flex flex-col items-center justify-center gap-6 ${theme.textMuted} opacity-50`}>
                                            <MessageCircle className="w-16 h-16" />
                                            <p className="text-xs font-mono uppercase tracking-[0.4em] text-center">Secure link established.<br />Encryption: AES-256</p>
                                        </div>
                                    ) : (
                                        messages.map((msg, idx) => (
                                            <motion.div
                                                key={msg.id || idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex ${msg.is_me ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[85%] sm:max-w-[75%]`}>
                                                    <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-lg ${msg.is_me ? `${theme.chatBubbleMe} rounded-br-sm` : `${theme.chatBubbleOther} rounded-bl-sm`}`}>
                                                        {msg.content}
                                                        <div className={`text-[9px] mt-2 opacity-60 font-mono uppercase tracking-widest ${msg.is_me ? 'text-right' : 'text-left'}`}>
                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Chat Input */}
                                <form onSubmit={handleSend} className={`px-4 sm:px-6 py-4 border-t ${theme.border} bg-black/20 flex flex-col gap-3`}>
                                    {error && (
                                        <div className="text-red-500 text-[10px] font-mono flex items-center gap-2 uppercase animate-pulse">
                                            <AlertCircle className="w-3.5 h-3.5" /> Link Error: {error}
                                        </div>
                                    )}
                                    <div className="flex gap-3 items-center">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            placeholder={isSuperuser ? `Send reply to ${selectedUser.username}...` : "Compose secure message..."}
                                            className={`flex-1 ${theme.inputBg} border rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder-white/40 shadow-inner`}
                                        />
                                        <button
                                            type="submit"
                                            disabled={sending || !newMessage.trim()}
                                            className={`${theme.btnPrimary} !p-0 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50`}
                                        >
                                            <Send className={`w-5 h-5 ${sending ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>
                                    {isSecurityMode && (
                                        <div className={`text-[9px] uppercase tracking-[0.2em] font-mono text-center ${theme.textMuted}`}>
                                            Secure Comm Protocol // Channel Encypted
                                        </div>
                                    )}
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InboxPage;
