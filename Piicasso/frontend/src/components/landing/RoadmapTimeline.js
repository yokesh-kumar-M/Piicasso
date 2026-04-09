import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Calendar } from 'lucide-react';

const RoadmapTimeline = () => {
  const milestones = [
    {
      quarter: "Q1 2024",
      title: "Core API Launch",
      description: "Release of the primary text redaction endpoints and Python SDK.",
      status: "completed",
      icon: <CheckCircle2 className="w-6 h-6 text-green-500" />
    },
    {
      quarter: "Q2 2024",
      title: "Image & PDF Support",
      description: "Introduce OCR and visual PII detection for scanned documents.",
      status: "current",
      icon: <Clock className="w-6 h-6 text-blue-500 animate-spin-slow" />
    },
    {
      quarter: "Q3 2024",
      title: "Enterprise Dashboard",
      description: "Advanced analytics, team management, and audit logging.",
      status: "upcoming",
      icon: <Calendar className="w-6 h-6 text-slate-400" />
    },
    {
      quarter: "Q4 2024",
      title: "On-Premise Deployment",
      description: "Dockerized, air-gapped solution for maximum security compliance.",
      status: "upcoming",
      icon: <Calendar className="w-6 h-6 text-slate-400" />
    }
  ];

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 relative">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-16 text-slate-900 dark:text-white">Our Vision & Roadmap</h2>
        
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-1/2 -ml-0.5 w-1 h-full bg-slate-200 dark:bg-slate-700 hidden md:block"></div>

          <div className="space-y-12 relative">
            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`flex flex-col md:flex-row items-center justify-between w-full
                  ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}
                `}
              >
                <div className="order-1 w-full md:w-5/12 hidden md:block"></div>
                <div className="z-20 flex items-center order-1 bg-white dark:bg-slate-800 shadow-xl w-12 h-12 rounded-full border-4 border-slate-50 dark:border-slate-900 justify-center">
                  {milestone.icon}
                </div>
                <div className="order-1 bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 w-full md:w-5/12 px-6 py-6 mt-4 md:mt-0 text-left">
                  <span className="text-sm font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">{milestone.quarter}</span>
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white mt-2 mb-2">{milestone.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-snug">{milestone.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoadmapTimeline;
