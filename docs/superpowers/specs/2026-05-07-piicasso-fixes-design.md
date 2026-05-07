# PIIcasso Multi-Fix Design Spec
**Date:** 2026-05-07  
**Scope:** 11 targeted bug fixes and minor features across frontend and backend

---

## 1. Nav Links — Hash Anchor Fix

**Problem:** `MarketingNav.jsx` links to `/#features`, `/#solutions`, `/#pricing`, `/#blog`. LandingPage sections have no matching `id` attributes, so all hash links resolve to `#` (no-op scroll).

**Fix:** Add `id` props to the relevant `<Section>` containers in `LandingPage.js`:
- `id="features"` on the Features section
- `id="solutions"` on the SplitModes / Solutions section
- `id="pricing"` on the Pricing section
- `id="blog"` on the final CTA / testimonials section

No new pages needed. `Docs` already points to `/api` which works.

---

## 2. Run Extraction — Fallback Verification

**Problem:** "Main Run Extraction" fails when `GEMINI_API_KEY` is not set in production. Users see nothing instead of the local permutation wordlist.

**Root cause:** `generate_fallback_wordlist()` exists in `llm_handler.py` and is called by `call_gemini_api()` on exception. The fallback is already wired. Likely issue: `GEMINI_API_KEY` is missing in the production env, and the TargetForm UI may not surface the fallback results properly.

**Fix:**
- Verify `wordgen/views/generation.py` passes `pii_data` into `call_gemini_api()` so the fallback has data to work with.
- In `TargetForm.js`, ensure the response handler works regardless of whether results came from LLM or fallback — no conditional branching on source.
- Add a subtle "Generated offline" badge in TargetForm results when the response includes a `fallback: true` flag from the backend (add this flag to the generation view response when fallback is used).

---

## 3. "Under Development" Ribbon

**Problem:** Threat Intel, Target (Security Mode), and Leak Monitor (User Mode) are unfinished. Users reach these pages with no indication they're incomplete.

**Design:** A diagonal corner ribbon anchored top-right of the page body. The ribbon is CSS-only, position absolute, no JavaScript.

**Component:** `frontend/src/components/UnderDevRibbon.jsx`
```
Props: none
Renders: a position:absolute ribbon in the top-right corner of its nearest
         position:relative ancestor, reading "Under Development" in mono font.
```

**Usage:**
- `DarkWebPage.js` — wrap page root in `position: relative` container, render `<UnderDevRibbon />` (covers Threat Intel in Security mode and Leak Monitor in User mode)
- `NewOperationPage.js` — same pattern (covers Targets in Security mode)

**Style:** diagonal ribbon, 45° rotated, `var(--sec-500)` red background in security mode / `var(--usr-500)` cobalt in user mode. White mono text "UNDER DEVELOPMENT". Slight box shadow. No hover state.

---

## 4. Learn → Correct Route

**Problem:** `userItems` in `DesignAppShell.jsx` routes Learn to `/api` (ApiDocsPage), which is not user-mode themed and renders in red/broken colours.

**Fix:**
- Change Learn path from `/api` → `/user/learn` in `DesignAppShell.jsx` userItems.
- Create `frontend/src/pages/LearnPage.js` — a minimal, user-mode-themed page with a "Learning Hub — Coming Soon" banner. Uses `DesignAppShell` with `activeKey="learn"`.
- Add route `<Route path="learn" element={<LearnPage />} />` inside the `/user` nested route in `App.js`.

---

## 5. Security Dashboard — Globe Top, Matrix Bottom

**Problem:** In `SecurityDashboardPage.js` Side Quests panel, Profiling Matrix renders above Globe (Geospatial Routing). User wants Globe on top, Matrix below.

**Fix:** Swap the two JSX blocks in the `sideQuestsOpen` section — Geospatial Routing (Globe) first, Profiling Matrix second. No logic changes needed.

---

## 6. Mode Switcher Order — User First

**Problem:** `ModePill.jsx` renders `['security', 'Security', ...]` then `['user', 'User', ...]`, displaying "Security | User" on the landing page. User wants "User | Security".

**Fix:**
- `ModePill.jsx`: swap array order — `user` entry first, `security` entry second.
- `ModeSwitcher.js` dropdown: swap `modes` array — `user` first, `security` second.

---

## 7. Inbox — Send Message Fix

**Problem:** Regular users cannot send messages. Root cause: `MessageViewSet.perform_create()` calls `User.objects.filter(is_superuser=True).first()` — returns `None` when no admin account exists, raising a `ValidationError`.

