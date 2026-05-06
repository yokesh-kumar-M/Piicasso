# PIIcasso — Project Status

> All Phases A–F complete. All TODOs resolved. Project is production-ready.

---

## ✅ All Tasks Complete

| # | Task | Status |
|---|------|--------|
| T6 | NewOperationPage.js — Wrap with DesignAppShell | ✅ |
| T7 | DesignAppShell.jsx — Wire notifications to real API (`GET /api/operations/notifications/`) | ✅ |
| T8 | InboxPage.js — Fix messages endpoint (`messages/` → `operations/messages/`) | ✅ |
| T9 | SuperAdminPage.js — Replace Navbar with DesignAppShell | ✅ |
| T10 | ci.yml — Fix FIELD_ENCRYPTION_KEY to valid Fernet format | ✅ |
| T11 | settings.py — Remove hardcoded FIREBASE_PROJECT_ID fallback | ✅ |
| T12 | `frontend/.env.example` — Created with REACT_APP_API_URL | ✅ |
| T13 | `backend/.env.example` — Added SENTRY_DSN | ✅ |
| T14 | piicasso.md route table — Corrected (wordgen at `/api/`, not `/api/wordgen/`) | ✅ |

---

## Route Table (Verified Correct)

> **Note:** The `wordgen` app is mounted at `api/` (not `api/wordgen/`) in `backend/urls.py`.
> The `operations` app is at `api/operations/`, `password_security` at `api/password/`, `core` at `api/user/`.

### Frontend Routes → Backend API

| Frontend Path | Axios Call | Resolves To | Handler |
|---|---|---|---|
| `/dashboard` | — | — | Security dashboard (local state) |
| `/user/dashboard` | — | — | User dashboard (local state) |
| `/operation/new` | `POST submit/` | `POST /api/submit/` | `PiiSubmitView` (wordgen) |
| `/operation/:id/result` | `GET history/:id/` | `GET /api/history/:id/` | `HistoryView` (wordgen) |
| `/history` | `GET password/history/` | `GET /api/password/history/` | `PasswordAnalysisHistoryView` |
| `/saved` | `GET history/?page_size=200` | `GET /api/history/` | `HistoryView` — filtered by saved IDs in localStorage |
| `/darkweb` | `POST operations/breach-search/` | `POST /api/operations/breach-search/` | `BreachSearchView` |
| `/financial-risk` | — | — | Local simulated data (no backend) |
| `/inbox` | `GET/POST operations/messages/` | `GET/POST /api/operations/messages/` | `MessageViewSet` |
| `/profile` | `GET profile/` | `GET /api/profile/` | `user_profile` (wordgen) |
| `/system-admin` | `GET super-admin/` | `GET /api/super-admin/` | `super_admin_view` (wordgen) |
| `/system-admin` | `GET admin/users/` | `GET /api/admin/users/` | `admin_users_list` (wordgen) |
| `/system-admin` | `GET/POST operations/settings/` | `GET/POST /api/operations/settings/` | `SystemSettingsView` |
| `/api` | — | — | API docs (standalone page) |

### Auth Routes

| Frontend Path | Axios Call | Resolves To |
|---|---|---|
| `/login` | `POST user/token/` | `POST /api/user/token/` (core app) |
| `/register` | `POST user/register/` | `POST /api/user/register/` (core app) |
| `/forgot-password` | `POST auth/password/reset/` | `POST /api/auth/password/reset/` (wordgen) |
| `/forgot-password` (verify) | `POST auth/password/reset/verify/` | `POST /api/auth/password/reset/verify/` |
| Token refresh (auto) | `POST user/token/refresh/` | `POST /api/user/token/refresh/` (core app) |
| Keep-alive | — | `GET /api/health/` (GitHub Actions, every 10 min) |

---

## Architecture

- **Frontend**: React 18, React Router v6, CSS variables design system, DesignAppShell wrapper
- **Backend**: Django 4.x, DRF, JWT auth (simplejwt), PostgreSQL
- **Auth**: JWT with refresh token rotation, axios interceptor handles 401→refresh→retry
- **Notifications**: `Notification` model → `GET /api/operations/notifications/` → DesignAppShell inbox
- **Deployment**: Vercel (frontend), Render (backend)
- **Keep-alive**: GitHub Actions pings `GET /api/health/` every 14 min to prevent Render sleep

---

## P3 — Manual / Optional (Not Blocking)

| # | Issue | Action |
|---|---|---|
| 12 | Remove 7 `REACT_APP_FIREBASE_*` env vars from Vercel | Manual: Vercel → Settings → Env Vars → Delete |
| 13 | `handleDeleteAllData()` needs backend endpoint | Optional: Implement `DELETE /api/super-admin/all/` |

---

**Last Updated**: 2026-05-06
**Status**: Production-ready
