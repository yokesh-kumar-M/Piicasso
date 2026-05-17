# PIIcasso — Project Status

> All phases complete. Application is production-ready and deployed.

---

## Production URLs

| Service  | URL                                          |
|----------|----------------------------------------------|
| Frontend | https://pii-casso.vercel.app                 |
| Backend  | https://core-engine-woeg.onrender.com        |
| API Docs | https://core-engine-woeg.onrender.com/api/docs/ (admin only) |
| Health   | https://core-engine-woeg.onrender.com/api/health/ |

---

## Stack

| Layer      | Tech                                                        |
|------------|-------------------------------------------------------------|
| Frontend   | React 18, React Router v6, CSS variables design system      |
| Backend    | Django 4.x, DRF, simplejwt, PostgreSQL                      |
| Auth       | JWT (access 15 min, refresh 1 day) + Google OAuth           |
| Deployment | Vercel (frontend), Render (backend)                         |
| CI/CD      | GitHub Actions — tests + keep-alive pings every 10 min      |
| Monitoring | Sentry (optional), django-prometheus at `/metrics`          |

---

## Frontend Routes (Verified from App.js)

| Path                  | Page                  | Auth Required |
|-----------------------|-----------------------|---------------|
| `/`                   | LandingPage           | No            |
| `/api`                | ApiDocsPage           | No            |
| `/login`              | LoginPage             | No            |
| `/register`           | RegisterPage          | No            |
| `/forgot-password`    | ForgotPasswordPage    | No            |
| `/security/dashboard` | SecurityDashboardPage | Yes           |
| `/operation`          | NewOperationPage      | Yes           |
| `/result`             | ResultPage            | Yes           |
| `/workspace`          | SavedPage             | Yes           |
| `/profile`            | ProfilePage           | Yes           |
| `/teams`              | TeamsPage             | Yes           |
| `/darkweb`            | DarkWebPage           | Yes           |
| `/inbox`              | InboxPage             | Yes           |
| `/risk`               | FinancialRiskPage     | Yes           |
| `/system-admin`       | SuperAdminPage        | Yes (admin)   |
| `/user/dashboard`     | UserDashboardPage     | Yes           |
| `/user/history`       | AnalysisHistoryPage   | Yes           |

---

## Backend API Routes (Verified from urls.py)

### Wordgen app — mounted at `api/`

| Method | Endpoint               | Handler                      |
|--------|------------------------|------------------------------|
| POST   | `api/submit/`          | PiiSubmitView                |
| GET    | `api/history/`         | HistoryView (list)           |
| GET    | `api/history/:id/`     | HistoryView (detail)         |
| GET    | `api/profile/`         | user_profile                 |
| GET    | `api/super-admin/`     | super_admin_view             |
| GET    | `api/admin/users/`     | admin_users_list             |
| DELETE | `api/admin/users/:id/` | admin delete user            |
| POST   | `api/auth/password/reset/` | password reset request   |
| POST   | `api/auth/password/reset/verify/` | OTP verify + set  |
| GET    | `api/health/`          | health check                 |

### Core app — mounted at `api/user/`

| Method | Endpoint                | Handler              |
|--------|-------------------------|----------------------|
| POST   | `api/user/token/`       | JWT obtain pair      |
| POST   | `api/user/token/refresh/` | JWT refresh        |
| POST   | `api/user/register/`    | user registration    |

### Operations app — mounted at `api/operations/`

| Method       | Endpoint                           | Handler            |
|--------------|------------------------------------|--------------------|
| POST         | `api/operations/breach-search/`    | BreachSearchView   |
| GET/POST     | `api/operations/messages/`         | MessageViewSet     |
| DELETE       | `api/operations/messages/:id/`     | MessageViewSet     |
| GET/POST     | `api/operations/settings/`         | SystemSettingsView |
| GET          | `api/operations/notifications/`    | NotificationsView  |

### Password Security app — mounted at `api/password/`

| Method | Endpoint                | Handler                       |
|--------|-------------------------|-------------------------------|
| GET    | `api/password/history/` | PasswordAnalysisHistoryView   |

### Teams app — mounted at `api/teams/`

| Method | Endpoint      | Handler      |
|--------|---------------|--------------|
| GET    | `api/teams/`  | TeamViewSet  |

### Analytics app — mounted at `api/analytics/`

