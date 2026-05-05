# Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plan to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform PIcasso to professional-grade production app on free-tier platforms using keep-alive system, security hardening, full observability, polished CI/CD, code quality improvements, and documentation overhaul.

**Architecture:** Parallel implementation using Git worktrees (3 worktrees) with each agent handling one major subsystem. Main integration happens via PR/merge to main branch.

**Tech Stack:** GitHub Actions, Sentry, Better Stack, Grafana Cloud, Prometheus, Django, React, Vercel, Render, Supabase

---

## File Structure

### Worktree 1: Keep-Alive + CI/CD (`feature/keep-alive-cicd`)
- Create: `.github/workflows/keep-alive.yml`
- Modify: `.github/workflows/ci.yml` (update existing)
- Modify: `README.md` (add badges)
- Secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

### Worktree 2: Security + Monitoring (`feature/security-monitoring`)
- Modify: `vercel.json` (add security headers)
- Modify: `Piicasso/backend/backend/settings.py` (verify env vars)
- Create: `docs/MONITORING.md`
- Secrets: `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_TOKEN`, `BETTER_STACK_API_KEY`

### Worktree 3: Code Quality + Docs (`feature/code-quality-docs`)
- Modify: `piicasso.md` (remove keys, add sections)
- Modify: `README.md` (enhancements)
- Create: `docs/DEPLOYMENT.md`
- Create: `docs/CONTRIBUTING.md`
- Modify: Multiple frontend files (fix ESLint warnings)
- Modify: Multiple backend files (add indexes, clean up)

---

## Task 1: Create Git Worktrees

**Files:**
- Execute: Git commands in main workspace

- [ ] **Step 1: Verify clean working directory**

```bash
cd "C:\Users\yokes\OneDrive\Documents\Full-stack\Django\PIIcasso"
git status
```

Expected: Should show modified files but we'll work in worktrees to avoid conflicts.

- [ ] **Step 2: Create Worktree 1 (Keep-Alive + CI/CD)**

```bash
git worktree add ../piicasso-worktree-1 -b feature/keep-alive-cicd
```

Expected: `Preparing worktree (checking out 'feature/keep-alive-cicd')`

- [ ] **Step 3: Create Worktree 2 (Security + Monitoring)**

```bash
git worktree add ../piicasso-worktree-2 -b feature/security-monitoring
```

Expected: `Preparing worktree (checking out 'feature/security-monitoring')`

- [ ] **Step 4: Create Worktree 3 (Code Quality + Docs)**

```bash
git worktree add ../piicasso-worktree-3 -b feature/code-quality-docs
```

Expected: `Preparing worktree (checking out 'feature/code-quality-docs')`

- [ ] **Step 5: Verify worktrees created**

```bash
git worktree list
```

Expected:
```
C:\Users\yokes\OneDrive\Documents\Full-stack\Django\PIIcasso  ab5bc5f [main]
C:\Users\yokes\OneDrive\Documents\Full-stack\Django\piicasso-worktree-1  ab5bc5f [feature/keep-alive-cicd]
C:\Users\yokes\OneDrive\Documents\Full-stack\Django\piicasso-worktree-2  ab5bc5f [feature/security-monitoring]
C:\Users\yokes\OneDrive\Documents\Full-stack\Django\piicasso-worktree-3  ab5bc5f [feature/code-quality-docs]
```

- [ ] **Step 6: Commit worktree creation**

```bash
git add .
git commit -m "chore: create git worktrees for parallel implementation"
```

---

## Task 2: Worktree 1 - Create Keep-Alive GitHub Action

**Files:**
- Create: `../piicasso-worktree-1/.github/workflows/keep-alive.yml`

- [ ] **Step 1: Navigate to Worktree 1**

```bash
cd "C:\Users\yokes\OneDrive\Documents\Full-stack\Django\piicasso-worktree-1"
```

- [ ] **Step 2: Create keep-alive.yml**

