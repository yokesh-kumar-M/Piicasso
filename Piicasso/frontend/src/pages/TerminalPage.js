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
    <div className="flex min-h-screen w-full flex-col bg-transparent">
      {/* Top strip */}
      <header
        className={`border-b px-4 pb-4 pt-24 md:px-10 md:pt-28 lg:px-16 ${accentBorder} transition-colors duration-300`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TerminalSquare className={`h-6 w-6 transition-colors duration-300 ${accent}`} />
            <div>
              <h1 className="font-mono text-lg font-bold uppercase tracking-widest text-white md:text-xl">
                PIIcasso Terminal
              </h1>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-gray-500 md:text-xs">
                Interactive shell // mode:{' '}
                <span className={`transition-colors duration-300 ${accent}`}>{mode}</span>
              </p>
            </div>
          </div>

          <Link
            to="/"
            className={`flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-gray-400 transition-colors duration-300 hover:text-white md:text-sm`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">back to home</span>
          </Link>
        </div>
      </header>

      {/* Terminal pane */}
      <main className="w-full flex-1 px-4 py-6 md:px-10 md:py-8 lg:px-16">
        <div className="mx-auto h-[70vh] max-w-6xl md:h-[72vh]">
          <Terminal />
        </div>

        {/* Hint strip */}
        <div className="mx-auto mt-4 flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-widest text-gray-500 md:text-xs">
          <span>
            tip: type <span className={accent}>help</span> for commands
          </span>
          <span className="hidden sm:inline">↑ / ↓ command history</span>
          <span className="hidden md:inline">tab autocomplete</span>
          <span className="hidden md:inline">switch user · switch security to flip mode</span>
        </div>
      </main>
    </div>
  );
};

export default TerminalPage;
