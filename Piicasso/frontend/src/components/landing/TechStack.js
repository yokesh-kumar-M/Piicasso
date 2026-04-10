import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Database, Cloud, Code, Server } from 'lucide-react';

const TechStack = () => {
  const technologies = [
    { name: 'Python', abbr: 'PY', color: 'from-yellow-500 to-orange-500' },
    { name: 'Django', abbr: 'DJ', color: 'from-green-500 to-emerald-600' },
    { name: 'React', abbr: 'RE', color: 'from-cyan-500 to-blue-500' },
    { name: 'PostgreSQL', abbr: 'PG', color: 'from-blue-600 to-indigo-600' },
    { name: 'Docker', abbr: 'DK', color: 'from-blue-400 to-cyan-400' },
    { name: 'Redis', abbr: 'RD', color: 'from-red-500 to-red-600' },
  ];

  const integrations = [
    { name: 'AWS', abbr: 'AWS' },
    { name: 'Azure', abbr: 'AZ' },
    { name: 'GCP', abbr: 'GCP' },
    { name: 'Snowflake', abbr: 'SF' },
  ];

  const compliance = [
    { name: 'SOC 2', icon: <Shield className="w-4 h-4" /> },
    { name: 'HIPAA', icon: <Lock className="w-4 h-4" /> },
    { name: 'GDPR', icon: <Database className="w-4 h-4" /> },
    { name: 'PCI-DSS', icon: <Cloud className="w-4 h-4" /> },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-950 text-white overflow-hidden relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900"></div>
      </div>

      <div className="container mx-auto px-6 lg:px-16 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-blue-900/50 text-blue-300 text-sm font-semibold rounded-full mb-4">
            Enterprise Architecture
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
            Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Scale & Security</span>
          </h2>
          <p className="text-lg text-slate-400">
            Enterprise-grade infrastructure with battle-tested open-source technologies. Zero-downtime, maximum data protection.
          </p>
        </motion.div>

        {/* Tech Stack Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-6 mb-16"
        >
          {technologies.map((tech, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="flex items-center gap-3 px-5 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl transition-all duration-300 cursor-default">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tech.color} flex items-center justify-center font-bold text-white shadow-lg`}>
                  {tech.abbr}
                </div>
                <span className="font-semibold text-slate-300 group-hover:text-white transition-colors">
                  {tech.name}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Integrations & Compliance */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Cloud Integrations */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-8 border border-slate-700"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-900/50 rounded-lg">
                <Cloud className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold">Cloud Integrations</h3>
            </div>
            <div className="flex flex-wrap gap-4">
              {integrations.map((int, index) => (
                <div
                  key={index}
                  className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg font-medium text-slate-300 hover:text-white transition-all cursor-default"
                >
                  {int.name}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Native integrations with major cloud providers for seamless deployment.
            </p>
          </motion.div>

          {/* Compliance & Security */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm rounded-2xl p-8 border border-blue-800/50"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold">Compliance Ready</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {compliance.map((comp, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg border border-blue-700/50 text-blue-300"
                >
                  {comp.icon}
                  <span className="font-semibold">{comp.name}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Meet regulatory requirements out of the box with built-in compliance features.
            </p>
          </motion.div>
        </div>

        {/* Architecture Icons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex justify-center gap-8 mt-16 pt-16 border-t border-slate-800"
        >
          <div className="flex items-center gap-2 text-slate-500">
            <Code className="w-5 h-5" />
            <span className="text-sm">REST API</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Server className="w-5 h-5" />
            <span className="text-sm">Microservices</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Database className="w-5 h-5" />
            <span className="text-sm">Zero Data Retention</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TechStack;
