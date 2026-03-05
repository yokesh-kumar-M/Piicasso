import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Aesthetic title update on load
        document.title = "404 | PIIcasso - Sector Not Found";
    }, []);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden font-mono">
            {/* Background grid / noise effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20"></div>

            <div className="z-10 text-center max-w-2xl mx-auto flex flex-col items-center">
                <div className="relative mb-8 group cursor-default">
                    <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-600 to-red-900 tracking-tighter drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                        404
                    </h1>
                    {/* Glitch layers */}
                    <h1 className="absolute top-0 left-[2px] text-8xl md:text-9xl font-black text-cyan-500 opacity-50 mix-blend-screen group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300 pointer-events-none tracking-tighter">
                        404
                    </h1>
                    <h1 className="absolute top-0 -left-[2px] text-8xl md:text-9xl font-black text-red-500 opacity-50 mix-blend-screen group-hover:-translate-x-1 group-hover:translate-y-1 transition-transform duration-300 pointer-events-none tracking-tighter">
                        404
                    </h1>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-gray-200 uppercase tracking-widest mb-4 border-b border-red-900/50 pb-4 inline-block">
                    Sector Not Found
                </h2>

                <p className="text-gray-400 text-lg mb-8 leading-relaxed max-w-lg mx-auto">
                    The intelligence you are looking for has been purged, relocated, or never existed in this sector. Surveillance systems indicate an invalid trajectory.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-2">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-8 py-3 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 hover:border-red-500 transition-all duration-300 uppercase tracking-widest text-sm font-semibold shadow-[0_0_15px_rgba(220,38,38,0.1)] hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] backdrop-blur-sm"
                    >
                        [ Return to Command ]
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="px-8 py-3 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 hover:border-white/30 transition-all duration-300 uppercase tracking-widest text-sm font-semibold backdrop-blur-sm"
                    >
                        [ Exit Node ]
                    </button>
                </div>
            </div>

            {/* Simulated terminal lines for aesthetic */}
            <div className="absolute bottom-6 left-6 font-mono text-xs text-red-900/60 opacity-60 items-start hidden md:flex flex-col tracking-widest space-y-1">
                <span>&gt; ERROR_CODE: 0x0000404</span>
                <span>&gt; TRACE_ROUTE: FAILED</span>
                <span>&gt; SECURE_CONNECTION... TERMINATED</span>
            </div>

            <div className="absolute top-6 right-6 font-mono text-xs text-red-900/60 opacity-60 hidden md:block tracking-widest">
                SYS.ERR.LOG
            </div>
        </div>
    );
};

export default NotFoundPage;
