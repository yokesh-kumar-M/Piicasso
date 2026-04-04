import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Terminal, ArrowRight, Lock, Key } from 'lucide-react';
import { ModeContext } from '../context/ModeContext';
import Logo from '../components/Logo';

const HomePage = () => {
    const { switchMode } = useContext(ModeContext);
    const navigate = useNavigate();
    const [hoveredSide, setHoveredSide] = useState(null); // 'user' or 'security'

    const handleSelectMode = (selectedMode) => {
        switchMode(selectedMode);
        // After tearing animation starts, navigate
        setTimeout(() => {
            navigate(selectedMode === 'security' ? '/security/dashboard' : '/user/dashboard');
        }, 600);
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black font-sans text-white flex flex-col md:flex-row">
            
            {/* Fixed Logo at Top Center */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                <Logo className="text-4xl md:text-5xl drop-shadow-2xl" />
            </div>

            {/* Left Side: USER MODE (Midnight Cobalt Glass) */}
            <motion.div 
                className="relative w-full md:w-1/2 h-1/2 md:h-full cursor-pointer flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-user-border overflow-hidden"
                onHoverStart={() => setHoveredSide('user')}
                onHoverEnd={() => setHoveredSide(null)}
                onClick={() => handleSelectMode('user')}
                animate={{ 
                    width: hoveredSide === 'user' ? '55%' : hoveredSide === 'security' ? '45%' : '50%',
                    height: hoveredSide === 'user' && window.innerWidth < 768 ? '55%' : hoveredSide === 'security' && window.innerWidth < 768 ? '45%' : '100%'
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            >
                {/* Background with Cobalt Glass effects */}
                <div className="absolute inset-0 bg-cobalt-gradient z-0" />
                
                {/* Glowing Orbs */}
                <motion.div 
                    className="absolute top-1/4 left-1/4 w-64 h-64 bg-user-cobalt/20 rounded-full blur-[100px] pointer-events-none"
                    animate={{ scale: hoveredSide === 'user' ? 1.5 : 1, opacity: hoveredSide === 'user' ? 0.4 : 0.2 }}
                    transition={{ duration: 0.5 }}
                />

                <div className="relative z-10 flex flex-col items-center text-center px-8">
                    <motion.div 
                        className="w-24 h-24 rounded-3xl bg-user-cobalt/10 border border-user-cobalt/30 flex items-center justify-center mb-8 backdrop-blur-xl shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                        animate={{ y: hoveredSide === 'user' ? -10 : 0, boxShadow: hoveredSide === 'user' ? '0 0 50px rgba(59,130,246,0.4)' : '0 0 30px rgba(59,130,246,0.2)' }}
                    >
                        <Shield className="w-12 h-12 text-user-cobalt" />
                    </motion.div>
                    <h2 className="user-heading text-4xl md:text-5xl mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-white">
                        User Mode
                    </h2>
                    <div className="text-user-text-muted max-w-sm text-sm md:text-base leading-relaxed mb-10 font-medium">
                        <motion.ul className="space-y-2 text-left inline-block"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: hoveredSide === 'user' ? 1 : 0.7 }}
                        >
                            <li className="flex items-center gap-2"><Lock className="w-4 h-4 text-user-cobalt" /> Check password health</li>
                            <li className="flex items-center gap-2"><Shield className="w-4 h-4 text-user-cobalt" /> Monitor breaches</li>
                            <li className="flex items-center gap-2"><Key className="w-4 h-4 text-user-cobalt" /> Improve personal security</li>
                        </motion.ul>
                    </div>
                    
                    <motion.button 
                        className="flex items-center gap-3 user-btn-primary px-6 py-3 rounded-full font-bold uppercase tracking-widest text-sm"
                        animate={{ scale: hoveredSide === 'user' ? 1.05 : 1 }}
                    >
                        Enter User Mode <ArrowRight className="w-5 h-5" />
                    </motion.button>
                </div>

                {/* Status Graphic */}
                <motion.div 
                    className="absolute bottom-10 left-10 md:left-auto md:right-10 right-10 flex items-center gap-4 bg-white/5 backdrop-blur-md border border-user-border px-5 py-3 rounded-xl z-10"
                    animate={{ opacity: hoveredSide === 'user' ? 1 : 0.5, y: hoveredSide === 'user' ? -5 : 0 }}
                >
                    <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-user-cobalt/20 border border-user-cobalt/50 flex items-center justify-center"><Key className="w-4 h-4 text-user-cobalt" /></div>
                        <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-400/50 flex items-center justify-center"><Lock className="w-4 h-4 text-green-400" /></div>
                    </div>
                    <div className="text-left">
                        <div className="text-[10px] text-blue-300 uppercase tracking-wider font-bold">System Status</div>
                        <div className="text-xs font-mono text-white">Protected</div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Right Side: SECURITY MODE (Tactical Dark/Red) */}
            <motion.div 
                className="relative w-full md:w-1/2 h-1/2 md:h-full cursor-pointer flex flex-col items-center justify-center overflow-hidden group"
                onHoverStart={() => setHoveredSide('security')}
                onHoverEnd={() => setHoveredSide(null)}
                onClick={() => handleSelectMode('security')}
                animate={{ 
                    width: hoveredSide === 'security' ? '55%' : hoveredSide === 'user' ? '45%' : '50%',
                    height: hoveredSide === 'security' && window.innerWidth < 768 ? '55%' : hoveredSide === 'user' && window.innerWidth < 768 ? '45%' : '100%'
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            >
                {/* Background with Tactical Red/Black effects */}
                <div className="absolute inset-0 bg-tactical-gradient z-0" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 z-0"></div>
                
                {/* Glowing Orbs */}
                <motion.div 
                    className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-security-red/10 rounded-full blur-[120px] pointer-events-none"
                    animate={{ scale: hoveredSide === 'security' ? 1.5 : 1, opacity: hoveredSide === 'security' ? 0.4 : 0.1 }}
                    transition={{ duration: 0.5 }}
                />

                <div className="relative z-10 flex flex-col items-center text-center px-8">
                    <motion.div 
                        className="w-24 h-24 bg-security-surface border border-security-red/30 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(225,29,72,0.15)] transform rotate-45 group-hover:rotate-90 transition-transform duration-700"
                        animate={{ boxShadow: hoveredSide === 'security' ? '0 0 50px rgba(225,29,72,0.3)' : '0 0 30px rgba(225,29,72,0.15)' }}
                    >
                        <div className="-rotate-45 group-hover:-rotate-90 transition-transform duration-700">
                            <Terminal className="w-10 h-10 text-security-red" />
                        </div>
                    </motion.div>
                    <h2 className="security-heading text-4xl md:text-5xl mb-4 text-white drop-shadow-[0_2px_10px_rgba(225,29,72,0.3)]">
                        Security Mode
                    </h2>
                    <div className="text-security-text-muted max-w-sm text-sm md:text-base leading-relaxed mb-10 font-mono">
                        <motion.ul className="space-y-2 text-left inline-block"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: hoveredSide === 'security' ? 1 : 0.7 }}
                        >
                            <li className="flex items-center gap-2"><span className="text-security-red">›</span> Generate intelligence</li>
                            <li className="flex items-center gap-2"><span className="text-security-red">›</span> Run operations</li>
                            <li className="flex items-center gap-2"><span className="text-security-red">›</span> Analyze targets</li>
                        </motion.ul>
                    </div>
                    
                    <motion.button 
                        className="flex items-center gap-3 security-btn-primary px-6 py-3 font-bold uppercase tracking-widest text-sm rounded-none border border-security-red/50"
                        animate={{ scale: hoveredSide === 'security' ? 1.05 : 1 }}
                    >
                        Enter Security Mode <ArrowRight className="w-5 h-5" />
                    </motion.button>
                </div>

                {/* Attack Vector Graphic */}
                <motion.div 
                    className="absolute bottom-10 right-10 md:right-auto md:left-10 left-10 bg-security-surface border border-security-red/30 px-5 py-3 z-10 font-mono text-[10px] md:text-xs text-security-red flex flex-col gap-1 shadow-[0_0_15px_rgba(225,29,72,0.2)]"
                    animate={{ opacity: hoveredSide === 'security' ? 1 : 0.5, y: hoveredSide === 'security' ? -5 : 0 }}
                >
                    <div className="flex justify-between w-40 md:w-48">
                        <span>SYS_STATUS:</span>
                        <span className="text-white">ONLINE</span>
                    </div>
                    <div className="flex justify-between w-40 md:w-48">
                        <span>UPLINK:</span>
                        <span className="text-white">SECURE</span>
                    </div>
                    <div className="w-full h-1 bg-red-900/50 mt-1 overflow-hidden">
                        <motion.div 
                            className="h-full bg-security-red" 
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                </motion.div>
            </motion.div>
            
        </div>
    );
};

export default HomePage;