import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DesignAppShell from '../components/design/dashboard/DesignAppShell';
import {
  Book, Code, Key, Shield, Zap, Database,
  Copy, Check, ChevronRight, Terminal, Globe,
  FileText, Users, Lock, Play, ExternalLink,
  Wifi, Cpu, History, Download, MessageSquare,
  BarChart3, Settings, Search, Eye, Trash2
} from 'lucide-react';

// ─── Design tokens ───────────────────────────────────────────────────────
const C = {
  bg: '#050507',
  surface: '#0C0C10',
  surface2: '#141418',
  surface3: '#1A1A20',
  border: 'rgba(255,255,255,0.06)',
  text: '#F2F2F2',
  muted: 'rgba(255,255,255,0.35)',
  dim: 'rgba(255,255,255,0.15)',
  red: '#E11D48',
  redDim: 'rgba(225,29,72,0.12)',
  redBorder: 'rgba(225,29,72,0.25)',
  blue: '#3B82F6',
  blueDim: 'rgba(59,130,246,0.08)',
  blueBorder: 'rgba(59,130,246,0.2)',
  green: '#10B981',
  amber: '#F59E0B',
  purple: '#7C3AED',
};

const S = {
  display: { fontFamily: "'Space Grotesk', sans-serif" },
  mono: { fontFamily: "'JetBrains Mono', monospace" },
};

const CodeBlock = ({ code, id, copiedId, onCopy, label = 'example' }) => (
  <div className="terminal-block overflow-hidden">
    <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04] terminal-dots" style={{ ...S.mono, fontSize: 11, color: C.dim }}>
      <span>{label}</span>
      <button
        onClick={() => onCopy(code, id)}
        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all ${
          copiedId === id
            ? 'text-green-400 bg-green-500/10'
            : 'text-white/30 hover:text-white/60 hover:bg-white/5'
        }`}
      >
        {copiedId === id ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
      </button>
    </div>
    <pre className="p-4 text-sm overflow-x-auto" style={{ ...S.mono, color: C.muted, lineHeight: 1.7 }}>
      <code>{code}</code>
    </pre>
  </div>
);

const MethodBadge = ({ method }) => {
  const isGet = method === 'GET';
  const isPost = method === 'POST';
  const isDelete = method === 'DELETE';
  const isPut = method === 'PUT';
  const borderColor = isGet ? 'border-green-500/40' : isPost ? 'border-blue-500/40' : isDelete ? 'border-red-500/40' : 'border-amber-500/40';
  const textColor = isGet ? 'text-green-400' : isPost ? 'text-blue-400' : isDelete ? 'text-red-400' : 'text-amber-400';
  const bgColor = isGet ? 'bg-green-500/10' : isPost ? 'bg-blue-500/10' : isDelete ? 'bg-red-500/10' : 'bg-amber-500/10';
  return (
    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider border ${bgColor} ${textColor} ${borderColor}`} style={S.mono}>
      {method}
    </span>
  );
};

