# PIIcasso - Advanced Wordlist & Threat Intelligence

PIIcasso is a high-performance, full-stack application designed for the generation of intelligent, profile-based wordlists and threat intelligence visualization. It uses a **Django** headless backend with **AI integration** (Google Gemini) and a **React** frontend featuring a sophisticated, 3D "Mission Control" interface.

## Live Demo
- **Frontend (Vercel)**: [https://pii-casso.vercel.app](https://pii-casso.vercel.app)
- **Backend API (Render)**: `https://piicasso.onrender.com/api/`

---

## Key Features

### Core Intelligence
- **AI-Powered Generation**: Generates targeted wordlists using Google's Gemini LLM based on user profiles.
- **Smart Permutations**: Algorithmic generation using leetspeak, dates, and common patterns.
- **RockYou Integration**: Automatically augments generated lists with top weak passwords.
- **Dossier Generation**: Export detailed PDF reports of generated intelligence.

### Visual Intelligence (Frontend)
- **3D Global Threat Map**: Interactive, WebGL-powered globe visualizing real-time "threat" data.
- **Risk Radar HUD**: Dynamic radar charts visualizing the data density and risk profile of a target.
- **Cyber-Tactical UI**: "Netflix-style" dark mode aesthetic with advanced animations and data visualization.

### Architecture
- **Decoupled System**: Fully decoupled frontend (Vercel) and backend (Render).
- **Headless API**: Django REST framework serves strictly as an API, completely decoupled from HTML rendering.
- **Containerized**: The backend is highly optimized and containerized using a slim Python 3.11 Docker image.

---

## Technology Stack

### Frontend (User Interface)
- **Framework**: React 18
- **Styling**: TailwindCSS, Framer Motion (Animations)
- **Visualization**: Three.js (react-globe.gl), Chart.js
- **Routing**: React Router DOM
- **Deployment**: Vercel

### Backend (Headless API)
- **Framework**: Python 3.11, Django 5.x, Django REST Framework
- **AI Engine**: Google Gemini API
- **Database**: PostgreSQL
- **Cache**: Redis
- **Auth**: JWT (SimpleJWT)
- **Deployment**: Docker, Render

---

## Local Development Setup

If you want to run the project locally, follow these steps:

### 1. Backend Setup

```bash
cd Piicasso/backend
```

1. **Create Virtual Environment & Install Dependencies**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: \venv\Scripts\activate
   pip install -r ../requirements.txt
   ```

2. **Configure Environment Variables**:
   Create a `.env` file inside `Piicasso/backend/` and add:
   ```env
   DEBUG=True
   ENV=development
   DJANGO_SECRET_KEY=your_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Run Migrations & Server**:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
   *The API will run on http://localhost:8000/api/*

### 2. Frontend Setup

```bash
cd Piicasso/frontend
```

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file inside `Piicasso/frontend/` and add:
   ```env
   REACT_APP_API_URL=http://localhost:8000/api/
   ```

3. **Start Development Server**:
   ```bash
   npm start
   ```
   *The frontend will run on http://localhost:3000*

---

## Security Note

This tool is strictly intended for **authorized security testing, penetration testing, and educational purposes only**. Using this tool to generate wordlists for targets without their explicit consent is illegal. The developers assume no liability and are not responsible for any misuse, damage, or breaches caused by this program.

---

**© PIIcasso Project**
