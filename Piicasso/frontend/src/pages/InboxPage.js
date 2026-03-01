import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext';
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
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

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

    // Initial Data Fetch
    useEffect(() => {
        const init = async () => {
            if (isSuperuser) {
                await fetchConversations();
                await fetchAllUsers();
            } else {
                // Regular users fetch their own thread immediately
                await fetchThread(null);
                // Continuous polling for new system messages
                pollRef.current = setInterval(() => fetchThread(null), 5000);
            }
            setLoading(false);
        };
        init();
        return () => clearInterval(pollRef.current);
    }, [isSuperuser]);

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
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
            setAllUsers(Array.isArray(data) ? data : []);
        } catch (e) { }
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
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-zinc-600 animate-pulse text-xs font-mono tracking-[0.5em] uppercase">Securing Connection...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-red-600">
            <Navbar />

            <div className="pt-20 h-screen flex flex-col">
                <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full px-4 pb-4 gap-4">

                    {/* ── Admin Sidebar (Conditional) ── */}
                    {isSuperuser && (
                        <div className="w-72 shrink-0 flex flex-col bg-[#141414] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                            <div className="p-4 border-b border-zinc-800 bg-black/40">
                                <div className="flex items-center justify-between mb-4">
                                    <h1 className="font-bold flex items-center gap-2 text-sm text-zinc-100 italic tracking-wider">
                                        <Mail className="w-4 h-4 text-red-600" /> ADMIN TERMINAL
                                    </h1>
                                    <button
                                        onClick={() => { setShowNewConv(!showNewConv); setSelectedUser(null); }}
                                        className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase tracking-tighter transition-colors"
                                    >
                                        + New Connection
                                    </button>
                                </div>
                                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-3 gap-2 focus-within:border-zinc-600 transition-all">
                                    <Search className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Scan database..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="bg-transparent text-xs py-2 outline-none w-full placeholder-zinc-700"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {showNewConv ? (
                                    <div className="p-2 space-y-1">
                                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest px-3 py-2">Available Nodes</p>
                                        {filteredAllUsers.map(u => (
                                            <button
                                                key={u.id}
                                                onClick={() => selectUser(u)}
                                                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-zinc-800 transition-all text-left group"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold shrink-0 group-hover:border-red-500">
                                                    {u.username[0].toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate text-zinc-100">{u.username}</p>
                                                    <p className="text-[9px] text-zinc-600 uppercase font-mono tracking-tighter">{u.is_active ? 'Active' : 'Restricted'}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : filteredConversations.length === 0 ? (
                                    <div className="text-center py-16 px-4 flex flex-col items-center gap-4 opacity-30">
                                        <MessageCircle className="w-8 h-8" />
                                        <p className="text-xs uppercase tracking-widest">No Active Traffic</p>
                                    </div>
                                ) : (
                                    <div className="p-2 space-y-1">
                                        {filteredConversations.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => selectUser(c)}
                                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-left relative overflow-hidden group ${selectedUser?.id === c.id ? 'bg-zinc-800/80 border border-zinc-700' : 'hover:bg-zinc-900 border border-transparent'}`}
                                            >
                                                <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[10px] font-bold shrink-0 relative z-10">
                                                    {c.username[0].toUpperCase()}
                                                    {c.unread > 0 && (
                                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-[#141414] animate-pulse" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1 relative z-10">
                                                    <p className={`text-sm font-medium truncate ${c.unread > 0 ? 'text-white' : 'text-zinc-400'}`}>{c.username}</p>
                                                    <p className="text-[9px] text-zinc-600 truncate font-mono uppercase tracking-tighter">Verified Node</p>
                                                </div>
                                                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${selectedUser?.id === c.id ? 'text-red-500 translate-x-1' : 'text-zinc-700'}`} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Main Chat Area ── */}
                    <div className="flex-1 flex flex-col bg-[#141414] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative">
                        {isSuperuser && !selectedUser ? (
                            <div className="flex-1 flex items-center justify-center flex-col gap-6 opacity-20">
                                <Mail className="w-20 h-20" />
                                <div className="text-center space-y-1">
                                    <p className="text-xs font-mono uppercase tracking-[0.4em]">Standby Status</p>
                                    <p className="text-[10px] uppercase font-mono">Select endpoint to initiate handshake</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-black/40 backdrop-blur-md">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center font-bold text-sm text-red-600 shadow-inner">
                                            {isSuperuser ? selectedUser.username[0].toUpperCase() : 'A'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-wide text-white">
                                                {isSuperuser ? selectedUser.username : 'SYSTEM ADMINISTRATOR'}
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                                                <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-mono">Direct Channel Active</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-zinc-900/50 border border-zinc-800 rounded-full text-[9px] text-zinc-500 font-mono tracking-widest uppercase">
                                        Encrypted Link
                                    </div>
                                </div>

                                {/* Chat Messages */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                                    {messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30 gap-6">
                                            <MessageCircle className="w-16 h-16 text-zinc-800" />
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
                                                <div className={`max-w-[80%] md:max-w-[70%]`}>
                                                    <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-lg ${msg.is_me
                                                        ? 'bg-red-700 text-white rounded-br-sm border border-red-800'
                                                        : 'bg-[#222] text-zinc-200 rounded-bl-sm border border-zinc-700'
                                                        }`}>
                                                        {msg.content}
                                                        <div className={`text-[8px] mt-2 opacity-50 font-mono uppercase tracking-widest ${msg.is_me ? 'text-right' : 'text-left'}`}>
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
                                <form onSubmit={handleSend} className="px-6 py-5 border-t border-zinc-900 bg-black/20 flex flex-col gap-4">
                                    {error && (
                                        <div className="text-red-600 text-[10px] font-mono flex items-center gap-2 px-2 uppercase animate-pulse">
                                            <AlertCircle className="w-3.5 h-3.5" /> Link Error: {error}
                                        </div>
                                    )}
                                    <div className="flex gap-3 items-center">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            placeholder={isSuperuser ? `Send reply to ${selectedUser.username}...` : "Compose message to admin..."}
                                            className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-red-600 rounded-2xl px-5 py-3.5 text-sm outline-none transition-all shadow-inner placeholder-zinc-700"
                                        />
                                        <button
                                            type="submit"
                                            disabled={sending || !newMessage.trim()}
                                            className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:opacity-30 w-12 h-12 rounded-2xl transition-all shadow-lg flex items-center justify-center shrink-0"
                                        >
                                            <Send className={`w-5 h-5 ${sending ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>
                                    <div className="text-[9px] text-zinc-700 uppercase tracking-[0.2em] font-mono text-center">
                                        Communication Terminal v4.2 // PIIcasso Core
                                    </div>
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
