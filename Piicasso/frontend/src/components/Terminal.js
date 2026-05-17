import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModeContext } from '../context/ModeContext';
import { AuthContext } from '../context/AuthContext';

/**
 * Terminal — interactive, mode-aware terminal component.
 *
 * Theme switches automatically with the global ModeContext:
 *   user      → cyan/blue palette  (friendly hacker vibe)
 *   security  → red/crimson palette (aggressive ops vibe)
 *
 * Built-in commands: help, clear, mode, switch <mode>, whoami,
 * routes, goto <path>, echo <text>, about, exit.
 *
 * Unknown commands always render as red errors regardless of mode.
 */

const APP_ROUTES = [
  { path: '/', label: 'Landing' },
  { path: '/login', label: 'Login' },
  { path: '/register', label: 'Register' },
  { path: '/forgot-password', label: 'Forgot password' },
  { path: '/user/dashboard', label: 'User dashboard' },
  { path: '/user/history', label: 'User analysis history' },
  { path: '/user/learn', label: 'Learn module' },
  { path: '/security/dashboard', label: 'Security dashboard' },
  { path: '/security/history', label: 'Security history' },
  { path: '/operation', label: 'New operation' },
  { path: '/workspace', label: 'Saved workspace' },
  { path: '/profile', label: 'Profile' },
  { path: '/teams', label: 'Teams' },
  { path: '/darkweb', label: 'Dark-web / deep search' },
  { path: '/risk', label: 'Financial risk radar' },
  { path: '/inbox', label: 'Comms inbox' },
  { path: '/system-admin', label: 'System administration' },
  { path: '/api', label: 'API docs' },
  { path: '/result', label: 'Result page' },
  { path: '/terminal', label: 'This terminal' },
];

const ABOUT_TEXT = [
  'PIIcasso — PII exposure intelligence & adversarial wordlist platform.',
  'Two operational modes: user (defensive) and security (offensive ops).',
  'This terminal is a discreet utility shell for power users and demos.',
];

const HELP_LINES = [
  { cmd: 'help',                desc: 'show this help text' },
  { cmd: 'clear',               desc: 'wipe the terminal history' },
  { cmd: 'mode',                desc: 'print the current app mode' },
  { cmd: 'switch <user|security>', desc: 'change the global app mode' },
  { cmd: 'whoami',              desc: 'show the authenticated user' },
  { cmd: 'routes',              desc: 'list known app routes' },
  { cmd: 'goto <path>',         desc: 'navigate to a route via react-router' },
  { cmd: 'echo <text>',         desc: 'echo back the given text' },
  { cmd: 'about',               desc: 'short blurb about PIIcasso' },
  { cmd: 'exit',                desc: 'leave the terminal (returns to /)' },
];

