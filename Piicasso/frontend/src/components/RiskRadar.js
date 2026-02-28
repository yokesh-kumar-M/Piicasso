import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { motion } from 'framer-motion';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

const RiskRadar = ({ inputData }) => {
    const scores = inputData || {};

    const dataValues = useMemo(() => [
        scores.identity || 2,
        scores.family || 1,
        scores.work || 1,
        scores.location || 1,
        scores.interests || 1,
        scores.assets || 1
    ], [scores]);

    const data = {
        labels: ['IDENTITY', 'FAMILY', 'WORK', 'LOCATION', 'INTERESTS', 'ASSETS'],
        datasets: [
            {
                label: 'DATA COMPLETENESS',
                data: dataValues,
                backgroundColor: 'rgba(239, 68, 68, 0.25)', // Red-500 with low opacity
                borderColor: '#ef4444',
                borderWidth: 2,
                pointBackgroundColor: '#ef4444',
                pointBorderColor: '#000',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#ef4444',
                pointRadius: 3,
                pointHoverRadius: 6,
                fill: true,
            },
            {
                label: 'BASELINE',
                data: [4, 4, 4, 4, 4, 4],
                backgroundColor: 'transparent',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                borderDash: [5, 5],
                pointRadius: 0,
            },
        ],
    };

    const options = {
        scales: {
            r: {
                min: 0,
                max: 10,
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    lineWidth: 1,
                },
                angleLines: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                pointLabels: {
                    color: '#666',
                    font: {
                        family: 'monospace',
                        size: 9,
                        weight: 'bold'
                    },
                    padding: 10
                },
                ticks: {
                    display: false,
                    stepSize: 2,
                },
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleFont: { family: 'monospace' },
                bodyFont: { family: 'monospace' },
                displayColors: false,
            }
        },
        responsive: true,
        maintainAspectRatio: false,
    };

    return (
        <div className="w-full h-full min-h-[250px] relative mt-2">
            {/* Tactical HUD Elements */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Rotating Scanner Ring */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute w-[80%] h-[80%] border border-dashed border-zinc-800/50 rounded-full"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute w-[60%] h-[60%] border border-zinc-800/30 rounded-full"
                />

                {/* Radial Pulse */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute w-[40%] h-[40%] bg-red-500/5 rounded-full blur-xl"
                />

                {/* Crosshairs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-4 bg-zinc-800" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-4 bg-zinc-800" />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-[1px] bg-zinc-800" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-[1px] bg-zinc-800" />
            </div>

            <Radar data={data} options={options} />

            {/* Status indicators */}
            <div className="absolute -bottom-2 left-0 w-full flex justify-between px-2 text-[8px] font-mono text-zinc-600">
                <span>RNG: 50km</span>
                <span className="text-red-500 animate-pulse">ACTIVE</span>
            </div>
        </div>
    );
};

export default RiskRadar;
