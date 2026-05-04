import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { ModeContext } from '../context/ModeContext';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import Logo from '../components/Logo';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { mode: appMode } = useContext(ModeContext) || { mode: 'security' };
  const isSecurityMode = appMode === 'security';
  
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const theme = {
    card: isSecurityMode ? 'security-card' : 'user-glass-panel',
    accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
    accentBorder: isSecurityMode ? 'border-security-red' : 'border-user-cobalt',
    btnPrimary: isSecurityMode ? 'security-btn-primary' : 'user-btn-primary',
    inputBg: isSecurityMode ? 'bg-black border-zinc-800 focus:border-security-red focus:ring-security-red/50' : 'bg-black/20 border-user-cobalt/20 focus:border-user-cobalt focus:ring-user-cobalt/50',
    textMuted: isSecurityMode ? 'text-zinc-500' : 'text-user-muted',
    iconColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
    headerBorder: isSecurityMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-user-cobalt/20 bg-user-cobalt/5',
    footerBorder: isSecurityMode ? 'border-zinc-800 bg-zinc-900/30' : 'border-user-cobalt/20 bg-user-cobalt/5',
    errorBg: isSecurityMode ? 'bg-red-900/20 border-red-500/50 text-red-200' : 'bg-red-500/10 border-red-500/30 text-red-400',
    successBg: isSecurityMode ? 'bg-green-900/20 border border-green-500/50 text-green-400' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400',
    linkHover: isSecurityMode ? 'hover:text-security-red' : 'hover:text-user-cobalt',
  };

  // ... (handleChange and handleSubmit remain same, skipped for brevity if I can just replace the top or specific part)
  // Actually I need to be careful not to delete logic.
  // I will replace from start of file to the return statement.

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Password strength calculation
  const getPasswordStrength = (pw) => {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score, label: 'WEAK', color: 'bg-red-500' };
    if (score <= 2) return { score, label: 'FAIR', color: 'bg-amber-500' };
    if (score <= 3) return { score, label: 'STRONG', color: 'bg-green-500' };
    return { score, label: 'FORTRESS', color: 'bg-emerald-400' };
  };

  const strength = getPasswordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      // Get location helper
      let lat = null, lng = null;
      try {
        const pos = await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('timeout')), 3000);
          navigator.geolocation.getCurrentPosition(
            (pos) => { clearTimeout(timer); resolve(pos); },
            (err) => { clearTimeout(timer); reject(err); },
            { timeout: 3000, maximumAge: 10000 }
          );
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (e) {
        // Location not available
      }

      // Simulate account provisioning delay
      await new Promise(r => setTimeout(r, 1000));

      const payload = { ...form, lat, lng };
      const res = await axiosInstance.post('user/register/', payload);
      if (res.status === 201) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(res.data?.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center text-white relative overflow-hidden font-mono">
      {/* Brand Logo */}
      <div className="absolute top-6 left-6 z-20">
        <Logo className="text-3xl" />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg relative z-10 px-4 md:px-0"
      >
        {/* Registration Terminal */}
        <div className={`${theme.card} relative`}>
          {/* Corner Markers */}
          <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 -mt-1 -ml-1 ${theme.accentBorder}`}></div>
          <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 -mt-1 -mr-1 ${theme.accentBorder}`}></div>
          <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 -mb-1 -ml-1 ${theme.accentBorder}`}></div>
          <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 -mb-1 -mr-1 ${theme.accentBorder}`}></div>

          <div className={`p-4 border-b flex items-center justify-between ${theme.headerBorder}`}>
            <div className="flex items-center gap-2">
              <Database className={`w-5 h-5 ${theme.textMuted}`} />
              <span className="font-bold text-gray-200">Create Account</span>
            </div>
            <div className="flex gap-1">
              <div className={`w-3 h-3 rounded-full ${isSecurityMode ? 'bg-red-500' : 'bg-user-cobalt'}`}></div>
              <div className="w-3 h-3 bg-zinc-700 rounded-full"></div>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8 text-center">
              <UserPlus className={`w-12 h-12 mx-auto mb-4 ${theme.iconColor}`} />
              <h2 className="text-2xl font-heading tracking-widest uppercase">REGISTER</h2>
              <p className={`text-xs mt-2 ${theme.textMuted}`}>Create a new account for PIIcasso.</p>
            </div>

            {error && (
              <div className={`mb-6 p-3 rounded flex items-center gap-3 text-sm ${theme.errorBg}`}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mb-6 p-4 rounded flex flex-col items-center gap-2 text-center ${theme.successBg}`}
              >
                <CheckCircle className="w-8 h-8 flex-shrink-0 text-green-400" />
                <div>
                  <strong className="text-base">{isSecurityMode ? 'ACCESS GRANTED' : 'Account Created'}</strong>
                  <p className="text-xs mt-1 opacity-80">{isSecurityMode ? 'Credentials provisioned. Redirecting...' : 'Welcome! Redirecting to login...'}</p>
                </div>
              </motion.div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative group">
                  <User className={`absolute left-3 top-3 w-5 h-5 transition-colors ${theme.textMuted} group-focus-within:text-white`} />
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Username"
                    className={`w-full pl-10 pr-4 py-3 text-sm rounded border ring-1 ring-transparent outline-none transition-colors ${theme.inputBg}`}
                    required
                    autoComplete="off"
                  />
                </div>

                <div className="relative group">
                  <Mail className={`absolute left-3 top-3 w-5 h-5 transition-colors ${theme.textMuted} group-focus-within:text-white`} />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    className={`w-full pl-10 pr-4 py-3 text-sm rounded border ring-1 ring-transparent outline-none transition-colors ${theme.inputBg}`}
                    required
                  />
                </div>

                <div className="relative group">
                  <Lock className={`absolute left-3 top-3 w-5 h-5 transition-colors ${theme.textMuted} group-focus-within:text-white`} />
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className={`w-full pl-10 pr-4 py-3 text-sm rounded border ring-1 ring-transparent outline-none transition-colors ${theme.inputBg}`}
                    required
                  />
                  <div className="text-[10px] text-right mt-1 font-mono" style={{ color: form.password ? (strength.score <= 1 ? '#ef4444' : strength.score <= 2 ? '#f59e0b' : '#10b981') : 'inherit' }}>
                    {form.password ? `${form.password.length} chars · ${strength.label}` : ''}
                  </div>
                  {/* Strength bar */}
                  {form.password && (
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength.score ? strength.color : isSecurityMode ? 'bg-zinc-800' : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 mt-4 rounded font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-wait ${theme.btnPrimary}`}
                >
                  {loading
                    ? (isSecurityMode ? 'Provisioning Account...' : 'Creating Account...')
                    : 'Sign Up'
                  }
                </button>
              </form>
            )}
          </div>

          <div className={`p-4 border-t text-center ${theme.footerBorder}`}>
            <Link to="/login" className={`text-xs transition-colors flex items-center justify-center gap-2 py-3 ${theme.textMuted} hover:text-white`}>
              <Lock className="w-3 h-3" /> Already have an account? Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
