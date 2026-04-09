import React from 'react';
import { motion } from 'framer-motion';

const DualModeShowcase = () => {
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">Dual Mode Processing</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-12">
            Switch effortlessly between rigorous strict redaction and intelligent synthetic data generation.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 w-full max-w-sm">
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Strict Mode</h3>
              <p className="text-slate-700 dark:text-slate-300">
                "Hello, my name is [REDACTED] and my phone number is [REDACTED]."
              </p>
            </div>
            
            <div className="text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 w-full max-w-sm">
              <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4">Synthetic Mode</h3>
              <p className="text-slate-700 dark:text-slate-300">
                "Hello, my name is <span className="underline decoration-green-400">Alex Jones</span> and my phone number is <span className="underline decoration-green-400">555-0192</span>."
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DualModeShowcase;
