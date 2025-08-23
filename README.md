# PIIcasso

PIIcasso is a Django-based web application designed for handling Personally Identifiable Information (PII) securely while offering data processing, generation, and management features.  
The project emphasizes cybersecurity best practices, safe handling of sensitive data, and clean backend design.

---

## Features
- Secure handling of PII data
- Django-based backend with modular app design
- API endpoints for data generation and processing
- SQLite database by default (switchable to PostgreSQL/MySQL)
- Token and session-based authentication
- Implements secure coding standards

---

## Tech Stack
- Backend: Django (Python)
- Database: SQLite (development), compatible with PostgreSQL/MySQL
- Frontend: Django templates (extendable to React/Vue)
- Authentication: Django Auth / JWT
- Other Tools: Git, Virtualenv

---

## Project Structure
```bash
PIIcasso/
│── backend/ # Django project root
│ ├── backend/ # Core settings and URLs
│ ├── wordgen/ # App: word/PII generation logic
│ ├── db.sqlite3 # Local dev database
│ └── manage.py # Django entry point
│
├── .gitignore # Git ignored files
├── requirements.txt # Python dependencies
└── README.md # Project documentation
```

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/PIIcasso.git
cd PIIcasso
```

### 2. Create and activate virtual environment
```bash
python -m venv venv
source venv/bin/activate   # On Linux/Mac
venv\Scripts\activate      # On Windows
```


### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Apply migrations
```bash
python manage.py migrate
```

### 5. Run the Server
```bash
python manage.py runserver
```

visit http://127.0.0.1:8000/