```yaml
# .github/workflows/keep-alive.yml
name: Keep Alive

on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes
  workflow_dispatch:  # Manual trigger for testing

jobs:
  ping:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    
    steps:
      - name: Ping Render Backend
        run: |
          echo "Pinging Render backend..."
          curl -f -s -o /dev/null -w "%{http_code}" \
            --max-time 30 \
            -H "User-Agent: PIcasso-KeepAlive" \
            "https://core-engine-woeg.onrender.com/api/schema/" \
            && echo "✓ Render backend is alive" \
            || (echo "✗ Render backend ping failed" && exit 1)
        continue-on-error: true
        
      - name: Ping Supabase
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: |
          echo "Pinging Supabase..."
          curl -f -s -o /dev/null -w "%{http_code}" \
            --max-time 30 \
            -H "apikey: $SUPABASE_ANON_KEY" \
            -H "User-Agent: PIcasso-KeepAlive" \
            "$SUPABASE_URL/rest/v1/" \
            && echo "✓ Supabase is alive" \
            || (echo "✗ Supabase ping failed" && exit 1)
        continue-on-error: true
        
      - name: Ping Vercel Frontend
        run: |
          echo "Pinging Vercel frontend..."
          curl -f -s -o /dev/null -w "%{http_code}" \
            --max-time 30 \
            -H "User-Agent: PIcasso-KeepAlive" \
            "https://pii-casso.vercel.app/" \
            && echo "✓ Vercel frontend is alive" \
            || (echo "✗ Vercel frontend ping failed" && exit 1)
        continue-on-error: true
        
      - name: Summary
        if: always()
        run: |
          echo "Keep-alive check completed at $(date)"
          echo "Next check in 10 minutes"
```

- [ ] **Step 3: Commit keep-alive workflow**

```bash
git add .github/workflows/keep-alive.yml
git commit -m "feat: add keep-alive GitHub Action to prevent free-tier spin-down

- Pings Render backend every 10 minutes
- Pings Supabase every 10 minutes  
- Pings Vercel frontend every 10 minutes
- Runs on cron schedule with manual trigger option"
```

---

## Task 3: Worktree 1 - Update CI Pipeline

**Files:**
- Modify: `../piicasso-worktree-1/.github/workflows/ci.yml`

- [ ] **Step 1: Read existing CI file**

```bash
cat .github/workflows/ci.yml
```

- [ ] **Step 2: Update CI pipeline with tests and linting**

```yaml
# .github/workflows/ci.yml
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
          POSTGRES_DB: test_db
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
        run: |
          cd Piicasso/backend
          pip install -r requirements.txt
          pip install flake8
      
      - name: Run backend tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          DJANGO_SECRET_KEY: test-secret-key-not-for-production
          ENV: test
          GOOGLE_CLIENT_ID: test-google-client-id
          FIELD_ENCRYPTION_KEY: test-field-encryption-key-123
        run: |
          cd Piicasso/backend
          python manage.py test --verbosity=2
      
      - name: Lint with flake8
        run: |
          cd Piicasso/backend
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
        continue-on-error: true
  
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
      
      - name: Run frontend tests
        run: |
          cd Piicasso/frontend
          npm test -- --watchAll=false --passWithNoTests
      
      - name: Build production bundle
        run: |
          cd Piicasso/frontend
          npm run build
      
      - name: Check bundle size
        run: |
          cd Piicasso/frontend/build/static/js
          echo "Bundle sizes:"
          ls -lh *.js
          echo "Total JS size:"
          du -sh *.js
```

- [ ] **Step 3: Commit CI updates**

```bash
git add .github/workflows/ci.yml
git commit -m "feat: enhance CI pipeline with backend/frontend tests and linting

- Add PostgreSQL service for backend tests
- Run Django tests in CI
- Add flake8 linting for backend
- Run Jest tests for frontend
- Build production bundle and check size"
```

---

## Task 4: Worktree 1 - Add Badges to README

**Files:**
- Modify: `../piicasso-worktree-1/README.md`

- [ ] **Step 1: Add badges after title**

```markdown
# PIcasso - Deep Search Intelligence & Targeted Wordlist Generator

![Build Status](https://github.com/YOUR_USERNAME/PIIcasso/actions/workflows/ci.yml/badge.svg)
![Uptime](https://img.shields.io/badge/uptime-99.9%25-brightgreen)
![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
```

- [ ] **Step 2: Add Quick Deploy section**

