import React, { useState, lazy, Suspense } from 'react';
import Navbar from '../components/Navbar';
import TargetForm from '../components/TargetForm';
import RiskRadar from '../components/RiskRadar';
import SystemLogs from '../components/SystemLogs';
import { Activity, Wifi, Terminal } from 'lucide-react';

const GlobalMap = lazy(() => import('../components/GlobalMap'));

const HomePage = () => {
  const [metrics, setMetrics] = useState({
    identity: 0, family: 0, work: 0, location: 0, interests: 0, assets: 0
  });

  const handleFormUpdate = (data) => {
    // Simple heuristic to map fields to categories and calculate "score" (0-10)
    const countFilled = (keys) => {
      const count = keys.filter(k => data[k] && data[k].length > 1).length;
      return Math.min(count * 3, 10); // 3 points per field, max 10
    };

    setMetrics({
      identity: countFilled(['full_name', 'dob', 'phone_digits', 'username', 'email', 'ssn_last4', 'blood_type', 'height']),
      family: countFilled(['spouse_name', 'child_names', 'pet_names', 'mother_maiden', 'father_name', 'sibling_names', 'best_friend']),
      work: countFilled(['company', 'job_title', 'university', 'department', 'employee_id', 'boss_name', 'past_company', 'degree']),
      location: countFilled(['current_city', 'hometown', 'street_name', 'zip_code', 'state', 'country', 'vacation_spot']),
      interests: countFilled(['sports_team', 'musician', 'movies', 'hobbies', 'books', 'games', 'food']),
      assets: countFilled(['car_model', 'brand_affinity', 'license_plate', 'bank_name', 'device_type', 'crypto_wallet', 'subscription'])
    });
  };

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white font-body overflow-hidden flex flex-col">
      <Navbar />

      {/* 1. TOP BAR: Status Monitor (Adding 'Tracking' feeling) */}
      <div className="pt-20 px-4 md:px-6 pb-2 border-b border-zinc-900 bg-[#141414] flex flex-wrap gap-6 items-center justify-between text-xs font-mono text-gray-500 uppercase tracking-widest">
        <div className="flex items-center gap-4 text-[10px] font-mono tracking-widest text-gray-500">
          <div className="flex items-center gap-2 text-green-500">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span>DATA_NODE_INTERFACE_V4</span>
          </div>
          <span className="text-zinc-700">|</span>
          <div>ENCRYPTION: <span className="text-gray-300">AES-256</span></div>
          <span className="text-zinc-700">|</span>
          <div>SESSION: <span className="text-blue-500 animate-pulse">ACTIVE</span></div>
        </div>
        <div className="flex gap-2">
          <span className="text-netflix-red font-bold">MODE: ACTIVE PURSUIT</span>
          <span className="border border-zinc-800 px-2">V2.5.1 BUILD</span>
        </div>
      </div>

      {/* 2. MAIN GRID LAYOUT - FIXED VIEWPORT */}
      <div className="flex-1 relative overflow-hidden bg-black p-2">
        <div className="absolute inset-2 grid grid-cols-12 gap-1">

          {/* LEFT COLUMN: VISUAL INTELLIGENCE (Charts & Maps) */}
          <div className="col-span-12 lg:col-span-3 bg-[#141414] border border-zinc-900 rounded-sm flex flex-col p-4 relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
              <Activity className="w-5 h-5 text-red-500 animate-pulse" />
            </div>

            <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-2">
              <div className="flex flex-col">
                <h3 className="text-[10px] font-mono text-zinc-500 tracking-[0.2em] uppercase">Visual Intelligence</h3>
                <h2 className="text-sm font-bold text-white tracking-widest uppercase">Target Risk Profile</h2>
              </div>
              <div className="text-[10px] font-mono bg-red-950/30 text-red-500 px-2 py-0.5 border border-red-500/20 rounded-sm">
                LVL_0{Math.floor(Object.values(metrics).reduce((a, b) => a + b, 0) / 10) + 1}
              </div>
            </div>

            {/* Radar Chart Container */}
            <div className="flex-1 min-h-[250px] relative flex items-center justify-center bg-zinc-950/20 rounded-lg border border-white/5 shadow-inner">
              <RiskRadar inputData={metrics} />

              {/* Visual Scan Overlays */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                <div className="w-full h-1/2 bg-gradient-to-b from-red-500/10 to-transparent top-0 absolute animate-scan-slow" />
              </div>
            </div>

            {/* Detailed Security Posture */}
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/40 p-3 rounded-sm border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                  <div className="text-[9px] font-mono text-zinc-500 uppercase">Hit Probability</div>
                  <div className={`text-xl font-mono font-bold ${Object.values(metrics).some(v => v > 5) ? 'text-red-500' : 'text-zinc-300'}`}>
                    {Math.round((Object.values(metrics).reduce((a, b) => a + b, 0) / 60) * 100) || 0}%
                  </div>
                  <div className="w-full bg-zinc-800 h-[1px] mt-2">
                    <div
                      className="bg-red-600 h-full transition-all duration-1000"
                      style={{ width: `${Math.round((Object.values(metrics).reduce((a, b) => a + b, 0) / 60) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="bg-zinc-900/40 p-3 rounded-sm border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                  <div className="text-[9px] font-mono text-zinc-500 uppercase">Intel Confidence</div>
                  <div className="text-xl font-mono font-bold text-zinc-300">
                    {Object.values(metrics).filter(v => v > 0).length}/6
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= Object.values(metrics).filter(v => v > 0).length ? 'bg-zinc-400' : 'bg-zinc-800'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-black/40 p-2 rounded-sm border border-dashed border-zinc-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[8px] font-mono text-zinc-600">ENCRYPTION_STRENGTH</span>
                  <span className="text-[8px] font-mono text-green-500">OPTIMAL</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 overflow-hidden whitespace-nowrap opacity-50">
                  0x{Math.random().toString(16).substr(2, 24).toUpperCase()}...
                </div>
              </div>

              {/* NEW: Critical Weakness Breakdown */}
              <div className="pt-4 border-t border-zinc-900 mt-4">
                <div className="text-[8px] font-mono text-zinc-500 mb-2 uppercase flex items-center gap-2">
                  <div className="w-1 h-1 bg-red-500 rounded-full" /> VULNERABILITY_BREAKDOWN
                </div>
                <div className="space-y-2">
                  {Object.entries(metrics).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`w-1 h-1 rounded-full ${val > 5 ? 'bg-red-500 animate-pulse' : 'bg-zinc-800'}`} />
                      <div className="flex-1 flex justify-between items-center text-[9px] font-mono leading-none">
                        <span className={`${val > 0 ? 'text-zinc-400' : 'text-zinc-700'} uppercase tracking-tighter`}>{key}</span>
                        <span className={`${val > 5 ? 'text-red-500' : val > 0 ? 'text-zinc-500' : 'text-zinc-800'}`}>
                          {val > 7 ? 'CRITICAL' : val > 4 ? 'MODERATE' : val > 0 ? 'NOMINAL' : 'NULL'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: CONTROL DECK (Main Input) */}
          <div className="col-span-12 lg:col-span-6 bg-[#141414] border border-zinc-900 rounded-sm flex flex-col relative h-full">
            <div className="bg-zinc-900/30 p-2 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-lg font-heading tracking-wide text-white"><span className="text-netflix-red">DATA INJECTION</span> CONSOLE</h2>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500"></div>
              </div>
            </div>

            {/* The Form is the "Complex" Input Menu */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
              <TargetForm onFormUpdate={handleFormUpdate} />
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE TRACKING (Logs & Feed) */}
          <div className="col-span-12 lg:col-span-3 bg-[#141414] border border-zinc-900 rounded-sm flex flex-col h-full">
            {/* Panel 1: Live Feed */}
            <div className="h-1/2 border-b border-zinc-900 flex flex-col">
              <div className="text-xs font-bold text-gray-400 p-2 border-b border-zinc-900 flex items-center gap-2">
                <Terminal className="w-3 h-3" /> SYSTEM LOGS
              </div>
              <div className="flex-1 p-2 overflow-hidden bg-black/40">
                <SystemLogs />
              </div>
            </div>

            {/* Panel 2: Network Activity / Output Preview */}
            <div className="h-1/2 flex flex-col bg-zinc-900/10 relative overflow-hidden">
              <div className="text-xs font-bold text-gray-400 p-2 border-b border-zinc-900 flex items-center gap-2 z-10 bg-[#141414]">
                <Wifi className="w-3 h-3" /> GLOBAL THREAT MAP
              </div>
              <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
                <Suspense fallback={<div className="text-xs text-gray-600 animate-pulse">BOOTING SATELLITE...</div>}>
                  <GlobalMap />
                </Suspense>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HomePage;