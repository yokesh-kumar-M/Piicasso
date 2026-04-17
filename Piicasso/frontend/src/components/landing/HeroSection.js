import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Activity, Terminal, Lock } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-[#0B0E14] overflow-hidden font-sans text-slate-300">
      {/* High-tech grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.8)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
      
      {/* Dynamic scanline effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(59,130,246,0.05)_50%,transparent_100%)] bg-[length:100%_200%] animate-[scan_8s_linear_infinite]"></div>

      {/* Glowing Accents */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="container mx-auto px-6 lg:px-16 relative z-10 pt-32 pb-20 flex flex-col lg:flex-row items-center justify-between gap-16 min-h-screen">
        
        {/* Left Column: Copy */}
        <div className="w-full lg:w-1/2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="h-px w-8 bg-blue-500"></div>
            <span className="text-xs font-mono text-blue-400 tracking-[0.2em] uppercase">System Online // v2.4.1</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-white leading-[1.1] mb-6"
          >
            Military-Grade <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Data Anonymization
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed font-light max-w-2xl"
          >
            PIIcasso provides autonomous, zero-trust entity redaction and synthetic data generation. Protect sensitive intelligence workflows without sacrificing analytical utility.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              to="/operation"
              className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-blue-600/10 border border-blue-500/50 hover:bg-blue-600/20 text-blue-400 rounded transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 w-0 bg-blue-500/10 transition-all duration-[250ms] ease-out group-hover:w-full"></div>
              <span className="relative font-mono text-sm uppercase tracking-wider font-semibold">Deploy Infrastructure</span>
              <ArrowRight className="relative w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/api"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-transparent border border-slate-700 hover:border-slate-500 text-slate-300 rounded transition-all duration-300"
            >
              <Terminal className="w-4 h-4" />
              <span className="font-mono text-sm uppercase tracking-wider">Access API Protocol</span>
            </Link>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 grid grid-cols-3 gap-8 pt-8 border-t border-slate-800"
          >
            <div>
              <div className="text-2xl font-bold text-white mb-1 font-mono">Sub-5ms</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Processing Latency</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white mb-1 font-mono">AES-256</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Encryption Std</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400 mb-1 font-mono">100%</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Zero-Trust Architecture</div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Terminal/Radar UI */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full lg:w-1/2 relative"
        >
          <div className="relative rounded-xl overflow-hidden bg-[#0F172A] border border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.8)] before:absolute before:inset-0 before:ring-1 before:ring-inset before:ring-white/10">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0B0E14] border-b border-slate-800">
              <div className="flex gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono tracking-widest flex items-center gap-2">
                <Shield className="w-3 h-3 text-emerald-500" />
                SECURE_ENCLAVE_ACTIVE
              </div>
            </div>
            
            {/* Terminal Body */}
            <div className="p-6 font-mono text-xs leading-relaxed">
              <div className="text-slate-500 mb-4">&gt; INITIALIZING DATA STREAM INTERCEPT... <span className="text-emerald-400">OK</span></div>
              
              <div className="space-y-3">
                <div className="flex flex-col bg-[#0B0E14] p-3 rounded border border-slate-800/50 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50"></div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>INBOUND PAYLOAD (RAW)</span>
                    <span className="text-red-400">THREAT DETECTED</span>
                  </div>
                  <div className="text-slate-300">
                    "Patient <span className="text-red-400 bg-red-400/10 px-1">John Doe</span> (DOB: <span className="text-red-400 bg-red-400/10 px-1">05/12/1980</span>) SSN: <span className="text-red-400 bg-red-400/10 px-1">***-**-1234</span> admitted."
                  </div>
                </div>

                <div className="flex items-center justify-center py-1">
                  <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                </div>

                <div className="flex flex-col bg-[#0B0E14] p-3 rounded border border-slate-800/50 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/50"></div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>OUTBOUND PAYLOAD (SANITIZED)</span>
                    <span className="text-emerald-400">CLEARED</span>
                  </div>
                  <div className="text-slate-300">
                    "Patient <span className="text-emerald-400 bg-emerald-400/10 px-1">[PERSON_1]</span> (DOB: <span className="text-emerald-400 bg-emerald-400/10 px-1">[DATE_1]</span>) SSN: <span className="text-emerald-400 bg-emerald-400/10 px-1">[ID_NUM]</span> admitted."
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-slate-500 border-t border-slate-800 pt-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  <span>ALGORITHM: PII-NLP-v4</span>
                </div>
                <span>LATENCY: 1.2ms</span>
              </div>
            </div>
          </div>

          {/* Floating UI Elements */}
          <div className="absolute -right-8 top-1/4 bg-[#0F172A] border border-slate-700 p-3 rounded shadow-2xl backdrop-blur-sm hidden lg:block">
            <div className="text-[10px] text-slate-400 font-mono mb-1">NETWORK_STATUS</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
              <span className="text-sm font-bold text-white tracking-wider">OPTIMAL</span>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { background-position: 0 -100vh; }
          100% { background-position: 0 100vh; }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
