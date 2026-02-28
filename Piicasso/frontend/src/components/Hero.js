import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Info } from 'lucide-react';

const Hero = () => {
    const navigate = useNavigate();

    return (
        <div className="relative h-[85vh] w-full overflow-hidden">
            {/* Background Media */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent z-10" />
                {/* Replace with actual video or high-res abstract tech image */}
                <img
                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
                    alt="Cyber Security Background"
                    className="w-full h-full object-cover opacity-60"
                />
            </div>

            {/* Content */}
            <div className="relative z-20 h-full flex flex-col justify-center px-4 md:px-16 max-w-4xl pt-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-6xl md:text-8xl font-heading font-bold mb-4 leading-tight drop-shadow-lg">
                        TARGET <br /> <span className="text-netflix-red">PROFILING</span>
                    </h1>

                    <div className="flex items-center gap-4 text-gray-300 text-sm md:text-base font-medium mb-6">
                        <span className="border border-gray-500 px-2 py-0.5 text-xs">v2.4.0</span>
                        <span className="text-green-400">AI-Powered</span>
                        <span>OSINT</span>
                        <span className="border border-gray-500 px-2 py-0.5 text-xs">SECURE</span>
                    </div>

                    <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl drop-shadow-md leading-relaxed">
                        Advanced PII processing engine for generating intelligent, high-probability password wordlists.
                        Analyze targets, map relationships, and predict credentials with precision.
                    </p>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/generate')}
                            className="netflix-btn-primary group"
                        >
                            <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
                            <span>Initialize Target</span>
                        </button>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="netflix-btn-secondary"
                        >
                            <Info className="w-6 h-6" />
                            <span>View History</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Hero;
