# PIIcasso: Globe Live Presence + User Mode PII Password Test
**Date**: 2026-05-07  
**Status**: Approved

---

## Part 1 — Globe Live Presence Fix

### Problem
`UserActivitySerializer` excludes `description`, so `p.description` is `undefined` in the browser. Every `mergePoints` call writes to the same `undefined` key — all users collapse to one Map entry. Live count shows 1 regardless of how many users are online. The globe shows historical logins, not who is active right now.

### Goal
- Globe shows one beacon per user **currently online** (HELP heartbeat within last 90s)
- Beacon sits at the user's login location
- Live count = total active users (including those without GPS coordinates)
- Beacons disappear ~90s after a user closes the app

### Architecture

#### Backend

**`analytics/views.py` — `HelpBeaconView.post()`**  
On each `HELP` signal, update a shared cache dict:
```python
active = cache.get('globe:active', {})
active[str(request.user.id)] = timezone.now().isoformat()
cache.set('globe:active', active, timeout=3600)
```
TTL of 3600s on the dict itself; individual user entries are filtered by timestamp at read time.

**`analytics/views.py` — `GlobeDataView.get()`**  
Replace the current historical-login + description-dedup logic with:
1. Read `globe:active` dict from cache
2. Filter entries where timestamp >= now - 90s → `active_ids`
3. `live_count = len(active_ids)`
4. Fetch latest LOGIN `UserActivity` per active user ID (via `values('user_id').annotate(Max('id'))`) excluding sentinel coords (999.0)
5. Return `{ points: [...], live_count: N, server_time: ... }`

Both initial and incremental requests use the same logic — always returns current snapshot. The `since` query param is retained for API compatibility but the response is always the live set.

**`analytics/serializers.py` — `UserActivitySerializer`**  
Add `user_id` to `fields`:
```python
fields = ['id', 'user_id', 'activity_type', 'timestamp', 'latitude', 'longitude', 'color', 'intensity', 'city']
```
`user_id` is a numeric FK integer — no username or email is exposed.

#### Frontend

**`GlobalMap.js` — `mergePoints()`**  
- Key: `String(p.user_id)` instead of `p.description`
- On each poll (initial + incremental): **replace** the beaconMap entirely so stale users disappear:
  ```js
  beaconMapRef.current = new Map(newPoints.map(p => [String(p.user_id), p]));
  setPoints([...beaconMapRef.current.values()]);
  ```

**`GlobalMap.js` — Live count display**  
- Store `liveCount` in state, updated from `res.data.live_count`
- Display `liveCount` instead of `points.length`

---

## Part 2 — User Mode: PII Password Strength Test

### Problem
User Mode has a `UserQuickCheck` that only uses `username` as the PII profile and does no backend analysis. Mock account data is hardcoded. History page exists but is never populated because no analysis is ever saved.

### Goal
- Users enter their own PII and a password to test
- Backend scores the password against their PII and saves the result
- History tab auto-populates with past tests
- Clicking a history row reveals which vulnerabilities were found

### Architecture

#### Frontend — `UserDashboardPage.js`

Replace `UserQuickCheck` with a new inline `UserPasswordAnalyzer` component (defined in the same file).

**Layout**: single card with two columns:
- **Left**: 6-field PII form (Full Name, Birth Year, Username, Pet Name, Partner/Spouse, City) — enough to surface targeted patterns without overwhelming
- **Right**: password input + "Analyze" button + results panel

**Behavior**:
- As user types password: live client-side preview via `scorePassword(pw, piiProfile)` from `piiEngine.js` (instant, no network)
- On "Analyze" click: POST `{ password, pii_data }` to `password/analyze/`
- Results panel shows: score bar, vulnerability level badge, crack time, breach count, top 3 vulnerabilities from response

**State**: `piiData {}`, `password ''`, `result null`, `loading false`, `error ''`

No changes to routing — result is shown inline, not navigated away.

#### Backend — `password_security/views.py`

`PasswordAnalyzeView` already handles `{ password, pii_data }`, runs breach check, and saves `PasswordAnalysis` to DB. **No changes needed.**

`PasswordAnalysisHistoryView`: add `vulnerabilities_found` and `recommendations` to the per-entry dict so the frontend can show detail without a separate fetch:
```python
{
    "id": a.id,
    "vulnerability_level": a.vulnerability_level,
    "strength_score": a.strength_score,
    "crack_time_estimate": a.crack_time_estimate,
    "breach_count": a.breach_count,
    "vulnerabilities_count": len(a.vulnerabilities_found),
    "vulnerabilities_found": a.vulnerabilities_found,   # ADD
    "recommendations": a.recommendations,               # ADD
    "created_at": a.created_at.isoformat(),
}
```

#### Frontend — `AnalysisHistoryPage.js`

- Track `expandedId` state (null or analysis ID)
- Clicking a row toggles expansion: show `vulnerabilities_found` list + `recommendations` list inline below the row
- No new API call — data already in response

---

## Files Changed

| File | Change |
|------|--------|
| `backend/analytics/views.py` | HelpBeaconView writes heartbeat to cache; GlobeDataView returns live presence |
| `backend/analytics/serializers.py` | Add `user_id` to fields |
| `backend/password_security/views.py` | PasswordAnalysisHistoryView adds vulnerabilities_found + recommendations |
| `frontend/src/components/GlobalMap.js` | user_id key, replace-not-merge, live_count from API |
| `frontend/src/pages/UserDashboardPage.js` | Replace UserQuickCheck with UserPasswordAnalyzer |
| `frontend/src/pages/AnalysisHistoryPage.js` | Click-to-expand row with vulnerabilities + recommendations |

---

## Out of Scope
- Removing the mock "Your accounts" table (separate task)
- Security Mode TargetForm changes
- WebSocket-based real-time globe (polling every 30s is sufficient)
