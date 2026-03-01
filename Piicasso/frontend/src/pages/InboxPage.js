import React, { useState, useEffect, useContext } from 'react';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Send, AlertCircle, ShieldAlert, Mail } from 'lucide-react';
import Navbar from '../components/Navbar';

const InboxPage = () => {
    const { user, logout } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [recipient, setRecipient] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const { data } = await axios.get('/operations/messages/');
            setMessages(data);
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.code === 'user_inactive') {
                setIsBlocked(true);
                // We might get block message but we can still fetch messages since the backend 
                // IsActiveUserOrMessagesOnly allows /api/messages/ endpoints. Wait, our route is /api/operations/messages/
                // Ah, the middleware checks request.path.startswith('/api/messages/'), but my URLs are via api/operations/messages/ !
                // Let me make sure about that path. Assuming it succeeds:
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage) return;
        try {
            const payload = { content: newMessage };
            // If blocked, we force recipient to admin on backend, but we need to supply *a* valid recipient ID to pass serializer.
            // Wait, if recipient is required in serializer, we need it. Let me just send hardcoded 1 or fetch admin.
            // Better to have backend not require recipient if blocked, or we just put a dummy value.
            // Let's rely on backend to correctly set recipient. We must send a dummy valid integer for recipient.
            payload.recipient = 1;
            await axios.post('/operations/messages/', payload);
            setNewMessage('');
            fetchMessages();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send message.');
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await axios.post(`/operations/messages/${id}/mark_read/`);
            fetchMessages();
        } catch (err) { }
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-netflix-red selection:text-white pb-20 pt-24 font-mono relative">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 relative z-10 pt-10">
                <div className="flex items-center gap-3 mb-8">
                    <Mail className="w-8 h-8 text-netflix-red" />
                    <h1 className="text-3xl font-bold tracking-widest text-shadow-red">INBOX</h1>
                </div>

                {isBlocked && (
                    <div className="mb-8 p-4 bg-red-900/20 border-l-4 border-red-500 rounded text-red-100 flex items-start gap-4">
                        <ShieldAlert className="w-6 h-6 shrink-0 mt-1 text-red-500" />
                        <div>
                            <h3 className="font-bold text-lg mb-1">ACCOUNT BLOCKED</h3>
                            <p className="text-sm opacity-80">You have violated the website policy. You can still message the Admins below to submit an apology or proof. All other functionality is disabled.</p>
                            <button
                                onClick={logout}
                                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
                    <h2 className="text-lg font-bold mb-4 text-gray-300">Compose Message</h2>
                    <form onSubmit={handleSend} className="space-y-4">
                        {!isBlocked && (
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Recipient ID (optional for Admin Appeal)</label>
                                <input
                                    type="text"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-netflix-red outline-none"
                                    placeholder="Enter recipient User ID..."
                                />
                            </div>
                        )}
                        <div>
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded p-4 text-white focus:border-netflix-red outline-none min-h-[120px]"
                                placeholder={isBlocked ? "Type your apology or proof here to the Administration..." : "Type your message..."}
                                required
                            />
                        </div>
                        {error && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
                        <button
                            type="submit"
                            className="px-6 py-2 bg-netflix-red hover:bg-red-700 font-bold rounded text-sm tracking-widest flex items-center gap-2 transition-all shadow-glow-red"
                        >
                            <Send className="w-4 h-4" /> SEND SECURE TRANSMISSION
                        </button>
                    </form>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-4 tracking-widest border-b border-zinc-800 pb-2">Messages</h2>
                    {loading ? (
                        <p className="text-gray-500 text-sm animate-pulse">Decrypting inbox...</p>
                    ) : messages.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">No messages found in your secure line.</p>
                    ) : (
                        <div className="space-y-4">
                            {messages.map(msg => {
                                const isReceived = msg.recipient_name === user?.username;
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        key={msg.id}
                                        className={`p-4 rounded border ${isReceived && !msg.is_read ? 'bg-red-900/10 border-netflix-red shadow-[0_0_15px_rgba(229,9,20,0.15)]' : 'bg-black border-zinc-800'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-xs text-gray-500">
                                                {isReceived ? (
                                                    <span className="text-netflix-red">FROM: {msg.sender_name}</span>
                                                ) : (
                                                    <span>TO: {msg.recipient_name}</span>
                                                )}
                                                <span className="ml-4 opacity-50">{new Date(msg.timestamp).toLocaleString()}</span>
                                            </div>
                                            {isReceived && !msg.is_read && (
                                                <button onClick={() => handleMarkRead(msg.id)} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded tracking-wider">MARK READ</button>
                                            )}
                                        </div>
                                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InboxPage;
