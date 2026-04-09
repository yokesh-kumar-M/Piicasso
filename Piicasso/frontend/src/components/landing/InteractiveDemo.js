import React, { useState } from 'react';
import { motion } from 'framer-motion';

const InteractiveDemo = () => {
  const [inputText, setInputText] = useState("My name is John Doe and my email is john@example.com.");
  const [mode, setMode] = useState('strict');

  const getRedactedText = () => {
    if (mode === 'strict') {
      return inputText.replace(/John Doe/g, "[REDACTED_NAME]").replace(/john@example\.com/g, "[REDACTED_EMAIL]");
    } else {
      return inputText.replace(/John Doe/g, "Alice Smith").replace(/john@example\.com/g, "alice@demo.net");
    }
  };

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">Try It Live</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-12">
            Experience the power of our real-time redaction engine.
          </p>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="bg-slate-100 dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-700 flex gap-4 justify-center">
              <button onClick={() => setMode('strict')} className={`px-4 py-2 rounded-md font-medium transition ${mode === 'strict' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>Strict Redaction</button>
              <button onClick={() => setMode('synthetic')} className={`px-4 py-2 rounded-md font-medium transition ${mode === 'synthetic' ? 'bg-green-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>Synthetic Data</button>
            </div>
            <div className="grid md:grid-cols-2">
              <div className="p-6 border-r border-slate-200 dark:border-slate-700">
                <label className="block text-sm font-semibold text-slate-500 mb-2 text-left">Input Text</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-200"
                />
              </div>
              <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50">
                 <label className="block text-sm font-semibold text-slate-500 mb-2 text-left">Output Result</label>
                 <div className="w-full h-32 p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-left text-slate-800 dark:text-slate-200 overflow-y-auto">
                    {getRedactedText()}
                 </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default InteractiveDemo;
