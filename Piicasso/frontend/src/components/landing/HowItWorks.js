import React from 'react';
import { motion } from 'framer-motion';

const HowItWorks = () => {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 text-center">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-slate-900 dark:text-white">How PIIcasso Works</h2>
        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto relative">
          
          <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} className="z-10">
            <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-blue-600 dark:text-blue-300">1</div>
            <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Upload Data</h3>
            <p className="text-slate-600 dark:text-slate-400">Submit your sensitive text, images, or documents via our API or secure dashboard.</p>
          </motion.div>
          
          <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:0.2}} className="z-10">
             <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-blue-600 dark:text-blue-300">2</div>
            <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">AI Processing</h3>
            <p className="text-slate-600 dark:text-slate-400">Our advanced NLP models scan and identify personally identifiable information in real-time.</p>
          </motion.div>

          <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:0.4}} className="z-10">
             <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-blue-600 dark:text-blue-300">3</div>
            <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Secure Export</h3>
            <p className="text-slate-600 dark:text-slate-400">Receive your cleanly redacted or synthesized data, ready for safe analysis or model training.</p>
          </motion.div>
          
          {/* Connector Line (desktop only) */}
          <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-slate-200 dark:bg-slate-800 -z-10" />

        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
