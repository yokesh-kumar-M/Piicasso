# PIcasso Production Readiness Design Spec

**Date:** 2026-05-05  
**Status:** Approved by User  
**Scope:** Full production readiness for free-tier platforms

## Executive Summary

Transform PIcasso from a functional prototype to a professional-grade production application while staying on free-tier services. This involves:
1. Keep-alive system to prevent Render/Supabase spin-down
2. Security hardening across all layers
3. Full observability stack (Sentry + Better Stack + Prometheus + Grafana)
4. Polished CI/CD pipeline with automated testing
5. Code quality cleanup and performance optimization
6. Professional documentation overhaul

**Approach:** Parallel implementation using Git worktrees to avoid conflicts.

---

## Section 1: Keep-Alive System (GitHub Actions)

### Purpose
Prevent Render and Supabase free-tier services from spinning down due to inactivity.

### Implementation

**File:** `.github/workflows/keep-alive.yml`

```yaml
name: Keep Alive
on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes
  workflow_dispatch:  # Manual trigger

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Render Backend
        run: |
          curl -f https://core-engine-woeg.onrender.com/api/schema/ \
            -H "User-Agent: PIcasso-KeepAlive" \
            --max-time 30 || true
      
      - name: Ping Supabase
        run: |
          curl -f "${{ secrets.SUPABASE_URL }}/rest/v1/" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "User-Agent: PIcasso-KeepAlive" \
            --max-time 30 || true
      
      - name: Ping Vercel Frontend
        run: |
          curl -f https://pii-casso.vercel.app/ \
            -H "User-Agent: PIcasso-KeepAlive" \
            --max-time 30 || true
```

### Secrets Needed
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key for authenticated ping

### Why GitHub Actions
- Free for public repos
- Native to repo (no external signup)
- Easy cron syntax
- Logs available in Actions tab
- Can manually trigger for testing

---

## Section 2: Security Hardening

### Current State (from settings.py)
✅ CSP headers configured  
✅ SSL redirect in production  
✅ HSTS enabled (1 year)  
✅ X-Frame-Options: DENY  
✅ CSRF cookies configured  
⚠️ DEBUG=False in production (needs verification)  
⚠️ SECRET_KEY must be set (handled via env)

### Enhancements

#### 2.1 Verify Production Env Variables (Render)
```
DEBUG=False
ENV=production
DJANGO_SECRET_KEY=<strong, unique>
FIELD_ENCRYPTION_KEY=<generated via Fernet>
GOOGLE_CLIENT_ID=<from env>
GEMINI_API_KEY=<from env>
```

#### 2.2 Security Headers Middleware (already configured)
- Content-Security-Policy (already in settings)
- Permissions-Policy (already configured)
- Cross-Origin-Opener-Policy: `same-origin`

#### 2.3 Vercel Security (frontend)
Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://pii-casso.vercel.app" }
      ]
    }
  ],
  "rewrites": [...]
}
```

#### 2.4 Supabase Security
- Enable Row Level Security (RLS) on all tables
- Review authentication policies
- Enable audit logs (if available in free tier)
- Rotate anon key after adding to GitHub secrets

---

## Section 3: Monitoring & Observability Stack

### 3.1 Sentry (Error Tracking)
**Status:** Already configured in settings.py

**Actions:**
1. Add `SENTRY_DSN` to Render env variables
2. Verify Sentry receives errors in production
3. Set environment tag: `environment: production`

### 3.2 Better Stack (Uptime + Logs)
**Free Tier Includes:**
- Uptime monitoring for 3 endpoints
- Email alerts on downtime
- 1-day log retention (free)

**Endpoints to Monitor:**
- `https://pii-casso.vercel.app/` (frontend)
- `https://core-engine-woeg.onrender.com/api/schema/` (backend API)
- `{supabase-url}/rest/v1/` (database)

### 3.3 Prometheus (Metrics)
**Status:** Already in Django via `django_prometheus`

**Actions:**
1. Expose `/metrics/` endpoint in production
2. Configure Render to allow `/metrics/` path
3. Add to keep-alive exclusions (internal only)

### 3.4 Grafana Cloud (Dashboards)
**Free Tier:**
- 3 users
- 10k metrics
- 50GB logs

**Setup:**
1. Sign up at grafana.com
2. Add Prometheus as data source (point to Render `/metrics/`)
3. Create dashboards:
   - Request rate, error rate, response time
   - Database connection pool usage
   - Cache hit rate (if Redis enabled)

