import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Mail, ChevronRight, Search, AlertCircle, MessageCircle } from 'lucide-react';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { ModeContext } from '../context/ModeContext';
import DesignAppShell from '../components/design/dashboard/DesignAppShell.jsx';

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
    bg: isSecurityMode ? 'bg-security-bg' : 'bg-user-bg',
    card: isSecurityMode ? 'sec-card' : 'usr-card',
    accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
    accentBg: isSecurityMode ? 'bg-security-red' : 'bg-user-cobalt',
    accentBorder: isSecurityMode ? 'border-security-red/30' : 'border-user-cobalt/30',
    hoverAccent: isSecurityMode ? 'hover:bg-security-red/10' : 'hover:bg-user-cobalt/10',
    inputBg: isSecurityMode
      ? 'bg-black/50 border-white/10 focus-within:border-security-red/50 text-white placeholder-gray-600'
      : 'bg-white/5 border-white/10 focus-within:border-user-cobalt/50 text-user-text placeholder-user-text/40',
    btnPrimary: isSecurityMode ? 'security-btn-primary' : 'user-btn-primary',
    btnSecondary: isSecurityMode
      ? 'bg-black/50 text-white border border-white/10 hover:bg-white/10'
      : 'bg-white/10 text-white border border-white/10 hover:bg-white/20',
    textMuted: isSecurityMode ? 'text-gray-500' : 'text-user-text/70',
    border: isSecurityMode ? 'border-security-red/20' : 'border-user-cobalt/20',
    chatBubbleMe: isSecurityMode
      ? 'bg-security-red text-white border border-security-red/50'
      : 'bg-user-cobalt text-white border border-user-cobalt/50',
    chatBubbleOther: isSecurityMode
      ? 'bg-black/60 text-white border border-white/10'
      : 'bg-white/10 text-white border border-white/10',
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
          const target = users.find((u) => String(u.id) === String(recipientId));
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
      const { data } = await axios.get('messages/');
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
      const url = userId ? `messages/?user_id=${userId}` : `messages/`;
      const { data } = await axios.get(url);
      // API returns newest-first (ORDER BY -timestamp) so we reverse
      // before setting state to keep oldest-at-top, newest-at-bottom.
      setMessages(Array.isArray(data) ? [...data].reverse() : []);
    } catch (e) {
      console.warn('Failed to fetch message thread', e);
    }
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
      const payload = isSuperuser ? { recipient_id: selectedUser.id, content } : { content };
      await axios.post('messages/', payload);
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

  const filteredConversations = conversations.filter((c) =>
    c.username?.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredAllUsers = allUsers.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading && !isSuperuser) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <div
          className={`${theme.textMuted} animate-pulse font-mono text-xs uppercase tracking-[0.5em]`}
        >
          Securing Connection...
        </div>
      </div>
    );
  }

  return (
    <DesignAppShell>
      <div style={{ height: 'calc(100vh - 56px)', display: 'flex', overflow: 'hidden' }}>
        <div className="mx-auto flex w-full max-w-7xl flex-1 gap-4 overflow-hidden px-4">
          {/* ── Admin Sidebar (Conditional) ── */}
          {isSuperuser && (
            <>
              {/* Mobile toggle for sidebar */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`fixed bottom-6 left-6 z-50 lg:hidden ${theme.accentBg} rounded-full p-3 text-white shadow-lg transition-colors`}
              >
                <Mail className="h-5 w-5" />
              </button>

              {/* Overlay: invisible full-screen backdrop, not a
                                discrete interactive control — keyboard users
                                can already Tab away or use the toggle button. */}
              {sidebarOpen && (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                <div
                  className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
              )}

              <div
                className={`fixed inset-y-0 left-0 z-40 flex w-80 shrink-0 flex-col lg:relative ${theme.card} transform !p-0 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} `}
              >
                <div className={`border-b p-4 ${theme.border} bg-black/20`}>
                  <div className="mb-4 flex items-center justify-between">
                    <h1
                      className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${theme.accentColor}`}
                    >
                      <Mail className="h-4 w-4" /> {isSecurityMode ? 'ADMIN TERMINAL' : 'MESSAGES'}
                    </h1>
                    <button
                      onClick={() => {
                        setShowNewConv(!showNewConv);
                        setSelectedUser(null);
                      }}
                      className={`text-[10px] font-bold uppercase tracking-tighter transition-colors ${theme.accentColor} hover:opacity-80`}
                    >
                      + New
                    </button>
                  </div>
                  <div
                    className={`flex items-center ${theme.inputBg} gap-2 rounded-lg border px-3 py-2 transition-all`}
                  >
                    <Search className={`h-3.5 w-3.5 ${theme.textMuted} shrink-0`} />
                    <input
                      type="text"
                      placeholder="Search directory..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={`w-full bg-transparent text-xs placeholder-white/40 outline-none`}
                    />
                  </div>
                </div>

                <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
                  {showNewConv ? (
                    <>
                      <p
                        className={`px-3 py-2 text-[10px] uppercase tracking-widest ${theme.textMuted}`}
                      >
                        Directory
                      </p>
                      {filteredAllUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => selectUser(u)}
                          className={`group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-all ${theme.hoverAccent}`}
                        >
                          <div
                            className={`h-8 w-8 rounded-full ${theme.btnSecondary} flex shrink-0 items-center justify-center text-xs font-bold`}
                          >
                            {u.username[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">{u.username}</p>
                            <p
                              className={`font-mono text-[10px] uppercase tracking-tighter ${theme.textMuted}`}
                            >
                              {u.is_active ? 'Active' : 'Offline'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </>
                  ) : filteredConversations.length === 0 ? (
                    <div
                      className={`flex flex-col items-center gap-4 px-4 py-16 text-center ${theme.textMuted} opacity-50`}
                    >
                      <MessageCircle className="h-8 w-8" />
                      <p className="text-xs uppercase tracking-widest">No Active Traffic</p>
                    </div>
                  ) : (
                    <>
                      <p
                        className={`px-3 py-2 text-[10px] uppercase tracking-widest ${theme.textMuted}`}
                      >
                        Active Channels
                      </p>
                      {filteredConversations.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => selectUser(c)}
                          className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-lg px-3 py-3 text-left transition-all ${selectedUser?.id === c.id ? `border bg-white/10 ${theme.border}` : `border border-transparent ${theme.hoverAccent}`}`}
                        >
                          <div
                            className={`h-9 w-9 rounded-full ${theme.btnSecondary} relative z-10 flex shrink-0 items-center justify-center text-xs font-bold`}
                          >
                            {c.username[0].toUpperCase()}
                            {c.unread > 0 && (
                              <span
                                className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full ${theme.accentBg} animate-pulse border-2 border-black`}
                              />
                            )}
                          </div>
                          <div className="relative z-10 min-w-0 flex-1">
                            <p
                              className={`truncate text-sm font-medium ${c.unread > 0 ? 'text-white' : 'text-white/70'}`}
                            >
                              {c.username}
                            </p>
                            <p
                              className={`truncate font-mono text-[10px] uppercase tracking-tighter ${theme.textMuted}`}
                            >
                              Secure Link
                            </p>
                          </div>
                          <ChevronRight
                            className={`h-4 w-4 shrink-0 transition-transform ${selectedUser?.id === c.id ? `${theme.accentColor} translate-x-1` : theme.textMuted}`}
                          />
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Main Chat Area ── */}
          <div className={`flex flex-1 flex-col ${theme.card} relative overflow-hidden !p-0`}>
            {isSuperuser && !selectedUser ? (
              <div
                className={`flex flex-1 flex-col items-center justify-center gap-6 ${theme.textMuted} opacity-30`}
              >
                <Mail className="h-20 w-20" />
                <div className="space-y-1 text-center">
                  <p className="font-mono text-xs uppercase tracking-[0.4em]">Standby Status</p>
                  <p className="font-mono text-[10px] uppercase">
                    Select endpoint to initiate handshake
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div
                  className={`flex items-center justify-between border-b px-6 py-4 ${theme.border} bg-black/20`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-10 w-10 rounded-full ${theme.btnSecondary} flex items-center justify-center text-sm font-bold shadow-inner`}
                    >
                      {isSuperuser ? selectedUser.username[0].toUpperCase() : 'A'}
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-wide text-white">
                        {isSuperuser ? selectedUser.username : 'SYSTEM ADMINISTRATOR'}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"></div>
                        <p
                          className={`font-mono text-[10px] uppercase tracking-widest ${theme.textMuted}`}
                        >
                          Connected
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`border bg-white/5 px-3 py-1 ${theme.border} rounded-full font-mono text-[10px] uppercase tracking-widest ${theme.accentColor}`}
                  >
                    E2E Encrypted
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="custom-scrollbar relative flex-1 space-y-6 overflow-y-auto p-6">
                  {messages.length === 0 ? (
                    <div
                      className={`flex h-full flex-col items-center justify-center gap-6 ${theme.textMuted} opacity-50`}
                    >
                      <MessageCircle className="h-16 w-16" />
                      <p className="text-center font-mono text-xs uppercase tracking-[0.4em]">
                        Secure link established.
                        <br />
                        Encryption: AES-256
                      </p>
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
                          <div
                            className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-lg ${msg.is_me ? `${theme.chatBubbleMe} rounded-br-sm` : `${theme.chatBubbleOther} rounded-bl-sm`}`}
                          >
                            {msg.content}
                            <div
                              className={`mt-2 font-mono text-[9px] uppercase tracking-widest opacity-60 ${msg.is_me ? 'text-right' : 'text-left'}`}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <form
                  onSubmit={handleSend}
                  className={`border-t px-4 py-4 sm:px-6 ${theme.border} flex flex-col gap-3 bg-black/20`}
                >
                  {error && (
                    <div className="flex animate-pulse items-center gap-2 font-mono text-[10px] uppercase text-red-500">
                      <AlertCircle className="h-3.5 w-3.5" /> Link Error: {error}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={
                        isSuperuser
                          ? `Send reply to ${selectedUser.username}...`
                          : 'Compose secure message...'
                      }
                      className={`flex-1 ${theme.inputBg} rounded-xl border px-4 py-3 text-sm placeholder-white/40 shadow-inner outline-none transition-all`}
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className={`${theme.btnPrimary} flex h-12 w-12 shrink-0 items-center justify-center rounded-xl !p-0 disabled:opacity-50`}
                    >
                      <Send className={`h-5 w-5 ${sending ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  {isSecurityMode && (
                    <div
                      className={`text-center font-mono text-[9px] uppercase tracking-[0.2em] ${theme.textMuted}`}
                    >
                      Secure Comm Protocol // Channel Encypted
                    </div>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </DesignAppShell>
  );
};

export default InboxPage;
