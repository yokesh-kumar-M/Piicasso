import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Code2 } from 'lucide-react';

const FeatureGrid = () => {
  const features = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      title: 'Context-Aware Redaction',
      description: 'Advanced NLP models analyze semantics to safely redact PII while preserving the original data structure and utility.'
    },
    {
      icon: <Zap className="w-6 h-6 text-blue-400" />,
      title: 'Sub-millisecond Latency',
      description: 'Distributed architecture handles thousands of documents concurrently, optimized for real-time application pipelines.'
    },
    {
      icon: <Code2 className="w-6 h-6 text-indigo-400" />,
      title: 'Developer First API',
      description: 'RESTful endpoints and native SDKs let you integrate advanced PII redaction into your workflow in under 10 minutes.'
    }
  ];

  return (
    <section id="features" className="py-24 bg-slate-900 relative border-t border-slate-800/50">
      <div className="container mx-auto px-6 lg:px-16 relative z-10 max-w-6xl">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-4 tracking-tight">
            Everything you need for secure data handling
          </h2>
          <p className="text-lg text-slate-400 font-light">
            PIIcasso provides the building blocks to shield your data fabric from unauthorized access without slowing down development.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-slate-800/20 rounded-2xl p-8 border border-slate-700/50 hover:border-slate-600 transition-colors duration-300"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 mb-6 shadow-sm">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-50 mb-3 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-slate-400 leading-relaxed font-light">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
