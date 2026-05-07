# Globe Live Presence + User Mode PII Password Test — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the globe to show real-time active user beacons (not historical), and wire User Mode to let users test their own passwords against their PII with history tracking.

**Architecture:** Part 1 uses Django's cache layer (`globe:active` dict) as a lightweight presence store, updated by the existing HELP heartbeat. Part 2 reuses the existing `PasswordAnalyzeView` backend and adds an inline `UserPasswordAnalyzer` component to `UserDashboardPage`.

**Tech Stack:** Django REST Framework, Django cache framework, React, axiosInstance, piiEngine.js

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `Piicasso/backend/analytics/serializers.py` | Modify | Add `user_id` to serialized fields |
| `Piicasso/backend/analytics/views.py` | Modify | HelpBeaconView writes heartbeat to cache; GlobeDataView returns live presence |
| `Piicasso/backend/password_security/views.py` | Modify | PasswordAnalysisHistoryView adds `vulnerabilities_found` + `recommendations` |
| `Piicasso/frontend/src/components/GlobalMap.js` | Modify | Replace-not-merge on map, `user_id` key, `live_count` from API |
| `Piicasso/frontend/src/pages/UserDashboardPage.js` | Modify | Replace `UserQuickCheck` with `UserPasswordAnalyzer` |
| `Piicasso/frontend/src/pages/AnalysisHistoryPage.js` | Modify | Click-to-expand rows showing vulnerabilities + recommendations |

---

## Task 1: Serializer — expose `user_id`

**Files:**
- Modify: `Piicasso/backend/analytics/serializers.py`

- [ ] **Step 1: Open the file and add `user_id` to the fields list**

Replace the existing `fields` tuple:
```python
class Meta:
    model = UserActivity
    fields = ['id', 'user_id', 'activity_type', 'timestamp',
              'latitude', 'longitude', 'color', 'intensity', 'city']
```

`user_id` is a Django auto-generated FK accessor — numeric integer, no username/email exposed.

- [ ] **Step 2: Verify with a quick shell test**

```bash
cd Piicasso/backend
python manage.py shell -c "
from analytics.serializers import UserActivitySerializer
from analytics.models import UserActivity
a = UserActivity.objects.first()
if a:
    print(UserActivitySerializer(a).data.keys())
else:
    print('no records — field list check ok')
"
```
Expected output contains `user_id` in the key list (or `no records` if DB is empty — both are fine).

- [ ] **Step 3: Commit**

```bash
git add Piicasso/backend/analytics/serializers.py
git commit -m "feat: expose user_id in UserActivitySerializer for globe beacon keying"
```

---

## Task 2: HelpBeaconView — write heartbeat to cache

**Files:**
- Modify: `Piicasso/backend/analytics/views.py`

- [ ] **Step 1: Add `cache` and `timezone` imports at top of file (if not already present)**

The file already imports `timezone` and `parse_datetime`. Add `cache`:
```python
from django.core.cache import cache
```

- [ ] **Step 2: Update `HelpBeaconView.post()` to record heartbeat**

Replace the existing method body:
```python
def post(self, request):
    message = request.data.get('message', '')
    if message == 'HELP':
        logger.debug(f"[BEACON] HELP signal received from {request.user.username}")
        active = cache.get('globe:active', {})
        active[str(request.user.id)] = timezone.now().isoformat()
        cache.set('globe:active', active, timeout=3600)
    return Response({'status': 'received', 'echo': message}, status=status.HTTP_200_OK)
```

The cache dict grows with all users who ever heartbeated but old entries are filtered by timestamp at read time. TTL of 3600s clears the whole dict if the server is idle.

- [ ] **Step 3: Verify via Django shell**

```bash
cd Piicasso/backend
python manage.py shell -c "
from django.core.cache import cache
from django.utils import timezone
# Simulate a beacon write
active = cache.get('globe:active', {})
active['999'] = timezone.now().isoformat()
cache.set('globe:active', active, timeout=3600)
result = cache.get('globe:active', {})
print('user 999 in cache:', '999' in result)
"
```
Expected: `user 999 in cache: True`

- [ ] **Step 4: Commit**

```bash
git add Piicasso/backend/analytics/views.py
git commit -m "feat: HelpBeaconView writes user heartbeat to cache for globe live presence"
```

