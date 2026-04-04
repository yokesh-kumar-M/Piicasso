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
        Math.max(0, Math.min(10, (scores.identity || 2))),
        Math.max(0, Math.min(10, (scores.family || 1))),
        Math.max(0, Math.min(10, (scores.work || 1))),
        Math.max(0, Math.min(10, (scores.location || 1))),
        Math.max(0, Math.min(10, (scores.interests || 1))),
        Math.max(0, Math.min(10, (scores.assets || 1)))
    ], [scores]);

    const data = {
        labels: ['IDENTITY', 'FAMILY', 'WORK', 'LOCATION', 'INTERESTS', 'ASSETS'],
        datasets: [
            {
                label: 'DATA COMPLETENESS',
                data: dataValues,
                backgroundColor: 'rgba(0, 255, 0, 0.2)', // Neon green with opacity
                borderColor: '#00FF00',
                borderWidth: 2,
                pointBackgroundColor: '#00FF00',
                pointBorderColor: '#121212',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#00FF00',
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.1
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
                    color: 'rgba(255, 255, 255, 0.1)',
                    lineWidth: 1,
                },
                angleLines: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                pointLabels: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: {
                        family: 'Inter, sans-serif',
                        size: 10,
                        weight: '600'
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
                backgroundColor: '#1E1E1E',
                titleFont: { family: 'Inter, sans-serif' },
                bodyFont: { family: 'Inter, sans-serif' },
                displayColors: false,
                borderColor: '#00FF00',
                borderWidth: 1
            }
        },
        animation: {
            duration: 800,
            easing: 'easeOutQuart'
        },
        responsive: true,
        maintainAspectRatio: false,
    };

    return (
        <div className="w-full h-full max-h-[300px] relative mt-2 flex items-center justify-center p-4">
            <Radar data={data} options={options} />
        </div>
    );
};

export default RiskRadar;