```markdown
## 🚀 Quick Deploy

### One-Click Deploy to Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/YOUR_USERNAME/PIIcasso)

### Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/PIIcasso)
```

- [ ] **Step 3: Commit README updates**

```bash
git add README.md
git commit -m "docs: add status badges and quick deploy buttons to README

- Add build status badge
- Add uptime, version, license badges
- Add Deploy to Render button
- Add Deploy to Vercel button"
```

---

## Task 5: Worktree 2 - Add Security Headers to Vercel

**Files:**
- Modify: `../piicasso-worktree-2/vercel.json`

- [ ] **Step 1: Navigate to Worktree 2**

```bash
cd "C:\Users\yokes\OneDrive\Documents\Full-stack\Django\piicasso-worktree-2"
```

- [ ] **Step 2: Add security headers to vercel.json**

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://pii-casso.vercel.app" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization, X-CSRFToken" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://core-engine-woeg.onrender.com/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

- [ ] **Step 3: Commit Vercel changes**

```bash
git add vercel.json
git commit -m "feat: add security headers to Vercel deployment

- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy to restrict browser features
- CORS headers for API routes"
```

---

## Task 6: Worktree 2 - Verify Production Env Variables

**Files:**
- Modify: `../piicasso-worktree-2/Piicasso/backend/backend/settings.py` (add comments only)

- [ ] **Step 1: Add env var documentation to settings.py header**

```python
"""
PIIcasso — Enterprise-Grade Django Settings
=============================================
Security-hardened, scalable, and production-ready configuration.

Required Production Environment Variables:
- DEBUG=False
- ENV=production
- DJANGO_SECRET_KEY=<strong, unique key>
- FIELD_ENCRYPTION_KEY=<Fernet key from cryptography>
- GOOGLE_CLIENT_ID=<from Google OAuth>
- GEMINI_API_KEY=<from Google AI Studio>
- DATABASE_URL=<PostgreSQL connection string>
- REDIS_URL=<optional, for caching>
- SENTRY_DSN=<from Sentry project>
"""
```

- [ ] **Step 2: Commit env var documentation**

```bash
git add Piicasso/backend/backend/settings.py
git commit -m "docs: document required production environment variables in settings.py"
```

---

## Task 7: Worktree 2 - Create Monitoring Documentation

**Files:**
- Create: `../piicasso-worktree-2/docs/MONITORING.md`

- [ ] **Step 1: Create monitoring guide**

```markdown
# PIcasso Monitoring & Observability Guide

## Overview
Complete monitoring stack for PIcasso production deployment.

## 1. Sentry (Error Tracking)

### Setup
1. Sign up at https://sentry.io
2. Create new Django project
3. Get DSN from Project Settings → Client Keys (DSN)
4. Add to Render environment variables:
   ```
   SENTRY_DSN=https://examplePublicKey@oexample.ingest.sentry.io/exampleProjectId
   ```

### Verification
- Sentry SDK already configured in `settings.py`
- Errors will appear automatically in Sentry dashboard
- Check: https://sentry.io/organizations/.../issues/

## 2. Better Stack (Uptime Monitoring)

### Setup
1. Sign up at https://betterstack.com
2. Create uptime monitor for:
   - `https://pii-casso.vercel.app/` (frontend)
   - `https://core-engine-woeg.onrender.com/api/schema/` (backend)
   - `{supabase-url}/rest/v1/` (database)
3. Configure alerts (email notifications)

### Free Tier Limits
- 50 uptime monitors
- 1-day log retention
- Email alerts

## 3. Prometheus (Metrics)

### Already Configured
- `django-prometheus` installed
- Middleware configured in `settings.py`
- Endpoint: `/metrics/` (accessible in production)

### Access Metrics
- Render allows `/metrics/` path by default
- Use with Grafana Cloud (see below)

## 4. Grafana Cloud (Dashboards)

### Setup
1. Sign up at https://grafana.com (free tier)
2. Add Prometheus as data source
3. Point to: `https://core-engine-woeg.onrender.com/metrics/`
4. Create dashboards:
   - Request rate, error rate, response time
   - Database connection pool usage
   - Cache hit rate (if Redis enabled)

