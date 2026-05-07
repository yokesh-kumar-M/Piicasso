import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import DesignAppShell from '../components/design/dashboard/DesignAppShell';
import axiosInstance from '../api/axios';
import { ModeContext as ModeContextImport } from '../context/ModeContext';
import {
  Download, Terminal, FileText, CheckCircle, ShieldCheck,
  ArrowRight, Database, Activity, Zap, AlertTriangle, TrendingUp
} from 'lucide-react';

/* ─── threat-level palette ──────────────────────────────────────────────── */
const THREAT_META = {
  LOW:      { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  label: 'LOW',      icon: '●' },
  MEDIUM:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'MEDIUM',   icon: '◆' },
  HIGH:     { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'HIGH',     icon: '▲' },
  CRITICAL: { color: '#dc2626', bg: 'rgba(220,38,38,0.18)',  label: 'CRITICAL', icon: '⚠' },
};

/* ─── score badge colour ────────────────────────────────────────────────── */
const scoreColor = (s) => {
  if (s >= 70) return { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e' };
  if (s >= 40) return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' };
  if (s >= 20) return { bg: 'rgba(99,102,241,0.1)', color: '#818cf8' };
  return        { bg: 'rgba(255,255,255,0.04)',     color: '#6b7280' };
};

/* ─── small stat card ───────────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, accent }) => (
  <div style={{
    background: 'var(--ink-1)',
    border: '1px solid var(--ink-4)',
    borderRadius: 8,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    borderLeft: `3px solid ${accent || 'var(--accent-500)'}`,
  }}>
    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
      {label}
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color: accent || 'var(--fg-0)',
                  lineHeight: 1.1, fontFamily: 'var(--font-mono)' }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
        {sub}
      </div>
    )}
  </div>
);

/* ─── progress bar ──────────────────────────────────────────────────────── */
const ProgressBar = ({ value, max = 100, color }) => (
  <div style={{ width: '100%', height: 6, borderRadius: 3, overflow: 'hidden',
                backgroundColor: 'var(--ink-3)', border: '1px solid var(--ink-4)' }}>
    <div style={{
      height: '100%',
      width: `${Math.min(100, (value / max) * 100)}%`,
      backgroundColor: color || 'var(--accent-500)',
      boxShadow: `0 0 8px ${color || 'var(--accent-glow)'}`,
      transition: 'width 0.6s ease',
      borderRadius: 3,
    }} />
  </div>
);

/* ════════════════════════════════════════════════════════════════════════ */
const ResultPage = () => {
  const [wordlist, setWordlist]   = useState([]);
  const [metrics,  setMetrics]    = useState(null);
  const [historyId, setHistoryId] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [visibleCount, setVisibleCount] = useState(200);

  const { mode } = useContext(ModeContextImport);
  const isSecurityMode = mode === 'security';
  const navigate = useNavigate();

  useEffect(() => {
    const raw  = sessionStorage.getItem('generatedWordlist');
    const hid  = sessionStorage.getItem('historyId');
    const mraw = sessionStorage.getItem('generationMetrics');

    if (raw)  { try { setWordlist(JSON.parse(raw)); } catch { setWordlist([]); } }
    if (hid)  setHistoryId(hid);
    if (mraw) { try { setMetrics(JSON.parse(mraw)); } catch { setMetrics(null); } }
    setLoading(false);
  }, []);

  /* helpers */
  const getPassword = (w) => (typeof w === 'object' && w !== null) ? w.password : String(w);
  const getScore    = (w) => (typeof w === 'object' && w !== null) ? w.score    : null;

  const qualityPct = wordlist.length > 0
    ? Math.round(
        wordlist.slice(0, Math.min(20, wordlist.length))
          .reduce((sum, w) => sum + (getScore(w) ?? 50), 0)
        / Math.min(20, wordlist.length)
      )
    : 0;

  const threat = metrics?.threat_level || 'LOW';
  const tm     = THREAT_META[threat] || THREAT_META.LOW;

  /* downloads */
  const handleDownloadTxt = () => {
    const text = wordlist.map(getPassword).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `wordlist_${historyId || 'generated'}.txt`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!historyId) return;
    try {
      const res = await axiosInstance.post('download-token/', {
        file_type: 'report', record_id: historyId,
      });
      const baseUrl = (process.env.REACT_APP_API_URL || '/api').replace(/\/$/, '');
      window.open(
        `${baseUrl}/file/report/${historyId}/?token=${encodeURIComponent(res.data.download_token)}`,
        '_blank'
      );
    } catch { alert('PDF download failed. Please try again.'); }
  };

  const handleInjectToTerminal = () => {
    sessionStorage.setItem('terminal_inject_filename', `wordlist_${historyId || 'gen'}.txt`);
    sessionStorage.setItem('terminal_inject_count', wordlist.length);
    navigate('/operation');
  };

  /* ── loading / empty states ── */
  if (loading) return (
    <DesignAppShell>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                    minHeight:'60vh', fontFamily:'var(--font-mono)', color:'var(--fg-2)',
                    fontSize:14, animation:'pulse 2s infinite' }}>
        [ SYSTEM ] Loading Intelligence Report...
      </div>
    </DesignAppShell>
  );

  if (!wordlist || wordlist.length === 0) return (
    <DesignAppShell>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
                    justifyContent:'center', minHeight:'60vh', gap:24, padding:'0 16px' }}>
        <AlertTriangle style={{ width:48, height:48, color:'var(--accent-500)', opacity:0.6 }} />
        <div style={{ fontSize:16, fontFamily:'var(--font-mono)', color:'var(--accent-500)',
                      textAlign:'center' }}>
          NO DATA GENERATED
        </div>
        <p style={{ color:'var(--fg-3)', fontSize:13, textAlign:'center', maxWidth:320 }}>
          Submit target data from the dashboard to generate a wordlist.
        </p>
        <button onClick={() => navigate('/security/dashboard')} style={{
          padding:'12px 28px', borderRadius:6, fontFamily:'var(--font-mono)', fontSize:13,
          backgroundColor:'var(--accent-500)', color:'#fff', border:'none', cursor:'pointer',
        }}>
          GO TO DASHBOARD
        </button>
      </div>
    </DesignAppShell>
  );

  /* ── visible slice for table ── */
  const visibleList = wordlist.slice(0, visibleCount);

  return (
    <DesignAppShell>
      {/* ── Page header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    marginBottom:24, paddingBottom:16, borderBottom:'1px solid var(--ink-4)',
                    flexWrap:'wrap', gap:12 }}>
        <div style={{ fontSize:'clamp(20px, 4vw, 28px)', fontWeight:600,
                      letterSpacing:'0.05em', color:'var(--fg-0)' }}>
          GENERATION <span style={{ color:'var(--accent-500)' }}>COMPLETE</span>
        </div>
        <button onClick={() => navigate('/security/dashboard')} style={{
          fontSize:12, fontFamily:'var(--font-mono)', color:'var(--fg-2)',
          background:'none', border:'none', cursor:'pointer' }}
          onMouseEnter={e => e.target.style.color='var(--fg-0)'}
          onMouseLeave={e => e.target.style.color='var(--fg-2)'}>
          ← Dashboard
        </button>
      </div>

      {/* ── Main grid (responsive: 1 col mobile, 3 col desktop) ── */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap:24,
      }}>

        {/* ══ LEFT COLUMN: Summary + Metrics + Actions ══ */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Status card */}
          <div style={{ background:'var(--ink-1)', border:'1px solid var(--ink-4)',
                        borderRadius:8, padding:24, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:16, right:16, opacity:0.08 }}>
              <CheckCircle style={{ width:72, height:72, color:'var(--accent-500)' }} />
            </div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--accent-500)',
                          marginBottom:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>
              ● STATUS: SUCCESS
            </div>
            <h2 style={{ fontSize:'clamp(36px,6vw,52px)', fontWeight:700, margin:'0 0 4px',
                         color:'var(--fg-0)', lineHeight:1 }}>
              {wordlist.length.toLocaleString()}
            </h2>
            <div style={{ color:'var(--fg-2)', fontSize:13, fontFamily:'var(--font-mono)' }}>
              Password Candidates Generated
            </div>

            {/* Quality bar */}
            <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid var(--ink-4)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10,
                            fontFamily:'var(--font-mono)', marginBottom:8, textTransform:'uppercase',
                            letterSpacing:'0.05em', color:'var(--fg-3)' }}>
                <span>Avg Score (top 20)</span>
                <span style={{ color:'var(--fg-0)', fontWeight:700 }}>{qualityPct}/100</span>
              </div>
              <ProgressBar value={qualityPct} color="var(--accent-500)" />
            </div>
          </div>

          {/* ── Threat Intelligence Metrics ── */}
          {metrics && (
            <div style={{ background:'var(--ink-1)', border:'1px solid var(--ink-4)',
                          borderRadius:8, padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16,
                            fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700,
                            textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--fg-2)' }}>
                <Activity style={{ width:14, height:14 }} />
                Threat Intelligence Metrics
              </div>

              {/* Threat Level badge */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                            background: tm.bg, border:`1px solid ${tm.color}33`,
                            borderRadius:6, padding:'10px 14px', marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--fg-3)',
                                textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>
                    Threat Level
                  </div>
                  <div style={{ fontSize:20, fontWeight:800, fontFamily:'var(--font-mono)',
                                color: tm.color, letterSpacing:'0.05em' }}>
                    {tm.icon} {tm.label}
                  </div>
                </div>
                <AlertTriangle style={{ width:28, height:28, color: tm.color, opacity:0.6 }} />
              </div>

              {/* E score */}
              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10,
                              fontFamily:'var(--font-mono)', color:'var(--fg-3)',
                              textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <TrendingUp style={{ width:10, height:10 }} />
                    Effectiveness Score (E)
                  </span>
                  <span style={{ color:'var(--fg-0)', fontWeight:700 }}>
                    {Number(metrics.effectiveness_score).toFixed(1)}%
                  </span>
                </div>
                <ProgressBar value={metrics.effectiveness_score} color="#818cf8" />
                <div style={{ fontSize:9, color:'var(--fg-3)', fontFamily:'var(--font-mono)',
                              marginTop:4 }}>
                  {metrics.matched_words} / {metrics.total_words} entries contain profile tokens
                </div>
              </div>

              {/* Rd score */}
              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10,
                              fontFamily:'var(--font-mono)', color:'var(--fg-3)',
                              textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <Zap style={{ width:10, height:10 }} />
                    Risk Density (Rd)
                  </span>
                  <span style={{ color:'var(--fg-0)', fontWeight:700 }}>
                    {Number(metrics.risk_density).toFixed(4)}
                  </span>
                </div>
                <ProgressBar value={metrics.risk_density * 100} color={tm.color} />
                <div style={{ fontSize:9, color:'var(--fg-3)', fontFamily:'var(--font-mono)',
                              marginTop:4 }}>
                  Average PII token density per credential character
                </div>
              </div>

              {/* Stat row */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div style={{ background:'var(--ink-2)', borderRadius:6, padding:'10px 12px' }}>
                  <div style={{ fontSize:9, fontFamily:'var(--font-mono)', color:'var(--fg-3)',
                                textTransform:'uppercase', letterSpacing:'0.06em' }}>Total Words</div>
                  <div style={{ fontSize:20, fontWeight:700, color:'var(--fg-0)',
                                fontFamily:'var(--font-mono)' }}>
                    {(metrics.total_words || 0).toLocaleString()}
                  </div>
                </div>
                <div style={{ background:'var(--ink-2)', borderRadius:6, padding:'10px 12px' }}>
                  <div style={{ fontSize:9, fontFamily:'var(--font-mono)', color:'var(--fg-3)',
                                textTransform:'uppercase', letterSpacing:'0.06em' }}>PII Matches</div>
                  <div style={{ fontSize:20, fontWeight:700, color:'#818cf8',
                                fontFamily:'var(--font-mono)' }}>
                    {(metrics.matched_words || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Action buttons ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button onClick={handleInjectToTerminal} style={{
              width:'100%', height:50, borderRadius:6, display:'flex', alignItems:'center',
              justifyContent:'space-between', paddingLeft:20, paddingRight:20, fontSize:13,
              fontWeight:700, backgroundColor:'var(--accent-500)', color:'#fff',
              border:'none', cursor:'pointer', transition:'opacity 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}>
              <span style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Terminal style={{ width:16, height:16 }} /> Open Terminal
              </span>
              <ArrowRight style={{ width:16, height:16 }} />
            </button>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <button onClick={handleDownloadTxt} style={{
                height:42, borderRadius:6, display:'flex', alignItems:'center',
                justifyContent:'center', gap:8, fontSize:12, fontWeight:500,
                backgroundColor:'var(--ink-1)', color:'var(--fg-0)',
                border:'1px solid var(--ink-4)', cursor:'pointer', transition:'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background='var(--ink-3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='var(--ink-1)'; }}>
                <FileText style={{ width:14, height:14 }} /> .TXT
              </button>

              <button onClick={historyId ? handleDownloadPdf : undefined}
                disabled={!historyId}
                style={{
                  height:42, borderRadius:6, display:'flex', alignItems:'center',
                  justifyContent:'center', gap:8, fontSize:12, fontWeight:500,
                  backgroundColor:'var(--ink-1)', color: historyId ? 'var(--fg-0)' : 'var(--fg-3)',
                  border:'1px solid var(--ink-4)', cursor: historyId ? 'pointer' : 'not-allowed',
                  opacity: historyId ? 1 : 0.5, transition:'all 0.2s',
                }}
                onMouseEnter={e => { if (historyId) e.currentTarget.style.background='var(--ink-3)'; }}
                onMouseLeave={e => { if (historyId) e.currentTarget.style.background='var(--ink-1)'; }}>
                <ShieldCheck style={{ width:14, height:14 }} /> .PDF
              </button>
            </div>
          </div>
        </div>

        {/* ══ RIGHT COLUMN: Data preview table ══ */}
        <div style={{
          gridColumn: 'span 2',
          display:'flex', flexDirection:'column', minHeight:400,
          backgroundColor:'var(--ink-1)', border:'1px solid var(--ink-4)',
          borderRadius:8, overflow:'hidden',
        }}>
          {/* Table header */}
          <div style={{ padding:'12px 16px', display:'flex', alignItems:'center',
                        justifyContent:'space-between', backgroundColor:'var(--ink-1)',
                        borderBottom:'1px solid var(--ink-4)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11,
                          fontFamily:'var(--font-mono)', color:'var(--fg-2)',
                          textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:700 }}>
              <Database style={{ width:14, height:14 }} />
              <span>Password Candidates</span>
              <span style={{ color:'var(--fg-3)', fontWeight:400 }}>
                — {wordlist.length.toLocaleString()} total
              </span>
            </div>
            {wordlist.length > 200 && (
              <div style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--fg-3)' }}>
                Showing {Math.min(visibleCount, wordlist.length).toLocaleString()}
              </div>
            )}
          </div>

          {/* Table body */}
          <div style={{ flex:1, overflowY:'auto', overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13,
                            fontFamily:'var(--font-mono)', color:'var(--fg-0)' }}>
              <thead>
                <tr style={{ backgroundColor:'var(--ink-1)', borderBottom:'1px solid var(--ink-4)',
                             fontSize:10, color:'var(--fg-3)', textTransform:'uppercase',
                             letterSpacing:'0.05em', fontWeight:700, position:'sticky', top:0 }}>
                  <th style={{ padding:'10px 16px', textAlign:'center', width:44,
                               borderRight:'1px solid var(--ink-4)' }}>#</th>
                  <th style={{ padding:'10px 16px', textAlign:'left' }}>Credential</th>
                  <th style={{ padding:'10px 16px', textAlign:'right', width:70 }}>Score</th>
                  <th style={{ padding:'10px 16px', textAlign:'right', width:50 }}>Len</th>
                </tr>
              </thead>
              <tbody>
                {visibleList.map((entry, i) => {
                  const pwd    = getPassword(entry);
                  const score  = getScore(entry);
                  const colors = scoreColor(score);
                  return (
                    <tr key={i}
                      style={{ borderBottom:'1px solid var(--ink-4)', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor='var(--ink-3)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>
                      <td style={{ padding:'10px 16px', textAlign:'center',
                                   borderRight:'1px solid var(--ink-4)', color:'var(--fg-3)',
                                   fontSize:11 }}>{i + 1}</td>
                      <td style={{ padding:'10px 16px', userSelect:'all',
                                   color:'var(--fg-0)', fontWeight:500,
                                   wordBreak:'break-all', maxWidth:0, overflow:'hidden',
                                   textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pwd}</td>
                      <td style={{ padding:'10px 16px', textAlign:'right' }}>
                        {score !== null ? (
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:10,
                                         fontWeight:700, padding:'3px 7px', borderRadius:4,
                                         backgroundColor: colors.bg, color: colors.color }}>
                            {score}
                          </span>
                        ) : <span style={{ color:'var(--fg-3)' }}>—</span>}
                      </td>
                      <td style={{ padding:'10px 16px', textAlign:'right', color:'var(--fg-3)',
                                   fontSize:11 }}>{pwd.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Load more */}
            {visibleCount < wordlist.length && (
              <div style={{ padding:16, textAlign:'center' }}>
                <button onClick={() => setVisibleCount(v => v + 200)} style={{
                  padding:'8px 24px', borderRadius:6, fontSize:12, fontFamily:'var(--font-mono)',
                  backgroundColor:'var(--ink-2)', color:'var(--fg-1)',
                  border:'1px solid var(--ink-4)', cursor:'pointer', transition:'all 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--ink-3)'}
                  onMouseLeave={e => e.currentTarget.style.background='var(--ink-2)'}>
                  Load more ({(wordlist.length - visibleCount).toLocaleString()} remaining)
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </DesignAppShell>
  );
};

export default ResultPage;
