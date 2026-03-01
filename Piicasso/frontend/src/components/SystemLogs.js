import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';

const SystemLogs = () => {
    const [logs, setLogs] = useState([]);

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
        const interval = setInterval(fetchLogs, 2000); // Poll every 2 seconds

        return () => clearInterval(interval);
    }, []);

    // Auto-scroll? The original didn't seem to have auto-scroll explicitly, just overflow-hidden.
    // But usually logs scroll. The previous one just updated the list.

    return (
        <div className="font-mono text-[10px] md:text-xs h-full flex flex-col">
            <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-[#141414] to-transparent z-10" />
                <div className="space-y-1 p-2">
                    {logs.map((log, i) => (
                        <div key={i} className="flex gap-2 opacity-80 hover:opacity-100 transition-opacity">
                            <span className="text-gray-600">[{log.timestamp}]</span>
                            <span className={`w-12 font-bold ${log.level === 'CRITICAL' ? 'text-red-600 animate-pulse' :
                                log.level === 'ERROR' ? 'text-red-500' :
                                    log.level === 'WARNING' ? 'text-yellow-500' :
                                        log.level === 'SUCCESS' ? 'text-green-500' :
                                            'text-blue-500'
                                }`}>{log.level}</span>
                            <span className="text-gray-300 truncate font-mono">[{log.source}] {log.message}</span>
                        </div>
                    ))}
                </div>
                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#141414] to-transparent z-10" />
            </div>
        </div>
    );
};

export default SystemLogs;
