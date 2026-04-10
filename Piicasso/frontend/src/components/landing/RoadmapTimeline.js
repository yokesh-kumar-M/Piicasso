import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Rocket, Server, Database, Globe } from 'lucide-react';

const RoadmapTimeline = () => {
  const milestones = [
    {
      quarter: "Q1 2026",
      title: "Core Platform Launch",
      description: "Initial release with text redaction, API endpoints, and Python/Node.js SDKs.",
      status: "completed",
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      features: ["Text PII Detection", "REST API", "Python SDK", "Node.js SDK"]
    },
    {
      quarter: "Q2 2026",
      title: "Enterprise Features",
      description: "Multi-language support, custom ML models, and team management dashboard.",
      status: "current",
      icon: <Rocket className="w-5 h-5 text-blue-500" />,
      features: ["50+ Languages", "Custom Models", "Team Dashboard", "Audit Logs"]
    },
    {
      quarter: "Q3 2026",
      title: "Advanced Processing",
      description: "Image/PDF redaction, audio anonymization, and enhanced synthetic data generation.",
      status: "upcoming",
      icon: <Globe className="w-5 h-5 text-purple-500" />,
      features: ["Image Redaction", "PDF Processing", "Audio Anonymization", "Video Redaction"]
    },
    {
      quarter: "Q4 2026",
      title: "Enterprise Deployment",
      description: "On-premise deployment, dedicated infrastructure, and custom integrations.",
      status: "upcoming",
      icon: <Server className="w-5 h-5 text-slate-400" />,
      features: ["On-Premise", "VPC Deployment", "Custom Integrations", "Dedicated Support"]
    }
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'current':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-500';
    }
  };

  return (
    <section className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-900/50 pointer-events-none"></div>

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
            Product Roadmap
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            Our <span className="text-blue-600 dark:text-blue-400">Vision</span> for 2026
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Building the future of privacy-first AI applications. Here's what's coming next.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-slate-200 dark:from-blue-900 dark:via-purple-900 dark:to-slate-800 md:-translate-x-1/2"></div>

            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.5 }}
                  className={`relative flex items-start gap-6 md:gap-0 ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-4 md:left-1/2 -translate-x-1/2 z-10">
                    <div className={`w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center ${
                      milestone.status === 'completed' ? 'bg-green-500' :
                      milestone.status === 'current' ? 'bg-blue-500 animate-pulse' :
                      'bg-slate-300 dark:bg-slate-600'
                    }`}>
                      <div className="text-white">
                        {milestone.icon}
                      </div>
                    </div>
                  </div>

                  {/* Card */}
                  <div className={`ml-14 md:ml-0 md:w-[calc(50%-2rem)] ${
                    index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'
                  }`}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                      {/* Quarter Badge */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(milestone.status)}`}>
                          {milestone.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                          {milestone.status === 'current' && <Clock className="w-3 h-3" />}
                          {milestone.quarter}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                        {milestone.description}
                      </p>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2">
                        {milestone.features.map((feature, fIndex) => (
                          <span
                            key={fIndex}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              milestone.status === 'completed'
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                : milestone.status === 'current'
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Want early access to upcoming features?
          </p>
          <a
            href="/waitlist"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-purple-600/25"
          >
            Join the Waitlist
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default RoadmapTimeline;
