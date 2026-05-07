# PIIcasso — Optimize, Load Balance & Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden gitignore, add missing backend modules, tune Nginx upstream + Gunicorn for load balancing, and push the entire project to production (Render + Vercel) for the first time.

**Architecture:** Five targeted file edits (`.gitignore`, `nginx.conf`, `docker-compose.yml`, `start.sh`) plus staging two untracked backend modules — committed atomically and pushed. No new dependencies. No migrations.

**Tech Stack:** Django 5.2 / Gunicorn gthread / Nginx upstream / Docker Compose 3.8 / Render (backend) / Vercel (frontend)

---

## Context for the implementor

- **Repository root:** `C:/Users/yokes/OneDrive/Documents/Full-stack/Django/PIIcasso/`
- **All prior staged work was committed** in the previous session. The repo is clean except for two untracked backend directories and the pending file edits below.
- **Untracked** (must be staged): `Piicasso/backend/intelligence/` and `Piicasso/backend/wordgen/services/`
- **Do NOT delete** `Piicasso/backend/generator/` — it is a model-only app (`GenerationHistory`) imported by 7 other files. Its empty `views.py` is intentional.
- **Do NOT commit** `Piicasso/frontend/.env` (real Google Client ID inside — already covered by `frontend/.gitignore`, should not appear in `git status`).
- **Production:** Render auto-deploys on push to `main`. Vercel auto-deploys on push to `main`.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `Piicasso/.gitignore` | Modify | Add `.superpowers/` block |
| `Piicasso/nginx/nginx.conf` | Modify | `least_conn` + `keepalive 32` on upstream |
| `Piicasso/docker-compose.yml` | Modify | `expose` instead of `ports` on web service |
| `Piicasso/backend/start.sh` | Modify | `--workers 2 --timeout 120` |
| `Piicasso/backend/intelligence/` | Stage | New tracked module (models only) |
| `Piicasso/backend/wordgen/services/` | Stage | New tracked module (metrics_service) |

---

## Task 1: Harden .gitignore

**Files:**
- Modify: `Piicasso/.gitignore`

- [ ] **Step 1: Open and read the current gitignore**

  File: `Piicasso/.gitignore`

  Current tail (last section):
  ```
  # Security — never commit these
  *.pem
  *.key
  *.crt
  *.p12
  backend/rockyou.txt
  ```

- [ ] **Step 2: Append the .superpowers block**

  Add this at the end of `Piicasso/.gitignore`:
  ```
  # Internal tooling — never commit
  .superpowers/
  ```

- [ ] **Step 3: Verify .superpowers is now ignored**

  Run from repo root:
  ```bash
  cd C:/Users/yokes/OneDrive/Documents/Full-stack/Django/PIIcasso
  git check-ignore -v .superpowers/
  ```
  Expected output:
  ```
  Piicasso/.gitignore:XX:.superpowers/	.superpowers/
  ```
  (XX = line number — any line number is fine)

- [ ] **Step 4: Commit**

  ```bash
  cd C:/Users/yokes/OneDrive/Documents/Full-stack/Django/PIIcasso
  git add Piicasso/.gitignore
  git commit -m "chore: gitignore .superpowers/ internal tooling directory"
  ```

---

## Task 2: Stage Untracked Backend Modules

**Files:**
- Stage: `Piicasso/backend/intelligence/` (4 files: `__init__.py`, `admin.py`, `apps.py`, `models.py`)
- Stage: `Piicasso/backend/wordgen/services/` (2 files: `__init__.py`, `metrics_service.py`)

- [ ] **Step 1: Verify these dirs are untracked**

  ```bash
  cd C:/Users/yokes/OneDrive/Documents/Full-stack/Django/PIIcasso
  git status --short | grep -E "intelligence|wordgen/services"
  ```
  Expected:
  ```
  ?? Piicasso/backend/intelligence/
  ?? Piicasso/backend/wordgen/services/
  ```

- [ ] **Step 2: Stage both directories**

  ```bash
  cd C:/Users/yokes/OneDrive/Documents/Full-stack/Django/PIIcasso
  git add Piicasso/backend/intelligence/ Piicasso/backend/wordgen/services/
  ```

- [ ] **Step 3: Verify staged files (no surprises)**

  ```bash
  git diff --cached --name-only
  ```
  Expected (exactly these 6 files):
  ```
  Piicasso/backend/intelligence/__init__.py
  Piicasso/backend/intelligence/admin.py
  Piicasso/backend/intelligence/apps.py
  Piicasso/backend/intelligence/models.py
  Piicasso/backend/wordgen/services/__init__.py
  Piicasso/backend/wordgen/services/metrics_service.py
  ```