| Method | Endpoint              | Handler       |
|--------|-----------------------|---------------|
| POST   | `api/analytics/beacon/` | beacon view |

---

## Frontend → Backend Call Map (Verified)

| Page                  | Axios Call                              | Resolves To                               |
|-----------------------|-----------------------------------------|-------------------------------------------|
| `/security/dashboard` | local state only                        | —                                         |
| `/user/dashboard`     | local state only                        | —                                         |
| `/operation`          | `POST submit/`                          | `POST /api/submit/`                       |
| `/result`             | `GET history/:id/`                      | `GET /api/history/:id/`                   |
| `/user/history`       | `GET password/history/`                 | `GET /api/password/history/`              |
| `/workspace`          | `GET history/?page_size=200`            | `GET /api/history/` (localStorage filter) |
| `/darkweb`            | `POST operations/breach-search/`        | `POST /api/operations/breach-search/`     |
| `/risk`               | local simulated data                    | no backend                                |
| `/inbox`              | `GET/POST/DELETE operations/messages/`  | `GET/POST/DELETE /api/operations/messages/` |
| `/profile`            | `GET profile/`                          | `GET /api/profile/`                       |
| `/system-admin`       | `GET super-admin/`                      | `GET /api/super-admin/`                   |
| `/system-admin`       | `GET admin/users/`                      | `GET /api/admin/users/`                   |
| `/system-admin`       | `GET/POST operations/settings/`         | `GET/POST /api/operations/settings/`      |
| DesignAppShell        | `GET operations/notifications/`         | `GET /api/operations/notifications/`      |
| App.js (beacon)       | `POST analytics/beacon/`               | `POST /api/analytics/beacon/`             |

---

## Auth Flow

1. Login → `POST /api/user/token/` → access + refresh tokens stored in localStorage
2. Every request → `Authorization: Bearer <access_token>` header
3. 401 response → axios interceptor automatically calls `POST /api/user/token/refresh/`
4. Refresh succeeds → original request retried with new token
5. Refresh fails → user logged out, redirected to `/login`
6. Google OAuth → `GoogleOAuthProvider` wraps app, client ID from `REACT_APP_GOOGLE_CLIENT_ID`

---

## Environment Variables

### Backend (`Piicasso/backend/.env`)

```
DJANGO_SECRET_KEY=          # required in production
DEBUG=False
ENV=production
ALLOWED_HOSTS=              # comma-separated, no spaces
DATABASE_URL=               # postgresql://...
REDIS_URL=                  # optional
CORS_ALLOWED_ORIGINS=       # comma-separated frontend origins
ACCESS_TOKEN_MINUTES=15
REFRESH_TOKEN_DAYS=1
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=
MAX_WORDLIST_SIZE=1000
GEMINI_API_KEY=             # Google AI Studio
HIBP_API_KEY=               # HaveIBeenPwned API v3
DATA_RETENTION_DAYS=30
TIME_ZONE=Asia/Kolkata
GOOGLE_CLIENT_ID=           # Google OAuth
FIELD_ENCRYPTION_KEY=       # Fernet key — python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
SENTRY_DSN=                 # optional, leave blank to disable
```

### Frontend (`Piicasso/frontend/.env.local`)

```
REACT_APP_API_URL=https://core-engine-woeg.onrender.com/api/
REACT_APP_GOOGLE_CLIENT_ID=   # same Google OAuth client ID
```

---

## CI/CD

| Workflow       | Trigger           | What it does                                               |
|----------------|-------------------|------------------------------------------------------------|
| `ci.yml`       | push, PR          | Backend tests (Django + Postgres), frontend build + tests  |
| `keep-alive.yml` | every 10 min    | Pings backend `/api/health/`, Vercel frontend, Supabase    |

