import re
from datetime import datetime

def validate_pii_field(field_name, value):
    """Quick validation for PII fields"""
    if not value:
        return None
    
    validators = {
        'birth_year': lambda x: validate_year(x),
        'phone_suffix': lambda x: validate_phone_suffix(x),
        'full_name': lambda x: validate_name(x),
    }
    
    validator = validators.get(field_name)
    if validator:
        return validator(value)
    return None

def validate_year(year_str):
    try:
        year = int(year_str)
        current_year = datetime.now().year
        if not (1900 <= year <= current_year):
            return f"Year must be between 1900 and {current_year}"
    except ValueError:
        return "Invalid year format"
    return None

def validate_phone_suffix(suffix):
    if not suffix.isdigit():
        return "Phone suffix must contain only numbers"
    if len(suffix) < 3 or len(suffix) > 4:
        return "Phone suffix must be 3-4 digits"
    return None

def validate_name(name):
    if len(name.strip()) < 2:
        return "Name must be at least 2 characters"
    if len(name) > 100:
        return "Name too long"
    return None