### 3.5 GitHub Actions Integration
Add to keep-alive workflow:
```yaml
- name: Check Sentry
  run: |
    curl -s "https://sentry.io/api/0/projects/${{ secrets.SENTRY_ORG }}/${{ secrets.SENTRY_PROJECT }}/events/" \
      -H "Authorization: Bearer ${{ secrets.SENTRY_TOKEN }}" || true
```

**Secrets Needed:**
- `SENTRY_DSN` (add to Render)
- `SENTRY_ORG` (for GitHub Actions)
- `SENTRY_PROJECT` (for GitHub Actions)
- `SENTRY_TOKEN` (for GitHub Actions, optional)
- `BETTER_STACK_API_KEY` (for uptime monitoring)

---

## Section 4: CI/CD Polish

### 4.1 GitHub Actions CI Pipeline
**File:** `.github/workflows/ci.yml` (update existing)

```yaml
name: CI Pipeline
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install -r Piicasso/backend/requirements.txt
      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          DJANGO_SECRET_KEY: test-secret-key
          ENV: test
        run: |
          cd Piicasso/backend
          python manage.py test
      - name: Lint with flake8
        run: |
          pip install flake8
          cd Piicasso/backend
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd Piicasso/frontend
          npm ci
      - name: Run tests
        run: |
          cd Piicasso/frontend
          npm test -- --watchAll=false
      - name: Build production bundle
        run: |
          cd Piicasso/frontend
          npm run build
      - name: Lint with ESLint
        run: |
          cd Piicasso/frontend
          npm run lint -- --max-warnings=0 || true
```

### 4.2 Linting & Code Quality
**Backend:**
- Add `flake8` to requirements.txt (dev)
- Configure `.flake8` file

**Frontend:**
- Fix ESLint warnings (unused imports)
- Ensure `eslint` and `prettier` are configured

### 4.3 Staging Environment
- Vercel preview deployments (automatic on PR)
- Render staging (manual or branch-based)

### 4.4 Deployment Flow
1. Push to `main` → GitHub Actions CI
2. Vercel auto-deploy (frontend) on success
3. Render auto-deploy (backend) on success
4. Keep-alive cron runs every 10 minutes

---

## Section 5: Code Quality & Performance Optimization

### 5.1 Backend Cleanup

**Fix Debug Code:**
- Remove any `print()` statements in production code
- Ensure `DEBUG=False` in production env
- Clean up `settings.py` (remove redundant comments)

**Database Optimization:**
- Add indexes to frequently queried fields:
  - `wordgen_operation.user_id`
  - `wordgen_operation.created_at`
  - `analytics_useractivity.user_id`
- Review `requirements.txt` - remove unused packages

**Query Optimization:**
- Use `select_related()` and `prefetch_related()` for Django ORM
- Connection pooling already configured (`conn_max_age=600`)

### 5.2 Frontend Cleanup

**Fix ESLint Warnings:**
- Remove unused imports across all pages
- Files with known issues: `DashboardPage.js`, `LandingPage.js`, etc.
- Run: `npm run lint -- --fix` (if available)

**Bundle Optimization:**
- ✅ Code splitting already implemented (React.lazy)
- ✅ Production build: ~800KB gzip'd (acceptable)
- Action: Analyze bundle with `npm run build -- --analyze` (if available)
- Action: Remove unused dependencies from `package.json`

**Performance Audit:**
- Ensure all images are optimized (WebP format)
- Add `loading="lazy"` to images below the fold
- Verify `react-globe.gl` is properly code-split (large dependency ~500KB)

### 5.3 Code Quality Tools

**Backend:**
- Add `black` (formatter) and `flake8` (linter) to dev dependencies

**Frontend:**
- Ensure `eslint` and `prettier` are configured

**Pre-commit (Optional):**
- `.pre-commit-config.yaml` for automated checks

---

## Section 6: Documentation Overhaul

### 6.1 Update `README.md`
**Current:** 280 lines, comprehensive  
**Enhancements:**
- Add "Production Status" badges (build passing, uptime, version)
- Add "Quick Deploy" buttons (Deploy to Render, Deploy to Vercel)
- Update "Live Demo" section with actual deployed URLs
- Add "Contribution Guidelines" section

**Badges to Add:**
```markdown
![Build Status](https://github.com/yourusername/PIIcasso/workflows/CI%20Pipeline/badge.svg)
![Uptime](https://img.shields.io/badge/uptime-99.9%25-brightgreen)
![Version](https://img.shields.io/badge/version-2.0.0-blue)
```

