import os
import logging
import requests

logger = logging.getLogger('wordgen')


def mask_pii_for_api(pii_data):
    """
    Optional masker: remove or mask extremely sensitive fields before sending to external LLM.
    """
    safe = dict(pii_data)
    for k in ['ssn_last4', 'bank_name', 'crypto_wallet', 'gov_id', 'passport_id', 'bank_suffix']:
        if k in safe and safe[k]:
            safe[k] = '[MASKED]'
    return safe


def build_prompt(pii_data):
    """
    Constructs a detailed prompt for the LLM using all available PII fields.
    """

    def fmt(key):
        val = pii_data.get(key)
        if not val:
            return "N/A"
        if isinstance(val, list):
            return ", ".join(str(v) for v in val if v)
        return str(val)

    identity = f"""
    Full Name: {fmt('full_name')}
    DOB/Year: {fmt('dob') if fmt('dob') != 'N/A' else fmt('birth_year')}
    Phone Digits: {fmt('phone_digits') if fmt('phone_digits') != 'N/A' else fmt('phone_suffix')}
    Username: {fmt('username')}
    Email Handle: {fmt('email')}
    """

    family = f"""
    Spouse: {fmt('spouse_name')}
    Children: {fmt('child_names')}
    Pets: {fmt('pet_names')}
    Mother's Maiden: {fmt('mother_maiden')}
    Father's Name: {fmt('father_name')}
    Siblings: {fmt('sibling_names')}
    Best Friend: {fmt('best_friend')}
    Childhood Nickname: {fmt('childhood_nickname')}
    """

    work = f"""
    Company: {fmt('company') if fmt('company') != 'N/A' else fmt('employer_name')}
    Job Title: {fmt('job_title')}
    Department: {fmt('department')}
    Employee ID: {fmt('employee_id')}
    Boss: {fmt('boss_name')}
    Past Company: {fmt('past_company')}
    University: {fmt('university')}
    Degree/Major: {fmt('degree')}
    School: {fmt('school_name')}
    """

    location = f"""
    Current City: {fmt('current_city')}
    Hometown: {fmt('hometown')}
    Street: {fmt('street_name')}
    Zip Code: {fmt('zip_code')}
    State: {fmt('state')}
    Country: {fmt('country')}
    Vacation Spot: {fmt('vacation_spot')}
    Last Location: {fmt('last_location')}
    """

    interests = f"""
    Sports Team: {fmt('sports_team')}
    Musician: {fmt('musician')}
    Movies: {fmt('movies') if fmt('movies') != 'N/A' else fmt('favourite_movies')}
    Hobbies: {fmt('hobbies')}
    Books: {fmt('books')}
    Games: {fmt('games')}
    Favorite Food: {fmt('food') if fmt('food') != 'N/A' else fmt('favourite_food')}
    """

    assets = f"""
    Car Model: {fmt('car_model') if fmt('car_model') != 'N/A' else fmt('first_car_model')}
    License Plate: {fmt('license_plate')}
    Brand Affinity: {fmt('brand_affinity')}
    Device: {fmt('device_type')}
    Subscription: {fmt('subscription')}
    """

    prompt = f"""
You are a penetration testing AI engine. Your goal is to generate a highly probable password wordlist (up to 300 entries) for a target based on their profile.
Think like a hacker: users often combine personal details, important dates, and common patterns.

TARGET PROFILE:
[IDENTITY]
{identity}

[FAMILY & RELATIONS]
{family}

[WORK & EDUCATION]
{work}

[LOCATION & ORIGIN]
{location}

[INTERESTS & LIKES]
{interests}

[ASSETS]
{assets}

INSTRUCTIONS:
1. Analyze the profile for keywords (names, dates, brands, terms).
2. Generate password candidates using:
   - Concatenations (e.g., "John1990", "Rover@Tesla")
   - Leetspeak (e.g., "P@ssw0rd", "K@liL1nux")
   - Common patterns (e.g., "Summer2024!", "ChangeMe123")
   - Specific combinations of spouse/pet/child names and dates.
3. Return ONLY the list of passwords, one per line. No conversational text.
    """.strip()

    return prompt


def generate_fallback_wordlist(pii_data):
    """
    Generates a basic wordlist using algorithmic permutations when the LLM is unavailable.
    """
    seeds = []

    for k, val in pii_data.items():
        if val:
            if isinstance(val, list):
                seeds.extend([str(v) for v in val if v])
            else:
                s_val = str(val)
                seeds.append(s_val)
                if ' ' in s_val:
                    seeds.extend(s_val.split())

    if pii_data.get('full_name'):
        parts = pii_data['full_name'].split()
        seeds.extend(parts)

    # Clean seeds
    seeds = [s.strip() for s in seeds if s and len(s) > 1]
    seeds = list(set(seeds))

    passwords = set()
    suffixes = ['', '1', '123', '!', '.', '2024', '2025', '2020', '@123']
    transforms = [lambda s: s, lambda s: s.lower(), lambda s: s.upper(), lambda s: s.capitalize()]

    for s in seeds:
        for t in transforms:
            base = t(s)
            for suff in suffixes:
                passwords.add(f"{base}{suff}")
                passwords.add(f"{base}{suff}!")

    # Combos
    import itertools
    if len(seeds) >= 2:
        for a, b in itertools.permutations(seeds[:20], 2):  # Limit to prevent explosion
            passwords.add(f"{a}{b}")
            passwords.add(f"{a}.{b}")
            passwords.add(f"{a}_{b}")
            passwords.add(f"{a}{b}123")
            passwords.add(f"{a.lower()}{b.lower()}")

    return "\n".join(list(passwords))


def call_gemini_api(prompt, pii_data=None):
    """
    Call Gemini API to generate content.
    Falls back to algorithmic generation on failure.
    """
    try:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY not set")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }

        resp = requests.post(url, headers=headers, json=payload, timeout=30)

        if resp.status_code == 429:
            logger.warning("Gemini API rate limited, falling back to offline mode.")
            raise RuntimeError("API rate limited")

        if resp.status_code != 200:
            logger.warning(f"Gemini API returned status {resp.status_code}, falling back to offline mode.")
            raise RuntimeError(f"API Error {resp.status_code}")

        data = resp.json()

        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError("No candidates returned")

        text = None
        for c in candidates:
            content = c.get("content", {})
            parts = content.get("parts") or []
            if parts and isinstance(parts, list) and parts[0].get("text"):
                text = parts[0]["text"]
                break

        if not text:
            raise RuntimeError("Unexpected response format")

        return text

    except Exception as e:
        logger.warning(f"LLM generation failed: {e}. Using offline fallback.")
        if pii_data:
            return generate_fallback_wordlist(pii_data)
        return "fallback\npassword\n123456"
