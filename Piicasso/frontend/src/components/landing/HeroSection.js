import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Terminal } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] bg-slate-900 overflow-hidden font-sans text-slate-300 flex items-center pt-24 pb-20">
      {/* Soft Background Accents */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 rounded-[100%] blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-6 lg:px-16 relative z-10 flex flex-col items-center justify-center text-center max-w-4xl">
        
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8"
        >
          <Shield className="w-4 h-4" />
          <span>Secure PII Anonymization</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-50 leading-[1.1] mb-6"
        >
          Protect Sensitive Data <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Without Losing Utility
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed font-light max-w-2xl mx-auto"
        >
          Autonomous, zero-trust entity redaction and synthetic data generation for modern engineering and intelligence workflows.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            to="/operation"
            className="group relative flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] font-medium"
          >
            <span>Start Anonymizing</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/api"
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 rounded-lg transition-all duration-200 font-medium"
          >
            <Terminal className="w-4 h-4" />
            <span>Read Documentation</span>
          </Link>
        </motion.div>

        {/* Minimal Terminal Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="w-full mt-20 relative max-w-3xl mx-auto"
        >
          <div className="relative rounded-xl overflow-hidden bg-[#0F172A] border border-slate-700 shadow-2xl before:absolute before:inset-0 before:ring-1 before:ring-inset before:ring-white/5 text-left">
            <div className="flex items-center px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              </div>
              <div className="mx-auto text-xs text-slate-500 font-mono">piicasso-anonymize.sh</div>
            </div>
            <div className="p-6 font-mono text-sm leading-relaxed text-slate-400">
              <div className="mb-2"><span className="text-emerald-400">➜</span> ~ cat payload.json</div>
              <div className="text-slate-300 mb-4">{"{ \"name\": \"John Doe\", \"ssn\": \"123-45-6789\", \"diagnosis\": \"Asthma\" }"}</div>
              
              <div className="mb-2"><span className="text-emerald-400">➜</span> ~ piicasso process payload.json</div>
              <div className="text-slate-500 animate-pulse mb-2">Processing via zero-trust enclave...</div>
              
              <div className="text-emerald-300">{"{ \"name\": \"[PERSON_1]\", \"ssn\": \"[ID_NUM]\", \"diagnosis\": \"Asthma\" }"}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
