import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ModeContext } from '../context/ModeContext';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';
import { motion } from 'framer-motion';
import {
    User, Shield, Activity, Lock, Database,
    Terminal, Clock, AlertTriangle, Mail, Calendar,
    Users, Key, ChevronRight, Edit3, Save, CheckCircle
} from 'lucide-react';

const ProfilePage = () => {
    const { user, logout } = useContext(AuthContext);
    const { mode: appMode } = useContext(ModeContext) || { mode: 'security' };
    const isSecurityMode = appMode === 'security';

    const theme = {
        card: isSecurityMode ? 'security-card' : 'user-glass-panel',
        accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
        accentBg: isSecurityMode ? 'bg-security-red' : 'bg-user-cobalt',
        btnPrimary: isSecurityMode ? 'security-btn-primary' : 'user-btn-primary',
        btnSecondary: isSecurityMode ? 'bg-black/50 text-white border border-white/10 hover:bg-white/10' : 'bg-white/10 text-white border border-white/10 hover:bg-white/20',
        inputBg: isSecurityMode ? 'bg-black/50 border-white/10 focus-within:border-security-red/50' : 'bg-white/5 border-white/10 focus-within:border-user-cobalt/50',
        divider: isSecurityMode ? 'border-security-red/20' : 'border-user-cobalt/20',
        textMuted: isSecurityMode ? 'text-security-muted' : 'text-user-muted',
        textHighlight: 'text-white',
        successBg: isSecurityMode ? 'bg-green-900/20 border border-green-500/50 text-green-400' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400',
        errorBg: isSecurityMode ? 'bg-red-900/20 border border-red-500/50 text-red-400' : 'bg-red-500/10 border border-red-500/30 text-red-400',
    };

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
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <Navbar />
                <div className={`${theme.textMuted} text-sm flex items-center gap-3 animate-pulse`}>
                    <Activity className="w-5 h-5 animate-spin" /> Retrieving dossier...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent text-white font-sans">
            <Navbar />

            <div className="pt-24 px-4 md:px-8 lg:px-12 max-w-6xl mx-auto pb-20">
                
                {/* Header */}
                <div className="mb-8">
                    <h1 className={`text-2xl font-bold tracking-tight ${theme.textHighlight} uppercase`}>
                        {isSecurityMode ? 'Operator Dossier' : 'User Profile'}
                    </h1>
                    <p className={`${theme.textMuted} text-sm mt-1`}>
                        {isSecurityMode ? 'Classified access credentials and deployment history.' : 'Manage your account settings and view activity history.'}
                    </p>
                </div>

                {/* Notifications */}
                {editSuccess && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`mb-6 p-4 rounded-md flex items-center gap-3 text-sm font-medium ${theme.successBg}`}>
                        <CheckCircle className="w-5 h-5" /> {editSuccess}
                    </motion.div>
                )}
                {passwordSuccess && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`mb-6 p-4 rounded-md flex items-center gap-3 text-sm font-medium ${theme.successBg}`}>
                        <CheckCircle className="w-5 h-5" /> {passwordSuccess}
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    
                    {/* LEFT COLUMN: Profile Info & Forms */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* Profile Summary Card */}
                        <div className={`${theme.card} p-6 relative overflow-hidden flex flex-col items-center text-center`}>
                            <div className={`w-24 h-24 rounded-full border-4 ${isAdmin ? (isSecurityMode ? 'border-security-red' : 'border-user-cobalt') : 'border-white/10'} flex items-center justify-center mb-4 bg-black/40 shadow-inner relative z-10`}>
                                {isAdmin ? <Shield className={`w-10 h-10 ${theme.accentColor}`} /> : <User className={`w-10 h-10 text-white/50`} />}
                            </div>

                            <h2 className={`text-xl font-bold tracking-tight text-white relative z-10`}>
                                {profile?.username || user?.username || 'User'}
                            </h2>

                            {(profile?.first_name || profile?.last_name) && (
                                <p className={`${theme.textMuted} text-sm mt-1 relative z-10`}>
                                    {[profile.first_name, profile.last_name].filter(Boolean).join(' ')}
                                </p>
                            )}

                            <div className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase mt-4 border relative z-10 ${isAdmin ? `${theme.accentColor} ${theme.divider} bg-black/50` : `text-white/60 border-white/10 bg-black/30`}`}>
                                {isAdmin ? 'SYSTEM ADMINISTRATOR' : 'STANDARD USER'}
                            </div>

                            <div className="w-full mt-8 space-y-3 relative z-10">
                                <button
                                    onClick={() => { setEditing(!editing); setEditError(''); }}
                                    className={`w-full rounded-md text-sm font-semibold flex items-center justify-center gap-2 ${editing ? theme.btnSecondary : theme.btnPrimary} !py-2.5`}
                                >
                                    <Edit3 className="w-4 h-4" /> {editing ? 'Cancel Modification' : 'Modify Credentials'}
                                </button>
                                <button
                                    onClick={logout}
                                    className={`w-full py-2.5 rounded-md text-sm font-semibold transition-colors ${theme.btnSecondary} hover:text-red-500 hover:border-red-500/50`}
                                >
                                    Terminate Session
                                </button>
                            </div>
                        </div>

                        {/* Edit Profile Form */}
                        {editing && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className={`${theme.card} p-6 space-y-4`}
                            >
                                <h3 className={`text-sm font-bold flex items-center gap-2 mb-4 text-white uppercase tracking-wider`}>
                                    <Edit3 className={`w-4 h-4 ${theme.accentColor}`} /> Update Records
                                </h3>

                                {editError && (
                                    <div className={`p-3 rounded-md text-sm ${theme.errorBg}`}>{editError}</div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className={`text-[10px] font-mono uppercase tracking-wider mb-1.5 block ${theme.textMuted}`}>First Name</label>
                                        <input
                                            type="text"
                                            value={editForm.first_name}
                                            onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                                            className={`w-full rounded-md px-3 py-2 text-sm border outline-none transition-all ${theme.inputBg}`}
                                            placeholder="Enter first name"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[10px] font-mono uppercase tracking-wider mb-1.5 block ${theme.textMuted}`}>Last Name</label>
                                        <input
                                            type="text"
                                            value={editForm.last_name}
                                            onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                                            className={`w-full rounded-md px-3 py-2 text-sm border outline-none transition-all ${theme.inputBg}`}
                                            placeholder="Enter last name"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[10px] font-mono uppercase tracking-wider mb-1.5 block ${theme.textMuted}`}>Designated Email</label>
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                            className={`w-full rounded-md px-3 py-2 text-sm border outline-none transition-all ${theme.inputBg}`}
                                            placeholder="Enter email address"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className={`w-full mt-6 rounded-md text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 ${theme.btnPrimary} !py-2.5`}
                                >
                                    <Save className="w-4 h-4" /> {saving ? 'Writing to DB...' : 'Commit Changes'}
                                </button>
                            </motion.div>
                        )}

                        {/* Account Details Card */}
                        <div className={`${theme.card} p-6 space-y-4`}>
                            <h3 className={`text-sm font-bold flex items-center gap-2 mb-4 text-white uppercase tracking-wider`}>
                                <Key className={`w-4 h-4 ${theme.accentColor}`} /> Security Clearance
                            </h3>

                            <div className="space-y-0">
                                <div className={`flex items-center gap-4 py-3 border-b ${theme.divider}`}>
                                    <Mail className={`w-5 h-5 shrink-0 ${theme.textMuted}`} />
                                    <div className="min-w-0">
                                        <p className={`text-[10px] font-mono uppercase tracking-wider ${theme.textMuted}`}>Comms Link</p>
                                        <p className={`text-sm truncate mt-0.5 text-white`}>{profile?.email || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-4 py-3 border-b ${theme.divider}`}>
                                    <Calendar className={`w-5 h-5 shrink-0 ${theme.textMuted}`} />
                                    <div>
                                        <p className={`text-[10px] font-mono uppercase tracking-wider ${theme.textMuted}`}>Commissioned Date</p>
                                        <p className={`text-sm mt-0.5 text-white`}>{formatDate(profile?.date_joined)}</p>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-4 py-3 border-b ${theme.divider}`}>
                                    <Lock className={`w-5 h-5 shrink-0 ${theme.textMuted}`} />
                                    <div className="flex-1">
                                        <p className={`text-[10px] font-mono uppercase tracking-wider ${theme.textMuted}`}>Auth Protocol</p>
                                        <p className={`text-sm mt-0.5 text-white`}>{profile?.auth_type || 'Standard RSA'}</p>
                                    </div>
                                    {profile?.has_usable_password && (
                                        <button
                                            onClick={() => setShowPasswordChange(!showPasswordChange)}
                                            className={`text-[10px] font-mono uppercase tracking-widest ${theme.accentColor} hover:opacity-80 transition-opacity`}
                                        >
                                            [ Reset ]
                                        </button>
                                    )}
                                </div>

                                <div className={`flex items-center gap-4 py-3 ${profile?.team ? `border-b ${theme.divider}` : ''}`}>
                                    <Activity className={`w-5 h-5 shrink-0 ${theme.textMuted}`} />
                                    <div>
                                        <p className={`text-[10px] font-mono uppercase tracking-wider ${theme.textMuted}`}>Node Status</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className={`w-2 h-2 rounded-full ${profile?.is_active !== false ? 'bg-green-500 animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                                            <p className={`text-sm font-medium ${profile?.is_active !== false ? 'text-green-400' : 'text-red-500'}`}>
                                                {profile?.is_active !== false ? 'Online & Functional' : 'Offline / Compromised'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {profile?.team && (
                                    <div className="flex items-center gap-4 py-3">
                                        <Users className={`w-5 h-5 shrink-0 ${theme.textMuted}`} />
                                        <div>
                                            <p className={`text-[10px] font-mono uppercase tracking-wider ${theme.textMuted}`}>Squadron</p>
                                            <p className={`text-sm mt-0.5 text-white flex items-center gap-2`}>
                                                {profile.team.name}
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded border border-white/10 ${theme.textMuted} bg-black/40 uppercase`}>
                                                    {profile.team.role}
                                                </span>
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
                                className={`${theme.card} p-6 space-y-4`}
                            >
                                <h3 className={`text-sm font-bold flex items-center gap-2 mb-4 text-white uppercase tracking-wider`}>
                                    <Lock className={`w-4 h-4 ${theme.accentColor}`} /> Cipher Overwrite
                                </h3>

                                {passwordError && (
                                    <div className={`p-3 rounded-md text-sm ${theme.errorBg}`}>{passwordError}</div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className={`text-[10px] font-mono uppercase tracking-wider mb-1 block ${theme.textMuted}`}>Old Cipher</label>
                                        <input
                                            type="password"
                                            value={passwordForm.current_password}
                                            onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                            className={`w-full rounded-md px-3 py-2 text-sm border outline-none transition-colors ${theme.inputBg}`}
                                            placeholder="Enter old password"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[10px] font-mono uppercase tracking-wider mb-1 block ${theme.textMuted}`}>New Cipher</label>
                                        <input
                                            type="password"
                                            value={passwordForm.new_password}
                                            onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                            className={`w-full rounded-md px-3 py-2 text-sm border outline-none transition-colors ${theme.inputBg}`}
                                            placeholder="Enter new password"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[10px] font-mono uppercase tracking-wider mb-1 block ${theme.textMuted}`}>Verify Cipher</label>
                                        <input
                                            type="password"
                                            value={passwordForm.confirm_password}
                                            onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                            className={`w-full rounded-md px-3 py-2 text-sm border outline-none transition-colors ${theme.inputBg}`}
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-5">
                                    <button
                                        onClick={handleChangePassword}
                                        disabled={saving}
                                        className={`flex-1 rounded-md text-sm font-semibold disabled:opacity-50 ${theme.btnPrimary} !py-2.5`}
                                    >
                                        {saving ? 'Encrypting...' : 'Deploy Cipher'}
                                    </button>
                                    <button
                                        onClick={() => { setShowPasswordChange(false); setPasswordError(''); }}
                                        className={`px-4 rounded-md text-sm font-medium ${theme.btnSecondary} !py-2.5`}
                                    >
                                        Abort
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Stats & History */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Deployments', val: stats.operations, icon: Terminal, color: 'text-indigo-400' },
                                { label: 'Data Extracted', val: formatNumber(stats.data_points), icon: Database, color: theme.accentColor },
                                { label: 'System Uptime', val: stats.uptime, icon: Clock, color: 'text-emerald-400' },
                                { label: 'Anomalies', val: stats.threats || '0', icon: AlertTriangle, color: 'text-amber-400' },
                            ].map((stat, i) => (
                                <div key={i} className={`${theme.card} p-5 flex flex-col items-center justify-center text-center`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color} mb-3`} />
                                    <div className={`text-2xl font-bold tracking-tight text-white`}>{stat.val}</div>
                                    <div className={`text-[10px] font-mono tracking-widest uppercase mt-1 ${theme.textMuted}`}>{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Activity Panel */}
                        <div className={`${theme.card} p-6`}>
                            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                                <h3 className={`text-sm font-bold flex items-center gap-2 text-white uppercase tracking-wider`}>
                                    <Clock className={`w-4 h-4 ${theme.accentColor}`} /> Operation Log (Recent)
                                </h3>
                                <a href="/dashboard" className={`text-[10px] font-mono uppercase tracking-widest ${theme.accentColor} hover:opacity-80 flex items-center gap-1 transition-opacity`}>
                                    Full Archive <ChevronRight className="w-3.5 h-3.5" />
                                </a>
                            </div>
                            
                            <div className="space-y-0 relative pl-4">
                                {/* Timeline line */}
                                <div className={`absolute left-[5px] top-2 bottom-6 w-px border-l border-dashed ${theme.divider}`}></div>

                                {logs.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <Activity className={`w-8 h-8 mx-auto mb-3 opacity-20 ${theme.textMuted}`} />
                                        <p className={`text-[10px] font-mono uppercase tracking-widest ${theme.textMuted}`}>No tactical data present in local cache.</p>
                                    </div>
                                ) : (
                                    logs.map((log, i) => (
                                        <div key={log.id || i} className="pb-8 relative last:pb-2 group">
                                            {/* Timeline dot */}
                                            <div className={`absolute -left-[3px] top-1.5 w-3 h-3 rounded-full border bg-black ${theme.divider} group-hover:border-[${isSecurityMode ? '#dc2626' : '#3b82f6'}] transition-colors`}></div>
                                            
                                            <div className="ml-4">
                                                <div className={`text-sm font-medium text-white`}>
                                                    Operation <span className="font-mono text-[11px] opacity-70">#{log.id}</span> 
                                                    <span className={`font-normal ml-2 ${theme.textMuted} text-xs italic`}>
                                                        Target: {log.pii_data?.full_name || log.pii_data?.username || 'Redacted Entity'}
                                                    </span>
                                                </div>
                                                <div className={`mt-1.5 flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider ${theme.textMuted}`}>
                                                    <span>{new Date(log.timestamp).toLocaleString(undefined, {
                                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}</span>
                                                    <span className={`w-1 h-1 rounded-full bg-white/20`}></span>
                                                    <span className="text-white/50">{log.wordlist_count || '?'} lines generated</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {logs.length > 0 && (
                                <div className={`mt-6 pt-4 border-t text-center ${theme.divider}`}>
                                    <span className={`text-[9px] font-mono uppercase tracking-[0.2em] ${theme.textMuted}`}>End of Buffer</span>
                                </div>
                            )}
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
