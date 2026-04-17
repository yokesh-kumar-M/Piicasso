import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Cpu, Globe, Settings2, Server, Code2, ArrowRight } from 'lucide-react';

const FeatureGrid = () => {
  const features = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      title: 'Context-Aware Detection',
      description: 'NLP models analyze contextual semantics to surgically redact PII while preserving dataset structure and analytical utility.',
      benefit: 'Reduces false positives by 94%'
    },
    {
      icon: <Cpu className="w-6 h-6 text-blue-400" />,
      title: 'High-Velocity Processing',
      description: 'Distributed architecture handles thousands of documents concurrently. Optimized pipeline yields sub-5ms latency for real-time applications.',
      benefit: 'Handles 10M+ records per minute'
    },
    {
      icon: <Globe className="w-6 h-6 text-indigo-400" />,
      title: 'Global Multi-Language',
      description: 'Native detection capabilities spanning 50+ languages with localized format recognition for international compliance.',
      benefit: 'Cross-border GDPR & CCPA readiness'
    },
    {
      icon: <Settings2 className="w-6 h-6 text-purple-400" />,
      title: 'Dynamic Rulesets',
      description: 'Inject custom regex schemas, domain-specific dictionaries, and proprietary ML models to adapt to bespoke compliance mandates.',
      benefit: 'Granular control over entity matching'
    },
    {
      icon: <Server className="w-6 h-6 text-red-400" />,
      title: 'On-Premise Enclaves',
      description: 'Deploy lightweight containerized models directly onto your infrastructure (VPC, air-gapped). Absolute data sovereignty.',
      benefit: 'Zero external data transit'
    },
    {
      icon: <Code2 className="w-6 h-6 text-cyan-400" />,
      title: 'Developer SDKs',
      description: 'Native wrappers for Python, Go, Node.js, and Java. Integrate advanced PII redaction into existing pipelines in under 10 minutes.',
      benefit: 'Battle-tested enterprise integrations'
    }
  ];

  return (
    <section id="features" className="py-24 bg-[#0B0E14] relative border-t border-slate-800">
      {/* Background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-900/10 blur-[120px] pointer-events-none rounded-[100%]"></div>
      
      <div className="container mx-auto px-6 lg:px-16 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mb-20"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-12 bg-blue-500"></div>
            <span className="text-xs font-mono text-blue-400 tracking-[0.2em] uppercase">Core Capabilities</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tighter">
            Architected for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Total Security</span>
          </h2>
          <p className="text-lg text-slate-400 font-light max-w-2xl">
            PIIcasso's defense-in-depth toolset shields your data fabric from unauthorized access while maintaining structural integrity for downstream machine learning.
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
              className="group relative bg-[#0F172A] rounded-xl p-8 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] overflow-hidden"
            >
              {/* Scanline hover effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/0 via-blue-500/5 to-blue-500/0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000"></div>

              {/* Icon */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-[#0B0E14] border border-slate-700 mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-white mb-3 tracking-wide">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6 font-light">
                {feature.description}
              </p>

              {/* Benefit Tag */}
              <div className="mt-auto flex items-center gap-2 text-xs font-mono tracking-wider text-slate-300 bg-[#0B0E14] px-3 py-2 rounded border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {feature.benefit}
              </div>

              {/* Hover Arrow */}
              <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
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
          className="mt-16 flex justify-end"
        >
          <a
            href="/features"
            className="group flex items-center gap-3 text-xs font-mono tracking-[0.2em] uppercase text-blue-400 hover:text-blue-300 transition-colors"
          >
            Access Full Specification
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureGrid;
