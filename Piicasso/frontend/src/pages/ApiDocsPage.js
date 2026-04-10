import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Book, Code, Key, Shield, Zap, Database, 
  Copy, Check, ChevronRight, Terminal, Globe,
  Box, FileText, Users, Lock, Play, ExternalLink
} from 'lucide-react';

const ApiDocsPage = () => {
  const [copiedId, setCopiedId] = useState(null);
  const [activeSection, setActiveSection] = useState('quickstart');

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

    curl: `curl -X POST https://api.piicasso.io/v1/redact \\
  -H "Authorization: Bearer your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "John Smith's SSN is 123-45-6789",
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
        response: { languages: ["en", "es", "fr", "de", "zh", "ja", ...], total: 52 }
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
        response: { results: [...], processed: 2, failed: 0 }
      }
    },
  ];

  const sdks = [
    {
      name: 'Python',
      icon: '🐍',
      description: 'Our most popular SDK with full feature support',
      install: 'pip install piicasso',
      docs: '/docs/python',
      popular: true
    },
    {
      name: 'Node.js',
      icon: '📦',
      description: 'TypeScript-first SDK for modern JavaScript apps',
      install: 'npm install @piicasso/sdk',
      docs: '/docs/node',
      popular: true
    },
    {
      name: 'Go',
      icon: '🔷',
      description: 'High-performance SDK for Go applications',
      install: 'go get github.com/piicasso/piicasso-go',
      docs: '/docs/go',
      popular: false
    },
    {
      name: 'Java',
      icon: '☕',
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
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="container mx-auto px-6 lg:px-16 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Code className="w-6 h-6 text-blue-400" />
              </div>
              <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-sm font-semibold rounded-full">
                Developer Preview
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
              API Documentation
            </h1>
            <p className="text-xl text-slate-400 mb-8">
              Build privacy-first applications with our powerful, developer-friendly API. 
              Process millions of documents with sub-5ms latency.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Get API Key
                <ChevronRight className="w-4 h-4" />
              </Link>
              <a
                href="#"
                className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors border border-slate-700"
              >
                View on GitHub
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 lg:px-16 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                      activeSection === section.id
                        ? 'bg-blue-600/20 text-blue-400 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {section.icon}
                    {section.label}
                  </button>
                ))}
              </nav>

              {/* API Stats */}
              <div className="mt-8 p-6 bg-slate-900/50 rounded-xl border border-slate-800">
                <h3 className="font-semibold text-white mb-4">API Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Uptime</span>
                    <span className="text-green-400 font-semibold">99.99%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Avg Latency</span>
                    <span className="text-blue-400 font-semibold">4.2ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Rate Limit</span>
                    <span className="text-purple-400 font-semibold">1000/min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-12">
            {/* Quick Start Section */}
            {activeSection === 'quickstart' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-bold mb-4">Quick Start</h2>
                  <p className="text-slate-400">
                    Get up and running with PIIcasso API in under 5 minutes. Choose your preferred language below.
                  </p>
                </div>

                {/* Code Tabs */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="flex border-b border-slate-800">
                    {Object.keys(codeSnippets).map((lang, index) => (
                      <button
                        key={lang}
                        className={`px-6 py-3 text-sm font-medium transition-colors ${
                          index === 0 ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="p-6">
                    <pre className="text-sm font-mono text-slate-300 overflow-x-auto">
                      <code>{codeSnippets.python}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(codeSnippets.python, 'python')}
                      className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
                    >
                      {copiedId === 'python' ? (
                        <>
                          <Check className="w-4 h-4 text-green-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy code
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { icon: <Zap className="w-5 h-5" />, value: '<5ms', label: 'Avg Response Time' },
                    { icon: <Shield className="w-5 h-5" />, value: '52', label: 'Languages Supported' },
                    { icon: <Database className="w-5 h-5" />, value: '99.99%', label: 'API Uptime' },
                  ].map((stat, index) => (
                    <div key={index} className="p-6 bg-slate-900/50 rounded-xl border border-slate-800">
                      <div className="text-blue-400 mb-2">{stat.icon}</div>
                      <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-sm text-slate-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Authentication Section */}
            {activeSection === 'authentication' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-bold mb-4">Authentication</h2>
                  <p className="text-slate-400">
                    All API requests require authentication using an API key. Include your API key in the Authorization header.
                  </p>
                </div>

                {/* Auth Method */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-600/20 rounded-lg">
                      <Key className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold">Bearer Token Authentication</h3>
                  </div>
                  <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm">
                    <span className="text-slate-500">Authorization: Bearer </span>
                    <span className="text-green-400">your_api_key_here</span>
                  </div>
                </div>

                {/* Getting Your API Key */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                  <h3 className="text-lg font-semibold mb-4">Getting Your API Key</h3>
                  <ol className="space-y-4 text-slate-400">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">1</span>
                      <span>Sign up for a PIIcasso account at <Link to="/register" className="text-blue-400 hover:underline">piicasso.io/register</Link></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">2</span>
                      <span>Navigate to the Dashboard → API Keys section</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">3</span>
                      <span>Click "Create New API Key" and copy your key</span>
                    </li>
                  </ol>
                </div>

                {/* Security Tips */}
                <div className="bg-amber-900/20 border border-amber-800/50 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-amber-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-400 mb-2">Security Best Practices</h4>
                      <ul className="space-y-2 text-sm text-amber-200/80">
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

            {/* Endpoints Section */}
            {activeSection === 'endpoints' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-bold mb-4">API Endpoints</h2>
                  <p className="text-slate-400">
                    Explore our comprehensive REST API for all PII processing operations.
                  </p>
                </div>

                {/* Base URL */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 font-mono text-sm">
                  <span className="text-slate-500">Base URL: </span>
                  <span className="text-blue-400">https://api.piicasso.io</span>
                </div>

                {/* Endpoints List */}
                <div className="space-y-6">
                  {endpoints.map((endpoint, index) => (
                    <div key={index} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                      <div className="p-6 border-b border-slate-800">
                        <div className="flex items-center gap-4 mb-2">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            endpoint.method === 'GET' ? 'bg-green-600/20 text-green-400' : 'bg-blue-600/20 text-blue-400'
                          }`}>
                            {endpoint.method}
                          </span>
                          <code className="text-white font-mono">{endpoint.path}</code>
                          <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400">
                            {endpoint.category}
                          </span>
                        </div>
                        <p className="text-slate-400">{endpoint.description}</p>
                      </div>
                      
                      {/* Parameters */}
                      {endpoint.parameters.length > 0 && (
                        <div className="p-6 border-b border-slate-800">
                          <h4 className="text-sm font-semibold text-slate-300 mb-3">Parameters</h4>
                          <div className="space-y-2">
                            {endpoint.parameters.map((param, pIndex) => (
                              <div key={pIndex} className="flex items-start gap-4 text-sm">
                                <code className="text-blue-400 min-w-[120px]">{param.name}</code>
                                <span className="text-purple-400">{param.type}</span>
                                {param.required && <span className="text-red-400">required</span>}
                                <span className="text-slate-400">{param.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Example */}
                      <div className="p-6 bg-slate-950/50">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Request</h4>
                            <pre className="text-xs font-mono text-slate-300 bg-slate-950 rounded-lg p-3 overflow-x-auto">
                              {JSON.stringify(endpoint.example.request, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Response</h4>
                            <pre className="text-xs font-mono text-slate-300 bg-slate-950 rounded-lg p-3 overflow-x-auto">
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

            {/* SDKs Section */}
            {activeSection === 'sdks' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-bold mb-4">SDKs & Libraries</h2>
                  <p className="text-slate-400">
                    Official SDKs for popular programming languages. Each SDK provides full API coverage with idiomatic interfaces.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {sdks.map((sdk, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-xl border transition-all ${
                        sdk.popular 
                          ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-800/50' 
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{sdk.icon}</span>
                          <div>
                            <h3 className="font-semibold text-white">{sdk.name}</h3>
                            {sdk.popular && (
                              <span className="text-xs text-blue-400">Most Popular</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mb-4">{sdk.description}</p>
                      <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs text-slate-300 mb-4">
                        {sdk.install}
                      </div>
                      <a
                        href={sdk.docs}
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        View Documentation <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Examples Section */}
            {activeSection === 'examples' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-bold mb-4">Code Examples</h2>
                  <p className="text-slate-400">
                    Real-world examples showing common use cases and integrations.
                  </p>
                </div>

                {/* Example Cards */}
                {[
                  {
                    title: 'Healthcare Patient Records',
                    description: 'Automatically redact PHI from medical records for research sharing.',
                    code: `result = client.redact(
    text="Patient John Doe, MRN 12345, 
          SSN 123-45-6789 treated for...",
    mode="strict",
    entities=["NAME", "SSN", "MRN"]
)`,
                    industry: 'Healthcare',
                    icon: <Users className="w-5 h-5" />
                  },
                  {
                    title: 'Financial Documents',
                    description: 'Process loan applications by redacting sensitive financial identifiers.',
                    code: `result = client.synthesize(
    text="Account #1234567890, 
          Routing 021000021...",
    preserve_format=True
)`,
                    industry: 'Finance',
                    icon: <Database className="w-5 h-5" />
                  },
                  {
                    title: 'Customer Support Logs',
                    description: 'Anonymize support tickets before storing for analytics.',
                    code: `result = client.redact(
    text="Customer called from 555-123-4567
          about order #98765...",
    mode="synthetic"
)`,
                    industry: 'SaaS',
                    icon: <Box className="w-5 h-5" />
                  },
                ].map((example, index) => (
                  <div key={index} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-800">
                      <div className="flex items-center gap-3 mb-2">
                        {example.icon}
                        <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400">
                          {example.industry}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">{example.title}</h3>
                      <p className="text-sm text-slate-400">{example.description}</p>
                    </div>
                    <div className="p-6 bg-slate-950/50">
                      <pre className="text-sm font-mono text-slate-300 overflow-x-auto">
                        <code>{example.code}</code>
                      </pre>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Error Handling Section */}
            {activeSection === 'errors' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-bold mb-4">Error Handling</h2>
                  <p className="text-slate-400">
                    The API uses standard HTTP response codes to indicate success or failure of requests.
                  </p>
                </div>

                <div className="space-y-4">
                  {errorCodes.map((error, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-slate-900 rounded-xl border border-slate-800"
                    >
                      <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                        error.severity === 'error' 
                          ? 'bg-red-600/20 text-red-400' 
                          : 'bg-amber-600/20 text-amber-400'
                      }`}>
                        {error.code}
                      </span>
                      <div>
                        <h4 className="font-semibold text-white">{error.name}</h4>
                        <p className="text-sm text-slate-400">{error.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Error Response Format */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                  <h3 className="text-lg font-semibold mb-4">Error Response Format</h3>
                  <pre className="text-sm font-mono text-slate-300 bg-slate-950 rounded-lg p-4">
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
      <div className="bg-gradient-to-t from-slate-900 to-slate-950 border-t border-slate-800">
        <div className="container mx-auto px-6 lg:px-16 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Build?</h2>
            <p className="text-slate-400 mb-8">
              Start processing PII today with our generous free tier. No credit card required.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              >
                Get Started Free
                <Play className="w-5 h-5" />
              </Link>
              <a
                href="#"
                className="flex items-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors border border-slate-700"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;
