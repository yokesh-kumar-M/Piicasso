# Contributing to PIcasso

Thank you for your interest in contributing! This guide will help you get started.

---

## Code of Conduct

By participating, you agree to abide by our standards of professional and respectful communication.

---

## How to Contribute

### Reporting Bugs
1. Check [existing issues](https://github.com/yokesh-kumar-M/PIIcasso/issues)
2. Create new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if UI related)

### Suggesting Features
1. Open issue with label `enhancement`
2. Describe the feature and its use case
3. Wait for maintainer feedback before implementing

### Pull Requests
1. Fork the repo
2. Create feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run tests locally
5. Submit PR with clear description

---

## Development Setup

### Backend (Django)
```bash
cd Piicasso/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend (React)
```bash
cd Piicasso/frontend
npm install
npm start
```

---

## Code Style

### Backend (Python)
- Follow [PEP 8](https://pep8.org/)
- Use `black` for formatting: `black .`
- Use `flake8` for linting: `flake8 .`
- Write docstrings for all functions/classes
- Keep functions small and focused

### Frontend (JavaScript/React)
- Follow [Airbnb Style Guide](https://github.com/airbnb/javascript)
- Use `prettier` for formatting: `npm run format`
- Use `eslint` for linting: `npm run lint`
- Use functional components with hooks
- Write JSDoc comments for complex logic

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user dashboard analytics
fix: resolve login redirect issue
docs: update API documentation
style: format code with black
refactor: simplify authentication flow
test: add unit tests for wordlist generator
chore: update dependencies
```

---

## Testing

### Backend Tests
```bash
cd Piicasso/backend
python manage.py test
```

### Frontend Tests
```bash
cd Piicasso/frontend
npm test
```

### Coverage
- Aim for >80% test coverage
- Write tests before code (TDD) when possible

---

## Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Adding tests

---

## Review Process

1. Automated checks (CI Pipeline) must pass
2. Code review by maintainer
3. Address feedback promptly
4. Squash commits before merge (if requested)

---

## Questions?

Feel free to open an issue or contact the maintainers!
