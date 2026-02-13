import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Lock, User, ShieldCheck, AlertCircle, Eye, EyeOff, Fingerprint, ScanLine } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import Logo from '../components/Logo';

const LoginPage = () => {
  const { login, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await googleLogin(credentialResponse.credential);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.error || 'Google Login Failed');
      }
    } catch (err) {
      setError('Google Login Error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate biometric scan delay for effect
    await new Promise(r => setTimeout(r, 800));

    const res = await login(form.username, form.password);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Authentication denied. Invalid credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white relative overflow-hidden font-mono">
      {/* Brand Logo */}
      <div className="absolute top-6 left-6 z-20">
        <Logo className="text-3xl" />
      </div>

      {/* Background Grid Animation */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="w-full h-full bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Security Card */}
        <div className="bg-[#0f0f0f] border border-zinc-800 rounded-lg shadow-[0_0_50px_rgba(229,9,20,0.1)] overflow-hidden">

          {/* Header */}
          <div className="bg-zinc-900/50 p-6 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-widest text-white flex items-center gap-2">
                <ShieldCheck className="text-netflix-red w-6 h-6" />
                SECURE <span className="text-netflix-red">LOGIN</span>
              </h1>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Authorized Personnel Only</p>
            </div>
            <div className="w-12 h-12 bg-black rounded-full border border-zinc-800 flex items-center justify-center animate-pulse">
              <Fingerprint className={`w-6 h-6 ${error ? 'text-red-500' : 'text-green-500/50'}`} />
            </div>
          </div>

          <div className="p-8">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-red-900/20 border border-red-500/50 p-3 rounded flex items-center gap-3 text-sm text-red-200"
              >
                <AlertCircle className="w-4 h-4 text-red-500" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                  <User className="w-3 h-3" /> Agent ID / Username
                </label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full bg-black/50 border border-zinc-700 rounded p-3 text-white focus:border-netflix-red focus:ring-1 focus:ring-red-900 transition-all outline-none font-mono"
                  placeholder="Enter identifier..."
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                  <Lock className="w-3 h-3" /> Access Code
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    className="w-full bg-black/50 border border-zinc-700 rounded p-3 text-white focus:border-netflix-red focus:ring-1 focus:ring-red-900 transition-all outline-none font-mono"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 mt-4 font-bold tracking-wider rounded border transition-all flex items-center justify-center gap-2 ${loading
                  ? 'bg-zinc-800 border-zinc-700 text-gray-400 cursor-not-allowed'
                  : 'bg-netflix-red border-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(229,9,20,0.4)]'
                  }`}
              >
                {loading ? (
                  <>
                    <ScanLine className="w-5 h-5 animate-spin" /> VERIFYING BIOMETRICS...
                  </>
                ) : (
                  'AUTHENTICATE'
                )}
              </button>
            </form>
          </div>

          <div className="bg-zinc-900/30 p-4 border-t border-zinc-800 text-center text-xs text-gray-500">
            New assignment? <Link to="/register" className="text-white hover:text-netflix-red underline decoration-1 underline-offset-4">Initialize Clearance</Link>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Login Failed')}
              theme="filled_black"
              shape="pill"
            />
          </GoogleOAuthProvider>
        </div>

        <div className="mt-8 text-center text-[10px] text-zinc-600 uppercase tracking-widest">
          Restricted Access • PIIcasso Security • v2.5.1
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
