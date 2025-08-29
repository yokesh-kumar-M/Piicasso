import os
import json
import requests
import logging

logger = logging.getLogger(__name__)

def mask_pii_for_api(pii_data):
    """
    Optional masker: remove or mask extremely sensitive fields before sending to external LLM.
    You can tune which keys to mask. For now we mask gov_id and passport_id.
    """
    safe = dict(pii_data)
    sensitive_fields = ['gov_id', 'passport_id', 'bank_suffix', 'crypto_wallet']
    
    for field in sensitive_fields:
        if field in safe and safe[field]:
            safe[field] = '[REDACTED]'
    
    return safe

def build_prompt(pii_data):
    """
    Build an improved prompt for password generation that handles empty fields better
    and creates more diverse, realistic passwords.
    """
    
    # Filter out empty values and organize data
    available_data = {}
    for key, value in pii_data.items():
        if value and value != '' and value != []:
            # Handle list fields
            if isinstance(value, list):
                filtered_list = [item for item in value if item and item.strip()]
                if filtered_list:
                    available_data[key] = filtered_list
            elif isinstance(value, str) and value.strip():
                available_data[key] = value.strip()
    
    # If no meaningful data provided, return an error
    if not available_data:
        raise ValueError("No meaningful PII data provided for password generation.")
    
    # Build context sections
    identity_info = []
    personal_info = []
    location_info = []
    interests_info = []
    technical_info = []
    
    # Organize data by category
    if 'full_name' in available_data:
        identity_info.append(f"Name: {available_data['full_name']}")
    if 'birth_year' in available_data:
        identity_info.append(f"Birth year: {available_data['birth_year']}")
    if 'childhood_nickname' in available_data:
        identity_info.append(f"Childhood nickname: {available_data['childhood_nickname']}")
    
    if 'spouse_name' in available_data:
        personal_info.append(f"Spouse: {available_data['spouse_name']}")
    if 'pet_names' in available_data:
        pets = ', '.join(available_data['pet_names']) if isinstance(available_data['pet_names'], list) else available_data['pet_names']
        personal_info.append(f"Pets: {pets}")
    if 'sports_team' in available_data:
        personal_info.append(f"Favorite sports team: {available_data['sports_team']}")
    
    if 'hometown' in available_data:
        location_info.append(f"Hometown: {available_data['hometown']}")
    if 'last_location' in available_data:
        location_info.append(f"Current location: {available_data['last_location']}")
    if 'frequent_places' in available_data:
        location_info.append(f"Frequent places: {available_data['frequent_places']}")
    
    if 'favourite_movies' in available_data:
        movies = ', '.join(available_data['favourite_movies']) if isinstance(available_data['favourite_movies'], list) else available_data['favourite_movies']
        interests_info.append(f"Favorite movies: {movies}")
    if 'favourite_food' in available_data:
        interests_info.append(f"Favorite food: {available_data['favourite_food']}")
    if 'habit_patterns' in available_data:
        interests_info.append(f"Habits: {available_data['habit_patterns']}")
    
    if 'phone_suffix' in available_data:
        technical_info.append(f"Phone ending: {available_data['phone_suffix']}")
    if 'employer_name' in available_data:
        technical_info.append(f"Employer: {available_data['employer_name']}")
    if 'social_media_handle' in available_data:
        technical_info.append(f"Social media: {available_data['social_media_handle']}")
    if 'first_car_model' in available_data:
        technical_info.append(f"First car: {available_data['first_car_model']}")
    
    # Build the improved prompt
    prompt_parts = [
        "Generate a diverse list of 150-200 realistic password variations based on the following personal information:",
        ""
    ]
    
    # Add available information sections
    if identity_info:
        prompt_parts.extend(["PERSONAL IDENTITY:", "\n".join(f"• {info}" for info in identity_info), ""])
    
    if personal_info:
        prompt_parts.extend(["RELATIONSHIPS & INTERESTS:", "\n".join(f"• {info}" for info in personal_info), ""])
    
    if location_info:
        prompt_parts.extend(["LOCATION INFO:", "\n".join(f"• {info}" for info in location_info), ""])
    
    if interests_info:
        prompt_parts.extend(["HOBBIES & PREFERENCES:", "\n".join(f"• {info}" for info in interests_info), ""])
    
    if technical_info:
        prompt_parts.extend(["ADDITIONAL INFO:", "\n".join(f"• {info}" for info in technical_info), ""])
    
    # Add generation instructions
    prompt_parts.extend([
        "GENERATION INSTRUCTIONS:",
        "Create realistic password variations using the following techniques:",
        "",
        "1. BASIC COMBINATIONS:",
        "   • Combine names with years, numbers, symbols",
        "   • Use common patterns like Name123!, Name@2024, etc.",
        "",
        "2. SUBSTITUTIONS:",
        "   • Replace letters with numbers (a→@, e→3, i→1, o→0, s→$)",
        "   • Use both partial and full substitutions",
        "",
        "3. CONCATENATIONS:",
        "   • Join different pieces of information",
        "   • Mix personal info with numbers/symbols",
        "",
        "4. VARIATIONS:",
        "   • Different capitalizations (lowercase, UPPERCASE, TitleCase)",
        "   • Add common suffixes (123, 2024, !, @home, etc.)",
        "   • Abbreviations and nicknames",
        "",
        "5. REALISTIC PATTERNS:",
        "   • Use common password patterns people actually use",
        "   • Include seasonal/yearly variations",
        "   • Mix meaningful words with random elements",
        "",
        "REQUIREMENTS:",
        "• Generate ONLY the password list, one per line",
        "• No explanations, headers, or additional text",
        "• Each password should be 6-20 characters",
        "• Mix simple and complex passwords",
        "• Include various difficulty levels",
        "• Make them realistic and human-like",
        "",
        "OUTPUT FORMAT: Return only the passwords, one per line, nothing else."
    ])
    
    return "\n".join(prompt_parts)

