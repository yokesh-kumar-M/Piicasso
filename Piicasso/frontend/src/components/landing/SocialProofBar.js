import React from 'react';
import { motion } from 'framer-motion';

const SocialProofBar = () => {
  const logos = [
    { name: 'Salesforce', abbr: 'SF' },
    { name: 'Microsoft', abbr: 'MS' },
    { name: 'IBM', abbr: 'IBM' },
    { name: 'Accenture', abbr: 'ACN' },
    { name: 'Deloitte', abbr: 'DL' },
    { name: 'Palantir', abbr: 'PLTR' },
  ];

  return (
    <section className="py-12 bg-white dark:bg-slate-950 border-y border-slate-100 dark:border-slate-800/50">
      <div className="container mx-auto px-6 lg:px-16">
        <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-8 text-center">
          Trusted by Security Teams at Industry Leaders
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {logos.map((logo, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group flex items-center gap-3 cursor-default"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300">
                {logo.abbr}
              </div>
              <span className="text-lg font-semibold text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors duration-300 hidden sm:block">
                {logo.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofBar;
