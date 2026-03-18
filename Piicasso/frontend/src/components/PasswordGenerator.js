import React, { useState, useCallback, useEffect } from 'react';
import { 
  Shield, Lock, Eye, EyeOff, AlertTriangle, CheckCircle, 
  XCircle, Info, RefreshCw, ChevronDown, ChevronUp,
  Fingerprint, Clock, Database, AlertCircle, Lightbulb,
  Copy, Check, Settings, Sparkles
} from 'lucide-react';

const PasswordGenerator = ({ onUsePassword }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false
  });

  const ambiguousChars = 'lI1O0';

  const generatePassword = useCallback(() => {
    let charset = '';
    let result = '';
    
    if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.numbers) charset += '0123456789';
    if (options.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (options.excludeAmbiguous) {
      charset = charset.split('').filter(c => !ambiguousChars.includes(c)).join('');
    }
    
    if (!charset) {
      charset = 'abcdefghijklmnopqrstuvwxyz';
    }
    
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }
    
    setPassword(result);
  }, [length, options]);

  useEffect(() => {
    generatePassword();
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOptionChange = (key) => {
    const newOptions = { ...options, [key]: !options[key] };
    const activeCount = Object.values(newOptions).filter(v => v !== false && key !== 'excludeAmbiguous').length;
    if (activeCount === 0 && key !== 'excludeAmbiguous') return;
    setOptions(newOptions);
  };

  const toggleOption = (key) => {
    if (key === 'excludeAmbiguous') {
      setOptions(prev => ({ ...prev, excludeAmbiguous: !prev.excludeAmbiguous }));
    } else {
      handleOptionChange(key);
    }
  };

  const getStrengthIndicator = () => {
    let score = 0;
    if (length >= 16) score += 25;
    else if (length >= 12) score += 20;
    else if (length >= 8) score += 10;
    
    const activeTypes = [options.uppercase, options.lowercase, options.numbers, options.symbols].filter(Boolean).length;
    score += activeTypes * 15;
    if (options.excludeAmbiguous) score += 10;
    
    return Math.min(score, 100);
  };

  const strength = getStrengthIndicator();

  return (
    <div className="bg-[#141414] border border-zinc-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-bold text-white">Password Generator</h3>
            <p className="text-xs text-zinc-500">Generate a secure random password</p>
          </div>
        </div>
        <button
          onClick={generatePassword}
          className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
          title="Generate new"
        >
          <RefreshCw className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          readOnly
          className="w-full bg-black/50 border border-zinc-700 rounded-lg py-4 px-4 pr-24 text-white font-mono text-lg focus:border-green-500 outline-none"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="p-2 text-zinc-500 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={handleCopy}
            className="p-2 text-zinc-500 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-zinc-500 shrink-0">Length: {length}</span>
        <input
          type="range"
          min="8"
          max="64"
          value={length}
          onChange={(e) => setLength(parseInt(e.target.value))}
          className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-green-500"
        />
        <span className="text-xs text-zinc-400 w-8 text-right">{length}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { key: 'uppercase', label: 'ABC' },
          { key: 'lowercase', label: 'abc' },
          { key: 'numbers', label: '123' },
          { key: 'symbols', label: '@#$' },
          { key: 'excludeAmbiguous', label: 'No Ambiguous' },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => toggleOption(opt.key)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              options[opt.key]
                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                strength >= 75 ? 'bg-green-500' :
                strength >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${strength}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500">{strength}%</span>
        </div>
        <button
          onClick={() => onUsePassword(password)}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          Use This Password
        </button>
      </div>
    </div>
  );
};

export default PasswordGenerator;
