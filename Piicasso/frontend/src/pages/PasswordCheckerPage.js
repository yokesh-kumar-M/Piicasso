import React, { useState, useCallback, useEffect, useMemo } from 'react';
import axiosInstance from '../api/axios';
import { 
  Shield, Lock, Eye, EyeOff, AlertTriangle, CheckCircle, 
  XCircle, Info, RefreshCw, ChevronDown, ChevronUp,
  Fingerprint, Clock, Database, AlertCircle, Lightbulb,
  Sparkles, Wand2
} from 'lucide-react';
import PasswordGenerator from '../components/PasswordGenerator';

const PasswordCheckerPage = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [piiExpanded, setPiiExpanded] = useState(false);
  const [generatorExpanded, setGeneratorExpanded] = useState(false);
  const [piiData, setPiiData] = useState({
    full_name: '',
    dob: '',
    pet_name: '',
    phone: '',
    username: '',
    email: ''
  });

  const getStrengthColor = (score) => {
    if (score >= 75) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    if (score >= 25) return 'text-orange-500';
    return 'text-red-500';
  };

  const getStrengthBg = (score) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getLevelBadge = (level) => {
    const styles = {
      low: 'bg-green-500/20 text-green-400 border-green-500/50',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      critical: 'bg-red-500/20 text-red-400 border-red-500/50'
    };
    return styles[level] || styles.critical;
  };

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
    
    if (!/(.)\1{2,}/.test(password) && !/^(123|abc|qwerty|password)/i.test(password)) {
      score += 10;
    }
    
    return Math.min(score, 100);
  }, [password]);

  const handleAnalyze = async () => {
    if (!password) {
      setError('Please enter a password to analyze');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await axiosInstance.post('password/analyze/', {
        password,
        pii_data: piiData
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePiiChange = (field, value) => {
    setPiiData(prev => ({ ...prev, [field]: value }));
  };

  const handleUseGeneratedPassword = (generatedPassword) => {
    setPassword(generatedPassword);
    setGeneratorExpanded(false);
  };

  const resetForm = () => {
    setPassword('');
    setResult(null);
    setError('');
    setPiiData({
      full_name: '',
      dob: '',
      pet_name: '',
      phone: '',
      username: '',
      email: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#141414] border border-zinc-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Password Vulnerability Checker</h1>
            <p className="text-zinc-400 text-sm">Check if your password is secure and hasn't been exposed in breaches</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
              Enter Password to Check
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password..."
                className="w-full bg-black/50 border border-zinc-700 rounded-lg py-4 pl-12 pr-12 text-white focus:border-green-500 focus:ring-1 focus:ring-green-900 outline-none transition-all"
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {password && (
            <div className="bg-black/30 rounded-lg p-4 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 uppercase">Password Strength</span>
                <span className={`text-sm font-bold ${getStrengthColor(
                  result ? result.strength_score : localStrengthScore
                )}`}>
                  {result ? `${result.strength_score}%` : `${localStrengthScore}%`}
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${getStrengthBg(
                    result ? result.strength_score : localStrengthScore
                  )}`}
                  style={{ width: `${result ? result.strength_score : localStrengthScore}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading || !password}
            className={`w-full py-4 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all ${
              loading || !password
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/20'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Fingerprint className="w-5 h-5" />
                Check Password Vulnerability
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#141414] border border-zinc-800 rounded-lg overflow-hidden">
        <button
          onClick={() => setGeneratorExpanded(!generatorExpanded)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium text-white">
              Password Generator
            </span>
            <span className="text-xs text-zinc-500">
              Need a strong password? Generate one instantly
            </span>
          </div>
          {generatorExpanded ? (
            <ChevronUp className="w-5 h-5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          )}
        </button>

        {generatorExpanded && (
          <div className="p-4 pt-0">
            <PasswordGenerator onUsePassword={handleUseGeneratedPassword} />
          </div>
        )}
      </div>

      <div className="bg-[#141414] border border-zinc-800 rounded-lg overflow-hidden">
        <button
          onClick={() => setPiiExpanded(!piiExpanded)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-zinc-400" />
            <span className="text-sm font-medium text-white">
              Personal Information (Optional)
            </span>
            <span className="text-xs text-zinc-500">
              Helps identify if your password contains personal data
            </span>
          </div>
          {piiExpanded ? (
            <ChevronUp className="w-5 h-5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          )}
        </button>

        {piiExpanded && (
          <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Full Name</label>
              <input
                type="text"
                value={piiData.full_name}
                onChange={(e) => handlePiiChange('full_name', e.target.value)}
                placeholder="John Doe"
                className="w-full bg-black/50 border border-zinc-700 rounded-lg py-3 px-4 text-white focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Birth Year</label>
              <input
                type="text"
                value={piiData.dob}
                onChange={(e) => handlePiiChange('dob', e.target.value)}
                placeholder="1990"
                className="w-full bg-black/50 border border-zinc-700 rounded-lg py-3 px-4 text-white focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Pet Name</label>
              <input
                type="text"
                value={piiData.pet_name}
                onChange={(e) => handlePiiChange('pet_name', e.target.value)}
                placeholder="Max"
                className="w-full bg-black/50 border border-zinc-700 rounded-lg py-3 px-4 text-white focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Phone Number</label>
              <input
                type="text"
                value={piiData.phone}
                onChange={(e) => handlePiiChange('phone', e.target.value)}
                placeholder="1234567890"
                className="w-full bg-black/50 border border-zinc-700 rounded-lg py-3 px-4 text-white focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Username</label>
              <input
                type="text"
                value={piiData.username}
                onChange={(e) => handlePiiChange('username', e.target.value)}
                placeholder="johndoe"
                className="w-full bg-black/50 border border-zinc-700 rounded-lg py-3 px-4 text-white focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Email</label>
              <input
                type="email"
                value={piiData.email}
                onChange={(e) => handlePiiChange('email', e.target.value)}
                placeholder="john@example.com"
                className="w-full bg-black/50 border border-zinc-700 rounded-lg py-3 px-4 text-white focus:border-green-500 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="bg-[#141414] border border-zinc-800 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Analysis Results</h2>
            <button
              onClick={resetForm}
              className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Check Another
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/30 rounded-lg p-4 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-zinc-400" />
                <span className="text-xs text-zinc-500 uppercase">Crack Time</span>
              </div>
              <p className="text-xl font-bold text-white">{result.crack_time}</p>
            </div>

            <div className="bg-black/30 rounded-lg p-4 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-zinc-400" />
                <span className="text-xs text-zinc-500 uppercase">Breach Status</span>
              </div>
              <p className={`text-xl font-bold ${result.breach_count > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {result.breach_count > 0 ? `${result.breach_count} Breaches` : 'Not Found'}
              </p>
            </div>

            <div className="bg-black/30 rounded-lg p-4 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-zinc-400" />
                <span className="text-xs text-zinc-500 uppercase">Security Level</span>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${getLevelBadge(result.vulnerability_level)}`}>
                {result.vulnerability_level.toUpperCase()}
              </span>
            </div>
          </div>

          {result.vulnerabilities && result.vulnerabilities.length > 0 && (
            <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-bold text-red-400">Vulnerabilities Found</h3>
              </div>
              <ul className="space-y-2">
                {result.vulnerabilities.map((vuln, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    {vuln}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.recommendations && result.recommendations.length > 0 && (
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-green-400" />
                <h3 className="text-sm font-bold text-green-400">Recommendations</h3>
              </div>
              <ul className="space-y-2">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PasswordCheckerPage;
