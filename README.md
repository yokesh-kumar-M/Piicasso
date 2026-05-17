# PIIcasso — Deep Search Intelligence Platform

[![CI](https://github.com/yokesh-kumar-M/Piicasso/actions/workflows/ci.yml/badge.svg)](https://github.com/yokesh-kumar-M/Piicasso/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/piicasso?label=npm&color=cb3837&logo=npm)](https://www.npmjs.com/package/piicasso)
[![PyPI](https://img.shields.io/pypi/v/piicasso?label=pypi&color=3776AB&logo=python)](https://pypi.org/project/piicasso/)
[![Version](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com/yokesh-kumar-M/Piicasso/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Uptime](https://img.shields.io/badge/uptime-99.9%25-brightgreen)](https://betterstack.com)
[![Django](https://img.shields.io/badge/Django-5.x-092E20?logo=django)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker)](https://www.docker.com/)

> **AI-powered PII intelligence and adversarial wordlist platform** — web app, in-browser terminal, and a global CLI you can install in one line.

---

## Install in one line

```bash
# Node / npm
npm install -g piicasso

# Python / pip
pip install piicasso
```

Then run `piicasso` to drop into an interactive terminal, or use any subcommand directly:

```bash
piicasso analyze "Email john@example.com — call 9876543210"
piicasso wordgen --profile name=John --profile dob=1998
piicasso score "Tr0ub4dor&3"
piicasso login          # connect to the hosted backend
piicasso darkweb "acme corp"
piicasso risk "acme corp"
```

The CLI is **hybrid**: PII detection, redaction, password scoring, and wordlist generation run **locally** with no network calls. AI-backed features (dark-web search, financial risk, history) hit the hosted API. The web app, the in-browser Terminal at `/terminal`, and both CLI packages share the same `piiEngine` so output is byte-for-byte identical across surfaces.

Full CLI docs: [`Piicasso/cli-node/README.md`](Piicasso/cli-node/README.md) · [`Piicasso/cli-python/README.md`](Piicasso/cli-python/README.md)

---

## Live demo

| Service | URL | Status |
|---------|-----|--------|
| Frontend (Vercel) | [pii-casso.vercel.app](https://pii-casso.vercel.app) | ![live](https://img.shields.io/badge/status-live-brightgreen) |
| Backend API (Render) | [core-engine-woeg.onrender.com/api](https://core-engine-woeg.onrender.com/api/) | ![live](https://img.shields.io/badge/status-live-brightgreen) |
| In-browser Terminal | [/terminal](https://pii-casso.vercel.app/terminal) | ![live](https://img.shields.io/badge/status-live-brightgreen) |
| API docs (Swagger) | [/api/docs](https://core-engine-woeg.onrender.com/api/docs/) | ![live](https://img.shields.io/badge/status-live-brightgreen) |

---

## What is PIIcasso?

PIIcasso is a full-stack **Deep Search Intelligence Platform** with a dual-mode architecture:

- **Security mode** (tactical dark/red) — Red teams and pentesters generate AI-powered, profile-based wordlists with 3D threat visualization, risk radar charts, and dossier PDF exports.
- **User mode** (midnight cobalt glass) — Individuals assess their own password strength against PII-based cracking patterns, with breach history visualization and real-time scoring.

It ships in three surfaces:

1. **Web app** — React 18 SPA on Vercel.
2. **In-browser terminal** — a mode-aware interactive shell at `/terminal` with the same command set as the CLI.
3. **CLI** — `piicasso` on npm and PyPI; local analysis + API client.

Backend is **Django 5 + DRF** containerized with **Docker + Nginx**, deployed to **Render**, and powered by **Google Gemini** for intelligent wordlist generation.

---

## Surfaces

### Web app

```
https://pii-casso.vercel.app
```

Full UI with marketing pages, registration/login, dual-mode dashboards, operation history, dark-web search, financial risk radar, team workspaces, and admin console.

### In-browser terminal

```
https://pii-casso.vercel.app/terminal
```

A fully interactive shell rendered in React. Cyan prompt (`user@piicasso:~$`) in user mode, red prompt (`sec@piicasso:~#`) in security mode. Built-in commands: `help`, `clear`, `mode`, `switch user|security`, `whoami`, `routes`, `goto <path>`, `echo`, `about`, `exit`. Up/Down history, Tab autocomplete.

### CLI (npm + pip)

`piicasso` on both registries — same command surface, same engine, same output. See [CLI commands](#cli-commands) below.

---

## CLI commands

| Command | Mode | Description |
| --- | --- | --- |
| `analyze [text] [-f path]` | local | Detect PII entities (EMAIL, PHONE, SSN, CARD, DOB, IP, ADDR, ZIP, NAME) |
| `redact [text] [-f path]` | local | Replace detected PII with `[TYPE]` placeholders |
| `score <password> [-p k=v ...]` | local | Crackability score (0–100) + rating + entropy + crack time |
| `wordgen -p k=v ... [-l N]` | local | Adversarial wordlist from a profile |
| `submit <file>` | API | Upload text for server-side AI analysis |
| `history [-l N]` | API | List recent analyses |
| `darkweb <query>` | API | Breach-search across configured dark-web sources |
| `risk <target>` | API | Financial-risk score (Gemini-backed) |
| `inbox` | API | List messages |
| `login` / `logout` / `whoami` | API | Manage credentials |
| `mode [user\|security]` | local | Show or set local theme |
| `config <action> [key] [value]` | local | Inspect / mutate `~/.piicasso/config.json` |
| *(no args)* | — | Enter the interactive REPL |

All commands accept `--json` for machine-readable output where it makes sense.

### Configuration

The CLI stores its state in `~/.piicasso/config.json`:

```json
{
  "api":     "https://core-engine-woeg.onrender.com/api/",
  "mode":    "user",
  "access":  "<JWT>",
  "refresh": "<JWT>"
}
```

Override the API base with the `PIICASSO_API` environment variable or `piicasso config set api <url>`.

---

## Key features

| Feature | Description |
|---------|-------------|
| AI wordlist generation | Google Gemini LLM generates profile-based wordlists from PII inputs |
| PII detection engine | Pure-JS / pure-Python regex engine — same code in web, terminal, and CLI |
| Smart permutations | Algorithmic generation: leetspeak, date variants, common suffixes |
| 3D threat globe | WebGL globe (`react-globe.gl`) with live user presence via cache heartbeats |
| Risk radar | `Chart.js` radar visualization of password vulnerability dimensions |
| Dossier export | PDF report generation (`reportlab`) of full intelligence output |
| Live password testing | Real-time strength scoring with breakdown and recommendations |
| Operation history | Expandable rows showing vulnerabilities and per-entry recommendations |
| Team management | Multi-user team workspaces with role-based access |
| Admin panel | Super admin role promotion/demotion with bootstrap command |
| Dual-mode theming | Body-class system — Security (tactical red) / User (glass morphism) |
| Mode-aware terminal | `/terminal` page + CLI REPL with cyan/red theming |
| Responsive | Mobile-first (320px+), tablet (768px+), desktop (1024px+) — 44px touch targets |

---

## Architecture

```
                  ┌──────────────┐
   Browser ──────▶│   Vercel     │  React 18 SPA + in-browser terminal
                  │  (Frontend)  │  Tailwind + Framer Motion
                  └──────┬───────┘
                         │
   CLI (npm/pip) ────────┼──────────▶  HTTPS / REST API
                         │
                  ┌──────▼───────┐
                  │    Nginx     │  least_conn + keepalive
                  │   (Render)   │  Reverse proxy + SSL termination
                  └──────┬───────┘
                         │
                  ┌──────▼───────┐
                  │  Gunicorn    │  2 workers × N replicas
                  │  (N pods)    │
                  └──────┬───────┘
                         │
                  ┌──────▼───────┐
                  │   Django 5   │  DRF · SimpleJWT · Google OAuth
                  │   API tier   │  Gemini AI · ReportLab · Prometheus
                  └──────┬───────┘
                  ┌──────┴───────┐
              ┌───▼───┐      ┌───▼───┐
              │  PG   │      │ Redis │  Cache + heartbeats + rate limits
              └───────┘      └───────┘
```

**Observability:** Django middleware → Prometheus → Grafana Cloud. Sentry for errors. Better Stack for uptime.

---

## Technology stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Django | 5.x | Web framework |
| Django REST Framework | latest | REST API |
| PostgreSQL | 15+ | Primary database |
| Redis | 7+ | Cache, presence, rate limits |
| SimpleJWT | latest | JWT auth + refresh tokens |
| Google Gemini API | v1 | AI wordlist generation |
| ReportLab | latest | PDF dossier export |
| Gunicorn | 2x workers | WSGI server, 120s timeout |
| Prometheus | latest | Metrics middleware |
| Docker | 24+ | Containerization |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18 | UI framework |
| Tailwind CSS | 3.x | Utility-first styling |
| Framer Motion | 12.x | Page + component animations |
| react-globe.gl | latest | 3D threat globe (Three.js) |
| Chart.js / react-chartjs-2 | latest | Radar + bar charts |
| Lucide React | latest | Icon library |
| @react-oauth/google | latest | Google SSO |

### CLI

| Package | Stack | Install |
|---------|-------|---------|
| [piicasso](https://www.npmjs.com/package/piicasso) (npm) | Node ≥18, commander, chalk, axios | `npm i -g piicasso` |
| [piicasso](https://pypi.org/project/piicasso/) (PyPI) | Python ≥3.9, click, rich, prompt_toolkit, requests | `pip install piicasso` |

---

## Quick start (local development)

### Option A — Docker Compose (recommended)

```bash
git clone https://github.com/yokesh-kumar-M/Piicasso.git
cd Piicasso/Piicasso

# Configure env
cp backend/.env.example backend/.env
# Edit backend/.env (see Environment variables below)

# Start everything
docker compose up --build

# Scale web workers
docker compose up --scale web=3
```

Services start at:

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000/api/>
- Nginx proxy: <http://localhost:80>

### Option B — Manual

**Backend**

```bash
cd Piicasso/backend
python -m venv venv
source venv/bin/activate           # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py ensure_admin      # creates default admin
python manage.py runserver         # http://localhost:8000
```

**Frontend**

```bash
cd Piicasso/frontend
npm install
echo "REACT_APP_API_URL=http://localhost:8000/api/" > .env
npm start                          # http://localhost:3000
```

**CLI (from source)**

```bash
# Node
cd Piicasso/cli-node
npm install && npm link            # exposes the global `piicasso` binary

# Python
cd Piicasso/cli-python
pip install -e .                   # installs the `piicasso` entrypoint
```

---

## Environment variables

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

### CLI (`~/.piicasso/config.json` or env)

| Variable | Required | Description |
|----------|----------|-------------|
| `PIICASSO_API` | No | Override API base URL for the CLI |

---

## Deployment

### One-click

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yokesh-kumar-M/Piicasso)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yokesh-kumar-M/Piicasso)

### Render (backend)

1. Connect your GitHub repo to Render.
2. Create a **Web Service** rooted at `Piicasso/backend/` (uses the included Dockerfile).
3. Set required environment variables in the dashboard.
4. Auto-deploys on push to `main`.

### Vercel (frontend)

1. Import the repo to Vercel.
2. Set root directory to `Piicasso/frontend`.
3. Add `REACT_APP_API_URL` pointing to your Render backend URL.
4. Auto-deploys on push to `main`.

### Publishing the CLI

```bash
# npm
cd Piicasso/cli-node
npm login
npm publish --access public

# PyPI
cd Piicasso/cli-python
python -m pip install --upgrade build twine
python -m build              # produces dist/*.tar.gz + dist/*.whl
twine check dist/*
twine upload dist/*
```

---

## Production status

### Infrastructure

| Component | Provider | Config |
|-----------|----------|--------|
| Backend hosting | Render | 2 Gunicorn workers, 120s timeout, Singapore region |
| Frontend hosting | Vercel | Edge CDN, automatic HTTPS |
| Database | PostgreSQL | Managed (Render or external) |
| Cache | Redis | Render Redis or Upstash |
| Nginx | Docker (Render) | `least_conn` + keepalive |
| npm package | npmjs.com | `piicasso@latest` |
| PyPI package | pypi.org | `piicasso` |

### Observability

| Tool | Purpose | Coverage |
|------|---------|----------|
| Sentry | Error tracking | Backend + frontend |
| Better Stack | Uptime monitoring | 3 endpoints |
| Prometheus | Metrics collection | Django middleware |
| Grafana Cloud | Dashboards | Performance + errors |

### Security

| Control | Status |
|---------|--------|
| HTTPS enforced | ✅ Render + Vercel |
| Security headers (CSP, HSTS, X-Frame) | ✅ |
| JWT + refresh tokens | ✅ SimpleJWT |
| Google OAuth | ✅ Cert caching enabled |
| CORS configured | ✅ Per-environment origins |
| Environment secrets | ✅ Never in version control |
| CLI token storage | ✅ `~/.piicasso/config.json` (POSIX 0600 where supported) |

### Keep-alive

GitHub Actions pings the backend, frontend, and Supabase every 10 minutes to prevent free-tier spin-down. See [Actions → keep-alive](https://github.com/yokesh-kumar-M/Piicasso/actions/workflows/keep-alive.yml).

---

## Project layout

```
PIIcasso/
├── Piicasso/
│   ├── backend/                    # Django API
│   │   ├── core/                   # Settings + core URLs
│   │   ├── operations/             # Operation history, breach search, financial risk
│   │   ├── password_security/      # Password strength + preferences
│   │   ├── teams/                  # Team management
│   │   ├── wordgen/                # AI wordlist generation + Gemini integration
│   │   ├── analytics/              # Analytics + system logs
│   │   ├── start.sh                # Gunicorn entrypoint (2w, 120s)
│   │   └── requirements.txt
│   │
│   ├── frontend/                   # React SPA
│   │   └── src/
│   │       ├── components/         # Terminal.js, Navbar, GlobalMap, ...
│   │       ├── context/            # AuthContext, ModeContext
│   │       ├── lib/piiEngine.js    # Shared PII detection engine (JS)
│   │       └── pages/              # TerminalPage, LandingPage, ...
│   │
│   ├── cli-node/                   # npm package `piicasso`
│   │   ├── bin/piicasso.js         # Node CLI entrypoint
│   │   ├── src/engine/pii.js       # Engine port (matches piiEngine.js)
│   │   ├── src/commands/           # One module per subcommand
│   │   └── src/repl.js             # Interactive REPL
│   │
│   ├── cli-python/                 # pip package `piicasso`
│   │   ├── pyproject.toml          # Hatchling build
│   │   ├── src/piicasso/engine/    # Python port of piiEngine.js
│   │   ├── src/piicasso/cli.py     # Click subcommand root
│   │   └── src/piicasso/repl.py    # Interactive REPL
│   │
│   ├── nginx/nginx.conf            # Reverse proxy + load balancing
│   ├── docker-compose.yml          # Full-stack orchestration
│   └── Dockerfile                  # Production backend image
│
├── .github/workflows/
│   ├── ci.yml                      # Tests + bundle build
│   └── keep-alive.yml              # Free-tier keep-alive pings
├── render.yaml                     # Render service config
├── vercel.json                     # Vercel project config
└── README.md
```

---

## Contributing

```bash
git checkout -b feature/your-feature
# ... edit ...
flake8 Piicasso/backend            # backend lint
cd Piicasso/frontend && npm test   # frontend tests
cd Piicasso/cli-python && pytest   # CLI tests
git commit -m "feat: add your feature"
gh pr create
```

**Style:** PEP 8 + `black` (backend); Airbnb + `prettier` (frontend). Keep the engine in `piiEngine.js`, `cli-node/src/engine/pii.js`, and `cli-python/src/piicasso/engine/pii.py` in lockstep — changes to one require changes to the other two.

---

## Security notice

> PIIcasso is intended strictly for **authorized security testing, penetration testing, and personal password safety education**. Generating wordlists targeting individuals or systems without explicit consent is illegal. The maintainers assume no liability for misuse.

---

## License

**MIT** — see [LICENSE](LICENSE).

© 2026 Yokesh Kumar · [dezprox25@gmail.com](mailto:dezprox25@gmail.com) · [Live app](https://pii-casso.vercel.app) · [npm](https://www.npmjs.com/package/piicasso) · [PyPI](https://pypi.org/project/piicasso/)
