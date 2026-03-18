# PIIcasso - Project Documentation

> Last Updated: March 2026
> Version: 2.5.1

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Current Architecture](#2-current-architecture)
3. [Existing Workflows](#3-existing-workflows)
4. [API Endpoints Reference](#4-api-endpoints-reference)
5. [Frontend Routes & Redirections](#5-frontend-routes--redirections)
6. [Database Models](#6-database-models)
7. [Redesign Plan (User Mode + Security Mode)](#7-redesign-plan---user-mode--security-mode)
8. [Recommended Additional Features](#8-recommended-additional-features)
9. [Performance & Optimization](#9-performance--optimization)
10. [Security Considerations](#10-security-considerations)

---

## 1. Project Overview

**PIIcasso** is a cybersecurity-focused web application that generates wordlists from Personally Identifiable Information (PII) for security testing purposes. The application uses Django REST Framework for the backend and React for the frontend.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TailwindCSS, Framer Motion |
| Backend | Django 4.x, Django REST Framework |
| Database | PostgreSQL (production) / SQLite (development) |
| Authentication | JWT (SimpleJWT), Firebase Google OAuth |
| External APIs | Google Gemini AI, HaveIBeenPwned |

### Project Structure

```
PIIcasso/
├── Piicasso/
│   ├── backend/
│   │   ├── backend/          # Django project settings
│   │   ├── wordgen/          # Core wordlist generation
│   │   ├── generator/        # Generation history models
│   │   ├── operations/       # System logs, messages, notifications
│   │   ├── teams/            # Team management
│   │   ├── analytics/        # User activity tracking
│   │   └── requirements.txt
│   └── frontend/
│       ├── src/
│       │   ├── pages/        # Page components
│       │   ├── components/  # Reusable components
│       │   ├── context/     # React context (Auth)
│       │   ├── api/         # Axios configuration
│       │   └── utils/       # Utilities
│       └── package.json
```

---

## 2. Current Architecture

### 2.1 Authentication Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Login Page    │────▶│   AuthContext   │────▶│   Home/Dashboard │
│  /login         │     │   Token Store   │     │   /              │
└──────────────────┘     └──────────────────┘     └──────────────────┘
         │                        │
         │                        ▼
         │               ┌──────────────────┐
         │               │  JWT Token       │
         │               │  - access        │
         │               │  - refresh       │
         │               └──────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│            Token Refresh Flow                     │
│  Token Expired ──▶ Refresh Token ──▶ New Access│
└──────────────────────────────────────────────────┘
```

### 2.2 Current User Roles

| Role | Access Level |
|------|--------------|
| Regular User | Generate wordlists, view history, teams |
| Superuser (Admin) | Full system access, user management |

### 2.3 Theme

- **Primary Color**: Netflix Red (#E50914)
- **Background**: Black (#000000, #0a0a0a, #141414)
- **Typography**: 
  - Headings: Orbitron
  - Body: Rajdhani
  - Code: Share Tech Mono

---

## 3. Existing Workflows

### 3.1 Registration Flow

```
1. User visits /register
2. Fills username, email, password
3. Backend validates:
   - Username: 3-30 chars, alphanumeric + _/-
   - Email: Valid format
   - Password: Django password validators
4. Creates user → Returns 201 Created
5. Auto-login → Redirect to Home
```

### 3.2 Login Flow

```
1. User visits /login
2. Enters username/password OR Google OAuth
3. Backend validates credentials
4. Returns JWT tokens (access + refresh)
5. Stores tokens in localStorage
6. Redirects to Home (/)
```

### 3.3 Wordlist Generation Flow

```
1. User visits Home (/)
2. Fills PII form (TargetForm):
   - Identity: full_name, dob, phone, username, email, ssn_last4
   - Family: spouse_name, child_names, pet_names, mother_maiden
   - Work: company, job_title, university, employee_id
   - Location: city, hometown, zip_code
   - Interests: sports_team, musician, movies, hobbies
   - Assets: car_model, bank_name, crypto_wallet
3. Clicks "Generate Wordlist"
4. Backend:
   - Validates PII data
   - Calls Gemini AI with prompt
   - Merges with RockYou wordlist
   - Saves to GenerationHistory
5. Returns wordlist to frontend
6. User can download as:
   - Raw wordlist (.txt)
   - PDF Report
```

### 3.4 Terminal Simulation Flow

```
1. User visits /operation
2. Configures mode (standard/fast/historical)
3. Sets complexity (Low/Med/High/Insane)
4. Uses simulated terminal with commands:
   - hydra: Simulated brute force
   - nmap: Network scan (admin only)
   - whoami, status, help, clear
5. Wordlist injected from generated history
```

---

## 4. API Endpoints Reference

### 4.1 Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/token/` | No | Login with username/password |
| POST | `/api/token/refresh/` | No | Refresh access token |
| POST | `/api/auth/google/` | No | Google OAuth login |

### 4.2 User Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/register/` | No | User registration |
| GET/PUT | `/api/user/profile/` | Yes | Get/Update user profile |
| GET | `/api/user/stats/` | Yes | Get user statistics |

### 4.3 PII & Wordlist Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/pii/submit/` | Yes | Submit PII → Generate wordlist |
| GET | `/api/history/` | Yes | Get generation history (paginated) |
| DELETE | `/api/history/<id>/` | Yes | Delete history entry |
| GET | `/api/download/wordlist/<id>/` | Yes | Download wordlist |
| GET | `/api/download/report/<id>/` | Yes | Download PDF report |
| GET | `/api/history/export/` | Yes | Export all as CSV |

### 4.4 System & Admin Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health/` | No | Health check |
| GET | `/api/system/logs/` | Yes (Admin) | Get system logs |
| GET | `/api/superadmin/` | Yes (Admin) | Admin dashboard data |
| POST | `/api/superadmin/` | Yes (Admin) | Admin actions (block, delete) |
| DELETE | `/api/superadmin/?user_id=` | Yes (Admin) | Delete user |

### 4.5 Terminal Endpoint

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/terminal/execute/` | Yes | Execute simulated command |

### 4.6 Operations Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/operations/notifications/` | Yes | Get notifications |
| POST | `/api/operations/notifications/` | Yes | Mark notifications read |
| GET/POST | `/api/operations/messages/` | Yes | Admin messaging |

### 4.4.7 Breached Password Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/breach/check/` | Yes | Check if password breached |

### 4.8 Teams Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/POST | `/api/teams/` | Yes | List/Create teams |
| GET/PUT/DELETE | `/api/teams/<id>/` | Yes | Team CRUD |
| POST | `/api/teams/<id>/join/` | Yes | Join team |
| POST | `/api/teams/<id>/leave/` | Yes | Leave team |

---

## 5. Frontend Routes & Redirections

### 5.1 Public Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | HomePage | Landing page with PII form (when not logged in: hero) |
| `/login` | LoginPage | Login form |
| `/register` | RegisterPage | Registration form |
| `/forgot-password` | ForgotPasswordPage | Password reset |

### 5.2 Protected Routes (Requires Auth)

| Route | Component | Description |
|-------|-----------|-------------|
| `/profile` | ProfilePage | User profile & settings |
| `/teams` | TeamsPage | Team management |
| `/dashboard` | DashboardPage | Generation history |
| `/workspace` | SavedPage | Saved items |
| `/darkweb` | DarkWebPage | Breach search |
| `/operation` | NewOperationPage | Terminal simulation |
| `/result` | ResultPage | Generation result view |
| `/inbox` | InboxPage | Messages |
| `/system-admin` | SuperAdminPage | Admin panel (superuser only) |

### 5.3 Current Redirection Logic

```
/ ──────────────────────────▶ HomePage
  ├── Not logged in: Hero + Login prompt
  └── Logged in: Full dashboard with PII form

/login ─────────────────────▶ LoginPage
  ├── Success: Redirect to / (Home)
  └── Failure: Show error

/register ──────────────────▶ RegisterPage
  ├── Success: Auto-login → Redirect to /
  └── Failure: Show error

/profile ───────────────────▶ ProfilePage (PrivateRoute)
  ├── Not logged in: → /login
  └── Logged in: Show profile

/dashboard ────────────────▶ DashboardPage (PrivateRoute)
  ├── Not logged in: → /login
  └── Logged in: Show history grid/list

/operation ────────────────▶ NewOperationPage (PrivateRoute)
  ├── Not logged in: → /login
  └── Logged in: Terminal interface
```

---

## 6. Database Models

### 6.1 User (Django Built-in)

```python
class User(AbstractUser):
    # Fields: username, email, password, first_name, last_name,
    #         is_active, is_staff, is_superuser, date_joined
```

### 6.2 GenerationHistory

```python
class GenerationHistory(models.Model):
    user = ForeignKey(User, on_delete=models.CASCADE)
    timestamp = DateTimeField(auto_now_add=True)
    pii_data = JSONField        # Submitted PII
    wordlist = JSONField        # Generated passwords
    wordlist_count = IntegerField
    ip_address = GenericIPAddressField
```

### 6.3 SystemLog

```python
class SystemLog(models.Model):
    timestamp = DateTimeField(auto_now_add=True)
    level = CharField (INFO/WARNING/ERROR/CRITICAL)
    message = TextField
    source = CharField
```

### 6.4 Message

```python
class Message(models.Model):
    sender = ForeignKey(User)
    recipient = ForeignKey(User)
    content = TextField
    timestamp = DateTimeField(auto_now_add=True)
    is_read = BooleanField(default=False)
```

### 6.5 Notification

```python
class Notification(models.Model):
    user = ForeignKey(User)
    notification_type = CharField
    title = CharField
    description = TextField
    is_read = BooleanField(default=False)
    timestamp = DateTimeField(auto_now_add=True)
    link = CharField
```

### 6.6 Team

```python
class Team(models.Model):
    name = CharField
    owner = ForeignKey(User)
    invite_code = CharField
    created_at = DateTimeField
```

### 6.7 TeamMembership

```python
class TeamMembership(models.Model):
    user = ForeignKey(User)
    team = ForeignKey(Team)
    role = CharField (admin/member)
    joined_at = DateTimeField
```

---

## 7. Redesign Plan - User Mode + Security Mode

### 7.1 Overview

Restructure PIIcasso into a dual-mode application:

| Mode | Purpose | UI Style |
|------|---------|----------|
| **User Mode** | Password vulnerability checker for normal users | Friendly, approachable, educational |
| **Security Mode** | Existing wordlist generation & security tools | Terminal/hacker aesthetic (current) |

**Both Modes**: Red/Black theme maintained but with completely different layouts

### 7.2 Mode Selection Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    LOGIN SUCCESS                             │
│                        │                                     │
│                        ▼                                     │
│              ┌───────────────────┐                           │
│              │  MODE SELECTION   │                           │
│              │     MODAL         │                           │
│              └───────────────────┘                           │
│              │                   │                           │
│    ┌────────┴───────┐   ┌───────┴─────────┐                 │
│    │   USER MODE    │   │  SECURITY MODE  │                 │
│    │   (Shield)     │   │   (Terminal)    │                 │
│    └────────────────┘   └─────────────────┘                 │
│           │                      │                           │
│           ▼                      ▼                           │
│    /user/dashboard        /security/dashboard               │
│    (Password Checker)     (Existing Features)               │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 New Database Models

#### UserPreference

```python
class UserPreference(models.Model):
    user = OneToOneField(User, on_delete=models.CASCADE)
    default_mode = CharField(choices=[('user', 'User'), ('security', 'Security')], default='user')
    last_mode = CharField(choices=[('user', 'User'), ('security', 'Security')], default='user')
    updated_at = DateTimeField(auto_now=True)
```

#### PasswordAnalysis

```python
class PasswordAnalysis(models.Model):
    user = ForeignKey(User, on_delete=models.CASCADE)
    pii_data = JSONField  # Encrypted
    password_tested = CharField(max_length=128)  # Hashed, not plaintext
    vulnerability_level = CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')])
    strength_score = IntegerField  # 0-100
    crack_time_estimate = CharField
    breach_count = IntegerField(default=0)
    recommendations = JSONField
    created_at = DateTimeField(auto_now_add=True)
```

### 7.4 New API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/password/analyze/` | Yes | Analyze password vulnerability |
| GET | `/api/password/history/` | Yes | Get analysis history |
| POST | `/api/password/breach-check/` | Yes | Check password breach status |
| GET/PUT | `/api/user/preferences/` | Yes | Get/Set user mode preferences |

### 7.5 New Frontend Routes

#### User Mode Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/user` | UserModeLayout | User mode base layout |
| `/user/dashboard` | PasswordCheckerPage | Main password vulnerability checker |
| `/user/history` | AnalysisHistoryPage | Past analyses |

#### Security Mode Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/security` | SecurityModeLayout | Security mode base layout |
| `/security/dashboard` | DashboardPage | Existing dashboard |
| `/security/operation` | NewOperationPage | Terminal simulation |

#### Mode Selection

| Route | Component | Description |
|-------|-----------|-------------|
| `/mode-select` | ModeSelectionPage | Mode selection modal (post-login) |

### 7.6 Navbar Mode Switcher

**Location**: Top-right corner (next to notifications bell)

**UI**:
```
┌────────────────────────────────────────┐
│  [Shield Icon] ▼  [Bell] [Profile]     │
└────────────────────────────────────────┘
         │
         ▼
    ┌─────────────┐
    │ User Mode   │  ← Current (green indicator)
    │ Security    │
    └─────────────┘
```

### 7.7 User Mode - Password Checker Page UI

```
┌─────────────────────────────────────────────────────────────┐
│  PIIcasso                        [User ▼] [Bell] [Profile] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         🔐 PASSWORD VULNERABILITY CHECKER           │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │  Enter your password to check vulnerability │    │   │
│  │  │  [________________________] [CHECK]         │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                                                     │   │
│  │  Strength: ████████░░ 80% Strong                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PERSONAL INFORMATION (helps identify vulnerabilities) │  │
│  │  ▼ Expand                                             │   │
│  │  [Full Name] [Birth Year] [Pet Name] [Phone]        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  RESULTS                                             │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐       │   │
│  │  │ Crack Time│ │ Breaches   │ │ Score      │       │   │
│  │  │ 3 days    │ │ 12 found   │ │ 🔴 Critical│       │   │
│  │  └────────────┘ └────────────┘ └────────────┘       │   │
│  │                                                     │   │
│  │  ⚠️ Vulnerabilities Found:                          │   │
│  │  • Contains your name                               │   │
│  │  • Contains birth year                             │   │
│  │  • Common password pattern                         │   │
│  │                                                     │   │
│  │  💡 Recommendations:                                │   │
│  │  • Add special characters                          │   │
│  │  • Avoid personal information                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Recommended Additional Features

### 8.1 Password Generator (User Mode)

Provide users with a secure password generator that creates strong passwords based on security best practices.

**Features**:
- Configurable length (12-64 characters)
- Character types (upper, lower, numbers, symbols)
- Exclude ambiguous characters option
- Copy to clipboard
- Strength indicator

### 8.2 Dark Web Monitoring (User Mode)

Alert users if their email appears in known data breaches.

**Features**:
- Email breach checker
- List of breaches containing their data
- Breach details (date, data types exposed)
- Recommendations per breach

### 8.3 Security Score Dashboard (User Mode)

Aggregate user's overall security posture.

**Metrics**:
- Password strength average
- Number of breached accounts detected
- Security recommendations completion
- Time-based trends

### 8.4 Multi-Language Support

Add i18n support for:
- English (default)
- Spanish
- German
- French

### 8.5 Two-Factor Authentication (2FA)

Add TOTP-based 2FA for enhanced security.

**Implementation**:
- QR code setup
- Backup codes generation
- 2FA required option

### 8.6 Email Notifications

Notify users about:
- New breaches detected
- Password analysis results
- Team invitations
- System announcements

### 8.7 API Rate Limiting Dashboard

Show users their API usage.

**Display**:
- Requests remaining
- Usage history
- Rate limit reset time

---

## 9. Performance & Optimization

### 9.1 Frontend Optimizations

| Optimization | Implementation |
|--------------|----------------|
| Code Splitting | Lazy load routes per mode |
| Component Memoization | React.memo for heavy components |
| Debouncing | Debounce password input (300ms) |
| Caching | Cache analysis results in localStorage |
| Image Optimization | Use WebP, lazy load images |

### 9.2 Backend Optimizations

| Optimization | Implementation |
|--------------|----------------|
| Database Indexing | Index frequently queried fields |
| Caching | Redis for breach check results (24h TTL) |
| Rate Limiting | Throttle password analysis endpoints |
| Async Processing | Background tasks for heavy analysis |
| Query Optimization | Use select_related, prefetch_related |

### 9.3 Load Balancing Strategy

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │   (Nginx/HAProxy)│
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │ Django   │        │ Django   │        │ Django   │
   │ Instance │        │ Instance │        │ Instance │
   │    1     │        │    2     │        │    N     │
   └────┬─────┘        └────┬─────┘        └────┬─────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    ┌────────┴────────┐
                    │   PostgreSQL    │
                    │   (Primary)    │
                    └────────────────┘
```

### 9.4 Caching Architecture

| Cache Layer | Data | TTL |
|-------------|------|-----|
| Browser | Static assets, user preferences | Permanent |
| Redis | Breach check results | 24 hours |
| Redis | User session data | JWT expiry |
| Database | Analysis history | Permanent |

---

## 10. Security Considerations

### 10.1 Password Storage (User Mode)

- **NEVER** store plaintext passwords
- Hash with bcrypt/argon2
- Store only truncated/masked versions for display
- Clear from memory after analysis

### 10.2 PII Protection

- Encrypt PII at rest (using Django's encryption or field encryption)
- Implement data retention policies
- Allow users to delete their data
- Anonymize analytics data

### 10.3 API Security

| Measure | Implementation |
|---------|----------------|
| Authentication | JWT with short expiry |
| Rate Limiting | Per-user, per-endpoint limits |
| CORS | Restrict to known origins |
| HTTPS | Enforce in production |
| Input Validation | DRF serializers + custom validators |

### 10.4 Rate Limits

| Endpoint | Limit (Authenticated) | Limit (Public) |
|----------|---------------------|----------------|
| `/api/password/analyze/` | 60/min | 10/min |
| `/api/breach/check/` | 30/min | 5/min |
| `/api/pii/submit/` | 10/min | N/A |
| `/api/register/` | 5/min | 3/min |

---

## Appendix: Environment Variables

```env
# Backend
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=domain.com
DATABASE_URL=postgres://...
REDIS_URL=redis://...

# JWT
JWT_SECRET_KEY=your-jwt-secret
ACCESS_TOKEN_LIFETIME=60 minutes
REFRESH_TOKEN_LIFETIME=1 day

# External APIs
GEMINI_API_KEY=your-gemini-key
FIREBASE_API_KEY=your-firebase-key
HAVEIBEENPWNED_API_KEY=your-hibp-key

# Frontend
REACT_APP_API_URL=https://api.piicasso.com
REACT_APP_FIREBASE_API_KEY=your-firebase-key
```

---

## Glossary

| Term | Definition |
|------|------------|
| PII | Personally Identifiable Information |
| JWT | JSON Web Token |
| RockYou | Common password wordlist |
| Wordlist | List of passwords for security testing |
| Vulnerability | Weakness in password that can be exploited |
| Breach | Unauthorized access to data |

---

*End of Document*
