import React, { useEffect, useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Database,
  TerminalSquare,
  Trash2,
  Activity,
  Server,
  Unlock,
  Ban,
  CheckCircle2,
  KeyRound,
  Eye,
  X,
  Mail,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ModeContext } from '../context/ModeContext';
import axios from '../api/axios';
import DesignAppShell from '../components/design/dashboard/DesignAppShell.jsx';

const SuperAdminPage = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [data, setData] = useState({ users: [], logs: [], activities: [], total_generations: 0 });
  const { mode: appMode } = useContext(ModeContext) || { mode: 'security' };
  const isSecurityMode = appMode === 'security';

  const theme = {
    card: isSecurityMode ? 'security-card' : 'user-glass-panel',
    cardDark: isSecurityMode
      ? 'bg-black/50 border border-white/10'
      : 'bg-black/20 border border-white/10',
    accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
    accentBg: isSecurityMode ? 'bg-security-red' : 'bg-user-cobalt',
    inputBg: isSecurityMode
      ? 'bg-black/50 border border-white/10 focus-within:border-security-red/50 text-white'
      : 'bg-white/5 border border-white/10 focus-within:border-user-cobalt/50 text-white',
    btnPrimary: isSecurityMode ? 'security-btn-primary' : 'user-btn-primary',
    btnSecondary: isSecurityMode
      ? 'bg-black/50 text-white border border-white/10 hover:bg-white/10'
      : 'bg-white/10 text-white border border-white/10 hover:bg-white/20',
    textMuted: isSecurityMode ? 'text-security-muted' : 'text-user-muted',
    border: isSecurityMode ? 'border-security-red/20' : 'border-user-cobalt/20',
    borderMuted: isSecurityMode ? 'border-white/10' : 'border-white/10',
    hoverBg: isSecurityMode ? 'hover:bg-security-red/10' : 'hover:bg-user-cobalt/10',
    tableHeader: isSecurityMode ? 'bg-black/60 text-security-muted' : 'bg-black/30 text-user-muted',
    tableRowHover: isSecurityMode ? 'hover:bg-white/5' : 'hover:bg-white/10',
    sidebarActive: isSecurityMode
      ? 'bg-security-red/20 text-security-red border border-security-red/50'
      : 'bg-user-cobalt/20 text-user-cobalt border border-user-cobalt/50',
  };

  const [loading, setLoading] = useState(true);
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
    {
      key: 'strict_security',
      label: 'Strict Security',
      description: 'Force all users to sign in again after 15 minutes of inactivity.',
      type: 'toggle',
      default: 'false',
    },
    {
      key: 'generation_speed',
      label: 'Generation Speed',
      description: 'Change the speed priority for generating new wordlists.',
      type: 'select',
      options: ['high', 'normal', 'slow'],
      default: 'normal',
    },
    {
      key: 'max_wordlist_size',
      label: 'Max Wordlist Size',
      description: 'Maximum number of passwords per generation.',
      type: 'number',
      default: '1000',
    },
    {
      key: 'registration_enabled',
      label: 'Registration Enabled',
      description: 'Allow new users to register accounts.',
      type: 'toggle',
      default: 'true',
    },
    {
      key: 'maintenance_mode',
      label: 'Maintenance Mode',
      description: 'Put the system in maintenance mode. Only admins can access.',
      type: 'toggle',
      default: 'false',
    },
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
      const res = await axios.get('super-admin/');
      setData(res.data);
    } catch (err) {
      console.warn('Admin data fetch failed:', err.message);
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
    const setting = settings.find((s) => s.key === key);
    if (setting) return setting.value;
    const def = SETTING_DEFINITIONS.find((d) => d.key === key);
    return def?.default || '';
  };

  const updateSetting = async (key, value, description = '') => {
    setSettingsSaving((prev) => ({ ...prev, [key]: true }));
    try {
      await axios.post('operations/settings/', { key, value: String(value), description });
      await fetchSettings();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update setting.');
    } finally {
      setSettingsSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const deleteUser = async (userId, username) => {
    if (window.confirm(`Delete user: ${username}? This cannot be undone.`)) {
      try {
        await axios.delete(`super-admin/?user_id=${userId}`);
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
        const res = await axios.post('super-admin/', { action, user_id: userId });
        alert(res.data.message);
        fetchAdminData();
      } catch (err) {
        alert(err.response?.data?.error || 'Action failed.');
      }
    }
  };

  const toggleAdminRole = async (u) => {
    const action = u.is_superuser ? 'demote_admin' : 'promote_admin';
    const label = u.is_superuser ? 'demote' : 'promote';
    if (!window.confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} ${u.username}?`)) return;
    try {
      const res = await axios.post('super-admin/', { action, user_id: u.id });
      alert(res.data.message);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed.');
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('super-admin/', {
        action: 'change_password',
        user_id: selectedUser.id,
        new_password: newPassword,
      });
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
      const res = await axios.get(`super-admin/?action=get_generations&user_id=${userId}`);
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
    try {
      const res = await axios.post('admin/purge-all/', { confirm: 'DELETE ALL DATA' });
      const d = res.data?.deleted || {};
      alert(
        `Purge complete.\n\n` +
          `Users removed: ${d.users ?? 0}\n` +
          `Generations: ${d.generations ?? 0}\n` +
          `Activities: ${d.activities ?? 0}\n` +
          `System logs: ${d.system_logs ?? 0}\n` +
          `Messages: ${d.messages ?? 0}\n` +
          `Notifications: ${d.notifications ?? 0}`,
      );
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || 'Purge failed.');
    }
  };

  if (!isAuthenticated || !user?.is_superuser) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen animate-pulse items-center justify-center bg-transparent font-mono text-xl tracking-widest">
        <Unlock className={`mr-4 h-8 w-8 ${theme.accentColor}`} />{' '}
        <span className={theme.textMuted}>Authenticating Admin Access...</span>
      </div>
    );
  }

  return (
    <DesignAppShell activeKey="audit">
      <div className="-mx-8 -mt-6 flex flex-col font-sans text-white">
        <div className="relative flex w-full flex-1 overflow-hidden">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`fixed bottom-6 left-6 z-50 lg:hidden ${theme.accentBg} flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full p-3 text-white shadow-lg transition-colors`}
          >
            <ShieldAlert className="h-5 w-5" />
          </button>

          {/* Mobile sidebar overlay: invisible full-screen backdrop,
                    not a discrete interactive control — keyboard users can
                    already Tab away or use the toggle button. */}
          {sidebarOpen && (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            <div
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Admin Sidebar Navigation */}
          <div
            className={`fixed inset-y-0 left-0 z-40 w-64 lg:relative ${theme.card} !rounded-none !border-y-0 !border-l-0 !border-r ${theme.border} flex shrink-0 transform flex-col p-4 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} pt-20 lg:pt-4`}
          >
            <div className={`border-b pb-8 pt-4 ${theme.borderMuted}`}>
              <h2
                className={`flex items-center gap-2 text-xl font-bold uppercase tracking-widest ${theme.accentColor}`}
              >
                <ShieldAlert className="h-5 w-5" />
                System Admin
              </h2>
              <div className={`mt-2 text-[11px] font-semibold text-white`}>{user?.username}</div>
              <div className={`text-[10px] ${theme.textMuted} mt-0.5 font-mono`}>{user?.email}</div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              {[
                { id: 'users', icon: Users, label: 'Users List' },
                { id: 'intelligence', icon: Activity, label: 'Activity Logs' },
                { id: 'config', icon: Server, label: 'System Settings' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 rounded-md p-3 text-sm font-semibold uppercase tracking-wide transition-all ${activeTab === tab.id ? theme.sidebarActive : `${theme.textMuted} hover:text-white ${theme.hoverBg}`} `}
                >
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-auto flex items-center justify-center gap-2 pb-4 font-mono text-[10px] uppercase tracking-widest text-green-400">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              Terminal Online
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {/* Top Status Bar */}
            <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              <div className={`${theme.card} rounded-xl p-5`}>
                <p className={`font-mono text-[10px] uppercase tracking-widest ${theme.textMuted}`}>
                  Total Users
                </p>
                <h3 className="mt-2 text-3xl font-bold text-white">{data.users.length}</h3>
              </div>
              <div className={`${theme.card} rounded-xl p-5`}>
                <p className={`font-mono text-[10px] uppercase tracking-widest ${theme.textMuted}`}>
                  Total Wordlists
                </p>
                <h3 className="mt-2 text-3xl font-bold text-white">{data.total_generations}</h3>
              </div>
              <div className={`${theme.card} rounded-xl p-5`}>
                <p className={`font-mono text-[10px] uppercase tracking-widest ${theme.textMuted}`}>
                  Total Activity
                </p>
                <h3 className="mt-2 text-3xl font-bold text-white">{data.activities.length}</h3>
              </div>
              <div className={`${theme.card} rounded-xl p-5`}>
                <p className={`font-mono text-[10px] uppercase tracking-widest ${theme.textMuted}`}>
                  Server State
                </p>
                <h3 className="mt-3 animate-pulse text-xl font-bold tracking-widest text-green-500">
                  SECURE
                </h3>
              </div>
            </div>

            {/* Tab: Users */}
            {activeTab === 'users' && (
              <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                <h3
                  className={`mb-4 flex items-center gap-2 text-xl font-bold uppercase tracking-widest ${theme.accentColor}`}
                >
                  <Users className="h-5 w-5" /> Global User Directory
                </h3>
                <p className={`text-sm ${theme.textMuted} mb-6`}>
                  Complete overview of all registered users. Manage access, passwords, and view
                  generation history.
                </p>

                <div className={`${theme.card} overflow-hidden !p-0`}>
                  <div className="custom-scrollbar overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left text-sm">
                      <thead
                        className={`${theme.tableHeader} font-mono text-xs uppercase tracking-wider`}
                      >
                        <tr>
                          <th className={`border-b px-6 py-4 ${theme.borderMuted}`}>User ID</th>
                          <th className={`border-b px-6 py-4 ${theme.borderMuted}`}>Role</th>
                          <th className={`border-b px-6 py-4 ${theme.borderMuted}`}>Location</th>
                          <th className={`border-b px-6 py-4 ${theme.borderMuted}`}>Auth</th>
                          <th className={`border-b px-6 py-4 ${theme.borderMuted}`}>Status</th>
                          <th className={`border-b px-6 py-4 ${theme.borderMuted} text-right`}>
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${theme.borderMuted}`}>
                        {data.users.map((u) => (
                          <tr
                            key={u.id}
                            className={`group transition-colors ${theme.tableRowHover}`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span
                                  className={
                                    u.is_superuser
                                      ? `font-bold ${theme.accentColor}`
                                      : 'font-medium text-white/80 group-hover:text-white'
                                  }
                                >
                                  {u.username}
                                </span>
                                <span className={`mt-0.5 font-mono text-[10px] ${theme.textMuted}`}>
                                  {u.email || 'No email'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`rounded border bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${u.is_superuser ? `border-${isSecurityMode ? 'red' : 'blue'}-500/50 ${theme.accentColor}` : 'border-white/10 text-white/50'}`}
                              >
                                {u.is_superuser ? 'Admin' : 'Standard'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`font-mono text-[11px] ${theme.textMuted}`}>
                                {u.location || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`font-mono text-[10px] ${theme.textMuted}`}>
                                {u.pass_display || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {u.is_active ? (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-green-400">
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                                  Active
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-500">
                                  <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                                  Blocked
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {!u.is_superuser && (
                                  <>
                                    <button
                                      onClick={() => viewUserGenerations(u.id, u.username)}
                                      className={`p-2 text-white/40 hover:text-white ${theme.hoverBg} rounded-full transition-all`}
                                      title={`View Generations (${u.generation_count || 0})`}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedUser(u);
                                        setShowPasswordModal(true);
                                      }}
                                      className={`rounded-full p-2 text-white/40 transition-all hover:bg-amber-400/10 hover:text-amber-400`}
                                      title="Change Password"
                                    >
                                      <KeyRound className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => toggleUserBlock(u.id, u.username, u.is_active)}
                                      className={`rounded-full p-2 transition-all ${u.is_active ? 'text-white/40 hover:bg-orange-500/10 hover:text-orange-500' : 'text-white/40 hover:bg-green-400/10 hover:text-green-400'}`}
                                      title={u.is_active ? 'Block' : 'Unblock'}
                                    >
                                      {u.is_active ? (
                                        <Ban className="h-4 w-4" />
                                      ) : (
                                        <CheckCircle2 className="h-4 w-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() =>
                                        (window.location.href = `/inbox?recipient=${u.id}`)
                                      }
                                      className={`p-2 text-white/40 hover:text-white ${theme.hoverBg} rounded-full transition-all`}
                                      title="Message"
                                    >
                                      <Mail className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => deleteUser(u.id, u.username)}
                                      className={`rounded-full p-2 text-white/40 transition-all hover:bg-red-500/10 hover:text-red-500`}
                                      title="Delete"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                                {u.id !== user?.id && (
                                  <button
                                    onClick={() => toggleAdminRole(u)}
                                    className={`rounded-full border p-2 px-3 text-xs font-bold transition-all ${u.is_superuser ? 'border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10' : 'border-green-400/30 text-green-400 hover:bg-green-400/10'}`}
                                    title={u.is_superuser ? 'Demote to user' : 'Promote to admin'}
                                  >
                                    {u.is_superuser ? 'Demote' : 'Promote'}
                                  </button>
                                )}
                              </div>
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
                <h3
                  className={`mb-4 flex items-center gap-2 text-xl font-bold uppercase tracking-widest ${theme.accentColor}`}
                >
                  <Activity className="h-5 w-5" /> Activity Intelligence
                </h3>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Activity Log */}
                  <div
                    className={`${theme.card} flex h-[400px] flex-col overflow-hidden !p-0 md:h-[600px]`}
                  >
                    <div
                      className={`${theme.tableHeader} border-b p-4 ${theme.borderMuted} flex items-center justify-between text-xs font-bold uppercase tracking-widest`}
                    >
                      <span>Terminal Stream ({data.activities.length} records)</span>
                      <div className="flex gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${theme.accentBg} animate-pulse shadow-[0_0_8px_currentColor]`}
                        ></div>
                      </div>
                    </div>
                    <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto bg-black/20 p-5 font-mono text-[11px]">
                      {data.activities.length === 0 ? (
                        <div
                          className={`mt-20 text-center ${theme.textMuted} uppercase tracking-widest`}
                        >
                          No intelligence gathered yet.
                        </div>
                      ) : (
                        data.activities.map((act) => (
                          <div
                            key={act.id}
                            className={`border-l-2 ${theme.border} group relative py-1 pl-4`}
                          >
                            <div
                              className={`absolute -left-[7px] top-2 h-3 w-3 rounded-full border bg-black ${theme.border} transition-colors group-hover:bg-white/20`}
                            ></div>
                            <div className="mb-1 flex items-center justify-between text-white/60">
                              <span>
                                {new Date(act.timestamp).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>
                              <span
                                className={`rounded px-2 py-0.5 text-[9px] font-bold tracking-wider ${
                                  act.activity_type === 'LOGIN'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : act.activity_type === 'GENERATE'
                                      ? 'bg-amber-500/20 text-amber-400'
                                      : act.activity_type === 'BREACH'
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-white/10 text-white/70'
                                }`}
                              >
                                {act.activity_type}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-white">{act.description}</div>
                            <div className={`mt-2 ${theme.textMuted} flex gap-4 text-[10px]`}>
                              <span>GEO: {act.city || 'Unknown'}</span>
                              <span>
                                COORD:{' '}
                                {act.latitude !== 999
                                  ? `${act.latitude?.toFixed(4)}, ${act.longitude?.toFixed(4)}`
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="space-y-6">
                    <div className={`${theme.card} group relative overflow-hidden p-6`}>
                      <div
                        className={`absolute inset-0 ${theme.accentBg} opacity-0 transition-opacity group-hover:opacity-5`}
                      />
                      <h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-white">
                        Activity Vectors
                      </h4>
                      <div className="space-y-5">
                        {['LOGIN', 'GENERATE', 'TEAM_JOIN', 'CONFIG'].map((type) => {
                          const count = data.activities.filter(
                            (a) => a.activity_type === type,
                          ).length;
                          const pct =
                            data.activities.length > 0 ? (count / data.activities.length) * 100 : 0;
                          return (
                            <div key={type}>
                              <div
                                className={`mb-2 flex justify-between font-mono text-[10px] uppercase tracking-widest ${theme.textMuted}`}
                              >
                                <span>{type}</span>
                                <span className="text-white">
                                  {count} ({pct.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full border border-white/5 bg-black/40">
                                <div
                                  className={`h-full ${theme.accentBg} transition-all duration-1000 ease-out`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className={`${theme.card} p-6`}>
                      <h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-white">
                        Network Status
                      </h4>
                      <div className="space-y-4 text-sm font-medium">
                        <div
                          className={`flex items-center justify-between border-b py-2.5 ${theme.borderMuted}`}
                        >
                          <span className={theme.textMuted}>Active Nodes (Users)</span>
                          <span className="rounded bg-white/10 px-3 py-1 font-mono text-white">
                            {data.users.filter((u) => u.is_active).length}
                          </span>
                        </div>
                        <div
                          className={`flex items-center justify-between border-b py-2.5 ${theme.borderMuted}`}
                        >
                          <span className={theme.textMuted}>Restricted Nodes</span>
                          <span className="rounded border border-red-500/20 bg-red-500/10 px-3 py-1 font-mono text-red-400">
                            {data.users.filter((u) => !u.is_active).length}
                          </span>
                        </div>
                        <div
                          className={`flex items-center justify-between border-b py-2.5 ${theme.borderMuted}`}
                        >
                          <span className={theme.textMuted}>Elevated Access (Admins)</span>
                          <span className="rounded bg-white/10 px-3 py-1 font-mono text-white">
                            {data.users.filter((u) => u.is_superuser).length}
                          </span>
                        </div>
                        <div className={`flex items-center justify-between py-2.5`}>
                          <span className={theme.textMuted}>Data Packets (Wordlists)</span>
                          <span className="rounded bg-white/10 px-3 py-1 font-mono text-white">
                            {data.total_generations}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: System Settings */}
            {activeTab === 'config' && (
              <div className="animate-in fade-in slide-in-from-bottom-5 max-w-4xl duration-500">
                <div className="mb-4 flex items-center justify-between">
                  <h3
                    className={`flex items-center gap-2 text-xl font-bold uppercase tracking-widest ${theme.accentColor}`}
                  >
                    <TerminalSquare className="h-5 w-5" /> Global Configuration
                  </h3>
                  <button
                    onClick={fetchSettings}
                    className={`rounded-full p-2 text-white/50 hover:text-white ${theme.hoverBg} transition-colors`}
                    title="Refresh Configuration"
                  >
                    <RefreshCw className={`h-4 w-4 ${settingsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <p className={`text-sm ${theme.textMuted} mb-8`}>
                  Configure core system parameters. Modifications are broadcasted immediately across
                  the network.
                </p>

                <div className="space-y-4">
                  {SETTING_DEFINITIONS.map((def) => {
                    const currentValue = getSettingValue(def.key);
                    const isSaving = settingsSaving[def.key];

                    return (
                      <div key={def.key} className={`${theme.card} p-6`}>
                        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                          <div className="max-w-xl">
                            <h4 className="text-sm font-bold tracking-wide text-white">
                              {def.label}
                            </h4>
                            <p className={`mt-1.5 text-xs leading-relaxed ${theme.textMuted}`}>
                              {def.description}
                            </p>
                          </div>

                          {def.type === 'toggle' && (
                            <button
                              onClick={() =>
                                updateSetting(
                                  def.key,
                                  currentValue === 'true' ? 'false' : 'true',
                                  def.description,
                                )
                              }
                              disabled={isSaving}
                              className={`shrink-0 rounded-md border px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                                currentValue === 'true'
                                  ? 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                  : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                              } ${isSaving ? 'cursor-wait opacity-50' : ''}`}
                            >
                              {isSaving ? '...' : currentValue === 'true' ? 'Active' : 'Offline'}
                            </button>
                          )}

                          {def.type === 'select' && (
                            <select
                              value={currentValue || def.default}
                              onChange={(e) =>
                                updateSetting(def.key, e.target.value, def.description)
                              }
                              disabled={isSaving}
                              className={`${theme.inputBg} min-w-[140px] shrink-0 appearance-none rounded-md px-4 py-2.5 text-xs font-medium uppercase tracking-wide focus:outline-none`}
                            >
                              {def.options.map((opt) => (
                                <option key={opt} value={opt} className="bg-[#141414]">
                                  {opt}
                                </option>
                              ))}
                            </select>
                          )}

                          {def.type === 'number' && (
                            <div className="flex shrink-0 items-center gap-2">
                              <input
                                type="number"
                                defaultValue={currentValue || def.default}
                                onBlur={(e) => {
                                  if (e.target.value !== currentValue) {
                                    updateSetting(def.key, e.target.value, def.description);
                                  }
                                }}
                                className={`${theme.inputBg} w-32 rounded-md px-4 py-2.5 text-center font-mono text-sm focus:outline-none`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Danger Zone */}
                  <div
                    className={`relative mt-10 overflow-hidden rounded-xl border border-red-500/30 bg-red-950/10 p-6`}
                  >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-red-500">
                          <AlertTriangle className="h-4 w-4" /> Purge Protocol
                        </h4>
                        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-red-200/50">
                          Permanently incinerate all user accounts, wordlists, and intelligence
                          logs. This operation cannot be rolled back.
                        </p>
                      </div>
                      <button
                        onClick={handleDeleteAllData}
                        className="shrink-0 rounded-md border border-red-500/50 bg-red-600/20 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-red-400 shadow-[0_0_20px_rgba(220,38,38,0.1)] transition-all hover:bg-red-600 hover:text-white hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <div className={`${theme.card} w-full max-w-md overflow-hidden !p-0`}>
              <div
                className={`flex items-center justify-between border-b p-5 ${theme.borderMuted} bg-black/40`}
              >
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white">
                  <KeyRound className={`h-4 w-4 ${theme.accentColor}`} />
                  Override Auth Token
                </h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className={`${theme.textMuted} transition-colors hover:text-white`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleChangePasswordSubmit} className="p-6">
                <p className={`text-sm ${theme.textMuted} mb-6`}>
                  Issue new credentials for node:{' '}
                  <span className="ml-1 rounded bg-white/10 px-2 py-0.5 font-mono text-white">
                    {selectedUser.username}
                  </span>
                </p>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Auth Token..."
                  className={`w-full ${theme.inputBg} mb-8 rounded-lg p-3 font-mono text-sm outline-none transition-all`}
                  required
                  minLength={6}
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className={`rounded-md px-5 py-2.5 text-xs font-bold uppercase tracking-wider ${theme.btnSecondary}`}
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className={`rounded-md px-5 py-2.5 text-xs font-bold uppercase tracking-wider ${theme.btnPrimary} !border-none`}
                  >
                    Deploy Token
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Generations Modal */}
        {showGenerationsModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <div
              className={`${theme.card} flex max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden !p-0`}
            >
              <div
                className={`flex items-center justify-between border-b p-5 ${theme.borderMuted} shrink-0 bg-black/40`}
              >
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white">
                  <Database className={`h-4 w-4 ${theme.accentColor}`} />
                  Data Packets: {selectedUser.username}
                </h3>
                <button
                  onClick={() => setShowGenerationsModal(false)}
                  className={`${theme.textMuted} transition-colors hover:text-white`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="custom-scrollbar flex-1 overflow-y-auto p-0">
                {generations.length === 0 ? (
                  <div
                    className={`py-16 text-center font-mono text-sm uppercase tracking-widest ${theme.textMuted}`}
                  >
                    No records found in cache.
                  </div>
                ) : (
                  <table className="w-full text-left font-mono text-sm">
                    <thead
                      className={`${theme.tableHeader} sticky top-0 z-10 text-[10px] uppercase tracking-wider`}
                    >
                      <tr>
                        <th className={`border-b px-6 py-4 ${theme.borderMuted}`}>Timestamp</th>
                        <th className={`border-b px-6 py-4 ${theme.borderMuted}`}>IP Origin</th>
                        <th className={`border-b px-6 py-4 ${theme.borderMuted}`}>Volume</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme.borderMuted} bg-black/20`}>
                      {generations.map((g) => (
                        <tr key={g.id} className={`${theme.tableRowHover} transition-colors`}>
                          <td className={`px-6 py-4 text-xs ${theme.textMuted}`}>
                            {new Date(g.timestamp).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="px-6 py-4 text-xs text-white/80">
                            {g.ip_address || 'N/A'}
                          </td>
                          <td className={`px-6 py-4 text-xs font-bold ${theme.accentColor}`}>
                            {g.wordlist_count} entries
                          </td>
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
    </DesignAppShell>
  );
};

export default SuperAdminPage;
