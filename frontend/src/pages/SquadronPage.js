import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Shield, UserPlus, LogOut, Terminal,
    Zap, Lock, Activity, RefreshCw
} from 'lucide-react';

const SquadronPage = () => {
    const [squad, setSquad] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('view'); // 'view', 'create', 'join'
    const [formData, setFormData] = useState({ name: '', code: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSquadInfo();
    }, []);

    const fetchSquadInfo = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get('squadron/');
            if (res.data.active) {
                setSquad(res.data);
                setMode('view');
            } else {
                setSquad(null);
            }
        } catch (err) {
            console.error("Squad fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            setError('');
            const res = await axiosInstance.post('squadron/create/', { name: formData.name });
            fetchSquadInfo();
        } catch (err) {
            setError(err.response?.data?.error || "Creation failed");
        }
    };

    const handleJoin = async () => {
        try {
            setError('');
            const res = await axiosInstance.post('squadron/join/', { code: formData.code });
            fetchSquadInfo();
        } catch (err) {
            setError(err.response?.data?.error || "Join failed");
        }
    };

    const handleLeave = async () => {
        if (!window.confirm("CONFIRM SEPARATION: You will lose access to team intelligence.")) return;
        try {
            await axiosInstance.post('squadron/leave/');
            fetchSquadInfo();
        } catch (err) {
            alert(err.response?.data?.error || "Departure failed");
        }
    };

    if (loading) return (
        <div className="bg-[#0a0a0a] min-h-screen text-white flex items-center justify-center font-mono">
            <RefreshCw className="w-8 h-8 animate-spin text-netflix-red" />
            <span className="ml-4 tracking-widest text-gray-500 uppercase">SYNCHRONIZING SQUADRON_LINK...</span>
        </div>
    );

    return (
        <div className="bg-[#0a0a0a] min-h-screen text-white font-body">
            <Navbar />

            <div className="pt-24 px-4 md:px-12 max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-8 border-b border-zinc-900 pb-4">
                    <div>
                        <h1 className="text-3xl font-heading tracking-wide mb-1 uppercase">
                            <span className="text-netflix-red">Squadron</span> Intelligence
                        </h1>
                        <p className="text-xs text-gray-500 font-mono uppercase tracking-[0.2em]">
                            Operational Units & Shared Data Networks
                        </p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {!squad ? (
                        <motion.div
                            key="no-squad"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#141414] border border-zinc-800 rounded-lg p-12 text-center max-w-2xl mx-auto mt-12"
                        >
                            <Users className="w-16 h-16 text-gray-700 mx-auto mb-6" />
                            <h2 className="text-2xl font-heading mb-4">NO ACTIVE UNIT DETECTED</h2>
                            <p className="text-gray-500 mb-8 text-sm">
                                Join an existing tactical unit with an invite code, or establish a new squadron to coordinate operations.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setMode('create')}
                                    className="bg-white text-black py-3 px-6 rounded font-heading text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <Shield className="w-4 h-4" /> ESTABLISH UNIT
                                </button>
                                <button
                                    onClick={() => setMode('join')}
                                    className="border border-zinc-700 hover:bg-zinc-800 py-3 px-6 rounded font-heading text-sm transition-all flex items-center justify-center gap-2 text-gray-300"
                                >
                                    <UserPlus className="w-4 h-4" /> JOIN UNIT
                                </button>
                            </div>

                            {/* Forms inside Modal/Overlay logic simplified here */}
                            {(mode === 'create' || mode === 'join') && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-8 pt-8 border-t border-zinc-800"
                                >
                                    {mode === 'create' ? (
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                placeholder="UNIT NAME (e.g. ALPHA_SQUAD)"
                                                className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded font-mono text-sm outline-none focus:border-netflix-red"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                            <button
                                                onClick={handleCreate}
                                                className="w-full bg-netflix-red text-white py-2 rounded font-bold uppercase tracking-widest text-xs"
                                            >
                                                INITIALIZE SQUADRON
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                placeholder="ENTER INVITE CODE"
                                                className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded font-mono text-sm outline-none focus:border-netflix-red"
                                                value={formData.code}
                                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            />
                                            <button
                                                onClick={handleJoin}
                                                className="w-full bg-netflix-red text-white py-2 rounded font-bold uppercase tracking-widest text-xs"
                                            >
                                                VALIDATE CODE
                                            </button>
                                        </div>
                                    )}
                                    {error && <p className="text-red-500 text-xs mt-4 font-mono">{error}</p>}
                                    <button onClick={() => setMode('view')} className="text-gray-600 text-[10px] uppercase mt-4 hover:underline">Cancel</button>
                                </motion.div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="squad-active"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-12 gap-8"
                        >
                            {/* Left: Squad Overview */}
                            <div className="col-span-12 lg:col-span-4 space-y-6">
                                <div className="bg-[#141414] border border-zinc-800 rounded-lg p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3">
                                        <Shield className="w-12 h-12 text-zinc-900 absolute -top-2 -right-2" />
                                    </div>
                                    <h3 className="text-gray-500 text-[10px] font-mono mb-1">ACTIVE_SQUADRON</h3>
                                    <h2 className="text-3xl font-heading mb-6">{squad.name}</h2>

                                    <div className="bg-black/50 p-4 rounded border border-zinc-900 mb-6">
                                        <div className="text-[10px] text-gray-500 font-mono mb-1">INVITE_CODE</div>
                                        <div className="text-xl font-heading text-red-500 tracking-widest">{squad.invite_code}</div>
                                        <p className="text-[9px] text-zinc-600 mt-2 italic">Share this code to onboard new tactical agents.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">CLEARANCE</span>
                                            <span className="text-green-500 font-bold uppercase">{squad.my_role}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">OPERATIVES</span>
                                            <span>{squad.members.length} / 12</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">UPTIME</span>
                                            <span className="font-mono">99.99%</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleLeave}
                                        className="w-full mt-8 border border-red-900/50 text-red-700 py-2 rounded text-[10px] font-bold uppercase hover:bg-red-900/10 transition-colors"
                                    >
                                        DETACH FROM UNIT
                                    </button>
                                </div>

                                <div className="bg-[#141414] border border-zinc-800 rounded-lg p-6">
                                    <h3 className="text-sm font-heading mb-4 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-400" /> OPERATIVES
                                    </h3>
                                    <div className="space-y-4">
                                        {squad.members.map((member, i) => (
                                            <div key={i} className="flex items-center justify-between border-b border-zinc-900 pb-3 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${member.role === 'LEADER' ? 'bg-red-900/30 text-red-500' : 'bg-zinc-800 text-gray-400'}`}>
                                                        {member.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold">{member.username}</div>
                                                        <div className="text-[9px] text-gray-500 uppercase">{member.role}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                                    <span className="text-[9px] text-green-500">ONLINE</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Team Activity Feed */}
                            <div className="col-span-12 lg:col-span-8">
                                <div className="bg-[#141414] border border-zinc-800 rounded-lg flex flex-col h-full min-h-[500px]">
                                    <div className="p-4 border-b border-zinc-900 flex justify-between items-center">
                                        <h3 className="text-sm font-heading flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-netflix-red" /> INTEL_COMM_STREAM
                                        </h3>
                                        <div className="text-[10px] font-mono text-gray-600 animate-pulse">MONITORING ENCRYPTED CHANNELS...</div>
                                    </div>

                                    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[600px] custom-scrollbar">
                                        {squad.feed.length === 0 ? (
                                            <div className="text-center py-20 text-gray-600 font-mono text-sm">
                                                NO RECENT ANALYTICS DETECTED IN SQUADRON_FLOW
                                            </div>
                                        ) : (
                                            squad.feed.map((op, i) => (
                                                <div key={i} className="flex gap-4 relative">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 rounded border border-zinc-700 flex items-center justify-center bg-black">
                                                            <Terminal className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                        <div className="w-px flex-1 bg-zinc-800 my-1"></div>
                                                    </div>
                                                    <div className="flex-1 bg-zinc-900/30 p-4 rounded border border-zinc-800/50 hover:bg-zinc-900/50 transition-all">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-xs font-bold text-gray-300">
                                                                OPERATIVE <span className="text-red-500">{op.operator.toUpperCase()}</span> INITIATED DATA_SCRAPE
                                                            </span>
                                                            <span className="text-[9px] font-mono text-gray-600">
                                                                {new Date(op.timestamp).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 font-mono mb-2">
                                                            TARGET_LINK: {op.target}
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-1 text-[9px] text-zinc-400 bg-black/40 px-2 py-0.5 rounded border border-zinc-800">
                                                                <Lock className="w-2 h-2" /> {op.wordlist_count} VECTORS GEN
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[9px] text-green-500/70 bg-green-900/10 px-2 py-0.5 rounded border border-green-900/20">
                                                                <Zap className="w-2 h-2" /> ANALYSIS_COMPLETE
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="p-3 bg-black/40 border-t border-zinc-900 text-center">
                                        <span className="text-[9px] text-gray-600 font-mono tracking-widest uppercase">
                                            Secure Team Intelligence Protocol // v4.2.0-SQUAD
                                        </span>
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

export default SquadronPage;