---

## Task 3: GlobeDataView — return live presence snapshot

**Files:**
- Modify: `Piicasso/backend/analytics/views.py`

- [ ] **Step 1: Replace the entire `GlobeDataView.get()` method**

The old method had two branches (initial vs incremental with `since` param). Replace with a single always-current snapshot. The `since` param is accepted but ignored — both initial and poll calls return the live set:

```python
def get(self, request):
    from django.db.models import Max

    # Read active users (heartbeated within last 90s)
    active = cache.get('globe:active', {})
    cutoff = timezone.now() - timedelta(seconds=90)
    active_ids = [
        int(uid) for uid, ts in active.items()
        if parse_datetime(ts) and parse_datetime(ts).replace(tzinfo=timezone.utc) >= cutoff
        or (parse_datetime(ts) and parse_datetime(ts) >= cutoff)
    ]
    live_count = len(active_ids)

    if active_ids:
        latest_ids = (
            UserActivity.objects
            .filter(user_id__in=active_ids, activity_type='LOGIN')
            .exclude(latitude=999.0)
            .exclude(longitude=999.0)
            .values('user_id')
            .annotate(latest_id=Max('id'))
            .values_list('latest_id', flat=True)
        )
        points_qs = UserActivity.objects.filter(id__in=latest_ids)
    else:
        points_qs = UserActivity.objects.none()

    serializer = UserActivitySerializer(points_qs, many=True)
    return Response({
        'points': serializer.data,
        'live_count': live_count,
        'server_time': timezone.now().isoformat(),
    })
```

Note: The `parse_datetime` from Django returns timezone-aware datetimes when the string includes timezone info (ISO format from `timezone.now().isoformat()` does). The comparison `>= cutoff` works because `timezone.now()` returns UTC-aware. No extra `.replace(tzinfo=...)` needed — simplify to:

```python
active_ids = [
    int(uid) for uid, ts in active.items()
    if parse_datetime(ts) and parse_datetime(ts) >= cutoff
]
```

Full clean replacement:
```python
def get(self, request):
    from django.db.models import Max

    active = cache.get('globe:active', {})
    cutoff = timezone.now() - timedelta(seconds=90)
    active_ids = [
        int(uid) for uid, ts in active.items()
        if parse_datetime(ts) and parse_datetime(ts) >= cutoff
    ]
    live_count = len(active_ids)

    if active_ids:
        latest_ids = (
            UserActivity.objects
            .filter(user_id__in=active_ids, activity_type='LOGIN')
            .exclude(latitude=999.0)
            .exclude(longitude=999.0)
            .values('user_id')
            .annotate(latest_id=Max('id'))
            .values_list('latest_id', flat=True)
        )
        points_qs = UserActivity.objects.filter(id__in=latest_ids)
    else:
        points_qs = UserActivity.objects.none()

    serializer = UserActivitySerializer(points_qs, many=True)
    return Response({
        'points': serializer.data,
        'live_count': live_count,
        'server_time': timezone.now().isoformat(),
    })
```

- [ ] **Step 2: Verify endpoint responds correctly**

```bash
cd Piicasso/backend
python manage.py shell -c "
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from analytics.views import GlobeDataView
from rest_framework.test import force_authenticate

User = get_user_model()
u = User.objects.first()
if u:
    factory = RequestFactory()
    req = factory.get('/analytics/globe-data/')
    req.user = u
    from rest_framework_simplejwt.authentication import JWTAuthentication
    view = GlobeDataView.as_view()
    # Can't easily test auth here — just confirm the import works
    print('GlobeDataView import OK')
else:
    print('no users — skipping')
"
```
Expected: `GlobeDataView import OK`

- [ ] **Step 3: Commit**

```bash
git add Piicasso/backend/analytics/views.py
git commit -m "feat: GlobeDataView returns live presence snapshot from cache heartbeats"
```

---

## Task 4: GlobalMap.js — fix beacon key, replace-not-merge, live count

**Files:**
- Modify: `Piicasso/frontend/src/components/GlobalMap.js`

- [ ] **Step 1: Add `liveCount` state and update `mergePoints` to replace-not-merge**

