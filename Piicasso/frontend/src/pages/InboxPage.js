import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Mail, Users, ChevronRight, Search,
    AlertCircle, MessageCircle, ArrowLeft, Circle
} from 'lucide-react';
import Navbar from '../components/Navbar';

// ─────────────────────────────────────────────────────────────
// Admin Inbox: The /inbox route is ONLY accessible to superusers.
// Normal users are redirected by the SuperuserRoute in App.js.
// ─────────────────────────────────────────────────────────────

const AdminInboxPage = () => {
    const { user } = useContext(AuthContext);
    // List of users who have messaged admin (or all users for new conversation)
    const [conversations, setConversations] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [showNewConv, setShowNewConv] = useState(false);
    const messagesEndRef = useRef(null);
    const pollRef = useRef(null);

    useEffect(() => {
        fetchConversations();
        fetchAllUsers();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchThread(selectedUser.id);
            pollRef.current = setInterval(() => fetchThread(selectedUser.id), 5000);
        }
        return () => clearInterval(pollRef.current);
    }, [selectedUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const { data } = await axios.get('admin/messages/');
            setConversations(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to load conversations', e);
        } finally {
            setLoading(false);
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
            const { data } = await axios.get(`admin/messages/?user_id=${userId}`);
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
        if (!newMessage.trim() || !selectedUser) return;
        setSending(true);
        setError('');
        try {
            await axios.post('admin/messages/', {
                recipient_id: selectedUser.id,
                content: newMessage.trim(),
            });
            setNewMessage('');
            await fetchThread(selectedUser.id);
            await fetchConversations();
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

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <Navbar />

            <div className="pt-20 h-screen flex flex-col">
                <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full px-4 pb-4 gap-4">

                    {/* ── Left Sidebar ── */}
                    <div className="w-72 shrink-0 flex flex-col bg-[#141414] border border-zinc-800 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-zinc-800">
                            <div className="flex items-center justify-between mb-3">
                                <h1 className="font-bold flex items-center gap-2 text-sm">
                                    <Mail className="w-4 h-4 text-red-600" /> Admin Inbox
                                </h1>
                                <button
                                    onClick={() => { setShowNewConv(!showNewConv); setSelectedUser(null); }}
                                    className="text-xs text-red-500 hover:text-red-400 font-bold"
                                    title="New message"
                                >
                                    + New
                                </button>
                            </div>
                            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded px-2 gap-2">
                                <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="bg-transparent text-xs py-2 outline-none w-full placeholder-zinc-600"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {showNewConv ? (
                                <div className="p-2">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest px-2 py-1">All Users</p>
                                    {filteredAllUsers.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => selectUser(u)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded hover:bg-zinc-800 transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold shrink-0">
                                                {u.username[0].toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{u.username}</p>
                                                <p className="text-[10px] text-zinc-500">{u.is_active ? 'Active' : 'Blocked'}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : loading ? (
                                <div className="text-center text-zinc-600 text-xs py-8 animate-pulse">Loading...</div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="text-center py-10 px-4">
                                    <MessageCircle className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                                    <p className="text-xs text-zinc-600">No conversations yet.</p>
                                    <button
                                        onClick={() => setShowNewConv(true)}
                                        className="text-xs text-red-500 mt-2 hover:underline"
                                    >
                                        Start a new message
                                    </button>
                                </div>
                            ) : (
                                <div className="p-2">
                                    {filteredConversations.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => selectUser(c)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-colors text-left ${selectedUser?.id === c.id ? 'bg-zinc-800' : 'hover:bg-zinc-900'}`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold shrink-0 relative">
                                                {c.username[0].toUpperCase()}
                                                {c.unread > 0 && (
                                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-600 rounded-full" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium truncate">{c.username}</p>
                                                {c.unread > 0 && (
                                                    <span className="text-[10px] text-red-400">{c.unread} unread</span>
                                                )}
                                            </div>
                                            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right: Conversation ── */}
                    <div className="flex-1 flex flex-col bg-[#141414] border border-zinc-800 rounded-xl overflow-hidden">
                        {!selectedUser ? (
                            <div className="flex-1 flex items-center justify-center flex-col gap-3 text-zinc-600">
                                <Mail className="w-12 h-12 text-zinc-800" />
                                <p className="text-sm">Select a user to view or start a conversation</p>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-800 bg-black/30">
                                    <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-sm">
                                        {selectedUser.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{selectedUser.username}</p>
                                        <p className="text-[10px] text-zinc-500">Direct message from Admin</p>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {messages.length === 0 ? (
                                        <div className="text-center text-zinc-600 text-sm py-10">
                                            No messages yet. Send the first message below.
                                        </div>
                                    ) : (
                                        messages.map(msg => (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex ${msg.is_me ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.is_me
                                                        ? 'bg-red-700 text-white rounded-br-sm'
                                                        : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                                                    }`}>
                                                    {msg.content}
                                                    <div className="text-[9px] opacity-50 mt-1 text-right">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <form onSubmit={handleSend} className="px-4 py-3 border-t border-zinc-800 flex gap-2">
                                    {error && (
                                        <div className="text-red-400 text-xs flex items-center gap-1 absolute bottom-16 left-4">
                                            <AlertCircle className="w-3 h-3" /> {error}
                                        </div>
                                    )}
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder={`Message ${selectedUser.username}...`}
                                        className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-red-600 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !newMessage.trim()}
                                        className="bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl transition-colors"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminInboxPage;
