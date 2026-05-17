import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.js';
import { scorePassword } from '../lib/piiEngine.js';
import axiosInstance from '../api/axios.js';

const PII_FIELDS = [
  { name: 'full_name',    label: 'Full Name',       placeholder: 'ex: Alex Johnson' },
  { name: 'dob',          label: 'Birth Year',      placeholder: 'ex: 1990' },
  { name: 'username',     label: 'Username',        placeholder: 'ex: alexj99' },
  { name: 'pet_names',    label: 'Pet Name',        placeholder: 'ex: Rex' },
  { name: 'spouse_name',  label: 'Partner / Spouse',placeholder: 'ex: Jamie' },
  { name: 'current_city', label: 'City',            placeholder: 'ex: Chennai' },
];

const StatCard = ({ label, value, hint }) => (
  <div className="card" style={{ padding: 20 }}>
    <div className="eyebrow" style={{ marginBottom: 6, color: 'var(--fg-3)' }}>
      {label}
    </div>
    <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--fg-0)', letterSpacing: '-0.02em' }}>
      {value}
    </div>
    {hint && (
      <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
        {hint}
      </div>
    )}
  </div>
);

function UserPasswordAnalyzer({ username, onAnalyzed }) {
  const [pii, setPii] = useState({});
  const [pw, setPw] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const piiProfile = useMemo(() => ({ ...pii, username }), [pii, username]);
  const preview = useMemo(() => (pw ? scorePassword(pw, piiProfile) : null), [pw, piiProfile]);

  const previewColor = !preview
    ? 'var(--fg-3)'
    : preview.score < 45
      ? 'var(--accent-500)'
      : preview.score < 70
        ? 'var(--warn)'
        : 'var(--good)';

  const handleAnalyze = async () => {
    if (!pw) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await axiosInstance.post('password/analyze/', {
        password: pw,
        pii_data: pii,
      });
      setResult(res.data);
      if (onAnalyzed) onAnalyzed();
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const resultColor = !result
    ? 'var(--fg-3)'
    : result.strength_score < 45
      ? 'var(--accent-500)'
      : result.strength_score < 70
        ? 'var(--warn)'
        : 'var(--good)';

  return (
    <div className="card" style={{ padding: 32, marginBottom: 28 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Password Resilience Test</div>
      <h2 className="h-display" style={{ fontSize: 22, marginBottom: 24, color: 'var(--fg-0)' }}>
        How well would your password hold up against someone who knows you?
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {PII_FIELDS.map((f) => (
          <div key={f.name}>
            <div style={{
              fontSize: 10,
              color: 'var(--fg-3)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 4,
            }}>
              {f.label}
            </div>
            <input
              value={pii[f.name] || ''}
              onChange={(e) => setPii((prev) => ({ ...prev, [f.name]: e.target.value }))}
              placeholder={f.placeholder}
              autoComplete="off"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--ink-3)',
                border: '1px solid var(--ink-5)',
                borderRadius: 6,
                color: 'var(--fg-0)',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 12,
        alignItems: 'stretch',
        marginBottom: result || error ? 24 : 0,
      }}>
        <div style={{ position: 'relative' }}>
          <input
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="Enter a password to test…"
            type="text"
            autoComplete="off"
            style={{
              width: '100%',
              padding: '14px 16px',
              paddingRight: preview ? 160 : 16,
              background: 'var(--ink-3)',
              border: '1px solid var(--ink-5)',
              borderRadius: 8,
              color: 'var(--fg-0)',
              fontFamily: 'var(--font-mono)',
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {preview && (
            <div style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 11,
              color: previewColor,
              fontFamily: 'var(--font-mono)',
              pointerEvents: 'none',
            }}>
              {preview.score} · {preview.rating}
            </div>
          )}
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !pw}
          style={{
            padding: '14px 28px',
            background: loading || !pw ? 'var(--ink-4)' : 'var(--accent-500)',
            color: loading || !pw ? 'var(--fg-3)' : '#fff',
            border: 'none',
            borderRadius: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            cursor: loading || !pw ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background 0.15s',
          }}
        >
          {loading ? 'Analyzing…' : 'Analyze →'}
        </button>
      </div>

      {error && (
        <div style={{
          color: 'var(--accent-500)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          marginBottom: 16,
        }}>
          ▲ {error}
        </div>
      )}

      {result && (
        <div style={{
          borderTop: '1px solid var(--ink-4)',
          paddingTop: 24,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 24,
        }}>
          <div>
            <div style={{
              fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
            }}>
              Strength Score
            </div>
            <div style={{
              fontSize: 52, fontWeight: 500, lineHeight: 1,
              color: resultColor, letterSpacing: '-0.04em',
            }}>
              {result.strength_score}
            </div>
            <div style={{
              height: 4, background: 'var(--ink-3)', borderRadius: 2,
              marginTop: 10, overflow: 'hidden',
            }}>
              <div style={{
                width: `${result.strength_score}%`,
                height: '100%',
                background: resultColor,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{
              marginTop: 8, fontSize: 12, color: resultColor,
              fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em',
            }}>
              {result.vulnerability_level?.toUpperCase()} RISK
            </div>
          </div>

          <div>
            <div style={{
              fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
            }}>
              Crack Time
            </div>
            <div style={{
              fontSize: 20, fontWeight: 500, color: 'var(--fg-0)', marginBottom: 20,
            }}>
              {result.crack_time_estimate}
            </div>
            <div style={{
              fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4,
            }}>
              Data Breaches
            </div>
            <div style={{
              fontSize: 20, fontWeight: 500,
              color: result.breach_count > 0 ? 'var(--warn)' : 'var(--good)',
            }}>
              {result.breach_count > 0 ? `Found in ${result.breach_count}` : 'Clean ✓'}
            </div>
          </div>

          <div>
            <div style={{
              fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
            }}>
              Issues Found
            </div>
            {(result.vulnerabilities || []).length === 0 ? (
              <div style={{
                fontSize: 12, color: 'var(--good)', fontFamily: 'var(--font-mono)',
              }}>
                ✓ No issues detected
              </div>
            ) : (
              (result.vulnerabilities || []).slice(0, 3).map((v, i) => (
                <div key={i} style={{
                  fontSize: 12, color: 'var(--accent-200)',
                  fontFamily: 'var(--font-mono)', marginBottom: 5,
                }}>
                  ▲ {v}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const UserDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const username = user?.username || 'User';
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const [p, a] = await Promise.allSettled([
        axiosInstance.get('profile/'),
        axiosInstance.get('password/activity/'),
      ]);
      if (p.status === 'fulfilled') setProfile(p.value.data);
      if (a.status === 'fulfilled') setActivity(a.value.data.activities || []);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const stats = profile?.stats || {};
  const lastGenLabel = stats.last_generation
    ? new Date(stats.last_generation).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
    : '—';

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow" style={{ color: 'var(--accent-500)' }}>
          ● Your security overview
        </div>
        <h1 className="h-display" style={{ fontSize: 38, marginTop: 4, color: 'var(--fg-0)' }}>
          Hi, {displayName}.
        </h1>
        <p style={{
          color: 'var(--fg-2)',
          fontSize: 14,
          fontFamily: 'var(--font-mono)',
          marginTop: 4,
        }}>
          Here's how you'd hold up against someone who knows you.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        <StatCard
          label="Wordlists generated"
          value={statsLoading ? '…' : (stats.total_generations ?? 0)}
          hint="Across your lifetime"
        />
        <StatCard
          label="Passwords analysed"
          value={statsLoading ? '…' : activity.length}
          hint="Recent scans"
        />
        <StatCard
          label="Unread messages"
          value={statsLoading ? '…' : (profile?.unread_messages ?? 0)}
          hint="From the admin team"
        />
        <StatCard
          label="Last activity"
          value={statsLoading ? '…' : lastGenLabel}
          hint={profile?.auth_type ? `Auth: ${profile.auth_type}` : ''}
        />
      </div>

      <UserPasswordAnalyzer username={username} onAnalyzed={loadStats} />

      <div className="card" style={{ padding: 24 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <div className="eyebrow">Recent activity</div>
          <button
            onClick={() => navigate('/user/history')}
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-500)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            FULL HISTORY →
          </button>
        </div>
        {statsLoading ? (
          <div style={{ color: 'var(--fg-3)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
            Loading…
          </div>
        ) : activity.length === 0 ? (
          <div style={{
            color: 'var(--fg-3)',
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            padding: '24px 0',
            textAlign: 'center',
          }}>
            Nothing here yet — run your first password analysis above.
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
            {activity.slice(0, 6).map((evt) => {
              const color = evt.status === 'danger'
                ? 'var(--accent-500)'
                : evt.status === 'warning'
                  ? 'var(--warn)'
                  : 'var(--good)';
              return (
                <li
                  key={evt.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    gap: 12,
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--ink-2)',
                    border: '1px solid var(--ink-4)',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: color,
                      boxShadow: `0 0 8px ${color}`,
                    }}
                  />
                  <div style={{ fontSize: 13, color: 'var(--fg-0)' }}>
                    {evt.message}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--fg-3)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {new Date(evt.time).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
};

export default UserDashboardPage;
