# Authentication Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure Login, Registration, and Google OAuth work smoothly across Local and Production deployments (Vercel -> Render).

**Architecture:** We are updating the Google Login endpoint to embed custom claims using the project's token serializer. We will also correct the `nginx.conf` and `vercel.json` routing files so the frontend can properly communicate with the backend.

**Tech Stack:** Django (DRF SimpleJWT), React, Nginx, Vercel/Render configurations.

---

### Task 1: Fix Google OAuth Custom Claims

**Files:**
- Modify: `Piicasso/backend/core/views.py`

- [ ] **Step 1: Write the minimal implementation**

Update `GoogleLoginView` inside `Piicasso/backend/core/views.py`. Locate the block where `RefreshToken.for_user(user)` is called, and replace it with `MyTokenObtainPairSerializer.get_token(user)`.

```python
            # Replace: refresh = RefreshToken.for_user(user)
            # With:
            refresh = MyTokenObtainPairSerializer.get_token(user)
```

- [ ] **Step 2: Commit**

```bash
cd Piicasso && git add backend/core/views.py && git commit -m "fix(auth): use custom token serializer in GoogleLoginView to embed user claims"
```

### Task 2: Fix Local Nginx Proxy Configuration

**Files:**
- Modify: `Piicasso/frontend/nginx.conf`

- [ ] **Step 1: Write the minimal implementation**

Open `Piicasso/frontend/nginx.conf` and remove the obsolete location blocks for `/api/password/`, `/api/teams/`, and `/api/user/health/`. Then, update the `proxy_pass` host from `backend:8000` to `web:8000` in the `/api/` and `/admin/` location blocks.

```nginx
    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://web:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://web:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
```

- [ ] **Step 2: Commit**

```bash
cd Piicasso && git add frontend/nginx.conf && git commit -m "fix(proxy): correct frontend nginx proxy to point to the unified web service"
```

### Task 3: Fix Production Vercel Proxy

**Files:**
- Modify: `Piicasso/vercel.json`

- [ ] **Step 1: Write the minimal implementation**

Update the `rewrites` array in `Piicasso/vercel.json` to proxy `/api/` traffic to Render.

```json
{
    "buildCommand": "cd frontend && npm i && npm run build",
    "outputDirectory": "frontend/build",
    "framework": "create-react-app",
    "rewrites": [
        {
            "source": "/api/(.*)",
            "destination": "https://piicasso.onrender.com/api/$1"
        },
        {
            "source": "/(.*)",
            "destination": "/index.html"
        }
    ]
}
```

- [ ] **Step 2: Commit**

```bash
cd Piicasso && git add vercel.json && git commit -m "fix(vercel): proxy /api/ to production Render backend"
```
