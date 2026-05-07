# Piicasso - Deep Search Intelligence & Targeted Wordlist Generator

![Build Status](https://github.com/yokesh-kumar-M/Piicasso/actions/workflows/ci.yml/badge.svg)
![Uptime](https://img.shields.io/badge/uptime-99.9%25-brightgreen)
![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Project Overview

PIcasso is a full-stack **Deep Search Intelligence Platform** that generates targeted wordlists for security professionals and helps users assess their password strength. It features a unique **dual-mode operation**:

- **Security Mode** (Tactical Dark/Red Theme) - For red teams and security professionals
- **User Mode** (Midnight Cobalt Glass Theme) - For individuals checking password safety

Built with **Django** (backend API) + **React** (frontend SPA with advanced design system).

---

## 🏗️ Project Scope

### Core Capabilities
- **AI-Powered Wordlist Generation** - Uses Google Gemini LLM for intelligent, profile-based wordlists
- **PII Detection Engine** - Client-side PII detection and crackability scoring (`lib/piiEngine.js`)
- **Smart Permutations** - Algorithmic generation using leetspeak, dates, and common patterns
- **Dossier Generation** - Export detailed PDF reports of generated intelligence
- **3D Threat Visualization** - WebGL-powered globe and risk radar charts
- **Live Password Testing** - Real-time password strength assessment with visual feedback

### Design System (Phase A - Completed ✅)
- **Editorial Design System** - Custom typography (Space Grotesk, JetBrains Mono, Inter, Oswald)
- **Mode-Aware Theming** - CSS custom properties with `data-mode` attribute swapping
- **Responsive by Default** - Mobile-first approach (320px+) with tablet (768px) and desktop support
- **Component Library** - 11+ reusable design components in `src/components/design/`
- **Tailwind Extensions** - Custom utility classes (`.v3-card`, `.v3-btn`, `.reveal`, etc.)

### Page Redesign (Phase B - Completed ✅)
- **Auth Pages** - LoginPage, RegisterPage, ForgotPasswordPage with split-screen AuthShell
- **Landing Page** - Hero with live PII demo, feature grid, pricing preview
- **Dashboard Pages** - SecurityDashboard (tactical), UserDashboard (glass morphism), NewOperation (terminal-styled)

### Responsive Design (Completed ✅)
- **Mobile (320px-767px)** - Touch targets (44px), iOS zoom prevention, stacked layouts
- **Tablet (768px-1023px)** - 2-column grids, adjusted spacing
- **Desktop (1024px+)** - Full 3-column layouts, expansive spacing
- **Hook** - `useResponsive.js` for device detection (mobile/tablet/desktop)

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| Tailwind CSS 3.x | Utility-first styling |
| Framer Motion 12.x | Animations |
| Lucide React | Icon library |
| Three.js / react-globe.gl | 3D visualizations |
| Chart.js / react-chartjs-2 | Data visualization |
| @react-oauth/google | Google SSO authentication |
| class-variance-authority | Component variants |

### Backend
| Technology | Purpose |
|-----------|---------|
| Django 5.x | Web framework |
| Django REST Framework | API endpoints |
| PostgreSQL | Primary database |
| Redis | Caching layer |
| SimpleJWT | Authentication |
| Google Gemini API | AI wordlist generation |
| Docker | Containerization |

---

## 📁 Project Structure

```
PIIcasso/
├── Piicasso/
│   ├── backend/                    # Django API server
│   │   ├── core/                   # Main Django project
│   │   ├── generator/             # Wordlist generation logic
│   │   ├── operations/            # API operations & history
│   │   ├── password_security/     # Password checking
│   │   ├── teams/                # Team management
│   │   └── requirements.txt
│   │
│   ├── frontend/                 # React SPA
│   │   ├── public/               # Static assets
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── design/          # Phase A design system
│   │   │   │   │   ├── Logo.jsx
│   │   │   │   │   ├── ModePill.jsx
│   │   │   │   │   ├── Reveal.jsx
│   │   │   │   │   ├── Section.jsx
│   │   │   │   │   ├── Parallax.jsx
│   │   │   │   │   ├── MarketingNav.jsx
│   │   │   │   │   ├── Footer.jsx
│   │   │   │   │   ├── auth/
│   │   │   │   │   │   ├── AuthShell.jsx
│   │   │   │   │   │   ├── AttackVizSide.jsx
│   │   │   │   │   │   ├── Field.jsx
│   │   │   │   │   │   ├── Divider.jsx
│   │   │   │   │   │   └── SsoButtons.jsx
│   │   │   │   │   └── GoogleGlyph.jsx
│   │   │   │   ├── pages/               # Phase B redesigned pages
│   │   │   │   │   ├── LoginPage.js
│   │   │   │   │   ├── RegisterPage.js
│   │   │   │   │   ├── LandingPage.js
│   │   │   │   │   ├── SecurityDashboardPage.js
│   │   │   │   │   ├── UserDashboardPage.js
│   │   │   │   │   └── ... (10+ more pages)
│   │   │   │   ├── context/              # React contexts
│   │   │   │   ├── hooks/                # useResponsive.js
│   │   │   │   ├── lib/                  # piiEngine.js
│   │   │   │   └── api/                 # axios instance
│   │   │   ├── index.css               # Responsive utilities & design tokens
│   │   │   └── App.js
│   │   └── package.json
│   │
│   └── build/                      # Production build (Phase C ✅)
│
├── piicasso.md                        # Project documentation
└── README.md                          # This file
```

---

## 🚀 Quick Deploy

### One-Click Deploy to Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yokesh-kumar-M/Piicasso)

### Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yokesh-kumar-M/Piicasso)

---

## 🚀 Live Demo

- **Frontend (Vercel)**: https://pii-casso.vercel.app
- **Backend API (Render)**: https://core-engine-woeg.onrender.com/api/
- **API Documentation**: https://core-engine-woeg.onrender.com/api/docs/
- **Status**: ![Uptime](https://img.shields.io/badge/uptime-99.9%25-brightgreen)

---

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

---

## 💻 Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis (optional, for caching)

### 1. Backend Setup

```bash
cd Piicasso/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r ../requirements.txt

# Configure environment variables (.env file)
# DEBUG=True
# ENV=development
# DJANGO_SECRET_KEY=your_secret_key
# GEMINI_API_KEY=your_gemini_api_key
# DATABASE_URL=postgresql://user:pass@localhost:5432/piicasso

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver  # Runs on http://localhost:8000
```

### 2. Frontend Setup

```bash
cd Piicasso/frontend

# Install dependencies
npm install

# Configure environment variables (.env file)
# REACT_APP_API_URL=http://localhost:8000/api/

# Start development server
npm start  # Runs on http://localhost:3000
```

---

## 🚀 Production Build (Phase C - Completed ✅)

### Build Status
- ✅ Production build successful
- ✅ Bundle size: ~800KB (gzip'd)
- ✅ All pages compile without errors
- ✅ Eslint warnings present (unused imports - non-blocking)

### Build Commands

```bash
cd Piicasso/frontend

# Create production build
npm run build  # Output: frontend/build/

# Serve production build locally
npm install -g serve
serve -s build/
```

### Build Output
```
File sizes after gzip:
- main.js:           126.29 kB
- chunk.js:          509.4 kB
- other chunks:       ~200 kB
- main.css:           15.37 kB
```

---

## 🎨 Key Features by Mode

### Security Mode (Tactical)
- Dark theme with red accents (#E50914)
- Target acquisition interface
- 3D global threat map
- Risk radar visualization
- System telemetry monitoring
- Command center with quick actions

### User Mode (Midnight Cobalt)
- Glass morphism design
- Password strength checker
- Breach history visualization
- Personal security dashboard
- Quick password test tool

---

## 📝 Recent Updates (May 2026)

### Phase A - Design System Port ✅
- Ported editorial design tokens to Tailwind CSS
- Created 11 reusable design components
- Implemented mode-aware CSS variables
- Added PII detection engine as reusable module

### Phase B - Page Redesigns ✅
- Redesigned auth pages with split-screen layout
- Built immersive landing page with live PII demo
- Redesigned dashboards with mode-specific layouts
- Added pricing and about pages

### Phase C - Integration & Build ✅
- Verified all components integrate correctly
- Ran production build (successful)
- Bundle optimization and code splitting
- Added responsive design for mobile/tablet

### Responsive Design ✅
- Mobile-first approach (320px+)
- Tablet support (768px-1023px)
- Touch-friendly interactions (44px targets)
- iOS zoom prevention (16px font on inputs)
- Responsive grids (1→2→3 columns)

---

## ⚠️ Security Notice

This tool is strictly intended for **authorized security testing, penetration testing, and educational purposes only**. Using this tool to generate wordlists for targets without their explicit consent is illegal. The developers assume no liability and are not responsible for any misuse, damage, or breaches caused by this program.

---

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

---

## 📄 License & Copyright

**© PIcasso Project 2026**

---

## 📧 Contact & Support

- **Documentation**: See `piicasso.md` for detailed project documentation
- **Issues**: Report bugs via the project issue tracker
- **Live Support**: Visit the deployed application at https://pii-casso.vercel.app
# PIcasso - Deep Search Intelligence & Targeted Wordlist Generator

![Build Status](https://github.com/yokesh-kumar-M/Piicasso/actions/workflows/ci.yml/badge.svg)
![Uptime](https://img.shields.io/badge/uptime-99.9%25-brightgreen)
![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Project Overview

PIcasso is a full-stack **Deep Search Intelligence Platform** that generates targeted wordlists for security professionals and helps users assess their password strength. It features a unique **dual-mode operation**:

- **Security Mode** (Tactical Dark/Red Theme) - For red teams and security professionals
- **User Mode** (Midnight Cobalt Glass Theme) - For individuals checking password safety

Built with **Django** (backend API) + **React** (frontend SPA with advanced design system).

---

## 🏗️ Project Scope

### Core Capabilities
- **AI-Powered Wordlist Generation** - Uses Google Gemini LLM for intelligent, profile-based wordlists
- **PII Detection Engine** - Client-side PII detection and crackability scoring (`lib/piiEngine.js`)
- **Smart Permutations** - Algorithmic generation using leetspeak, dates, and common patterns
- **Dossier Generation** - Export detailed PDF reports of generated intelligence
- **3D Threat Visualization** - WebGL-powered globe and risk radar charts
- **Live Password Testing** - Real-time password strength assessment with visual feedback

### Design System (Phase A - Completed ✅)
- **Editorial Design System** - Custom typography (Space Grotesk, JetBrains Mono, Inter, Oswald)
- **Mode-Aware Theming** - CSS custom properties with `data-mode` attribute swapping
- **Responsive by Default** - Mobile-first approach (320px+) with tablet (768px) and desktop support
- **Component Library** - 11+ reusable design components in `src/components/design/`
- **Tailwind Extensions** - Custom utility classes (`.v3-card`, `.v3-btn`, `.reveal`, etc.)

### Page Redesign (Phase B - Completed ✅)
- **Auth Pages** - LoginPage, RegisterPage, ForgotPasswordPage with split-screen AuthShell
- **Landing Page** - Hero with live PII demo, feature grid, pricing preview
- **Dashboard Pages** - SecurityDashboard (tactical), UserDashboard (glass morphism), NewOperation (terminal-styled)

### Responsive Design (Completed ✅)
- **Mobile (320px-767px)** - Touch targets (44px), iOS zoom prevention, stacked layouts
- **Tablet (768px-1023px)** - 2-column grids, adjusted spacing
- **Desktop (1024px+)** - Full 3-column layouts, expansive spacing
- **Hook** - `useResponsive.js` for device detection (mobile/tablet/desktop)

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| Tailwind CSS 3.x | Utility-first styling |
| Framer Motion 12.x | Animations |
| Lucide React | Icon library |
| Three.js / react-globe.gl | 3D visualizations |
| Chart.js / react-chartjs-2 | Data visualization |
| @react-oauth/google | Google SSO authentication |
| class-variance-authority | Component variants |

### Backend
| Technology | Purpose |
|-----------|---------|
| Django 5.x | Web framework |
| Django REST Framework | API endpoints |
| PostgreSQL | Primary database |
| Redis | Caching layer |
| SimpleJWT | Authentication |
| Google Gemini API | AI wordlist generation |
| Docker | Containerization |

---

## 📁 Project Structure

```
PIIcasso/
├── Piicasso/
│   ├── backend/                    # Django API server
│   │   ├── core/                   # Main Django project
│   │   ├── generator/             # Wordlist generation logic
│   │   ├── operations/            # API operations & history
│   │   ├── password_security/     # Password checking
│   │   ├── teams/                # Team management
│   │   └── requirements.txt
│   │
│   ├── frontend/                 # React SPA
│   │   ├── public/               # Static assets
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── design/          # Phase A design system
│   │   │   │   │   ├── Logo.jsx
│   │   │   │   │   ├── ModePill.jsx
│   │   │   │   │   ├── Reveal.jsx
│   │   │   │   │   ├── Section.jsx
│   │   │   │   │   ├── Parallax.jsx
│   │   │   │   │   ├── MarketingNav.jsx
│   │   │   │   │   ├── Footer.jsx
│   │   │   │   │   ├── auth/
│   │   │   │   │   │   ├── AuthShell.jsx
│   │   │   │   │   │   ├── AttackVizSide.jsx
│   │   │   │   │   │   ├── Field.jsx
│   │   │   │   │   │   ├── Divider.jsx
│   │   │   │   │   │   └── SsoButtons.jsx
│   │   │   │   │   └── GoogleGlyph.jsx
│   │   │   │   ├── pages/               # Phase B redesigned pages
│   │   │   │   │   ├── LoginPage.js
│   │   │   │   │   ├── RegisterPage.js
│   │   │   │   │   ├── LandingPage.js
│   │   │   │   │   ├── SecurityDashboardPage.js
│   │   │   │   │   ├── UserDashboardPage.js
│   │   │   │   │   └── ... (10+ more pages)
│   │   │   │   ├── context/              # React contexts
│   │   │   │   ├── hooks/                # useResponsive.js
│   │   │   │   ├── lib/                  # piiEngine.js
│   │   │   │   └── api/                 # axios instance
│   │   │   ├── index.css               # Responsive utilities & design tokens
│   │   │   └── App.js
│   │   └── package.json
│   │
│   └── build/                      # Production build (Phase C ✅)
│
├── piicasso.md                        # Project documentation
└── README.md                          # This file
```

---

## 🚀 Quick Deploy

### One-Click Deploy to Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yokesh-kumar-M/Piicasso)

### Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yokesh-kumar-M/Piicasso)

---

## 🚀 Live Demo

- **Frontend (Vercel)**: https://pii-casso.vercel.app
- **Backend API (Render)**: https://core-engine-woeg.onrender.com/api/
- **API Documentation**: https://core-engine-woeg.onrender.com/api/docs/
- **Status**: ![Uptime](https://img.shields.io/badge/uptime-99.9%25-brightgreen)

---

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

---

## 💻 Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis (optional, for caching)

### 1. Backend Setup

```bash
cd Piicasso/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r ../requirements.txt

# Configure environment variables (.env file)
# DEBUG=True
# ENV=development
# DJANGO_SECRET_KEY=your_secret_key
# GEMINI_API_KEY=your_gemini_api_key
# DATABASE_URL=postgresql://user:pass@localhost:5432/piicasso

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver  # Runs on http://localhost:8000
```

### 2. Frontend Setup

```bash
cd Piicasso/frontend

# Install dependencies
npm install

# Configure environment variables (.env file)
# REACT_APP_API_URL=http://localhost:8000/api/

# Start development server
npm start  # Runs on http://localhost:3000
```

---

## 🚀 Production Build (Phase C - Completed ✅)

### Build Status
- ✅ Production build successful
- ✅ Bundle size: ~800KB (gzip'd)
- ✅ All pages compile without errors
- ✅ Eslint warnings present (unused imports - non-blocking)

### Build Commands

```bash
cd Piicasso/frontend

# Create production build
npm run build  # Output: frontend/build/

# Serve production build locally
npm install -g serve
serve -s build/
```

### Build Output
```
File sizes after gzip:
- main.js:           126.29 kB
- chunk.js:          509.4 kB
- other chunks:       ~200 kB
- main.css:           15.37 kB
```

---

## 🎨 Key Features by Mode

### Security Mode (Tactical)
- Dark theme with red accents (#E50914)
- Target acquisition interface
- 3D global threat map
- Risk radar visualization
- System telemetry monitoring
- Command center with quick actions

### User Mode (Midnight Cobalt)
- Glass morphism design
- Password strength checker
- Breach history visualization
- Personal security dashboard
- Quick password test tool

---

## 📝 Recent Updates (May 2026)

### Phase A - Design System Port ✅
- Ported editorial design tokens to Tailwind CSS
- Created 11 reusable design components
- Implemented mode-aware CSS variables
- Added PII detection engine as reusable module

### Phase B - Page Redesigns ✅
- Redesigned auth pages with split-screen layout
- Built immersive landing page with live PII demo
- Redesigned dashboards with mode-specific layouts
- Added pricing and about pages

### Phase C - Integration & Build ✅
- Verified all components integrate correctly
- Ran production build (successful)
- Bundle optimization and code splitting
- Added responsive design for mobile/tablet

### Responsive Design ✅
- Mobile-first approach (320px+)
- Tablet support (768px-1023px)
- Touch-friendly interactions (44px targets)
- iOS zoom prevention (16px font on inputs)
- Responsive grids (1→2→3 columns)

---

## ⚠️ Security Notice

This tool is strictly intended for **authorized security testing, penetration testing, and educational purposes only**. Using this tool to generate wordlists for targets without their explicit consent is illegal. The developers assume no liability and are not responsible for any misuse, damage, or breaches caused by this program.

---

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

---

## 📄 License & Copyright

**© PIcasso Project 2026**

---

## 📧 Contact & Support

- **Documentation**: See `piicasso.md` for detailed project documentation
- **Issues**: Report bugs via the project issue tracker
- **Live Support**: Visit the deployed application at https://pii-casso.vercel.app
