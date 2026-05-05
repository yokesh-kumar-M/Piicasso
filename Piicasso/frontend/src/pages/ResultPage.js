import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import WordlistViewer from '../components/WordlistViewer';
import axiosInstance from '../api/axios';
import { ModeContext as ModeContextImport } from '../context/ModeContext';
import { Download, Terminal, FileText, CheckCircle, ShieldCheck, ArrowRight, Database } from 'lucide-react';

const ResultPage = () => {
  const [wordlist, setWordlist] = useState([]);
  const { mode } = useContext(ModeContextImport);
  const isSecurityMode = mode === 'security';

  const theme = {
    bg: isSecurityMode ? 'bg-security-bg' : 'bg-user-bg',
    accentColor: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
    accentBg: isSecurityMode ? 'bg-security-red' : 'bg-user-cobalt',
    card: isSecurityMode ? 'sec-card' : 'usr-card',
    topBar: isSecurityMode ? 'bg-security-surface border-b border-security-border' : 'bg-white/5 backdrop-blur-xl border-b border-user-border',
    btnPrimary: isSecurityMode ? 'security-btn-primary' : 'user-btn-primary',
    btnSecondary: isSecurityMode ? 'bg-black border border-security-border hover:border-security-red/50 text-gray-300' : 'bg-white/5 border border-user-border hover:border-user-cobalt/50 text-user-text',
    tableHeader: isSecurityMode ? 'bg-black border-b border-security-border text-gray-500' : 'bg-white/10 border-b border-user-border text-user-text/70',
    tableRowHover: isSecurityMode ? 'hover:bg-white/5' : 'hover:bg-white/10',
    heading: isSecurityMode ? 'security-heading' : 'user-heading',
    textPrimary: isSecurityMode ? 'text-gray-300' : 'text-white',
  };

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

  // wordlist entries are [{password, score}]; guard against legacy plain strings
  const getPassword = (w) => (typeof w === 'object' && w !== null) ? w.password : w;
  const getScore = (w) => (typeof w === 'object' && w !== null) ? w.score : null;

  const scoreColor = (s) => {
    if (s >= 70) return isSecurityMode ? 'text-red-500 bg-red-500/10' : 'text-red-400 bg-red-400/10';
    if (s >= 40) return 'text-orange-400 bg-orange-400/10';
    if (s >= 20) return 'text-yellow-400 bg-yellow-400/10';
    return isSecurityMode ? 'text-gray-600 bg-white/5' : 'text-user-text/40 bg-white/5';
  };

  // Quality = average score of top-20 entries (all if fewer than 20)
  const qualityPct = wordlist.length > 0
    ? Math.round(
        wordlist.slice(0, Math.min(20, wordlist.length))
          .reduce((sum, w) => sum + (getScore(w) ?? 50), 0)
        / Math.min(20, wordlist.length)
      )
    : 0;

  const handleInjectToTerminal = () => {
    const filename = `wordlist_${historyId || 'gen'}.txt`;
    sessionStorage.setItem('terminal_inject_filename', filename);
    sessionStorage.setItem('terminal_inject_count', wordlist.length);
    navigate('/operation');
  };

  const handleDownloadTxt = () => {
    const text = wordlist.map(getPassword).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wordlist_${historyId || 'generated'}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (loading) return (
    <div className={`min-h-screen ${theme.bg} flex items-center justify-center font-mono animate-pulse ${isSecurityMode ? 'text-security-red' : 'text-user-cobalt'}`}>
      [ SYSTEM ] Loading Results...
    </div>
  );

  if (!wordlist || wordlist.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${theme.bg}`}>
        <div className={`mb-4 text-xl font-mono ${theme.accentColor}`}>ERROR: NO DATA GENERATED</div>
        <button onClick={() => navigate('/operation')} className={`px-6 py-2 rounded font-mono text-sm transition-all ${theme.btnPrimary}`}>
          GENERATE NEW
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col pt-16`}>
      {/* Top Bar */}
      <div className={`h-16 flex items-center px-4 md:px-8 justify-between ${theme.topBar}`}>
        <div className={`text-base md:text-xl tracking-widest ${theme.heading}`}>GENERATION <span className={theme.accentColor}>COMPLETE</span></div>
        <button onClick={() => navigate('/dashboard')} className={`text-xs font-mono transition-colors ${isSecurityMode ? 'text-gray-500 hover:text-white' : 'text-user-text/70 hover:text-white'}`}>Dashboard</button>
      </div>

      <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">

          {/* LEFT: Success Card & Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className={`${theme.card} p-8 relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-4 opacity-30">
                <CheckCircle className={`w-16 h-16 ${theme.accentColor}`} />
              </div>
              <div className="relative z-10">
                <div className={`${theme.accentColor} font-mono text-xs mb-3 font-bold tracking-widest uppercase`}>STATUS: SUCCESS</div>
                <h2 className={`text-5xl mb-1 ${theme.heading}`}>{wordlist.length}</h2>
                <div className={isSecurityMode ? 'text-gray-400 text-sm font-mono' : 'text-user-text/80 text-sm'}>Words Generated</div>
              </div>
              <div className={`mt-8 pt-6 border-t ${isSecurityMode ? 'border-security-border' : 'border-user-border'}`}>
                <div className="flex justify-between text-xs font-mono mb-2 uppercase tracking-widest">
                  <span className={isSecurityMode ? 'text-gray-500' : 'text-user-text/60'}>Avg Score (top 20)</span>
                  <span className={isSecurityMode ? 'text-white' : 'text-white font-bold'}>{qualityPct}/100</span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isSecurityMode ? 'bg-black border border-security-border/50' : 'bg-white/10'}`}>
                  <div
                    className={`h-full ${theme.accentBg} ${isSecurityMode ? 'shadow-[0_0_10px_rgba(225,29,72,0.8)]' : 'shadow-[0_0_10px_rgba(59,130,246,0.8)]'}`}
                    style={{ width: `${qualityPct}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleInjectToTerminal}
                className={`w-full h-14 rounded flex items-center justify-between px-4 sm:px-6 tracking-wide transition-all group ${theme.btnPrimary}`}
              >
                <span className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base font-bold">
                  <Terminal className={`w-5 h-5 ${isSecurityMode ? 'text-white' : 'text-white'}`} />
                  Open Terminal
                </span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadTxt}
                  className={`h-12 rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors ${theme.btnSecondary}`}
                >
                  <FileText className="w-4 h-4" /> Download .TXT
                </button>

                {historyId ? (
                  <button
                    onClick={async () => {
                      try {
                        const baseUrl = (process.env.REACT_APP_API_URL || '/api').replace(/\/$/, '');
                        const res = await axiosInstance.post('download-token/', {
                          file_type: 'report',
                          record_id: historyId,
                        });
                        const downloadToken = res.data.download_token;
                        window.open(`${baseUrl}/file/report/${historyId}/?token=${encodeURIComponent(downloadToken)}`, '_blank');
                      } catch (err) {
                        console.error('Download failed:', err);
                        alert('Download failed. Please try again.');
                      }
                    }}
                    className={`h-12 rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors ${theme.btnSecondary}`}
                  >
                    <ShieldCheck className="w-4 h-4" /> Download .PDF
                  </button>
                ) : (
                  <button disabled className={`h-12 rounded flex items-center justify-center gap-2 text-sm font-medium cursor-not-allowed opacity-50 ${theme.btnSecondary}`}>
                    <ShieldCheck className="w-4 h-4" /> PDF N/A
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Data Preview */}
          <div className={`lg:col-span-2 flex flex-col min-h-[400px] lg:h-[600px] mt-2 lg:mt-0 ${theme.card} p-0 overflow-hidden`}>
            <div className={`p-5 flex justify-between items-center ${theme.topBar}`}>
              <div className={`flex items-center gap-2 font-mono text-xs uppercase tracking-widest ${isSecurityMode ? 'text-gray-400' : 'text-user-text/80'}`}>
                <Database className="w-4 h-4" />
                <span>Data Preview</span>
              </div>
            </div>
            <div className={`flex-1 overflow-y-auto overflow-x-auto p-0 custom-scrollbar ${isSecurityMode ? 'bg-black/50' : 'bg-transparent'}`}>
              <table className={`w-full text-left text-sm font-mono ${isSecurityMode ? 'text-gray-400' : 'text-user-text/90'}`}>
                <thead className={`text-xs sticky top-0 ${theme.tableHeader}`}>
                  <tr>
                    <th className={`p-4 w-12 text-center border-r ${isSecurityMode ? 'border-security-border' : 'border-user-border'}`}>#</th>
                    <th className="p-4 uppercase tracking-wider">Generated Words</th>
                    <th className="p-4 text-right uppercase tracking-wider">Score</th>
                    <th className="p-4 text-right uppercase tracking-wider">Len</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isSecurityMode ? 'divide-security-border' : 'divide-user-border'}`}>
                  {wordlist.map((entry, i) => {
                    const pwd = getPassword(entry);
                    const score = getScore(entry);
                    return (
                      <tr key={i} className={`transition-colors ${theme.tableRowHover}`}>
                        <td className={`p-4 text-center border-r ${isSecurityMode ? 'text-gray-600 border-security-border' : 'text-user-text/40 border-user-border'}`}>{i + 1}</td>
                        <td className={`p-4 select-all ${isSecurityMode ? 'text-gray-300' : 'text-white font-medium'}`}>{pwd}</td>
                        <td className="p-4 text-right">
                          {score !== null ? (
                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${scoreColor(score)}`}>
                              {score}
                            </span>
                          ) : (
                            <span className={isSecurityMode ? 'text-gray-700' : 'text-user-text/30'}>—</span>
                          )}
                        </td>
                        <td className={`p-4 text-right ${isSecurityMode ? 'text-gray-600' : 'text-user-text/50'}`}>{pwd.length}</td>
                      </tr>
                    );
                  })}
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
