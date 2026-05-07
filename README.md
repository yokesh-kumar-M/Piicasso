# PIIcasso — Deep Search Intelligence Platform

[![CI](https://github.com/yokesh-kumar-M/Piicasso/actions/workflows/ci.yml/badge.svg)](https://github.com/yokesh-kumar-M/Piicasso/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com/yokesh-kumar-M/Piicasso/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Uptime](https://img.shields.io/badge/uptime-99.9%25-brightgreen)](https://betterstack.com)
[![Django](https://img.shields.io/badge/Django-5.x-092E20?logo=django)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker)](https://www.docker.com/)

> **AI-powered targeted wordlist generator and PII intelligence platform** for security professionals and individuals who take password safety seriously.

---

## Live Demo

| Service | URL | Status |
|---------|-----|--------|
| Frontend (Vercel) | [pii-casso.vercel.app](https://pii-casso.vercel.app) | ![live](https://img.shields.io/badge/status-live-brightgreen) |
| Backend API (Render) | [core-engine-woeg.onrender.com/api](https://core-engine-woeg.onrender.com/api/) | ![live](https://img.shields.io/badge/status-live-brightgreen) |
| API Docs (Swagger) | [/api/docs](https://core-engine-woeg.onrender.com/api/docs/) | ![live](https://img.shields.io/badge/status-live-brightgreen) |

---

## What Is PIIcasso?

PIIcasso is a full-stack **Deep Search Intelligence Platform** with a dual-mode architecture:

- **Security Mode** (Tactical Dark/Red) — Red teams and penetration testers generate AI-powered, profile-based wordlists with 3D threat visualization, risk radar charts, and dossier PDF exports.
- **User Mode** (Midnight Cobalt Glass) — Individuals assess their own password strength against PII-based cracking patterns, with breach history visualization and real-time scoring.

The platform runs on **Django REST Framework** + **React 18**, containerized with **Docker + Nginx**, deployed to **Render + Vercel**, and powered by **Google Gemini** for intelligent wordlist generation.

---

## Key Features

| Feature | Description |
|---------|-------------|
| AI Wordlist Generation | Google Gemini LLM generates profile-based wordlists from PII inputs |
| PII Detection Engine | Client-side `piiEngine.js` scores crackability from personal data patterns |
| Smart Permutations | Algorithmic generation: leetspeak, date variants, common suffixes |
| 3D Threat Globe | WebGL globe (`react-globe.gl`) with live user presence via cache heartbeats |
| Risk Radar | `Chart.js` radar visualization of password vulnerability dimensions |
| Dossier Export | PDF report generation (`reportlab`) of full intelligence output |
| Live Password Testing | Real-time strength scoring with vulnerability breakdown and recommendations |
| Operation History | Expandable rows showing vulnerabilities and per-entry recommendations |
| Team Management | Multi-user team workspaces with role-based access |
| Admin Panel | Super admin role promotion/demotion with management command bootstrap |
| Dual-Mode Theming | `data-mode` CSS variable system — Security (tactical red) / User (glass morphism) |
| Responsive | Mobile-first (320px+), tablet (768px+), desktop (1024px+) with 44px touch targets |

---

## Architecture

```
                         ┌─────────────┐
          Browser ──────▶│   Vercel    │  React 18 SPA
                         │  (Frontend) │  Tailwind + Framer Motion
                         └──────┬──────┘
                                │ HTTPS / REST API
                         ┌──────▼──────┐
                         │    Nginx    │  least_conn + keepalive
                         │  (Render)   │  Reverse proxy + SSL termination
                         └──────┬──────┘
                    ┌───────────┼───────────┐
             ┌──────▼──────┐         ┌──────▼──────┐
             │  Gunicorn   │   ...   │  Gunicorn   │  2 workers × N replicas
             │  Worker 1   │         │  Worker N   │  --scale web=N
             └──────┬──────┘         └──────┬──────┘
                    └───────────┬───────────┘
                         ┌──────▼──────┐
                         │   Django    │  DRF · SimpleJWT · Google OAuth
                         │   5.x API   │  Gemini AI · ReportLab · Prometheus
                         └──────┬──────┘
                    ┌───────────┼───────────┐
             ┌──────▼──────┐         ┌──────▼──────┐
             │ PostgreSQL  │         │    Redis    │  Cache · Heartbeats
             │  (Primary)  │         │   (Cache)   │  Rate limiting
             └─────────────┘         └─────────────┘
```

**Observability:**
```
Django Middleware ──▶ Prometheus ──▶ Grafana Cloud
                                          │
                  Sentry (errors) ────────┤
                  Better Stack (uptime) ──┘
```

---

## Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Django | 5.x | Web framework |
| Django REST Framework | latest | REST API |
| PostgreSQL | 15+ | Primary database |
| Redis | 7+ | Caching, live presence |
| SimpleJWT | latest | JWT auth + refresh tokens |
| Google Gemini API | v1 | AI wordlist generation |
| ReportLab | latest | PDF dossier export |
| Gunicorn | latest | WSGI server (2 workers, 120s timeout) |
| Prometheus | latest | Metrics middleware |
| Docker | 24+ | Containerization |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18 | UI framework |
| Tailwind CSS | 3.x | Utility-first styling |
| Framer Motion | 12.x | Page + component animations |
| Three.js / react-globe.gl | latest | 3D threat globe |
| Chart.js / react-chartjs-2 | latest | Radar + bar charts |
| Lucide React | latest | Icon library |
| @react-oauth/google | latest | Google SSO |
| class-variance-authority | latest | Component variants |

---

## Quick Start

### Option A — Docker Compose (Recommended)

```bash
git clone https://github.com/yokesh-kumar-M/Piicasso.git
cd Piicasso/Piicasso

# Copy and configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your values (see Environment Variables below)

# Start all services
docker compose up --build

# Scale web workers (optional)
docker compose up --scale web=3
```

Services start at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- Nginx proxy: http://localhost:80

### Option B — Manual Setup

**Backend**

```bash
cd Piicasso/backend

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

# Configure .env (see Environment Variables below)

python manage.py migrate
python manage.py ensure_admin   # Creates default admin account
python manage.py runserver      # http://localhost:8000
```

**Frontend**

```bash
cd Piicasso/frontend

npm install

# Configure .env
echo "REACT_APP_API_URL=http://localhost:8000/api/" > .env

npm start  # http://localhost:3000
```

---

## Environment Variables

### Backend (`Piicasso/backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DJANGO_SECRET_KEY` | Yes | Django secret key |
| `DEBUG` | Yes | `True` for dev, `False` for prod |
| `ENV` | Yes | `development` or `production` |
| `DATABASE_URL` | Yes | `postgresql://user:pass@host:5432/piicasso` |
| `REDIS_URL` | No | `redis://localhost:6379/0` |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `ALLOWED_HOSTS` | Yes | Comma-separated hostnames |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated frontend origins |
| `SENTRY_DSN` | No | Sentry error tracking DSN |

### Frontend (`Piicasso/frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_API_URL` | Yes | Backend API base URL |
| `REACT_APP_GOOGLE_CLIENT_ID` | No | Google OAuth client ID |

---

## Deployment

### One-Click Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yokesh-kumar-M/Piicasso)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yokesh-kumar-M/Piicasso)

### Render (Backend)

1. Connect your GitHub repo to Render
2. Create a **Web Service** pointing to `Piicasso/` (root Dockerfile)
3. Set all required environment variables in the Render dashboard
4. Render auto-deploys on push to `main`

### Vercel (Frontend)

1. Import the repo to Vercel
2. Set root directory to `Piicasso/frontend`
3. Add `REACT_APP_API_URL` pointing to your Render backend URL
4. Deploy — Vercel handles builds automatically

---

## Production Status

### Infrastructure

| Component | Provider | Config |
|-----------|----------|--------|
| Backend hosting | Render (free tier) | 2 Gunicorn workers, 120s timeout |
| Frontend hosting | Vercel | Edge CDN, automatic HTTPS |
| Database | PostgreSQL | Managed (Render or external) |
| Cache | Redis | Render Redis or Upstash |
| Nginx | Docker (Render) | `least_conn` + keepalive upstream |

### Observability

| Tool | Purpose | Coverage |
|------|---------|----------|
| [Sentry](https://sentry.io) | Error tracking | Backend + Frontend |
| [Better Stack](https://betterstack.com) | Uptime monitoring | 3 endpoints |
| [Prometheus](https://prometheus.io) | Metrics collection | Django middleware |
| [Grafana Cloud](https://grafana.com) | Dashboards | Performance + errors |

### Security

| Control | Status |
|---------|--------|
| HTTPS enforced | ✅ Render + Vercel |
| Security headers (CSP, HSTS, X-Frame) | ✅ |
| JWT + refresh tokens | ✅ SimpleJWT |
| Google OAuth | ✅ Cert caching enabled |
| CORS configured | ✅ Per-environment origins |
| Environment secrets | ✅ Never in version control |

### Keep-Alive (Free Tier)

GitHub Actions pings both services every 10 minutes to prevent Render/Supabase spin-down. View logs in [Actions](https://github.com/yokesh-kumar-M/Piicasso/actions/workflows/keep-alive.yml).

---

## Project Structure

```
PIIcasso/
├── Piicasso/
│   ├── backend/                    # Django API
│   │   ├── core/                   # Django project settings
│   │   ├── generator/              # Wordlist generation + Gemini AI
│   │   ├── intelligence/           # Intelligence models + scoring
│   │   ├── operations/             # Operation history API
│   │   ├── password_security/      # Password strength + breach check
│   │   ├── teams/                  # Team management
│   │   ├── wordgen/services/       # Wordgen metrics service
│   │   ├── start.sh                # Gunicorn entrypoint (2w, 120s)
│   │   └── requirements.txt
│   │
│   ├── frontend/                   # React SPA
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── design/         # Design system (11 components)
│   │   │   │   └── pages/          # 15+ page components
│   │   │   ├── context/            # AuthContext, ModeContext
│   │   │   ├── hooks/              # useResponsive, useAuth
│   │   │   ├── lib/                # piiEngine.js
│   │   │   └── api/                # Axios instance + interceptors
│   │   └── nginx.conf              # Frontend Nginx config
│   │
│   ├── nginx/nginx.conf            # Reverse proxy + load balancing
│   ├── docker-compose.yml          # Full-stack orchestration
│   └── Dockerfile                  # Production backend image
│
├── .github/
│   ├── workflows/ci.yml            # CI pipeline
│   └── workflows/keep-alive.yml    # Free-tier keep-alive pings
└── README.md
```

---

## Contributing

Contributions are welcome. Please follow this flow:

1. Fork the repo and create a branch: `git checkout -b feature/your-feature`
2. Make your changes following the code style below
3. Run checks: `flake8` (backend), `npm run lint` (frontend)
4. Commit: `git commit -m 'feat: add your feature'`
5. Push and open a Pull Request against `main`

**Code style:**
- Backend: PEP 8, formatted with `black`
- Frontend: Airbnb style guide, formatted with `prettier`

---

## Security Notice

> PIIcasso is intended strictly for **authorized security testing, penetration testing, and personal password safety education**. Generating wordlists targeting individuals or systems without explicit consent is illegal. The maintainers assume no liability for misuse.

---

## License

**MIT** — see [LICENSE](LICENSE) for details.

© 2026 Yokesh Kumar · [dezprox25@gmail.com](mailto:dezprox25@gmail.com) · [Live App](https://pii-casso.vercel.app)