- [ ] **Step 4: Commit**

  ```bash
  git commit -m "feat: add intelligence models and wordgen metrics service"
  ```

---

## Task 3: Nginx Upstream Load Balancing

**Files:**
- Modify: `Piicasso/nginx/nginx.conf`

Current upstream block:
```nginx
upstream backend {
    server web:8000;
}
```

- [ ] **Step 1: Replace upstream block**

  Edit `Piicasso/nginx/nginx.conf`. Replace the upstream block with:
  ```nginx
  upstream backend {
      least_conn;
      server web:8000;
      keepalive 32;
  }
  ```

  `least_conn` routes each new request to the replica with fewest active connections. `keepalive 32` keeps up to 32 idle connections to backend replicas alive — eliminates TCP handshake overhead on high-frequency API calls.

- [ ] **Step 2: Add proxy keepalive headers to the location block**

  Inside `location /` in the same file, the current block is:
  ```nginx
  location / {
      proxy_pass http://backend;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
  }
  ```

  Replace with:
  ```nginx
  location / {
      proxy_pass http://backend;
      proxy_http_version 1.1;
      proxy_set_header Connection "";
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
  }
  ```

  `proxy_http_version 1.1` and `Connection ""` are required for Nginx keepalive upstream connections to work — HTTP/1.0 closes connections by default.

- [ ] **Step 3: Commit**

  ```bash
  cd C:/Users/yokes/OneDrive/Documents/Full-stack/Django/PIIcasso
  git add Piicasso/nginx/nginx.conf
  git commit -m "perf: nginx upstream least_conn + keepalive for multi-replica support"
  ```

---

## Task 4: Docker Compose — Enable Web Service Scaling

**Files:**
- Modify: `Piicasso/docker-compose.yml`

The `web` service currently has:
```yaml
ports:
  - "8000:8000"
```
This prevents `--scale web=N` because Docker cannot bind the same host port multiple times.

- [ ] **Step 1: Replace `ports` with `expose` on the web service**

  In `Piicasso/docker-compose.yml`, find the `web` service block (lines 17–48). Replace:
  ```yaml
      ports:
        - "8000:8000"
  ```
  with:
  ```yaml
      expose:
        - "8000"
  ```

  `expose` makes port 8000 accessible to other containers on `piicasso_net` (Nginx can reach it) but does not bind to the host. Nginx resolves `web:8000` via Docker DNS which automatically round-robins across all replicas when scaled.

- [ ] **Step 2: Verify the change**

  ```bash
  grep -A 2 "expose:" Piicasso/docker-compose.yml
  ```
  Expected:
  ```yaml
      expose:
        - "8000"
  ```

- [ ] **Step 3: Commit**

  ```bash
  cd C:/Users/yokes/OneDrive/Documents/Full-stack/Django/PIIcasso
  git add Piicasso/docker-compose.yml
  git commit -m "perf: docker compose web expose instead of port bind — enables --scale web=N"
  ```

---

## Task 5: Gunicorn Tuning for Render

**Files:**
- Modify: `Piicasso/backend/start.sh`

Current gunicorn line:
```bash
exec gunicorn --bind 0.0.0.0:${PORT:-8000} --workers 1 --threads 2 --worker-class gthread --max-requests 1000 --max-requests-jitter 50 backend.wsgi:application
```

- [ ] **Step 1: Update the gunicorn command**

  Replace the `exec gunicorn ...` line in `Piicasso/backend/start.sh` with:
  ```bash
  exec gunicorn \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 2 \
    --threads 2 \
    --worker-class gthread \
    --timeout 120 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    backend.wsgi:application
  ```

  **Why these values:**
  - `--workers 2`: Render free tier = 1 vCPU. With gthread, 2 workers × 2 threads = 4 concurrent requests. Memory: ~160MB base + ~80MB/worker = ~320MB, safely within 512MB limit.
  - `--timeout 120`: Gemini AI generation calls can take 10–30s. Default 30s timeout kills those requests.
  - `--threads 2`: Each worker handles 2 concurrent I/O-bound requests (DB + Gemini API calls release GIL).
  - `--max-requests 1000 --max-requests-jitter 50`: Recycles workers after 1000 requests ±50 to prevent memory leaks.

