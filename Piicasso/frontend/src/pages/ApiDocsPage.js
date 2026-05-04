import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Book, Code, Key, Shield, Zap, Database, 
  Copy, Check, ChevronRight, Terminal, Globe,
  Box, FileText, Users, Lock, Play, ExternalLink,
  Wifi
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

const CodeBlock = ({ code, id, copiedId, onCopy }) => (
  <div className="terminal-block overflow-hidden">
    <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04] terminal-dots" style={{ ...S.mono, fontSize: 11, color: C.dim }}>
      <span>example</span>
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
  const borderColor = isGet ? 'border-green-500/40' : isPost ? 'border-red-500/40' : 'border-amber-500/40';
  const textColor = isGet ? 'text-green-400' : isPost ? 'text-red-400' : 'text-amber-400';
  const bgColor = isGet ? 'bg-green-500/10' : isPost ? 'bg-red-500/10' : 'bg-amber-500/10';
  return (
    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider border ${bgColor} ${textColor} ${borderColor}`} style={S.mono}>
      {method}
    </span>
  );
};

const ApiDocsPage = () => {
  const [copiedId, setCopiedId] = useState(null);
  const [activeSection, setActiveSection] = useState('quickstart');
  const [accentMode, setAccentMode] = useState('red'); // 'red' or 'blue'
  const accent = accentMode === 'red' ? C.red : C.blue;
  const accentDim = accentMode === 'red' ? C.redDim : C.blueDim;
  const accentBorder = accentMode === 'red' ? C.redBorder : C.blueBorder;

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sections = [
    { id: 'quickstart', label: 'Quick Start', icon: <Zap className="w-4 h-4" /> },
    { id: 'authentication', label: 'Authentication', icon: <Key className="w-4 h-4" /> },
    { id: 'endpoints', label: 'Endpoints', icon: <Globe className="w-4 h-4" /> },
    { id: 'sdks', label: 'SDKs', icon: <Box className="w-4 h-4" /> },
    { id: 'examples', label: 'Examples', icon: <Code className="w-4 h-4" /> },
    { id: 'errors', label: 'Error Handling', icon: <FileText className="w-4 h-4" /> },
  ];

  const codeSnippets = {
    python: `from piicasso import Client

client = Client(api_key="your_api_key")

# Redact PII from text
result = client.redact(
    text="John Smith's SSN is 123-45-6789",
    mode="strict"
)
print(result.redacted_text)
# Output: "[NAME]'s SSN is [SSN]"`,

    node: `import { Piicasso } from '@piicasso/sdk';

const client = new Piicasso({
  apiKey: 'your_api_key'
});

const result = await client.redact({
  text: "John Smith's SSN is 123-45-6789",
  mode: "strict"
});

console.log(result.redactedText);
// Output: "[NAME]'s SSN is [SSN]"`,

    curl: `curl -X POST https://core-engine-woeg.onrender.com/api/v1/redact \\
  -H "Authorization: Bearer your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "John Smith\\'s SSN is 123-45-6789",
    "mode": "strict"
  }'`,
  };

  const endpoints = [
    {
      method: 'POST',
      path: '/v1/redact',
      description: 'Redact PII from text using strict mode (replacement with tags) or synthetic mode (AI-generated replacements).',
      category: 'Core',
      parameters: [
        { name: 'text', type: 'string', required: true, description: 'The input text to process' },
        { name: 'mode', type: 'string', required: true, description: 'Either "strict" or "synthetic"' },
        { name: 'entities', type: 'array', required: false, description: 'Specific entity types to detect (default: all)' },
      ],
      example: {
        request: { text: "Email john@example.com for details", mode: "strict" },
        response: { redacted_text: "Email [EMAIL] for details", entities_found: 1, processing_time_ms: 3 }
      }
    },
    {
      method: 'POST',
      path: '/v1/synthesize',
      description: 'Generate synthetic replacements for detected PII while preserving data structure and relationships.',
      category: 'Core',
      parameters: [
        { name: 'text', type: 'string', required: true, description: 'The input text to process' },
        { name: 'preserve_format', type: 'boolean', required: false, description: 'Keep original formatting (default: true)' },
      ],
      example: {
        request: { text: "Contact john@example.com", preserve_format: true },
        response: { synthetic_text: "Contact secure@example.net", entities_replaced: 1, processing_time_ms: 12 }
      }
    },
    {
      method: 'POST',
      path: '/v1/detect',
      description: 'Detect and classify PII entities without modifying the text.',
      category: 'Core',
      parameters: [
        { name: 'text', type: 'string', required: true, description: 'The input text to analyze' },
        { name: 'language', type: 'string', required: false, description: 'Language code (default: auto-detect)' },
      ],
      example: {
        request: { text: "Dr. Jane Smith at 555-123-4567" },
        response: { entities: [{ type: "NAME", value: "Jane Smith", confidence: 0.98 }, { type: "PHONE", value: "555-123-4567", confidence: 0.95 }], language: "en" }
      }
    },
    {
      method: 'GET',
      path: '/v1/languages',
      description: 'Get list of supported languages for PII detection.',
      category: 'Utility',
      parameters: [],
      example: {
        request: {},
        response: { languages: ["en", "es", "fr", "de", "zh", "ja", "..."], total: 52 }
      }
    },
    {
      method: 'POST',
      path: '/v1/batch',
      description: 'Process multiple texts in a single API call for efficiency.',
      category: 'Advanced',
      parameters: [
        { name: 'items', type: 'array', required: true, description: 'Array of texts to process (max 100)' },
        { name: 'mode', type: 'string', required: true, description: 'Processing mode for all items' },
      ],
      example: {
        request: { items: ["Text 1...", "Text 2..."], mode: "strict" },
        response: { results: ["..."], processed: 2, failed: 0 }
      }
    },
  ];

  const sdks = [
    {
      name: 'Python',
      icon: <Terminal className="w-5 h-5" />,
      description: 'Our most popular SDK with full feature support',
      install: 'pip install piicasso',
      docs: '/docs/python',
      popular: true
    },
    {
      name: 'Node.js',
      icon: <Code className="w-5 h-5" />,
      description: 'TypeScript-first SDK for modern JavaScript apps',
      install: 'npm install @piicasso/sdk',
      docs: '/docs/node',
      popular: true
    },
    {
      name: 'Go',
      icon: <Database className="w-5 h-5" />,
      description: 'High-performance SDK for Go applications',
      install: 'go get github.com/piicasso/piicasso-go',
      docs: '/docs/go',
      popular: false
    },
    {
      name: 'Java',
      icon: <Box className="w-5 h-5" />,
      description: 'Enterprise-grade SDK for Java applications',
      install: 'mvn dependency:add com.piicasso:piicasso-java',
      docs: '/docs/java',
      popular: false
    },
  ];

  const errorCodes = [
    { code: '400', name: 'Bad Request', description: 'Invalid request parameters', severity: 'error' },
    { code: '401', name: 'Unauthorized', description: 'Missing or invalid API key', severity: 'error' },
    { code: '403', name: 'Forbidden', description: 'API key lacks required permissions', severity: 'error' },
    { code: '429', name: 'Rate Limited', description: 'Too many requests, slow down', severity: 'warning' },
    { code: '500', name: 'Server Error', description: 'Internal error, retry later', severity: 'error' },
    { code: '503', name: 'Service Unavailable', description: 'Temporary downtime', severity: 'warning' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, ...S.display }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(to bottom, ${C.surface}, ${C.bg})`,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px 48px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 700 }}>
            {/* Mode toggle */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg" style={{ background: accentDim }}>
                <Code className="w-5 h-5" style={{ color: accent }} />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: accentDim, color: accent }}>
                API v1.0
              </span>
              {/* Accent mode toggle */}
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
              API Documentation
            </h1>
            <p style={{ fontSize: 17, color: C.muted, marginBottom: 32, lineHeight: 1.7 }}>
              Build privacy-first applications with our developer-friendly API. Process documents with sub-5ms latency.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-all"
                style={{
                  background: accent,
                  color: '#fff',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Get API Key
                <ChevronRight className="w-4 h-4" />
              </Link>
              <a
                href="#"
                className="flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-all border"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderColor: C.border,
                  color: C.text,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
              >
                View on GitHub
                <ExternalLink className="w-4 h-4" />
              </a>
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

              {/* Live status + API Stats */}
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
                  {[
                    { label: 'Uptime', value: '99.99%', color: '#10B981' },
                    { label: 'Avg Latency', value: '4.2ms', color: accent },
                    { label: 'Rate Limit', value: '1000/min', color: C.purple },
                  ].map(s => (
                    <div key={s.label} className="flex justify-between text-sm">
                      <span style={{ color: C.muted }}>{s.label}</span>
                      <span style={{ color: s.color, fontWeight: 600, ...S.mono }}>{s.value}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] mt-3 pt-3 border-t" style={{ color: C.dim, ...S.mono, borderColor: C.border }}>
                  ⌘K for search
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-12">
            {activeSection === 'quickstart' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Quick Start</h2>
                  <p style={{ color: C.muted, lineHeight: 1.7 }}>Get up and running with PIIcasso API in under 5 minutes.</p>
                </div>

                <CodeBlock code={codeSnippets.python} id="python" copiedId={copiedId} onCopy={copyToClipboard} />

                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { icon: <Zap className="w-5 h-5" />, value: '<5ms', label: 'Avg Response Time' },
                    { icon: <Shield className="w-5 h-5" />, value: '52', label: 'Languages Supported' },
                    { icon: <Database className="w-5 h-5" />, value: '99.99%', label: 'API Uptime' },
                  ].map((stat) => (
                    <div key={stat.label} style={{
                      padding: 24,
                      background: C.surface,
                      borderRadius: 12,
                      border: `1px solid ${C.border}`,
                    }}>
                      <div style={{ color: accent, marginBottom: 8 }}>{stat.icon}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 4 }}>{stat.value}</div>
                      <div style={{ fontSize: 13, color: C.muted }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeSection === 'authentication' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Authentication</h2>
                  <p style={{ color: C.muted, lineHeight: 1.7 }}>All API requests require authentication using an API key.</p>
                </div>

                <div style={{ padding: 24, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg" style={{ background: accentDim }}>
                      <Key className="w-5 h-5" style={{ color: accent }} />
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 600 }}>Bearer Token Authentication</h3>
                  </div>
                  <div className="terminal-block px-4 py-3 text-sm" style={S.mono}>
                    <span style={{ color: C.dim }}>Authorization: Bearer </span>
                    <span style={{ color: accent }}>your_api_key_here</span>
                  </div>
                </div>

                <div style={{ padding: 24, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Getting Your API Key</h3>
                  <ol className="space-y-4">
                    {[
                      <span>Sign up for a PIIcasso account at <Link to="/register" style={{ color: accent }}>piicasso.io/register</Link></span>,
                      'Navigate to the Dashboard → API Keys section',
                      'Click "Create New API Key" and copy your key',
                    ].map((step, i) => (
                      <li key={i} className="flex gap-3" style={{ color: C.muted }}>
                        <span className="flex-shrink-0 w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold" style={{ background: accent, color: '#fff' }}>{i + 1}</span>
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div style={{ padding: 24, borderRadius: 12, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 mt-0.5" style={{ color: C.amber }} />
                    <div>
                      <h4 style={{ fontWeight: 600, color: C.amber, marginBottom: 8 }}>Security Best Practices</h4>
                      <ul className="space-y-1.5 text-sm" style={{ color: 'rgba(245,158,11,0.7)' }}>
                        <li>• Never expose your API key in client-side code</li>
                        <li>• Use environment variables to store API keys</li>
                        <li>• Rotate your API keys regularly</li>
                        <li>• Use separate keys for development and production</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'endpoints' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>API Endpoints</h2>
                  <p style={{ color: C.muted, lineHeight: 1.7 }}>Explore our comprehensive REST API for all PII processing operations.</p>
                </div>

                <div className="terminal-block px-4 py-3 text-sm" style={S.mono}>
                  <span style={{ color: C.dim }}>Base URL: </span>
                  <span style={{ color: accent }}>https://core-engine-woeg.onrender.com/api</span>
                </div>

                <div className="space-y-6">
                  {endpoints.map((endpoint) => (
                    <div key={endpoint.path} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                      <div style={{ padding: 24, borderBottom: `1px solid ${C.border}` }}>
                        <div className="flex items-center gap-3 mb-2">
                          <MethodBadge method={endpoint.method} />
                          <code style={{ ...S.mono, color: C.text, fontSize: 14 }}>{endpoint.path}</code>
                          <span className="px-2 py-0.5 rounded text-xs" style={{ background: C.surface2, color: C.muted }}>{endpoint.category}</span>
                        </div>
                        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>{endpoint.description}</p>
                      </div>

                      {endpoint.parameters.length > 0 && (
                        <div style={{ padding: 24, borderBottom: `1px solid ${C.border}` }}>
                          <h4 className="text-xs font-semibold uppercase mb-3" style={{ color: C.muted, letterSpacing: '0.05em' }}>Parameters</h4>
                          <div className="space-y-2">
                            {endpoint.parameters.map((param, i) => (
                              <div key={i} className="flex items-start gap-4 text-sm">
                                <code style={{ ...S.mono, color: accent, minWidth: 120 }}>{param.name}</code>
                                <span style={{ color: C.purple }}>{param.type}</span>
                                {param.required && <span style={{ color: C.red }}>required</span>}
                                <span style={{ color: C.muted }}>{param.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ padding: 24, background: C.surface2 }}>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-[10px] font-semibold uppercase mb-2" style={{ color: C.dim, letterSpacing: '0.05em' }}>Request</h4>
                            <pre className="text-xs rounded-lg p-3 overflow-x-auto" style={{ ...S.mono, color: C.muted, background: '#0a0a0e' }}>
                              {JSON.stringify(endpoint.example.request, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <h4 className="text-[10px] font-semibold uppercase mb-2" style={{ color: C.dim, letterSpacing: '0.05em' }}>Response</h4>
                            <pre className="text-xs rounded-lg p-3 overflow-x-auto" style={{ ...S.mono, color: C.muted, background: '#0a0a0e' }}>
                              {JSON.stringify(endpoint.example.response, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeSection === 'sdks' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>SDKs & Libraries</h2>
                  <p style={{ color: C.muted, lineHeight: 1.7 }}>Official SDKs for popular programming languages. Each SDK provides full API coverage.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {sdks.map((sdk) => (
                    <div
                      key={sdk.name}
                      className="transition-all"
                      style={{
                        padding: 24,
                        borderRadius: 12,
                        border: sdk.popular ? `1px solid ${accentBorder}` : `1px solid ${C.border}`,
                        background: sdk.popular ? `linear-gradient(135deg, ${accentDim}, rgba(255,255,255,0.01))` : C.surface,
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div style={{ color: accent }}>{sdk.icon}</div>
                          <div>
                            <h3 style={{ fontWeight: 600, color: C.text }}>{sdk.name}</h3>
                            {sdk.popular && <span className="text-xs" style={{ color: accent }}>Most Popular</span>}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm mb-4" style={{ color: C.muted }}>{sdk.description}</p>
                      <div className="rounded-lg px-3 py-2 text-xs mb-4 terminal-block" style={S.mono}>{sdk.install}</div>
                      <Link to={sdk.docs} className="text-sm flex items-center gap-1" style={{ color: accent }}>
                        View Documentation <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeSection === 'examples' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Code Examples</h2>
                  <p style={{ color: C.muted, lineHeight: 1.7 }}>Real-world examples showing common use cases.</p>
                </div>

                {[
                  {
                    title: 'Healthcare Patient Records',
                    description: 'Automatically redact PHI from medical records for research sharing.',
                    code: `result = client.redact(\n    text="Patient John Doe, MRN 12345,\n          SSN 123-45-6789 treated for...",\n    mode="strict",\n    entities=["NAME", "SSN", "MRN"]\n)`,
                    industry: 'Healthcare',
                    icon: <Users className="w-5 h-5" />
                  },
                  {
                    title: 'Financial Documents',
                    description: 'Process loan applications by redacting sensitive financial identifiers.',
                    code: `result = client.synthesize(\n    text="Account #1234567890,\n          Routing 021000021...",\n    preserve_format=True\n)`,
                    industry: 'Finance',
                    icon: <Database className="w-5 h-5" />
                  },
                  {
                    title: 'Customer Support Logs',
                    description: 'Anonymize support tickets before storing for analytics.',
                    code: `result = client.redact(\n    text="Customer called from 555-123-4567\n          about order #98765...",\n    mode="synthetic"\n)`,
                    industry: 'SaaS',
                    icon: <Box className="w-5 h-5" />
                  },
                ].map((example) => (
                  <div key={example.title} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                    <div style={{ padding: 24, borderBottom: `1px solid ${C.border}` }}>
                      <div className="flex items-center gap-3 mb-2">
                        <div style={{ color: accent }}>{example.icon}</div>
                        <span className="px-2 py-0.5 rounded text-xs" style={{ background: C.surface2, color: C.muted }}>{example.industry}</span>
                      </div>
                      <h3 style={{ fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 4 }}>{example.title}</h3>
                      <p className="text-sm" style={{ color: C.muted }}>{example.description}</p>
                    </div>
                    <div style={{ padding: 24 }}>
                      <pre className="text-sm overflow-x-auto" style={{ ...S.mono, color: C.muted, lineHeight: 1.7 }}>{example.code}</pre>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeSection === 'errors' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Error Handling</h2>
                  <p style={{ color: C.muted, lineHeight: 1.7 }}>The API uses standard HTTP response codes to indicate success or failure.</p>
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
                  <pre className="text-sm rounded-lg p-4" style={{ ...S.mono, color: C.muted, background: '#0a0a0e' }}>
{`{
  "error": {
    "code": "invalid_api_key",
    "message": "The API key provided is invalid or expired",
    "docs": "https://docs.piicasso.io/authentication"
  }
}`}
                  </pre>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div style={{ background: `linear-gradient(to top, ${C.surface}, ${C.bg})`, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>Ready to Build?</h2>
          <p className="mb-8" style={{ color: C.muted, lineHeight: 1.7 }}>Start processing PII today with our generous free tier. No credit card required.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="flex items-center gap-2 px-8 py-4 font-bold rounded-lg transition-all"
              style={{ background: accent, color: '#fff' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Get Started Free
              <Play className="w-5 h-5" />
            </Link>
            <a
              href="#"
              className="flex items-center gap-2 px-8 py-4 font-semibold rounded-lg transition-all border"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: C.border, color: C.text }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            >
              Contact Sales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;