const Terminal = () => {
  const { mode, switchMode } = useContext(ModeContext);
  const { user, isAuthenticated } = useContext(AuthContext) || {};
  const navigate = useNavigate();

  const isSecurity = mode === 'security';
  // Palette tokens — branch once per render, propagate via theme object.
  const theme = isSecurity
    ? {
        prompt: 'sec@piicasso:~#',
        promptText: 'text-red-500',
        accent: 'text-red-500',
        accentSoft: 'text-red-400',
        caret: 'bg-red-500',
        ring: 'border-red-500/30',
        glow: 'shadow-[0_0_40px_rgba(239,68,68,0.18)]',
        bannerLine: 'text-red-400',
        scanLine: 'from-red-500/0 via-red-500/40 to-red-500/0',
      }
    : {
        prompt: 'user@piicasso:~$',
        promptText: 'text-cyan-400',
        accent: 'text-cyan-400',
        accentSoft: 'text-cyan-300',
        caret: 'bg-cyan-400',
        ring: 'border-cyan-500/30',
        glow: 'shadow-[0_0_40px_rgba(34,211,238,0.18)]',
        bannerLine: 'text-cyan-300',
        scanLine: 'from-cyan-400/0 via-cyan-400/40 to-cyan-400/0',
      };

  // History pane lines. Each line: { kind: 'banner' | 'cmd' | 'out' | 'err' | 'ok' | 'dim', text }.
  const buildBanner = useCallback((m) => {
    const banner = [
      { kind: 'banner', text: '╔══════════════════════════════════════════════════════════╗' },
      { kind: 'banner', text: '║              PIIcasso Interactive Terminal               ║' },
      { kind: 'banner', text: `║                Mode: ${(m || 'user').toUpperCase().padEnd(8)}                          ║` },
      { kind: 'banner', text: '╚══════════════════════════════════════════════════════════╝' },
      { kind: 'dim',    text: "Type 'help' to list available commands." },
      { kind: 'dim',    text: '' },
    ];
    return banner;
  }, []);

  const [history, setHistory] = useState(() => buildBanner(mode));
  const [input, setInput] = useState('');
  const [cmdLog, setCmdLog] = useState([]);
  const [logIdx, setLogIdx] = useState(-1);

  const inputRef = useRef(null);
  const scrollerRef = useRef(null);

  // Auto-focus on mount.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-scroll to bottom on history change.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history]);

  // Reprint a one-liner notice when the mode flips externally (e.g. from Navbar).
  // Avoid spamming banner on every render — only when mode actually changes.
  const lastModeRef = useRef(mode);
  useEffect(() => {
    if (lastModeRef.current !== mode) {
      setHistory(prev => [
        ...prev,
        { kind: 'ok', text: `[mode] active mode is now '${mode}'` },
      ]);
      lastModeRef.current = mode;
    }
  }, [mode]);

  const append = useCallback((lines) => {
    setHistory(prev => [...prev, ...lines]);
  }, []);

  const handleCommand = useCallback((raw) => {
    const trimmed = raw.trim();
    // Always echo the command (with the prompt prefix) into history.
    const promptEcho = {
      kind: 'cmd',
      text: `${isSecurity ? 'sec@piicasso:~#' : 'user@piicasso:~$'} ${trimmed}`,
    };

    if (!trimmed) {
      append([promptEcho]);
      return;
    }

    const [cmd, ...rest] = trimmed.split(/\s+/);
    const arg = rest.join(' ');

    switch (cmd.toLowerCase()) {
      case 'help': {
        const lines = [
          promptEcho,
          { kind: 'out', text: 'Available commands:' },
          ...HELP_LINES.map(h => ({
            kind: 'out',
            text: `  ${h.cmd.padEnd(28)} ${h.desc}`,
          })),
          { kind: 'dim', text: '' },
        ];
        append(lines);
        return;
      }
      case 'clear': {
        setHistory(buildBanner(mode));
        return;
      }
      case 'mode': {
        append([
          promptEcho,
          { kind: 'ok', text: `current mode: ${mode}` },
        ]);
        return;
      }
      case 'switch': {
        const target = (arg || '').toLowerCase();
        if (target !== 'user' && target !== 'security') {
          append([
            promptEcho,
            { kind: 'err', text: "usage: switch <user|security>" },
          ]);
          return;
        }
        if (target === mode) {
          append([
            promptEcho,
            { kind: 'dim', text: `already in '${target}' mode` },
          ]);
          return;
        }
        append([
          promptEcho,
          { kind: 'ok', text: `switching mode -> ${target}` },
        ]);
        // Fire-and-forget. ModeContext is sync for the local state update.
        try { switchMode(target); } catch (_) { /* noop */ }
        return;
      }
      case 'whoami': {
        if (isAuthenticated && user) {
          const id = user.email || user.username || 'authenticated';
          const role = user.is_superuser ? 'superuser' : 'standard';
          append([
            promptEcho,
            { kind: 'out', text: `user: ${id}` },
            { kind: 'out', text: `role: ${role}` },
          ]);
        } else {
          append([
            promptEcho,
            { kind: 'dim', text: 'guest (not authenticated)' },
          ]);
        }
        return;
      }
      case 'routes': {
        append([
          promptEcho,
          { kind: 'out', text: 'registered application routes:' },
          ...APP_ROUTES.map(r => ({
            kind: 'out',
            text: `  ${r.path.padEnd(22)} ${r.label}`,
          })),
        ]);
        return;
      }
      case 'goto': {
        if (!arg) {
          append([
            promptEcho,
            { kind: 'err', text: 'usage: goto <path>' },
          ]);
          return;
        }
        const path = arg.startsWith('/') ? arg : `/${arg}`;
        append([
          promptEcho,
          { kind: 'ok', text: `navigating -> ${path}` },
        ]);
        // Slight defer so the user sees the line before route change.
        setTimeout(() => navigate(path), 80);
        return;
      }
      case 'echo': {
        append([
          promptEcho,
          { kind: 'out', text: arg },
        ]);
        return;
      }
      case 'about': {
        append([
          promptEcho,
          ...ABOUT_TEXT.map(t => ({ kind: 'out', text: t })),
        ]);
        return;
      }
      case 'exit': {
        append([
          promptEcho,
          { kind: 'ok', text: 'goodbye.' },
        ]);
        setTimeout(() => navigate('/'), 120);
        return;
      }
      default: {
        append([
          promptEcho,
          { kind: 'err', text: `command not found: ${cmd}` },
        ]);
      }
    }
  }, [append, buildBanner, isAuthenticated, isSecurity, mode, navigate, switchMode, user]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = input;
      if (value.trim()) {
        setCmdLog(prev => [...prev, value.trim()]);
      }
      setLogIdx(-1);
      handleCommand(value);
      setInput('');
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdLog.length === 0) return;
      const nextIdx = logIdx < cmdLog.length - 1 ? logIdx + 1 : logIdx;
      setLogIdx(nextIdx);
      setInput(cmdLog[cmdLog.length - 1 - nextIdx] || '');
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (logIdx <= 0) {
        setLogIdx(-1);
        setInput('');
        return;
      }
      const nextIdx = logIdx - 1;
      setLogIdx(nextIdx);
      setInput(cmdLog[cmdLog.length - 1 - nextIdx] || '');
      return;
    }
    if (e.key === 'Tab') {
      // Lightweight tab-completion for the registered commands.
      e.preventDefault();
      const stub = input.trim().toLowerCase();
      if (!stub) return;
      const candidates = HELP_LINES
        .map(h => h.cmd.split(' ')[0])
        .filter(c => c.startsWith(stub));
      if (candidates.length === 1) {
        setInput(candidates[0] + ' ');
      } else if (candidates.length > 1) {
        append([{ kind: 'dim', text: candidates.join('  ') }]);
      }
    }
  };

  // Map a history line kind to a Tailwind class. Errors are always red.
  const lineClass = (kind) => {
    switch (kind) {
      case 'banner': return theme.bannerLine;
      case 'cmd':    return 'text-gray-200';
      case 'err':    return 'text-red-500';
      case 'ok':     return theme.accent;
      case 'dim':    return 'text-gray-500';
      case 'out':
      default:       return 'text-gray-300';
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={`relative w-full h-full rounded-xl border ${theme.ring} ${theme.glow} bg-black/95 transition-colors duration-300 overflow-hidden`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-black/80">
        <span className="w-3 h-3 rounded-full bg-red-500/70" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <span className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className={`ml-3 text-xs font-mono uppercase tracking-widest transition-colors duration-300 ${theme.accent}`}>
          piicasso // {isSecurity ? 'security shell' : 'user shell'}
        </span>
        <span className="ml-auto text-[10px] font-mono text-gray-500 hidden sm:inline">
          {APP_ROUTES.length} routes indexed
        </span>
      </div>

      {/* Decorative scan line */}
      <div className={`pointer-events-none absolute left-0 right-0 top-10 h-px bg-gradient-to-r ${theme.scanLine}`} />

      {/* Scrollable history */}
      <div
        ref={scrollerRef}
        className="px-4 py-4 font-mono text-sm leading-relaxed overflow-y-auto custom-scrollbar"
        style={{ height: 'calc(100% - 88px)' }}
      >
        {history.map((line, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap break-words transition-colors duration-300 ${lineClass(line.kind)}`}
          >
            {line.text || ' '}
          </div>
        ))}
      </div>

      {/* Prompt input — Enter is handled by the input's onKeyDown so no form submit needed */}
      <div
        className="absolute left-0 right-0 bottom-0 px-4 py-3 border-t border-white/10 bg-black/90 flex items-center gap-2 font-mono text-sm"
      >
        <span className={`shrink-0 transition-colors duration-300 ${theme.promptText}`}>
          {theme.prompt}
        </span>
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            className={`w-full bg-transparent outline-none border-none caret-transparent text-gray-100 placeholder:text-gray-600 transition-colors duration-300`}
            placeholder="type a command — try 'help'"
            aria-label="terminal input"
          />
          {/* Animated cursor — sits after the typed value */}
          <span
            aria-hidden
            className={`absolute top-1/2 -translate-y-1/2 inline-block w-2 h-4 ${theme.caret} animate-pulse transition-colors duration-300`}
            style={{ left: `${Math.min(input.length, 80) * 0.55}rem` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Terminal;
