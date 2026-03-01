import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import Logo from '../components/Logo';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ... (handleChange and handleSubmit remain same, skipped for brevity if I can just replace the top or specific part)
  // Actually I need to be careful not to delete logic.
  // I will replace from start of file to the return statement.

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
      const res = await axiosInstance.post('register/', payload);
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
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white relative overflow-hidden font-mono">
      {/* Brand Logo */}
      <div className="absolute top-6 left-6 z-20">
        <Logo className="text-3xl" />
      </div>

      {/* Background Dots */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg relative z-10 px-4 md:px-0"
      >
        {/* Registration Terminal */}
        <div className="bg-[#0f0f0f] border-2 border-zinc-800 rounded-sm shadow-2xl relative">
          {/* Corner Markers */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-netflix-red -mt-1 -ml-1"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-netflix-red -mt-1 -mr-1"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-netflix-red -mb-1 -ml-1"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-netflix-red -mb-1 -mr-1"></div>

          <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-gray-400" />
              <span className="font-bold text-gray-200">Create Account</span>
            </div>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-zinc-700 rounded-full"></div>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8 text-center">
              <UserPlus className="w-12 h-12 text-netflix-red mx-auto mb-4" />
              <h2 className="text-2xl font-heading tracking-widest">REGISTER</h2>
              <p className="text-xs text-gray-500 mt-2">Create a new account for AEGIS.</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500 p-3 rounded flex items-center gap-3 text-sm text-red-200">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-500/10 border border-green-500 p-3 rounded flex items-center gap-3 text-sm text-green-200">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <div>
                  <strong>SUCCESS:</strong> Account created. Redirecting...
                </div>
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative group">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Username"
                    className="w-full bg-black border border-zinc-700 pl-10 pr-4 py-3 text-sm rounded focus:border-white focus:outline-none transition-colors placeholder-gray-600"
                    required
                    autoComplete="off"
                  />
                </div>

                <div className="relative group">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    className="w-full bg-black border border-zinc-700 pl-10 pr-4 py-3 text-sm rounded focus:border-white focus:outline-none transition-colors placeholder-gray-600"
                    required
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="w-full bg-black border border-zinc-700 pl-10 pr-4 py-3 text-sm rounded focus:border-white focus:outline-none transition-colors placeholder-gray-600"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black font-bold py-3 mt-4 hover:bg-gray-200 transition-colors uppercase tracking-widest disabled:opacity-50 disabled:cursor-wait"
                >
                  {loading ? 'Registering...' : 'Sign Up'}
                </button>
              </form>
            )}
          </div>

          <div className="bg-zinc-900 border-t border-zinc-800 p-4 text-center">
            <Link to="/login" className="text-xs text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2">
              <Lock className="w-3 h-3" /> Already have an account? Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
