import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Zap, RefreshCw } from 'lucide-react';

const InteractiveDemo = () => {
  const [inputText, setInputText] = useState(
    "Customer John Smith (SSN: 123-45-6789) called from 555-123-4567. His email is john.smith@company.com and he lives at 123 Main St, New York, NY 10001. Credit card ending in 4532."
  );
  const [mode, setMode] = useState('redact');
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedEntities, setDetectedEntities] = useState([]);

  const entityTypes = {
    NAME: { color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', label: 'Name' },
    SSN: { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400', label: 'SSN' },
    PHONE: { color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', label: 'Phone' },
    EMAIL: { color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', label: 'Email' },
    ADDRESS: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', label: 'Address' },
    CARD: { color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400', label: 'Card' },
  };

  const syntheticReplacements = {
    NAME: 'Jane Johnson',
    SSN: '***-**-0000',
    PHONE: '(555) 000-0000',
    EMAIL: 'jane.doe@example.com',
    ADDRESS: '456 Oak Ave, San Francisco, CA 94102',
    CARD: '****-****-0000',
  };

  useEffect(() => {
    const entities = [
      { type: 'NAME', value: 'John Smith', start: 9, end: 18 },
      { type: 'SSN', value: '123-45-6789', start: 32, end: 42 },
      { type: 'PHONE', value: '555-123-4567', start: 58, end: 70 },
      { type: 'EMAIL', value: 'john.smith@company.com', start: 81, end: 104 },
      { type: 'ADDRESS', value: '123 Main St, New York, NY 10001', start: 114, end: 146 },
      { type: 'CARD', value: '4532', start: 180, end: 184 },
    ];
    setDetectedEntities(entities);
  }, []);

  const getProcessedText = () => {
    let result = inputText;
    if (mode === 'redact') {
      detectedEntities.forEach(entity => {
        const replacement = `[${entity.type}]`;
        result = result.replace(entity.value, replacement);
      });
    } else {
      detectedEntities.forEach(entity => {
        const replacement = syntheticReplacements[entity.type];
        result = result.replace(entity.value, replacement);
      });
    }
    return result;
  };

  const handleProcess = () => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 800);
  };

  return (
    <section className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-900/50 pointer-events-none"></div>
      
      <div className="container mx-auto px-6 lg:px-16 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="inline-block px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold rounded-full mb-4">
            Interactive Demo
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            See It In <span className="text-blue-600 dark:text-blue-400">Action</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Experience real-time PII detection and redaction. Toggle between strict redaction and synthetic data generation.
          </p>
        </motion.div>

        {/* Demo Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="bg-slate-100 dark:bg-slate-800 p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Live Demo</span>
              </div>
              
              {/* Mode Toggle */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-950 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => { setMode('redact'); handleProcess(); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === 'redact'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Strict Redact
                </button>
                <button
                  onClick={() => { setMode('synthetic'); handleProcess(); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === 'synthetic'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Synthetic Data
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="grid lg:grid-cols-5">
              {/* Input Panel */}
              <div className="lg:col-span-2 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  <Zap className="w-4 h-4 text-blue-600" />
                  Input Text
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed resize-none"
                  placeholder="Enter text containing PII..."
                />
                <p className="mt-3 text-xs text-slate-500">
                  Try entering: names, emails, phone numbers, SSNs, addresses, or credit cards.
                </p>
              </div>

              {/* Output Panel */}
              <div className="lg:col-span-3 p-6 bg-slate-50/50 dark:bg-slate-800/50">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  {mode === 'redact' ? (
                    <Shield className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  )}
                  {mode === 'redact' ? 'Redacted Output' : 'Synthetic Output'}
                </label>
                
                <motion.div
                  key={mode}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  className="h-48 p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl overflow-y-auto"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                    </div>
                  ) : (
                    <pre className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono">
                      {getProcessedText()}
                    </pre>
                  )}
                </motion.div>

                {/* Entity Legend */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(entityTypes).map(([type, config]) => (
                    <span
                      key={type}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {config.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Stats */}
            <div className="bg-slate-100 dark:bg-slate-800 px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-6">
                <div className="text-sm">
                  <span className="text-slate-500">Entities Detected: </span>
                  <span className="font-semibold text-slate-900 dark:text-white">{detectedEntities.length}</span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-500">Processing Time: </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">&lt;5ms</span>
                </div>
              </div>
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                Process
              </button>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Want to integrate this into your workflow?
          </p>
          <a
            href="/api"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            View Full API Documentation
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default InteractiveDemo;
