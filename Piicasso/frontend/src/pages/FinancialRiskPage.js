import React, { useContext, useState, useEffect } from 'react';
import { ModeContext } from "../context/ModeContext";
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { ShieldAlert, AlertOctagon, Euro, DollarSign, TrendingUp, Activity } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const FinancialRiskPage = () => {
    // Simulated risk data
    const [riskMetrics, setRiskMetrics] = useState({
        totalExposure: 2450000,
        gdprFines: 1800000,
        ccpaFines: 450000,
        remediationCost: 200000,
        breachProbability: 78
    });
  const { mode: appMode } = useContext(ModeContext) || { mode: 'security' };
  const isSecurityMode = appMode === 'security';

  const theme = {
    bg: isSecurityMode ? 'bg-[#0a0a0a] text-white' : 'bg-[#040B16] text-blue-100',
    accentColor: isSecurityMode ? 'text-red-500' : 'text-blue-400',
    accentBg: isSecurityMode ? 'bg-red-500' : 'bg-blue-600',
    card: isSecurityMode ? 'bg-[#141414] border border-white/10' : 'bg-[#0B162C]/80 backdrop-blur-xl border border-blue-500/10 shadow-2xl',
    btnSecondary: isSecurityMode ? 'bg-[#232323] text-white hover:bg-[#333]' : 'bg-blue-900/20 text-blue-300 hover:bg-blue-800/30 border border-blue-500/20',
    textMuted: isSecurityMode ? 'text-gray-400' : 'text-blue-300/70',
    borderLight: isSecurityMode ? 'border-white/5' : 'border-blue-500/10',
    highlight: isSecurityMode ? 'text-white' : 'text-white',
  };


    const [isCalculating, setIsCalculating] = useState(true);

    useEffect(() => {
        setTimeout(() => setIsCalculating(false), 1500);
    }, []);

    const barData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Projected Compliance Fines (USD)',
                data: [1.2, 1.4, 1.1, 1.8, 2.1, 2.45],
                backgroundColor: isSecurityMode ? 'rgba(229, 9, 20, 0.7)' : 'rgba(59, 130, 246, 0.7)',
                borderColor: isSecurityMode ? '#e50914' : '#3b82f6',
                borderWidth: 1,
            }
        ],
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: isSecurityMode ? 'rgba(20,20,20,0.9)' : 'rgba(11,22,44,0.9)' }
        },
        scales: {
            y: {
                grid: { color: isSecurityMode ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.05)' },
                ticks: { color: isSecurityMode ? '#b3b3b3' : '#93c5fd', callback: (value) => `$${value}M` }
            },
            x: {
                grid: { display: false },
                ticks: { color: isSecurityMode ? '#b3b3b3' : '#93c5fd', font: { family: 'sans-serif' } }
            }
        }
    };

    const doughnutData = {
        labels: ['Employee Identities', 'Customer Data', 'Intellectual Property', 'Financial Info'],
        datasets: [
            {
                data: [35, 45, 10, 10],
                backgroundColor: isSecurityMode ? [
                    '#e50914',
                    '#f59e0b',
                    '#3b82f6',
                    '#10b981'
                ] : [
                    '#3b82f6',
                    '#60a5fa',
                    '#93c5fd',
                    '#bfdbfe'
                ],
                borderColor: isSecurityMode ? '#181818' : '#0B162C',
                borderWidth: 2,
            },
        ],
    };

    const doughnutOptions = {
        cutout: '75%',
        plugins: {
            legend: {
                position: 'right',
                labels: { color: isSecurityMode ? '#b3b3b3' : '#93c5fd', font: { family: 'sans-serif', size: 12 } }
            }
        },
        maintainAspectRatio: false,
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
    };

    return (
        <div className={`${theme.bg} min-h-screen font-sans flex flex-col transition-colors duration-300`}>
            {!isSecurityMode && (
                <>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
                </>
            )}
            <Navbar />
            <div className="relative z-10 pt-24 px-4 md:px-8 pb-8 flex-1 w-full max-w-7xl mx-auto flex flex-col gap-6">
                
                {/* Header */}
                <div className={`flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b ${theme.borderLight} pb-4`}>
                    <div>
                        <div className={`flex items-center gap-3 ${theme.accentColor} mb-2`}>
                            <ShieldAlert className="w-6 h-6 animate-pulse" />
                            <h1 className="text-xl md:text-3xl font-bold tracking-wider">FINANCIAL RISK <span className={theme.highlight}>COMMAND</span></h1>
                        </div>
                        <p className={`${theme.textMuted} text-sm max-w-xl`}>
                            Continuous Threat Exposure Management (CTEM). Analyzing real-time monetary impact of currently exposed identity vectors and potential regulatory violations.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => {setIsCalculating(true); setTimeout(() => setIsCalculating(false), 1500)}} className={`${theme.btnSecondary} font-bold rounded-lg px-4 py-2 transition-all text-xs flex items-center gap-2`}>
                            <Activity className={`w-4 h-4 ${theme.accentColor}`} />
                            RECALCULATE
                        </button>
                    </div>
                </div>

                {isCalculating ? (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                        <div className={`w-16 h-16 border-t-2 ${isSecurityMode ? 'border-red-500' : 'border-blue-500'} border-solid rounded-full animate-spin`}></div>
                        <div className={`mt-6 ${theme.accentColor} text-sm tracking-widest animate-pulse font-bold`}>QUANTIFYING LIABILITY VECTORS...</div>
                    </div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6"
                    >
                        {/* Left Column: Key Stats */}
                        <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
                            <div className={`${theme.card} rounded-2xl p-6 relative overflow-hidden group`}>
                                <div className={`absolute top-0 right-0 w-32 h-32 ${isSecurityMode ? 'bg-red-500/5' : 'bg-blue-500/10'} rounded-full blur-3xl pointer-events-none`} />
                                <h3 className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2`}>Total Projected Exposure</h3>
                                <div className={`text-4xl font-black ${theme.highlight} tracking-tight mb-5`}>
                                    {formatCurrency(riskMetrics.totalExposure)}
                                </div>
                                <div className={`flex items-center gap-2 text-xs font-bold ${theme.accentColor} ${isSecurityMode ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'} p-2 rounded-lg border w-fit`}>
                                    <TrendingUp className="w-4 h-4" /> +14.2% since last scan
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className={`${theme.card} rounded-xl p-5`}>
                                    <h3 className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-3 flex items-center gap-2`}><Euro className="w-4 h-4"/> GDPR Risk</h3>
                                    <div className={`text-xl font-black ${theme.highlight}`}>{formatCurrency(riskMetrics.gdprFines)}</div>
                                </div>
                                <div className={`${theme.card} rounded-xl p-5`}>
                                    <h3 className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-3 flex items-center gap-2`}><DollarSign className="w-4 h-4"/> CCPA Risk</h3>
                                    <div className={`text-xl font-black ${theme.highlight}`}>{formatCurrency(riskMetrics.ccpaFines)}</div>
                                </div>
                            </div>

                            <div className={`${theme.card} rounded-2xl p-6 flex-1 flex flex-col justify-center items-center`}>
                                <div className="relative w-36 h-36 flex items-center justify-center mb-2">
                                    <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                        <circle cx="72" cy="72" r="64" stroke={isSecurityMode ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.1)'} strokeWidth="12" fill="none" />
                                        <circle cx="72" cy="72" r="64" stroke={isSecurityMode ? '#e50914' : '#3b82f6'} strokeWidth="12" fill="none" strokeDasharray="402" strokeDashoffset={402 - (402 * riskMetrics.breachProbability) / 100} className="transition-all duration-1000" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className={`text-4xl font-black ${theme.highlight}`}>{riskMetrics.breachProbability}%</span>
                                    </div>
                                </div>
                                <h3 className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mt-4`}>Critical Breach Probability</h3>
                            </div>
                        </div>

                        {/* Middle/Right Column: Charts */}
                        <div className="col-span-1 md:col-span-8 flex flex-col gap-6">
                            <div className={`${theme.card} rounded-2xl p-6 h-80`}>
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className={`text-sm font-bold ${theme.highlight} uppercase tracking-widest`}>Exposure Trajectory (6 Months)</h3>
                                    <span className={`px-3 py-1 ${isSecurityMode ? 'bg-red-500/20 border-red-500/30 text-red-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'} text-xs font-bold rounded-lg border`}>SEVERITY: HIGH</span>
                                </div>
                                <div className="h-[220px] w-full">
                                    <Bar data={barData} options={barOptions} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                                <div className={`${theme.card} rounded-2xl p-6 flex flex-col`}>
                                    <h3 className={`text-sm font-bold ${theme.highlight} uppercase tracking-widest mb-6`}>Liability Distribution</h3>
                                    <div className="flex-1 min-h-[160px]">
                                        <Doughnut data={doughnutData} options={doughnutOptions} />
                                    </div>
                                </div>
                                <div className={`${theme.card} rounded-2xl p-6 overflow-hidden relative`}>
                                    <div className={`absolute inset-0 ${isSecurityMode ? 'bg-red-500/5' : 'bg-blue-500/5'} z-0`} />
                                    <div className="relative z-10 flex flex-col h-full">
                                        <h3 className={`text-sm font-bold ${theme.accentColor} uppercase tracking-widest mb-5 flex items-center gap-2`}>
                                            <AlertOctagon className="w-5 h-5" /> Actionable Recommendations
                                        </h3>
                                        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                            <div className={`p-4 ${isSecurityMode ? 'bg-[#0a0a0a]' : 'bg-[#040B16]/80'} border ${isSecurityMode ? 'border-red-500/30' : 'border-blue-500/30'} rounded-xl text-sm shadow-sm`}>
                                                <div className={`${theme.accentColor} font-bold mb-1.5`}>Enforce Mandatory 2FA</div>
                                                <div className={theme.textMuted}>Prevents 85% of credential stuffing liability.</div>
                                            </div>
                                            <div className={`p-4 ${isSecurityMode ? 'bg-[#0a0a0a]' : 'bg-[#040B16]/80'} border border-orange-500/30 rounded-xl text-sm shadow-sm`}>
                                                <div className="text-orange-500 font-bold mb-1.5">Purge Orphaned AWS Keys</div>
                                                <div className={theme.textMuted}>3 keys detected in public repositories. Potential cost: $120k.</div>
                                            </div>
                                            <div className={`p-4 ${isSecurityMode ? 'bg-[#0a0a0a] border-[#333]' : 'bg-[#040B16]/80 border-blue-500/10'} rounded-xl text-sm shadow-sm`}>
                                                <div className={`${theme.highlight} font-bold mb-1.5`}>Rotate Service Accounts</div>
                                                <div className={theme.textMuted}>12 accounts older than 90 days.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default FinancialRiskPage;