import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Mail, ArrowLeft, Send, KeyRound, Lock, CheckCircle } from 'lucide-react';
import axios from '../api/axios';
import Logo from '../components/Logo';
import { ModeContext } from '../context/ModeContext';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const { mode: appMode } = useContext(ModeContext) || { mode: 'security' };
    const isSecurityMode = appMode === 'security';

    const [step, setStep] = useState(1); // 1 = Request, 2 = Verify & Reset, 3 = Success

    // Data State
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Status State
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const theme = {
        card: isSecurityMode ? 'security-card' : 'user-glass-panel',
        accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
        btnPrimary: isSecurityMode ? 'security-btn-primary' : 'user-btn-primary',
        inputBg: isSecurityMode ? 'bg-black/50 border-zinc-800 focus:border-security-red focus:ring-security-red/50' : 'bg-white/5 border-white/10 focus:border-user-cobalt focus:ring-user-cobalt/50',
        textMuted: isSecurityMode ? 'text-zinc-500' : 'text-user-muted',
        iconColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
        headerBorder: isSecurityMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-user-cobalt/20 bg-user-cobalt/5',
        footerBorder: isSecurityMode ? 'border-zinc-800 bg-zinc-900/30' : 'border-user-cobalt/20 bg-user-cobalt/5',
        errorBg: isSecurityMode ? 'bg-red-900/20 border-red-500/50 text-red-200' : 'bg-red-500/10 border-red-500/30 text-red-400',
        successBg: isSecurityMode ? 'bg-green-900/20 border-green-500/50 text-green-200' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        iconBg: isSecurityMode ? 'bg-black border-zinc-800' : 'bg-black/40 border-user-cobalt/20',
        verifyBtn: isSecurityMode ? 'bg-yellow-600 border-yellow-500 hover:bg-yellow-700 text-black shadow-[0_0_20px_rgba(202,138,4,0.4)]' : 'bg-indigo-500 border-indigo-400 hover:bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]',
        successBtn: isSecurityMode ? 'bg-green-600 border-green-500 hover:bg-green-700 text-black shadow-[0_0_20px_rgba(22,163,74,0.4)]' : 'bg-emerald-500 border-emerald-400 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
    };

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
            const res = await axios.post('auth/password/reset/', { email });
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
            const res = await axios.post('auth/password/reset/verify/', { email, otp, new_password: newPassword });
            setMessage(res.data.message);
            setStep(3); // Proceed to success
        } catch (err) {
            setError(err.response?.data?.error || 'Verification failed. Incorrect OTP.');
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
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10 px-4"
            >
                <div className={`${theme.card} overflow-hidden`}>
                    {/* Header */}
                    <div className={`p-6 border-b flex justify-between items-center ${theme.headerBorder}`}>
                        <div>
                            <h1 className="text-2xl font-bold tracking-widest text-white flex items-center gap-2">
                                System <span className={theme.iconColor}>Recovery</span>
                            </h1>
                            <p className={`text-xs mt-1 tracking-widest ${theme.textMuted}`}>
                                {step === 1 && 'Authenticate via email transmission'}
                                {step === 2 && 'Verify 6-digit access code'}
                                {step === 3 && 'Access Restored'}
                            </p>
                        </div>
                        <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${step === 3 ? '' : 'animate-pulse'} ${theme.iconBg}`}>
                            {step === 3 ? (
                                <CheckCircle className="w-6 h-6 text-green-500" />
                            ) : (
                                <ShieldAlert className={`w-6 h-6 ${isSecurityMode ? 'text-yellow-500/50' : 'text-user-cobalt/50'}`} />
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
                                    className={`mb-6 border p-3 rounded flex items-center gap-3 text-sm ${theme.errorBg}`}
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
                                    className={`mb-6 border p-3 rounded flex items-start gap-3 text-sm ${theme.successBg}`}
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
                                    <label className={`text-xs font-bold uppercase flex items-center gap-2 ${theme.textMuted}`}>
                                        <Mail className="w-3 h-3" /> Registered Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`w-full rounded p-3 text-white ring-1 ring-transparent transition-all outline-none font-mono ${theme.inputBg}`}
                                        placeholder="operator@network.com"
                                        autoComplete="off"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-4 mt-4 font-bold tracking-wider rounded border transition-all flex items-center justify-center gap-2 ${loading
                                        ? 'bg-zinc-800 border border-zinc-700 text-gray-400 cursor-not-allowed'
                                        : theme.btnPrimary
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
                                    <label className={`text-xs font-bold uppercase flex items-center gap-2 ${theme.textMuted}`}>
                                        <KeyRound className="w-3 h-3" /> 6-Digit Authorization Code
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className={`w-full rounded p-3 text-white ring-1 ring-transparent transition-all outline-none font-mono tracking-widest text-center text-xl ${theme.inputBg}`}
                                        placeholder="------"
                                        autoComplete="off"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className={`text-xs font-bold uppercase flex items-center gap-2 mt-4 ${theme.textMuted}`}>
                                        <Lock className="w-3 h-3" /> New System Password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className={`w-full rounded p-3 text-white ring-1 ring-transparent transition-all outline-none font-mono ${theme.inputBg}`}
                                        placeholder="••••••••"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-4 mt-4 font-bold tracking-wider rounded border transition-all flex items-center justify-center gap-2 ${loading
                                        ? 'bg-zinc-800 border-zinc-700 text-gray-400 cursor-not-allowed'
                                        : theme.verifyBtn
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
                                <p className={`${theme.textMuted} text-sm mb-8`}>
                                    Your identity matrix has been successfully updated. Secure access to your account has been restored.
                                </p>
                                <button
                                    onClick={() => navigate('/login')}
                                    className={`w-full py-4 font-bold tracking-wider rounded border transition-all flex items-center justify-center gap-2 ${theme.successBtn}`}
                                >
                                    Return to Dashboard
                                </button>
                            </motion.div>
                        )}

                    </div>

                    <div className={`p-4 border-t text-center text-xs flex justify-center items-center gap-2 transition-colors cursor-pointer ${theme.footerBorder} ${theme.textMuted} hover:text-white`}>
                        <ArrowLeft className="w-4 h-4" />
                        <Link to="/login" className="tracking-widest uppercase font-bold decoration-1 underline-offset-4">Cancel Recovery</Link>
                    </div>
                </div>

                <div className={`mt-8 text-center text-[10px] tracking-widest ${theme.textMuted}`}>
                    PIIcasso v2.5.1
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
