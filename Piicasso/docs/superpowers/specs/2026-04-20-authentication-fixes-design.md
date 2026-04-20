# Authentication Fixes Design

## Overview
This document outlines the fixes required to stabilize the authentication flow (Login, Register, Google OAuth) across both local Docker environments and Vercel/Render production deployments for the PIIcasso project.

## Architecture

### 1. Google OAuth Token Claims
The `GoogleLoginView` currently uses the default `RefreshToken` from `rest_framework_simplejwt.tokens`. As a result, the returned access token lacks custom claims (`username` and `is_superuser`). The frontend parses this JWT to set application state, leading to broken auth state for Google users.
- **Solution**: Modify `GoogleLoginView` in `Piicasso/backend/core/views.py` to generate the token using `MyTokenObtainPairSerializer.get_token(user)`.

### 2. Local Development Proxy Configuration
The local Nginx configuration for the frontend (`Piicasso/frontend/nginx.conf`) has obsolete routing configurations pointing to non-existent microservices (`user_backend:8001`) and references the monolithic Django backend incorrectly as `backend:8000`. The `docker-compose.yml` actually defines the backend service as `web`.
- **Solution**: 
  - Remove blocks for `/api/password/`, `/api/teams/`, and `/api/user/health/`.
  - Update the `/api/` proxy block to point to `http://web:8000`.
  - Update the `/admin/` proxy block to point to `http://web:8000`.

### 3. Production API URL Proxy (Vercel)
In production, the Vercel-hosted frontend sends API requests to relative paths (e.g., `/api/user/login/`). Without an explicit rewrite rule, Vercel falls back to its wildcard rule `/(.*)` -> `/index.html`, effectively returning the React app HTML for API requests instead of proxying them to Render.
- **Solution**: Update `Piicasso/vercel.json` to include a rewrite rule mapping `/api/(.*)` to `https://piicasso.onrender.com/api/$1`.
