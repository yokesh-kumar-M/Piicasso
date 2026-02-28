import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WordlistViewer from '../components/WordlistViewer';
import { Download, Terminal, FileText, CheckCircle, ShieldCheck, ArrowRight, Database } from 'lucide-react';

const ResultPage = () => {
  const [wordlist, setWordlist] = useState([]);
  const [historyId, setHistoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = sessionStorage.getItem('generatedWordlist');
    const hid = sessionStorage.getItem('historyId');

    if (raw) {
      try {
        setWordlist(JSON.parse(raw));
      } catch (e) {
        setWordlist([]);
      }
    }
    if (hid) setHistoryId(hid);
    setLoading(false);
  }, []);

  const handleInjectToTerminal = () => {
    // Set flags for KaliTerminal to read
    const filename = `wordlist_${historyId || 'gen'}.txt`;
    sessionStorage.setItem('terminal_inject_filename', filename);
    sessionStorage.setItem('terminal_inject_count', wordlist.length);
    navigate('/operation');
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([wordlist.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wordlist_${historyId || 'generated'}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center font-mono text-green-500 animate-pulse">
      [ SYSTEM ] Loading Results...
    </div>
  );

  if (!wordlist || wordlist.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-[#0b0b0b]">
        <div className="text-red-500 mb-4 text-xl font-mono">ERROR: NO DATA GENERATED</div>
        <button onClick={() => navigate('/operation')} className="bg-zinc-800 border border-zinc-700 hover:border-red-500 px-6 py-2 rounded font-mono text-sm">
          RESTART OPERATION
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-body selection:bg-red-900 selection:text-white flex flex-col">
      {/* Top Bar */}
      <div className="h-16 border-b border-zinc-900 flex items-center px-8 justify-between bg-[#0a0a0a]">
        <div className="font-heading text-xl tracking-widest text-gray-400">OPERATION <span className="text-white">COMPLETE</span></div>
        <button onClick={() => navigate('/dashboard')} className="text-xs font-mono text-gray-500 hover:text-white">Go to Dashboard</button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT: Success Card & Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#101010] border border-green-500/30 rounded p-6 shadow-[0_0_30px_rgba(34,197,94,0.1)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-50">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <div className="relative z-10">
                <div className="text-green-500 font-mono text-xs mb-2">STATUS: SUCCESS</div>
                <h2 className="text-4xl font-heading text-white mb-1">{wordlist.length}</h2>
                <div className="text-gray-400 text-sm">Words Generated</div>
              </div>
              <div className="mt-8 pt-6 border-t border-zinc-800">
                <div className="flex justify-between text-xs text-gray-500 font-mono mb-2">
                  <span>Quality</span>
                  <span className="text-white">99.8%</span>
                </div>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="w-[99%] h-full bg-green-500"></div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleInjectToTerminal}
                className="w-full bg-white text-black hover:bg-gray-200 h-14 rounded flex items-center justify-between px-6 font-bold tracking-wide transition-all group"
              >
                <span className="flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-red-600" />
                  Open Terminal
                </span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadTxt}
                  className="bg-[#141414] border border-zinc-800 hover:border-zinc-600 text-gray-300 h-12 rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                >
                  <FileText className="w-4 h-4" /> Download .TXT
                </button>

                {historyId ? (
                  <button
                    onClick={() => {
                      const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
                      window.open(`${baseUrl}/pdf/${historyId}/`, '_blank');
                    }}
                    className="bg-[#141414] border border-zinc-800 hover:border-red-900/50 hover:text-red-500 text-gray-300 h-12 rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" /> Download .PDF
                  </button>
                ) : (
                  <button disabled className="bg-[#141414] border border-zinc-800 opacity-50 text-gray-500 h-12 rounded flex items-center justify-center gap-2 text-sm font-medium cursor-not-allowed">
                    <ShieldCheck className="w-4 h-4" /> PDF N/A
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Data Preview */}
          <div className="lg:col-span-2 flex flex-col h-[600px] bg-[#101010] border border-zinc-800 rounded overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#0d0d0d]">
              <div className="flex items-center gap-2 text-gray-400 font-mono text-xs">
                <Database className="w-4 h-4" />
                <span>Data Preview</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
              {/* Using the simple list here instead of the component to style it tightly */}
              <table className="w-full text-left text-sm font-mono text-gray-400">
                <thead className="bg-[#161616] text-gray-500 text-xs sticky top-0">
                  <tr>
                    <th className="p-3 w-16 text-center border-r border-zinc-800">#</th>
                    <th className="p-3">Generated Words</th>
                    <th className="p-3 text-right">Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {wordlist.map((pwd, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 text-center text-gray-600 border-r border-zinc-900">{i + 1}</td>
                      <td className="p-3 text-gray-300 select-all">{pwd}</td>
                      <td className="p-3 text-right text-gray-600">{pwd.length} chars</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
