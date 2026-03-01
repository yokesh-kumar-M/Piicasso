import React, { useState, useEffect, useRef, useContext } from 'react';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Shield, UserPlus, Terminal,
    Zap, Lock, Activity, RefreshCw,
    MessageCircle, Send, ChevronRight
} from 'lucide-react';

const TeamsPage = () => {
    const { user } = useContext(AuthContext);
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('view'); // 'view', 'create', 'join'
    const [activeTab, setActiveTab] = useState('activity'); // 'activity' | 'chat'
    const [formData, setFormData] = useState({ name: '', code: '' });
    const [error, setError] = useState('');

    // Chat state
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);
    const [chatError, setChatError] = useState('');
    const chatEndRef = useRef(null);
    const pollRef = useRef(null);
    const lastIdRef = useRef(0);

    useEffect(() => {
        fetchTeamInfo();
    }, []);

    // Poll chat when on chat tab and in a team
    useEffect(() => {
        if (team && activeTab === 'chat') {
            fetchMessages(true);
            pollRef.current = setInterval(() => fetchMessages(false), 4000);
        }
        return () => clearInterval(pollRef.current);
    }, [team, activeTab]);

    useEffect(() => {
        if (activeTab === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeTab]);

    const fetchTeamInfo = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get('teams/');
            if (res.data.active) {
                setTeam(res.data);
                setMode('view');
            } else {
                setTeam(null);
            }
        } catch (err) {
            console.error('Team fetch error', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (reset = false) => {
        try {
            const after = reset ? 0 : lastIdRef.current;
            const { data } = await axiosInstance.get(`teams/chat/?after=${after}`);
            if (Array.isArray(data) && data.length > 0) {
                if (reset) {
                    setMessages(data);
                } else {
                    setMessages(prev => [...prev, ...data]);
                }
                lastIdRef.current = data[data.length - 1].id;
            }
        } catch (e) {
            console.error('Chat fetch error', e);
        }
    };

    const handleCreate = async () => {
        if (!formData.name.trim()) { setError('Team name is required.'); return; }
        try {
            setError('');
            await axiosInstance.post('teams/create/', { name: formData.name });
            fetchTeamInfo();
        } catch (err) {
            setError(err.response?.data?.error || 'Team creation failed.');
        }
    };

    const handleJoin = async () => {
        if (!formData.code.trim()) { setError('Invite code is required.'); return; }
        try {
            setError('');
            await axiosInstance.post('teams/join/', { invite_code: formData.code });
            fetchTeamInfo();
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid invite code.');
        }
    };

    const handleLeave = async () => {
        if (!window.confirm('Are you sure you want to leave this team?')) return;
        try {
            await axiosInstance.post('teams/leave/');
            setTeam(null);
            setMode('view');
            setMessages([]);
            lastIdRef.current = 0;
        } catch (err) {
            alert(err.response?.data?.error || 'Could not leave team.');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        setSendingMsg(true);
        setChatError('');
        try {
            const { data } = await axiosInstance.post('teams/chat/', { content: chatInput.trim() });
            setMessages(prev => [...prev, data]);
            lastIdRef.current = data.id;
            setChatInput('');
        } catch (err) {
            setChatError(err.response?.data?.error || 'Failed to send message.');
        } finally {
            setSendingMsg(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-black min-h-screen text-white flex items-center justify-center gap-4">
                <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
                <span className="text-zinc-500 text-sm">Loading...</span>
            </div>
        );
    }

    return (
        <div className="bg-[#0a0a0a] min-h-screen text-white">
            <Navbar />

            <div className="pt-24 px-4 md:px-12 max-w-7xl mx-auto pb-20">
                <div className="flex justify-between items-end mb-8 border-b border-zinc-900 pb-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-wide mb-1 flex items-center gap-3">
                            <Users className="w-6 h-6 text-red-600" />
                            Teams
                        </h1>
                        <p className="text-xs text-zinc-500">Collaborate and share wordlists with your team</p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {!team ? (
                        /* ── No Team State ── */
                        <motion.div
                            key="no-team"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#141414] border border-zinc-800 rounded-lg p-10 text-center max-w-xl mx-auto mt-12"
                        >
                            <Users className="w-14 h-14 text-zinc-700 mx-auto mb-5" />
                            <h2 className="text-xl font-bold mb-3">You're not in a team yet</h2>
                            <p className="text-zinc-500 mb-8 text-sm">Create a new team or join one with an invite code.</p>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button
                                    onClick={() => { setMode('create'); setError(''); }}
                                    className={`py-3 px-4 rounded text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'create' ? 'bg-white text-black' : 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800'}`}
                                >
                                    <Shield className="w-4 h-4" /> Create Team
                                </button>
                                <button
                                    onClick={() => { setMode('join'); setError(''); }}
                                    className={`py-3 px-4 rounded text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'join' ? 'bg-white text-black' : 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800'}`}
                                >
                                    <UserPlus className="w-4 h-4" /> Join Team
                                </button>
                            </div>

                            {(mode === 'create' || mode === 'join') && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="pt-6 border-t border-zinc-800 space-y-3"
                                >
                                    {mode === 'create' ? (
                                        <>
                                            <input
                                                type="text"
                                                placeholder="Team name"
                                                className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-600 p-3 rounded text-sm outline-none transition-colors"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                            />
                                            <button onClick={handleCreate} className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded font-bold text-sm transition-colors">
                                                Create Team
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <input
                                                type="text"
                                                placeholder="Paste invite code"
                                                className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-600 p-3 rounded text-sm outline-none transition-colors font-mono tracking-wider"
                                                value={formData.code}
                                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                                            />
                                            <button onClick={handleJoin} className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded font-bold text-sm transition-colors">
                                                Join Team
                                            </button>
                                        </>
                                    )}
                                    {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                                </motion.div>
                            )}
                        </motion.div>
                    ) : (
                        /* ── Active Team (two-column layout) ── */
                        <motion.div
                            key="team-active"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-12 gap-6"
                        >
                            {/* ── Left: Team Info ── */}
                            <div className="col-span-12 lg:col-span-4 space-y-5">
                                <div className="bg-[#141414] border border-zinc-800 rounded-lg p-6">
                                    <p className="text-zinc-500 text-xs mb-1">Current Team</p>
                                    <h2 className="text-2xl font-bold mb-5">{team.name}</h2>

                                    <div className="bg-black/50 p-4 rounded border border-zinc-900 mb-5">
                                        <p className="text-xs text-zinc-500 mb-1">Invite Code</p>
                                        <p className="text-lg font-mono font-bold text-red-500 tracking-widest">{team.invite_code}</p>
                                        <p className="text-[10px] text-zinc-600 mt-1">Share this code to invite members</p>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Your Role</span>
                                            <span className="font-bold text-emerald-400">{team.my_role}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Members</span>
                                            <span>{(team.members || []).length}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleLeave}
                                        className="w-full mt-6 border border-red-900/40 text-red-600 py-2 rounded text-xs font-bold hover:bg-red-900/10 transition-colors"
                                    >
                                        Leave Team
                                    </button>
                                </div>

                                {/* Members list */}
                                <div className="bg-[#141414] border border-zinc-800 rounded-lg p-5">
                                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-zinc-400" /> Members
                                    </h3>
                                    <div className="space-y-3">
                                        {(team.members || []).map((member, i) => (
                                            <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-900 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${member.role === 'LEADER' ? 'bg-red-900/30 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                                        {(member.username || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold">{member.username}</div>
                                                        <div className="text-[9px] text-zinc-600 uppercase">{member.role}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                    <span className="text-[9px] text-emerald-500">Active</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ── Right: Activity / Chat tabs ── */}
                            <div className="col-span-12 lg:col-span-8">
                                <div className="bg-[#141414] border border-zinc-800 rounded-lg flex flex-col min-h-[560px]">
                                    {/* Tab bar */}
                                    <div className="flex border-b border-zinc-800">
                                        <button
                                            onClick={() => setActiveTab('activity')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-colors ${activeTab === 'activity' ? 'text-white border-b-2 border-red-600' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        >
                                            <Activity className="w-4 h-4" /> Activity
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('chat')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-colors ${activeTab === 'chat' ? 'text-white border-b-2 border-red-600' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        >
                                            <MessageCircle className="w-4 h-4" /> Team Chat
                                        </button>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {/* ── Activity Tab ── */}
                                        {activeTab === 'activity' && (
                                            <motion.div
                                                key="activity"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[600px]"
                                            >
                                                {(team.feed || []).length === 0 ? (
                                                    <div className="text-center py-20 text-zinc-600 text-sm">
                                                        No team activity yet. Generate a wordlist to see it here.
                                                    </div>
                                                ) : (
                                                    (team.feed || []).map((op, i) => (
                                                        <div key={i} className="flex gap-4">
                                                            <div className="flex flex-col items-center">
                                                                <div className="w-8 h-8 rounded border border-zinc-700 flex items-center justify-center bg-black shrink-0">
                                                                    <Terminal className="w-4 h-4 text-zinc-500" />
                                                                </div>
                                                                {i < (team.feed || []).length - 1 && (
                                                                    <div className="w-px flex-1 bg-zinc-900 my-1" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 bg-zinc-900/30 p-4 rounded border border-zinc-800/50 hover:bg-zinc-900/50 transition-all mb-1">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="text-xs font-bold">
                                                                        <span className="text-red-500">{op.operator || 'A member'}</span> generated a wordlist
                                                                    </span>
                                                                    <span className="text-[10px] text-zinc-500">
                                                                        {new Date(op.timestamp).toLocaleTimeString()}
                                                                    </span>
                                                                </div>
                                                                {op.target && op.target !== 'Unknown' && (
                                                                    <p className="text-[11px] text-zinc-500 mb-2">Target: {op.target}</p>
                                                                )}
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-[10px] text-zinc-400 bg-black/40 px-2 py-0.5 rounded border border-zinc-800">
                                                                        {op.wordlist_count} passwords
                                                                    </span>
                                                                    <span className="text-[10px] text-emerald-500/70 bg-emerald-900/10 px-2 py-0.5 rounded border border-emerald-900/20">
                                                                        Complete
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </motion.div>
                                        )}

                                        {/* ── Chat Tab ── */}
                                        {activeTab === 'chat' && (
                                            <motion.div
                                                key="chat"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex flex-col flex-1"
                                                style={{ minHeight: 0 }}
                                            >
                                                {/* Messages area */}
                                                <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[460px]">
                                                    {messages.length === 0 ? (
                                                        <div className="text-center py-16 text-zinc-600 text-sm">
                                                            No messages yet. Say hello to your team! 👋
                                                        </div>
                                                    ) : (
                                                        messages.map(msg => (
                                                            <div
                                                                key={msg.id}
                                                                className={`flex ${msg.is_me ? 'justify-end' : 'justify-start'} gap-2`}
                                                            >
                                                                {!msg.is_me && (
                                                                    <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                                                                        {msg.sender.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                                <div className={`max-w-[70%] ${msg.is_me ? '' : ''}`}>
                                                                    {!msg.is_me && (
                                                                        <p className="text-[10px] text-zinc-500 mb-0.5 ml-1">{msg.sender}</p>
                                                                    )}
                                                                    <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${msg.is_me
                                                                            ? 'bg-red-700 text-white rounded-br-sm'
                                                                            : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                                                                        }`}>
                                                                        {msg.content}
                                                                        <div className="text-[9px] opacity-40 mt-0.5 text-right">
                                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                    <div ref={chatEndRef} />
                                                </div>

                                                {/* Input */}
                                                <form
                                                    onSubmit={handleSendMessage}
                                                    className="px-4 py-3 border-t border-zinc-800 flex gap-2 shrink-0"
                                                >
                                                    <input
                                                        type="text"
                                                        value={chatInput}
                                                        onChange={e => setChatInput(e.target.value)}
                                                        placeholder="Message your team..."
                                                        maxLength={2000}
                                                        className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-red-600 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={sendingMsg || !chatInput.trim()}
                                                        className="bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl transition-colors shrink-0"
                                                    >
                                                        <Send className="w-4 h-4" />
                                                    </button>
                                                </form>
                                                {chatError && (
                                                    <p className="text-red-400 text-xs px-4 pb-2">{chatError}</p>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="p-3 bg-black/30 border-t border-zinc-900 text-center">
                                        <span className="text-[10px] text-zinc-700">PIIcasso Teams</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TeamsPage;
