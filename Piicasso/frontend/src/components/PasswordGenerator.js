import React, { useState, useCallback, useEffect } from 'react';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Clock,
  Database,
  AlertCircle,
  Lightbulb,
  Copy,
  Check,
  Settings,
  Sparkles,
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
    excludeAmbiguous: false,
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
      charset = charset
        .split('')
        .filter((c) => !ambiguousChars.includes(c))
        .join('');
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
    const activeCount = Object.values(newOptions).filter(
      (v) => v !== false && key !== 'excludeAmbiguous',
    ).length;
    if (activeCount === 0 && key !== 'excludeAmbiguous') return;
    setOptions(newOptions);
  };

  const toggleOption = (key) => {
    if (key === 'excludeAmbiguous') {
      setOptions((prev) => ({ ...prev, excludeAmbiguous: !prev.excludeAmbiguous }));
    } else {
      handleOptionChange(key);
    }
  };

  const getStrengthIndicator = () => {
    let score = 0;
    if (length >= 16) score += 25;
    else if (length >= 12) score += 20;
    else if (length >= 8) score += 10;

    const activeTypes = [
      options.uppercase,
      options.lowercase,
      options.numbers,
      options.symbols,
    ].filter(Boolean).length;
    score += activeTypes * 15;
    if (options.excludeAmbiguous) score += 10;

    return Math.min(score, 100);
  };

  const strength = getStrengthIndicator();

  return (
    <div className="bg-dark-bg space-y-6 rounded-lg border border-zinc-800 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
            <Sparkles className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-bold text-white">Password Generator</h3>
            <p className="text-xs text-zinc-500">Generate a secure random password</p>
          </div>
        </div>
        <button
          onClick={generatePassword}
          className="rounded-lg bg-zinc-800 p-2 transition-colors hover:bg-zinc-700"
          title="Generate new"
        >
          <RefreshCw className="h-4 w-4 text-zinc-400" />
        </button>
      </div>

      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          readOnly
          className="bg-dark-surface w-full rounded-lg border border-zinc-700 px-4 py-4 pr-24 font-mono text-lg text-white outline-none focus:border-green-500"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="p-2 text-zinc-500 transition-colors hover:text-white"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={handleCopy}
            className="p-2 text-zinc-500 transition-colors hover:text-white"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="shrink-0 text-xs text-zinc-500">Length: {length}</span>
        <input
          type="range"
          min="8"
          max="64"
          value={length}
          onChange={(e) => setLength(parseInt(e.target.value))}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-green-500"
        />
        <span className="w-8 text-right text-xs text-zinc-400">{length}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
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
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              options[opt.key]
                ? 'border border-green-500/50 bg-green-500/20 text-green-400'
                : 'border border-zinc-700 bg-zinc-800 text-zinc-500'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full transition-all ${
                strength >= 75 ? 'bg-green-500' : strength >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${strength}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500">{strength}%</span>
        </div>
        <button
          onClick={() => onUsePassword(password)}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500"
        >
          <Check className="h-4 w-4" />
          Use This Password
        </button>
      </div>
    </div>
  );
};

export default PasswordGenerator;
