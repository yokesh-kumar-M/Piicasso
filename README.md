# PIIcasso

[![CI](https://github.com/yokesh-kumar-M/Piicasso/actions/workflows/ci.yml/badge.svg)](https://github.com/yokesh-kumar-M/Piicasso/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/piicasso?label=npm&logo=npm)](https://www.npmjs.com/package/piicasso)
[![PyPI](https://img.shields.io/pypi/v/piicasso?label=pypi&logo=python)](https://pypi.org/project/piicasso/)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

PIIcasso is a PII analysis and security-workflow platform with a React web application, a Django REST API, and Node and Python command-line clients. Local CLI commands can detect and redact PII, score passwords, and generate candidate wordlists without contacting the API. Authenticated workflows use the backend for saved operations, AI-assisted generation, history, messaging, and risk data.

> Use PIIcasso only with data and systems you own or are explicitly authorized to test. See [Security and responsible use](#security-and-responsible-use).

This README describes the repository and its supported configuration. It is not an uptime report or service-level guarantee.

## Requirements

| Component                | Requirement                                                            |
| ------------------------ | ---------------------------------------------------------------------- |
| Frontend and Node CLI    | Node.js **24 or newer** and npm                                        |
| Backend                  | Python 3.12 recommended                                                |
| Python CLI               | Python 3.9 or newer                                                    |
| Container workflow       | Docker Engine with Docker Compose                                      |
| Production data services | PostgreSQL 15 and Redis 8 are provided by the production Compose stack |

Use the committed lockfiles with `npm ci` when working from source.

## Install a CLI

```bash
# Node.js CLI (requires Node >=24)
npm install --global piicasso

# Python CLI
pip install piicasso
```

Examples below use the Node CLI:

```bash
# Local operations: no account or network request
piicasso analyze "Email jane@example.com or call 9876543210"
piicasso redact "Email jane@example.com"
piicasso score "ExamplePassword42!" --profile username=jane birth_year=1990
piicasso wordgen --profile name=Jane birth_year=1990 --limit 20

# API-backed operations: authenticate first
piicasso login
piicasso submit --profile full_name="Jane Doe" birth_year=1990 current_city=Chennai --pattern-mode standard
piicasso history --limit 10
piicasso risk
```

`submit` accepts a structured profile, not a file. `risk` takes no target argument; it returns the authenticated user's current financial-risk snapshot. See the [Node CLI documentation](Piicasso/cli-node/README.md) for the complete submit contract and the [Python CLI documentation](Piicasso/cli-python/README.md) for that client's command surface.

The local engines are separate implementations. Do not assume byte-identical results between the browser, Node, and Python surfaces unless a specific parity test covers the behavior you depend on.

## Repository surfaces

### Web application

The React 19 and Vite 8 single-page application includes registration and authentication, user and security workflows, operation history, team features, an in-browser command interface, and role-gated administration.

### Django API

The Django 5.2 and Django REST Framework backend provides JWT authentication, generation and analysis endpoints, history, messaging, teams, password-security workflows, analytics, and OpenAPI documentation. The production image starts the application through **Daphne ASGI** after applying migrations and ensuring the database-backed cache table exists.

### Command-line clients

- [`Piicasso/cli-node`](Piicasso/cli-node/README.md): Node.js 24+, Commander, Axios, and Chalk.
- [`Piicasso/cli-python`](Piicasso/cli-python/README.md): Python 3.9+, Click, Rich, Prompt Toolkit, and Requests.

Both clients combine local utilities with authenticated API calls, but their exact options and output formats can differ. Refer to each package's README.

## Node CLI commands

| Command                                         | Execution | Description                                            |
| ----------------------------------------------- | --------- | ------------------------------------------------------ |
| `analyze [text] [-f path]`                      | Local     | Detect PII entities in text or a file                  |
| `redact [text] [-f path]`                       | Local     | Replace detected values with `[TYPE]` placeholders     |
| `score <password> [-p key=value ...]`           | Local     | Score a password against optional profile values       |
| `wordgen -p key=value ... [-l N]`               | Local     | Generate a bounded candidate wordlist                  |
| `submit -p key=value ... [--pattern-mode mode]` | API       | Submit a structured profile for AI-assisted generation |
| `history [-l N]`                                | API       | List recent saved analyses                             |
| `darkweb <query>`                               | API       | Query the configured breach-search workflow            |
| `risk`                                          | API       | Read the authenticated user's current risk snapshot    |
| `inbox`                                         | API       | List operations-inbox messages                         |
| `login`, `logout`, `whoami`                     | API       | Manage and inspect the stored session                  |
| `mode [user\|security]`                         | Local     | Read or set the CLI presentation mode                  |
| `config <list\|get\|set\|unset> [key] [value]`  | Local     | Manage `~/.piicasso/config.json`                       |
| `repl` or no arguments                          | Mixed     | Start the interactive CLI                              |

Commands that expose a `--json` option can emit machine-readable output.

### Structured submit contract

The Node CLI accepts one or more `key=value` pairs after `--profile` and validates them against its recognized profile-key set. `--pattern-mode` is one of:

- `standard`
- `corporate`
- `leetspeak`
- `deep`

The backend's committed OpenAPI schema documents the recognized submit fields and the same pattern-mode enum. A request must contain meaningful non-pattern PII; undeclared keys and profile values longer than 256 characters are rejected. A successful `201` response is a scored wordlist and metrics envelope, and `--json` prints the complete response.

## Local development

Clone the repository and create the backend environment file:

```bash
git clone https://github.com/yokesh-kumar-M/Piicasso.git
cd Piicasso
cp Piicasso/backend/.env.example Piicasso/backend/.env
```

The example environment is production-oriented. For local work, review every value, set `ENV=development`, use development hosts/origins, and either remove the placeholder `DATABASE_URL` to use the local fallback or replace it with a real database URL. `GOOGLE_CLIENT_ID` and a valid `FIELD_ENCRYPTION_KEY` are required for backend startup.

Generate a Fernet key with:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### Backend

```bash
cd Piicasso/backend
python -m venv .venv

# Linux/macOS
source .venv/bin/activate

# Windows PowerShell
# .\.venv\Scripts\Activate.ps1

python -m pip install -r requirements-dev.txt
python manage.py migrate
python manage.py runserver
```

The development API is available at <http://localhost:8000/api/>.

### Frontend

In another terminal:

```bash
cd Piicasso/frontend
cp .env.example .env.local
npm ci
npm run dev
```

The Vite development server is configured for <http://localhost:3000>.

### CLIs from source

```bash
# Node CLI
cd Piicasso/cli-node
npm ci
npm link
piicasso --version

# Python CLI, from the repository root
python -m pip install -e Piicasso/cli-python
piicasso --version
```

## Docker Compose: development vs production

The repository intentionally contains two Compose files with different purposes.

### Root `docker-compose.yml`: local development

Run this file from the repository root:

```bash
docker compose -f docker-compose.yml up --build
```

It uses `Dockerfile.dev` images and bind mounts for the Django development server and Vite development server. It also starts Redis and a Celery worker. Expected local ports are frontend `3000`, backend `8000`, and Redis `6379`. It does **not** provision PostgreSQL; database behavior follows `Piicasso/backend/.env`.

### `Piicasso/docker-compose.yml`: production-style self-hosting

Run the nested file explicitly:

```bash
docker compose -f Piicasso/docker-compose.yml up --build --detach
```

This topology builds the production frontend and backend images and adds a Celery worker, PostgreSQL, authenticated Redis, Prometheus, Grafana, Loki, and Grafana Alloy. Set the required `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, and `GRAFANA_PASSWORD` substitutions, and provide production secrets in `Piicasso/backend/.env` before starting it. The frontend is published on host port `80`; the backend remains internal to the Compose network and is reached through the frontend proxy.

The backend container runs `Piicasso/backend/start.sh`, which collects shared static assets, applies migrations, creates the database cache table if needed, and then replaces the shell process with Daphne serving `backend.asgi:application`. The frontend production image serves its static Vite build through unprivileged Nginx and proxies HTTP and WebSocket traffic. Prometheus and Loki are private to the Compose network; Grafana is the published observability surface on port `3001`.

Neither Compose file by itself proves that an external deployment is healthy; use the health endpoint and your deployment platform's monitoring.

## Technology stack

| Layer                              | Current repository stack                                        |
| ---------------------------------- | --------------------------------------------------------------- |
| Backend                            | Python 3.12 image, Django 5.2, Django REST Framework, SimpleJWT |
| Production application server      | Daphne 4 / ASGI                                                 |
| AI integration                     | `google-genai`; model selected by `GEMINI_MODEL`                |
| Frontend                           | Node 24, React 19, Vite 8, React Router 7, Tailwind CSS 4       |
| Frontend visualization             | Chart.js and `react-globe.gl`                                   |
| Node CLI                           | Node 24+, Commander 11, Axios, Chalk                            |
| Python CLI                         | Python 3.9+, Click, Rich, Requests                              |
| Production data                    | PostgreSQL 15 and Redis 8                                       |
| Optional self-hosted observability | Prometheus, Grafana, Loki, Grafana Alloy                        |

## Environment variables

Start from [`Piicasso/backend/.env.example`](Piicasso/backend/.env.example) and [`Piicasso/frontend/.env.example`](Piicasso/frontend/.env.example). Never commit populated environment files.

### Backend

| Variable               | Requirement                  | Purpose                                                                                |
| ---------------------- | ---------------------------- | -------------------------------------------------------------------------------------- |
| `DJANGO_SECRET_KEY`    | Production required          | Django signing key                                                                     |
| `FIELD_ENCRYPTION_KEY` | Required                     | Fernet key for encrypted PII fields; rotation requires a data migration                |
| `GOOGLE_CLIENT_ID`     | Required by current settings | Google identity verification configuration                                             |
| `DATABASE_URL`         | Production recommended       | PostgreSQL connection URL; local development can use the configured fallback           |
| `REDIS_URL`            | Optional                     | Shared cache and rate-limit backend; production falls back to database cache if absent |
| `GEMINI_API_KEY`       | Optional                     | Enables Gemini generation; the backend has a deterministic fallback when absent        |
| `GEMINI_MODEL`         | Optional                     | Gemini model name; defaults to `gemini-3.6-flash`                                      |
| `ALLOWED_HOSTS`        | Production required          | Comma-separated Django host allowlist                                                  |
| `CORS_ALLOWED_ORIGINS` | Production required          | Comma-separated frontend origins                                                       |
| `SENTRY_DSN`           | Optional                     | Enables configured backend error reporting                                             |

### Frontend

| Variable                     | Requirement                 | Purpose                                                      |
| ---------------------------- | --------------------------- | ------------------------------------------------------------ |
| `REACT_APP_API_URL`          | Recommended                 | API base URL including a trailing slash; defaults to `/api/` |
| `REACT_APP_GOOGLE_CLIENT_ID` | Required for Google sign-in | Browser OAuth client ID                                      |

### CLI

| Variable       | Requirement | Purpose                             |
| -------------- | ----------- | ----------------------------------- |
| `PIICASSO_API` | Optional    | Overrides the Node CLI API base URL |

## API contract

The backend OpenAPI snapshot is committed at [`Piicasso/backend/schema.yml`](Piicasso/backend/schema.yml). CI regenerates and validates the schema, then fails on drift. The current schema generation is warning-free and includes the recognized submit profile fields, pattern-mode enum, and typed success envelope.

The schema is the documented contract. The PII submission request is explicitly closed (`additionalProperties: false`), matching the server's unknown-field rejection.

After changing a view or serializer, regenerate the snapshot from the repository root:

```bash
task schema
```

## Quality checks

```bash
# Frontend
npm ci --prefix Piicasso/frontend
npm test --prefix Piicasso/frontend
npm run lint --prefix Piicasso/frontend
npm run format:check --prefix Piicasso/frontend
npm run build --prefix Piicasso/frontend
npm run audit:production --prefix Piicasso/frontend

# Node CLI
npm ci --prefix Piicasso/cli-node
npm test --prefix Piicasso/cli-node

# Backend, after installing requirements-dev.txt in its virtual environment
python scripts/run_backend_tool.py manage.py test --verbosity=2
python scripts/run_backend_tool.py ruff check .
python scripts/run_backend_tool.py ruff format --check .
```

The root [`Taskfile.yml`](Taskfile.yml) also provides `setup`, `dev`, `test`, `lint`, `format`, `typecheck`, and `schema` tasks.

## Deployment configuration

- [`render.yaml`](render.yaml) defines the Docker-based backend deployment and health path.
- [`vercel.json`](vercel.json) defines frontend security headers, SPA routing, and the `/api/` rewrite.
- [`Piicasso/docker-compose.yml`](Piicasso/docker-compose.yml) is the production-style self-hosted stack.

Repository configuration includes hosted target URLs, but this README deliberately does not label them “live” or promise availability. Check the health endpoint and the relevant provider dashboard when operating a deployment.

## Project layout

```text
Piicasso/
├── docker-compose.yml              # Local development stack
├── README.md
├── Taskfile.yml
├── UPGRADE_PLAN.md
├── render.yaml
├── vercel.json
└── Piicasso/
    ├── backend/                    # Django/DRF API and Daphne startup
    │   ├── backend/                # Settings, URLs, ASGI application
    │   ├── generator/              # Generation records and encrypted fields
    │   ├── operations/             # Logs, messages, notifications
    │   ├── password_security/      # Password analysis workflows
    │   ├── teams/                  # Team workflows
    │   ├── wordgen/                # API views, serializers, Gemini integration
    │   ├── schema.yml              # CI-enforced OpenAPI snapshot
    │   └── start.sh                # Migration/cache setup and Daphne startup
    ├── frontend/                   # React 19 and Vite 8 application
    ├── cli-node/                   # npm CLI
    ├── cli-python/                 # Python CLI
    ├── docker-compose.yml          # Production-style self-hosted stack
    ├── alloy/                      # Production log-collection configuration
    ├── grafana/                    # Provisioned dashboards and data sources
    └── prometheus/                 # Metrics configuration
```

## Contributing

1. Create a branch from the current default branch.
2. Install locked dependencies with `npm ci` and backend development dependencies with `requirements-dev.txt`.
3. Add or update tests for behavior changes.
4. Run the relevant checks from [Quality checks](#quality-checks).
5. If the API contract changed, regenerate `schema.yml`.
6. Open a pull request that explains behavior, migration, and security implications.

Pre-commit hooks are configured in [`.pre-commit-config.yaml`](.pre-commit-config.yaml). Install them with `pre-commit install` or use `task setup`.

## Security and responsible use

- Report vulnerabilities privately through the repository's security-reporting channel; do not include real PII, tokens, or credentials in public issues.
- Treat generated wordlists and risk data as sensitive.
- Keep `.env`, CLI credential files, encryption keys, and database exports out of version control.
- Use the platform only for personal safety work or explicitly authorized security testing.

## License

Licensed under the [Apache License 2.0](LICENSE).
