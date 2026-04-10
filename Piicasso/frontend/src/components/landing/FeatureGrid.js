import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Globe, Settings, Server, Code, ArrowRight } from 'lucide-react';

const FeatureGrid = () => {
  const features = [
    {
      icon: <ShieldCheck className="w-7 h-7 text-blue-600 dark:text-blue-400" />,
      title: 'Context-Aware PII Detection',
      description: 'Intelligent NLP understands context to accurately detect PII without destroying sentence structure. Reduces false positives by 94%.',
      benefit: 'Reduce compliance risk by 60%'
    },
    {
      icon: <Zap className="w-7 h-7 text-amber-500" />,
      title: 'Lightning-Fast Processing',
      description: 'Process thousands of documents per second with our highly optimized API. Sub-5ms latency for real-time applications.',
      benefit: 'Process 10x more data with less infrastructure'
    },
    {
      icon: <Globe className="w-7 h-7 text-emerald-500" />,
      title: 'Global Multi-Language Support',
      description: 'Seamlessly detect and redact PII across 50+ languages with enterprise-grade accuracy. Built for global organizations.',
      benefit: 'Expand into new markets without compliance headaches'
    },
    {
      icon: <Settings className="w-7 h-7 text-purple-500" />,
      title: 'Customizable Rulesets',
      description: 'Define custom regex patterns, dictionaries, or train domain-specific ML models for your unique compliance requirements.',
      benefit: 'Full control over your data classification rules'
    },
    {
      icon: <Server className="w-7 h-7 text-red-500" />,
      title: 'On-Premise Deployment',
      description: 'Run our lightweight models directly on your infrastructure. Keep sensitive data within your network for maximum security.',
      benefit: 'Zero data leaves your infrastructure'
    },
    {
      icon: <Code className="w-7 h-7 text-indigo-500" />,
      title: 'Developer-First API',
      description: 'Comprehensive Python, Node.js, Go, and Java SDKs with detailed documentation. Integrate in minutes, not days.',
      benefit: 'Ship faster with battle-tested integrations'
    }
  ];

  return (
    <section id="features" className="py-24 bg-slate-50 dark:bg-slate-950 relative">
      <div className="container mx-auto px-6 lg:px-16">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold rounded-full mb-4">
            Powerful Features
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            Everything You Need for <span className="text-blue-600 dark:text-blue-400">Secure Data</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            A comprehensive suite of tools designed to protect privacy while preserving the utility of your datasets for machine learning and analytics.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50"
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 mb-5 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                {feature.description}
              </p>

              {/* Benefit Tag */}
              <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {feature.benefit}
              </div>

              {/* Hover Arrow */}
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center mt-16"
        >
          <a
            href="/features"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:gap-3 transition-all duration-200"
          >
            Explore all features
            <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureGrid;
