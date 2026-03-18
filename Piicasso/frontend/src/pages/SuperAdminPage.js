import React, { useEffect, useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from '../api/axios';
import { ShieldAlert, Users, Database, TerminalSquare, Trash2, Activity, Server, Unlock, Ban, CheckCircle2, KeyRound, Eye, X, Mail, Save, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';

const SuperAdminPage = () => {
    const { user, isAuthenticated } = useContext(AuthContext);
    const [data, setData] = useState({ users: [], logs: [], activities: [], total_generations: 0 });
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
            <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-mono text-xl animate-pulse tracking-widest">
                <Unlock className="w-8 h-8 mr-4" /> Authenticating Admin Access...
            </div>
        );
    }

    return (
        <div className="bg-[#050505] min-h-screen text-white font-mono flex flex-col pt-16">
            <Navbar />

            <div className="flex-1 w-full flex overflow-hidden relative">
                {/* Mobile sidebar toggle */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden fixed bottom-6 left-6 z-50 bg-netflix-red text-white p-3 rounded-full shadow-lg shadow-red-900/50 hover:bg-red-700 transition-colors"
                >
                    <ShieldAlert className="w-5 h-5" />
                </button>

                {/* Mobile sidebar overlay */}
                {sidebarOpen && (
                    <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
                )}

                {/* Admin Sidebar Navigation */}
                <div className={`
                    fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-[#0a0a0a] border-r border-red-900/30 flex flex-col p-4 shadow-[5px_0_30px_rgba(229,9,20,0.05)] shrink-0
                    transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    pt-20 lg:pt-4
                `}>
                    <div className="pb-8 pt-4 border-b border-zinc-900">
                        <h2 className="text-xl font-bold tracking-widest text-netflix-red flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5" />
                            System Admin
                        </h2>
                        <div className="text-[10px] text-zinc-500 mt-2 uppercase">Administrative Access</div>
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
                                className={`flex items-center gap-3 p-3 rounded-sm text-sm transition-all ${activeTab === tab.id ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
                            >
                                <tab.icon className="w-4 h-4" /> {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto pb-4 text-xs text-green-500 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Connected
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {/* Top Status Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                        <div className="bg-black p-4 border border-zinc-900 rounded-sm">
                            <p className="text-[10px] text-zinc-500 uppercase">Total Users</p>
                            <h3 className="text-2xl font-bold mt-1 text-white">{data.users.length}</h3>
                        </div>
                        <div className="bg-black p-4 border border-zinc-900 rounded-sm">
                            <p className="text-[10px] text-zinc-500 uppercase">Total Wordlists</p>
                            <h3 className="text-2xl font-bold mt-1 text-white">{data.total_generations}</h3>
                        </div>
                        <div className="bg-black p-4 border border-zinc-900 rounded-sm">
                            <p className="text-[10px] text-zinc-500 uppercase">Total Activity</p>
                            <h3 className="text-2xl font-bold mt-1 text-white">{data.activities.length}</h3>
                        </div>
                        <div className="bg-black p-4 border border-zinc-900 rounded-sm">
                            <p className="text-[10px] text-zinc-500 uppercase">Server State</p>
                            <h3 className="text-lg font-bold mt-2 text-green-500 animate-pulse tracking-widest">ONLINE</h3>
                        </div>
                    </div>

                    {/* Tab: Users */}
                    {activeTab === 'users' && (
                        <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                            <h3 className="text-xl font-bold mb-4 tracking-widest flex items-center gap-2">
                                <Users className="text-netflix-red w-5 h-5" /> ALL USERS
                            </h3>
                            <p className="text-sm text-zinc-500 mb-6 font-sans">
                                Complete overview of all registered users. Manage access, passwords, and view generation history.
                            </p>

                            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-sm overflow-hidden shadow-xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm min-w-[800px]">
                                        <thead className="bg-[#111] text-zinc-500 text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4 border-b border-zinc-800">User ID</th>
                                                <th className="px-6 py-4 border-b border-zinc-800">Role</th>
                                                <th className="px-6 py-4 border-b border-zinc-800">Location</th>
                                                <th className="px-6 py-4 border-b border-zinc-800">Auth</th>
                                                <th className="px-6 py-4 border-b border-zinc-800">Status</th>
                                                <th className="px-6 py-4 border-b border-zinc-800 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-900">
                                            {data.users.map((u) => (
                                                <tr key={u.id} className="hover:bg-zinc-900 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className={u.is_superuser ? 'text-red-500 font-bold' : 'text-zinc-200 group-hover:text-white'}>
                                                                {u.username}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-600">{u.email || 'No email'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded bg-black border text-[10px] font-bold ${u.is_superuser ? 'border-red-900 text-red-500' : 'border-zinc-800 text-zinc-400'}`}>
                                                            {u.is_superuser ? 'Admin' : 'User'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] text-zinc-400">{u.location || 'Unknown'}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] text-zinc-500 font-mono">{u.pass_display || 'N/A'}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {u.is_active ? (
                                                            <span className="text-[10px] text-green-500 font-bold">ACTIVE</span>
                                                        ) : (
                                                            <span className="text-[10px] text-red-500 font-bold uppercase">BLOCKED</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {!u.is_superuser ? (
                                                            <div className="flex justify-end gap-2 items-center">
                                                                <button onClick={() => viewUserGenerations(u.id, u.username)} className="text-blue-500/50 hover:text-blue-500 p-2 hover:bg-blue-950/30 rounded-full transition-all" title={`View Generations (${u.generation_count || 0})`}>
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => { setSelectedUser(u); setShowPasswordModal(true); }} className="text-yellow-500/50 hover:text-yellow-500 p-2 hover:bg-yellow-950/30 rounded-full transition-all" title="Change Password">
                                                                    <KeyRound className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => toggleUserBlock(u.id, u.username, u.is_active)} className={`p-2 rounded-full transition-all ${u.is_active ? 'text-orange-500/50 hover:text-orange-500 hover:bg-orange-950/30' : 'text-green-500/50 hover:text-green-500 hover:bg-green-950/30'}`} title={u.is_active ? "Block" : "Unblock"}>
                                                                    {u.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                                                </button>
                                                                <button onClick={() => window.location.href = `/inbox?recipient=${u.id}`} className="text-white/50 hover:text-white p-2 hover:bg-zinc-800 rounded-full transition-all" title="Message">
                                                                    <Mail className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => deleteUser(u.id, u.username)} className="text-red-500/50 hover:text-red-500 p-2 hover:bg-red-950/30 rounded-full transition-all" title="Delete">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-red-500 uppercase tracking-widest opacity-20 block p-2">SYSTEM</span>
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
                            <h3 className="text-xl font-bold mb-4 tracking-widest flex items-center gap-2">
                                <Activity className="text-netflix-red w-5 h-5" /> ACTIVITY LOGS
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Activity Log */}
                                <div className="bg-black border border-zinc-900 rounded-sm h-[600px] flex flex-col shadow-xl">
                                    <div className="bg-[#111] p-3 border-b border-zinc-900 text-xs font-bold text-zinc-500 flex justify-between items-center">
                                        <span>ACTIVITY LOG ({data.activities.length} entries)</span>
                                        <div className="flex gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-[10px] custom-scrollbar">
                                        {data.activities.length === 0 ? (
                                            <div className="text-zinc-700 text-center mt-20">No activity yet...</div>
                                        ) : (
                                            data.activities.map((act) => (
                                                <div key={act.id} className="border-l border-zinc-800 pl-3 py-1">
                                                    <div className="flex justify-between text-zinc-600">
                                                        <span>{new Date(act.timestamp).toISOString()}</span>
                                                        <span className={
                                                            act.activity_type === 'LOGIN' ? 'text-blue-500' :
                                                            act.activity_type === 'GENERATE' ? 'text-yellow-500' :
                                                            act.activity_type === 'BREACH' ? 'text-red-500' :
                                                            'text-zinc-400'
                                                        }>
                                                            [{act.activity_type}]
                                                        </span>
                                                    </div>
                                                    <div className="text-zinc-300 mt-1">{act.description}</div>
                                                    <div className="text-zinc-600 mt-1 text-[9px]">
                                                        City: {act.city || 'Unknown'} | Coords: {act.latitude !== 999 ? `${act.latitude?.toFixed(2)}, ${act.longitude?.toFixed(2)}` : 'N/A'}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Statistics */}
                                <div className="space-y-6">
                                    <div className="bg-[#0a0a0a] border border-zinc-900 rounded-sm p-6 shadow-xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-red-900/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <h4 className="text-sm font-bold text-zinc-400 mb-2">Activity by Type</h4>
                                        <div className="space-y-3 mt-4">
                                            {['LOGIN', 'GENERATE', 'TEAM_JOIN', 'CONFIG'].map(type => {
                                                const count = data.activities.filter(a => a.activity_type === type).length;
                                                const pct = data.activities.length > 0 ? (count / data.activities.length * 100) : 0;
                                                return (
                                                    <div key={type}>
                                                        <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                                                            <span>{type}</span>
                                                            <span>{count} ({pct.toFixed(0)}%)</span>
                                                        </div>
                                                        <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                                                            <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="bg-[#0a0a0a] border border-zinc-900 rounded-sm p-6 shadow-xl">
                                        <h4 className="text-sm font-bold text-zinc-400 mb-4">System Info</h4>
                                        <div className="space-y-3 text-xs text-zinc-500">
                                            <div className="flex justify-between py-2 border-b border-zinc-900">
                                                <span>Active Users</span>
                                                <span className="text-white font-bold">{data.users.filter(u => u.is_active).length}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-zinc-900">
                                                <span>Blocked Users</span>
                                                <span className="text-red-400 font-bold">{data.users.filter(u => !u.is_active).length}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-zinc-900">
                                                <span>Admin Accounts</span>
                                                <span className="text-white font-bold">{data.users.filter(u => u.is_superuser).length}</span>
                                            </div>
                                            <div className="flex justify-between py-2">
                                                <span>Total Generations</span>
                                                <span className="text-white font-bold">{data.total_generations}</span>
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
                                <h3 className="text-xl font-bold tracking-widest flex items-center gap-2">
                                    <TerminalSquare className="text-netflix-red w-5 h-5" /> SYSTEM SETTINGS
                                </h3>
                                <button
                                    onClick={fetchSettings}
                                    className="text-zinc-500 hover:text-white p-2 rounded hover:bg-zinc-900 transition-colors"
                                    title="Refresh settings"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-sm text-zinc-500 mb-8 font-sans">
                                Configure system-wide settings. Changes apply immediately to all users.
                            </p>

                            <div className="space-y-4">
                                {SETTING_DEFINITIONS.map(def => {
                                    const currentValue = getSettingValue(def.key);
                                    const isSaving = settingsSaving[def.key];

                                    return (
                                        <div key={def.key} className="bg-black border border-zinc-900 rounded-sm p-6">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <div>
                                                    <h4 className="font-bold text-zinc-300 text-sm">{def.label}</h4>
                                                    <p className="text-xs text-zinc-600 mt-1">{def.description}</p>
                                                </div>
                                                
                                                {def.type === 'toggle' && (
                                                    <button
                                                        onClick={() => updateSetting(def.key, currentValue === 'true' ? 'false' : 'true', def.description)}
                                                        disabled={isSaving}
                                                        className={`px-6 py-2 text-xs font-bold rounded transition-all shrink-0 ${
                                                            currentValue === 'true'
                                                                ? 'bg-green-900/20 border border-green-600 text-green-500 hover:bg-green-900/40'
                                                                : 'bg-red-900/20 border border-red-900 text-red-500 hover:bg-red-900/40'
                                                        } ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
                                                    >
                                                        {isSaving ? '...' : currentValue === 'true' ? 'ENABLED' : 'DISABLED'}
                                                    </button>
                                                )}
                                                
                                                {def.type === 'select' && (
                                                    <select
                                                        value={currentValue || def.default}
                                                        onChange={(e) => updateSetting(def.key, e.target.value, def.description)}
                                                        disabled={isSaving}
                                                        className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs px-3 py-2 rounded focus:outline-none focus:border-red-500 shrink-0"
                                                    >
                                                        {def.options.map(opt => (
                                                            <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
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
                                                            className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs px-3 py-2 rounded w-28 focus:outline-none focus:border-red-500"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Danger Zone */}
                                <div className="bg-black border-2 border-red-900/50 rounded-sm p-6 mt-8">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <h4 className="font-bold text-red-500 text-sm">⚠ Delete All Data</h4>
                                            <p className="text-xs text-zinc-500 mt-1 max-w-md">
                                                Permanently delete all users, wordlists, and logs. This action is irreversible.
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleDeleteAllData}
                                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 text-xs font-bold rounded shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all uppercase tracking-widest shrink-0"
                                        >
                                            Delete Everything
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#0f0f0f] border border-zinc-800 rounded-sm shadow-2xl w-full max-w-md">
                        <div className="flex justify-between items-center p-4 border-b border-zinc-900 bg-black/50">
                            <h3 className="font-bold text-white flex items-center gap-2 tracking-widest">
                                <KeyRound className="w-4 h-4 text-netflix-red" />
                                OVERRIDE PASSWORD
                            </h3>
                            <button onClick={() => setShowPasswordModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleChangePasswordSubmit} className="p-6">
                            <p className="text-sm text-zinc-400 mb-6 font-sans">
                                Forcibly change password for: <span className="text-white font-bold">{selectedUser.username}</span>
                            </p>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New Password"
                                className="w-full bg-black/50 border border-zinc-700 rounded p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-900 transition-all outline-none font-mono mb-6"
                                required
                                minLength={6}
                            />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors">
                                    CANCEL
                                </button>
                                <button type="submit" className="bg-netflix-red text-white px-6 py-2 font-bold hover:bg-red-700 transition-all text-xs tracking-widest">
                                    CONFIRM
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Generations Modal */}
            {showGenerationsModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#0f0f0f] border border-zinc-800 rounded-sm shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-zinc-900 bg-black/50 shrink-0">
                            <h3 className="font-bold text-white flex items-center gap-2 tracking-widest">
                                <Database className="w-4 h-4 text-netflix-red" />
                                GENERATIONS: {selectedUser.username}
                            </h3>
                            <button onClick={() => setShowGenerationsModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 font-mono">
                            {generations.length === 0 ? (
                                <div className="text-center text-zinc-600 py-12">No records found.</div>
                            ) : (
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-[#111] text-zinc-500 uppercase">
                                        <tr>
                                            <th className="px-4 py-3 border-b border-zinc-800">Timestamp</th>
                                            <th className="px-4 py-3 border-b border-zinc-800">IP Origin</th>
                                            <th className="px-4 py-3 border-b border-zinc-800">Volume</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-900">
                                        {generations.map(g => (
                                            <tr key={g.id} className="hover:bg-zinc-900/50">
                                                <td className="px-4 py-3 text-zinc-400">{new Date(g.timestamp).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-red-500">{g.ip_address || 'N/A'}</td>
                                                <td className="px-4 py-3 text-green-500">{g.wordlist_count} words</td>
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