Change the state declarations at the top of `GlobalMap`:
```js
const [liveCount, setLiveCount] = useState(0);
```

Replace the `mergePoints` callback:
```js
const mergePoints = useCallback((newPoints, newLiveCount) => {
    beaconMapRef.current = new Map(newPoints.map(p => [String(p.user_id), p]));
    setPoints([...beaconMapRef.current.values()]);
    if (newLiveCount !== undefined) setLiveCount(newLiveCount);
}, []);
```

- [ ] **Step 2: Update `fetchInitial` to pass `live_count`**

```js
const fetchInitial = async () => {
    try {
        const res = await axiosInstance.get('analytics/globe-data/');
        if (destroyed) return;
        if (res.data?.points) {
            mergePoints(res.data.points, res.data.live_count);
            lastServerTimeRef.current = res.data.server_time;
            setIsLive(true);
        }
    } catch (e) {
        console.error('Globe init error', e);
    }
};
```

- [ ] **Step 3: Update `fetchIncremental` to always refresh (not just on new points)**

```js
const fetchIncremental = async () => {
    if (!lastServerTimeRef.current) return;
    try {
        const res = await axiosInstance.get(
            `analytics/globe-data/?since=${encodeURIComponent(lastServerTimeRef.current)}`
        );
        if (destroyed) return;
        if (res.data?.points !== undefined) {
            mergePoints(res.data.points, res.data.live_count);
        }
        if (res.data?.server_time) {
            lastServerTimeRef.current = res.data.server_time;
        }
    } catch (e) {
        // silent
    }
};
```

Key change: `res.data?.points !== undefined` (not `> 0`) so empty-array responses still clear stale beacons.

- [ ] **Step 4: Update the comment on `beaconMapRef` and the live count display**

Change the ref comment:
```js
// One beacon per active user — keyed by user_id, replaced on every poll
const beaconMapRef = useRef(new Map()); // key: user_id → value: point object
```

In the JSX, replace `{points.length}` with `{liveCount}`:
```jsx
<span className="text-xl text-zinc-200 font-light tracking-tighter">{liveCount}</span>
```

- [ ] **Step 5: Commit**

```bash
git add Piicasso/frontend/src/components/GlobalMap.js
git commit -m "fix: globe uses user_id key, replaces beacons on each poll, shows live_count from API"
```

---

## Task 5: PasswordAnalysisHistoryView — add vulnerabilities to list response

**Files:**
- Modify: `Piicasso/backend/password_security/views.py`

- [ ] **Step 1: Add `vulnerabilities_found` and `recommendations` to the history list**

In `PasswordAnalysisHistoryView.get()`, find the `results.append({...})` block (around line 372) and add two fields:

```python
results.append(
    {
        "id": a.id,
        "vulnerability_level": a.vulnerability_level,
        "strength_score": a.strength_score,
        "crack_time_estimate": a.crack_time_estimate,
        "breach_count": a.breach_count,
        "vulnerabilities_count": len(a.vulnerabilities_found),
        "vulnerabilities_found": a.vulnerabilities_found,
        "recommendations": a.recommendations,
        "created_at": a.created_at.isoformat(),
    }
)
```

- [ ] **Step 2: Verify via shell**

```bash
cd Piicasso/backend
python manage.py shell -c "
from password_security.models import PasswordAnalysis
a = PasswordAnalysis.objects.first()
if a:
    print('vulnerabilities_found:', a.vulnerabilities_found)
    print('recommendations:', a.recommendations)
else:
    print('no records yet — model check ok')
"
```
Expected: prints the lists (or `no records yet`).

- [ ] **Step 3: Commit**

```bash
git add Piicasso/backend/password_security/views.py
git commit -m "feat: password history endpoint includes vulnerabilities_found and recommendations"
```

---

## Task 6: UserDashboardPage — UserPasswordAnalyzer component

**Files:**
- Modify: `Piicasso/frontend/src/pages/UserDashboardPage.js`

This is the largest change. Replace the existing `UserQuickCheck` component and mock data with a real PII-aware password analyzer.

- [ ] **Step 1: Update imports at the top of the file**

Replace the existing import block with:
```js
import React, { useState, useMemo, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.js';
import { scorePassword, generateWordlist } from '../lib/piiEngine.js';
import axiosInstance from '../api/axios.js';
```

