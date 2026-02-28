import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Mail, ArrowLeft, Send, KeyRound, Lock, CheckCircle } from 'lucide-react';
import axios from '../api/axios';
import Logo from '../components/Logo';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1 = Request, 2 = Verify & Reset, 3 = Success

    // Data State
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Status State
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address.');
            return;
        }

        setError('');
        setMessage('');
        setLoading(true);

        try {
            const res = await axios.post('/auth/request-reset/', { email });
            setMessage(res.data.message);
            setStep(2); // Proceed to OTP entry
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to request OTP. Ensure your systems are online.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyReset = async (e) => {
        e.preventDefault();
        if (!otp || !newPassword) {
            setError('All fields are required.');
            return;
        }
        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters.');
            return;
        }

        setError('');
        setMessage('');
        setLoading(true);

        try {
            const res = await axios.post('/auth/verify-reset/', { email, otp, new_password: newPassword });
            setMessage(res.data.message);
            setStep(3); // Proceed to success
        } catch (err) {
            setError(err.response?.data?.error || 'Verification failed. Incorrect OTP.');
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
                <div className="bg-[#0f0f0f] border border-zinc-800 rounded-lg shadow-[0_0_50px_rgba(229,9,20,0.1)] overflow-hidden">
                    {/* Header */}
                    <div className="bg-zinc-900/50 p-6 border-b border-zinc-800 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold tracking-widest text-white flex items-center gap-2">
                                System <span className="text-netflix-red">Recovery</span>
                            </h1>
                            <p className="text-xs text-gray-500 mt-1 tracking-widest">
                                {step === 1 && 'Authenticate via email transmission'}
                                {step === 2 && 'Verify 6-digit access code'}
                                {step === 3 && 'Access Restored'}
                            </p>
                        </div>
                        <div className={`w-12 h-12 bg-black rounded-full border border-zinc-800 flex items-center justify-center ${step === 3 ? '' : 'animate-pulse'}`}>
                            {step === 3 ? (
                                <CheckCircle className="w-6 h-6 text-green-500" />
                            ) : (
                                <ShieldAlert className="w-6 h-6 text-yellow-500/50" />
                            )}
                        </div>
                    </div>

                    <div className="p-8">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mb-6 bg-red-900/20 border border-red-500/50 p-3 rounded flex items-center gap-3 text-sm text-red-200"
                                >
                                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mb-6 bg-green-900/20 border border-green-500/50 p-3 rounded flex items-start gap-3 text-sm text-green-200"
                                >
                                    <Mail className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                    {message}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* STEP 1: REQUEST OTP */}
                        {step === 1 && (
                            <form onSubmit={handleRequestOTP} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                        <Mail className="w-3 h-3" /> Registered Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-black/50 border border-zinc-700 rounded p-3 text-white focus:border-netflix-red focus:ring-1 focus:ring-red-900 transition-all outline-none font-mono"
                                        placeholder="operator@network.com"
                                        autoComplete="off"
                                    />
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
                                            <Send className="w-5 h-5 animate-bounce" /> Transmitting...
                                        </>
                                    ) : (
                                        <>
                                            <KeyRound className="w-4 h-4" /> Request Access Code
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* STEP 2: VERIFY OTP AND SET NEW PASSWORD */}
                        {step === 2 && (
                            <motion.form
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                onSubmit={handleVerifyReset}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                        <KeyRound className="w-3 h-3" /> 6-Digit Authorization Code
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-black/50 border border-zinc-700 rounded p-3 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-900 transition-all outline-none font-mono tracking-widest text-center text-xl"
                                        placeholder="------"
                                        autoComplete="off"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mt-4">
                                        <Lock className="w-3 h-3" /> New System Password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-black/50 border border-zinc-700 rounded p-3 text-white focus:border-netflix-red focus:ring-1 focus:ring-red-900 transition-all outline-none font-mono"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-4 mt-4 font-bold tracking-wider rounded border transition-all flex items-center justify-center gap-2 ${loading
                                        ? 'bg-zinc-800 border-zinc-700 text-gray-400 cursor-not-allowed'
                                        : 'bg-yellow-600 border-yellow-500 hover:bg-yellow-700 text-black shadow-[0_0_20px_rgba(202,138,4,0.4)]'
                                        }`}
                                >
                                    {loading ? (
                                        <>
                                            <Send className="w-5 h-5 animate-spin" /> Verifying...
                                        </>
                                    ) : (
                                        'Confirm & Reset'
                                    )}
                                </button>
                            </motion.form>
                        )}

                        {/* STEP 3: SUCCESS */}
                        {step === 3 && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                                <p className="text-zinc-400 text-sm mb-8">
                                    Your identity matrix has been successfully updated. Secure access to your account has been restored.
                                </p>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full py-4 font-bold tracking-wider rounded border bg-green-600 border-green-500 hover:bg-green-700 text-black shadow-[0_0_20px_rgba(22,163,74,0.4)] transition-all flex items-center justify-center gap-2"
                                >
                                    Return to Dashboard
                                </button>
                            </motion.div>
                        )}

                    </div>

                    <div className="bg-zinc-900/30 p-4 border-t border-zinc-800 text-center text-xs text-gray-500 flex justify-center items-center gap-2 hover:text-white transition-colors cursor-pointer">
                        <ArrowLeft className="w-4 h-4" />
                        <Link to="/login" className="tracking-widest uppercase font-bold decoration-1 underline-offset-4">Cancel Recovery</Link>
                    </div>
                </div>

                <div className="mt-8 text-center text-[10px] text-zinc-600 tracking-widest">
                    PIIcasso v2.5.1
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
