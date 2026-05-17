import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TerminalSquare } from 'lucide-react';
import Terminal from '../components/Terminal';
import { ModeContext } from '../context/ModeContext';

/**
 * TerminalPage — full-page host for the interactive Terminal.
 *
 * Kept intentionally minimal: a tight header strip and the terminal pane.
 * Background stays transparent so the global body theme bleeds through,
 * giving a different ambient hue per mode while the terminal itself
 * stays black with mode-coloured glow / prompt.
 */
const TerminalPage = () => {
  const { mode } = useContext(ModeContext) || { mode: 'user' };
  const isSecurity = mode === 'security';

  const accent = isSecurity ? 'text-red-500' : 'text-cyan-400';
  const accentBorder = isSecurity ? 'border-red-500/30' : 'border-cyan-500/30';

  return (
    <div className="min-h-screen w-full flex flex-col bg-transparent">
      {/* Top strip */}
      <header className={`pt-24 md:pt-28 px-4 md:px-10 lg:px-16 pb-4 border-b ${accentBorder} transition-colors duration-300`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TerminalSquare className={`w-6 h-6 transition-colors duration-300 ${accent}`} />
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-widest uppercase text-white font-mono">
                PIIcasso Terminal
              </h1>
              <p className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-gray-500 mt-0.5">
                Interactive shell // mode: <span className={`transition-colors duration-300 ${accent}`}>{mode}</span>
              </p>
            </div>
          </div>

          <Link
            to="/"
            className={`flex items-center gap-2 text-xs md:text-sm font-mono uppercase tracking-widest text-gray-400 hover:text-white transition-colors duration-300`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">back to home</span>
          </Link>
        </div>
      </header>

      {/* Terminal pane */}
      <main className="flex-1 w-full px-4 md:px-10 lg:px-16 py-6 md:py-8">
        <div className="max-w-6xl mx-auto h-[70vh] md:h-[72vh]">
          <Terminal />
        </div>

        {/* Hint strip */}
        <div className="max-w-6xl mx-auto mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] md:text-xs font-mono uppercase tracking-widest text-gray-500">
          <span>tip: type <span className={accent}>help</span> for commands</span>
          <span className="hidden sm:inline">↑ / ↓ command history</span>
          <span className="hidden md:inline">tab autocomplete</span>
          <span className="hidden md:inline">switch user · switch security to flip mode</span>
        </div>
      </main>
    </div>
  );
};

export default TerminalPage;