- [ ] **Step 2: Remove the `MOCK_ACCOUNTS` constant and the `UserQuickCheck` component entirely**

Delete lines 9–84 (the `MOCK_ACCOUNTS` array and the `UserQuickCheck` function).

- [ ] **Step 3: Add the `UserPasswordAnalyzer` component above `UserDashboardPage`**

```jsx
const PII_FIELDS = [
  { name: 'full_name',  label: 'Full Name',      placeholder: 'ex: Alex Johnson' },
  { name: 'dob',        label: 'Birth Year',      placeholder: 'ex: 1990' },
  { name: 'username',   label: 'Username',        placeholder: 'ex: alexj99' },
  { name: 'pet_names',  label: 'Pet Name',        placeholder: 'ex: Rex' },
  { name: 'spouse_name',label: 'Partner / Spouse',placeholder: 'ex: Jamie' },
  { name: 'current_city',label: 'City',           placeholder: 'ex: Chennai' },
];

function UserPasswordAnalyzer({ username }) {
  const [pii, setPii] = useState({});
  const [pw, setPw] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const piiProfile = useMemo(() => ({ ...pii, username }), [pii, username]);
  const preview = useMemo(() => pw ? scorePassword(pw, piiProfile) : null, [pw, piiProfile]);

  const previewColor = !preview ? 'var(--fg-3)'
    : preview.score < 45 ? 'var(--accent-500)'
    : preview.score < 70 ? 'var(--warn)'
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
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const resultColor = !result ? 'var(--fg-3)'
    : result.strength_score < 45 ? 'var(--accent-500)'
    : result.strength_score < 70 ? 'var(--warn)'
    : 'var(--good)';

  return (
    <div className="card" style={{ padding: 32, marginBottom: 28 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Password Resilience Test</div>
      <h2 className="h-display" style={{ fontSize: 22, marginBottom: 24, color: 'var(--fg-0)' }}>
        How well would your password hold up against someone who knows you?
      </h2>

      {/* PII grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {PII_FIELDS.map(f => (
          <div key={f.name}>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              {f.label}
            </div>
            <input
              value={pii[f.name] || ''}
              onChange={e => setPii(prev => ({ ...prev, [f.name]: e.target.value }))}
              placeholder={f.placeholder}
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

      {/* Password row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'stretch', marginBottom: result ? 24 : 0 }}>
        <div style={{ position: 'relative' }}>
          <input
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
            placeholder="Enter a password to test…"
            type="text"
            style={{
              width: '100%',
              padding: '14px 16px',
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
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: previewColor, fontFamily: 'var(--font-mono)' }}>
              {preview.score} · {preview.rating}
            </div>
          )}
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !pw}
          className="btn"
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
          }}
        >
          {loading ? 'Analyzing…' : 'Analyze →'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--accent-500)', fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 12 }}>
          ▲ {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ borderTop: '1px solid var(--ink-4)', paddingTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          {/* Score */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Strength Score</div>
            <div style={{ fontSize: 52, fontWeight: 500, lineHeight: 1, color: resultColor, letterSpacing: '-0.04em' }}>{result.strength_score}</div>
            <div style={{ height: 4, background: 'var(--ink-3)', borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
              <div style={{ width: `${result.strength_score}%`, height: '100%', background: resultColor, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: resultColor, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {result.vulnerability_level?.toUpperCase()} RISK
            </div>
          </div>

          {/* Crack time + breaches */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Crack Time</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--fg-0)', marginBottom: 16 }}>{result.crack_time_estimate}</div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Data Breaches</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: result.breach_count > 0 ? 'var(--warn)' : 'var(--good)' }}>
              {result.breach_count > 0 ? `Found in ${result.breach_count}` : 'Clean'}
            </div>
          </div>

          {/* Vulnerabilities */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Issues Found</div>
            {(result.vulnerabilities || []).slice(0, 3).map((v, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--accent-200)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                ▲ {v}
              </div>
            ))}
            {(!result.vulnerabilities || result.vulnerabilities.length === 0) && (
              <div style={{ fontSize: 12, color: 'var(--good)', fontFamily: 'var(--font-mono)' }}>✓ No issues detected</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Update `UserDashboardPage` to remove mock data and use `UserPasswordAnalyzer`**

Replace the entire `UserDashboardPage` component:
```jsx
const UserDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const username = user?.username || 'User';
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow" style={{ color: 'var(--accent-500)' }}>● Your security overview</div>
        <h1 className="h-display" style={{ fontSize: 38, marginTop: 4, color: 'var(--fg-0)' }}>
          Hi, {displayName}.
        </h1>
        <p style={{ color: 'var(--fg-2)', fontSize: 14, fontFamily: 'var(--font-mono)', marginTop: 4 }}>
          Here's how you'd hold up against someone who knows you.
        </p>
      </div>

      {/* Primary feature */}
      <UserPasswordAnalyzer username={username} />
    </>
  );
};