**Primary fix:** Creating the admin account (issue #9) resolves the `None` admin lookup.

**Secondary fix:** Verify `InboxPage.js` `sendMessage` function POSTs to the correct endpoint and includes the right payload for both superuser (needs `recipient_id`) and regular user (no recipient needed) flows. Confirm `operations/messages/` URL is registered in `operations/urls.py` with the router.

---

## 8. Admin Promotion

**Problem:** SuperAdminPage has no way to promote a regular user to admin or demote an admin to user. `SuperAdminView.post()` handles only `block`, `unblock`, `change_password`.

**Backend changes (`wordgen/views/admin.py`):**
- Add `promote_admin` action: sets `target_user.is_superuser = True`, `target_user.is_staff = True`.
- Add `demote_admin` action: sets `is_superuser = False`, `is_staff = False`. Blocked if target is the currently authenticated user (prevent self-lockout). Blocked if target is the last superuser.
- Both actions blocked if target is the requesting user.

**Frontend changes (`SuperAdminPage.js`):**
- Add a "Crown" (`KeyRound` or `ShieldAlert`) icon button in the user table actions row.
- If user `is_superuser`: show "Demote" button (yellow). If not: show "Promote" button (green).
- Confirmation dialog before action.

---

## 9. Admin Account Creation

**Problem:** No admin account exists. Blocks inbox, admin dashboard access, and user promotion.

**Fix:** Create management command `wordgen/management/commands/ensure_admin.py`.

**Behaviour:** Idempotent — creates the account if it doesn't exist, updates password and flags if it does. Does not overwrite email-verified Google OAuth accounts.

**Account details:**
- Email: yokeshkumar1704@gmail.com
- Username: Yokesh
- Password: Thisisourteamproject
- `is_superuser = True`, `is_staff = True`, `is_active = True`

Run: `python manage.py ensure_admin`

---

## 10. Admin Dashboard — Show Admin Name

**Problem:** `SuperAdminPage.js` sidebar shows the generic label "System Admin" with no personalization.

**Fix:** In the sidebar header section of `SuperAdminPage.js`, display:
```
SYSTEM ADMIN
{user.username}
{user.email}
```
`user` is already available from `AuthContext`. No additional API call needed.

---

## 11. OAuth Speed — Cache Google Certificates

**Problem:** `GoogleLoginView` creates `google_requests.Request()` (new `requests.Session`) on every call. Google's public key certificates are fetched fresh from the network each time, adding 300–800ms per OAuth login. Users must retry 3–4 times due to timeout variability.

**Fix (`wordgen/auth_views.py`):**
- Create a module-level `requests.Session` instance.
- Pass it as the `request` argument to `id_token.verify_oauth2_token()` instead of creating a new `Request()` per call.
- If `cachecontrol` is installed (it should be as a transitive dep of `google-auth`), the session automatically caches Google's JWK certificates using HTTP cache headers, making subsequent logins near-instant.

```python
# Module-level — created once, reused across requests
_google_session = google_requests.Request(session=requests.Session())
```

---

## Architecture Notes

- All frontend changes are isolated to single files (no shared state changes).
- `UnderDevRibbon` is the only new reusable component; it's consumed in exactly 2 files.
- Backend management command is idempotent — safe to run on every deploy.
- No database migrations required for any of these fixes.
- No breaking changes to existing API contracts.

---

## Files to Change

### Frontend
| File | Change |
|------|--------|
| `pages/LandingPage.js` | Add `id` props to 4 sections |
| `components/design/MarketingNav.jsx` | No change needed (already has correct hrefs) |
| `components/UnderDevRibbon.jsx` | **NEW** — diagonal ribbon component |
| `pages/DarkWebPage.js` | Import and render `<UnderDevRibbon />` |
| `pages/NewOperationPage.js` | Import and render `<UnderDevRibbon />` |
| `pages/LearnPage.js` | **NEW** — themed coming soon page |
| `pages/SecurityDashboardPage.js` | Swap Globe / Matrix order |
| `components/design/ModePill.jsx` | Swap mode array order |
| `components/ModeSwitcher.js` | Swap modes array order |
| `components/design/dashboard/DesignAppShell.jsx` | Fix Learn path, add Under Dev marker to 3 nav items |
| `pages/SuperAdminPage.js` | Show admin name, add promote/demote buttons |
| `pages/InboxPage.js` | Verify send endpoint |
| `App.js` | Add `/user/learn` route |

### Backend
| File | Change |
|------|--------|
| `wordgen/auth_views.py` | Module-level Google session for cert caching |
| `wordgen/views/admin.py` | Add promote_admin / demote_admin actions |
| `wordgen/views/generation.py` | Add `fallback: true` flag in response when offline |
| `wordgen/management/commands/ensure_admin.py` | **NEW** — idempotent admin creation command |
