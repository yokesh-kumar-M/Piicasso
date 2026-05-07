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
3. Connect GitHub repository: `yokesh-kumar-M/PIIcasso`
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
2. Import GitHub repository: `yokesh-kumar-M/PIIcasso`
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
