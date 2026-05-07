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
