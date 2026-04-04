import React, { useState, useEffect, useRef, useContext } from 'react';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { ModeContext } from '../context/ModeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Shield, UserPlus, Terminal,
    Zap, Lock, Activity, RefreshCw,
    MessageCircle, Send, ChevronRight
} from 'lucide-react';

const TeamsPage = () => {
    const { user } = useContext(AuthContext);
    const [team, setTeam] = useState(null);
  const { mode: appMode } = useContext(ModeContext) || { mode: 'security' };
  const isSecurityMode = appMode === 'security';

  const theme = {
    bg: 'bg-transparent',
    accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
    accentBg: isSecurityMode ? 'bg-security-red' : 'bg-user-cobalt',
    card: isSecurityMode ? 'security-card' : 'user-glass-panel',
    inputBg: isSecurityMode ? 'bg-black border border-security-border focus:border-security-red text-white' : 'bg-white/5 border border-user-border focus:border-user-cobalt text-white backdrop-blur-md',
    btnPrimary: isSecurityMode ? 'security-btn-primary' : 'user-btn-primary',
    btnSecondary: isSecurityMode ? 'bg-security-surface text-gray-300 border border-security-border hover:bg-white/5' : 'bg-white/5 text-user-text border border-user-border hover:bg-white/10 backdrop-blur-md',
    heading: isSecurityMode ? 'security-heading' : 'user-heading',
    textMuted: isSecurityMode ? 'text-gray-500' : 'text-user-text/70',
    border: isSecurityMode ? 'border-security-border' : 'border-user-border',
  };

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
        if (activeTab === 'chat' && chatEndRef.current && chatEndRef.current.parentNode) {
            chatEndRef.current.parentNode.scrollTop = chatEndRef.current.parentNode.scrollHeight;
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
            <div className={`min-h-screen flex items-center justify-center gap-4 ${theme.bg}`}>
                <RefreshCw className={`w-6 h-6 animate-spin ${theme.accentColor}`} />
                <span className={`text-sm ${theme.textMuted}`}>Loading...</span>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex flex-col ${theme.bg}`}>
            <Navbar />

            <div className="pt-28 px-4 md:px-12 max-w-[1600px] mx-auto pb-20 w-full flex-1">
                <div className={`flex justify-between items-end mb-8 border-b pb-4 ${theme.border}`}>
                    <div>
                        <h1 className={`text-2xl md:text-3xl mb-1 flex items-center gap-3 ${theme.heading}`}>
                            <Users className={`w-6 h-6 ${theme.accentColor}`} />
                            Teams
                        </h1>
                        <p className={`text-xs ${theme.textMuted}`}>Collaborate and share wordlists with your team</p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {!team ? (
                        /* ── No Team State ── */
                        <motion.div
                            key="no-team"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`${theme.card} rounded-xl p-10 text-center max-w-xl mx-auto mt-12`}
                        >
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isSecurityMode ? 'bg-black border border-security-border' : 'bg-white/5 border border-user-border'}`}>
                                <Users className={`w-10 h-10 ${isSecurityMode ? 'text-gray-600' : 'text-user-text/50'}`} />
                            </div>
                            <h2 className={`text-2xl mb-3 ${theme.heading}`}>You're not in a team yet</h2>
                            <p className={`mb-8 text-sm max-w-sm mx-auto ${theme.textMuted}`}>Create a new team or join one with an invite code.</p>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <button
                                    onClick={() => { setMode('create'); setError(''); }}
                                    className={`py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'create' ? theme.btnPrimary : theme.btnSecondary}`}
                                >
                                    <Shield className="w-4 h-4" /> Create Team
                                </button>
                                <button
                                    onClick={() => { setMode('join'); setError(''); }}
                                    className={`py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'join' ? theme.btnPrimary : theme.btnSecondary}`}
                                >
                                    <UserPlus className="w-4 h-4" /> Join Team
                                </button>
                            </div>

                            {(mode === 'create' || mode === 'join') && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className={`pt-6 border-t space-y-4 ${theme.border}`}
                                >
                                    {mode === 'create' ? (
                                        <>
                                            <input
                                                type="text"
                                                placeholder="Team name"
                                                className={`w-full p-4 rounded-lg text-sm transition-colors outline-none font-mono ${theme.inputBg}`}
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                            />
                                            <button onClick={handleCreate} className={`w-full py-3 rounded-lg font-bold text-sm tracking-wide transition-all ${theme.btnPrimary}`}>
                                                Create Team
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <input
                                                type="text"
                                                placeholder="Paste invite code"
                                                className={`w-full p-4 rounded-lg text-sm outline-none transition-colors font-mono tracking-widest ${theme.inputBg}`}
                                                value={formData.code}
                                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                                            />
                                            <button onClick={handleJoin} className={`w-full py-3 rounded-lg font-bold text-sm tracking-wide transition-all ${theme.btnPrimary}`}>
                                                Join Team
                                            </button>
                                        </>
                                    )}
                                    {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
                                </motion.div>
                            )}
                        </motion.div>
                    ) : (
                        /* ── Active Team (two-column layout) ── */
                        <motion.div
                            key="team-active"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8"
                        >
                            {/* ── Left: Team Info ── */}
                            <div className="col-span-12 lg:col-span-4 space-y-6">
                                <div className={`${theme.card} p-8`}>
                                    <p className={`text-[10px] uppercase tracking-widest font-mono font-bold mb-2 ${theme.textMuted}`}>Current Team</p>
                                    <h2 className={`text-3xl mb-6 ${theme.heading}`}>{team.name}</h2>

                                    <div className={`p-5 rounded-xl border mb-6 ${isSecurityMode ? 'bg-black border-security-border' : 'bg-white/5 border-user-border'}`}>
                                        <p className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${theme.textMuted}`}>Invite Code</p>
                                        <p className={`text-xl font-mono font-bold tracking-widest ${theme.accentColor}`}>{team.invite_code}</p>
                                        <p className={`text-[10px] mt-2 ${theme.textMuted}`}>Share this code to invite members</p>
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className={theme.textMuted}>Your Role</span>
                                            <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${isSecurityMode ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-user-cobalt/10 text-user-cobalt border border-user-cobalt/20'}`}>{team.my_role}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className={theme.textMuted}>Members</span>
                                            <span className={`font-bold ${isSecurityMode ? 'text-white' : 'text-user-text'}`}>{(team.members || []).length}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleLeave}
                                        className={`w-full mt-8 border py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${isSecurityMode ? 'border-red-900/40 text-red-500 hover:bg-red-500/10 hover:border-red-500/50' : 'border-user-border text-user-text/70 hover:text-white hover:bg-white/10'}`}
                                    >
                                        Leave Team
                                    </button>
                                </div>

                                {/* Members list */}
                                <div className={`${theme.card} p-6`}>
                                    <h3 className={`text-sm uppercase tracking-widest font-mono font-bold mb-5 flex items-center gap-2 ${theme.textMuted}`}>
                                        <Users className="w-4 h-4" /> Members
                                    </h3>
                                    <div className={`space-y-2 divide-y ${isSecurityMode ? 'divide-security-border' : 'divide-user-border'}`}>
                                        {(team.members || []).map((member, i) => (
                                            <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border ${member.role === 'LEADER' ? (isSecurityMode ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-user-cobalt/10 border-user-cobalt/30 text-user-cobalt') : (isSecurityMode ? 'bg-black border-security-border text-gray-500' : 'bg-white/5 border-user-border text-user-text/70')}`}>
                                                        {(member.username || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className={`text-sm font-bold ${isSecurityMode ? 'text-gray-200' : 'text-user-text'}`}>{member.username}</div>
                                                        <div className={`text-[10px] font-mono tracking-wider uppercase mt-0.5 ${theme.textMuted}`}>{member.role}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                    <span className="text-[9px] uppercase tracking-wider font-bold text-green-500">Active</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ── Right: Activity / Chat tabs ── */}
                            <div className="col-span-12 lg:col-span-8">
                                <div className={`${theme.card} flex flex-col h-[700px] overflow-hidden`}>
                                    {/* Tab bar */}
                                    <div className={`flex border-b ${theme.border}`}>
                                        <button
                                            onClick={() => setActiveTab('activity')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'activity' ? `border-[${isSecurityMode ? '#ef4444' : '#3b82f6'}] ${isSecurityMode ? 'text-white' : 'text-user-text'}` : `border-transparent ${theme.textMuted} hover:bg-white/5`}`}
                                            style={activeTab === 'activity' ? { borderColor: isSecurityMode ? '#ef4444' : '#3b82f6' } : {}}
                                        >
                                            <Activity className="w-4 h-4" /> Activity
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('chat')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'chat' ? `border-[${isSecurityMode ? '#ef4444' : '#3b82f6'}] ${isSecurityMode ? 'text-white' : 'text-user-text'}` : `border-transparent ${theme.textMuted} hover:bg-white/5`}`}
                                            style={activeTab === 'chat' ? { borderColor: isSecurityMode ? '#ef4444' : '#3b82f6' } : {}}
                                        >
                                            <MessageCircle className="w-4 h-4" /> Team Chat
                                        </button>
                                    </div>

                                    <div className="flex-1 flex flex-col min-h-0 relative">
                                        <AnimatePresence mode="wait">
                                            {/* ── Activity Tab ── */}
                                            {activeTab === 'activity' && (
                                                <motion.div
                                                    key="activity"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute inset-0 overflow-y-auto p-6 space-y-5 custom-scrollbar"
                                                >
                                                    {(team.feed || []).length === 0 ? (
                                                        <div className={`text-center py-20 text-sm ${theme.textMuted}`}>
                                                            No team activity yet. Generate a wordlist to see it here.
                                                        </div>
                                                    ) : (
                                                        (team.feed || []).map((op, i) => (
                                                            <div key={i} className="flex gap-4">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${isSecurityMode ? 'bg-black border-security-border' : 'bg-white/5 border-user-border'}`}>
                                                                        <Terminal className={`w-4 h-4 ${theme.textMuted}`} />
                                                                    </div>
                                                                    {i < (team.feed || []).length - 1 && (
                                                                        <div className={`w-px flex-1 my-2 ${isSecurityMode ? 'bg-security-border' : 'bg-user-border'}`} />
                                                                    )}
                                                                </div>
                                                                <div className={`flex-1 p-5 rounded-xl border transition-all mb-2 ${isSecurityMode ? 'bg-black/50 border-security-border hover:border-security-border/80' : 'bg-white/5 border-user-border hover:bg-white/10'}`}>
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <span className={`text-sm ${isSecurityMode ? 'text-gray-300' : 'text-user-text'}`}>
                                                                            <span className={`font-bold ${theme.accentColor}`}>{op.operator || 'A member'}</span> generated a wordlist
                                                                        </span>
                                                                        <span className={`text-xs font-mono ${theme.textMuted}`}>
                                                                            {new Date(op.timestamp).toLocaleTimeString()}
                                                                        </span>
                                                                    </div>
                                                                    {op.target && op.target !== 'Unknown' && (
                                                                        <p className={`text-xs mb-3 ${theme.textMuted}`}>Target: <span className={isSecurityMode ? 'text-gray-300' : 'text-user-text'}>{op.target}</span></p>
                                                                    )}
                                                                    <div className="flex items-center gap-3">
                                                                        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${isSecurityMode ? 'bg-black border-security-border text-gray-400' : 'bg-white/5 border-user-border text-user-text/80'}`}>
                                                                            {op.wordlist_count} passwords
                                                                        </span>
                                                                        <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded border ${isSecurityMode ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
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
                                                    className="absolute inset-0 flex flex-col"
                                                >
                                                    {/* Messages area */}
                                                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                                        {messages.length === 0 ? (
                                                            <div className={`text-center py-20 text-sm ${theme.textMuted}`}>
                                                                No messages yet. Say hello to your team! 👋
                                                            </div>
                                                        ) : (
                                                            messages.map(msg => (
                                                                <div
                                                                    key={msg.id}
                                                                    className={`flex ${msg.is_me ? 'justify-end' : 'justify-start'} gap-3`}
                                                                >
                                                                    {!msg.is_me && (
                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1 border ${isSecurityMode ? 'bg-black border-security-border text-gray-500' : 'bg-white/10 border-user-border text-user-text/80'}`}>
                                                                            {msg.sender.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                    <div className={`max-w-[85%] sm:max-w-[70%]`}>
                                                                        {!msg.is_me && (
                                                                            <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${theme.textMuted}`}>{msg.sender}</p>
                                                                        )}
                                                                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed break-words shadow-md ${msg.is_me
                                                                            ? `${theme.accentBg} text-white rounded-br-sm`
                                                                            : (isSecurityMode ? 'bg-black border border-security-border text-gray-300 rounded-bl-sm' : 'bg-white/10 border border-white/5 text-user-text rounded-bl-sm backdrop-blur-md')
                                                                            }`}>
                                                                            {msg.content}
                                                                            <div className={`text-[9px] mt-1.5 text-right font-mono ${msg.is_me ? 'text-white/60' : theme.textMuted}`}>
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
                                                        className={`p-4 border-t flex gap-3 shrink-0 ${isSecurityMode ? 'bg-security-surface border-security-border' : 'bg-black/20 border-user-border backdrop-blur-xl'}`}
                                                    >
                                                        <input
                                                            type="text"
                                                            value={chatInput}
                                                            onChange={e => setChatInput(e.target.value)}
                                                            placeholder="Message your team..."
                                                            maxLength={2000}
                                                            className={`flex-1 px-5 py-3 rounded-xl text-sm outline-none transition-colors shadow-inner ${theme.inputBg}`}
                                                        />
                                                        <button
                                                            type="submit"
                                                            disabled={sendingMsg || !chatInput.trim()}
                                                            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${theme.btnPrimary}`}
                                                        >
                                                            <Send className="w-5 h-5 -ml-1" />
                                                        </button>
                                                    </form>
                                                    {chatError && (
                                                        <div className={`px-4 pb-2 pt-1 text-xs font-medium text-red-500 bg-black/20`}>{chatError}</div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
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
