import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';
import { motion } from 'framer-motion';
import {
    User, Shield, Activity, Lock, Database,
    Terminal, Clock, AlertTriangle, Mail, Calendar,
    Users, Key, Globe, ChevronRight
} from 'lucide-react';

const ProfilePage = () => {
    const { user, logout } = useContext(AuthContext);
    const isAdmin = user?.is_superuser;

    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({ operations: 0, data_points: 0, uptime: '99.9%', threats: 0 });
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, statsRes, histRes] = await Promise.all([
                    axiosInstance.get('profile/').catch(() => ({ data: null })),
                    axiosInstance.get('stats/'),
                    axiosInstance.get('history/?page_size=5')
                ]);

                if (profileRes.data) {
                    setProfile(profileRes.data);
                }
                setStats(statsRes.data);

                const histData = histRes.data;
                if (Array.isArray(histData)) {
                    setLogs(histData.slice(0, 5));
                } else if (histData?.results) {
                    setLogs(histData.results);
                }
            } catch (e) {
                console.error("Profile fetch failed", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatNumber = (num) => {
        if (num > 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num > 1000) return (num / 1000).toFixed(1) + 'K';
        return num;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="bg-[#0a0a0a] min-h-screen text-white flex items-center justify-center">
                <Navbar />
                <div className="text-zinc-500 text-sm animate-pulse">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="bg-[#0a0a0a] min-h-screen text-white overflow-x-hidden">
            <Navbar />

            <div className="pt-24 px-4 md:px-12 max-w-6xl mx-auto pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    {/* LEFT: Profile Card */}
                    <div className="md:col-span-1 space-y-5">
                        <div className={`bg-[#141414] border-2 ${isAdmin ? 'border-red-600' : 'border-zinc-800'} rounded-lg p-6 relative overflow-hidden`}>
                            {/* Subtle grid background */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.8)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className={`w-24 h-24 rounded-full border-4 ${isAdmin ? 'border-red-600' : 'border-blue-500'} flex items-center justify-center bg-black mb-4`}>
                                    {isAdmin ? <Shield className="w-12 h-12 text-red-600" /> : <User className="w-12 h-12 text-blue-500" />}
                                </div>

                                <h2 className="text-2xl font-bold tracking-wide uppercase">
                                    {profile?.username || user?.username || 'User'}
                                </h2>

                                {/* Full Name */}
                                {(profile?.first_name || profile?.last_name) && (
                                    <p className="text-sm text-zinc-400 mt-1">
                                        {[profile.first_name, profile.last_name].filter(Boolean).join(' ')}
                                    </p>
                                )}

                                <div className={`px-3 py-1 rounded text-[10px] font-bold mt-3 border ${isAdmin ? 'bg-red-900/20 border-red-600 text-red-500' : 'bg-blue-900/20 border-blue-500 text-blue-400'}`}>
                                    {isAdmin ? 'ADMINISTRATOR' : 'STANDARD USER'}
                                </div>

                                <button
                                    onClick={logout}
                                    className="w-full mt-6 bg-red-600/10 hover:bg-red-600/30 border border-red-600 text-red-500 py-2.5 rounded text-xs font-bold tracking-widest uppercase transition-colors"
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>

                        {/* Account Details Card */}
                        <div className="bg-[#141414] border border-zinc-800 rounded-lg p-5 space-y-4">
                            <h3 className="text-sm font-bold text-zinc-400 flex items-center gap-2 mb-4">
                                <Key className="w-4 h-4" /> Account Details
                            </h3>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 py-2 border-b border-zinc-900">
                                    <Mail className="w-4 h-4 text-zinc-600 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Email</p>
                                        <p className="text-sm text-white truncate">{profile?.email || 'Not available'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 py-2 border-b border-zinc-900">
                                    <Calendar className="w-4 h-4 text-zinc-600 shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Member Since</p>
                                        <p className="text-sm text-white">{formatDate(profile?.date_joined)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 py-2 border-b border-zinc-900">
                                    <Lock className="w-4 h-4 text-zinc-600 shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Authentication</p>
                                        <p className="text-sm text-white">{profile?.auth_type || 'Password'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 py-2 border-b border-zinc-900">
                                    <Activity className="w-4 h-4 text-zinc-600 shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Account Status</p>
                                        <p className={`text-sm font-bold ${profile?.is_active !== false ? 'text-green-500' : 'text-red-500'}`}>
                                            {profile?.is_active !== false ? '● Active' : '● Suspended'}
                                        </p>
                                    </div>
                                </div>

                                {profile?.team && (
                                    <div className="flex items-center gap-3 py-2">
                                        <Users className="w-4 h-4 text-zinc-600 shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Team</p>
                                            <p className="text-sm text-white">
                                                {profile.team.name}
                                                <span className="text-[10px] text-zinc-500 ml-2">({profile.team.role})</span>
                                            </p>
                                        </div>
                                    </div>
                                )}
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
                                    <div className="text-2xl font-bold">{stat.val}</div>
                                    <div className="text-[10px] text-gray-500 tracking-widest">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Activity Panel */}
                        <div className="bg-[#141414] border border-zinc-800 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Recent Activity
                                </h3>
                                <a href="/dashboard" className="text-[10px] text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                                    View All <ChevronRight className="w-3 h-3" />
                                </a>
                            </div>
                            <div className="space-y-0 text-xs font-mono text-gray-500 border-l border-zinc-800 pl-4 relative">
                                {logs.length === 0 ? (
                                    <div className="pb-4 relative">
                                        <div className="text-gray-600 italic ml-2 py-8 text-center">
                                            No activity recorded. Generate a wordlist to see your activity here.
                                        </div>
                                    </div>
                                ) : (
                                    logs.map((log, i) => (
                                        <div key={log.id || i} className="pb-6 relative last:pb-0">
                                            <div className="absolute -left-[21px] top-1 w-2 h-2 bg-zinc-600 rounded-full border border-black"></div>
                                            <div className="text-gray-300 font-bold">
                                                Generation #{log.id}: {log.pii_data?.full_name || log.pii_data?.username || 'Unknown Target'}
                                            </div>
                                            <div className="mt-1 flex gap-2 opacity-50">
                                                <span>{new Date(log.timestamp).toLocaleString()}</span>
                                                <span>•</span>
                                                <span className="font-mono text-zinc-400">{log.wordlist_count || '?'} words</span>
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
