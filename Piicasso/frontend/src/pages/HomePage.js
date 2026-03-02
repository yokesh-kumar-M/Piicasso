import React, { useState, lazy, Suspense, useCallback, useMemo } from 'react';
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
    <div className="bg-[#0a0a0a] text-white font-body min-h-screen flex flex-col">
      <Navbar />

      {/* Spacer for fixed navbar */}
      <div className="pt-16 shrink-0" />

      {/* 1. TOP BAR: Status Monitor */}
      <div className="px-4 md:px-6 py-2 border-b border-zinc-900 bg-[#141414] flex flex-wrap gap-3 md:gap-6 items-center justify-between text-xs font-mono text-gray-500 uppercase tracking-widest shrink-0">
        <div className="flex items-center gap-3 md:gap-4 text-[10px] font-mono tracking-widest text-gray-500 min-w-0">
          <div className="flex items-center gap-2 text-green-500 shrink-0">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="hidden sm:inline">USER DASHBOARD V4</span>
            <span className="sm:hidden">DASH V4</span>
          </div>
          <span className="text-zinc-700 hidden sm:block">|</span>
          <div className="hidden sm:block">CONNECTION: <span className="text-gray-300">SECURE</span></div>
        </div>
        <div className="flex gap-2 shrink-0">
          <span className="text-netflix-red font-bold hidden sm:block">STATUS: READY</span>
        </div>
      </div>

      {/* 2. MAIN CONTENT — on mobile: stacked vertically, on desktop: 3-column grid */}
      <div className="flex-1 bg-black p-2">

        {/* MOBILE LAYOUT: Sequential stacked sections (visible < lg) */}
        <div className="lg:hidden flex flex-col gap-2">

          {/* DATA INPUT — FIRST on mobile so user sees the form immediately */}
          <div className="bg-[#141414] border border-zinc-900 rounded-sm min-h-[600px]">
            <div className="bg-zinc-900/30 p-2 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-lg font-heading tracking-wide text-white"><span className="text-netflix-red">DATA INPUT</span> CONSOLE</h2>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500"></div>
              </div>
            </div>
            <TargetForm onFormUpdate={handleFormUpdate} />
          </div>

          {/* DASHBOARD METRICS — Collapsible on mobile */}
          <div className="bg-[#141414] border border-zinc-900 rounded-sm p-4">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-2">
              <div className="flex flex-col">
                <h3 className="text-[10px] font-mono text-zinc-500 tracking-[0.2em] uppercase">Dashboard Metrics</h3>
                <h2 className="text-sm font-bold text-white tracking-widest uppercase">Completion Profile</h2>
              </div>
              <div className="text-[10px] font-mono bg-red-950/30 text-red-500 px-2 py-0.5 border border-red-500/20 rounded-sm">
                LVL_0{Math.floor(Object.values(metrics).reduce((a, b) => a + b, 0) / 10) + 1}
              </div>
            </div>

            {/* Radar — Fixed height on mobile */}
            <div className="h-[280px] relative flex items-center justify-center bg-zinc-950/20 rounded-lg border border-white/5">
              <RiskRadar inputData={metrics} />
            </div>

            {/* Stats below radar */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/40 p-3 rounded-sm border border-zinc-800/50">
                <div className="text-[9px] font-mono text-zinc-500 uppercase">Input Completeness</div>
                <div className={`text-xl font-mono font-bold ${totalCompletenessScore > 10 ? 'text-red-500' : 'text-zinc-300'}`}>
                  {totalCompletenessScore}%
                </div>
              </div>
              <div className="bg-zinc-900/40 p-3 rounded-sm border border-zinc-800/50">
                <div className="text-[9px] font-mono text-zinc-500 uppercase">Data Confidence</div>
                <div className="text-xl font-mono font-bold text-zinc-300">
                  {filledCategoriesCount}/6
                </div>
              </div>
            </div>
          </div>

          {/* GLOBE */}
          <div className="bg-[#141414] border border-zinc-900 rounded-sm overflow-hidden">
            <div className="text-xs font-bold text-gray-400 p-2 border-b border-zinc-900 flex items-center gap-2 bg-[#141414]">
              <Wifi className="w-3 h-3" /> GLOBAL ACTIVITY MAP
            </div>
            <div className="h-[280px] bg-black overflow-hidden relative">
              <Suspense fallback={<div className="text-xs text-gray-600 animate-pulse p-4">LOADING MAP...</div>}>
                <GlobalMap />
              </Suspense>
            </div>
          </div>

          {/* ACTIVITY FEED */}
          <div className="bg-[#141414] border border-zinc-900 rounded-sm overflow-hidden">
            <div className="text-xs font-bold text-gray-400 p-2 border-b border-zinc-900 flex items-center gap-2">
              <Terminal className="w-3 h-3" /> RECENT ACTIVITY
            </div>
            <div className="h-[250px] p-2 bg-black/40 overflow-hidden">
              <SystemLogs />
            </div>
          </div>
        </div>

        {/* DESKTOP LAYOUT: 3-column grid (visible >= lg) */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-2 h-[calc(100vh-120px)]">

          {/* LEFT COLUMN: Dashboard Metrics */}
          <div className="col-span-3 bg-[#141414] border border-zinc-900 rounded-sm flex flex-col p-4 relative group overflow-y-auto custom-scrollbar">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
              <Activity className="w-5 h-5 text-red-500 animate-pulse" />
            </div>

            <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-2">
              <div className="flex flex-col">
                <h3 className="text-[10px] font-mono text-zinc-500 tracking-[0.2em] uppercase">Dashboard Metrics</h3>
                <h2 className="text-sm font-bold text-white tracking-widest uppercase">Completion Profile</h2>
              </div>
              <div className="text-[10px] font-mono bg-red-950/30 text-red-500 px-2 py-0.5 border border-red-500/20 rounded-sm">
                LVL_0{Math.floor(Object.values(metrics).reduce((a, b) => a + b, 0) / 10) + 1}
              </div>
            </div>

            {/* Radar Chart — fixed max height */}
            <div className="h-[280px] shrink-0 relative flex items-center justify-center bg-zinc-950/20 rounded-lg border border-white/5 shadow-inner">
              <RiskRadar inputData={metrics} />
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                <div className="w-full h-1/2 bg-gradient-to-b from-red-500/10 to-transparent top-0 absolute animate-scan-slow" />
              </div>
            </div>

            {/* Stats */}
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/40 p-3 rounded-sm border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                  <div className="text-[9px] font-mono text-zinc-500 uppercase">Input Completeness</div>
                  <div className={`text-xl font-mono font-bold ${totalCompletenessScore > 10 ? 'text-red-500' : 'text-zinc-300'}`}>
                    {totalCompletenessScore}%
                  </div>
                  <div className="w-full bg-zinc-800 h-[1px] mt-2">
                    <div
                      className="bg-red-600 h-full transition-all duration-1000"
                      style={{ width: `${totalCompletenessScore}%` }}
                    />
                  </div>
                </div>
                <div className="bg-zinc-900/40 p-3 rounded-sm border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                  <div className="text-[9px] font-mono text-zinc-500 uppercase">Data Confidence</div>
                  <div className="text-xl font-mono font-bold text-zinc-300">
                    {filledCategoriesCount}/6
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= filledCategoriesCount ? 'bg-zinc-400' : 'bg-zinc-800'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-black/40 p-2 rounded-sm border border-dashed border-zinc-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[8px] font-mono text-zinc-600">CONNECTION_SECURITY</span>
                  <span className="text-[8px] font-mono text-green-500">SECURE</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 overflow-hidden whitespace-nowrap opacity-50">
                  0x{Math.random().toString(16).substr(2, 24).toUpperCase()}...
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="pt-4 border-t border-zinc-900 mt-4">
                <div className="text-[8px] font-mono text-zinc-500 mb-2 uppercase flex items-center gap-2">
                  <div className="w-1 h-1 bg-red-500 rounded-full" /> CATEGORY_BREAKDOWN
                </div>
                <div className="space-y-2">
                  {Object.entries(metrics).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`w-1 h-1 rounded-full ${val > 5 ? 'bg-red-500 animate-pulse' : 'bg-zinc-800'}`} />
                      <div className="flex-1 flex justify-between items-center text-[9px] font-mono leading-none">
                        <span className={`${val > 0 ? 'text-zinc-400' : 'text-zinc-700'} uppercase tracking-tighter`}>{key}</span>
                        <span className={`${val > 5 ? 'text-red-500' : val > 0 ? 'text-zinc-500' : 'text-zinc-800'}`}>
                          {val > 7 ? 'EXCELLENT' : val > 4 ? 'GOOD' : val > 0 ? 'FAIR' : 'EMPTY'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: Data Input */}
          <div className="col-span-6 bg-[#141414] border border-zinc-900 rounded-sm flex flex-col overflow-hidden">
            <div className="bg-zinc-900/30 p-2 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-heading tracking-wide text-white"><span className="text-netflix-red">DATA INPUT</span> CONSOLE</h2>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500"></div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <TargetForm onFormUpdate={handleFormUpdate} />
            </div>
          </div>

          {/* RIGHT COLUMN: Globe + Activity */}
          <div className="col-span-3 bg-[#141414] border border-zinc-900 rounded-sm flex flex-col overflow-hidden">
            <div className="h-1/2 flex flex-col bg-zinc-900/10 border-b border-zinc-900">
              <div className="text-xs font-bold text-gray-400 p-2 border-b border-zinc-900 shrink-0 flex items-center gap-2 bg-[#141414]">
                <Wifi className="w-3 h-3" /> GLOBAL ACTIVITY MAP
              </div>
              <div className="flex-1 bg-black overflow-hidden relative">
                <Suspense fallback={<div className="text-xs text-gray-600 animate-pulse p-4">LOADING MAP...</div>}>
                  <GlobalMap />
                </Suspense>
              </div>
            </div>
            <div className="h-1/2 flex flex-col">
              <div className="text-xs font-bold text-gray-400 p-2 border-b border-zinc-900 shrink-0 flex items-center gap-2">
                <Terminal className="w-3 h-3" /> RECENT ACTIVITY
              </div>
              <div className="flex-1 p-2 bg-black/40 overflow-hidden">
                <SystemLogs />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HomePage;