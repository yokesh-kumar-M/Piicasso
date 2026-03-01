import React, { useEffect, useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from '../api/axios';
import { ShieldAlert, Users, Database, TerminalSquare, Trash2, Activity, Server, Unlock, Ban, CheckCircle2, KeyRound, Eye, X, Mail } from 'lucide-react';
import Navbar from '../components/Navbar';

const SuperAdminPage = () => {
    const { user, isAuthenticated } = useContext(AuthContext);
    const [data, setData] = useState({ users: [], logs: [], activities: [], total_generations: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('users');

    // Modals & Action State
    const [selectedUser, setSelectedUser] = useState(null);
    const [generations, setGenerations] = useState([]);
    const [showGenerationsModal, setShowGenerationsModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    useEffect(() => {
        if (user?.is_superuser) {
            fetchAdminData();
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

            <div className="flex-1 w-full flex overflow-hidden">
                {/* Admin Sidebar Navigation */}
                <div className="w-64 bg-[#0a0a0a] border-r border-red-900/30 flex flex-col p-4 shadow-[5px_0_30px_rgba(229,9,20,0.05)] z-10">
                    <div className="pb-8 pt-4 border-b border-zinc-900">
                        <h2 className="text-xl font-bold tracking-widest text-netflix-red flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5" />
                            System Admin
                        </h2>
                        <div className="text-[10px] text-zinc-500 mt-2 uppercase">Administrative Access</div>
                    </div>

                    <div className="flex flex-col gap-2 mt-6">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`flex items-center gap-3 p-3 rounded-sm text-sm transition-all ${activeTab === 'users' ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
                        >
                            <Users className="w-4 h-4" /> Users List
                        </button>
                        <button
                            onClick={() => setActiveTab('intelligence')}
                            className={`flex items-center gap-3 p-3 rounded-sm text-sm transition-all ${activeTab === 'intelligence' ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
                        >
                            <Activity className="w-4 h-4" /> Activity Logs
                        </button>
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`flex items-center gap-3 p-3 rounded-sm text-sm transition-all ${activeTab === 'config' ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
                        >
                            <Server className="w-4 h-4" /> System Settings
                        </button>
                    </div>

                    <div className="mt-auto pb-4 text-xs text-green-500 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Connected
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {/* Top Status Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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

                    {/* Tab Switching Logic */}
                    {activeTab === 'users' && (
                        <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                            <h3 className="text-xl font-bold mb-4 tracking-widest flex items-center gap-2">
                                <Users className="text-netflix-red w-5 h-5" /> ALL USERS
                            </h3>
                            <p className="text-sm text-zinc-500 mb-6 font-sans">
                                Complete overview of all users registered on the application. You can delete any user from here.
                            </p>

                            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-sm overflow-hidden shadow-xl">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#111] text-zinc-500 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 border-b border-zinc-800">User ID</th>
                                            <th className="px-6 py-4 border-b border-zinc-800">Role</th>
                                            <th className="px-6 py-4 border-b border-zinc-800">Location</th>
                                            <th className="px-6 py-4 border-b border-zinc-800">Auth / Password</th>
                                            <th className="px-6 py-4 border-b border-zinc-800">Status</th>
                                            <th className="px-6 py-4 border-b border-zinc-800 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-900">
                                        {data.users.map((u) => (
                                            <tr key={u.id} className="hover:bg-zinc-900 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className={u.username === 'Yokesh-superuser' ? 'text-red-500 font-bold' : 'text-zinc-200 group-hover:text-white'}>
                                                            {u.username}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-600">{u.email || 'No email provided'}</span>
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
                                                    <span className="text-[10px] text-zinc-500 font-mono tracking-tighter">{u.pass_display || 'N/A'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {u.is_active ? (
                                                        <span className="text-[10px] text-green-500 font-bold">ACTIVE</span>
                                                    ) : (
                                                        <span className="text-[10px] text-red-500 font-bold uppercase">BLOCKED</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {u.username !== 'Yokesh-superuser' ? (
                                                        <div className="flex justify-end gap-2 items-center">
                                                            <button
                                                                onClick={() => viewUserGenerations(u.id, u.username)}
                                                                className="text-blue-500/50 hover:text-blue-500 p-2 hover:bg-blue-950/30 rounded-full transition-all"
                                                                title={`View Generations (${u.generation_count || 0})`}
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => { setSelectedUser(u); setShowPasswordModal(true); }}
                                                                className="text-yellow-500/50 hover:text-yellow-500 p-2 hover:bg-yellow-950/30 rounded-full transition-all"
                                                                title="Change Password"
                                                            >
                                                                <KeyRound className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => toggleUserBlock(u.id, u.username, u.is_active)}
                                                                className={`p-2 rounded-full transition-all ${u.is_active ? 'text-orange-500/50 hover:text-orange-500 hover:bg-orange-950/30' : 'text-green-500/50 hover:text-green-500 hover:bg-green-950/30'}`}
                                                                title={u.is_active ? "Block User" : "Unblock User"}
                                                            >
                                                                {u.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                                            </button>
                                                            <button
                                                                onClick={() => window.location.href = `/inbox?recipient=${u.id}`}
                                                                className="text-white/50 hover:text-white p-2 hover:bg-zinc-800 rounded-full transition-all"
                                                                title="Send Message"
                                                            >
                                                                <Mail className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteUser(u.id, u.username)}
                                                                className="text-red-500/50 hover:text-red-500 p-2 hover:bg-red-950/30 rounded-full transition-all"
                                                                title="Delete User"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-red-500 uppercase tracking-widest opacity-20 block p-2">
                                                            SYSTEM
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'intelligence' && (
                        <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                            <h3 className="text-xl font-bold mb-4 tracking-widest flex items-center gap-2">
                                <Activity className="text-netflix-red w-5 h-5" /> ACTIVITY LOGS
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Raw Terminal Log */}
                                <div className="bg-black border border-zinc-900 rounded-sm h-[600px] flex flex-col shadow-xl">
                                    <div className="bg-[#111] p-3 border-b border-zinc-900 text-xs font-bold text-zinc-500 flex justify-between items-center">
                                        <span>SYSTEM LOGS</span>
                                        <div className="flex gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-[10px]">
                                        {data.activities.length === 0 ? (
                                            <div className="text-zinc-700 text-center mt-20">No activity yet...</div>
                                        ) : (
                                            data.activities.map((act) => (
                                                <div key={act.id} className="border-l border-zinc-800 pl-3 py-1">
                                                    <div className="flex justify-between text-zinc-600">
                                                        <span>{new Date(act.timestamp).toISOString()}</span>
                                                        <span className={act.activity_type === 'LOGIN' ? 'text-blue-500' : 'text-yellow-500'}>
                                                            [{act.activity_type}]
                                                        </span>
                                                    </div>
                                                    <div className="text-zinc-300 mt-1">{act.description}</div>
                                                    <div className="text-zinc-600 mt-1 text-[9px]">City: {act.city || 'Unknown'} | Lat/Lng: {act.latitude?.toFixed(2)}, {act.longitude?.toFixed(2)}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Analytics Graphic placeholder */}
                                <div className="space-y-6">
                                    <div className="bg-[#0a0a0a] border border-zinc-900 rounded-sm p-6 shadow-xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-red-900/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <h4 className="text-sm font-bold text-zinc-400 mb-2">Recent Server Traffic</h4>
                                        <div className="h-32 flex items-end gap-2 mt-8">
                                            {[30, 45, 20, 60, 80, 40, 90, 50, 70, 40, 80].map((h, i) => (
                                                <div key={i} className="flex-1 bg-red-900/40 border-t border-red-500 hover:bg-red-500 transition-colors" style={{ height: `${h}%` }}></div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-[#0a0a0a] border border-zinc-900 rounded-sm p-6 shadow-xl">
                                        <h4 className="text-sm font-bold text-zinc-400 mb-4">Latest Alerts</h4>
                                        <div className="space-y-3">
                                            <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-sm text-xs">
                                                <span className="text-red-500 font-bold">INFO:</span> A new user logged into the application.
                                            </div>
                                            <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-sm text-xs">
                                                <span className="text-yellow-500 font-bold">NOTICE:</span> Total wordlists generated has increased.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'config' && (
                        <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 max-w-4xl">
                            <h3 className="text-xl font-bold mb-4 tracking-widest flex items-center gap-2">
                                <TerminalSquare className="text-netflix-red w-5 h-5" /> SYSTEM SETTINGS
                            </h3>
                            <p className="text-sm text-zinc-500 mb-8 font-sans">
                                Change basic settings for the application. Any changes here apply to all users immediately.
                            </p>

                            <div className="space-y-6">
                                <div className="bg-black border border-zinc-900 rounded-sm p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h4 className="font-bold text-zinc-300 text-sm">Strict Security</h4>
                                            <p className="text-xs text-zinc-600 mt-1">Force all users to sign in again after 15 minutes of inactivity.</p>
                                        </div>
                                        <button className="bg-red-900/20 border border-red-900 text-red-500 px-4 py-2 text-xs font-bold rounded hover:bg-red-900/40">
                                            DISABLED
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-black border border-zinc-900 rounded-sm p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h4 className="font-bold text-zinc-300 text-sm">Generation Speed</h4>
                                            <p className="text-xs text-zinc-600 mt-1">Change the speed priority for generating new wordlists.</p>
                                        </div>
                                        <select className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs px-3 py-2 rounded focus:outline-none focus:border-red-500">
                                            <option>High Speed</option>
                                            <option>Normal (Default)</option>
                                            <option>Slower (Safe)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-black border border-zinc-900 rounded-sm p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-red-500 text-sm">Delete All Data</h4>
                                            <p className="text-xs text-zinc-500 mt-1 max-w-md line-clamp-2">
                                                Instantly delete all users, saved wordlists, and logs from the database. Be very careful, this cannot be undone.
                                            </p>
                                        </div>
                                        <button className="bg-red-600 hover:bg-red-700 text-black px-6 py-2 text-xs font-bold rounded shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all uppercase tracking-widest" onClick={() => alert('Starting deletion... (Simulation)')}>
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
                                You are about to forcibly change the password for user: <span className="text-white font-bold">{selectedUser.username}</span>.
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
                                    CONFIRM OVERRIDE
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
                                GENERATED REPORTS: {selectedUser.username}
                            </h3>
                            <button onClick={() => setShowGenerationsModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 font-mono">
                            {generations.length === 0 ? (
                                <div className="text-center text-zinc-600 py-12">No reports recorded for this user.</div>
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
                                                <td className="px-4 py-3 text-red-500">{g.ip_address}</td>
                                                <td className="px-4 py-3 text-green-500">{g.wordlist_count} Generated Words</td>
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
