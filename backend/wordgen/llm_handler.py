import os
import json
import requests

def mask_pii_for_api(pii_data):
    """
    Optional masker: remove or mask extremely sensitive fields before sending to external LLM.
    You can tune which keys to mask. For now we mask gov_id and passport_id.
    """
    safe = dict(pii_data)
    for k in ['gov_id', 'passport_id', 'bank_suffix', 'crypto_wallet']:
        if k in safe and safe[k]:
            safe[k] = '[MASKED]'
    return safe

def build_prompt(pii_data):
    important_fields = {
        'full_name': 3,
        'pet_names': 2,
        'school_name': 2,
        'phone_suffix': 2,
        'childhood_nickname': 2
    }

    def emphasize(key):
        val = pii_data.get(key)
        if not val:
            return ''
        if isinstance(val, list):
            val = ', '.join(str(item) for item in val if item)
        return f"{val} " * important_fields.get(key, 1)

    # Extract fields
    full_name = emphasize('full_name')
    birth_year = pii_data.get('birth_year', '')
    pet_names = emphasize('pet_names')
    phone_suffix = emphasize('phone_suffix')
    childhood_nickname = emphasize('childhood_nickname')

    sports_team = pii_data.get('sports_team', '')
    spouse_name = pii_data.get('spouse_name', '')
    first_car_model = pii_data.get('first_car_model', '')
    hometown = pii_data.get('hometown', '')

    favourite_movies_list = pii_data.get('favourite_movies', [])
    if isinstance(favourite_movies_list, list):
        favourite_movies = ', '.join(str(movie) for movie in favourite_movies_list if movie)
    else:
        favourite_movies = str(favourite_movies_list) if favourite_movies_list else ''

    favourite_food = pii_data.get('favourite_food', '')
    employer_name = pii_data.get('employer_name', '')
    social_media_handle = pii_data.get('social_media_handle', '')
    plate_number_partial = pii_data.get('plate_number_partial', '')

    prompt = f"""
Generate up to 200 realistic passwords (one per line) based on the following personal details:
Full Name: {full_name}
Birth Year: {birth_year}
Pets: {pet_names}
Phone Suffix: {phone_suffix}
Childhood Nickname: {childhood_nickname}
Favorite Sports Team: {sports_team}
Spouse Name: {spouse_name}
First Car Model: {first_car_model}
Hometown: {hometown}
Favourite Movies: {favourite_movies}
Favourite Food: {favourite_food}
Employer Name: {employer_name}
Social Handle: {social_media_handle}
Partial Plate Number: {plate_number_partial}

Produce varying capitalization, punctuation and leetspeak, but avoid gibberish. Return only the newline-separated password list.
"""
    return prompt.strip()

def call_gemini_api(prompt, pii_data=None):
    """
    Call Gemini (or fallback) to generate content.
    Returns a newline-separated string on success, or raises an exception / returns an error string.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")

    # Optionally mask pii
    send_data = mask_pii_for_api(pii_data or {})

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=120)
        resp.raise_for_status()
        data = resp.json()

        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError("Returned no candidates")

        # robust path to text content
        text = None
        for c in candidates:
            content = c.get("content", {})
            parts = content.get("parts") or []
            if parts and isinstance(parts, list) and parts[0].get("text"):
                text = parts[0]["text"]
                break

        if not text:
            raise RuntimeError("Response format changed")

        return text

    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Request failed: {str(e)}")
