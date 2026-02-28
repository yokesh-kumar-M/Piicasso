import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-zinc-950 border-t border-zinc-900 py-4 mt-auto">
            <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center">
                <div className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase sequence-pulse">
                    Wordlist Generation System • V2.5.1
                </div>
                <p className="text-[10px] font-mono text-zinc-600 tracking-wider mt-1">
                    &copy; {new Date().getFullYear()} PIIcasso
                </p>
            </div>
        </footer>
    );
};

export default Footer;