- [ ] **Step 2: Verify the file looks correct**

  ```bash
  cat Piicasso/backend/start.sh
  ```
  Expected full output:
  ```bash
  #!/bin/bash
  set -e

  echo "Running database migrations..."
  python manage.py migrate --noinput || echo "Warning: Migration had issues, continuing..."

  echo "Starting Gunicorn server..."
  exec gunicorn \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 2 \
    --threads 2 \
    --worker-class gthread \
    --timeout 120 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    backend.wsgi:application
  ```

- [ ] **Step 3: Commit**

  ```bash
  cd C:/Users/yokes/OneDrive/Documents/Full-stack/Django/PIIcasso
  git add Piicasso/backend/start.sh
  git commit -m "perf: gunicorn 2 workers + 120s timeout for Render free tier + AI calls"
  ```

---

## Task 6: Final Verification Before Push

- [ ] **Step 1: Check git log shows clean commits**

  ```bash
  cd C:/Users/yokes/OneDrive/Documents/Full-stack/Django/PIIcasso
  git log --oneline -8
  ```
  Expected (most recent 4 are new):
  ```
  <sha>  perf: gunicorn 2 workers + 120s timeout for Render free tier + AI calls
  <sha>  perf: docker compose web expose instead of port bind — enables --scale web=N
  <sha>  perf: nginx upstream least_conn + keepalive for multi-replica support
  <sha>  feat: add intelligence models and wordgen metrics service
  <sha>  chore: gitignore .superpowers/ internal tooling directory
  <sha>  docs: add optimize, load-balance, and deploy design spec
  ```

- [ ] **Step 2: Confirm no .env files in the commit tree**

  ```bash
  git show --name-only HEAD~5..HEAD | grep -i "\.env" || echo "clean — no .env files"
  ```
  Expected: `clean — no .env files`

- [ ] **Step 3: Confirm .superpowers is ignored**

  ```bash
  git status --short | grep superpowers || echo "clean — .superpowers not tracked"
  ```
  Expected: `clean — .superpowers not tracked`

- [ ] **Step 4: Confirm working tree is clean**

  ```bash
  git status
  ```
  Expected: `nothing to commit, working tree clean`

---

## Task 7: Push to Production

- [ ] **Step 1: Push main to origin**

  ```bash
  cd C:/Users/yokes/OneDrive/Documents/Full-stack/Django/PIIcasso
  git push origin main
  ```

- [ ] **Step 2: Monitor Render auto-deploy (backend)**

  Render detects the push and rebuilds. The build runs:
  1. `pip install -r requirements.txt`
  2. `python manage.py collectstatic --noinput`
  3. Starts `start.sh` → migrations → gunicorn

  Poll the health endpoint (allow 5–8 minutes):
  ```bash
  curl -s -o /dev/null -w "%{http_code}" https://core-engine-woeg.onrender.com/api/health/
  ```
  Expected: `200`

- [ ] **Step 3: Verify Vercel frontend (2 min)**

  Vercel auto-deploys. Check:
  ```bash
  curl -s -o /dev/null -w "%{http_code}" https://pii-casso.vercel.app/
  ```
  Expected: `200`

- [ ] **Step 4: Smoke test — login endpoint**

  ```bash
  curl -s -X POST https://core-engine-woeg.onrender.com/api/user/login/ \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrongpassword"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d)"
  ```
  Expected: JSON with `"detail"` or `"non_field_errors"` (a 400/401 response — proves Django is up and routing)

- [ ] **Step 5: Smoke test — API schema**

  ```bash
  curl -s -o /dev/null -w "%{http_code}" https://core-engine-woeg.onrender.com/api/schema/
  ```
  Expected: `403` (admin-only endpoint — 403 proves Django + DRF is running correctly)

---

## Success Criteria Checklist

- [ ] `git log` shows 5 clean commits since the design spec commit
- [ ] No `.env` files, `node_modules`, `__pycache__`, or `.superpowers/` tracked
- [ ] `intelligence/` and `wordgen/services/` present in git history
- [ ] Nginx upstream uses `least_conn` + `keepalive 32`
- [ ] Docker Compose web uses `expose` not `ports`
- [ ] Gunicorn runs `--workers 2 --timeout 120`
- [ ] Render health check returns `200` at `/api/health/`
- [ ] Vercel returns `200` at `https://pii-casso.vercel.app/`
- [ ] Login endpoint returns `400/401` (not 500) proving routing works
- [ ] Schema endpoint returns `403` proving DRF permission system works

---

## How to Scale with Docker Compose (Post-Deploy Reference)

To run 3 backend replicas behind Nginx:
```bash
cd Piicasso/
docker compose up --scale web=3 -d
```

Nginx `least_conn` upstream automatically distributes requests across all 3 `web` containers. No config changes needed.
