# PIIcasso — Project Documentation

> Last Updated: April 2026
> Version: 3.0.0

---

## Table of Contents

1. [Project Overview & Core Idea](#1-project-overview--core-idea)
2. [Repository Structure](#2-repository-structure)
3. [Architecture](#3-architecture)
4. [Backend Apps Reference](#4-backend-apps-reference)
5. [API Endpoints Reference](#5-api-endpoints-reference)
6. [Frontend Routes & Components](#6-frontend-routes--components)
7. [Database Models](#7-database-models)
8. [PIIlogger — Separate Logging Service](#8-piilogger--separate-logging-service)
9. [Deployment](#9-deployment)
10. [Environment Variables](#10-environment-variables)
11. [Development Setup](#11-development-setup)
12. [Security Model](#12-security-model)

---

## 1. Project Overview & Core Idea

**PIIcasso** is a cybersecurity-focused web platform with two primary capabilities:

### 🔐 Security Mode — Wordlist Generation (Core Feature)
A professional tool for security researchers and penetration testers. Users enter Personally Identifiable Information (PII) about a target, and PIIcasso uses **Google Gemini AI** to generate a highly targeted, intelligent password wordlist. The wordlist is also cross-referenced with common password databases (RockYou). The output can be exported as a `.txt` file or a PDF threat report.

**Target Users**: Security professionals, red teamers, CTF participants.

### 🛡️ User Mode — Password Vulnerability Checker
A consumer-facing feature that lets ordinary users check whether their passwords are PII-derived and therefore dangerously weak. It explains *why* a password is vulnerable rather than just giving a strength score.

**Target Users**: General public, enterprises to train employees.

### Design Philosophy
- **Red/Black hacker aesthetic** — consistent across both modes
- **Dual-mode application** — same codebase, different experience per mode
- **AI-powered** — Gemini generates contextual wordlists, not just permutations
- **Privacy-first** — PII is not stored permanently, respects data retention policies

---

## 2. Repository Structure

```
PIIcasso/                          ← Repository Root
│
├── Piicasso/                      ← Main Application
│   ├── backend/                   ← Django REST API
│   │   ├── backend/               ← Django project (settings, urls, celery)
│   │   ├── wordgen/               ← Core: auth, wordlist generation, middleware
│   │   ├── generator/             ← GenerationHistory model & endpoints
│   │   ├── operations/            ← SystemLogs, Messages, Notifications
│   │   ├── teams/                 ← Team management & collaboration
│   │   ├── analytics/             ← Activity tracking & globe data
│   │   ├── core/                  ← User profile & stats
│   │   ├── password_security/     ← Password analysis & breach checking
│   │   ├── manage.py
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   ├── start.sh               ← Production startup script
│   │   ├── start-celery.sh        ← Celery worker startup
│   │   ├── piilogger_handler.py   ← Sends logs to external PIIlogger service
│   │   ├── .env                   ← Local dev env (NOT committed)
│   │   └── .env.example           ← Template for env vars
│   │
│   ├── frontend/                  ← React Application
│   │   ├── src/
│   │   │   ├── pages/             ← Page-level components
│   │   │   ├── components/        ← Reusable UI components
│   │   │   ├── context/           ← React Context (Auth)
│   │   │   ├── api/               ← Axios config & API calls
│   │   │   └── utils/             ← Utility functions
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── .env
│   │
│   ├── nginx/                     ← Nginx config for production
│   ├── prometheus/                ← Prometheus metrics config
│   ├── promtail/                  ← Promtail log shipping config
│   └── docker-compose.yml         ← Full local stack orchestration
│
├── render.yaml                    ← Render deployment config
├── docker-compose.yml             ← Root dev compose (backend + frontend + redis)
├── .gitignore
├── .gitattributes
└── piicasso.md                    ← This file

─── SEPARATE PROJECTS (not in this repo) ────────────────────────────────────
Django/piilogger/                  ← PIIlogger standalone app (own repo/folder)
```

---

## 3. Architecture

### 3.1 System Overview

```
                        ┌─────────────────────────────────┐
                        │      PIIcasso Platform           │
                        └──────────────┬──────────────────┘
                                       │
              ┌────────────────────────┼───────────────────────┐
              │                        │                       │
              ▼                        ▼                       ▼
   ┌─────────────────┐      ┌─────────────────┐    ┌─────────────────┐
   │  React Frontend  │      │  Django Backend  │    │   PIIlogger     │
   │  (Vercel)        │◄────►│   (Render)       │───►│  (Render)       │
   │  Port: 3000      │      │   Port: 8000     │    │  Port: 4000     │
   └─────────────────┘      └────────┬─────────┘    └─────────────────┘
                                      │                (Separate App)
                             ┌────────┼────────┐
                             │                 │
                             ▼                 ▼
                    ┌──────────────┐  ┌──────────────┐
                    │  PostgreSQL  │  │    Redis     │
                    │  (Supabase)  │  │  (Render)    │
                    └──────────────┘  └──────────────┘
```

### 3.2 Authentication Flow

```
User → Login Page
     ├── Email/Password → POST /api/token/    → JWT (access + refresh)
     └── Google OAuth   → POST /api/auth/google/ → Firebase verify → JWT

JWT stored in: localStorage
Token refresh: Automatic via axios interceptor on 401
```

### 3.3 Wordlist Generation Flow

```
1. User submits PII form (TargetForm)
2. POST /api/pii/submit/ with PII JSON
3. Backend:
   a. Validates & rate-limits (10/hour)
   b. Builds Gemini AI prompt
   c. Calls Google Gemini API
   d. Merges with RockYou common patterns
   e. Saves to GenerationHistory
4. Returns wordlist JSON
5. Frontend: Download as .txt or PDF report
```

### 3.4 Dual-Mode Flow

```
Login Success
     └── Mode Selection Modal
          ├── Security Mode → /security/dashboard (wordlist tools)
          └── User Mode     → /user/dashboard     (password checker)
```

---

## 4. Backend Apps Reference

| App | Purpose | Key Models |
|-----|---------|------------|
| `wordgen` | Core: auth views, wordlist generation, middleware, LLM handler | (none — uses Django User) |
| `generator` | Generation history storage | `GenerationHistory` |
| `operations` | System logs, admin messages, notifications | `SystemLog`, `Message`, `Notification` |
| `teams` | Team creation, membership, collaboration | `Team`, `TeamMembership` |
| `analytics` | User activity tracking, globe visualization data | `ActivityLog` |
| `core` | User profile, stats, superadmin panel | (extends Django User) |
| `password_security` | Password vulnerability analysis, breach checking | `PasswordAnalysis` |
| `backend` | Project settings, URLs, Celery config, middleware base | — |

---

## 5. API Endpoints Reference

### 5.1 Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/token/` | No | Login → returns JWT access + refresh |
| POST | `/api/token/refresh/` | No | Refresh access token |
| POST | `/api/auth/google/` | No | Google OAuth login via Firebase |
| POST | `/api/register/` | No | User registration |
| POST | `/api/logout/` | Yes | Blacklist refresh token |

### 5.2 User & Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/PUT | `/api/user/profile/` | Yes | Get/Update user profile |
| GET | `/api/user/stats/` | Yes | Get user generation stats |
| GET | `/api/user/preferences/` | Yes | Get mode preferences |
| PUT | `/api/user/preferences/` | Yes | Set default mode |

### 5.3 Wordlist Generation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/pii/submit/` | Yes | Submit PII → Generate wordlist |
| GET | `/api/history/` | Yes | Generation history (paginated) |
| DELETE | `/api/history/<id>/` | Yes | Delete a history entry |
| GET | `/api/download/wordlist/<id>/` | Yes | Download wordlist as .txt |
| GET | `/api/download/report/<id>/` | Yes | Download PDF threat report |
| GET | `/api/history/export/` | Yes | Export all history as CSV |

### 5.4 Password Security

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/password/analyze/` | Yes | Analyze password vulnerability |
| GET | `/api/password/history/` | Yes | Get analysis history |
| POST | `/api/breach/check/` | Yes | Check HaveIBeenPwned breach status |

### 5.5 Teams

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/POST | `/api/teams/` | Yes | List / Create teams |
| GET/PUT/DELETE | `/api/teams/<id>/` | Yes | Team detail / update / delete |
| POST | `/api/teams/<id>/join/` | Yes | Join a team via invite code |
| POST | `/api/teams/<id>/leave/` | Yes | Leave a team |

### 5.6 Operations & Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/operations/notifications/` | Yes | Get user notifications |
| POST | `/api/operations/notifications/` | Yes | Mark notifications as read |
| GET/POST | `/api/operations/messages/` | Admin | Admin messaging |
| GET | `/api/system/logs/` | Admin | System log viewer |
| GET/POST | `/api/superadmin/` | Superuser | Admin dashboard + actions |
| DELETE | `/api/superadmin/?user_id=` | Superuser | Delete a user |

### 5.7 Terminal Simulation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/terminal/execute/` | Yes | Execute simulated terminal command |

### 5.8 Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics/globe/` | Yes | Globe activity data |
| GET | `/api/analytics/activity/` | Yes | User activity feed |

### 5.9 System

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health/` | No | Health check (used by load balancer) |
| GET | `/metrics` | No | Prometheus metrics endpoint |

---

## 6. Frontend Routes & Components

### 6.1 Public Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `HomePage` | Landing page; shows hero if logged out, dashboard if logged in |
| `/login` | `LoginPage` | JWT + Google OAuth login |
| `/register` | `RegisterPage` | New user registration |
| `/forgot-password` | `ForgotPasswordPage` | Password reset request |

### 6.2 Protected Routes (Auth Required)

| Route | Component | Description |
|-------|-----------|-------------|
| `/profile` | `ProfilePage` | User profile & settings |
| `/teams` | `TeamsPage` | Team management |
| `/dashboard` | `DashboardPage` | Generation history grid |
| `/workspace` | `SavedPage` | Saved wordlists |
| `/darkweb` | `DarkWebPage` | Breach search by email |
| `/operation` | `NewOperationPage` | Simulated terminal interface |
| `/result` | `ResultPage` | Generation result view |
| `/inbox` | `InboxPage` | Admin messages & inbox |
| `/system-admin` | `SuperAdminPage` | Admin panel (superuser only) |

### 6.3 Mode Routes (Dual-Mode Architecture)

| Route | Component | Description |
|-------|-----------|-------------|
| `/mode-select` | `ModeSelectionPage` | Mode picker shown post-login |
| `/user/dashboard` | `PasswordCheckerPage` | User Mode: password vulnerability checker |
| `/user/history` | `AnalysisHistoryPage` | User Mode: past analyses |
| `/security/dashboard` | `DashboardPage` (reused) | Security Mode: generation dashboard |
| `/security/operation` | `NewOperationPage` (reused) | Security Mode: terminal tools |

---

## 7. Database Models

### 7.1 GenerationHistory (`generator`)

```python
class GenerationHistory(models.Model):
    user          = ForeignKey(User, on_delete=CASCADE)
    timestamp     = DateTimeField(auto_now_add=True)
    pii_data      = JSONField           # Submitted PII (masked at rest)
    wordlist      = JSONField           # Generated password list
    wordlist_count = IntegerField
    ip_address    = GenericIPAddressField
```

### 7.2 SystemLog (`operations`)

```python
class SystemLog(models.Model):
    timestamp = DateTimeField(auto_now_add=True)
    level     = CharField              # INFO / WARNING / ERROR / CRITICAL
    message   = TextField
    source    = CharField
```

### 7.3 Message (`operations`)

```python
class Message(models.Model):
    sender    = ForeignKey(User)
    recipient = ForeignKey(User)
    content   = TextField
    timestamp = DateTimeField(auto_now_add=True)
    is_read   = BooleanField(default=False)
```

### 7.4 Notification (`operations`)

```python
class Notification(models.Model):
    user              = ForeignKey(User)
    notification_type = CharField
    title             = CharField
    description       = TextField
    is_read           = BooleanField(default=False)
    timestamp         = DateTimeField(auto_now_add=True)
    link              = CharField
```

### 7.5 Team & TeamMembership (`teams`)

```python
class Team(models.Model):
    name        = CharField
    owner       = ForeignKey(User)
    invite_code = CharField(unique=True)
    created_at  = DateTimeField

class TeamMembership(models.Model):
    user      = ForeignKey(User)
    team      = ForeignKey(Team)
    role      = CharField              # admin / member
    joined_at = DateTimeField
```

### 7.6 PasswordAnalysis (`password_security`)

```python
class PasswordAnalysis(models.Model):
    user                 = ForeignKey(User)
    pii_data             = JSONField           # Encrypted partial PII
    vulnerability_level  = CharField           # low / medium / high / critical
    strength_score       = IntegerField        # 0–100
    crack_time_estimate  = CharField
    breach_count         = IntegerField(default=0)
    recommendations      = JSONField
    created_at           = DateTimeField(auto_now_add=True)
```

### 7.7 UserPreference (`core`)

```python
class UserPreference(models.Model):
    user         = OneToOneField(User)
    default_mode = CharField              # user / security
    last_mode    = CharField
    updated_at   = DateTimeField(auto_now=True)
```

---

## 8. PIIlogger — External Logging Service

PIIlogger is a **completely separate Node.js application** in its own project folder (`Django/piilogger/`) — it is **not part of this repository**. It provides a real-time log aggregation dashboard for debugging and troubleshooting the PIIcasso backend.

### Architecture

```
Django Backend → HTTP POST /logs → PIIlogger Server → SQLite
                                         │
                              WebSocket (Socket.io)
                                         │
                              Browser Dashboard (protected)
                              - Live log stream
                              - Filter by service / severity
                              - Historical log search
```

### Connection

The Django backend sends logs asynchronously (non-blocking, daemon threads) to PIIlogger via the `PiiloggerHandler` class (`backend/piilogger_handler.py`). If PIIlogger is offline, it silently fails — it never blocks the main application.

```python
# In backend settings.py — piilogger handler
'piilogger': {
    'level': 'INFO',
    'class': 'piilogger_handler.PiiloggerHandler',
    'service_name': 'core-engine',
}
```

### Running PIIlogger

PIIlogger lives in a **separate folder outside this repo**:

```bash
# From your Django projects folder
cd piilogger
cp .env.example .env    # Set ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET
npm install
npm start               # http://localhost:4000
```

### Services That Log to PIIlogger

| Service Name | Source |
|-------------|--------|
| `core-engine` | Django backend (all Django logs) |
| `identity-service` | Future: separate auth microservice |

### Dashboard URL

- **Local**: `http://localhost:4000`
- **Production**: `https://piilogger-service.onrender.com`

---

## 9. Deployment

### 9.1 Production Stack (Render)

All services are declared in `render.yaml` at the repo root.

| Service | Type | Source | URL |
|---------|------|--------|-----|
| `piicasso` | Django web | `Piicasso/backend/` | `piicasso.onrender.com` |
| `celery-worker` | Worker | `Piicasso/backend/` | (background) |
| `piicasso-redis` | Redis | Render managed | (internal) |

### 9.2 Frontend

The React frontend is deployed separately on **Vercel**.

- **URL**: `https://pii-casso.vercel.app`
- **Build**: `npm run build`
- **Config**: `Piicasso/frontend/vercel.json`

### 9.3 Local Development (Docker)

```bash
cd Piicasso
cp backend/.env.example backend/.env  # Configure env vars
docker-compose up
```

Services started:
- `http://localhost:8000` — Django backend
- `http://localhost:80` — Frontend (Nginx)
- `http://localhost:9090` — Prometheus
- `http://localhost:3001` — Grafana

PIIlogger is a **separate project** — run it from its own folder:
```bash
# In a separate terminal, from your Django projects folder:
cd ../piilogger
npm start    # http://localhost:4000
```

---

## 10. Environment Variables

### Backend (`Piicasso/backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DJANGO_SECRET_KEY` | Yes | Django secret key |
| `DEBUG` | Yes | `True` / `False` |
| `ENV` | Yes | `development` / `production` |
| `DATABASE_URL` | Prod | PostgreSQL connection string |
| `REDIS_URL` | Prod | Redis connection string |
| `ALLOWED_HOSTS` | Yes | Comma-separated allowed hosts |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated allowed origins |
| `GEMINI_API_KEY` | Yes | Google Gemini AI API key |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `PIILOGGER_URL` | No | PIIlogger service URL (default: `http://localhost:4000/logs`) |
| `ACCESS_TOKEN_MINUTES` | No | JWT access token lifetime (default: 15) |
| `REFRESH_TOKEN_DAYS` | No | JWT refresh token lifetime (default: 1) |
| `EMAIL_HOST_USER` | No | SMTP email for notifications |
| `EMAIL_HOST_PASSWORD` | No | SMTP app password |

### PIIlogger (Separate Project — `Django/piilogger/.env`)

> PIIlogger is not part of this repo. These vars are set in the standalone project.

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Port to listen on |
| `SESSION_SECRET` | (required) | Session signing secret |
| `ADMIN_USERNAME` | `SEM8` | Dashboard login username |
| `ADMIN_PASSWORD` | (required) | Dashboard login password |

---

## 11. Development Setup

### Backend

```bash
cd Piicasso/backend
python -m venv .venv
.venv\Scripts\activate            # Windows
source .venv/bin/activate          # Mac/Linux
pip install -r requirements.txt
cp .env.example .env              # Configure your env vars
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd Piicasso/frontend
npm install
npm start                          # http://localhost:3000
```

### PIIlogger (Separate Project)

```bash
# PIIlogger is outside this repo — run it from its own folder:
cd c:\Users\yokes\OneDrive\Documents\Full-stack\Django\piilogger
npm install
npm start                          # http://localhost:4000
```

### Celery (Optional for dev)

```bash
cd Piicasso/backend
celery -A backend worker --loglevel=info
```

---

## 12. Security Model

### Authentication

- JWT via `djangorestframework-simplejwt`
- Short-lived access tokens (15 min), rotated refresh tokens (1 day)
- Token blacklisting on logout
- Google OAuth via Firebase (frontend) + token verification (backend)
- Brute-force protection via `AccountLockoutMiddleware`

### Data Security

- PII submitted for wordlist generation is **not stored permanently** (configurable 30-day retention)
- Passwords are **never stored plaintext** — only hashed breach count metadata
- All production traffic over HTTPS with HSTS
- CSP headers enforced by middleware

### Rate Limiting

| Endpoint | Authenticated | Anonymous |
|----------|---------------|-----------|
| `/api/pii/submit/` | 10/hour | N/A |
| `/api/breach/check/` | 3/minute | N/A |
| `/api/register/` | 5/hour | 5/hour |
| `/api/token/` (login) | 5/minute | 5/minute |
| `/api/password/analyze/` | 60/minute | N/A |

### Observability

- **Prometheus**: Metrics via `django-prometheus` at `/metrics`
- **Grafana**: Dashboards at `:3001` in Docker
- **Loki + Promtail**: Log aggregation from Django log files
- **PIIlogger**: Real-time log stream at `piilogger-service.onrender.com`

---

## Glossary

| Term | Definition |
|------|------------|
| PII | Personally Identifiable Information |
| JWT | JSON Web Token |
| RockYou | Common leaked password list used for wordlist augmentation |
| Wordlist | Generated list of likely passwords for security testing |
| PIIlogger | Standalone log aggregation service for PIIcasso debugging |
| Celery | Async task queue for background Python jobs |
| Gemini | Google's AI model used for intelligent wordlist generation |

---

*End of Document*
