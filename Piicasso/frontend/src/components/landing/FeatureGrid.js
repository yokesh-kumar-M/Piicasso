import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Zap, Globe, Layers, Cpu, Code } from 'lucide-react';

const FeatureGrid = () => {
  const features = [
    {
      icon: <ShieldAlert className="w-8 h-8 text-blue-500" />,
      title: 'Context-Aware Redaction',
      description: 'Advanced NLP models understand the context to accurately redact PII like names, addresses, and custom entities without destroying sentence structure.'
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      title: 'Lightning Fast API',
      description: 'Process thousands of documents per second with our highly optimized API endpoints designed for high-throughput enterprise workloads.'
    },
    {
      icon: <Globe className="w-8 h-8 text-green-500" />,
      title: 'Multi-Language Support',
      description: 'Seamlessly detect and redact PII across 50+ languages, perfect for global organizations handling diverse datasets.'
    },
    {
      icon: <Layers className="w-8 h-8 text-purple-500" />,
      title: 'Customizable Rulesets',
      description: 'Define your own regex patterns, dictionaries, or custom NLP models to target domain-specific sensitive information unique to your business.'
    },
    {
      icon: <Cpu className="w-8 h-8 text-red-500" />,
      title: 'Local Edge Processing',
      description: 'Run our lightweight models directly on your infrastructure. Keep your data on-premise and maintain complete control over sensitive workloads.'
    },
    {
      icon: <Code className="w-8 h-8 text-indigo-500" />,
      title: 'Developer Friendly SDKs',
      description: 'Integrate PIIcasso into your Python, Node.js, Go, or Java applications in minutes with our comprehensive, well-documented SDKs.'
    }
  ];

  return (
    <section id="features" className="py-24 bg-slate-50 dark:bg-slate-950 relative">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Everything You Need for Secure Data Workflows
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            A comprehensive suite of tools designed to protect privacy while preserving the utility of your datasets for machine learning and analytics.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 inline-block group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
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
