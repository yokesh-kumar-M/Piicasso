import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Shield,
  UserPlus,
  Terminal,
  Activity,
  RefreshCw,
  MessageCircle,
  Send,
} from 'lucide-react';
import DesignAppShell from '../components/design/dashboard/DesignAppShell.jsx';
import axiosInstance from '../api/axios';
import { ModeContext } from '../context/ModeContext';

const TeamsPage = () => {
  const [team, setTeam] = useState(null);
  const { mode: appMode } = useContext(ModeContext) || { mode: 'security' };
  const isSecurityMode = appMode === 'security';

  const theme = {
    bg: isSecurityMode ? 'bg-security-bg' : 'bg-user-bg',
    accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
    accentBg: isSecurityMode ? 'bg-security-red' : 'bg-user-cobalt',
    card: isSecurityMode ? 'sec-card' : 'usr-card',
    inputBg: isSecurityMode
      ? 'bg-black border border-security-border focus:border-security-red text-white placeholder-gray-600'
      : 'bg-white/5 border border-user-border focus:border-user-cobalt text-user-text placeholder-user-text/40',
    btnPrimary: isSecurityMode ? 'security-btn-primary' : 'user-btn-primary',
    btnSecondary: isSecurityMode
      ? 'bg-security-surface text-white border border-security-border hover:bg-white/5'
      : 'bg-white/5 text-user-text border border-user-border hover:bg-white/10',
    heading: isSecurityMode ? 'security-heading' : 'user-heading',
    textMuted: isSecurityMode ? 'text-gray-500' : 'text-user-text/70',
    textPrimary: isSecurityMode ? 'text-gray-300' : 'text-user-text/90',
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
          setMessages((prev) => [...prev, ...data]);
        }
        lastIdRef.current = data[data.length - 1].id;
      }
    } catch (e) {
      console.error('Chat fetch error', e);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setError('Team name is required.');
      return;
    }
    try {
      setError('');
      await axiosInstance.post('teams/create/', { name: formData.name });
      fetchTeamInfo();
    } catch (err) {
      setError(err.response?.data?.error || 'Team creation failed.');
    }
  };

  const handleJoin = async () => {
    if (!formData.code.trim()) {
      setError('Invite code is required.');
      return;
    }
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
      setMessages((prev) => [...prev, data]);
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
      <div className={`flex min-h-screen items-center justify-center gap-4 ${theme.bg}`}>
        <RefreshCw className={`h-6 w-6 animate-spin ${theme.accentColor}`} />
        <span className={`text-sm ${theme.textMuted}`}>Loading...</span>
      </div>
    );
  }

  return (
    <DesignAppShell>
      <div style={{ paddingTop: 24, paddingBottom: 80, paddingLeft: 16, paddingRight: 16 }}>
        <div style={{ maxWidth: 1400, marginLeft: 'auto', marginRight: 'auto' }}>
          <div className={`mb-8 flex items-end justify-between border-b pb-4 ${theme.border}`}>
            <div>
              <h1 className={`mb-1 flex items-center gap-3 text-2xl md:text-3xl ${theme.heading}`}>
                <Users className={`h-6 w-6 ${theme.accentColor}`} />
                Teams
              </h1>
              <p className={`text-xs ${theme.textMuted}`}>
                Collaborate and share wordlists with your team
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!team ? (
              /* ── No Team State ── */
              <motion.div
                key="no-team"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${theme.card} mx-auto mt-12 max-w-xl rounded-xl p-10 text-center`}
              >
                <div
                  className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${isSecurityMode ? 'border border-security-border bg-black' : 'border border-user-border bg-white/5'}`}
                >
                  <Users
                    className={`h-10 w-10 ${isSecurityMode ? 'text-gray-600' : 'text-user-text/50'}`}
                  />
                </div>
                <h2 className={`mb-3 text-2xl ${theme.heading}`}>You&apos;re not in a team yet</h2>
                <p className={`mx-auto mb-8 max-w-sm text-sm ${theme.textMuted}`}>
                  Create a new team or join one with an invite code.
                </p>

                <div className="mb-8 grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setMode('create');
                      setError('');
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition-all ${mode === 'create' ? theme.btnPrimary : theme.btnSecondary}`}
                  >
                    <Shield className="h-4 w-4" /> Create Team
                  </button>
                  <button
                    onClick={() => {
                      setMode('join');
                      setError('');
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition-all ${mode === 'join' ? theme.btnPrimary : theme.btnSecondary}`}
                  >
                    <UserPlus className="h-4 w-4" /> Join Team
                  </button>
                </div>

                {(mode === 'create' || mode === 'join') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`space-y-4 border-t pt-6 ${theme.border}`}
                  >
                    {mode === 'create' ? (
                      <>
                        <input
                          type="text"
                          placeholder="Team name"
                          className={`w-full rounded-lg p-4 font-mono text-sm outline-none transition-colors ${theme.inputBg}`}
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />
                        <button
                          onClick={handleCreate}
                          className={`w-full rounded-lg py-3 text-sm font-bold tracking-wide transition-all ${theme.btnPrimary}`}
                        >
                          Create Team
                        </button>
                      </>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="Paste invite code"
                          className={`w-full rounded-lg p-4 font-mono text-sm tracking-widest outline-none transition-colors ${theme.inputBg}`}
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                        />
                        <button
                          onClick={handleJoin}
                          className={`w-full rounded-lg py-3 text-sm font-bold tracking-wide transition-all ${theme.btnPrimary}`}
                        >
                          Join Team
                        </button>
                      </>
                    )}
                    {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
                  </motion.div>
                )}
              </motion.div>
            ) : (
              /* ── Active Team (two-column layout) ── */
              <motion.div
                key="team-active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-8"
              >
                {/* ── Left: Team Info ── */}
                <div className="col-span-12 space-y-6 lg:col-span-4">
                  <div className={`${theme.card} p-8`}>
                    <p
                      className={`mb-2 font-mono text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}
                    >
                      Current Team
                    </p>
                    <h2 className={`mb-6 text-3xl ${theme.heading}`}>{team.name}</h2>

                    <div
                      className={`mb-6 rounded-xl border p-5 ${isSecurityMode ? 'border-security-border bg-black' : 'border-user-border bg-white/5'}`}
                    >
                      <p
                        className={`mb-1 text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}
                      >
                        Invite Code
                      </p>
                      <p
                        className={`font-mono text-xl font-bold tracking-widest ${theme.accentColor}`}
                      >
                        {team.invite_code}
                      </p>
                      <p className={`mt-2 text-[10px] ${theme.textMuted}`}>
                        Share this code to invite members
                      </p>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className={theme.textMuted}>Your Role</span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isSecurityMode ? 'border border-green-500/20 bg-green-500/10 text-green-500' : 'border border-user-cobalt/20 bg-user-cobalt/10 text-user-cobalt'}`}
                        >
                          {team.my_role}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={theme.textMuted}>Members</span>
                        <span
                          className={`font-bold ${isSecurityMode ? 'text-white' : 'text-user-text'}`}
                        >
                          {(team.members || []).length}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleLeave}
                      className={`mt-8 w-full rounded-lg border py-3 text-xs font-bold uppercase tracking-widest transition-colors ${isSecurityMode ? 'border-red-900/40 text-red-500 hover:border-red-500/50 hover:bg-red-500/10' : 'border-user-border text-user-text/70 hover:bg-white/10 hover:text-white'}`}
                    >
                      Leave Team
                    </button>
                  </div>

                  {/* Members list */}
                  <div className={`${theme.card} p-6`}>
                    <h3
                      className={`mb-5 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-widest ${theme.textMuted}`}
                    >
                      <Users className="h-4 w-4" /> Members
                    </h3>
                    <div
                      className={`space-y-2 divide-y ${isSecurityMode ? 'divide-security-border' : 'divide-user-border'}`}
                    >
                      {(team.members || []).map((member, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ${member.role === 'LEADER' ? (isSecurityMode ? 'border-red-500/30 bg-red-500/10 text-red-500' : 'border-user-cobalt/30 bg-user-cobalt/10 text-user-cobalt') : isSecurityMode ? 'border-security-border bg-black text-gray-500' : 'border-user-border bg-white/5 text-user-text/70'}`}
                            >
                              {(member.username || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div
                                className={`text-sm font-bold ${isSecurityMode ? 'text-gray-200' : 'text-user-text'}`}
                              >
                                {member.username}
                              </div>
                              <div
                                className={`mt-0.5 font-mono text-[10px] uppercase tracking-wider ${theme.textMuted}`}
                              >
                                {member.role}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2 py-1">
                            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-green-500">
                              Active
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Right: Activity / Chat tabs ── */}
                <div className="col-span-12 lg:col-span-8">
                  <div className={`${theme.card} flex h-[700px] flex-col overflow-hidden`}>
                    {/* Tab bar */}
                    <div className={`flex border-b ${theme.border}`}>
                      <button
                        onClick={() => setActiveTab('activity')}
                        className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-4 text-sm font-bold transition-all ${activeTab === 'activity' ? `border-[${isSecurityMode ? '#ef4444' : '#3b82f6'}] ${isSecurityMode ? 'text-white' : 'text-user-text'}` : `border-transparent ${theme.textMuted} hover:bg-white/5`}`}
                        style={
                          activeTab === 'activity'
                            ? { borderColor: isSecurityMode ? '#ef4444' : '#3b82f6' }
                            : {}
                        }
                      >
                        <Activity className="h-4 w-4" /> Activity
                      </button>
                      <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-4 text-sm font-bold transition-all ${activeTab === 'chat' ? `border-[${isSecurityMode ? '#ef4444' : '#3b82f6'}] ${isSecurityMode ? 'text-white' : 'text-user-text'}` : `border-transparent ${theme.textMuted} hover:bg-white/5`}`}
                        style={
                          activeTab === 'chat'
                            ? { borderColor: isSecurityMode ? '#ef4444' : '#3b82f6' }
                            : {}
                        }
                      >
                        <MessageCircle className="h-4 w-4" /> Team Chat
                      </button>
                    </div>

                    <div className="relative flex min-h-0 flex-1 flex-col">
                      <AnimatePresence mode="wait">
                        {/* ── Activity Tab ── */}
                        {activeTab === 'activity' && (
                          <motion.div
                            key="activity"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="custom-scrollbar absolute inset-0 space-y-5 overflow-y-auto p-6"
                          >
                            {(team.feed || []).length === 0 ? (
                              <div className={`py-20 text-center text-sm ${theme.textMuted}`}>
                                No team activity yet. Generate a wordlist to see it here.
                              </div>
                            ) : (
                              (team.feed || []).map((op, i) => (
                                <div key={i} className="flex gap-4">
                                  <div className="flex flex-col items-center">
                                    <div
                                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${isSecurityMode ? 'border-security-border bg-black' : 'border-user-border bg-white/5'}`}
                                    >
                                      <Terminal className={`h-4 w-4 ${theme.textMuted}`} />
                                    </div>
                                    {i < (team.feed || []).length - 1 && (
                                      <div
                                        className={`my-2 w-px flex-1 ${isSecurityMode ? 'bg-security-border' : 'bg-user-border'}`}
                                      />
                                    )}
                                  </div>
                                  <div
                                    className={`mb-2 flex-1 rounded-xl border p-5 transition-all ${isSecurityMode ? 'border-security-border bg-black/50 hover:border-security-border/80' : 'border-user-border bg-white/5 hover:bg-white/10'}`}
                                  >
                                    <div className="mb-2 flex items-start justify-between">
                                      <span
                                        className={`text-sm ${isSecurityMode ? 'text-gray-300' : 'text-user-text'}`}
                                      >
                                        <span className={`font-bold ${theme.accentColor}`}>
                                          {op.operator || 'A member'}
                                        </span>{' '}
                                        generated a wordlist
                                      </span>
                                      <span className={`font-mono text-xs ${theme.textMuted}`}>
                                        {new Date(op.timestamp).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    {op.target && op.target !== 'Unknown' && (
                                      <p className={`mb-3 text-xs ${theme.textMuted}`}>
                                        Target:{' '}
                                        <span
                                          className={
                                            isSecurityMode ? 'text-gray-300' : 'text-user-text'
                                          }
                                        >
                                          {op.target}
                                        </span>
                                      </p>
                                    )}
                                    <div className="flex items-center gap-3">
                                      <span
                                        className={`rounded border px-2.5 py-1 font-mono text-xs font-bold ${isSecurityMode ? 'border-security-border bg-black text-gray-400' : 'border-user-border bg-white/5 text-user-text/80'}`}
                                      >
                                        {op.wordlist_count} passwords
                                      </span>
                                      <span
                                        className={`rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${isSecurityMode ? 'border-green-500/30 bg-green-500/10 text-green-500' : 'border-green-500/30 bg-green-500/20 text-green-400'}`}
                                      >
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
                            <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
                              {messages.length === 0 ? (
                                <div className={`py-20 text-center text-sm ${theme.textMuted}`}>
                                  No messages yet. Say hello to your team! 👋
                                </div>
                              ) : (
                                messages.map((msg) => (
                                  <div
                                    key={msg.id}
                                    className={`flex ${msg.is_me ? 'justify-end' : 'justify-start'} gap-3`}
                                  >
                                    {!msg.is_me && (
                                      <div
                                        className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${isSecurityMode ? 'border-security-border bg-black text-gray-500' : 'border-user-border bg-white/10 text-user-text/80'}`}
                                      >
                                        {msg.sender.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div className={`max-w-[85%] sm:max-w-[70%]`}>
                                      {!msg.is_me && (
                                        <p
                                          className={`mb-1 ml-1 text-[10px] font-bold uppercase tracking-wider ${theme.textMuted}`}
                                        >
                                          {msg.sender}
                                        </p>
                                      )}
                                      <div
                                        className={`break-words rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                                          msg.is_me
                                            ? `${theme.accentBg} rounded-br-sm text-white`
                                            : isSecurityMode
                                              ? 'rounded-bl-sm border border-security-border bg-black text-gray-300'
                                              : 'rounded-bl-sm border border-white/5 bg-white/10 text-user-text backdrop-blur-md'
                                        }`}
                                      >
                                        {msg.content}
                                        <div
                                          className={`mt-1.5 text-right font-mono text-[9px] ${msg.is_me ? 'text-white/60' : theme.textMuted}`}
                                        >
                                          {new Date(msg.timestamp).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}
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
                              className={`flex shrink-0 gap-3 border-t p-4 ${isSecurityMode ? 'border-security-border bg-security-surface' : 'border-user-border bg-black/20 backdrop-blur-xl'}`}
                            >
                              <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Message your team..."
                                maxLength={2000}
                                className={`flex-1 rounded-xl px-5 py-3 text-sm shadow-inner outline-none transition-colors ${theme.inputBg}`}
                              />
                              <button
                                type="submit"
                                disabled={sendingMsg || !chatInput.trim()}
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-40 ${theme.btnPrimary}`}
                              >
                                <Send className="-ml-1 h-5 w-5" />
                              </button>
                            </form>
                            {chatError && (
                              <div
                                className={`bg-black/20 px-4 pb-2 pt-1 text-xs font-medium text-red-500`}
                              >
                                {chatError}
                              </div>
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
    </DesignAppShell>
  );
};

export default TeamsPage;
