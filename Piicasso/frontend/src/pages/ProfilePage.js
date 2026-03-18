import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';
import { motion } from 'framer-motion';
import {
    User, Shield, Activity, Lock, Database,
    Terminal, Clock, AlertTriangle, Mail, Calendar,
    Users, Key, Globe, ChevronRight, Edit3, Save, X, CheckCircle
} from 'lucide-react';

const ProfilePage = () => {
    const { user, logout } = useContext(AuthContext);
    const isAdmin = user?.is_superuser;

    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({ operations: 0, data_points: 0, uptime: '99.9%', threats: 0 });
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit mode
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '' });
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    // Password change
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

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
                    setEditForm({
                        first_name: profileRes.data.first_name || '',
                        last_name: profileRes.data.last_name || '',
                        email: profileRes.data.email || '',
                    });
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

    const handleSaveProfile = async () => {
        setSaving(true);
        setEditError('');
        setEditSuccess('');
        try {
            await axiosInstance.patch('profile/', editForm);
            setEditSuccess('Profile updated successfully!');
            setEditing(false);
            // Refresh profile
            const res = await axiosInstance.get('profile/');
            setProfile(res.data);
            setTimeout(() => setEditSuccess(''), 3000);
        } catch (err) {
            setEditError(err.response?.data?.error || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordForm.new_password !== passwordForm.confirm_password) {
            setPasswordError('New passwords do not match.');
            return;
        }
        if (passwordForm.new_password.length < 6) {
            setPasswordError('New password must be at least 6 characters.');
            return;
        }

        setSaving(true);
        try {
            await axiosInstance.patch('profile/', {
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password,
            });
            setPasswordSuccess('Password changed successfully!');
            setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
            setShowPasswordChange(false);
            setTimeout(() => setPasswordSuccess(''), 3000);
        } catch (err) {
            setPasswordError(err.response?.data?.error || 'Failed to change password.');
        } finally {
            setSaving(false);
        }
    };

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
                {/* Success messages */}
                {editSuccess && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 bg-green-900/20 border border-green-500/50 p-3 rounded flex items-center gap-3 text-sm text-green-200">
                        <CheckCircle className="w-4 h-4 text-green-500" /> {editSuccess}
                    </motion.div>
                )}
                {passwordSuccess && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 bg-green-900/20 border border-green-500/50 p-3 rounded flex items-center gap-3 text-sm text-green-200">
                        <CheckCircle className="w-4 h-4 text-green-500" /> {passwordSuccess}
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    {/* LEFT: Profile Card */}
                    <div className="md:col-span-1 space-y-5">
                        <div className={`bg-[#141414] border-2 ${isAdmin ? 'border-red-600' : 'border-zinc-800'} rounded-lg p-6 relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.8)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className={`w-24 h-24 rounded-full border-4 ${isAdmin ? 'border-red-600' : 'border-blue-500'} flex items-center justify-center bg-black mb-4`}>
                                    {isAdmin ? <Shield className="w-12 h-12 text-red-600" /> : <User className="w-12 h-12 text-blue-500" />}
                                </div>

                                <h2 className="text-2xl font-bold tracking-wide uppercase">
                                    {profile?.username || user?.username || 'User'}
                                </h2>

                                {(profile?.first_name || profile?.last_name) && (
                                    <p className="text-sm text-zinc-400 mt-1">
                                        {[profile.first_name, profile.last_name].filter(Boolean).join(' ')}
                                    </p>
                                )}

                                <div className={`px-3 py-1 rounded text-[10px] font-bold mt-3 border ${isAdmin ? 'bg-red-900/20 border-red-600 text-red-500' : 'bg-blue-900/20 border-blue-500 text-blue-400'}`}>
                                    {isAdmin ? 'ADMINISTRATOR' : 'STANDARD USER'}
                                </div>

                                <div className="w-full mt-6 space-y-2">
                                    <button
                                        onClick={() => { setEditing(!editing); setEditError(''); }}
                                        className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white py-2.5 rounded text-xs font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit3 className="w-3 h-3" /> {editing ? 'Cancel Edit' : 'Edit Profile'}
                                    </button>
                                    <button
                                        onClick={logout}
                                        className="w-full bg-red-600/10 hover:bg-red-600/30 border border-red-600 text-red-500 py-2.5 rounded text-xs font-bold tracking-widest uppercase transition-colors"
                                    >
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Edit Profile Form */}
                        {editing && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-[#141414] border border-zinc-800 rounded-lg p-5 space-y-4"
                            >
                                <h3 className="text-sm font-bold text-zinc-400 flex items-center gap-2 mb-4">
                                    <Edit3 className="w-4 h-4" /> Edit Profile
                                </h3>

                                {editError && (
                                    <div className="bg-red-900/20 border border-red-500/50 p-2 rounded text-xs text-red-300">{editError}</div>
                                )}

                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase tracking-wider">First Name</label>
                                    <input
                                        type="text"
                                        value={editForm.first_name}
                                        onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                                        className="w-full bg-black border border-zinc-700 rounded p-2 text-sm text-white focus:border-red-500 outline-none mt-1"
                                        placeholder="First name"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase tracking-wider">Last Name</label>
                                    <input
                                        type="text"
                                        value={editForm.last_name}
                                        onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                                        className="w-full bg-black border border-zinc-700 rounded p-2 text-sm text-white focus:border-red-500 outline-none mt-1"
                                        placeholder="Last name"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase tracking-wider">Email</label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full bg-black border border-zinc-700 rounded p-2 text-sm text-white focus:border-red-500 outline-none mt-1"
                                        placeholder="Email address"
                                    />
                                </div>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className="w-full bg-netflix-red hover:bg-red-700 text-white py-2 rounded text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Save className="w-3 h-3" /> {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </motion.div>
                        )}

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
                                    <div className="flex-1">
                                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Authentication</p>
                                        <p className="text-sm text-white">{profile?.auth_type || 'Password'}</p>
                                    </div>
                                    {profile?.has_usable_password && (
                                        <button
                                            onClick={() => setShowPasswordChange(!showPasswordChange)}
                                            className="text-[10px] text-netflix-red hover:text-red-400 font-bold"
                                        >
                                            Change
                                        </button>
                                    )}
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

                        {/* Password Change Form */}
                        {showPasswordChange && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-[#141414] border border-zinc-800 rounded-lg p-5 space-y-4"
                            >
                                <h3 className="text-sm font-bold text-zinc-400 flex items-center gap-2">
                                    <Lock className="w-4 h-4" /> Change Password
                                </h3>

                                {passwordError && (
                                    <div className="bg-red-900/20 border border-red-500/50 p-2 rounded text-xs text-red-300">{passwordError}</div>
                                )}

                                <input
                                    type="password"
                                    value={passwordForm.current_password}
                                    onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                    className="w-full bg-black border border-zinc-700 rounded p-2 text-sm text-white focus:border-red-500 outline-none"
                                    placeholder="Current password"
                                />
                                <input
                                    type="password"
                                    value={passwordForm.new_password}
                                    onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                    className="w-full bg-black border border-zinc-700 rounded p-2 text-sm text-white focus:border-red-500 outline-none"
                                    placeholder="New password"
                                />
                                <input
                                    type="password"
                                    value={passwordForm.confirm_password}
                                    onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                    className="w-full bg-black border border-zinc-700 rounded p-2 text-sm text-white focus:border-red-500 outline-none"
                                    placeholder="Confirm new password"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleChangePassword}
                                        disabled={saving}
                                        className="flex-1 bg-netflix-red hover:bg-red-700 text-white py-2 rounded text-xs font-bold disabled:opacity-50"
                                    >
                                        {saving ? 'Changing...' : 'Update Password'}
                                    </button>
                                    <button
                                        onClick={() => { setShowPasswordChange(false); setPasswordError(''); }}
                                        className="px-4 bg-zinc-800 text-zinc-400 py-2 rounded text-xs"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* RIGHT: Stats & History */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
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
