import React from 'react';
import { motion } from 'framer-motion';

const TechStack = () => {
  return (
    <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-transparent opacity-20"></div>
      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Scale & Security</h2>
        <p className="text-lg text-slate-400 mb-16 max-w-2xl mx-auto">
          PIIcasso is engineered with the most reliable open-source and enterprise technologies to ensure zero-downtime and maximum data protection.
        </p>

        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-80">
          {/* Using simple text placeholders for tech stack icons to avoid missing SVGs */}
          {['Python', 'Django', 'React', 'TailwindCSS', 'PostgreSQL', 'Docker'].map((tech, index) => (
             <motion.div
               key={index}
               initial={{ opacity: 0, scale: 0.8 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ delay: index * 0.1 }}
               className="text-2xl font-black tracking-widest text-slate-300 hover:text-white transition-colors cursor-default"
             >
               {tech}
             </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechStack;
