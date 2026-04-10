import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Cpu, Download, ArrowRight } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <Upload className="w-7 h-7" />,
      title: "Upload Your Data",
      description: "Submit sensitive text, images, or documents via our secure API or dashboard. Supports JSON, CSV, PDF, and more.",
      detail: "REST API • SDKs • Direct Upload"
    },
    {
      icon: <Cpu className="w-7 h-7" />,
      title: "AI-Powered Analysis",
      description: "Our context-aware NLP models identify and classify PII across 50+ entity types in real-time.",
      detail: "Sub-5ms Latency • 99.7% Accuracy"
    },
    {
      icon: <Download className="w-7 h-7" />,
      title: "Secure Export",
      description: "Receive redacted or synthesized data ready for AI training, analytics, or compliant sharing.",
      detail: "Redacted • Synthetic • Masked"
    }
  ];

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
          <span className="inline-block px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold rounded-full mb-4">
            Simple Integration
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            Get Started in <span className="text-blue-600 dark:text-blue-400">Minutes</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Three simple steps to secure your data pipeline. Our developer-friendly API makes integration seamless.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 dark:from-blue-900 dark:via-purple-900 dark:to-blue-900" />
          
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className="relative text-center"
            >
              {/* Step Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300">
                {/* Icon Circle */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-600 dark:text-blue-400 mb-6 relative">
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {step.description}
                </p>

                {/* Tech Detail Tag */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {step.detail}
                  </span>
                </div>
              </div>

              {/* Arrow (between cards on desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-8 h-8 text-blue-400" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Quick Start Code Snippet */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-6 border border-slate-800 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-2 text-sm text-slate-500">piicasso-quickstart.py</span>
            </div>
            <pre className="text-sm font-mono overflow-x-auto">
              <code className="text-slate-300">
                <span className="text-purple-400">from</span> piicasso <span className="text-purple-400">import</span> Client
              </code>
              <br />
              <code className="text-slate-300">
                client = Client(api_key=<span className="text-green-400">"your_api_key"</span>)
              </code>
              <br />
              <code className="text-slate-300">
                result = client.redact(<span className="text-green-400">"John's SSN is 123-45-6789"</span>)
              </code>
              <br />
              <code className="text-slate-400">{'// Result: "John's SSN is [REDACTED]"'}</code>
            </pre>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
