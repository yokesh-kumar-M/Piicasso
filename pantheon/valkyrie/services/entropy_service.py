import math
import re


class EntropyService:
    @staticmethod
    def calculate_entropy(password: str) -> float:
        if not password:
            return 0.0

        charset_size = 0
        if any(c.islower() for c in password):
            charset_size += 26
        if any(c.isupper() for c in password):
            charset_size += 26
        if any(c.isdigit() for c in password):
            charset_size += 10
        if any(not c.isalnum() for c in password):
            charset_size += 33

        if charset_size == 0:
            return 0.0

        return round(len(password) * math.log2(charset_size), 2)

    @staticmethod
    def evaluate_password(password: str, pii_data: dict = None) -> dict:
        entropy = EntropyService.calculate_entropy(password)
        length = len(password)

        vulnerabilities = []
        recommendations = []

        if length < 8:
            vulnerabilities.append("Critical: Password is too short (< 8 characters).")
            recommendations.append("Increase password length to at least 12-16 characters.")
        elif length < 12:
            vulnerabilities.append("Warning: Password length is moderate (< 12 characters).")

        if not any(c.islower() for c in password):
            vulnerabilities.append("Missing lowercase letters.")
        if not any(c.isupper() for c in password):
            vulnerabilities.append("Missing uppercase letters.")
        if not any(c.isdigit() for c in password):
            vulnerabilities.append("Missing numbers.")
        if not any(not c.isalnum() for c in password):
            vulnerabilities.append("Missing special symbols.")

        # Check against PII correlations
        if pii_data:
            pw_lower = password.lower()
            for key, val in pii_data.items():
                if val and isinstance(val, str) and len(val) >= 3:
                    if val.lower() in pw_lower:
                        vulnerabilities.append(f"Contains personal identifier ({key}).")
                        recommendations.append(f"Remove references to '{val}' from password.")

        if entropy < 30:
            level = "critical"
            score = 15
            crack_time = "Instant (< 1 second)"
        elif entropy < 50:
            level = "high"
            score = 45
            crack_time = "A few minutes to hours"
        elif entropy < 70:
            level = "medium"
            score = 75
            crack_time = "Several months"
        else:
            level = "low"
            score = 95
            crack_time = "Centuries"

        return {
            "entropy": entropy,
            "strength_score": score,
            "vulnerability_level": level,
            "crack_time_estimate": crack_time,
            "vulnerabilities": vulnerabilities,
            "recommendations": recommendations,
        }

