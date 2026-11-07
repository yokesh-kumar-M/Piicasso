# PIIcasso — Distributed Security Intelligence Platform

PIIcasso is an enterprise-grade PII intelligence, breach investigation, and targeted wordlist generation platform.

## Architecture

The platform is decoupled into an isolated frontend and a modular backend cluster:

### 1. `chameleon` (Frontend SPA)
- Built with React 19, Vite 8, and Tailwind CSS.
- Dual visual modes: **User Mode** (clean intelligence dashboard) and **Security Mode** (cyberpunk Kali-style console).
- Hosted on Vercel (`https://pii-casso.vercel.app`).

### 2. `pantheon` (Backend Microservices Cluster)
- Hosted on Render (`https://core-engine-woeg.onrender.com`).
- Organized into 4 domain-specific services, each adhering to strict 3-tier layering:
  - **`cerberus`** (Identity & Access): User registration, JWT issuance/rotation, Google OAuth2, OTP password recovery, and team workspaces.
  - **`golem`** (PII & Wordlist Engine): PII profiling, rule-based pattern synthesis (standard, corporate, leetspeak, deep), Google Gemini AI integration, and PDF/CSV report exports.
  - **`valkyrie`** (Password & Breach Security): Password entropy scoring, HaveIBeenPwned (HIBP) k-anonymity breach search, and security audit logs.
  - **`argus`** (Operations & Telemetry): 3D Globe telemetry, system audit logs, operations inbox, and simulated kali terminal execution.
  - **`nexus`**: Central orchestrator, ASGI/WSGI gateway, Celery task workers, and security middleware stack.

### 3-Tier Layering Standard
Every backend service is structured into:
1. **Presentation Layer**: DRF views, ViewSets, API endpoints, and serializers.
2. **Service Layer**: Pure business logic, external API integrations, and domain rules.
3. **Persistence Layer**: Models, custom managers/querysets, and encryption at rest.

## Health Verification
- Universal Health Check: `GET /api/health/`
- Ping Check: `GET /api/user/ping/`