def call_gemini_api(prompt, pii_data=None):
    """
    Call Gemini API with improved error handling and response processing.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")

    # Optionally mask sensitive PII
    if pii_data:
        masked_data = mask_pii_for_api(pii_data)
        logger.info(f"Sending request to Gemini API with {len(masked_data)} data fields")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.9,  # Higher creativity
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 2048,
        }
    }

    try:
        logger.info("Making request to Gemini API...")
        resp = requests.post(url, headers=headers, json=payload, timeout=120)
        resp.raise_for_status()
        data = resp.json()

        # Robust path to extract text content
        candidates = data.get("candidates", [])
        if not candidates:
            logger.error(f"No candidates in Gemini response: {data}")
            raise RuntimeError("Gemini API returned no candidates")

        text = None
        for candidate in candidates:
            content = candidate.get("content", {})
            parts = content.get("parts") or []
            if parts and isinstance(parts, list) and parts[0].get("text"):
                text = parts[0]["text"]
                break

        if not text:
            logger.error(f"No text content found in Gemini response: {data}")
            raise RuntimeError("No text content in Gemini response")

        # Clean up the response
        text = text.strip()
        
        # Remove any markdown formatting or extra text
        lines = text.split('\n')
        passwords = []
        
        for line in lines:
            line = line.strip()
            # Skip empty lines, markdown, or explanatory text
            if (line and 
                not line.startswith('#') and 
                not line.startswith('*') and 
                not line.startswith('-') and
                not line.lower().startswith('password') and
                not line.lower().startswith('here') and
                not '(' in line and
                len(line) >= 3 and
                len(line) <= 50):
                passwords.append(line)
        
        if not passwords:
            logger.warning(f"No valid passwords extracted from response: {text[:200]}...")
            # Fallback: return the original text split by lines
            passwords = [line.strip() for line in text.split('\n') if line.strip()]
        
        logger.info(f"Successfully generated {len(passwords)} passwords")
        return '\n'.join(passwords)

    except requests.exceptions.RequestException as e:
        logger.error(f"Gemini API request failed: {str(e)}")
        raise RuntimeError(f"Gemini API request failed: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error calling Gemini API: {str(e)}")
        raise RuntimeError(f"Password generation failed: {str(e)}")

def generate_fallback_passwords(pii_data):
    """
    Generate basic fallback passwords if API fails.
    """
    passwords = []
    
    # Get the main name
    name = pii_data.get('full_name', '').split()[0] if pii_data.get('full_name') else 'User'
    birth_year = pii_data.get('birth_year', '2024')
    
    # Basic patterns
    base_patterns = [
        f"{name}123",
        f"{name}{birth_year}",
        f"{name}@123",
        f"{name.lower()}{birth_year}!",
        f"{name.upper()}{birth_year}",
        f"{name}Password",
        f"{name}_123",
        f"{name}{birth_year[-2:]}",
    ]
    
    passwords.extend(base_patterns)
    
    # Add some variations
    for pattern in base_patterns[:3]:
        passwords.append(pattern + "!")
        passwords.append(pattern.lower())
        passwords.append(pattern.upper())
    
    return passwords[:20]  # Return up to 20 fallback passwords