import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Eye, Download } from 'lucide-react';

const ContentRow = ({ title, items, onSelect }) => {
    const rowRef = useRef(null);
    const [isMoved, setIsMoved] = useState(false);

    const handleClick = (direction) => {
        setIsMoved(true);
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo = direction === 'left'
                ? scrollLeft - clientWidth / 2
                : scrollLeft + clientWidth / 2;

            rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <div className="py-4 md:py-8 pl-4 md:pl-12 group">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 hover:text-netflix-red transition-colors cursor-pointer flex items-center gap-2">
                {title}
                <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-netflix-red" />
            </h2>

            <div className="relative group/row">
                <ChevronLeft
                    className={`absolute left-0 top-0 bottom-0 z-40 m-auto h-full w-12 cursor-pointer opacity-0 group-hover/row:opacity-100 bg-black/50 hover:bg-black/80 transition-all ${!isMoved && 'hidden'}`}
                    onClick={() => handleClick('left')}
                />

                <div
                    ref={rowRef}
                    className="flex items-center gap-2 overflow-x-scroll scrollbar-hide space-x-2 md:space-x-4 pr-12"
                >
                    {items.map((item, index) => (
                        <motion.div
                            key={index}
                            className="relative min-w-[200px] md:min-w-[280px] h-[140px] md:h-[160px] bg-zinc-800 rounded overflow-hidden cursor-pointer hover:z-50 transition-all duration-300"
                            whileHover={{ scale: 1.1, translateY: -10 }}
                            onClick={() => onSelect(item)}
                        >
                            {/* Content Thumbnail - Digital Asset Style */}
                            <div className="w-full h-full bg-zinc-900 border border-zinc-700 p-4 flex flex-col justify-between group-hover:border-netflix-red transition-colors relative">
                                <div className="absolute top-2 right-2 opacity-50">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                </div>

                                <div>
                                    <div className="text-xs text-green-500 font-mono mb-1 flex items-center gap-2">
                                        <span className="bg-zinc-800 px-1 rounded text-[10px] text-gray-400">INFO</span>
                                        {item.ip_address}
                                    </div>
                                    <div className="text-lg font-bold truncate text-white tracking-wide">{item.pii_data?.name || "Unknown Name"}</div>
                                    <div className="text-xs text-gray-400">Created: {new Date(item.timestamp).toLocaleDateString()}</div>
                                </div>

                                <div className="flex justify-between items-end border-t border-zinc-700 pt-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-500 uppercase">Output</span>
                                        <span className="text-xs font-mono text-white">WORDLIST.TXT</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold text-gray-300">
                                        {item.wordlist?.length || 0} ENTRIES
                                    </div>
                                </div>
                            </div>

                            {/* Hover Reveal Details - Action Focused */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                                className="absolute inset-0 bg-black/95 p-4 flex flex-col items-center justify-center gap-4 border-2 border-netflix-red"
                            >
                                <div className="text-center">
                                    <div className="text-xs text-gray-400 mb-1">SCORE</div>
                                    <div className="text-2xl font-bold text-green-500">High</div>
                                </div>

                                <div className="flex gap-3 w-full justify-center">
                                    <button className="flex-1 bg-white text-black py-1.5 rounded font-bold text-xs hover:bg-gray-200 flex items-center justify-center gap-1">
                                        <Eye className="w-3 h-3" /> VIEW
                                    </button>
                                    <button className="flex-1 border border-gray-400 text-white py-1.5 rounded font-bold text-xs hover:border-white flex items-center justify-center gap-1">
                                        <Download className="w-3 h-3" /> .TXT
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>

                <ChevronRight
                    className="absolute right-0 top-0 bottom-0 z-40 m-auto h-full w-12 cursor-pointer opacity-0 group-hover/row:opacity-100 bg-black/50 hover:bg-black/80 transition-all"
                    onClick={() => handleClick('right')}
                />
            </div>
        </div>
    );
};

export default ContentRow;
