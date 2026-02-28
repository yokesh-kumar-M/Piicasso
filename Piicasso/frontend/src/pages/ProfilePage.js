import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';
import { motion } from 'framer-motion';
import {
    User, Shield, Activity, Lock, Database,
    Terminal, Clock, AlertTriangle, Fingerprint
} from 'lucide-react';

const ProfilePage = () => {
    const { user, logout } = useContext(AuthContext);
    const isGod = user?.is_superuser;

    const [stats, setStats] = useState({ operations: 0, data_points: 0, uptime: '99.9%', threats: 0 });
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sRes, hRes] = await Promise.all([
                    axiosInstance.get('stats/'),
                    axiosInstance.get('history/?page_size=5')
                ]);
                setStats(sRes.data);
                setLogs(hRes.data.results);
            } catch (e) {
                console.error("Profile fetch failed", e);
            }
        };
        fetchData();
    }, []);

    const formatNumber = (num) => {
        if (num > 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num > 1000) return (num / 1000).toFixed(1) + 'K';
        return num;
    };

    return (
        <div className="bg-[#0a0a0a] min-h-screen text-white font-body overflow-x-hidden">
            <Navbar />

            <div className="pt-24 px-4 md:px-12 max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    {/* LEFT: Agent ID Card */}
                    <div className="md:col-span-1">
                        <div className={`bg-[#141414] border-2 ${isGod ? 'border-red-600' : 'border-zinc-800'} rounded-lg p-6 relative overflow-hidden group`}>
                            {/* Animated Scanner BG */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.8)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className={`w-24 h-24 rounded-full border-4 ${isGod ? 'border-red-600 animate-pulse' : 'border-blue-500'} flex items-center justify-center bg-black mb-4`}>
                                    {isGod ? <Shield className="w-12 h-12 text-red-600" /> : <User className="w-12 h-12 text-blue-500" />}
                                </div>

                                <h2 className="text-2xl font-heading tracking-widest uppercase">
                                    {user?.username || 'GUEST USER'}
                                </h2>
                                <div className={`px-2 py-1 rounded text-[10px] font-bold mt-2 border ${isGod ? 'bg-red-900/20 border-red-600 text-red-500' : 'bg-blue-900/20 border-blue-500 text-blue-400'}`}>
                                    {isGod ? 'ROLE: ADMINISTRATOR' : 'ROLE: STANDARD USER'}
                                </div>

                                <div className="w-full mt-6 space-y-4 text-left">
                                    <div className="flex justify-between text-xs border-b border-zinc-800 pb-2">
                                        <span className="text-gray-500 font-mono">STATUS</span>
                                        <span className="text-green-500 font-bold flex items-center gap-1"><Activity className="w-3 h-3" /> ONLINE</span>
                                    </div>
                                    <div className="flex justify-between text-xs border-b border-zinc-800 pb-2">
                                        <span className="text-gray-500 font-mono">SESSION ID</span>
                                        <span className="text-gray-300 font-mono truncate max-w-[150px]">#{Math.random().toString(36).substr(2, 8).toUpperCase()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs border-b border-zinc-800 pb-2">
                                        <span className="text-gray-500 font-mono">CONNECTION</span>
                                        <span className="text-gray-300 font-mono">SECURE</span>
                                    </div>
                                </div>

                                <button
                                    onClick={logout}
                                    className="w-full mt-8 bg-red-600/10 hover:bg-red-600/30 border border-red-600 text-red-500 py-2 rounded text-xs font-bold tracking-widest uppercase transition-colors"
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Stats & History */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'GENERATIONS', val: stats.operations, icon: Terminal, color: 'text-purple-500' },
                                { label: 'WORDS', val: formatNumber(stats.data_points), icon: Database, color: 'text-blue-500' },
                                { label: 'UPTIME', val: stats.uptime, icon: Clock, color: 'text-green-500' },
                                { label: 'ALERTS', val: '0', icon: AlertTriangle, color: 'text-yellow-500' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-[#141414] border border-zinc-800 p-4 rounded flex flex-col items-center justify-center hover:border-zinc-600 transition-colors cursor-default">
                                    <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
                                    <div className="text-2xl font-heading">{stat.val}</div>
                                    <div className="text-[10px] text-gray-500 tracking-widest">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Activity Panel */}
                        <div className="bg-[#141414] border border-zinc-800 rounded p-6">
                            <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> RECENT ACTIVITY
                            </h3>
                            <div className="space-y-0 text-xs font-mono text-gray-500 border-l border-zinc-800 pl-4 relative">
                                {logs.length === 0 ? (
                                    <div className="pb-4 relative">
                                        <div className="text-gray-500 italic ml-2">No activity recorded.</div>
                                    </div>
                                ) : (
                                    logs.map((log, i) => (
                                        <div key={log.id} className="pb-6 relative last:pb-0">
                                            <div className="absolute -left-[21px] top-1 w-2 h-2 bg-zinc-600 rounded-full border border-black"></div>
                                            <div className="text-gray-300 font-bold">
                                                Generation #{log.id}: {log.pii_data?.full_name || log.pii_data?.username || 'Unknown Target'}
                                            </div>
                                            <div className="mt-1 flex gap-2 opacity-50">
                                                <span>{new Date(log.timestamp).toLocaleString()}</span>
                                                <span>•</span>
                                                <span className="font-mono text-zinc-400">{log.ip_address || '127.0.0.1'}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="mt-4 text-center">
                                <span className="text-[10px] text-zinc-600 uppercase">End of records</span>
                            </div>
                        </div>

                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ProfilePage;