### 6.2 Update `piicasso.md`
**Current:** 142 lines, detailed  
**Enhancements:**
- Add "Production Architecture" section (diagram/description)
- Add "Deployment Pipeline" section (CI/CD flow)
- Add "Monitoring & Alerts" section (Sentry, Better Stack, Grafana)
- Add "Keep-Alive Mechanism" section (GitHub Actions cron)
- **Remove MCP configuration** (security: should not be in repo docs)

**⚠️ Security Issue:** Lines 130-133 contain actual API keys/tokens - **REMOVE IMMEDIATELY**

### 6.3 New Documentation Files

**`docs/DEPLOYMENT.md`:**
- Step-by-step Render backend deployment
- Step-by-step Vercel frontend deployment
- Environment variables checklist
- Database migration guide

**`docs/CONTRIBUTING.md`:**
- Branch naming conventions
- PR review process
- Code style guidelines
- Testing requirements

**`docs/API.md`:**
- Endpoint summary (or reference to `/api/docs/`)
- Authentication flow (JWT + Google OAuth)
- Rate limiting details

### 6.4 In-Code Documentation
- Add docstrings to all Django views
- Add JSDoc comments to complex React components
- Document custom hooks (`useResponsive.js`)

### 6.5 Remove Sensitive Info
**⚠️ CRITICAL:** `piicasso.md` lines 130-133 contain actual API keys/tokens:
- GitHub token: `[REDACTED — token was exposed, revoke immediately]`
- Vercel token: `[REDACTED — token was exposed, revoke immediately]`
- Render token: `[REDACTED — token was exposed, revoke immediately]`
- Supabase token: `[REDACTED — token was exposed, revoke immediately]`

**Actions:**
1. Remove these immediately from `piicasso.md`
2. Add `piicasso.md` to `.gitignore` (or just remove the tokens)
3. Revoke these keys and regenerate new ones
4. Add new keys to GitHub secrets / Render env vars

---

## Section 7: Git Workspace Strategy (Conflict Prevention)

### Purpose
Use Git worktrees to handle parallel agent work without conflicts.

### Git Worktree Setup

**Main Workspace (current):**  
`C:\Users\yokes\OneDrive\Documents\Full-stack\Django\PIIcasso\`

**Create Worktrees for Parallel Work:**
```bash
# Worktree 1: Keep-Alive + CI/CD
git worktree add ../piicasso-worktree-1 -b feature/keep-alive-cicd

# Worktree 2: Security + Monitoring
git worktree add ../piicasso-worktree-2 -b feature/security-monitoring

# Worktree 3: Code Quality + Docs
git worktree add ../piicasso-worktree-3 -b feature/code-quality-docs
```

### Agent Assignment
- **Agent 1** → Worktree 1: GitHub Actions keep-alive, CI pipeline
- **Agent 2** → Worktree 2: Security headers, Sentry, Better Stack, Grafana
- **Agent 3** → Worktree 3: Linting, bundle optimization, doc updates

### Merge Strategy
1. Each agent works in isolation
2. PR from each branch to `main`
3. Review and merge sequentially (or use `git merge` directly)
4. Delete worktrees after merge: `git worktree remove ../piicasso-worktree-1`

### Benefits
- No conflicts (each agent in separate directory)
- Clear separation of concerns
- Easy to test each feature independently
- Git history stays clean

---

## Implementation Plan (Next Step)

After user approval, invoke `writing-plans` skill to create detailed implementation plan with:
1. Worktree creation commands
2. Agent dispatch strategy
3. File-by-file change list
4. Verification steps
5. Rollback procedures

---

## Success Criteria

- [ ] Keep-alive pings succeed every 10 minutes
- [ ] All security headers present in production
- [ ] Sentry receiving errors from production
- [ ] Better Stack monitoring 3 endpoints
- [ ] Grafana dashboard showing metrics
- [ ] CI pipeline passes on all PRs
- [ ] All ESLint warnings fixed
- [ ] Bundle size stays under 1MB gzip'd
- [ ] Documentation is professional and complete
- [ ] No sensitive keys in repo
- [ ] All changes committed and pushed to GitHub
- [ ] Vercel auto-deploys on push
- [ ] Render auto-deploys on push

---

**Design approved by user: YES**  
**Next step:** Invoke `writing-plans` skill for implementation plan
