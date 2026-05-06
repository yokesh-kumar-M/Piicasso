import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import DesignAppShell from '../components/design/dashboard/DesignAppShell';
import axiosInstance from '../api/axios';
import { ModeContext as ModeContextImport } from '../context/ModeContext';
import { Download, Terminal, FileText, CheckCircle, ShieldCheck, ArrowRight, Database } from 'lucide-react';

const ResultPage = () => {
  const [wordlist, setWordlist] = useState([]);
  const { mode } = useContext(ModeContextImport);
  const isSecurityMode = mode === 'security';

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
    if (s >= 70) return { bg: 'color-mix(in oklab, var(--good) 10%, var(--ink-1))', color: 'var(--good)' };
    if (s >= 40) return { bg: 'color-mix(in oklab, var(--warn) 10%, var(--ink-1))', color: 'var(--warn)' };
    if (s >= 20) return { bg: 'color-mix(in oklab, var(--accent-500) 10%, var(--ink-1))', color: 'var(--accent-500)' };
    return { bg: 'var(--ink-3)', color: 'var(--fg-3)' };
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
    <DesignAppShell>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        fontSize: 14,
        fontFamily: 'var(--font-mono)',
        color: 'var(--fg-2)',
        animation: 'pulse 2s infinite'
      }}>
        [ SYSTEM ] Loading Results...
      </div>
    </DesignAppShell>
  );

  if (!wordlist || wordlist.length === 0) {
    return (
      <DesignAppShell>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 24
        }}>
          <div style={{ fontSize: 16, fontFamily: 'var(--font-mono)', color: 'var(--accent-500)' }}>
            ERROR: NO DATA GENERATED
          </div>
          <button
            onClick={() => navigate('/operation')}
            style={{
              padding: '12px 24px',
              borderRadius: 6,
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              backgroundColor: 'var(--accent-500)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            GENERATE NEW
          </button>
        </div>
      </DesignAppShell>
    );
  }

  return (
    <DesignAppShell>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        paddingBottom: 16,
        borderBottom: '1px solid var(--ink-4)'
      }}>
        <div style={{
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: '0.05em',
          color: 'var(--fg-0)'
        }}>
          GENERATION <span style={{ color: 'var(--accent-500)' }}>COMPLETE</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            color: 'var(--fg-2)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = 'var(--fg-0)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--fg-2)'}
        >
          Dashboard
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 32,
        gridAutoFlow: 'dense'
      }}>

        {/* LEFT: Success Card & Actions */}
        <div style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Success Card */}
          <div className="card" style={{
            padding: 24,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: 'var(--ink-1)',
            border: '1px solid var(--ink-4)',
            borderRadius: 8
          }}>
            <div style={{
              position: 'absolute',
              top: 16,
              right: 16,
              opacity: 0.2
            }}>
              <CheckCircle style={{ width: 64, height: 64, color: 'var(--accent-500)' }} />
            </div>
            <div style={{ position: 'relative', zIndex: 10 }}>
              <div style={{
                color: 'var(--accent-500)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                marginBottom: 12,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}>
                ● STATUS: SUCCESS
              </div>
              <h2 style={{
                fontSize: 48,
                fontWeight: 700,
                marginBottom: 8,
                color: 'var(--fg-0)'
              }}>
                {wordlist.length}
              </h2>
              <div style={{
                color: 'var(--fg-2)',
                fontSize: 13,
                fontFamily: 'var(--font-mono)'
              }}>
                Words Generated
              </div>
            </div>

            {/* Quality Bar */}
            <div style={{
              marginTop: 32,
              paddingTop: 16,
              borderTop: '1px solid var(--ink-4)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--fg-3)'
              }}>
                <span>Avg Score (top 20)</span>
                <span style={{ color: 'var(--fg-0)', fontWeight: 700 }}>{qualityPct}/100</span>
              </div>
              <div style={{
                width: '100%',
                height: 6,
                borderRadius: 3,
                overflow: 'hidden',
                backgroundColor: 'var(--ink-3)',
                border: '1px solid var(--ink-4)'
              }}>
                <div
                  style={{
                    height: '100%',
                    backgroundColor: 'var(--accent-500)',
                    width: `${qualityPct}%`,
                    boxShadow: '0 0 10px var(--accent-glow)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={handleInjectToTerminal}
              style={{
                width: '100%',
                height: 56,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: 24,
                paddingRight: 24,
                fontSize: 14,
                fontWeight: 700,
                backgroundColor: 'var(--accent-500)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Terminal style={{ width: 18, height: 18 }} />
                Open Terminal
              </span>
              <ArrowRight style={{ width: 18, height: 18 }} />
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                onClick={handleDownloadTxt}
                style={{
                  height: 44,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  backgroundColor: 'var(--ink-1)',
                  color: 'var(--fg-0)',
                  border: '1px solid var(--ink-4)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--ink-3)';
                  e.target.style.borderColor = 'var(--ink-5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--ink-1)';
                  e.target.style.borderColor = 'var(--ink-4)';
                }}
              >
                <FileText style={{ width: 16, height: 16 }} />
                Download .TXT
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
                  style={{
                    height: 44,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    backgroundColor: 'var(--ink-1)',
                    color: 'var(--fg-0)',
                    border: '1px solid var(--ink-4)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--ink-3)';
                    e.target.style.borderColor = 'var(--ink-5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--ink-1)';
                    e.target.style.borderColor = 'var(--ink-4)';
                  }}
                >
                  <ShieldCheck style={{ width: 16, height: 16 }} />
                  Download .PDF
                </button>
              ) : (
                <button
                  disabled
                  style={{
                    height: 44,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    backgroundColor: 'var(--ink-1)',
                    color: 'var(--fg-3)',
                    border: '1px solid var(--ink-4)',
                    cursor: 'not-allowed',
                    opacity: 0.5
                  }}
                >
                  <ShieldCheck style={{ width: 16, height: 16 }} />
                  PDF N/A
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Data Preview Table */}
        <div style={{
          gridColumn: 'span 2',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 400,
          backgroundColor: 'var(--ink-1)',
          border: '1px solid var(--ink-4)',
          borderRadius: 8,
          overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'var(--ink-1)',
            borderBottom: '1px solid var(--ink-4)',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--fg-2)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 700
          }}>
            <Database style={{ width: 16, height: 16 }} />
            <span>Data Preview</span>
          </div>

          {/* Table Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              color: 'var(--fg-0)'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: 'var(--ink-1)',
                  borderBottom: '1px solid var(--ink-4)',
                  fontSize: 11,
                  color: 'var(--fg-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 700
                }}>
                  <th style={{
                    padding: 16,
                    textAlign: 'center',
                    width: 48,
                    borderRight: '1px solid var(--ink-4)'
                  }}>#</th>
                  <th style={{ padding: 16, textAlign: 'left' }}>Generated Words</th>
                  <th style={{ padding: 16, textAlign: 'right' }}>Score</th>
                  <th style={{ padding: 16, textAlign: 'right' }}>Len</th>
                </tr>
              </thead>
              <tbody>
                {wordlist.map((entry, i) => {
                  const pwd = getPassword(entry);
                  const score = getScore(entry);
                  const colors = scoreColor(score);
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid var(--ink-4)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ink-3)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{
                        padding: 16,
                        textAlign: 'center',
                        borderRight: '1px solid var(--ink-4)',
                        color: 'var(--fg-3)',
                        fontSize: 12
                      }}>
                        {i + 1}
                      </td>
                      <td style={{
                        padding: 16,
                        userSelect: 'all',
                        color: 'var(--fg-0)',
                        fontWeight: 500
                      }}>
                        {pwd}
                      </td>
                      <td style={{
                        padding: 16,
                        textAlign: 'right'
                      }}>
                        {score !== null ? (
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '4px 8px',
                            borderRadius: 4,
                            backgroundColor: colors.bg,
                            color: colors.color,
                            display: 'inline-block'
                          }}>
                            {score}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--fg-3)' }}>—</span>
                        )}
                      </td>
                      <td style={{
                        padding: 16,
                        textAlign: 'right',
                        color: 'var(--fg-3)',
                        fontSize: 12
                      }}>
                        {pwd.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DesignAppShell>
  );
};

export default ResultPage;
