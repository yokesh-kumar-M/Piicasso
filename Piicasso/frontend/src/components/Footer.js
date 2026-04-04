import React, { useContext } from 'react';
import { ModeContext } from '../context/ModeContext';

const Footer = () => {
    const { mode } = useContext(ModeContext);

    return (
        <footer className={`border-t py-4 mt-auto transition-colors duration-300 ${mode === 'user' ? 'bg-[#050a05] border-green-900/50' : 'bg-zinc-950 border-zinc-900'}`}>
            <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center">
                <div className={`text-[10px] font-mono tracking-widest uppercase sequence-pulse ${mode === 'user' ? 'text-neon-green/70' : 'text-zinc-500'}`}>
                    {mode === 'user' ? 'Personal Security Shield • V4.0.0' : 'Wordlist Generation System • V2.5.1'}
                </div>
                <p className={`text-[10px] font-mono tracking-wider mt-1 ${mode === 'user' ? 'text-neon-green/50' : 'text-zinc-600'}`}>
                    &copy; {new Date().getFullYear()} PIIcasso
                </p>
            </div>
        </footer>
    );
};

export default Footer;
