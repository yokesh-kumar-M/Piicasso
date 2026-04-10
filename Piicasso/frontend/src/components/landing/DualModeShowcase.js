import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, ArrowRight } from 'lucide-react';

const DualModeShowcase = () => {
  const [activeMode, setActiveMode] = useState('strict');

  const sampleData = {
    original: "Patient John Smith (DOB: 03/15/1985, MRN: 789456123) treated for condition. Insurance: BlueCross #BC123456789. Contact: john.smith@email.com, (555) 123-4567. Address: 123 Oak Street, Boston, MA 02101.",
    strict: "Patient [REDACTED_NAME] (DOB: [REDACTED], MRN: [REDACTED]) treated for condition. Insurance: [REDACTED] #[REDACTED]. Contact: [REDACTED], ([REDACTED]). Address: [REDACTED].",
    synthetic: "Patient Sarah Mitchell (DOB: 08/22/1992, MRN: 847291035) treated for condition. Insurance: UnitedHealth #[UC847291035]. Contact: s.mitchell@securemail.net, (617) 555-0147. Address: 892 Maple Ave, Cambridge, MA 02139."
  };

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent dark:via-blue-950/10 pointer-events-none"></div>

      <div className="container mx-auto px-6 lg:px-16 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-semibold rounded-full mb-4">
            Dual Mode Processing
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            Two Approaches to <span className="text-blue-600 dark:text-blue-400">Data Privacy</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Choose between complete data removal or intelligent synthetic replacement. Both maintain data utility while ensuring compliance.
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 rounded-2xl p-2 shadow-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveMode('strict')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeMode === 'strict'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-5 h-5" />
              Strict Redaction
            </button>
            <button
              onClick={() => setActiveMode('synthetic')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeMode === 'synthetic'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              Synthetic Data
            </button>
          </div>
        </motion.div>

        {/* Showcase Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto"
        >
          {/* Original Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="bg-slate-100 dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Original Data</span>
            </div>
            <div className="p-6">
              <pre className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">
                {sampleData.original}
              </pre>
            </div>
          </div>

          {/* Processed Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`rounded-2xl overflow-hidden border-2 shadow-lg ${
                activeMode === 'strict'
                  ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                  : 'bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-900'
              }`}
            >
              <div className={`px-6 py-4 border-b ${
                activeMode === 'strict'
                  ? 'bg-red-100/50 dark:bg-red-900/30 border-red-200 dark:border-red-900'
                  : 'bg-gradient-to-r from-purple-100/50 to-blue-100/50 dark:from-purple-900/30 dark:to-blue-900/30 border-purple-200 dark:border-purple-900'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${
                    activeMode === 'strict'
                      ? 'text-red-700 dark:text-red-400'
                      : 'text-purple-700 dark:text-purple-400'
                  }`}>
                    {activeMode === 'strict' ? 'Strictly Redacted' : 'Synthetic Data Generated'}
                  </span>
                  <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full ${
                    activeMode === 'strict'
                      ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
                      : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400'
                  }`}>
                    {activeMode === 'strict' ? '100% Private' : 'Preserved Utility'}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <pre className={`text-sm leading-relaxed whitespace-pre-wrap font-mono ${
                  activeMode === 'strict'
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {activeMode === 'strict' ? sampleData.strict : sampleData.synthetic}
                </pre>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Benefits Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12"
        >
          <div className="flex items-start gap-4 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">Strict Redaction</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Complete data removal for maximum privacy. Ideal for compliance documentation and audits.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">Synthetic Data</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                AI-generated replacements that preserve data structure and relationships for ML training.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DualModeShowcase;
