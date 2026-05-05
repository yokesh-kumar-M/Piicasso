# PIcasso Project Documentation

## Overview
PIcasso is a Deep Search Intelligence and Targeted Wordlist Generator platform built with Django (backend) + React (frontend). It features dual-mode operation: **Security Mode** (tactical dark/red theme) and **User Mode** (midnight cobalt glass theme).

## Project Structure
```
PIIcasso/
├── Piicasso/
│   ├── backend/          # Django API, auth, PII detection engine
│   └── frontend/        # React SPA with Tailwind CSS
│       ├── src/
│       │   ├── components/   # Navbar, Layout, ModeManager, etc.
│       │   ├── pages/        # Dashboard, Login, Landing, etc.
│       │   ├── context/      # AuthContext, ModeContext
│       │   ├── hooks/        # useResponsive (NEW)
│       │   ├── lib/          # piEngine.js (PII detection)
│       │   └── design/       # Design system components (Phase A)
│       └── public/
└── piicasso.md           # This file
```

## Phase A: Design System (Completed ✅)
Portted design tokens and components for v3 editorial redesign:
- **Design tokens**: CSS custom properties for colors, typography, spacing
- **Tailwind extension**: Custom classes in `index.css`
- **Mode-aware theming**: `[data-mode="user"]` swaps accent-hue without changing chroma/lightness
- **Shared components** (in `src/components/design/`):
  - `Logo.jsx`, `ModePill.jsx`, `Reveal.jsx` (scroll animations)
  - `Section.jsx`, `Parallax.jsx`, `MarketingNav.jsx`, `Footer.jsx`
  - `GoogleGlyph.jsx`, `AuthShell.jsx`, `AttackVizSide.jsx`
  - `Field.jsx`, `Divider.jsx`, `SsoButtons.jsx`
- **PII Engine**: `lib/piiEngine.js` - client-side PII detection + crackability scoring

## Phase B: Page Redesign (Completed ✅)
Three subagents completed work in parallel:
1. **Auth Pages** (LoginPage, RegisterPage, ForgotPasswordPage):
   - LoginPage ✅ - Uses AuthShell, AttackVizSide, ModePill, SsoButtons
   - RegisterPage ✅ - Multi-step form with live password scoring
   - ForgotPasswordPage ✅ - Styled with design system components

2. **Landing Page** ✅:
   - Hero section with live PII demo (typewriter effect)
   - Split modes explanation (Security vs User)
   - Feature grid, pricing preview, animated sections

3. **Dashboard Pages** ✅:
   - SecurityDashboardPage - Tactical layout with radar chart, target form
   - UserDashboardPage - Glass morphism design with quick password check
   - NewOperationPage - Terminal-styled configuration panel

## Phase C: Integration & Build (Completed ✅)
- ✅ Production build successful (build/ folder generated)
- ✅ All pages compile without errors
- ✅ Eslint warnings present (unused imports - non-blocking)
- ✅ Bundle size: ~800KB gzip'd (within acceptable range)

## Responsive Design (Completed ✅)
Added comprehensive mobile/tablet support without altering functionality:

### Files Modified:
1. **`index.css`** - Added:
   - Extra small devices (320px+): `.xs:` prefix utilities
   - Small devices (640px+): `.sm:` prefix
   - Mobile (≤768px): Touch targets (44px), iOS zoom prevention
   - Tablet (768px-1023px): 2-column grids, adjusted spacing
   - Large tablet (1024px-1279px): 3-column grid support

2. **`hooks/useResponsive.js`** (NEW):
   - Detects device type (mobile/tablet/desktop)
   - Provides: `isMobile`, `isTablet`, `isDesktop`, `isMobileOrTablet`
   - Handles window resize events

3. **`components/Layout.js`**:
   - Dynamic padding/max-width per device
   - Prevents horizontal overflow on mobile/tablet

4. **`components/Navbar.js`**:
   - Responsive spacing (smaller padding on mobile)
   - Better mobile menu overlay (80vw width)
   - Improved notification dropdown for small screens
   - Touch-friendly button sizes

5. **`pages/DashboardPage.js`**:
   - Stat cards: Compact (mobile) → Spacious (desktop)
   - Grid view: 1 → 2 → 3 columns based on screen
   - List view: Smaller text/padding on mobile
   - Right rail: Hidden on mobile, visible on tablet+
   - Pagination: Compact mobile view with smaller buttons

### Key Features:
- ✅ Mobile-first approach (320px and up)
- ✅ Tablet support (768px-1023px)
- ✅ Touch targets minimum 44px
- ✅ Prevents iOS zoom (16px font on inputs)
- ✅ Responsive typography and spacing
- ✅ No functionality changes - pure UI adjustments

## Tech Stack
- **Backend**: Django, Django REST Framework, PostgreSQL
- **Frontend**: React, Tailwind CSS, Framer Motion
- **Auth**: JWT tokens, Google SSO (@react-oauth/google)
- **UI**: Lucide React icons, custom design system
- **State**: React Context (Auth, Mode)

## Production Architecture

```
┌─────────────────────────────────────────────────────┐
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

## Environment Variables
```
REACT_APP_API_URL=http://localhost:8000/api/
```

## Available Scripts (Frontend)
- `npm start` - Development server
- `npm run build` - Production build
- `npm test` - Run tests

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

## Next Steps
1. Complete Phase B page redesigns (auth, landing, dashboards)
2. Run integration tests
3. Build and verify production bundle (Phase C)
4. Test responsive behavior across real devices

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

## Claude Agent Instructions
> **Use all available plugins, skills, and MCP servers aggressively whenever required.** 

To reduce token usage while maintaining maximum productivity:
1. **`claude-mem`**: Rely on this for cross-session persistent memory. Use the `mem-search` skill to recall previous decisions instead of asking the user to upload old logs.
2. **`context-mode`**: This automatically compresses terminal/tool outputs to save tokens.
3. For detailed guidelines on utilizing skills (`superpowers`, etc.) and MCP servers, read the extended instructions here:
   👉 **[Claude Tools Reference](refer/claude_tools.md)**