const endpointGroups = [
  {
    id: 'authentication',
    label: 'Authentication',
    icon: <Key className="w-4 h-4" />,
    description: 'User registration, JWT token management, OAuth, and password recovery.',
    endpoints: [
      { method: 'GET', path: '/api/user/ping/', desc: 'Health check — verify server is awake' },
      { method: 'POST', path: '/api/user/register/', desc: 'Register a new user account' },
      { method: 'POST', path: '/api/user/token/', desc: 'Obtain JWT access + refresh tokens' },
      { method: 'POST', path: '/api/user/token/refresh/', desc: 'Refresh expired access token' },
      { method: 'POST', path: '/api/user/auth/google/', desc: 'Google OAuth login via Firebase token' },
      { method: 'POST', path: '/api/auth/password/reset/', desc: 'Request password reset OTP via email' },
      { method: 'POST', path: '/api/auth/password/reset/verify/', desc: 'Verify OTP and set new password' },
    ]
  },
  {
    id: 'wordlist-generation',
    label: 'Wordlist Generation',
    icon: <Cpu className="w-4 h-4" />,
    description: 'Submit PII data to generate targeted password wordlists using AI pattern matching combined with RockYou corpus.',
    endpoints: [
      { method: 'POST', path: '/api/submit/', desc: 'Submit PII data (name, DOB, pet names, etc.) to generate a custom wordlist' },
      { method: 'GET', path: '/api/cached/<cache_key>/', desc: 'Retrieve a recently generated wordlist from Redis cache' },
    ]
  },
  {
    id: 'history',
    label: 'History & Export',
    icon: <History className="w-4 h-4" />,
    description: 'View, manage, and export your wordlist generation history.',
    endpoints: [
      { method: 'GET', path: '/api/history/', desc: 'Get paginated generation history (supports page, page_size query params)' },
      { method: 'DELETE', path: '/api/history/<id>/', desc: 'Delete a specific history entry (owner or admin only)' },
      { method: 'GET', path: '/api/download/<id>/', desc: 'Download wordlist as .txt file' },
      { method: 'GET', path: '/api/export/csv/', desc: 'Export full generation history as CSV' },
      { method: 'GET', path: '/api/report/pdf/<id>/', desc: 'Download PDF report for a specific generation' },
      { method: 'POST', path: '/api/download-token/', desc: 'Generate a short-lived signed download token (60s expiry)' },
      { method: 'GET', path: '/api/file/<file_type>/<id>/', desc: 'Download file using signed token (no JWT in URL)' },
    ]
  },
  {
    id: 'password-security',
    label: 'Password Security',
    icon: <Shield className="w-4 h-4" />,
    description: 'Analyze password strength, check for breaches, and manage preferences.',
    endpoints: [
      { method: 'POST', path: '/api/password/analyze/', desc: 'Analyze password strength with PII context and breach check' },
      { method: 'GET', path: '/api/password/history/', desc: 'Get password analysis history' },
      { method: 'GET', path: '/api/password/preferences/', desc: 'Get user preferences (default mode, last mode)' },
      { method: 'PUT', path: '/api/password/preferences/', desc: 'Update user preferences (user/security mode)' },
      { method: 'POST', path: '/api/password/breach-check/', desc: 'Check password against HIBP database (k-anonymity)' },
      { method: 'GET', path: '/api/password/activity/', desc: 'Get user activity feed (analyses, audit logs)' },
    ]
  },
  {
    id: 'profile',
    label: 'Profile & Stats',
    icon: <Users className="w-4 h-4" />,
    description: 'User profile management and personal statistics.',
    endpoints: [
      { method: 'GET', path: '/api/profile/', desc: 'Get detailed profile (includes team info, unread messages, stats)' },
      { method: 'PUT', path: '/api/profile/', desc: 'Update profile (name, email, password)' },
      { method: 'GET', path: '/api/stats/', desc: 'Get user statistics (operations, passwords generated)' },
    ]
  },
  {
    id: 'teams',
    label: 'Teams',
    icon: <Database className="w-4 h-4" />,
    description: 'Create/join teams, manage members, and team chat.',
    endpoints: [
      { method: 'GET', path: '/api/teams/', desc: 'Get team info (members, role, invite code, activity feed)' },
      { method: 'POST', path: '/api/teams/create/', desc: 'Create a new team (creator becomes LEADER)' },
      { method: 'POST', path: '/api/teams/join/', desc: 'Join an existing team via invite code' },
      { method: 'POST', path: '/api/teams/leave/', desc: 'Leave current team (LEADER transfers or dissolves)' },
      { method: 'GET', path: '/api/teams/chat/', desc: 'Get team chat messages (supports ?after=message_id)' },
      { method: 'POST', path: '/api/teams/chat/', desc: 'Send a message to team chat (max 2000 chars)' },
    ]
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: <MessageSquare className="w-4 h-4" />,
    description: 'Admin messaging, notifications, system settings, and breach search.',
    endpoints: [
      { method: 'GET', path: '/api/operations/messages/', desc: 'List messages (user→admin thread or admin view all)' },
      { method: 'POST', path: '/api/operations/messages/', desc: 'Send a message (user to admin, or admin to any user)' },
      { method: 'POST', path: '/api/operations/messages/<id>/mark_read/', desc: 'Mark a specific message as read' },
      { method: 'GET', path: '/api/operations/notifications/', desc: 'Get notifications with unread count' },
      { method: 'POST', path: '/api/operations/notifications/', desc: 'Mark notification(s) as read' },
      { method: 'DELETE', path: '/api/operations/notifications/', desc: 'Clear all notifications' },
      { method: 'GET', path: '/api/operations/settings/', desc: 'Get all system settings (admin only)' },
      { method: 'POST', path: '/api/operations/settings/', desc: 'Update a system setting (admin only)' },
      { method: 'DELETE', path: '/api/operations/settings/', desc: 'Delete a system setting (admin only)' },
      { method: 'POST', path: '/api/operations/breach-search/', desc: 'Search data breaches (HIBP API + internal history)' },
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 className="w-4 h-4" />,
    description: 'Geo-located activity data and system beacons.',
    endpoints: [
      { method: 'GET', path: '/api/analytics/globe-data/', desc: 'Get geo-located user activity for the interactive globe (?since=ISO timestamp)' },
      { method: 'POST', path: '/api/analytics/beacon/', desc: 'HELP beacon signal (frontend keepalive, requires auth)' },
    ]
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: <Settings className="w-4 h-4" />,
    description: 'Superuser management, user administration, and system monitoring.',
    endpoints: [
      { method: 'GET', path: '/api/super-admin/', desc: 'Get all users, logs, activities, total generations (superuser only)' },
      { method: 'POST', path: '/api/super-admin/', desc: 'Admin actions: block/unblock user, change password' },
      { method: 'DELETE', path: '/api/super-admin/', desc: 'Delete a user and all their data (superuser only)' },
      { method: 'GET', path: '/api/admin/users/', desc: 'List all non-superuser accounts for admin messaging' },
      { method: 'GET', path: '/api/messages/', desc: 'Admin: list user conversations; User: get admin conversation' },
      { method: 'POST', path: '/api/messages/', desc: 'Send message (admin↔user)' },
      { method: 'GET', path: '/api/system/logs/', desc: 'Get system logs (superuser only, last 15 entries)' },
    ]
  },
  {
    id: 'terminal',
    label: 'Terminal',
    icon: <Terminal className="w-4 h-4" />,
    description: 'Simulated cybersecurity terminal UI — no real commands executed.',
    endpoints: [
      { method: 'POST', path: '/api/terminal/', desc: 'Execute simulated terminal command (hydra, nmap, whoami, status, help, clear)' },
    ]
  },
];

const sections = [
  { id: 'overview', label: 'Overview', icon: <Book className="w-4 h-4" /> },
  { id: 'authentication', label: 'Authentication', icon: <Key className="w-4 h-4" /> },
  { id: 'endpoints', label: 'All Endpoints', icon: <Globe className="w-4 h-4" /> },
  { id: 'examples', label: 'Code Examples', icon: <Code className="w-4 h-4" /> },
  { id: 'errors', label: 'Error Codes', icon: <FileText className="w-4 h-4" /> },
];

const ApiDocsPage = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [copiedId, setCopiedId] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedGroups, setExpandedGroups] = useState(['authentication', 'wordlist-generation']);
  const [accentMode, setAccentMode] = useState('red');
  const accent = accentMode === 'red' ? C.red : C.blue;
  const accentDim = accentMode === 'red' ? C.redDim : C.blueDim;
  const accentBorder = accentMode === 'red' ? C.redBorder : C.blueBorder;

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleGroup = (id) => {
    setExpandedGroups(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const curlExamples = {
    register: `curl -X POST https://piicasso.com/api/user/register/ \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "operator",
    "email": "operator@example.com",
    "password": "Str0ngP@ss!"
  }'`,

    token: `curl -X POST https://piicasso.com/api/user/token/ \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "operator",
    "password": "Str0ngP@ss!"
  }'

# Response:
# {
#   "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
#   "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
#   "username": "operator",
#   "is_superuser": false
# }`,

    submit: `curl -X POST https://piicasso.com/api/submit/ \\
  -H "Authorization: Bearer <access_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "full_name": "John Doe",
    "username": "johndoe",
    "dob": "1990-05-15",
    "pet_names": ["buddy", "max"],
    "fav_numbers": [7, 21],
    "pattern_mode": "aggressive"
  }'

# Response:
# {
#   "wordlist": ["john1990", "doe0515", "johndoe7", "buddy21", ...],
#   "id": 42,
#   "status": "success"
# }`,

    analyze: `curl -X POST https://piicasso.com/api/password/analyze/ \\
  -H "Authorization: Bearer <access_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "password": "john1990buddy",
    "pii_data": {
      "full_name": "John Doe",
      "dob": "1990-05-15"
    }
  }'

# Response:
# {
#   "score": 32,
#   "level": "weak",
#   "entropy": 38.5,
#   "crack_time": "2 hours",
#   "breach_count": 3,
#   "vulnerabilities": ["Contains name", "Contains DOB", "Common pattern"],
#   "recommendations": ["Avoid personal data", "Increase length", "Add special chars"]
# }`,

    history: `curl -X GET "https://piicasso.com/api/history/?page=1&page_size=10" \\
  -H "Authorization: Bearer <access_token>"

# Response:
# {
#   "results": [
#     {
#       "id": 42,
#       "timestamp": "2026-05-04T10:30:00Z",
#       "wordlist_count": 1247,
#       "pii_data": {"full_name": "John Doe", ...}
#     }
#   ],
#   "total": 15,
#   "page": 1,
#   "page_size": 10,
#   "total_pages": 2
# }`,

    teamCreate: `curl -X POST https://piicasso.com/api/teams/create/ \\
  -H "Authorization: Bearer <access_token>" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Red Team Alpha"}'

# Response:
# {
#   "message": "Team establishment successful.",
#   "code": "RTA-7X9K",
#   "id": 3
# }`,

    breachSearch: `curl -X POST https://piicasso.com/api/operations/breach-search/ \\
  -H "Authorization: Bearer <access_token>" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "operator@example.com"}'

# Response:
# {
#   "breaches": [
#     {"name": "Collection #1", "domain": "various", "breach_date": "2019-01-07", ...}
#   ],
#   "risk_score": 7.5,
#   "query": "operator@example.com"
# }`,
  };

  const errorCodes = [
    { code: '400', name: 'Bad Request', description: 'Invalid request parameters or missing required fields', severity: 'error' },
    { code: '401', name: 'Unauthorized', description: 'Missing, expired, or invalid JWT access token', severity: 'error' },
    { code: '403', name: 'Forbidden', description: 'Insufficient permissions (e.g., non-admin accessing admin endpoint)', severity: 'error' },
    { code: '404', name: 'Not Found', description: 'Requested resource does not exist', severity: 'error' },
    { code: '429', name: 'Rate Limited', description: 'Too many requests — retry after delay', severity: 'warning' },
    { code: '500', name: 'Server Error', description: 'Internal server error, retry later', severity: 'error' },
  ];

  const rateLimits = [
    { endpoint: 'PII Submit (/api/submit/)', limit: '10 requests/hour' },
    { endpoint: 'Password Analysis (/api/password/analyze/)', limit: '10 requests/hour' },
    { endpoint: 'Breach Search (/api/operations/breach-search/)', limit: '3 requests/minute' },
    { endpoint: 'Login (/api/user/token/)', limit: 'Rate limited (LoginRateThrottle)' },
    { endpoint: 'Registration (/api/user/register/)', limit: 'Rate limited (RegisterRateThrottle)' },
    { endpoint: 'Terminal (/api/terminal/)', limit: 'Rate limited (TerminalRateThrottle)' },
  ];

  const pageContent = (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, ...S.display }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(to bottom, ${C.surface}, ${C.bg})`,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px 48px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 700 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg" style={{ background: accentDim }}>
                <Terminal className="w-5 h-5" style={{ color: accent }} />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: accentDim, color: accent }}>
                API v1.0 — Targeted Wordlist Generator
              </span>
              <button
                onClick={() => setAccentMode(a => a === 'red' ? 'blue' : 'red')}
                className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
                style={{
                  border: `1px solid ${accentBorder}`,
                  background: accentDim,
                  color: accent,
                }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
                {accentMode === 'red' ? 'SEC' : 'USR'}
              </button>
            </div>

            <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16, color: C.text }}>
              API Reference
            </h1>
            <p style={{ fontSize: 17, color: C.muted, marginBottom: 32, lineHeight: 1.7 }}>
              Complete documentation for the PIIcasso Targeted Wordlist Generator API. Generate custom password wordlists from personal information using AI pattern matching.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-all"
                style={{ background: accent, color: '#fff' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Create Account
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-all border"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderColor: C.border,
                  color: C.text,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
              >
                Login to Dashboard
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px' }}>
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div style={{ position: 'sticky', top: 24 }}>
              <nav className="space-y-0.5">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all"
                    style={{
                      background: activeSection === section.id ? accentDim : 'transparent',
                      color: activeSection === section.id ? accent : C.muted,
                      fontWeight: activeSection === section.id ? 600 : 400,
                    }}
                    onMouseEnter={e => {
                      if (activeSection !== section.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }}
                    onMouseLeave={e => {
                      if (activeSection !== section.id) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {section.icon}
                    {section.label}
                  </button>
                ))}
              </nav>

              {/* API Status */}
              <div style={{
                marginTop: 32,
                padding: 24,
                background: C.surface,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
              }}>
                <div className="flex items-center gap-2 mb-4">
                  <Wifi className="w-3 h-3 text-green-400 animate-pulse" />
                  <span className="text-xs font-bold tracking-wider uppercase text-green-400" style={S.mono}>Online</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: C.muted }}>Base URL</span>
                    <span style={{ color: accent, fontWeight: 600, ...S.mono, fontSize: 11 }}>piicasso.com/api</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: C.muted }}>Auth</span>
                    <span style={{ color: C.green, fontWeight: 600, ...S.mono, fontSize: 11 }}>JWT Bearer</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: C.muted }}>Endpoints</span>
                    <span style={{ color: C.purple, fontWeight: 600, ...S.mono, fontSize: 11 }}>37+</span>
                  </div>
                </div>
                <div className="text-[10px] mt-3 pt-3 border-t" style={{ color: C.dim, ...S.mono, borderColor: C.border }}>
                  Rate limits apply per endpoint
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-12">
            {activeSection === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Overview</h2>
                  <p style={{ color: C.muted, lineHeight: 1.7 }}>
                    PIIcasso is a <strong style={{ color: C.text }}>Targeted Wordlist Generator</strong> that creates custom password wordlists from personal information. 
                    Submit PII data (names, dates of birth, pet names, favorite numbers) and receive a tailored wordlist generated by AI pattern matching combined with the RockYou corpus.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { icon: <Cpu className="w-5 h-5" />, title: 'AI-Powered Generation', desc: 'Pattern matching engine combines submitted PII with RockYou corpus to generate realistic password candidates.' },
                    { icon: <Shield className="w-5 h-5" />, title: 'Password Analysis', desc: 'Strength scoring, entropy calculation, breach detection via HIBP k-anonymity, and PII-context vulnerability analysis.' },
                    { icon: <Database className="w-5 h-5" />, title: 'Team Collaboration', desc: 'Create teams, manage members with role-based access, and communicate via built-in team chat.' },
                    { icon: <Globe className="w-5 h-5" />, title: 'Global Analytics', desc: 'Interactive globe visualization showing geo-located user activity with real-time incremental updates.' },
                  ].map((item) => (
                    <div key={item.title} style={{
                      padding: 24,
                      background: C.surface,
                      borderRadius: 12,
                      border: `1px solid ${C.border}`,
                    }}>
                      <div style={{ color: accent, marginBottom: 12 }}>{item.icon}</div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>{item.title}</h3>
                      <p className="text-sm" style={{ color: C.muted, lineHeight: 1.6 }}>{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div style={{ padding: 24, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>Base URL</h3>
                  <div className="terminal-block px-4 py-3 text-sm" style={S.mono}>
                    <span style={{ color: C.dim }}>https://piicasso.com/api</span>
                  </div>
                  <p className="text-sm mt-3" style={{ color: C.muted }}>
                    All endpoints are relative to this base URL. Authentication uses JWT Bearer tokens obtained via <code style={{ color: accent }}>/api/user/token/</code>.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div style={{ padding: 24, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Public Endpoints</h3>
                    <ul className="space-y-2 text-sm" style={{ color: C.muted }}>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /> /api/user/register/</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /> /api/user/token/</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /> /api/user/auth/google/</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /> /api/auth/password/reset/</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /> /api/health/</li>
                    </ul>
                  </div>
                  <div style={{ padding: 24, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Requires Authentication</h3>
                    <ul className="space-y-2 text-sm" style={{ color: C.muted }}>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} /> /api/submit/ — Generate wordlists</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} /> /api/history/ — View generations</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} /> /api/password/analyze/ — Analyze passwords</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} /> /api/teams/* — Team management</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} /> /api/super-admin/ — Admin only</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'authentication' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Authentication</h2>
                  <p style={{ color: C.muted, lineHeight: 1.7 }}>
                    PIIcasso uses JWT (JSON Web Tokens) via <code style={{ color: accent }}>djangorestframework-simplejwt</code>. 
                    All protected endpoints require a valid access token in the Authorization header.
                  </p>
                </div>

                <div style={{ padding: 24, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg" style={{ background: accentDim }}>
                      <Lock className="w-5 h-5" style={{ color: accent }} />
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 600 }}>Bearer Token Authentication</h3>
                  </div>
                  <div className="terminal-block px-4 py-3 text-sm" style={S.mono}>
                    <span style={{ color: C.dim }}>Authorization: Bearer </span>
                    <span style={{ color: accent }}>&lt;access_token&gt;</span>
                  </div>
                </div>

                <div style={{ padding: 24, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Authentication Flow</h3>
                  <ol className="space-y-4">
                    {[
                      <span>Register via <code style={{ color: accent }}>POST /api/user/register/</code> with username, email, password</span>,
                      <span>Obtain tokens via <code style={{ color: accent }}>POST /api/user/token/</code> — receive access + refresh tokens</span>,
                      <span>Include access token in Authorization header for all protected endpoints</span>,
                      <span>Refresh expired tokens via <code style={{ color: accent }}>POST /api/user/token/refresh/</code> with refresh token</span>,
                    ].map((step, i) => (
                      <li key={i} className="flex gap-3" style={{ color: C.muted }}>
                        <span className="flex-shrink-0 w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold" style={{ background: accent, color: '#fff' }}>{i + 1}</span>
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <CodeBlock code={curlExamples.register} id="curl-register" copiedId={copiedId} onCopy={copyToClipboard} label="register.sh" />
                <CodeBlock code={curlExamples.token} id="curl-token" copiedId={copiedId} onCopy={copyToClipboard} label="token.sh" />

                <div style={{ padding: 24, borderRadius: 12, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 mt-0.5" style={{ color: C.amber }} />
                    <div>
                      <h4 style={{ fontWeight: 600, color: C.amber, marginBottom: 8 }}>Security Notes</h4>
                      <ul className="space-y-1.5 text-sm" style={{ color: 'rgba(245,158,11,0.7)' }}>
                        <li>• Access tokens expire after a configurable duration (default: 5 minutes)</li>
                        <li>• Refresh tokens have longer expiry and can rotate access tokens</li>
                        <li>• Sensitive endpoints (login, register, password reset) are rate-limited</li>
                        <li>• Google OAuth uses Firebase token verification</li>
                        <li>• Password reset uses OTP sent via email — OTPs expire after use</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'endpoints' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>All Endpoints</h2>
                  <p style={{ color: C.muted, lineHeight: 1.7 }}>
                    Complete endpoint reference organized by functional category. Click a category to expand.
                  </p>
                </div>

                <div className="space-y-3">
                  {endpointGroups.map((group) => (
                    <div key={group.id} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className="w-full flex items-center gap-4 px-6 py-4 text-left transition-all"
                        style={{ background: expandedGroups.includes(group.id) ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                      >
                        <div style={{ color: accent }}>{group.icon}</div>
                        <div className="flex-1">
                          <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{group.label}</h3>
                          <p className="text-xs mt-0.5" style={{ color: C.muted }}>{group.description}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ background: C.surface2, color: C.muted }}>
                          {group.endpoints.length}
                        </span>
                        <ChevronRight
                          className="w-4 h-4 transition-transform"
                          style={{ color: C.muted, transform: expandedGroups.includes(group.id) ? 'rotate(90deg)' : 'none' }}
                        />
                      </button>

                      {expandedGroups.includes(group.id) && (
                        <div style={{ borderTop: `1px solid ${C.border}` }}>
                          {group.endpoints.map((ep) => (
                            <div key={ep.path} className="flex items-center gap-4 px-6 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                              <MethodBadge method={ep.method} />
                              <code className="text-sm" style={{ ...S.mono, color: C.text, minWidth: 220 }}>{ep.path}</code>
                              <span className="text-xs" style={{ color: C.muted }}>{ep.desc}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Rate Limits */}
                <div style={{ marginTop: 8 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Rate Limits</h3>
                  <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                    {rateLimits.map((rl, i) => (
                      <div key={i} className="flex items-center justify-between px-6 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                        <code className="text-sm" style={{ ...S.mono, color: C.text }}>{rl.endpoint}</code>
                        <span className="text-sm font-mono" style={{ color: C.amber }}>{rl.limit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'examples' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Code Examples</h2>
                  <p style={{ color: C.muted, lineHeight: 1.7 }}>Common workflows using curl. Replace <code style={{ color: accent }}>&lt;access_token&gt;</code> with your actual JWT token.</p>
                </div>

                {[
                  { title: 'Generate a Wordlist', desc: 'Submit personal information to create a targeted password wordlist.', code: curlExamples.submit, label: 'submit.sh', icon: <Cpu className="w-5 h-5" />, category: 'Generation' },
                  { title: 'Analyze Password Strength', desc: 'Check a password against strength criteria and PII exposure.', code: curlExamples.analyze, label: 'analyze.sh', icon: <Shield className="w-5 h-5" />, category: 'Security' },
                  { title: 'View Generation History', desc: 'Retrieve paginated history of all your wordlist generations.', code: curlExamples.history, label: 'history.sh', icon: <History className="w-5 h-5" />, category: 'History' },
                  { title: 'Create a Team', desc: 'Set up a team with invite codes for collaborative operations.', code: curlExamples.teamCreate, label: 'team.sh', icon: <Database className="w-5 h-5" />, category: 'Teams' },
                  { title: 'Search Data Breaches', desc: 'Check if an email or password has been exposed in known breaches.', code: curlExamples.breachSearch, label: 'breach.sh', icon: <Search className="w-5 h-5" />, category: 'Operations' },
                ].map((example) => (
                  <div key={example.title} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                    <div style={{ padding: 24, borderBottom: `1px solid ${C.border}` }}>
                      <div className="flex items-center gap-3 mb-2">
                        <div style={{ color: accent }}>{example.icon}</div>
                        <span className="px-2 py-0.5 rounded text-xs" style={{ background: C.surface2, color: C.muted }}>{example.category}</span>
                      </div>
                      <h3 style={{ fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 4 }}>{example.title}</h3>
                      <p className="text-sm" style={{ color: C.muted }}>{example.desc}</p>
                    </div>
                    <div style={{ padding: 24 }}>
                      <CodeBlock code={example.code} id={`example-${example.label}`} copiedId={copiedId} onCopy={copyToClipboard} label={example.label} />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeSection === 'errors' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Error Codes</h2>
                  <p style={{ color: C.muted, lineHeight: 1.7 }}>Standard HTTP status codes with descriptive error messages.</p>
                </div>

                <div className="space-y-3">
                  {errorCodes.map((error) => (
                    <div
                      key={error.code}
                      className="flex items-center gap-4 p-4 rounded-xl"
                      style={{ background: C.surface, border: `1px solid ${C.border}` }}
                    >
                      <span className={`px-2.5 py-1 rounded-lg text-sm font-bold border ${
                        error.severity === 'error'
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`} style={S.mono}>
                        {error.code}
                      </span>
                      <div>
                        <h4 style={{ fontWeight: 600, color: C.text }}>{error.name}</h4>
                        <p className="text-sm" style={{ color: C.muted }}>{error.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: 24, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>Error Response Format</h3>
                  <pre className="text-sm rounded-lg p-4 overflow-x-auto" style={{ ...S.mono, color: C.muted, background: '#0a0a0e' }}>
{`{
  "detail": "Authentication credentials were not provided."
}

// Or for validation errors:
{
  "username": ["This field is required."],
  "password": ["This password is too short."]
}`}
                  </pre>
                </div>

                <div style={{ padding: 24, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>Download Token Errors</h3>
                  <ul className="space-y-2 text-sm" style={{ color: C.muted }}>
                    <li className="flex items-start gap-2"><Eye className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: C.amber }} /> <span><strong style={{ color: C.text }}>403</strong> — Token expired (60s TTL) or invalid signature</span></li>
                    <li className="flex items-start gap-2"><Trash2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: C.red }} /> <span><strong style={{ color: C.text }}>404</strong> — Requested file or generation record not found</span></li>
                    <li className="flex items-start gap-2"><Lock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: C.blue }} /> <span><strong style={{ color: C.text }}>401</strong> — Unauthenticated access to download endpoint</span></li>
                  </ul>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div style={{ background: `linear-gradient(to top, ${C.surface}, ${C.bg})`, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>Start Generating Wordlists</h2>
          <p className="mb-8" style={{ color: C.muted, lineHeight: 1.7 }}>Create your account to access the full API. Generate targeted wordlists, analyze password strength, and collaborate with your team.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="flex items-center gap-2 px-8 py-4 font-bold rounded-lg transition-all"
              style={{ background: accent, color: '#fff' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Create Account
              <Play className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 px-8 py-4 font-semibold rounded-lg transition-all border"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: C.border, color: C.text }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  if (isAuthenticated) {
    return (
      <DesignAppShell activeKey="learn">
        {pageContent}
      </DesignAppShell>
    );
  }

  return pageContent;
};

export default ApiDocsPage;
