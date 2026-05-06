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
| O2 | `handleDeleteAllData()` in SuperAdminPage has no backend endpoint | Implement `DELETE /api/admin/all/` if needed |
| O3 | FinancialRiskPage uses local simulated data | Wire to real backend if financial risk API is built |

---

**Last Updated**: 2026-05-06  
**Status**: Production-ready — all pages use DesignAppShell, all API calls verified correct