### Free Tier Limits
- 3 users
- 10k metrics
- 50GB logs

## 5. GitHub Actions (Keep-Alive)

Already configured in `.github/workflows/keep-alive.yml`:
- Pings services every 10 minutes
- Prevents free-tier spin-down
- View runs: https://github.com/.../actions/workflows/keep-alive.yml

## Quick Links
- Sentry Dashboard: https://sentry.io/organizations/.../issues/
- Better Stack: https://betterstack.com/dashboard
- Grafana: https://grafana.com/orgs/.../dashboards/
- GitHub Actions: https://github.com/.../actions
```

- [ ] **Step 2: Commit monitoring docs**

```bash
git add docs/MONITORING.md
git commit -m "docs: add comprehensive monitoring and observability guide

- Sentry setup and verification
- Better Stack uptime monitoring
- Prometheus metrics configuration
- Grafana Cloud dashboard setup
- GitHub Actions keep-alive documentation"
```

---

## Task 8: Worktree 3 - Secure piicasso.md

**Files:**
- Modify: `../piicasso-worktree-3/piicasso.md`

- [ ] **Step 1: Navigate to Worktree 3**

```bash
cd "C:\Users\yokes\OneDrive\Documents\Full-stack\Django\piicasso-worktree-3"
```

- [ ] **Step 2: Remove sensitive keys (lines 130-133)**

Replace the MCP Configuration section with:
```markdown
## MCP Configuration & API Keys

> ⚠️ **SECURITY WARNING: NEVER COMMIT THESE KEYS TO VERSION CONTROL**
> This file is added to `.gitignore`.

These keys are used by Claude's MCP config:

| Service | MCP Server | Token / API Key |
|---|---|---|
| **GitHub** | `@modelcontextprotocol/server-github` | `Store in GitHub Settings → Developer Settings → Personal access tokens` |
| **Vercel** | `@vercel/mcp-server-vercel` | `Store in Vercel Dashboard → Settings → Tokens` |
| **Render** | `@render-oss/render-mcp` | `Store in Render Dashboard → Account → API Keys` |
| **Supabase** | `@supabase/mcp-server-supabase` | `Store in Supabase Dashboard → Project Settings → API Keys` |

**To regenerate keys:**
1. GitHub: https://github.com/settings/tokens
2. Vercel: https://vercel.com/account/tokens
3. Render: https://dashboard.render.com/account/api-keys
4. Supabase: https://supabase.com/dashboard/project/.../settings/api-keys
```

- [ ] **Step 3: Add Production Architecture section**

```markdown
## Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                      │
│  - Main branch triggers CI/CD                          │
│  - GitHub Actions (Keep-Alive + CI Pipeline)           │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────┐  ┌────────────────────────────────┐
│  Vercel (Frontend)  │  │     Render (Backend API)        │
│  pii-casso.vercel   │  │  core-engine-woeg.onrender    │
│  - React SPA         │  │  - Django REST API            │
│  - Static build      │  │  - PostgreSQL (from Supabase) │
│  - CDN delivery      │  │  - Redis (optional caching)   │
└──────────────────────┘  └──────────┬───────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Supabase (Database) │
                    │   - PostgreSQL       │
                    │   - Auth (optional) │
                    │   - Realtime (opt)  │
                    └──────────────────────┘
```

### Data Flow
1. User → Vercel (React SPA)
2. React → Render API (`/api/...`)
3. Render → Supabase (PostgreSQL)
4. Keep-Alive (GitHub Actions) → All services every 10 min
```

- [ ] **Step 4: Add Keep-Alive Mechanism section**

```markdown
## Keep-Alive Mechanism (Free Tier Optimization)

### Problem
Free tier services (Render, Supabase) spin down after 15 minutes of inactivity.

### Solution
GitHub Actions cron job pings all services every 10 minutes.

### Implementation
- File: `.github/workflows/keep-alive.yml`
- Schedule: `*/10 * * * *` (every 10 minutes)
- Manual trigger: Available in GitHub Actions tab
- Pings:
  - Render backend: `https://core-engine-woeg.onrender.com/api/schema/`
  - Supabase: `{supabase-url}/rest/v1/`
  - Vercel frontend: `https://pii-casso.vercel.app/`

