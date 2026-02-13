
# PIIcasso - Advanced Wordlist Generation & Threat Intelligence

PIIcasso is a high-performance, full-stack application designed for generation of intelligent, profile-based wordlists and threat intelligence visualization. It uses a **Django** backend with **AI integration** (Gemini) and a **React** frontend featuring a sophisticated, 3D "Mission Control" interface.

## 🚀 Features

### Core Intelligence
- **AI-Powered Generation**: Generates targeted wordlists using Google's Gemini LLM based on user profiles.
- **Smart Permutations**: Fallback algorithmic generation using leetspeak, dates, and common patterns.
- **RockYou Integration**: Automatically augments generated lists with top weak passwords.
- **Dossier Generation**: Export detailed PDF reports of generated intelligence.

### Visual Intelligence (Frontend)
- **3D Global Threat Map**: Interactive, WebGL-powered globe visualizing real-time "threat" data and Squadron activity.
- **Risk Radar HUD**: Dynamic radar charts visualizing the data density and risk profile of a target.
- **Cyber-Tactical UI**: "Netflix-style" dark mode aesthetic with advanced animations and data visualization.

### Operations
- **Squadrons (Teams)**: Create and join squads to collaborate on intelligence gathering.
- **System Logs**: Real-time logging of user activities and system events.
- **Terminal Emulator**: Built-in command interface for simulated reconnaissance tools (nmap, hydra).

---

## 🛠️ Tech Stack

- **Backend**: Python 3.11, Django 5.x, Django REST Framework
- **Frontend**: React 18, TailwindCSS, Three.js (react-globe.gl), Chart.js
- **Database**: PostgreSQL (Production), SQLite (Dev)
- **Cache**: Redis
- **Containerization**: Docker, Docker Compose
- **Server**: Nginx, Gunicorn, Whitenoise

---

## 📋 Prerequisites

- **Docker & Docker Compose** (Recommended)
- OR **Python 3.11+** and **Node.js 20+**

---

## ⚡ Quick Start (Docker)

The easiest way to run PIIcasso is using Docker Compose. This sets up the Backend, Frontend build, Database, Redis, and Nginx reverse proxy automatically.

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yokesh-kumar-M/Piicasso.git
    cd Piicasso
    ```

2.  **Configure Environment**:
    Copy the example env file and update it with your API keys.
    ```bash
    cp .env.example .env
    ```
    *Edit `.env` and set `GEMINI_API_KEY` to your Google Gemini API key.*

3.  **Run with Docker Compose**:
    ```bash
    docker-compose up --build -d
    ```

4.  **Access the Application**:
    Open [http://localhost](http://localhost) in your browser.

---

## 🔧 Local Development Setup

If you prefer to run the services individually:

### Backend

1.  **Navigate to backend**:
    ```bash
    cd Piicasso/backend
    ```

2.  **Create venv and install dependencies**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # or venv\Scripts\activate on Windows
    pip install -r ../requirements.txt
    ```

3.  **Configure Environment**:
    Create a `.env` file in `backend/` or set environment variables.
    Make sure to set `DEBUG=True` for local dev.

4.  **Run Migrations & Server**:
    ```bash
    python manage.py migrate
    python manage.py runserver
    ```

### Frontend

1.  **Navigate to frontend**:
    ```bash
    cd Piicasso/frontend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start Development Server**:
    ```bash
    npm start
    ```
    The frontend will be available at [http://localhost:3000](http://localhost:3000).

---

## 🔐 Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Secret key for Django | *Change in prod* |
| `DEBUG` | Debug mode | `False` |
| `GEMINI_API_KEY` | API Key for Google Gemini | **Required** |
| `POSTGRES_DB` | Database Name | `piicasso_db` |
| `POSTGRES_USER` | Database User | `piicasso_user` |
| `POSTGRES_PASSWORD` | Database Password | `piicasso_password` |
| `REDIS_URL` | Redis Connection URL | `redis://redis:6379/1` |

---

## 📁 Project Structure

```
PIIcasso/
├── backend/                # Django Backend
│   ├── wordgen/            # Core Generation App
│   ├── visualization/      # Threat Map & Data App
│   ├── generator/          # History & Logic
│   └── ...
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components (Globe, Radar, etc.)
│   │   └── pages/          # Main Pages (Home, Dashboard)
│   └── public/
├── nginx/                  # Nginx Configuration
├── Dockerfile              # Unified Build Dockerfile
├── docker-compose.yml      # Orchestration
└── requirements.txt        # Python Dependencies
```

---

## 🛡️ Security Note

This tool is intended for **authorized security testing and educational purposes only**. Using this tool to generate wordlists for targets without their consent is illegal. The developers assume no liability and are not responsible for any misuse or damage caused by this program.

---

**© 2024 PIIcasso Project**