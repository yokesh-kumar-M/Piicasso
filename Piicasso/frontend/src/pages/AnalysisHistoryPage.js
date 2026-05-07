import React, { useState, useEffect, useContext, useMemo } from 'react';
import useResponsive from '../hooks/useResponsive';
import axiosInstance from '../api/axios';
import { ModeContext } from '../context/ModeContext';
import { AlertTriangle, Clock, Database, RefreshCw, AlertCircle } from 'lucide-react';
import { HistorySkeleton } from '../components/SkeletonLoader';


const AnalysisHistoryPage = () => {
  const { mode: appMode } = useContext(ModeContext) || { mode: 'security' };
  const isSecurityMode = appMode === 'security';
  const { isMobile } = useResponsive();

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('password/history/');
      setAnalyses(res.data.analyses || []);
    } catch (err) {
      setError('Failed to load analysis history');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      low: 'var(--good)',
      medium: 'var(--warn)',
      high: 'var(--warn)',
      critical: 'var(--accent-500)'
    };
    return colors[level] || 'var(--fg-2)';
  };

  const getLevelBg = (level) => {
    const levelColor = getLevelColor(level);
    return {
      backgroundColor: `color-mix(in oklab, ${levelColor} 12%, var(--ink-1))`,
      borderColor: `color-mix(in oklab, ${levelColor} 30%, transparent)`,
    };
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'var(--good)';
    if (score >= 50) return 'var(--warn)';
    if (score >= 25) return 'var(--warn)';
    return 'var(--accent-500)';
  };

  const renderMobileCards = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {analyses.map((analysis) => {
        const levelColor = getLevelColor(analysis.vulnerability_level);
        const scoreColor = getScoreColor(analysis.strength_score);
        const isExpanded = expandedId === analysis.id;
        return (
          <div
            key={analysis.id}
            className="card"
            onClick={() => toggleExpand(analysis.id)}
            style={{ padding: '14px 16px', cursor: 'pointer' }}
          >
            {/* Card header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isExpanded ? 12 : 0 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', marginBottom: 4 }}>
                  {formatDate(analysis.created_at)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-flex',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 9,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: levelColor,
                    background: `color-mix(in oklab, ${levelColor} 12%, var(--ink-1))`,
                    border: `1px solid color-mix(in oklab, ${levelColor} 30%, transparent)`,
                  }}>
                    {analysis.vulnerability_level.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: scoreColor, fontWeight: 700 }}>
                    {analysis.strength_score}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>
                    {analysis.vulnerabilities_count} issues
                  </span>
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                ›
              </span>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid var(--ink-4)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    Issues Found
                  </div>
                  {(analysis.vulnerabilities_found || []).length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--good)', fontFamily: 'var(--font-mono)' }}>✓ No issues</div>
                  ) : (
                    (analysis.vulnerabilities_found || []).map((v, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'var(--accent-200)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>▲ {v}</div>
                    ))
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    Recommendations
                  </div>
                  {(analysis.recommendations || []).length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>None recorded</div>
                  ) : (
                    (analysis.recommendations || []).map((r, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'var(--fg-1)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>→ {r}</div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  if (loading) {
    return <HistorySkeleton />;
  }

  return (
    <div style={{ padding: '40px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', gap: '24px' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: '8px' }}>PASSWORD ANALYSIS</div>
            <h1 className="h-display" style={{ marginBottom: '12px' }}>Analysis History</h1>
            <p style={{ fontSize: '14px', color: 'var(--fg-2)', margin: 0 }}>
              View your past password analyses and security findings.
            </p>
          </div>
          <button
            onClick={fetchHistory}
            className="v3-btn v3-btn-ghost"
            title="Refresh"
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            Refresh
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'color-mix(in oklab, var(--accent-500) 12%, var(--ink-1))',
              border: '1px solid color-mix(in oklab, var(--accent-500) 30%, transparent)',
              borderRadius: '8px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--accent-500)',
              marginBottom: '24px',
            }}
          >
            <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{error}</span>
          </div>
        )}

        {!loading && analyses.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--ink-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <AlertTriangle style={{ width: '32px', height: '32px', color: 'var(--fg-3)' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--fg-0)', marginBottom: '8px', margin: 0 }}>
              No records found
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--fg-2)', maxWidth: '360px', margin: '8px 0 0 0' }}>
              Run a password scan from the dashboard to populate this log.
            </p>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--ink-4)' }}>
              <div className="eyebrow">ANALYSIS RECORDS</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--ink-4)', background: 'var(--ink-1)' }}>
                    <th style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', fontWeight: '600' }}>
                      Date
                    </th>
                    <th style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', fontWeight: '600' }}>
                      Level
                    </th>
                    <th style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', fontWeight: '600' }}>
                      Score
                    </th>
                    <th style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', fontWeight: '600' }}>
                      Crack Time
                    </th>
                    <th style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', fontWeight: '600' }}>
                      Breaches
                    </th>
                    <th style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', fontWeight: '600' }}>
                      Issues
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analyses.map((analysis) => {
                    const levelColor = getLevelColor(analysis.vulnerability_level);
                    const scoreColor = getScoreColor(analysis.strength_score);
                    const levelBg = getLevelBg(analysis.vulnerability_level);
                    const isExpanded = expandedId === analysis.id;

                    return (
                      <React.Fragment key={analysis.id}>
                      <tr
                        onClick={() => toggleExpand(analysis.id)}
                        style={{
                          borderBottom: '1px solid var(--ink-4)',
                          transition: 'background-color 0.2s',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ink-2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--fg-0)', fontWeight: '500' }}>
                          {formatDate(analysis.created_at)}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              padding: '3px 10px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: '700',
                              letterSpacing: '0.08em',
                              color: levelColor,
                              ...levelBg,
                              border: `1px solid ${levelBg.borderColor}`,
                            }}
                          >
                            {analysis.vulnerability_level.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '80px', height: '4px', background: 'var(--ink-3)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${analysis.strength_score}%`,
                                  height: '100%',
                                  background: scoreColor,
                                  transition: 'width 0.4s',
                                }}
                              />
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: scoreColor, fontWeight: '600' }}>
                              {analysis.strength_score}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--fg-0)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock style={{ width: '14px', height: '14px', color: 'var(--fg-2)' }} />
                            <span>{analysis.crack_time_estimate}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: '600' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: analysis.breach_count > 0 ? 'var(--warn)' : 'var(--good)' }}>
                            <Database style={{ width: '14px', height: '14px' }} />
                            <span>{analysis.breach_count}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--fg-0)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertTriangle
                              style={{
                                width: '14px',
                                height: '14px',
                                color: analysis.vulnerabilities_count > 0 ? 'var(--warn)' : 'var(--fg-2)',
                              }}
                            />
                            <span>{analysis.vulnerabilities_count}</span>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr style={{ background: 'var(--ink-1)' }}>
                          <td colSpan={6} style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                              <div>
                                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                  Issues Found
                                </div>
                                {(analysis.vulnerabilities_found || []).length === 0 ? (
                                  <div style={{ fontSize: 12, color: 'var(--good)', fontFamily: 'var(--font-mono)' }}>✓ No issues recorded</div>
                                ) : (
                                  (analysis.vulnerabilities_found || []).map((v, i) => (
                                    <div key={i} style={{ fontSize: 12, color: 'var(--accent-200)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                                      ▲ {v}
                                    </div>
                                  ))
                                )}
                              </div>
                              <div>
                                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                  Recommendations
                                </div>
                                {(analysis.recommendations || []).length === 0 ? (
                                  <div style={{ fontSize: 12, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>None recorded</div>
                                ) : (
                                  (analysis.recommendations || []).map((r, i) => (
                                    <div key={i} style={{ fontSize: 12, color: 'var(--fg-1)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                                      → {r}
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
};

export default AnalysisHistoryPage;
