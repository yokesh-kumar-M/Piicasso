import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Lock, User, ShieldCheck, AlertCircle, Eye, EyeOff, Fingerprint, ScanLine } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import Logo from '../components/Logo';

const LoginPage = () => {
  const { login, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFirebaseGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const googleIdToken = credential.idToken; // Using the Google Auth idToken directly for our backend

      const res = await googleLogin(googleIdToken);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.error || 'Google Login Failed');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Google Login Error');
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
        className="w-full max-w-md relative z-10 px-4 md:px-0"
      >
        {/* Security Card */}
        <div className="bg-[#0f0f0f] border border-zinc-800 rounded-lg shadow-[0_0_50px_rgba(229,9,20,0.1)] overflow-hidden">

          {/* Header */}
          <div className="bg-zinc-900/50 p-6 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-widest text-white flex items-center gap-2">
                <ShieldCheck className="text-netflix-red w-6 h-6" />
                Secure <span className="text-netflix-red">Login</span>
              </h1>
              <p className="text-xs text-gray-500 mt-1 tracking-widest">Welcome back</p>
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
                  <User className="w-3 h-3" /> Username or Email
                </label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full bg-black/50 border border-zinc-700 rounded p-3 text-white focus:border-netflix-red focus:ring-1 focus:ring-red-900 transition-all outline-none font-mono"
                  placeholder="Enter username or email..."
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                  <Lock className="w-3 h-3" /> Password
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
                <div className="flex justify-end mt-1">
                  <Link to="/forgot-password" className="text-[10px] text-zinc-500 hover:text-white transition-colors">
                    Forgot Password?
                  </Link>
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
                    <ScanLine className="w-5 h-5 animate-spin" /> Verifying...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>

          <div className="bg-zinc-900/30 p-4 border-t border-zinc-800 text-center text-xs text-gray-500">
            Don't have an account? <Link to="/register" className="text-white hover:text-netflix-red underline decoration-1 underline-offset-4">Create an account</Link>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleFirebaseGoogleLogin}
            disabled={loading}
            className="flex items-center gap-3 px-6 py-3 bg-white text-black rounded-full font-bold shadow-lg hover:bg-gray-200 transition-all font-sans"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            Sign in with Google
          </button>
        </div>

        <div className="mt-8 text-center text-[10px] text-zinc-600 tracking-widest">
          AEGIS v2.5.1
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