CI env vars needed in GitHub Secrets:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` (for keep-alive ping)

---

## Completed Tasks

| # | Task | Status |
|---|------|--------|
| T1 | DesignAppShell — Wire notifications to `GET /api/operations/notifications/` | ✅ |
| T2 | InboxPage — Fix messages endpoint (`messages/` → `operations/messages/`) | ✅ |
| T3 | SuperAdminPage — Replace Navbar with DesignAppShell | ✅ |
| T4 | ci.yml — Fix FIELD_ENCRYPTION_KEY to valid 44-char Fernet base64 | ✅ |
| T5 | settings.py — Remove hardcoded FIREBASE_PROJECT_ID fallback | ✅ |
| T6 | `frontend/.env.example` — Created with all required vars | ✅ |
| T7 | `backend/.env.example` — Added SENTRY_DSN and HIBP_API_KEY | ✅ |
| T8 | piicasso.md — Corrected route table (all paths verified from source) | ✅ |
| T9 | SuperAdminPage admin endpoint paths corrected | ✅ |
| F1 | Navbar.js — Fix "Intel DB" nav link (`/dashboard` → `/darkweb`) | ✅ |
| F2 | UserModeLayout.js — Replace old Navbar with DesignAppShell | ✅ |
| F3 | UserModeLayout.js — Remove duplicate custom sidebar (handled by DesignAppShell) | ✅ |

---

## Optional / Not Blocking

| # | Issue | Action |
|---|-------|--------|
| O1 | Remove `REACT_APP_FIREBASE_*` vars from Vercel dashboard | Manual: Vercel → Settings → Env Vars → Delete |

---

## 2026-05-17 — Refinement Pass (this session)

| # | Area | Change |
|---|------|--------|
| R1 | `operations/views.py` BreachSearchView | Added missing `re` import; removed undefined `internal_count`; cleaned dead `safe_display` var |
| R2 | `wordgen/views/admin.py` SuperAdminView | Fixed broken `Count("generationhistory")` annotation → `generation_history` (matches the `related_name` on `GenerationHistory.user`) |
| R3 | `wordgen/urls.py` | Mounted password reset endpoints at `api/auth/password/reset/[verify/]` so the frontend `ForgotPasswordPage` and backend tests stop 404-ing |
| R4 | `password_security` model + migration 0003 | Switched `PasswordAnalysis.pii_data` to `EncryptedJSONField(null=True, blank=True)` and added an `AlterField` migration so SQLite/Postgres no longer reject Fernet ciphertext via `JSON_VALID` CHECK constraints |
| R5 | `DesignAppShell.jsx` | Notifications mark-all-read now POSTs `{action:"mark_all_read"}` (matches `NotificationListView.post`) and the inbox dropdown polls every 30s |
| R6 | `wordgen/views/admin.py` + frontend `SuperAdminPage` | New `POST /api/admin/purge-all/` endpoint wired to the danger-zone button; requires `confirm: "DELETE ALL DATA"` payload, returns per-table counts and writes a `CRITICAL` SystemLog entry |
| R7 | `operations/views.py` + `operations/urls.py` | New `GET /api/operations/financial-risk/` that derives a real CTEM snapshot from the authenticated user's `PasswordAnalysis` + `GenerationHistory` data |
| R8 | `FinancialRiskPage.js` | Rebuilt to consume `/financial-risk/` — real exposure totals, severity badge, trajectory, doughnut breakdown, and dynamic recommendations |
| R9 | `LearnPage.js` | Replaced the "Coming Soon" placeholder with a full 5-topic learning hub (PII, password resilience, breach monitoring, engine workflow, data handling) |
| R10 | `UserDashboardPage.js` | Added a real stat grid (generations, scans, unread messages, last activity) and a recent-activity panel sourced from `password/activity/` |
| R11 | `UserModeLayout.js` | Added `/user/learn` → `learn` active-key mapping so the sidebar highlights correctly |
| R12 | `InboxPage.js` | Threads now hit `messages/` (the admin-aware `admin_message_view`) instead of the unfiltered `operations/messages/` ViewSet; admin sends use `{recipient_id, content}` |
| R13 | `wordgen/views/__init__.py` | Re-exported `build_prompt`, `call_gemini_api`, `score_wordlist` and `admin_purge_all` to keep import paths stable for tests and external callers |
| R14 | `wordgen/tests.py` PiiSubmit | Updated the mock target to `wordgen.llm_handler.call_gemini_api` and corrected the expected response shape so the suite reflects the current sync `PiiSubmitView` API |
| R15 | `wordgen/views/generation.py` | Wordlist-generated notifications now link to `/workspace` (the existing route) instead of the dead `/dashboard` path |

After the pass: **70 / 70 Django tests green**, **CRA production build green** (warnings only — unused imports), all DesignAppShell pages exercised manually via the build artefacts.

**Last Updated**: 2026-05-17
**Status**: Production-ready — under-development pages (Financial Risk, Learn) now ship with real content/data; all critical backend bugs surfaced by the test suite are resolved
