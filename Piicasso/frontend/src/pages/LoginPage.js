import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ModeContext } from '../context/ModeContext';
import { motion } from 'framer-motion';
import { Lock, User, ShieldCheck, AlertCircle, Eye, EyeOff, Fingerprint, ScanLine } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import Logo from '../components/Logo';

const LoginPage = () => {
  const { login, googleLogin } = useContext(AuthContext);
  const { mode: appMode, openModeModal } = useContext(ModeContext) || { mode: 'security' };
  const isSecurityMode = appMode === 'security';
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const theme = {
    card: isSecurityMode ? 'security-card' : 'user-glass-panel',
    accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
    accentBg: isSecurityMode ? 'bg-security-red' : 'bg-user-cobalt',
    btnPrimary: isSecurityMode ? 'security-btn-primary' : 'user-btn-primary',
    inputBg: isSecurityMode ? 'bg-black/50 border-zinc-800 focus:border-security-red focus:ring-security-red/50' : 'bg-white/5 border-white/10 focus:border-user-cobalt focus:ring-user-cobalt/50',
    textMuted: isSecurityMode ? 'text-zinc-500' : 'text-user-muted',
    iconColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
    headerBorder: isSecurityMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-user-cobalt/20 bg-user-cobalt/5',
    footerBorder: isSecurityMode ? 'border-zinc-800 bg-zinc-900/30' : 'border-user-cobalt/20 bg-user-cobalt/5',
    errorBg: isSecurityMode ? 'bg-red-900/20 border-red-500/50 text-red-200' : 'bg-red-500/10 border-red-500/30 text-red-400',
    linkHover: isSecurityMode ? 'hover:text-security-red' : 'hover:text-user-cobalt',
    iconBg: isSecurityMode ? 'bg-black border-zinc-800' : 'bg-black/40 border-user-cobalt/20',
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await googleLogin(credentialResponse.credential);
      if (res.success) {
        const hasSelectedMode = localStorage.getItem('app_mode');
        if (!hasSelectedMode) {
          openModeModal();
        }
        navigate('/');
      } else {
        setError(res.error || 'Google Login Failed');
      }
    } catch (err) {
      console.error('Google Native Login Error:', err);
      setError('An error occurred while connecting to Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 800));

    const res = await login(form.username, form.password);
    setLoading(false);

    if (res.success) {
      const hasSelectedMode = localStorage.getItem('app_mode');
      if (!hasSelectedMode) {
        openModeModal();
      }
      navigate('/');
    } else {
      setError(res.error || 'Authentication denied. Invalid credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center text-white relative overflow-hidden font-mono">
      {/* Brand Logo */}
      <div className="absolute top-6 left-6 z-20">
        <Logo className="text-3xl" />
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10 px-4 md:px-0"
      >
        {/* Security Card */}
        <div className={`${theme.card} overflow-hidden`}>

          {/* Header */}
          <div className={`p-6 border-b flex justify-between items-center ${theme.headerBorder}`}>
            <div>
              <h1 className="text-2xl font-bold tracking-widest text-white flex items-center gap-2">
                <ShieldCheck className={`${theme.iconColor} w-6 h-6`} />
                Secure <span className={theme.iconColor}>Login</span>
              </h1>
              <p className={`text-xs mt-1 tracking-widest ${theme.textMuted}`}>Welcome back</p>
            </div>
            <div className={`w-12 h-12 rounded-full border flex items-center justify-center animate-pulse ${theme.iconBg}`}>
              <Fingerprint className={`w-6 h-6 ${error ? 'text-red-500' : isSecurityMode ? 'text-green-500/50' : 'text-emerald-400'}`} />
            </div>
          </div>

          <div className="p-8">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 border p-3 rounded flex items-center gap-3 text-sm ${theme.errorBg}`}
              >
                <AlertCircle className="w-4 h-4 text-red-500" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase flex items-center gap-2 ${theme.textMuted}`}>
                  <User className="w-3 h-3" /> Username or Email
                </label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className={`w-full rounded p-3 text-white ring-1 ring-transparent transition-all outline-none font-mono ${theme.inputBg}`}
                  placeholder="Enter username or email..."
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase flex items-center gap-2 ${theme.textMuted}`}>
                  <Lock className="w-3 h-3" /> Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    className={`w-full rounded p-3 text-white ring-1 ring-transparent transition-all outline-none font-mono pr-10 ${theme.inputBg}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-3 ${theme.textMuted} hover:text-white transition-colors`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-1">
                  <Link to="/forgot-password" className={`text-[10px] ${theme.textMuted} hover:text-white transition-colors`}>
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-4 font-bold tracking-wider rounded transition-all flex items-center justify-center gap-2 ${loading
                  ? 'bg-zinc-800 border border-zinc-700 text-gray-400 cursor-not-allowed py-4'
                  : `${theme.btnPrimary} !py-4`
                  }`}
              >
                {loading ? (
                  <>
                    <ScanLine className="w-5 h-5 animate-spin" /> Verifying...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>

          <div className={`p-4 border-t text-center text-xs ${theme.footerBorder} ${theme.textMuted}`}>
            Don't have an account? <Link to="/register" className={`text-white underline decoration-1 underline-offset-4 transition-colors ${theme.linkHover}`}>Create an account</Link>
          </div>
        </div>

        <div className="mt-6 flex justify-center w-full">
          {process.env.REACT_APP_GOOGLE_CLIENT_ID ? (
            <div className="flex flex-col items-center gap-2">
              <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    setError('Google Authentication was cancelled or failed.');
                  }}
                  theme={isSecurityMode ? 'filled_black' : 'outline'}
                  shape="pill"
                  text="continue_with"
                  context="signin"
                  useOneTap={false}
                />
              </GoogleOAuthProvider>
              {error === 'Google Authentication was cancelled or failed.' && (
                <span className="text-[10px] text-red-500 mt-2 text-center max-w-xs">If you see "origin_mismatch", wait 5 mins for Google Cloud to sync. You may also need to clear your browser cache.</span>
              )}
            </div>
          ) : (
            <div className={`w-full p-3 rounded text-center text-xs border ${theme.errorBg}`}>
              <strong>Configuration Error:</strong> REACT_APP_GOOGLE_CLIENT_ID is missing. 
              Please restart your terminal/development server to load the new .env variables.
            </div>
          )}
        </div>

        <div className={`mt-8 text-center text-[10px] tracking-widest ${theme.textMuted}`}>
          PIIcasso v2.5.1
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
