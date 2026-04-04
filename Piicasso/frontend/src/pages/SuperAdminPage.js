import React, { useEffect, useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ModeContext } from '../context/ModeContext';
import axios from '../api/axios';
import { ShieldAlert, Users, Database, TerminalSquare, Trash2, Activity, Server, Unlock, Ban, CheckCircle2, KeyRound, Eye, X, Mail, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';

const SuperAdminPage = () => {
    const { user, isAuthenticated } = useContext(AuthContext);
    const [data, setData] = useState({ users: [], logs: [], activities: [], total_generations: 0 });
    const { mode: appMode } = useContext(ModeContext) || { mode: 'security' };
    const isSecurityMode = appMode === 'security';

    const theme = {
        card: isSecurityMode ? 'security-card' : 'user-glass-panel',
        cardDark: isSecurityMode ? 'bg-black/50 border border-white/10' : 'bg-black/20 border border-white/10',
        accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
        accentBg: isSecurityMode ? 'bg-security-red' : 'bg-user-cobalt',
        inputBg: isSecurityMode ? 'bg-black/50 border border-white/10 focus-within:border-security-red/50 text-white' : 'bg-white/5 border border-white/10 focus-within:border-user-cobalt/50 text-white',
        btnPrimary: isSecurityMode ? 'security-btn-primary' : 'user-btn-primary',
        btnSecondary: isSecurityMode ? 'bg-black/50 text-white border border-white/10 hover:bg-white/10' : 'bg-white/10 text-white border border-white/10 hover:bg-white/20',
        textMuted: isSecurityMode ? 'text-security-muted' : 'text-user-muted',
        border: isSecurityMode ? 'border-security-red/20' : 'border-user-cobalt/20',
        borderMuted: isSecurityMode ? 'border-white/10' : 'border-white/10',
        hoverBg: isSecurityMode ? 'hover:bg-security-red/10' : 'hover:bg-user-cobalt/10',
        tableHeader: isSecurityMode ? 'bg-black/60 text-security-muted' : 'bg-black/30 text-user-muted',
        tableRowHover: isSecurityMode ? 'hover:bg-white/5' : 'hover:bg-white/10',
        sidebarActive: isSecurityMode ? 'bg-security-red/20 text-security-red border border-security-red/50' : 'bg-user-cobalt/20 text-user-cobalt border border-user-cobalt/50',
    };

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('users');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Modals & Action State
    const [selectedUser, setSelectedUser] = useState(null);
    const [generations, setGenerations] = useState([]);
    const [showGenerationsModal, setShowGenerationsModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // System Settings State
    const [settings, setSettings] = useState([]);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsSaving, setSettingsSaving] = useState({});

    // Default settings definitions
    const SETTING_DEFINITIONS = [
        { key: 'strict_security', label: 'Strict Security', description: 'Force all users to sign in again after 15 minutes of inactivity.', type: 'toggle', default: 'false' },
        { key: 'generation_speed', label: 'Generation Speed', description: 'Change the speed priority for generating new wordlists.', type: 'select', options: ['high', 'normal', 'slow'], default: 'normal' },
        { key: 'max_wordlist_size', label: 'Max Wordlist Size', description: 'Maximum number of passwords per generation.', type: 'number', default: '1000' },
        { key: 'registration_enabled', label: 'Registration Enabled', description: 'Allow new users to register accounts.', type: 'toggle', default: 'true' },
        { key: 'maintenance_mode', label: 'Maintenance Mode', description: 'Put the system in maintenance mode. Only admins can access.', type: 'toggle', default: 'false' },
    ];

    useEffect(() => {
        if (user?.is_superuser) {
            fetchAdminData();
            fetchSettings();
            const interval = setInterval(fetchAdminData, 10000);
            return () => clearInterval(interval);
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchAdminData = async () => {
        try {
            const res = await axios.get('admin/');
            setData(res.data);
            setError('');
        } catch (err) {
            setError('Connection dropped or unauthorized.');
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        setSettingsLoading(true);
        try {
            const res = await axios.get('operations/settings/');
            setSettings(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            // Settings might not exist yet
        } finally {
            setSettingsLoading(false);
        }
    };

    const getSettingValue = (key) => {
        const setting = settings.find(s => s.key === key);
        if (setting) return setting.value;
        const def = SETTING_DEFINITIONS.find(d => d.key === key);
        return def?.default || '';
    };

    const updateSetting = async (key, value, description = '') => {
        setSettingsSaving(prev => ({ ...prev, [key]: true }));
        try {
            await axios.post('operations/settings/', { key, value: String(value), description });
            await fetchSettings();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update setting.');
        } finally {
            setSettingsSaving(prev => ({ ...prev, [key]: false }));
        }
    };

    const deleteUser = async (userId, username) => {
        if (window.confirm(`Delete user: ${username}? This cannot be undone.`)) {
            try {
                await axios.delete(`admin/?user_id=${userId}`);
                fetchAdminData();
            } catch (err) {
                alert(err.response?.data?.error || 'Delete failed.');
            }
        }
    };

    const toggleUserBlock = async (userId, username, isCurrentlyActive) => {
        const action = isCurrentlyActive ? 'block' : 'unblock';
        if (window.confirm(`Are you sure you want to ${action} ${username}?`)) {
            try {
                const res = await axios.post('admin/', { action, user_id: userId });
                alert(res.data.message);
                fetchAdminData();
            } catch (err) {
                alert(err.response?.data?.error || 'Action failed.');
            }
        }
    };

    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('admin/', { action: 'change_password', user_id: selectedUser.id, new_password: newPassword });
            alert(res.data.message);
            setShowPasswordModal(false);
            setNewPassword('');
            fetchAdminData();
        } catch (err) {
            alert(err.response?.data?.error || 'Action failed.');
        }
    };

    const viewUserGenerations = async (userId, username) => {
        try {
            const res = await axios.get(`admin/?action=get_generations&user_id=${userId}`);
            setGenerations(res.data.generations || []);
            setSelectedUser({ id: userId, username });
            setShowGenerationsModal(true);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to fetch generations.');
        }
    };

    const handleDeleteAllData = async () => {
        const confirm1 = window.prompt('Type "DELETE ALL DATA" to confirm this destructive action:');
        if (confirm1 !== 'DELETE ALL DATA') {
            alert('Confirmation did not match. Aborted.');
            return;
        }
        // This would need a backend endpoint — for now show a message
        alert('This feature requires additional server-side implementation for safety. Contact your system administrator.');
    };

    if (!isAuthenticated || !user?.is_superuser) {
        return <Navigate to="/" replace />;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center font-mono text-xl animate-pulse tracking-widest">
                <Unlock className={`w-8 h-8 mr-4 ${theme.accentColor}`} /> <span className={theme.textMuted}>Authenticating Admin Access...</span>
            </div>
        );
    }

    return (
        <div className="bg-transparent min-h-screen text-white font-sans flex flex-col pt-16">
            <Navbar />

            <div className="flex-1 w-full flex overflow-hidden relative">
                {/* Mobile sidebar toggle */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={`lg:hidden fixed bottom-6 left-6 z-50 ${theme.accentBg} text-white p-3 rounded-full shadow-lg transition-colors`}
                >
                    <ShieldAlert className="w-5 h-5" />
                </button>

                {/* Mobile sidebar overlay */}
                {sidebarOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
                )}

                {/* Admin Sidebar Navigation */}
                <div className={`
                    fixed lg:relative inset-y-0 left-0 z-40 w-64 ${theme.card} !rounded-none !border-y-0 !border-l-0 !border-r ${theme.border} flex flex-col p-4 shrink-0
                    transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    pt-20 lg:pt-4
                `}>
                    <div className={`pb-8 pt-4 border-b ${theme.borderMuted}`}>
                        <h2 className={`text-xl font-bold tracking-widest uppercase flex items-center gap-2 ${theme.accentColor}`}>
                            <ShieldAlert className="w-5 h-5" />
                            System Admin
                        </h2>
                        <div className={`text-[10px] ${theme.textMuted} mt-2 uppercase tracking-widest font-mono`}>Administrative Access</div>
                    </div>

                    <div className="flex flex-col gap-2 mt-6">
                        {[
                            { id: 'users', icon: Users, label: 'Users List' },
                            { id: 'intelligence', icon: Activity, label: 'Activity Logs' },
                            { id: 'config', icon: Server, label: 'System Settings' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                                className={`flex items-center gap-3 p-3 rounded-md text-sm transition-all font-semibold uppercase tracking-wide
                                    ${activeTab === tab.id ? theme.sidebarActive : `${theme.textMuted} hover:text-white ${theme.hoverBg}`}
                                `}
                            >
                                <tab.icon className="w-4 h-4" /> {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto pb-4 text-[10px] font-mono uppercase tracking-widest text-green-400 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        Terminal Online
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {/* Top Status Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                        <div className={`${theme.card} p-5 rounded-xl`}>
                            <p className={`text-[10px] font-mono tracking-widest uppercase ${theme.textMuted}`}>Total Users</p>
                            <h3 className="text-3xl font-bold mt-2 text-white">{data.users.length}</h3>
                        </div>
                        <div className={`${theme.card} p-5 rounded-xl`}>
                            <p className={`text-[10px] font-mono tracking-widest uppercase ${theme.textMuted}`}>Total Wordlists</p>
                            <h3 className="text-3xl font-bold mt-2 text-white">{data.total_generations}</h3>
                        </div>
                        <div className={`${theme.card} p-5 rounded-xl`}>
                            <p className={`text-[10px] font-mono tracking-widest uppercase ${theme.textMuted}`}>Total Activity</p>
                            <h3 className="text-3xl font-bold mt-2 text-white">{data.activities.length}</h3>
                        </div>
                        <div className={`${theme.card} p-5 rounded-xl`}>
                            <p className={`text-[10px] font-mono tracking-widest uppercase ${theme.textMuted}`}>Server State</p>
                            <h3 className="text-xl font-bold mt-3 text-green-500 animate-pulse tracking-widest">SECURE</h3>
                        </div>
                    </div>

                    {/* Tab: Users */}
                    {activeTab === 'users' && (
                        <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                            <h3 className={`text-xl font-bold mb-4 tracking-widest uppercase flex items-center gap-2 ${theme.accentColor}`}>
                                <Users className="w-5 h-5" /> Global User Directory
                            </h3>
                            <p className={`text-sm ${theme.textMuted} mb-6`}>
                                Complete overview of all registered users. Manage access, passwords, and view generation history.
                            </p>

                            <div className={`${theme.card} !p-0 overflow-hidden`}>
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left text-sm min-w-[800px]">
                                        <thead className={`${theme.tableHeader} text-xs uppercase tracking-wider font-mono`}>
                                            <tr>
                                                <th className={`px-6 py-4 border-b ${theme.borderMuted}`}>User ID</th>
                                                <th className={`px-6 py-4 border-b ${theme.borderMuted}`}>Role</th>
                                                <th className={`px-6 py-4 border-b ${theme.borderMuted}`}>Location</th>
                                                <th className={`px-6 py-4 border-b ${theme.borderMuted}`}>Auth</th>
                                                <th className={`px-6 py-4 border-b ${theme.borderMuted}`}>Status</th>
                                                <th className={`px-6 py-4 border-b ${theme.borderMuted} text-right`}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${theme.borderMuted}`}>
                                            {data.users.map((u) => (
                                                <tr key={u.id} className={`transition-colors group ${theme.tableRowHover}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className={u.is_superuser ? `font-bold ${theme.accentColor}` : 'text-white/80 group-hover:text-white font-medium'}>
                                                                {u.username}
                                                            </span>
                                                            <span className={`text-[10px] font-mono mt-0.5 ${theme.textMuted}`}>{u.email || 'No email'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded bg-black/40 border text-[10px] font-bold uppercase tracking-wider ${u.is_superuser ? `border-${isSecurityMode?'red':'blue'}-500/50 ${theme.accentColor}` : 'border-white/10 text-white/50'}`}>
                                                            {u.is_superuser ? 'Admin' : 'Standard'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[11px] font-mono ${theme.textMuted}`}>{u.location || 'Unknown'}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[10px] font-mono ${theme.textMuted}`}>{u.pass_display || 'N/A'}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {u.is_active ? (
                                                            <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>Active</span>
                                                        ) : (
                                                            <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>Blocked</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {!u.is_superuser ? (
                                                            <div className="flex justify-end gap-2 items-center">
                                                                <button onClick={() => viewUserGenerations(u.id, u.username)} className={`text-white/40 hover:text-white p-2 ${theme.hoverBg} rounded-full transition-all`} title={`View Generations (${u.generation_count || 0})`}>
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => { setSelectedUser(u); setShowPasswordModal(true); }} className={`text-white/40 hover:text-amber-400 p-2 hover:bg-amber-400/10 rounded-full transition-all`} title="Change Password">
                                                                    <KeyRound className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => toggleUserBlock(u.id, u.username, u.is_active)} className={`p-2 rounded-full transition-all ${u.is_active ? 'text-white/40 hover:text-orange-500 hover:bg-orange-500/10' : 'text-white/40 hover:text-green-400 hover:bg-green-400/10'}`} title={u.is_active ? "Block" : "Unblock"}>
                                                                    {u.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                                                </button>
                                                                <button onClick={() => window.location.href = `/inbox?recipient=${u.id}`} className={`text-white/40 hover:text-white p-2 ${theme.hoverBg} rounded-full transition-all`} title="Message">
                                                                    <Mail className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => deleteUser(u.id, u.username)} className={`text-white/40 hover:text-red-500 p-2 hover:bg-red-500/10 rounded-full transition-all`} title="Delete">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className={`text-[10px] uppercase font-mono tracking-widest ${theme.textMuted} opacity-50 block p-2`}>SYSADMIN</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Activity Logs */}
                    {activeTab === 'intelligence' && (
                        <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                            <h3 className={`text-xl font-bold mb-4 tracking-widest flex items-center gap-2 uppercase ${theme.accentColor}`}>
                                <Activity className="w-5 h-5" /> Activity Intelligence
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Activity Log */}
                                <div className={`${theme.card} !p-0 h-[600px] flex flex-col overflow-hidden`}>
                                    <div className={`${theme.tableHeader} p-4 border-b ${theme.borderMuted} text-xs font-bold uppercase tracking-widest flex justify-between items-center`}>
                                        <span>Terminal Stream ({data.activities.length} records)</span>
                                        <div className="flex gap-2">
                                            <div className={`w-2 h-2 rounded-full ${theme.accentBg} animate-pulse shadow-[0_0_8px_currentColor]`}></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-5 overflow-y-auto space-y-4 font-mono text-[11px] custom-scrollbar bg-black/20">
                                        {data.activities.length === 0 ? (
                                            <div className={`text-center mt-20 ${theme.textMuted} uppercase tracking-widest`}>No intelligence gathered yet.</div>
                                        ) : (
                                            data.activities.map((act) => (
                                                <div key={act.id} className={`border-l-2 ${theme.border} pl-4 py-1 relative group`}>
                                                    <div className={`absolute -left-[7px] top-2 w-3 h-3 rounded-full bg-black border ${theme.border} group-hover:bg-white/20 transition-colors`}></div>
                                                    <div className="flex justify-between items-center text-white/60 mb-1">
                                                        <span>{new Date(act.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${
                                                            act.activity_type === 'LOGIN' ? 'bg-blue-500/20 text-blue-400' :
                                                            act.activity_type === 'GENERATE' ? 'bg-amber-500/20 text-amber-400' :
                                                            act.activity_type === 'BREACH' ? 'bg-red-500/20 text-red-400' :
                                                            'bg-white/10 text-white/70'
                                                        }`}>
                                                            {act.activity_type}
                                                        </span>
                                                    </div>
                                                    <div className="text-white mt-1 text-sm">{act.description}</div>
                                                    <div className={`mt-2 ${theme.textMuted} text-[10px] flex gap-4`}>
                                                        <span>GEO: {act.city || 'Unknown'}</span>
                                                        <span>COORD: {act.latitude !== 999 ? `${act.latitude?.toFixed(4)}, ${act.longitude?.toFixed(4)}` : 'N/A'}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Statistics */}
                                <div className="space-y-6">
                                    <div className={`${theme.card} p-6 relative overflow-hidden group`}>
                                        <div className={`absolute inset-0 ${theme.accentBg} opacity-0 group-hover:opacity-5 transition-opacity`} />
                                        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Activity Vectors</h4>
                                        <div className="space-y-5">
                                            {['LOGIN', 'GENERATE', 'TEAM_JOIN', 'CONFIG'].map(type => {
                                                const count = data.activities.filter(a => a.activity_type === type).length;
                                                const pct = data.activities.length > 0 ? (count / data.activities.length * 100) : 0;
                                                return (
                                                    <div key={type}>
                                                        <div className={`flex justify-between text-[10px] font-mono tracking-widest uppercase mb-2 ${theme.textMuted}`}>
                                                            <span>{type}</span>
                                                            <span className="text-white">{count} ({pct.toFixed(0)}%)</span>
                                                        </div>
                                                        <div className="h-1.5 bg-black/40 border border-white/5 rounded-full overflow-hidden">
                                                            <div className={`h-full ${theme.accentBg} transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className={`${theme.card} p-6`}>
                                        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Network Status</h4>
                                        <div className="space-y-4 text-sm font-medium">
                                            <div className={`flex justify-between items-center py-2.5 border-b ${theme.borderMuted}`}>
                                                <span className={theme.textMuted}>Active Nodes (Users)</span>
                                                <span className="text-white font-mono bg-white/10 px-3 py-1 rounded">{data.users.filter(u => u.is_active).length}</span>
                                            </div>
                                            <div className={`flex justify-between items-center py-2.5 border-b ${theme.borderMuted}`}>
                                                <span className={theme.textMuted}>Restricted Nodes</span>
                                                <span className="text-red-400 font-mono bg-red-500/10 px-3 py-1 rounded border border-red-500/20">{data.users.filter(u => !u.is_active).length}</span>
                                            </div>
                                            <div className={`flex justify-between items-center py-2.5 border-b ${theme.borderMuted}`}>
                                                <span className={theme.textMuted}>Elevated Access (Admins)</span>
                                                <span className="text-white font-mono bg-white/10 px-3 py-1 rounded">{data.users.filter(u => u.is_superuser).length}</span>
                                            </div>
                                            <div className={`flex justify-between items-center py-2.5`}>
                                                <span className={theme.textMuted}>Data Packets (Wordlists)</span>
                                                <span className="text-white font-mono bg-white/10 px-3 py-1 rounded">{data.total_generations}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: System Settings */}
                    {activeTab === 'config' && (
                        <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 max-w-4xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-xl font-bold tracking-widest flex items-center gap-2 uppercase ${theme.accentColor}`}>
                                    <TerminalSquare className="w-5 h-5" /> Global Configuration
                                </h3>
                                <button
                                    onClick={fetchSettings}
                                    className={`text-white/50 hover:text-white p-2 rounded-full ${theme.hoverBg} transition-colors`}
                                    title="Refresh Configuration"
                                >
                                    <RefreshCw className={`w-4 h-4 ${settingsLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                            <p className={`text-sm ${theme.textMuted} mb-8`}>
                                Configure core system parameters. Modifications are broadcasted immediately across the network.
                            </p>

                            <div className="space-y-4">
                                {SETTING_DEFINITIONS.map(def => {
                                    const currentValue = getSettingValue(def.key);
                                    const isSaving = settingsSaving[def.key];

                                    return (
                                        <div key={def.key} className={`${theme.card} p-6`}>
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                                <div className="max-w-xl">
                                                    <h4 className="font-bold text-white text-sm tracking-wide">{def.label}</h4>
                                                    <p className={`text-xs mt-1.5 leading-relaxed ${theme.textMuted}`}>{def.description}</p>
                                                </div>
                                                
                                                {def.type === 'toggle' && (
                                                    <button
                                                        onClick={() => updateSetting(def.key, currentValue === 'true' ? 'false' : 'true', def.description)}
                                                        disabled={isSaving}
                                                        className={`px-6 py-2.5 text-[10px] uppercase font-bold tracking-widest rounded-md transition-all shrink-0 border ${
                                                            currentValue === 'true'
                                                                ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                                                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                                                        } ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
                                                    >
                                                        {isSaving ? '...' : currentValue === 'true' ? 'Active' : 'Offline'}
                                                    </button>
                                                )}
                                                
                                                {def.type === 'select' && (
                                                    <select
                                                        value={currentValue || def.default}
                                                        onChange={(e) => updateSetting(def.key, e.target.value, def.description)}
                                                        disabled={isSaving}
                                                        className={`${theme.inputBg} text-xs px-4 py-2.5 rounded-md focus:outline-none shrink-0 font-medium tracking-wide uppercase min-w-[140px] appearance-none`}
                                                    >
                                                        {def.options.map(opt => (
                                                            <option key={opt} value={opt} className="bg-[#141414]">{opt}</option>
                                                        ))}
                                                    </select>
                                                )}
                                                
                                                {def.type === 'number' && (
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <input
                                                            type="number"
                                                            defaultValue={currentValue || def.default}
                                                            onBlur={(e) => {
                                                                if (e.target.value !== currentValue) {
                                                                    updateSetting(def.key, e.target.value, def.description);
                                                                }
                                                            }}
                                                            className={`${theme.inputBg} text-sm font-mono px-4 py-2.5 rounded-md w-32 focus:outline-none text-center`}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Danger Zone */}
                                <div className={`border border-red-500/30 bg-red-950/10 rounded-xl p-6 mt-10 relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                                        <div>
                                            <h4 className="font-bold text-red-500 text-sm flex items-center gap-2 uppercase tracking-wider">
                                                <AlertTriangle className="w-4 h-4" /> Purge Protocol
                                            </h4>
                                            <p className="text-xs text-red-200/50 mt-1.5 max-w-md leading-relaxed">
                                                Permanently incinerate all user accounts, wordlists, and intelligence logs. This operation cannot be rolled back.
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleDeleteAllData}
                                            className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/50 px-6 py-3 text-[10px] font-bold rounded-md shadow-[0_0_20px_rgba(220,38,38,0.1)] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all uppercase tracking-widest shrink-0"
                                        >
                                            Execute Purge
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className={`${theme.card} !p-0 w-full max-w-md overflow-hidden`}>
                        <div className={`flex justify-between items-center p-5 border-b ${theme.borderMuted} bg-black/40`}>
                            <h3 className="font-bold text-white flex items-center gap-2 tracking-widest uppercase text-sm">
                                <KeyRound className={`w-4 h-4 ${theme.accentColor}`} />
                                Override Auth Token
                            </h3>
                            <button onClick={() => setShowPasswordModal(false)} className={`${theme.textMuted} hover:text-white transition-colors`}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleChangePasswordSubmit} className="p-6">
                            <p className={`text-sm ${theme.textMuted} mb-6`}>
                                Issue new credentials for node: <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded ml-1">{selectedUser.username}</span>
                            </p>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New Auth Token..."
                                className={`w-full ${theme.inputBg} rounded-lg p-3 text-sm transition-all outline-none font-mono mb-8`}
                                required
                                minLength={6}
                            />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowPasswordModal(false)} className={`px-5 py-2.5 text-xs font-bold rounded-md uppercase tracking-wider ${theme.btnSecondary}`}>
                                    Abort
                                </button>
                                <button type="submit" className={`px-5 py-2.5 text-xs font-bold rounded-md uppercase tracking-wider ${theme.btnPrimary} !border-none`}>
                                    Deploy Token
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Generations Modal */}
            {showGenerationsModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className={`${theme.card} !p-0 w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden`}>
                        <div className={`flex justify-between items-center p-5 border-b ${theme.borderMuted} bg-black/40 shrink-0`}>
                            <h3 className="font-bold text-white flex items-center gap-2 tracking-widest uppercase text-sm">
                                <Database className={`w-4 h-4 ${theme.accentColor}`} />
                                Data Packets: {selectedUser.username}
                            </h3>
                            <button onClick={() => setShowGenerationsModal(false)} className={`${theme.textMuted} hover:text-white transition-colors`}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                            {generations.length === 0 ? (
                                <div className={`text-center py-16 text-sm font-mono tracking-widest uppercase ${theme.textMuted}`}>No records found in cache.</div>
                            ) : (
                                <table className="w-full text-left text-sm font-mono">
                                    <thead className={`${theme.tableHeader} text-[10px] uppercase tracking-wider sticky top-0 z-10`}>
                                        <tr>
                                            <th className={`px-6 py-4 border-b ${theme.borderMuted}`}>Timestamp</th>
                                            <th className={`px-6 py-4 border-b ${theme.borderMuted}`}>IP Origin</th>
                                            <th className={`px-6 py-4 border-b ${theme.borderMuted}`}>Volume</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${theme.borderMuted} bg-black/20`}>
                                        {generations.map(g => (
                                            <tr key={g.id} className={`${theme.tableRowHover} transition-colors`}>
                                                <td className={`px-6 py-4 text-xs ${theme.textMuted}`}>
                                                    {new Date(g.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-white/80">{g.ip_address || 'N/A'}</td>
                                                <td className={`px-6 py-4 text-xs font-bold ${theme.accentColor}`}>{g.wordlist_count} entries</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminPage;
