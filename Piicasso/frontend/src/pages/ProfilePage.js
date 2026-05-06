import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ModeContext } from '../context/ModeContext';
import DesignAppShell from '../components/design/dashboard/DesignAppShell.jsx';
import axiosInstance from '../api/axios';
import ProfileAvatar from '../components/design/ProfileAvatar';
import {
    User, Shield, Activity, Lock, Database,
    Terminal, Clock, AlertTriangle, Mail, Calendar,
    Users, Key, ChevronRight, Edit3, Save, CheckCircle
} from 'lucide-react';

const ProfilePage = () => {
    const { user, logout } = useContext(AuthContext);
    const { mode: appMode } = useContext(ModeContext) || { mode: 'security' };
    const isSecurityMode = appMode === 'security';

    const isAdmin = user?.is_superuser;

    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({ operations: 0, data_points: 0, uptime: '99.9%', threats: 0 });
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '' });
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

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

    useEffect(() => {
        if (user?.profile_picture) setAvatarPreview(user.profile_picture);
    }, [user]);

    const handleSaveProfile = async () => {
        setSaving(true);
        setEditError('');
        setEditSuccess('');
        try {
            const formData = new FormData();
            formData.append('first_name', editForm.first_name);
            formData.append('last_name', editForm.last_name);
            formData.append('email', editForm.email);
            if (avatarFile) formData.append('profile_picture', avatarFile);

            await axiosInstance.patch('profile/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
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
            <DesignAppShell>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        color: 'var(--fg-2)',
                        fontSize: 14,
                    }}>
                        <Activity style={{
                            width: 20,
                            height: 20,
                            animation: 'spin 1s linear infinite',
                        }} />
                        Retrieving dossier...
                    </div>
                </div>
            </DesignAppShell>
        );
    }

    return (
        <DesignAppShell>
            <div style={{
                minHeight: '100vh',
                color: 'var(--fg-0)',
                fontFamily: 'sans-serif',
                paddingTop: 24,
                paddingBottom: 80,
                paddingLeft: 16,
                paddingRight: 16,
            }}>
                <div style={{
                    maxWidth: 1400,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                }}>
                    <div style={{ marginBottom: 32 }}>
                        <h1 style={{
                            fontSize: 24,
                            fontWeight: 700,
                            letterSpacing: -0.5,
                            marginBottom: 8,
                            textTransform: 'uppercase',
                        }}>
                            {isSecurityMode ? 'Operator Dossier' : 'User Profile'}
                        </h1>
                        <p style={{
                            color: 'var(--fg-2)',
                            fontSize: 14,
                            marginTop: 4,
                        }}>
                            {isSecurityMode ? 'Classified access credentials and deployment history.' : 'Manage your account settings and view activity history.'}
                        </p>
                    </div>

                    {editSuccess && (
                        <div style={{
                            marginBottom: 24,
                            padding: '12px 16px',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            fontSize: 14,
                            fontWeight: 500,
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            color: '#22c55e',
                        }}>
                            <CheckCircle style={{ width: 20, height: 20 }} />
                            {editSuccess}
                        </div>
                    )}
                    {passwordSuccess && (
                        <div style={{
                            marginBottom: 24,
                            padding: '12px 16px',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            fontSize: 14,
                            fontWeight: 500,
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            color: '#22c55e',
                        }}>
                            <CheckCircle style={{ width: 20, height: 20 }} />
                            {passwordSuccess}
                        </div>
                    )}

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: 32,
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div className="card" style={{
                                padding: 24,
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                            }}>
                                <div style={{
                                    width: 96,
                                    height: 96,
                                    borderRadius: '50%',
                                    border: isAdmin ? '4px solid var(--accent-500)' : '4px solid var(--ink-4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 16,
                                    background: 'var(--ink-3)',
                                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
                                    position: 'relative',
                                    zIndex: 10,
                                }}>
                                    {isAdmin ? (
                                        <Shield style={{
                                            width: 40,
                                            height: 40,
                                            color: 'var(--accent-500)',
                                        }} />
                                    ) : (
                                        <User style={{
                                            width: 40,
                                            height: 40,
                                            color: 'var(--fg-3)',
                                        }} />
                                    )}
                                </div>

                                <h2 style={{
                                    fontSize: 20,
                                    fontWeight: 700,
                                    letterSpacing: -0.3,
                                    color: 'var(--fg-0)',
                                    marginBottom: 4,
                                    position: 'relative',
                                    zIndex: 10,
                                }}>
                                    {profile?.username || user?.username || 'User'}
                                </h2>

                                {(profile?.first_name || profile?.last_name) && (
                                    <p style={{
                                        color: 'var(--fg-2)',
                                        fontSize: 14,
                                        marginTop: 4,
                                        position: 'relative',
                                        zIndex: 10,
                                    }}>
                                        {[profile.first_name, profile.last_name].filter(Boolean).join(' ')}
                                    </p>
                                )}

                                <div style={{
                                    paddingLeft: 12,
                                    paddingRight: 12,
                                    paddingTop: 4,
                                    paddingBottom: 4,
                                    borderRadius: 20,
                                    fontSize: 10,
                                    fontFamily: 'var(--font-mono)',
                                    letterSpacing: 2,
                                    textTransform: 'uppercase',
                                    marginTop: 16,
                                    border: isAdmin ? '1px solid var(--accent-500)' : '1px solid var(--ink-4)',
                                    background: isAdmin ? 'rgba(var(--accent-500-rgb), 0.1)' : 'var(--ink-2)',
                                    color: isAdmin ? 'var(--accent-500)' : 'var(--fg-3)',
                                    position: 'relative',
                                    zIndex: 10,
                                }}>
                                    {isAdmin ? 'SYSTEM ADMINISTRATOR' : 'STANDARD USER'}
                                </div>

                                <div style={{
                                    width: '100%',
                                    marginTop: 32,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12,
                                    position: 'relative',
                                    zIndex: 10,
                                }}>
                                    <button
                                        onClick={() => { setEditing(!editing); setEditError(''); }}
                                        style={{
                                            width: '100%',
                                            borderRadius: 6,
                                            fontSize: 14,
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            padding: '10px 16px',
                                            background: editing ? 'var(--ink-2)' : 'var(--accent-500)',
                                            color: editing ? 'var(--fg-1)' : 'var(--fg-0)',
                                            border: editing ? '1px solid var(--ink-4)' : 'none',
                                            cursor: 'pointer',
                                            transition: 'all 200ms',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!editing) e.target.style.opacity = '0.9';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!editing) e.target.style.opacity = '1';
                                        }}
                                    >
                                        <Edit3 style={{ width: 16, height: 16 }} />
                                        {editing ? 'Cancel Modification' : 'Modify Credentials'}
                                    </button>
                                    <button
                                        onClick={logout}
                                        style={{
                                            width: '100%',
                                            paddingTop: 10,
                                            paddingBottom: 10,
                                            borderRadius: 6,
                                            fontSize: 14,
                                            fontWeight: 600,
                                            background: 'var(--ink-2)',
                                            color: 'var(--fg-1)',
                                            border: '1px solid var(--ink-4)',
                                            cursor: 'pointer',
                                            transition: 'all 200ms',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.borderColor = 'var(--warn)';
                                            e.target.style.color = 'var(--warn)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.borderColor = 'var(--ink-4)';
                                            e.target.style.color = 'var(--fg-1)';
                                        }}
                                    >
                                        Terminate Session
                                    </button>
                                </div>
                            </div>

                            {editing && (
                                <div className="card" style={{
                                    padding: 24,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 16,
                                }}>
                                    <h3 style={{
                                        fontSize: 14,
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 8,
                                        color: 'var(--fg-0)',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                    }}>
                                        <Edit3 style={{
                                            width: 16,
                                            height: 16,
                                            color: 'var(--accent-500)',
                                        }} />
                                        Update Records
                                    </h3>

                                    {editError && (
                                        <div style={{
                                            padding: 12,
                                            borderRadius: 6,
                                            fontSize: 14,
                                            background: 'rgba(220, 38, 38, 0.1)',
                                            border: '1px solid rgba(220, 38, 38, 0.3)',
                                            color: '#f87171',
                                        }}>
                                            {editError}
                                        </div>
                                    )}

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 20,
                                        marginBottom: 28,
                                        paddingBottom: 28,
                                        borderBottom: '1px solid var(--ink-4)',
                                    }}>
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            <ProfileAvatar
                                                user={{ ...user, profile_picture: avatarPreview }}
                                                size={64}
                                            />
                                            <label
                                                htmlFor="avatar-upload"
                                                style={{
                                                    position: 'absolute',
                                                    bottom: -2,
                                                    right: -2,
                                                    width: 22,
                                                    height: 22,
                                                    borderRadius: '50%',
                                                    background: 'var(--accent-500)',
                                                    color: 'var(--ink-0)',
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                    fontSize: 11,
                                                    cursor: 'pointer',
                                                    boxShadow: '0 0 0 2px var(--ink-0)',
                                                }}
                                            >
                                                ✎
                                            </label>
                                            <input
                                                id="avatar-upload"
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    setAvatarFile(file);
                                                    setAvatarPreview(URL.createObjectURL(file));
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-0)' }}>
                                                {user?.username}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>
                                                {user?.email}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div>
                                            <label style={{
                                                fontSize: 10,
                                                fontFamily: 'var(--font-mono)',
                                                textTransform: 'uppercase',
                                                letterSpacing: 1,
                                                marginBottom: 6,
                                                display: 'block',
                                                color: 'var(--fg-3)',
                                            }}>
                                                First Name
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.first_name}
                                                onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    fontSize: 14,
                                                    borderRadius: 6,
                                                    background: 'var(--ink-3)',
                                                    border: '1px solid var(--ink-5)',
                                                    color: 'var(--fg-0)',
                                                    outline: 'none',
                                                    transition: 'border-color 200ms',
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = 'var(--accent-500)'}
                                                onBlur={(e) => e.target.style.borderColor = 'var(--ink-5)'}
                                                placeholder="Enter first name"
                                            />
                                        </div>
                                        <div>
                                            <label style={{
                                                fontSize: 10,
                                                fontFamily: 'var(--font-mono)',
                                                textTransform: 'uppercase',
                                                letterSpacing: 1,
                                                marginBottom: 6,
                                                display: 'block',
                                                color: 'var(--fg-3)',
                                            }}>
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.last_name}
                                                onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    fontSize: 14,
                                                    borderRadius: 6,
                                                    background: 'var(--ink-3)',
                                                    border: '1px solid var(--ink-5)',
                                                    color: 'var(--fg-0)',
                                                    outline: 'none',
                                                    transition: 'border-color 200ms',
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = 'var(--accent-500)'}
                                                onBlur={(e) => e.target.style.borderColor = 'var(--ink-5)'}
                                                placeholder="Enter last name"
                                            />
                                        </div>
                                        <div>
                                            <label style={{
                                                fontSize: 10,
                                                fontFamily: 'var(--font-mono)',
                                                textTransform: 'uppercase',
                                                letterSpacing: 1,
                                                marginBottom: 6,
                                                display: 'block',
                                                color: 'var(--fg-3)',
                                            }}>
                                                Designated Email
                                            </label>
                                            <input
                                                type="email"
                                                value={editForm.email}
                                                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    fontSize: 14,
                                                    borderRadius: 6,
                                                    background: 'var(--ink-3)',
                                                    border: '1px solid var(--ink-5)',
                                                    color: 'var(--fg-0)',
                                                    outline: 'none',
                                                    transition: 'border-color 200ms',
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = 'var(--accent-500)'}
                                                onBlur={(e) => e.target.style.borderColor = 'var(--ink-5)'}
                                                placeholder="Enter email address"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                        style={{
                                            width: '100%',
                                            marginTop: 16,
                                            borderRadius: 6,
                                            fontSize: 14,
                                            fontWeight: 600,
                                            opacity: saving ? 0.5 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            padding: '10px 16px',
                                            background: 'var(--accent-500)',
                                            color: 'var(--fg-0)',
                                            border: 'none',
                                            cursor: saving ? 'not-allowed' : 'pointer',
                                            transition: 'all 200ms',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!saving) e.target.style.opacity = '0.9';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!saving) e.target.style.opacity = '1';
                                        }}
                                    >
                                        <Save style={{ width: 16, height: 16 }} />
                                        {saving ? 'Writing to DB...' : 'Commit Changes'}
                                    </button>
                                </div>
                            )}

                            <div className="card" style={{ padding: 24 }}>
                                <h3 style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 16,
                                    color: 'var(--fg-0)',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                }}>
                                    <Key style={{
                                        width: 16,
                                        height: 16,
                                        color: 'var(--accent-500)',
                                    }} />
                                    Security Clearance
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 16,
                                        paddingTop: 12,
                                        paddingBottom: 12,
                                        borderBottom: '1px solid var(--ink-4)',
                                    }}>
                                        <Mail style={{
                                            width: 20,
                                            height: 20,
                                            flexShrink: 0,
                                            color: 'var(--fg-2)',
                                        }} />
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{
                                                fontSize: 10,
                                                fontFamily: 'var(--font-mono)',
                                                textTransform: 'uppercase',
                                                letterSpacing: 1,
                                                color: 'var(--fg-3)',
                                            }}>
                                                Comms Link
                                            </p>
                                            <p style={{
                                                fontSize: 14,
                                                marginTop: 4,
                                                color: 'var(--fg-0)',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>
                                                {profile?.email || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 16,
                                        paddingTop: 12,
                                        paddingBottom: 12,
                                        borderBottom: '1px solid var(--ink-4)',
                                    }}>
                                        <Calendar style={{
                                            width: 20,
                                            height: 20,
                                            flexShrink: 0,
                                            color: 'var(--fg-2)',
                                        }} />
                                        <div>
                                            <p style={{
                                                fontSize: 10,
                                                fontFamily: 'var(--font-mono)',
                                                textTransform: 'uppercase',
                                                letterSpacing: 1,
                                                color: 'var(--fg-3)',
                                            }}>
                                                Commissioned Date
                                            </p>
                                            <p style={{
                                                fontSize: 14,
                                                marginTop: 4,
                                                color: 'var(--fg-0)',
                                            }}>
                                                {formatDate(profile?.date_joined)}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 16,
                                        paddingTop: 12,
                                        paddingBottom: 12,
                                        borderBottom: '1px solid var(--ink-4)',
                                    }}>
                                        <Lock style={{
                                            width: 20,
                                            height: 20,
                                            flexShrink: 0,
                                            color: 'var(--fg-2)',
                                        }} />
                                        <div style={{ flex: 1 }}>
                                            <p style={{
                                                fontSize: 10,
                                                fontFamily: 'var(--font-mono)',
                                                textTransform: 'uppercase',
                                                letterSpacing: 1,
                                                color: 'var(--fg-3)',
                                            }}>
                                                Auth Protocol
                                            </p>
                                            <p style={{
                                                fontSize: 14,
                                                marginTop: 4,
                                                color: 'var(--fg-0)',
                                            }}>
                                                {profile?.auth_type || 'Standard RSA'}
                                            </p>
                                        </div>
                                        {profile?.has_usable_password && (
                                            <button
                                                onClick={() => setShowPasswordChange(!showPasswordChange)}
                                                style={{
                                                    fontSize: 10,
                                                    fontFamily: 'var(--font-mono)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: 2,
                                                    color: 'var(--accent-500)',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'opacity 200ms',
                                                }}
                                                onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                                                onMouseLeave={(e) => e.target.style.opacity = '1'}
                                            >
                                                [ Reset ]
                                            </button>
                                        )}
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 16,
                                        paddingTop: 12,
                                        paddingBottom: 12,
                                        borderBottom: profile?.team ? '1px solid var(--ink-4)' : 'none',
                                    }}>
                                        <Activity style={{
                                            width: 20,
                                            height: 20,
                                            flexShrink: 0,
                                            color: 'var(--fg-2)',
                                        }} />
                                        <div>
                                            <p style={{
                                                fontSize: 10,
                                                fontFamily: 'var(--font-mono)',
                                                textTransform: 'uppercase',
                                                letterSpacing: 1,
                                                color: 'var(--fg-3)',
                                            }}>
                                                Node Status
                                            </p>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                marginTop: 4,
                                            }}>
                                                <div style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    background: profile?.is_active !== false ? '#22c55e' : '#ef4444',
                                                    boxShadow: profile?.is_active !== false ? '0 0 5px rgba(34, 197, 94, 0.5)' : 'none',
                                                    animation: profile?.is_active !== false ? 'pulse 2s infinite' : 'none',
                                                }}></div>
                                                <p style={{
                                                    fontSize: 14,
                                                    fontWeight: 500,
                                                    color: profile?.is_active !== false ? '#22c55e' : '#ef4444',
                                                }}>
                                                    {profile?.is_active !== false ? 'Online & Functional' : 'Offline / Compromised'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {profile?.team && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 16,
                                            paddingTop: 12,
                                            paddingBottom: 12,
                                        }}>
                                            <Users style={{
                                                width: 20,
                                                height: 20,
                                                flexShrink: 0,
                                                color: 'var(--fg-2)',
                                            }} />
                                            <div>
                                                <p style={{
                                                    fontSize: 10,
                                                    fontFamily: 'var(--font-mono)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: 1,
                                                    color: 'var(--fg-3)',
                                                }}>
                                                    Squadron
                                                </p>
                                                <p style={{
                                                    fontSize: 14,
                                                    marginTop: 4,
                                                    color: 'var(--fg-0)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                }}>
                                                    {profile.team.name}
                                                    <span style={{
                                                        fontSize: 9,
                                                        paddingLeft: 6,
                                                        paddingRight: 6,
                                                        paddingTop: 2,
                                                        paddingBottom: 2,
                                                        borderRadius: 4,
                                                        border: '1px solid var(--ink-4)',
                                                        color: 'var(--fg-3)',
                                                        background: 'var(--ink-2)',
                                                        textTransform: 'uppercase',
                                                    }}>
                                                        {profile.team.role}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {showPasswordChange && (
                                <div className="card" style={{
                                    padding: 24,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 16,
                                }}>
                                    <h3 style={{
                                        fontSize: 14,
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 8,
                                        color: 'var(--fg-0)',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                    }}>
                                        <Lock style={{
                                            width: 16,
                                            height: 16,
                                            color: 'var(--accent-500)',
                                        }} />
                                        Cipher Overwrite
                                    </h3>

                                    {passwordError && (
                                        <div style={{
                                            padding: 12,
                                            borderRadius: 6,
                                            fontSize: 14,
                                            background: 'rgba(220, 38, 38, 0.1)',
                                            border: '1px solid rgba(220, 38, 38, 0.3)',
                                            color: '#f87171',
                                        }}>
                                            {passwordError}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div>
                                            <label style={{
                                                fontSize: 10,
                                                fontFamily: 'var(--font-mono)',
                                                textTransform: 'uppercase',
                                                letterSpacing: 1,
                                                marginBottom: 6,
                                                display: 'block',
                                                color: 'var(--fg-3)',
                                            }}>
                                                Old Cipher
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordForm.current_password}
                                                onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    fontSize: 14,
                                                    borderRadius: 6,
                                                    background: 'var(--ink-3)',
                                                    border: '1px solid var(--ink-5)',
                                                    color: 'var(--fg-0)',
                                                    outline: 'none',
                                                    transition: 'border-color 200ms',
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = 'var(--accent-500)'}
                                                onBlur={(e) => e.target.style.borderColor = 'var(--ink-5)'}
                                                placeholder="Enter old password"
                                            />
                                        </div>
                                        <div>
                                            <label style={{
                                                fontSize: 10,
                                                fontFamily: 'var(--font-mono)',
                                                textTransform: 'uppercase',
                                                letterSpacing: 1,
                                                marginBottom: 6,
                                                display: 'block',
                                                color: 'var(--fg-3)',
                                            }}>
                                                New Cipher
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordForm.new_password}
                                                onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    fontSize: 14,
                                                    borderRadius: 6,
                                                    background: 'var(--ink-3)',
                                                    border: '1px solid var(--ink-5)',
                                                    color: 'var(--fg-0)',
                                                    outline: 'none',
                                                    transition: 'border-color 200ms',
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = 'var(--accent-500)'}
                                                onBlur={(e) => e.target.style.borderColor = 'var(--ink-5)'}
                                                placeholder="Enter new password"
                                            />
                                        </div>
                                        <div>
                                            <label style={{
                                                fontSize: 10,
                                                fontFamily: 'var(--font-mono)',
                                                textTransform: 'uppercase',
                                                letterSpacing: 1,
                                                marginBottom: 6,
                                                display: 'block',
                                                color: 'var(--fg-3)',
                                            }}>
                                                Verify Cipher
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordForm.confirm_password}
                                                onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    fontSize: 14,
                                                    borderRadius: 6,
                                                    background: 'var(--ink-3)',
                                                    border: '1px solid var(--ink-5)',
                                                    color: 'var(--fg-0)',
                                                    outline: 'none',
                                                    transition: 'border-color 200ms',
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = 'var(--accent-500)'}
                                                onBlur={(e) => e.target.style.borderColor = 'var(--ink-5)'}
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        gap: 12,
                                        marginTop: 8,
                                    }}>
                                        <button
                                            onClick={handleChangePassword}
                                            disabled={saving}
                                            style={{
                                                flex: 1,
                                                borderRadius: 6,
                                                fontSize: 14,
                                                fontWeight: 600,
                                                opacity: saving ? 0.5 : 1,
                                                padding: '10px 16px',
                                                background: 'var(--accent-500)',
                                                color: 'var(--fg-0)',
                                                border: 'none',
                                                cursor: saving ? 'not-allowed' : 'pointer',
                                                transition: 'all 200ms',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!saving) e.target.style.opacity = '0.9';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!saving) e.target.style.opacity = '1';
                                            }}
                                        >
                                            {saving ? 'Encrypting...' : 'Deploy Cipher'}
                                        </button>
                                        <button
                                            onClick={() => { setShowPasswordChange(false); setPasswordError(''); }}
                                            style={{
                                                paddingLeft: 16,
                                                paddingRight: 16,
                                                borderRadius: 6,
                                                fontSize: 14,
                                                fontWeight: 600,
                                                paddingTop: 10,
                                                paddingBottom: 10,
                                                background: 'var(--ink-2)',
                                                color: 'var(--fg-1)',
                                                border: '1px solid var(--ink-4)',
                                                cursor: 'pointer',
                                                transition: 'all 200ms',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.background = 'var(--ink-1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = 'var(--ink-2)';
                                            }}
                                        >
                                            Abort
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, gridColumn: 'span 2' }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: 16,
                            }}>
                                {[
                                    { label: 'Deployments', val: stats.operations, icon: Terminal, color: '#818cf8' },
                                    { label: 'Data Extracted', val: formatNumber(stats.data_points), icon: Database, color: 'var(--accent-500)' },
                                    { label: 'System Uptime', val: stats.uptime, icon: Clock, color: '#10b981' },
                                    { label: 'Anomalies', val: stats.threats || '0', icon: AlertTriangle, color: '#f59e0b' },
                                ].map((stat, i) => (
                                    <div key={i} className="card" style={{
                                        padding: 20,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textAlign: 'center',
                                    }}>
                                        <stat.icon style={{
                                            width: 24,
                                            height: 24,
                                            color: stat.color,
                                            marginBottom: 12,
                                        }} />
                                        <div style={{
                                            fontSize: 24,
                                            fontWeight: 700,
                                            letterSpacing: -0.5,
                                            color: 'var(--fg-0)',
                                        }}>
                                            {stat.val}
                                        </div>
                                        <div style={{
                                            fontSize: 10,
                                            fontFamily: 'var(--font-mono)',
                                            letterSpacing: 1,
                                            textTransform: 'uppercase',
                                            marginTop: 8,
                                            color: 'var(--fg-3)',
                                        }}>
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="card" style={{ padding: 24 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 24,
                                    paddingBottom: 16,
                                    borderBottom: '1px solid var(--ink-4)',
                                }}>
                                    <h3 style={{
                                        fontSize: 14,
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        color: 'var(--fg-0)',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                    }}>
                                        <Clock style={{
                                            width: 16,
                                            height: 16,
                                            color: 'var(--accent-500)',
                                        }} />
                                        Operation Log (Recent)
                                    </h3>
                                    <a href="/dashboard" style={{
                                        fontSize: 10,
                                        fontFamily: 'var(--font-mono)',
                                        textTransform: 'uppercase',
                                        letterSpacing: 2,
                                        color: 'var(--accent-500)',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        transition: 'opacity 200ms',
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                                    >
                                        Full Archive
                                        <ChevronRight style={{ width: 14, height: 14 }} />
                                    </a>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0,
                                    position: 'relative',
                                    paddingLeft: 16,
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        left: 5,
                                        top: 8,
                                        bottom: 24,
                                        width: 1,
                                        borderLeft: '1px dashed var(--ink-4)',
                                    }}></div>

                                    {logs.length === 0 ? (
                                        <div style={{
                                            paddingTop: 48,
                                            paddingBottom: 48,
                                            textAlign: 'center',
                                        }}>
                                            <Activity style={{
                                                width: 32,
                                                height: 32,
                                                marginLeft: 'auto',
                                                marginRight: 'auto',
                                                marginBottom: 12,
                                                opacity: 0.2,
                                                color: 'var(--fg-2)',
                                            }} />
                                            <p style={{
                                                fontSize: 10,
                                                fontFamily: 'var(--font-mono)',
                                                textTransform: 'uppercase',
                                                letterSpacing: 1,
                                                color: 'var(--fg-3)',
                                            }}>
                                                No tactical data present in local cache.
                                            </p>
                                        </div>
                                    ) : (
                                        logs.map((log, i) => (
                                            <div key={log.id || i} style={{
                                                paddingBottom: 32,
                                                position: 'relative',
                                            }}>
                                                <div style={{
                                                    position: 'absolute',
                                                    left: -12,
                                                    top: 6,
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: '50%',
                                                    border: '2px solid var(--ink-4)',
                                                    background: 'var(--ink-0)',
                                                    transition: 'border-color 200ms',
                                                }}></div>

                                                <div style={{ marginLeft: 16 }}>
                                                    <div style={{ color: 'var(--fg-0)', fontSize: 14, fontWeight: 500 }}>
                                                        Operation{' '}
                                                        <span style={{
                                                            fontFamily: 'var(--font-mono)',
                                                            fontSize: 11,
                                                            opacity: 0.6,
                                                        }}>
                                                            #{log.id}
                                                        </span>
                                                        <span style={{
                                                            fontWeight: 400,
                                                            marginLeft: 8,
                                                            color: 'var(--fg-2)',
                                                            fontSize: 12,
                                                            fontStyle: 'italic',
                                                        }}>
                                                            Target: {log.pii_data?.full_name || log.pii_data?.username || 'Redacted Entity'}
                                                        </span>
                                                    </div>
                                                    <div style={{
                                                        marginTop: 8,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 12,
                                                        fontSize: 10,
                                                        fontFamily: 'var(--font-mono)',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: 0.5,
                                                        color: 'var(--fg-3)',
                                                    }}>
                                                        <span>
                                                            {new Date(log.timestamp).toLocaleString(undefined, {
                                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </span>
                                                        <span style={{
                                                            width: 4,
                                                            height: 4,
                                                            borderRadius: '50%',
                                                            background: 'rgba(255, 255, 255, 0.2)',
                                                        }}></span>
                                                        <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                                                            {log.wordlist_count || '?'} lines generated
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {logs.length > 0 && (
                                    <div style={{
                                        marginTop: 24,
                                        paddingTop: 16,
                                        borderTop: '1px solid var(--ink-4)',
                                        textAlign: 'center',
                                    }}>
                                        <span style={{
                                            fontSize: 9,
                                            fontFamily: 'var(--font-mono)',
                                            textTransform: 'uppercase',
                                            letterSpacing: 3,
                                            color: 'var(--fg-3)',
                                        }}>
                                            End of Buffer
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DesignAppShell>
    );
};

export default ProfilePage;
