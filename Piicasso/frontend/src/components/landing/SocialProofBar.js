import React from 'react';
import { motion } from 'framer-motion';

const SocialProofBar = () => {
  const logos = [
    'Acme Corp', 'GlobalTech', 'Nebula Systems', 'Quantum Data', 'Starlight Inc'
  ];

  return (
    <section className="py-12 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-8">
          Trusted by Innovative Teams Worldwide
        </p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {logos.map((logo, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-bold text-xl md:text-2xl"
            >
              {logo}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofBar;