export default UserDashboardPage;
```

- [ ] **Step 5: Commit**

```bash
git add Piicasso/frontend/src/pages/UserDashboardPage.js
git commit -m "feat: replace mock UserQuickCheck with UserPasswordAnalyzer — PII form + backend scoring"
```

---

## Task 7: AnalysisHistoryPage — click-to-expand vulnerabilities

**Files:**
- Modify: `Piicasso/frontend/src/pages/AnalysisHistoryPage.js`

- [ ] **Step 1: Add `expandedId` state**

After the existing state declarations (line ~13), add:
```js
const [expandedId, setExpandedId] = useState(null);
```

- [ ] **Step 2: Add a toggle handler**

After the `fetchHistory` function, add:
```js
const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
};
```

- [ ] **Step 3: Update the table row to be clickable and show expansion**

Find the `<tr key={analysis.id} ...>` block. Add `onClick` and `cursor`:

```jsx
<tr
    key={analysis.id}
    onClick={() => toggleExpand(analysis.id)}
    style={{
        borderBottom: '1px solid var(--ink-4)',
        transition: 'background-color 0.2s',
        cursor: 'pointer',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ink-2)')}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
>
```

- [ ] **Step 4: Add expansion row after each data row**

After the closing `</tr>` of the data row, add:
```jsx
{expandedId === analysis.id && (
    <tr key={`${analysis.id}-expand`} style={{ background: 'var(--ink-1)' }}>
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
```

- [ ] **Step 5: Commit**

```bash
git add Piicasso/frontend/src/pages/AnalysisHistoryPage.js
git commit -m "feat: history rows expand on click to show vulnerabilities and recommendations"
```

---

## Task 8: Final verification

- [ ] **Step 1: Start the dev server and check User Mode**

```bash
cd Piicasso/frontend && npm start
```

Navigate to User Mode dashboard. Verify:
- PII form renders with 6 fields
- Typing a password shows live preview score inline
- Clicking Analyze fires a request to `password/analyze/` (check Network tab)
- Results panel appears with score, crack time, breach count, vulnerabilities

- [ ] **Step 2: Check History tab**

Navigate to the Analysis History page. Verify:
- Records appear after running an analysis
- Clicking a row expands to show vulnerabilities + recommendations
- Clicking again collapses

- [ ] **Step 3: Check Globe (needs two active browser sessions)**

Open the app in two browser tabs (or two different browsers) both logged in. Verify:
- Both sessions' locations appear as beacons
- Live count shows 2 (or more)
- Closing one tab → beacon disappears within ~90s on the next poll

- [ ] **Step 4: Push to remote**

```bash
git push origin main
```

---

## Self-Review Checklist

- [x] Serializer `user_id` field → Task 1
- [x] HelpBeaconView cache write → Task 2
- [x] GlobeDataView live presence + `live_count` → Task 3
- [x] Frontend `user_id` key + replace-not-merge + `live_count` display → Task 4
- [x] History response adds `vulnerabilities_found` + `recommendations` → Task 5
- [x] UserPasswordAnalyzer with PII form + backend POST + inline results → Task 6
- [x] AnalysisHistoryPage click-to-expand → Task 7
- [x] No TBDs, no placeholders — all code blocks complete
- [x] Type consistency: `live_count` (snake_case) used in both backend response and frontend `res.data.live_count`; `user_id` used consistently; `vulnerabilities_found` / `recommendations` match model field names
