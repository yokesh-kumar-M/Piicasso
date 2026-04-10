import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Lock, Globe } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-white dark:bg-slate-950 overflow-hidden">
      {/* Subtle grid pattern background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDI5M2EiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmgtNHYyaC0ydi0ySDI2djJoLTJ2NGgydjJoNHYtMmgydjJoNHYtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30 dark:opacity-20"></div>
      
      {/* Gradient orb decoration */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-600/15 via-blue-600/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

      <div className="container mx-auto px-6 lg:px-16 relative z-10">
        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center pt-12 pb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Enterprise-Grade Security • SOC2 & HIPAA Compliant
            </span>
          </div>
        </motion.div>

        {/* Main Hero Content */}
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-6"
          >
            The Zero-Trust Platform for{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              PII-Safe AI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Unlock your data's potential without compromising privacy. Context-aware redaction and synthetic data generation for modern AI workloads.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/operation"
              className="group flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5"
            >
              Request Enterprise Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/api"
              className="group flex items-center gap-2 px-8 py-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              Explore API Docs
            </Link>
          </motion.div>
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-t border-b border-slate-200 dark:border-slate-800"
        >
          {[
            { icon: <Zap className="w-5 h-5" />, value: "50+", label: "Languages Supported" },
            { icon: <Globe className="w-5 h-5" />, value: "99.9%", label: "API Uptime SLA" },
            { icon: <Lock className="w-5 h-5" />, value: "Zero", label: "Data Retention" },
            { icon: <Shield className="w-5 h-5" />, value: "HIPAA", label: "Compliant" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-3">
                {stat.icon}
              </div>
              <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Hero Visual - Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="max-w-5xl mx-auto mt-16 mb-12"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/20 dark:shadow-black/50 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 mx-4">
                <div className="px-4 py-1.5 bg-white dark:bg-slate-700 rounded-md text-sm text-slate-400 dark:text-slate-500">
                  app.piicasso.io/dashboard
                </div>
              </div>
            </div>
            {/* Dashboard preview */}
            <div className="p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-4">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">PII Detection Results</span>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">Secured</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-mono rounded">John Smith</span>
                        <span className="text-xs text-slate-500">→ [REDACTED]</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-mono rounded">SSN: ***-**-4521</span>
                        <span className="text-xs text-slate-500">→ [REDACTED]</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white">
                    <div className="text-sm font-medium opacity-80 mb-1">Processing Speed</div>
                    <div className="text-3xl font-bold mb-1">2.4ms</div>
                    <div className="text-sm opacity-70">Average latency per document</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Entities Detected</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Names</span><span className="font-medium">24</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Emails</span><span className="font-medium">18</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Phones</span><span className="font-medium">7</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-500">SSN</span><span className="font-medium">3</span></div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">System Operational</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
