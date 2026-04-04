import React, { useState, lazy, Suspense, useCallback, useMemo } from 'react';
import Navbar from '../components/Navbar';
import TargetForm from '../components/TargetForm';
import RiskRadar from '../components/RiskRadar';
import SystemLogs from '../components/SystemLogs';
import { Activity, Wifi, Terminal, ShieldAlert, Crosshair, Database, Server } from 'lucide-react';
import { motion } from 'framer-motion';

const GlobalMap = lazy(() => import('../components/GlobalMap'));

const SecurityDashboardPage = () => {
  const [metrics, setMetrics] = useState({
    identity: 0, family: 0, work: 0, location: 0, interests: 0, assets: 0
  });

  const handleFormUpdate = useCallback((data) => {
    const countFilled = (keys) => {
      const count = keys.filter(k => data[k] && data[k].length > 1).length;
      return Math.min(count * 3, 10);
    };

    setMetrics({
      identity: countFilled(['full_name', 'dob', 'phone_digits', 'username', 'email', 'ssn_last4', 'blood_type', 'height']),
      family: countFilled(['spouse_name', 'child_names', 'pet_names', 'mother_maiden', 'father_name', 'sibling_names', 'best_friend']),
      work: countFilled(['company', 'job_title', 'university', 'department', 'employee_id', 'boss_name', 'past_company', 'degree']),
      location: countFilled(['current_city', 'hometown', 'street_name', 'zip_code', 'state', 'country', 'vacation_spot']),
      interests: countFilled(['sports_team', 'musician', 'movies', 'hobbies', 'books', 'games', 'food']),
      assets: countFilled(['car_model', 'brand_affinity', 'license_plate', 'bank_name', 'device_type', 'crypto_wallet', 'subscription'])
    });
  }, []);

  const filledCategoriesCount = useMemo(() => Object.values(metrics).filter(v => v > 0).length, [metrics]);
  const totalCompletenessScore = useMemo(() => Math.round((Object.values(metrics).reduce((a, b) => a + b, 0) / 60) * 100) || 0, [metrics]);

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#0a0a0a] text-security-text font-sans">
      <Navbar />
      
      <div className="flex-1 w-full max-w-[1800px] mx-auto pt-24 px-4 sm:px-6 lg:px-8 pb-12 flex flex-col">
        
        {/* Header Strip */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0 mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-security-red/20 blur-xl rounded-full"></div>
              <ShieldAlert className="w-10 h-10 text-security-red relative z-10" />
            </div>
            <div>
              <h1 className="security-heading text-2xl lg:text-3xl m-0 leading-none tracking-widest text-white">TACTICAL DASHBOARD</h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mt-1">Intelligence Generation Interface</p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-6 text-[10px] font-mono uppercase tracking-widest font-bold">
            <div className="flex items-center gap-3">
              <span className="text-gray-500">System State</span>
              <span className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/20">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_currentColor]" /> SECURE
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-gray-500">Active Node</span>
              <span className="text-security-red bg-security-red/10 px-3 py-1 rounded border border-security-red/20">ALPHA-09</span>
            </div>
          </div>
        </header>

        {/* Main Grid: 12 Columns */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full min-h-[800px]">
          
          {/* Left Column: Target Input Pane (Spans 4 columns) */}
          <div className="xl:col-span-4 flex flex-col bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative">
            <div className="px-5 py-4 border-b border-white/10 bg-black/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-white">
                <Crosshair className="w-4 h-4 text-security-red" />
                <span className="font-display font-bold uppercase tracking-widest text-xs">Target Acquisition</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Confidence: {filledCategoriesCount}/6</div>
              </div>
            </div>
            
            <div className="flex-1 min-h-[600px] overflow-hidden">
               <TargetForm onFormUpdate={handleFormUpdate} />
            </div>
          </div>

          {/* Right Column: Analytics & Visualization (Spans 8 columns) */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            
            {/* Top Half: 2 Columns (Profile Matrix & 3D Globe) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[400px]">
              
              {/* Profile Matrix (Risk Radar) */}
              <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col relative group">
                <div className="px-4 py-3 border-b border-white/10 bg-black/60 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-security-red" />
                    <span className="font-display font-bold uppercase tracking-widest text-[10px] text-white">Profiling Matrix</span>
                  </div>
                  <div className="text-[10px] font-mono text-white/50 uppercase">Score: <span className="text-white font-bold">{totalCompletenessScore}%</span></div>
                </div>
                <div className="flex-1 flex items-center justify-center p-4 relative z-10">
                   <RiskRadar inputData={metrics} />
                </div>
              </div>

              {/* 3D Globe (Geospatial Tracking) */}
              <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col relative">
                <div className="px-4 py-3 border-b border-white/10 bg-black/60 flex items-center justify-between shrink-0 z-20">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-3.5 h-3.5 text-security-red" />
                    <span className="font-display font-bold uppercase tracking-widest text-[10px] text-white">Geospatial Routing</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-security-red animate-pulse"></span>
                  </div>
                </div>
                <div className="flex-1 relative cursor-move">
                  {/* Subtle Background glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(225,29,72,0.05),transparent)] pointer-events-none"></div>
                  <Suspense fallback={
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-2 border-security-red border-t-transparent rounded-full animate-spin mb-3"></div>
                      <div className="text-[9px] font-mono text-gray-500 tracking-widest uppercase">Initializing Map...</div>
                    </div>
                  }>
                    <GlobalMap />
                  </Suspense>
                </div>
              </div>

            </div>

            {/* Bottom Half: Full Width System Logs */}
            <div className="bg-[#050505] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[250px] shrink-0">
              <div className="px-4 py-3 border-b border-white/10 bg-black/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-display font-bold uppercase tracking-widest text-[10px] text-white">System Logs</span>
                </div>
                <div className="flex gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                   <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                   <div className="w-2 h-2 rounded-full bg-security-red shadow-[0_0_5px_currentColor]"></div>
                </div>
              </div>
              <div className="flex-1 bg-black/80 overflow-hidden relative p-3">
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
                 <SystemLogs />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboardPage;
