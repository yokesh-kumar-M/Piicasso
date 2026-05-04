import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, RefreshCw, Eye, EyeOff, AlertCircle, CheckCircle, XCircle, ChevronDown, ChevronUp, Lock, User, FileText, Smartphone } from 'lucide-react';
import axiosInstance from '../api/axios';
import PasswordGenerator from '../components/PasswordGenerator';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const UserDashboardPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = React.useContext(AuthContext);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [generatorExpanded, setGeneratorExpanded] = useState(false);
  const [piiExpanded, setPiiExpanded] = useState(false);
  const [piiData, setPiiData] = useState({
    full_name: '', dob: '', pet_name: '', phone: '', username: '', email: ''
  });

  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await axiosInstance.get('password/activity/');
        setActivities(res.data.activities || []);
      } catch (err) {
        setActivities([]);
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchActivities();
  }, []);

  useEffect(() => {
    if (result) {
      const newActivity = {
        id: `live-${Date.now()}`,
        type: 'scan',
        message: `Security scan: ${result.vulnerability_level?.toUpperCase() || 'UNKNOWN'}`,
        details: { strength_score: result.strength_score, breach_count: result.breach_count },
        time: new Date().toISOString(),
        status: result.breach_count > 0 ? 'danger' : 'success',
      };
      setActivities(prev => [newActivity, ...prev].slice(0, 15));
    }
  }, [result]);

  const localStrengthScore = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 16) score += 25;
    else if (password.length >= 12) score += 20;
    else if (password.length >= 8) score += 10;
    else if (password.length >= 6) score += 5;
    
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?\/]/.test(password);
    
    const charTypes = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
    if (charTypes >= 4) score += 25;
    else if (charTypes >= 3) score += 15;
    else if (charTypes >= 2) score += 5;
    
    if (!/(.)\1{2,}/.test(password) && !/^(123|abc|qwerty|password)/i.test(password)) score += 10;
    return Math.min(score, 100);
  }, [password]);

  const handleAnalyze = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!password) { setError('Please enter a password to analyze.'); return; }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await axiosInstance.post('password/analyze/', { password, pii_data: piiData });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (score) => {
    if (score >= 75) return '#10b981'; // emerald-500
    if (score >= 50) return '#f59e0b'; // amber-500
    if (score >= 25) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#020617] font-sans">
      <div className="flex-1 max-w-[1200px] mx-auto p-4 sm:p-8 pt-24">
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tight flex items-center gap-4 mb-3">
          <Lock className="w-10 h-10 text-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]" />
          Shield Center
        </h1>
        <p className="text-blue-200/50 text-sm md:text-base max-w-2xl leading-relaxed">
          Enterprise-grade password evaluation. Detect compromised credentials and receive tailored recommendations to fortify your digital perimeter.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* Left Column: Analysis Form */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="relative overflow-hidden usr-card p-5 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent pointer-events-none"></div>
            
            <label className="block text-xs font-semibold text-blue-400/80 mb-3 uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-4 h-4" /> Target Credential
            </label>
            
            <div className="relative mb-6">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0f1c] text-white px-5 py-4 rounded-xl border border-blue-900/40 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all pr-14 font-mono text-lg shadow-inner placeholder-blue-900/40"
                placeholder="Enter password..."
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-white transition-colors bg-[#0a0f1c] p-1 rounded"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <AnimatePresence>
              {password && (
                <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="mb-6 overflow-hidden">
                  <div className="bg-[#0a0f1c]/60 p-4 rounded-xl border border-blue-900/20">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-semibold text-blue-300 uppercase tracking-widest">
                        Entropy Estimate
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${getStrengthColor(localStrengthScore)}15`, color: getStrengthColor(localStrengthScore), border: `1px solid ${getStrengthColor(localStrengthScore)}30` }}>
                        {localStrengthScore}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#0a0f1c] rounded-full overflow-hidden border border-black/30">
                      <div 
                        className="h-full rounded-full transition-all duration-700 ease-out relative"
                        style={{ width: `${localStrengthScore}%`, backgroundColor: getStrengthColor(localStrengthScore) }}
                      >
                        <div className="absolute inset-0 bg-white/15"></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-400 text-sm flex items-center gap-3 font-medium">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 relative z-10">
              <button
                onClick={handleAnalyze}
                disabled={loading || !password}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 px-5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold tracking-wide shadow-[0_0_20px_rgba(59,130,246,0.25)] transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] active:scale-[0.98]"
              >
                {loading ? <><RefreshCw className="w-5 h-5 animate-spin" /> Processing...</> : 'Initialize Scan'}
              </button>

              <button
                onClick={() => setPiiExpanded(!piiExpanded)}
                className="bg-[#0a0f1c] hover:bg-[#0f1525] text-blue-300 hover:text-white font-medium py-3.5 px-5 rounded-xl border border-blue-900/40 flex items-center justify-center gap-2 transition-all group"
              >
                {piiExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                Context <span className="hidden sm:inline">(Optional)</span>
              </button>
              
              <button
                onClick={() => setGeneratorExpanded(!generatorExpanded)}
                className="bg-[#0a0f1c] hover:bg-[#0f1525] text-blue-300 hover:text-white font-medium py-3.5 px-5 rounded-xl border border-blue-900/40 flex items-center justify-center gap-2 transition-all group"
              >
                {generatorExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                Generate
              </button>
            </div>
          </div>

          {/* Expandables */}
          <AnimatePresence>
            {piiExpanded && (
              <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="overflow-hidden">
                <div className="usr-card p-6 sm:p-8 mt-6">
                  <div className="flex items-center gap-3 mb-6 border-b border-blue-900/20 pb-4">
                    <User className="w-5 h-5 text-blue-500" />
                    <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-widest">Contextual Vectors</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    {[
                      { key: 'full_name', label: 'Full Name', icon: User },
                      { key: 'dob', label: 'Birth Date', icon: FileText },
                      { key: 'pet_name', label: 'Pet Name', icon: FileText },
                      { key: 'phone', label: 'Phone', icon: Smartphone },
                      { key: 'username', label: 'Username', icon: User },
                      { key: 'email', label: 'Email', icon: FileText }
                    ].map(field => {
                      const Icon = field.icon;
                      return (
                        <div key={field.key} className="space-y-2 group">
                          <label className="text-[10px] font-semibold text-blue-500/60 uppercase tracking-widest flex items-center gap-1.5 group-focus-within:text-blue-400 transition-colors">
                            <Icon className="w-3.5 h-3.5" /> {field.label}
                          </label>
                          <input 
                            className="w-full bg-[#0a0f1c] text-white px-4 py-3 rounded-xl border border-blue-900/20 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all text-sm font-mono placeholder-blue-900/30" 
                            placeholder={`...`}
                            value={piiData[field.key]} 
                            onChange={e => setPiiData({...piiData, [field.key]: e.target.value})} 
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {generatorExpanded && (
              <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="overflow-hidden">
                <div className="usr-card p-6 sm:p-8 mt-6">
                  <PasswordGenerator onSelect={(pwd) => {
                    setPassword(pwd);
                    setGeneratorExpanded(false);
                  }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Right Column: Results & Analytics */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div 
                key="empty"
                initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                className="flex-1 usr-card border-dashed p-8 flex flex-col items-center justify-center text-center min-h-[400px]"
              >
                <div className="w-20 h-20 rounded-full bg-blue-900/20 flex items-center justify-center mb-6">
                  <Lock className="w-10 h-10 text-blue-500/30" />
                </div>
                <h3 className="text-lg font-semibold text-blue-300 mb-2">Awaiting Target Data</h3>
                <p className="text-sm text-blue-200/40 max-w-sm">
                  Enter a credential to initiate the security scan. Our engine cross-references known breach databases and structural entropy.
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}}
                className="flex-1 flex flex-col gap-6"
              >
                {/* Primary Status Card */}
                <div className="usr-card p-8 flex flex-col items-center text-center relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-1 ${
                    result.breach_count > 0 ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)]' :
                    result.strength_score < 50 ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,1)]' :
                    'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,1)]'
                  }`}></div>
                  
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 border-[3px] ${
                    result.breach_count > 0 ? 'bg-red-500/10 border-red-500/30' :
                    result.strength_score < 50 ? 'bg-amber-500/10 border-amber-500/30' :
                    'bg-emerald-500/10 border-emerald-500/30'
                  }`}>
                    {result.breach_count > 0 ? <AlertCircle className="w-10 h-10 text-red-500" /> :
                     result.strength_score < 50 ? <AlertCircle className="w-10 h-10 text-amber-500" /> :
                     <CheckCircle className="w-10 h-10 text-emerald-500" />}
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white tracking-tight uppercase mb-3">
                    {result.vulnerability_level || 'Evaluated'}
                  </h2>
                  <p className="text-blue-200/50 text-sm max-w-sm">
                    {result.breach_count > 0 
                      ? 'This password has appeared in known data breaches and is highly unsafe.' 
                      : result.strength_score < 50 
                        ? 'This password is weak and vulnerable to structural cracking.'
                        : 'This password appears secure against basic dictionary and brute-force attacks.'}
                  </p>
                </div>

                {/* Score & Breaches */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="usr-card p-6 relative overflow-hidden group">
                    <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Shield className="w-32 h-32 text-blue-500" />
                    </div>
                    <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest mb-4">Calculated Score</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-white tracking-tighter">{result.strength_score}</span>
                      <span className="text-blue-500/50 font-semibold mb-1">/100</span>
                    </div>
                  </div>

                  <div className="usr-card p-6 relative overflow-hidden group">
                    <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
                      <GlobeIcon className="w-32 h-32 text-blue-500" />
                    </div>
                    <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest mb-4">Breach Detections</div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-5xl font-bold tracking-tighter ${result.breach_count > 0 ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]'}`}>
                        {result.breach_count > 0 ? result.breach_count.toLocaleString() : '0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Intelligence Brief */}
                {result.feedback && result.feedback.length > 0 && (
                  <div className="usr-card p-6 sm:p-8">
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-5 flex items-center gap-2 border-b border-blue-900/20 pb-3">
                      <AlertCircle className="w-4 h-4" /> Intelligence Brief
                    </span>
                    <ul className="space-y-4">
                      {result.feedback.map((f, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-blue-200/70">
                          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
                          <span className="leading-relaxed">{f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
      </div>
    </div>
  );
};

const GlobeIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

export default UserDashboardPage;