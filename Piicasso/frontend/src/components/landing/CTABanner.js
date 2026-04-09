import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CTABanner = () => {
  return (
    <section className="py-24 bg-blue-600 dark:bg-blue-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-800 dark:to-purple-900 opacity-90"></div>
      <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            Ready to Secure Your Data?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of developers building privacy-first applications with PIIcasso. Get started for free today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/app" className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-lg shadow-xl transition-transform hover:scale-105 text-lg">
              Create Free Account
            </Link>
            <Link to="/contact" className="w-full sm:w-auto px-8 py-4 border-2 border-white text-white hover:bg-white/10 font-semibold rounded-lg transition-colors text-lg">
              Contact Sales
            </Link>
          </div>
          <p className="mt-8 text-sm text-blue-200 font-medium">
            No credit card required. Cancel anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTABanner;