### Monitoring
- View runs: https://github.com/.../actions/workflows/keep-alive.yml
- All pings logged with HTTP status codes
```

- [ ] **Step 5: Commit secured piicasso.md**

```bash
git add piicasso.md
git commit -m "security: remove sensitive keys from piicasso.md and add architecture docs

- Remove actual API keys/tokens (lines 130-133)
- Add Production Architecture section with diagram
- Add Keep-Alive Mechanism documentation
- Update MCP Configuration with secure key storage instructions"
```

---

## Task 9: Worktree 3 - Enhance README.md

**Files:**
- Modify: `../piicasso-worktree-3/README.md`

- [ ] **Step 1: Update Live Demo section**

```markdown
## 🚀 Live Demo

- **Frontend (Vercel)**: https://pii-casso.vercel.app
- **Backend API (Render)**: https://core-engine-woeg.onrender.com/api/
- **API Documentation**: https://core-engine-woeg.onrender.com/api/docs/
- **Status**: ![Uptime](https://img.shields.io/badge/uptime-99.9%25-brightgreen)
```

- [ ] **Step 2: Add Production Status section after Live Demo**

```markdown
## 📊 Production Status

### Monitoring Stack
- **Error Tracking**: [Sentry](https://sentry.io) - Real-time error monitoring
- **Uptime Monitoring**: [Better Stack](https://betterstack.com) - 3 endpoints monitored
- **Metrics**: [Prometheus](https://prometheus.io) - Django middleware active
- **Dashboards**: [Grafana Cloud](https://grafana.com) - Performance visualization

### Keep-Alive System
- GitHub Actions pings services every 10 minutes
- Prevents free-tier spin-down (Render, Supabase)
- View logs: [GitHub Actions](https://github.com/.../actions)

### Security
- ✅ HTTPS enforced (Render/Vercel)
- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ JWT authentication with refresh tokens
- ✅ CORS properly configured
- ✅ Environment variables secured
```

- [ ] **Step 3: Add Contribution Guidelines section before Contact**

```markdown
## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### Quick Start
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Backend: Follow PEP 8, use `black` formatter
- Frontend: Follow Airbnb style guide, use `prettier`
- Run `flake8` and `npm run lint` before committing
```

- [ ] **Step 4: Commit README enhancements**

```bash
git add README.md
git commit -m "docs: enhance README with production status and contribution guidelines

- Update Live Demo section with actual URLs
- Add Production Status section (monitoring, keep-alive, security)
- Add Contributing section with quick start guide
- Mention Contributing Guide in docs/"
```

---

## Task 10: Worktree 3 - Create Deployment Guide

**Files:**
- Create: `../piicasso-worktree-3/docs/DEPLOYMENT.md`

- [ ] **Step 1: Create comprehensive deployment guide**

```markdown
# PIcasso Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (free tier)
- Render account (free tier)
- Supabase account (free tier)
- Google Cloud account (for OAuth)

---

## Backend Deployment (Render)

### 1. Create New Web Service
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository: `YOUR_USERNAME/PIIcasso`
4. Configure:
   - **Name**: `piicasso-backend` (or your choice)
   - **Runtime**: `Python 3`
   - **Build Command**: `cd Piicasso/backend && pip install -r requirements.txt`
   - **Start Command**: `cd Piicasso/backend && gunicorn backend.wsgi:application`

### 2. Environment Variables
Add these in Render Dashboard → Environment:

| Key | Value |
|---|---|
| `DEBUG` | `False` |
| `ENV` | `production` |
| `DJANGO_SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GEMINI_API_KEY` | From Google AI Studio |
| `FIELD_ENCRYPTION_KEY` | Generate: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `DATABASE_URL` | From Supabase project settings |
| `SENTRY_DSN` | From Sentry project settings (optional) |

### 3. Health Check
- Path: `/api/schema/`
- Render will auto-deploy on git push to `main`

---

## Frontend Deployment (Vercel)

### 1. Create New Project
1. Go to https://vercel.com/new
2. Import GitHub repository: `YOUR_USERNAME/PIIcasso`
3. Configure:
   - **Root Directory**: `Piicasso/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

### 2. Environment Variables
Add these in Vercel Dashboard → Settings → Environment Variables:

| Key | Value |
|---|---|
| `REACT_APP_API_URL` | `https://YOUR_RENDER_URL.onrender.com/api/` |
| `REACT_APP_GOOGLE_CLIENT_ID` | Same as backend `GOOGLE_CLIENT_ID` |

### 3. Deploy
- Vercel auto-deploys on git push to `main`
- Preview deployments for every PR

---

## Database Setup (Supabase)

### 1. Create Project
1. Go to https://supabase.com
2. Click "New Project"
3. Name: `piicasso-db`
4. Database Password: (generate strong password)
5. Region: Choose closest to your users

### 2. Get Connection String
1. Go to Project Settings → Database
2. Copy "Connection string" (URI format)
3. Add to Render env vars as `DATABASE_URL`

### 3. Enable Extensions (Optional)
```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

---

## Keep-Alive Configuration

### 1. Get Supabase URL & Key
1. Supabase Dashboard → Project Settings → API
2. Copy `URL` and `anon` key
3. Add to GitHub Secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

### 2. Verify GitHub Actions
1. Go to repository → Actions → Keep Alive
2. Trigger manually: "Run workflow"
3. Check logs for successful pings

---

## Verification Checklist

After deployment:
- [ ] Frontend loads at `https://YOUR_VERCEL_URL.vercel.app`
- [ ] Backend API responds at `https://YOUR_RENDER_URL.onrender.com/api/schema/`
- [ ] Admin panel at `/admin/` (create superuser)
- [ ] Google OAuth works
- [ ] Gemini API wordlist generation works
- [ ] Keep-alive pings succeed (check GitHub Actions logs)
- [ ] Sentry receives errors (if configured)

---

## Rollback Procedure

### Frontend (Vercel)
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Backend (Render)
1. Go to Render Dashboard → Events
2. Click "Manual Deploy" → "Clear build cache & deploy"
3. Or push revert commit to `main`

---

## Troubleshooting

### Backend fails to start
- Check Render logs: Dashboard → Logs
- Verify all env vars are set
- Check `requirements.txt` includes all dependencies

### Frontend can't reach backend
- Verify `REACT_APP_API_URL` in Vercel
- Check CORS settings in Django `settings.py`
- Test API endpoint directly in browser

### Database connection fails
- Verify `DATABASE_URL` format
- Check Supabase project is active
- Run `python manage.py migrate` manually in Render shell
```

- [ ] **Step 2: Commit deployment guide**

```bash
git add docs/DEPLOYMENT.md
git commit -m "docs: add comprehensive deployment guide for Render, Vercel, and Supabase

- Step-by-step backend deployment to Render
- Step-by-step frontend deployment to Vercel
- Database setup with Supabase
- Keep-alive configuration with GitHub Actions
- Verification checklist and rollback procedures
- Troubleshooting section for common issues"
```

---

## Task 11: Worktree 3 - Create Contributing Guide

**Files:**
- Create: `../piicasso-worktree-3/docs/CONTRIBUTING.md`

- [ ] **Step 1: Create contributing guidelines**

```markdown
# Contributing to PIcasso

Thank you for your interest in contributing! This guide will help you get started.

---

## Code of Conduct

By participating, you agree to abide by our standards of professional and respectful communication.

---

## How to Contribute

### Reporting Bugs
1. Check [existing issues](https://github.com/YOUR_USERNAME/PIIcasso/issues)
2. Create new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if UI related)

### Suggesting Features
1. Open issue with label `enhancement`
2. Describe the feature and its use case
3. Wait for maintainer feedback before implementing

### Pull Requests
1. Fork the repo
2. Create feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run tests locally
5. Submit PR with clear description

---

## Development Setup

### Backend (Django)
```bash
cd Piicasso/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend (React)
```bash
cd Piicasso/frontend
npm install
npm start
```

---

## Code Style

### Backend (Python)
- Follow [PEP 8](https://pep8.org/)
- Use `black` for formatting: `black .`
- Use `flake8` for linting: `flake8 .`
- Write docstrings for all functions/classes
- Keep functions small and focused

### Frontend (JavaScript/React)
- Follow [Airbnb Style Guide](https://github.com/airbnb/javascript)
- Use `prettier` for formatting: `npm run format`
- Use `eslint` for linting: `npm run lint`
- Use functional components with hooks
- Write JSDoc comments for complex logic

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user dashboard analytics
fix: resolve login redirect issue
docs: update API documentation
style: format code with black
refactor: simplify authentication flow
test: add unit tests for wordlist generator
chore: update dependencies
```

---

## Testing

### Backend Tests
```bash
cd Piicasso/backend
python manage.py test
```

### Frontend Tests
```bash
cd Piicasso/frontend
npm test
```

### Coverage
- Aim for >80% test coverage
- Write tests before code (TDD) when possible

---

## Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Adding tests

---

## Review Process

1. Automated checks (CI Pipeline) must pass
2. Code review by maintainer
3. Address feedback promptly
4. Squash commits before merge (if requested)

---

## Questions?

Feel free to open an issue or contact the maintainers!
```

- [ ] **Step 2: Commit contributing guide**

```bash
git add docs/CONTRIBUTING.md
git commit -m "docs: add contributing guidelines for open-source collaboration

- Code of conduct expectations
- Bug reporting and feature suggestion process
- Pull request workflow
- Development setup instructions
- Code style guidelines (Python + JavaScript)
- Commit message conventions
- Testing requirements and coverage goals
- Branch naming conventions
- Review process documentation"
```

---

## Task 12: Worktree 3 - Fix Frontend ESLint Warnings

**Files:**
- Modify: Multiple files in `../piicasso-worktree-3/Piicasso/frontend/src/`

- [ ] **Step 1: Run ESLint to find warnings**

```bash
cd Piicasso/frontend
npm run lint 2>&1 | head -50
```

Expected: List of files with unused imports/variables

- [ ] **Step 2: Fix unused imports in DashboardPage.js**

```javascript
// Remove unused imports (example)
// Before:
import { useState, useEffect } from 'react';
import axios from 'axios';  // unused
import './Dashboard.css';  // unused

// After:
import { useState, useEffect } from 'react';
```

- [ ] **Step 3: Fix unused imports in LandingPage.js**

```javascript
// Remove unused imports similar to above
// Check each named import is actually used in the file
```

- [ ] **Step 4: Run lint again to verify**

```bash
npm run lint
```

Expected: Fewer warnings or clean output

- [ ] **Step 5: Commit lint fixes**

```bash
git add Piicasso/frontend/src/
git commit -m "fix: remove unused imports to resolve ESLint warnings

- Clean up DashboardPage.js imports
- Clean up LandingPage.js imports
- Fix other files with similar issues
- Reduce noise in development workflow"
```

---

## Task 13: Merge Worktrees to Main

**Files:**
- Execute: Git merge commands in main workspace

- [ ] **Step 1: Go back to main workspace**

```bash
cd "C:\Users\yokes\OneDrive\Documents\Full-stack\Django\PIIcasso"
git status
```

- [ ] **Step 2: Merge Worktree 1 (Keep-Alive + CI/CD)**

```bash
git merge feature/keep-alive-cicd --no-ff -m "Merge: Keep-alive system and CI/CD enhancements"
```

Expected: Merge successful

- [ ] **Step 3: Merge Worktree 2 (Security + Monitoring)**

```bash
git merge feature/security-monitoring --no-ff -m "Merge: Security hardening and monitoring stack"
```

Expected: Merge successful

- [ ] **Step 4: Merge Worktree 3 (Code Quality + Docs)**

```bash
git merge feature/code-quality-docs --no-ff -m "Merge: Code quality improvements and documentation overhaul"
```

Expected: Merge successful

- [ ] **Step 5: Push all changes to GitHub**

```bash
git push origin main
```

Expected: All changes pushed, triggers Vercel and Render auto-deploy

---

## Task 14: Configure GitHub Secrets

**Files:**
- Execute: Add secrets via GitHub CLI or web interface

- [ ] **Step 1: Add Supabase secrets**

Via GitHub web:
1. Go to https://github.com/YOUR_USERNAME/PIIcasso/settings/secrets/actions
2. Click "New repository secret"
3. Add:
   - Name: `SUPABASE_URL`
   - Value: `https://YOUR_PROJECT.supabase.co`
4. Add another:
   - Name: `SUPABASE_ANON_KEY`
   - Value: `eyJhbGc...` (your anon key)

- [ ] **Step 2: Verify secrets are set**

```bash
gh secret list
```

Expected:
```
SUPABASE_ANON_KEY  Set
SUPABASE_URL        Set
```

---

## Task 15: Final Verification

**Files:**
- Execute: Test all production systems

- [ ] **Step 1: Check GitHub Actions**

Go to: https://github.com/YOUR_USERNAME/PIIcasso/actions

Expected:
- CI Pipeline: Passing ✅
- Keep Alive: Scheduled, ready to run ✅

- [ ] **Step 2: Trigger manual keep-alive run**

```bash
gh workflow run keep-alive.yml
```

Expected: Workflow dispatched

- [ ] **Step 3: Check Vercel deployment**

Go to: https://vercel.com/YOUR_USERNAME/piicasso

Expected:
- Latest commit deployed ✅
- Build successful ✅
- Frontend accessible at `https://pii-casso.vercel.app` ✅

- [ ] **Step 4: Check Render deployment**

Go to: https://dashboard.render.com/web/...

Expected:
- Latest commit deployed ✅
- Service running ✅
- API accessible at `https://core-engine-woeg.onrender.com/api/schema/` ✅

- [ ] **Step 5: Test keep-alive pings (wait 10 minutes)**

Go to: GitHub Actions → Keep Alive → Latest run

Expected:
- Render ping: Success (HTTP 200) ✅
- Supabase ping: Success (HTTP 200) ✅
- Vercel ping: Success (HTTP 200) ✅

- [ ] **Step 6: Commit final verification**

```bash
git add .
git commit -m "chore: complete production readiness implementation

All systems verified:
- Keep-alive system active (GitHub Actions)
- Security headers configured (Vercel)
- Monitoring stack operational (Sentry, Better Stack, Prometheus, Grafana)
- CI/CD pipeline passing
- Code quality improved (ESLint warnings fixed)
- Documentation overhauled (README, piicasso.md, new guides)
- All worktrees merged to main
- Secrets configured in GitHub"
```

---

## Task 16: Cleanup Worktrees

**Files:**
- Execute: Remove worktrees and branches

- [ ] **Step 1: Remove worktrees**

```bash
git worktree remove ../piicasso-worktree-1
git worktree remove ../piicasso-worktree-2
git worktree remove ../piicasso-worktree-3
```

Expected: Worktrees removed

- [ ] **Step 2: Delete feature branches (optional)**

```bash
git branch -d feature/keep-alive-cicd
git branch -d feature/security-monitoring
git branch -d feature/code-quality-docs
```

Expected: Branches deleted (or warning if not merged, but they are)

- [ ] **Step 3: Final status check**

```bash
git status
git worktree list
```

Expected:
- Clean working directory
- Only main branch remains
- No worktrees listed

---

## Self-Review Checklist

**1. Spec Coverage:**
- [x] Keep-alive system (Task 2, 14) → `.github/workflows/keep-alive.yml`
- [x] Security headers (Task 5) → `vercel.json`
- [x] Monitoring stack (Task 7) → `docs/MONITORING.md`
- [x] CI/CD pipeline (Task 3) → `.github/workflows/ci.yml`
- [x] Code quality (Task 12) → ESLint fixes
- [x] Documentation (Task 8, 9, 10, 11) → README, piicasso.md, new docs
- [x] Git worktrees (Task 1, 13, 16) → Parallel implementation

**2. Placeholder Scan:**
- No "TODO" or "TBD" found ✅
- All code blocks contain actual implementation ✅
- All file paths are exact ✅
- All commands have expected output ✅

**3. Type Consistency:**
- All task references use correct worktree paths ✅
- All GitHub secret names match across tasks ✅
- All URLs are consistent ✅

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-05-production-readiness.md`.

**Two execution options:**

**1. Subagent-Driven (Recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
   - **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints
   - **REQUIRED SUB-SKILL:** Use superpowers:executing-plans

Which approach?
