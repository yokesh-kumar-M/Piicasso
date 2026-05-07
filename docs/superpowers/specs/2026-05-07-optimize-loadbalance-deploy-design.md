# PIIcasso — Optimize, Load Balance & Deploy to Production

**Date:** 2026-05-07  
**Status:** Approved  
**Scope:** Full project cleanup, Nginx/Gunicorn load balancing, and first production deployment

---

## 1. Problem Statement

The entire project (80+ files) has been developed across multiple sessions and is staged but never committed or pushed to production. Before the first production deployment, the project needs:

- Gitignore hardening (`.superpowers/` leaked, untracked backend modules need adding)
- Dead app removal (`generator` app has empty views and is not wired to URLs)
- Nginx upstream load balancing for Docker Compose multi-replica support
- Gunicorn worker tuning for Render free tier (512MB, 1 vCPU)
- Atomic commit of all staged + untracked work, then push to production

**Security boundary:** The `intelligence/` module (TargetProfile/IntelligenceDossier models) will be added to git as inert model infrastructure only. No views, URLs, or API endpoints for that module are to be created or deployed. The PDF dossier export feature is deferred pending authorization context review.

---

## 2. Architecture (unchanged)

```
Production:
  Vercel  →  React SPA (static + /api proxy rewrites to Render)
  Render  →  Django/Gunicorn (ENV=production, PostgreSQL via Supabase, Redis optional)
  Supabase → PostgreSQL database

Docker Compose (self-hosted):
  Nginx (port 80)  →  upstream { web × N replicas }
  web              →  Django/Gunicorn (port 8000)
  db               →  PostgreSQL 15
  redis            →  Redis 7
  prometheus/grafana/loki/promtail  →  observability stack
```

---

## 3. Changes by Area

### 3.1 Gitignore Hardening

**Root `.gitignore`** — add:
```
# Internal tooling — never commit
.superpowers/
```

**Files to stage and commit (currently untracked):**
- `Piicasso/backend/intelligence/` — model infrastructure only (admin, apps, models, `__init__`)
- `Piicasso/backend/wordgen/services/` — metrics_service.py and `__init__`

**Verify not staged:**
- `Piicasso/frontend/.env` — contains real Google Client ID; covered by `frontend/.gitignore`; must NOT appear in commit

### 3.2 Dead Code Removal

**`Piicasso/backend/generator/`** — the generator app has an empty `views.py` and is not wired into `backend/urls.py`. Action: delete the entire `generator/` app directory and its migrations. It is already staged as modified — unstage and remove.

> Note: Before deleting, verify no other app imports from `generator`. If imports exist, replace with stub/pass rather than deleting.

### 3.3 Nginx Load Balancing (Docker Compose)

**File:** `Piicasso/nginx/nginx.conf`

Current:
```nginx
upstream backend {
    server web:8000;
}
```

Updated:
```nginx
upstream backend {
    least_conn;
    server web:8000;
    keepalive 32;
}
```

**File:** `Piicasso/docker-compose.yml`

Change the `web` service port mapping from `"8000:8000"` to `expose: ["8000"]` so that `docker compose up --scale web=3` works without port conflicts. Nginx resolves `web` via Docker DNS to all replicas.

Add to `docker-compose.yml` web service:
```yaml
deploy:
  replicas: 1        # override with --scale web=N at runtime
```

Update nginx service to depend on web being healthy before accepting traffic.

### 3.4 Gunicorn Tuning (Render Production)

**File:** `Piicasso/backend/start.sh`

Current: `--workers 1 --threads 2 --worker-class gthread`

Updated: `--workers 2 --threads 2 --worker-class gthread`

Rationale: Render free tier has 1 vCPU. With `gthread`, 2 workers × 2 threads = 4 concurrent requests with proper GIL release for I/O (Gemini API, DB). Memory footprint: ~180MB base + ~80MB/worker = ~340MB, within 512MB limit.

Add `--timeout 120` — required for Gemini AI response generation which can take 10–30s.

Final command:
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

### 3.5 Django Settings Verification (no changes needed)

- `CONN_MAX_AGE=600` — already set via `dj_database_url.config`
- Redis cache — correctly configured when `REDIS_URL` env var is present; falls back to `LocMemCache` otherwise (acceptable for Render free tier without paid Redis)
- `DEBUG=False` enforced when `ENV=production`
- All HSTS, SSL redirect, secure cookies — correctly gated on `not DEBUG`

### 3.6 Vercel Configuration Verification

`vercel.json` rewrites `/api/(.*)` → Render backend. Verify the Render URL in vercel.json matches the live service URL (`https://core-engine-woeg.onrender.com`).

---

## 4. Commit Strategy

Single atomic commit containing:
1. Root `.gitignore` update (add `.superpowers/`)
2. `Piicasso/backend/intelligence/` — new tracked module
3. `Piicasso/backend/wordgen/services/` — new tracked module
4. Dead generator app removed
5. `Piicasso/nginx/nginx.conf` — upstream with `least_conn` + `keepalive`
6. `Piicasso/docker-compose.yml` — expose instead of port bind on web
7. `Piicasso/backend/start.sh` — 2 workers, timeout 120
8. All previously staged files (full project)

Then: `git push origin main` → Render auto-deploy (5–8 min) + Vercel auto-deploy (2 min).

---

## 5. Out of Scope

- `intelligence/` views, URLs, serializers, or API endpoints — deferred
- PDF IntelligenceDossier export — deferred pending authorization context
- Horizontal scaling beyond free tier (Render paid plans)
- Mobile optimization implementation (covered in separate spec)
- Feature additions (covered in roadmap spec)

---

## 6. Success Criteria

- [ ] `git log` shows one clean commit with all project files
- [ ] No `.env` files, `node_modules`, `__pycache__`, or `.superpowers/` in the commit
- [ ] `intelligence/` and `wordgen/services/` present in commit
- [ ] `generator/` app absent from commit (removed)
- [ ] Nginx upstream uses `least_conn` + `keepalive 32`
- [ ] Docker Compose web service uses `expose` not port binding
- [ ] Gunicorn runs with `--workers 2 --timeout 120`
- [ ] Render health check passes at `/api/health/`
- [ ] Vercel frontend loads at `https://pii-casso.vercel.app`
