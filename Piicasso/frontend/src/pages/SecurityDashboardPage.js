import React, {
  useState,
  useEffect,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import {
  Activity,
  Wifi,
  Terminal,
  ShieldAlert,
  Crosshair,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import DesignAppShell from '../components/design/dashboard/DesignAppShell.jsx';
import TargetForm from '../components/TargetForm';
import RiskRadar from '../components/RiskRadar';
import SystemLogs from '../components/SystemLogs';
import { AuthContext } from '../context/AuthContext';
const GlobalMap = lazy(() => import('../components/GlobalMap'));

const observabilityPresentation = {
  loading: {
    label: 'Checking',
    badge: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-400',
    indicator: 'animate-pulse bg-zinc-400',
  },
  success: {
    label: 'Logs available',
    badge: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
    indicator: 'bg-blue-400',
  },
  empty: {
    label: 'No log data',
    badge: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-400',
    indicator: 'bg-zinc-500',
  },
  permission: {
    label: 'Restricted',
    badge: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
    indicator: 'bg-amber-400',
  },
  error: {
    label: 'Unavailable',
    badge: 'border-red-500/20 bg-red-500/10 text-red-400',
    indicator: 'bg-red-400',
  },
};

const SecurityDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const canViewSystemLogs = Boolean(user?.is_superuser);
  const [logFeedStatus, setLogFeedStatus] = useState('loading');
  const [metrics, setMetrics] = useState({
    identity: 0,
    family: 0,
    work: 0,
    location: 0,
    interests: 0,
    assets: 0,
  });
  const [sideQuestsOpen, setSideQuestsOpen] = useState(() => window.innerWidth >= 1024);

  useEffect(() => {
    const onResize = () => setSideQuestsOpen(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleFormUpdate = useCallback((data) => {
    const countFilled = (keys) => {
      const count = keys.filter((k) => data[k] && data[k].length > 1).length;
      return Math.min(count * 3, 10);
    };

    setMetrics({
      identity: countFilled([
        'full_name',
        'dob',
        'phone_digits',
        'username',
        'email',
        'ssn_last4',
        'blood_type',
        'height',
      ]),
      family: countFilled([
        'spouse_name',
        'child_names',
        'pet_names',
        'mother_maiden',
        'father_name',
        'sibling_names',
        'best_friend',
      ]),
      work: countFilled([
        'company',
        'job_title',
        'university',
        'department',
        'employee_id',
        'boss_name',
        'past_company',
        'degree',
      ]),
      location: countFilled([
        'current_city',
        'hometown',
        'street_name',
        'zip_code',
        'state',
        'country',
        'vacation_spot',
      ]),
      interests: countFilled([
        'sports_team',
        'musician',
        'movies',
        'hobbies',
        'books',
        'games',
        'food',
      ]),
      assets: countFilled([
        'car_model',
        'brand_affinity',
        'license_plate',
        'bank_name',
        'device_type',
        'crypto_wallet',
        'subscription',
      ]),
    });
  }, []);

  const filledCategoriesCount = useMemo(
    () => Object.values(metrics).filter((v) => v > 0).length,
    [metrics],
  );
  const totalCompletenessScore = useMemo(
    () => Math.round((Object.values(metrics).reduce((a, b) => a + b, 0) / 60) * 100) || 0,
    [metrics],
  );
  const effectiveLogFeedStatus = canViewSystemLogs ? logFeedStatus : 'permission';
  const logFeedPresentation = observabilityPresentation[effectiveLogFeedStatus];

  return (
    <DesignAppShell activeKey="mission">
      <div className="mx-auto flex max-w-[1800px] flex-col">
        {/* Header Strip */}
        <header className="mb-4 flex shrink-0 flex-col items-start justify-between gap-4 border-b border-white/10 pb-3 md:mb-6 md:flex-row md:items-end md:gap-6 md:pb-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-security-red/20 blur-xl"></div>
              <ShieldAlert className="relative z-10 h-8 w-8 text-security-red md:h-10 md:w-10" />
            </div>
            <div>
              <h1 className="m-0 font-display text-xl font-bold uppercase leading-none tracking-[0.15em] text-white md:text-2xl lg:text-3xl">
                TACTICAL DASHBOARD
              </h1>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-gray-500 md:text-[10px]">
                Intelligence Generation Interface
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-6 font-mono text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-3">
              <span className="text-gray-500">Audit Feed</span>
              <span
                className={`flex items-center gap-2 rounded border px-3 py-1 ${logFeedPresentation.badge}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${logFeedPresentation.indicator}`} />
                {logFeedPresentation.label}
              </span>
            </div>
          </div>
        </header>

        {/* Main Layout: centered Target Acquisition + collapsible side quests */}
        <div className="responsive-dashboard-height flex min-h-0 flex-1 gap-4">
          {/* CENTER: Target Acquisition — main mission */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="sec-card relative flex min-h-[400px] flex-1 flex-col overflow-hidden shadow-2xl">
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-black/60 px-5 py-4">
                <div className="flex items-center gap-2 text-white">
                  <Crosshair className="h-4 w-4 text-security-red" />
                  <span className="font-display text-xs font-bold uppercase tracking-widest">
                    Target Acquisition
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-gray-500">
                    Confidence: {filledCategoriesCount}/6
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <TargetForm onFormUpdate={handleFormUpdate} />
              </div>
            </div>

            {/* System Logs — full width under Target Acquisition */}
            <div className="sec-card flex h-[180px] shrink-0 flex-col overflow-hidden shadow-2xl">
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-black/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-display text-[10px] font-bold uppercase tracking-widest text-white">
                    System Logs
                  </span>
                </div>
                <span className="font-mono text-[8px] uppercase tracking-widest text-zinc-600">
                  Server-sourced only
                </span>
              </div>
              <div className="relative flex-1 overflow-hidden bg-black/80 p-3">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px]"></div>
                <SystemLogs enabled={canViewSystemLogs} onStatusChange={setLogFeedStatus} />
              </div>
            </div>
          </div>

          {/* RIGHT: Side Quests panel (collapsible) */}
          <div
            className={`flex shrink-0 flex-col transition-all duration-300 ${sideQuestsOpen ? 'w-[340px] xl:w-[380px]' : 'w-10'}`}
          >
            {/* Toggle tab */}
            <button
              onClick={() => setSideQuestsOpen((v) => !v)}
              className="group mb-3 flex items-center gap-2"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <div className="flex items-center gap-2 rounded border border-white/10 bg-black/40 px-2 py-1.5 transition-colors hover:border-security-red/40">
                {sideQuestsOpen ? (
                  <ChevronRight className="h-3 w-3 text-gray-500 transition-colors group-hover:text-security-red" />
                ) : (
                  <ChevronLeft className="h-3 w-3 text-gray-500 transition-colors group-hover:text-security-red" />
                )}
                {!sideQuestsOpen && (
                  <span className="mt-1 rotate-180 font-mono text-[8px] uppercase tracking-widest text-yellow-500/60 [writing-mode:vertical-rl]">
                    Side Quests
                  </span>
                )}
              </div>
              {sideQuestsOpen && (
                <span className="font-mono text-[8px] uppercase tracking-widest text-yellow-500/60">
                  ◆ Side Quests
                </span>
              )}
            </button>

            {sideQuestsOpen && (
              <div className="flex min-h-0 flex-1 flex-col gap-4">
                {/* Geospatial Routing */}
                <div className="sec-card relative flex min-h-[240px] flex-1 flex-col overflow-hidden shadow-2xl">
                  <div className="z-20 flex shrink-0 items-center justify-between border-b border-white/10 bg-black/60 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-3.5 w-3.5 text-security-red" />
                      <span className="font-display text-[10px] font-bold uppercase tracking-widest text-white">
                        Geospatial Routing
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-security-red"></span>
                    </div>
                  </div>
                  <div className="relative flex-1 cursor-move">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(225,29,72,0.05),transparent)]"></div>
                    <Suspense
                      fallback={
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-security-red border-t-transparent"></div>
                          <div className="font-mono text-[9px] uppercase tracking-widest text-gray-500">
                            Initializing Map...
                          </div>
                        </div>
                      }
                    >
                      <GlobalMap />
                    </Suspense>
                  </div>
                </div>

                {/* Profiling Matrix */}
                <div className="sec-card group relative flex min-h-[240px] flex-1 flex-col overflow-hidden shadow-2xl">
                  <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-black/60 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5 text-security-red" />
                      <span className="font-display text-[10px] font-bold uppercase tracking-widest text-white">
                        Profiling Matrix
                      </span>
                    </div>
                    <div className="font-mono text-[10px] uppercase text-white/50">
                      Score: <span className="font-bold text-white">{totalCompletenessScore}%</span>
                    </div>
                  </div>
                  <div className="relative z-10 flex flex-1 items-center justify-center p-4">
                    <RiskRadar inputData={metrics} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DesignAppShell>
  );
};

export default SecurityDashboardPage;
