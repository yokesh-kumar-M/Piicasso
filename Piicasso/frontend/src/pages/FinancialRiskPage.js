import React, { useContext, useState, useEffect, useCallback } from 'react';
import { ModeContext } from '../context/ModeContext';
import { motion } from 'framer-motion';
import DesignAppShell from '../components/design/dashboard/DesignAppShell.jsx';
import axios from '../api/axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    ShieldAlert,
    AlertOctagon,
    Euro,
    DollarSign,
    TrendingUp,
    Activity,
} from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
);

const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(value || 0);

const FinancialRiskPage = () => {
    const { mode: appMode } = useContext(ModeContext) || { mode: 'security' };
    const isSecurityMode = appMode === 'security';

    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchMetrics = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await axios.get('operations/financial-risk/');
            setMetrics(data);
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to load risk telemetry.');
            setMetrics(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    const theme = {
        accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
        card: isSecurityMode ? 'sec-card' : 'usr-card',
        btnSecondary: isSecurityMode
            ? 'bg-security-surface text-white border border-security-border hover:bg-white/5'
            : 'bg-white/5 text-user-text border border-user-border hover:bg-white/10',
        heading: isSecurityMode ? 'security-heading' : 'user-heading',
        textMuted: isSecurityMode ? 'text-gray-500' : 'text-user-text/70',
        borderLight: isSecurityMode ? 'border-security-border/50' : 'border-user-border/50',
        highlight: isSecurityMode ? 'text-white' : 'text-user-text',
    };

    const trajectory = metrics?.trajectory || [];
    const breakdown = metrics?.breakdown || {};
    const recommendations = metrics?.recommendations || [];

    const barData = {
        labels: trajectory.map((t) => t.label),
        datasets: [
            {
                label: 'Projected Compliance Fines (USD millions)',
                data: trajectory.map((t) => t.value),
                backgroundColor: isSecurityMode
                    ? 'rgba(229, 9, 20, 0.7)'
                    : 'rgba(59, 130, 246, 0.7)',
                borderColor: isSecurityMode ? '#e50914' : '#3b82f6',
                borderWidth: 1,
            },
        ],
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: isSecurityMode
                    ? 'rgba(20,20,20,0.9)'
                    : 'rgba(11,22,44,0.9)',
            },
        },
        scales: {
            y: {
                grid: {
                    color: isSecurityMode
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(59,130,246,0.05)',
                },
                ticks: {
                    color: isSecurityMode ? '#b3b3b3' : '#93c5fd',
                    callback: (value) => `$${value}M`,
                },
            },
            x: {
                grid: { display: false },
                ticks: {
                    color: isSecurityMode ? '#b3b3b3' : '#93c5fd',
                    font: { family: 'sans-serif' },
                },
            },
        },
    };

    const doughnutLabels = [
        'Critical Findings',
        'High Risk Findings',
        'Medium Risk Findings',
        'Low Risk Findings',
    ];
    const doughnutValues = [
        breakdown.critical || 0,
        breakdown.high || 0,
        breakdown.medium || 0,
        breakdown.low || 0,
    ];
    const doughnutHasData = doughnutValues.some((v) => v > 0);

    const doughnutData = {
        labels: doughnutLabels,
        datasets: [
            {
                data: doughnutHasData ? doughnutValues : [1, 0, 0, 0],
                backgroundColor: isSecurityMode
                    ? ['#e50914', '#f59e0b', '#3b82f6', '#10b981']
                    : ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
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
                labels: {
                    color: isSecurityMode ? '#b3b3b3' : '#93c5fd',
                    font: { family: 'sans-serif', size: 12 },
                },
            },
        },
        maintainAspectRatio: false,
    };

    const severity = metrics?.severity || 'LOW';
    const severityClass = {
        HIGH: isSecurityMode
            ? 'bg-red-500/20 border-red-500/30 text-red-500'
            : 'bg-red-500/20 border-red-500/30 text-red-400',
        MEDIUM: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        LOW: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    }[severity];

    const breachProbability = metrics?.breach_probability ?? 0;
    const totalExposure = metrics?.total_exposure ?? 0;
    const gdprFines = metrics?.gdpr_fines ?? 0;
    const ccpaFines = metrics?.ccpa_fines ?? 0;

    const recColor = {
        critical: theme.accentColor,
        warning: 'text-orange-500',
        info: theme.highlight,
    };

    return (
        <DesignAppShell>
            <div style={{ paddingTop: 24, paddingBottom: 80, paddingLeft: 16, paddingRight: 16 }}>
                <div style={{ maxWidth: 1400, marginLeft: 'auto', marginRight: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className={`flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b ${theme.borderLight} pb-4`}>
                        <div>
                            <div className={`flex items-center gap-3 ${theme.accentColor} mb-2`}>
                                <ShieldAlert className={`w-6 h-6 ${theme.accentColor} ${isSecurityMode ? 'animate-pulse' : ''}`} />
                                <h1 className={`text-xl md:text-3xl font-bold tracking-wider ${theme.heading}`}>
                                    FINANCIAL RISK <span className={theme.accentColor}>COMMAND</span>
                                </h1>
                            </div>
                            <p className={`${theme.textMuted} text-sm max-w-xl`}>
                                Continuous Threat Exposure Management (CTEM). Estimated monetary impact derived from your password analyses, generation history, and detected breach exposures.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={fetchMetrics}
                                className={`${theme.btnSecondary} font-bold rounded-lg px-4 py-2 transition-all text-xs flex items-center gap-2`}
                            >
                                <Activity className={`w-4 h-4 ${theme.accentColor}`} />
                                RECALCULATE
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                            <div className={`w-16 h-16 border-t-2 ${isSecurityMode ? 'border-red-500' : 'border-blue-500'} border-solid rounded-full animate-spin`}></div>
                            <div className={`mt-6 ${theme.accentColor} text-sm tracking-widest animate-pulse font-bold`}>QUANTIFYING LIABILITY VECTORS...</div>
                        </div>
                    ) : error ? (
                        <div className={`${theme.card} rounded-2xl p-6 text-center`}>
                            <AlertOctagon className={`w-8 h-8 mx-auto mb-3 ${theme.accentColor}`} />
                            <p className={`${theme.highlight} font-bold`}>{error}</p>
                            <button onClick={fetchMetrics} className={`mt-4 ${theme.btnSecondary} font-bold rounded-lg px-4 py-2 text-xs`}>
                                Retry
                            </button>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6"
                        >
                            <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
                                <div className={`${theme.card} rounded-2xl p-6 relative overflow-hidden group`}>
                                    <div className={`absolute top-0 right-0 w-32 h-32 ${isSecurityMode ? 'bg-red-500/5' : 'bg-blue-500/10'} rounded-full blur-3xl pointer-events-none`} />
                                    <h3 className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2`}>Total Projected Exposure</h3>
                                    <div className={`text-4xl font-black ${theme.highlight} tracking-tight mb-5`}>
                                        {formatCurrency(totalExposure)}
                                    </div>
                                    <div className={`flex items-center gap-2 text-xs font-bold ${theme.accentColor} ${isSecurityMode ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'} p-2 rounded-lg border w-fit`}>
                                        <TrendingUp className="w-4 h-4" />
                                        {breakdown.total_analyses
                                            ? `${breakdown.total_analyses} analyses on file`
                                            : 'No analyses yet — run a scan'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`${theme.card} rounded-xl p-5`}>
                                        <h3 className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-3 flex items-center gap-2`}>
                                            <Euro className="w-4 h-4" /> GDPR Risk
                                        </h3>
                                        <div className={`text-xl font-black ${theme.highlight}`}>{formatCurrency(gdprFines)}</div>
                                    </div>
                                    <div className={`${theme.card} rounded-xl p-5`}>
                                        <h3 className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-3 flex items-center gap-2`}>
                                            <DollarSign className="w-4 h-4" /> CCPA Risk
                                        </h3>
                                        <div className={`text-xl font-black ${theme.highlight}`}>{formatCurrency(ccpaFines)}</div>
                                    </div>
                                </div>

                                <div className={`${theme.card} rounded-2xl p-6 flex-1 flex flex-col justify-center items-center`}>
                                    <div className="relative w-36 h-36 flex items-center justify-center mb-2">
                                        <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                            <circle cx="72" cy="72" r="64" stroke={isSecurityMode ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.1)'} strokeWidth="12" fill="none" />
                                            <circle
                                                cx="72"
                                                cy="72"
                                                r="64"
                                                stroke={isSecurityMode ? '#e50914' : '#3b82f6'}
                                                strokeWidth="12"
                                                fill="none"
                                                strokeDasharray="402"
                                                strokeDashoffset={402 - (402 * breachProbability) / 100}
                                                className="transition-all duration-1000"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={`text-4xl font-black ${theme.highlight}`}>{breachProbability}%</span>
                                        </div>
                                    </div>
                                    <h3 className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mt-4`}>Breach Probability</h3>
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-8 flex flex-col gap-6">
                                <div className={`${theme.card} rounded-2xl p-6 h-80`}>
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className={`text-sm font-bold ${theme.highlight} uppercase tracking-widest`}>Exposure Trajectory (6 Months)</h3>
                                        <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${severityClass}`}>
                                            SEVERITY: {severity}
                                        </span>
                                    </div>
                                    <div className="h-[220px] w-full">
                                        <Bar data={barData} options={barOptions} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                                    <div className={`${theme.card} rounded-2xl p-6 flex flex-col`}>
                                        <h3 className={`text-sm font-bold ${theme.highlight} uppercase tracking-widest mb-6`}>Severity Distribution</h3>
                                        <div className="flex-1 min-h-[160px]">
                                            <Doughnut data={doughnutData} options={doughnutOptions} />
                                        </div>
                                        {!doughnutHasData && (
                                            <div className={`text-xs ${theme.textMuted} mt-3 text-center`}>
                                                Run a password analysis to populate the breakdown.
                                            </div>
                                        )}
                                    </div>
                                    <div className={`${theme.card} rounded-2xl p-6 overflow-hidden relative`}>
                                        <div className={`absolute inset-0 ${isSecurityMode ? 'bg-red-500/5' : 'bg-blue-500/5'} z-0`} />
                                        <div className="relative z-10 flex flex-col h-full">
                                            <h3 className={`text-sm font-bold ${theme.accentColor} uppercase tracking-widest mb-5 flex items-center gap-2`}>
                                                <AlertOctagon className="w-5 h-5" /> Actionable Recommendations
                                            </h3>
                                            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                                {recommendations.map((rec, i) => (
                                                    <div
                                                        key={i}
                                                        className={`p-4 ${isSecurityMode ? 'bg-[#0a0a0a]' : 'bg-[#040B16]/80'} border rounded-xl text-sm shadow-sm ${
                                                            rec.level === 'critical'
                                                                ? isSecurityMode
                                                                    ? 'border-red-500/30'
                                                                    : 'border-blue-500/30'
                                                                : rec.level === 'warning'
                                                                    ? 'border-orange-500/30'
                                                                    : isSecurityMode
                                                                        ? 'border-[#333]'
                                                                        : 'border-blue-500/10'
                                                        }`}
                                                    >
                                                        <div className={`${recColor[rec.level] || theme.highlight} font-bold mb-1.5`}>{rec.title}</div>
                                                        <div className={theme.textMuted}>{rec.detail}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </DesignAppShell>
    );
};

export default FinancialRiskPage;
