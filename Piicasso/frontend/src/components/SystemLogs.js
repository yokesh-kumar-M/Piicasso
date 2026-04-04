import React, { useEffect, useState, useRef } from 'react';
import axiosInstance from '../api/axios';

const SystemLogs = () => {
    const [logs, setLogs] = useState([]);
    const [simulatedLogs, setSimulatedLogs] = useState([]);
    const logsEndRef = useRef(null);

    // Initial fetch of real logs
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await axiosInstance.get('logs/');
                setLogs(res.data);
            } catch (err) {
                console.error("Failed to fetch system logs", err);
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 15000);
        return () => clearInterval(interval);
    }, []);

    // Simulate high-frequency "background noise" to make it look alive
    useEffect(() => {
        const noiseSources = ['NET', 'AUTH', 'SYS', 'MEM', 'KERN', 'SEC'];
        const noiseMessages = [
            'Packet inspection complete', 'Buffer allocation OK',
            'Synchronizing telemetry...', 'Handshake established',
            'Scanning memory banks', 'Routing protocol updated',
            'Firewall rule verified', 'Token rotation cycle'
        ];

        const interval = setInterval(() => {
            const newLog = {
                timestamp: new Date().toISOString().split('T')[1].substring(0, 12),
                level: 'INFO',
                source: noiseSources[Math.floor(Math.random() * noiseSources.length)],
                message: noiseMessages[Math.floor(Math.random() * noiseMessages.length)],
                isSimulated: true
            };
            
            setSimulatedLogs(prev => {
                const combined = [...prev, newLog];
                return combined.slice(-20); // Keep last 20 simulated logs
            });
        }, 1800 + Math.random() * 2000);

        return () => clearInterval(interval);
    }, []);

    // Combine and sort logs, then keep last 50
    const displayLogs = [...logs, ...simulatedLogs]
        .sort((a, b) => a.timestamp > b.timestamp ? 1 : -1)
        .slice(-50);

    // Auto-scroll
    useEffect(() => {
        if (logsEndRef.current && logsEndRef.current.parentNode) {
            logsEndRef.current.parentNode.scrollTop = logsEndRef.current.parentNode.scrollHeight;
        }
    }, [displayLogs]);

    return (
        <div className="font-mono text-[10px] md:text-xs h-full flex flex-col relative bg-black/40 border border-zinc-900/50 rounded-sm overflow-hidden group">
            {/* Matrix rain / scanning line overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20 pointer-events-none z-0">
                <div className="w-full h-2 bg-green-500/20 absolute top-0 animate-[scan_3s_ease-in-out_infinite]" />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-2">
                <div className="space-y-1">
                    {displayLogs.map((log, i) => (
                        <div key={i} className={`flex gap-2 transition-opacity ${log.isSimulated ? 'opacity-40 hover:opacity-70' : 'opacity-90 hover:opacity-100'}`}>
                            <span className="text-zinc-600 shrink-0">[{log.timestamp}]</span>
                            <span className={`w-12 shrink-0 font-bold ${log.level === 'CRITICAL' ? 'text-red-600 animate-pulse' :
                                log.level === 'ERROR' ? 'text-neon-green' :
                                    log.level === 'WARNING' ? 'text-yellow-500' :
                                        log.level === 'SUCCESS' ? 'text-green-500' :
                                            log.isSimulated ? 'text-zinc-500' : 'text-blue-500'
                                }`}>{log.level}</span>
                            <span className={`${log.isSimulated ? 'text-zinc-500' : 'text-gray-300'} truncate font-mono`}>[{log.source}] {log.message}</span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes scan {
                    0% { top: -10%; }
                    100% { top: 110%; }
                }
            `}} />
        </div>
    );
};

export default SystemLogs;
