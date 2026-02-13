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
    """
    Constructs a detailed prompt for the LLM using all available PII fields.
    """
    
    # Helper to format values
    def fmt(key):
        val = pii_data.get(key)
        if not val:
            return "N/A"
        if isinstance(val, list):
            return ", ".join(str(v) for v in val if v)
        return str(val)

    # Categories based on NEW schema
    identity = f"""
    Full Name: {fmt('full_name')}
    DOB/Year: {fmt('dob')}
    Phone Digits: {fmt('phone_digits')}
    Username: {fmt('username')}
    Email Handle: {fmt('email')}
    SSN Last 4: {fmt('ssn_last4')}
    Blood Type: {fmt('blood_type')}
    Height: {fmt('height')}
    """

    family = f"""
    Spouse: {fmt('spouse_name')}
    Children: {fmt('child_names')}
    Pets: {fmt('pet_names')}
    Mother's Maiden: {fmt('mother_maiden')}
    Father's Name: {fmt('father_name')}
    Siblings: {fmt('sibling_names')}
    Best Friend: {fmt('best_friend')}
    """

    work = f"""
    Company: {fmt('company')}
    Job Title: {fmt('job_title')}
    Department: {fmt('department')}
    Employee ID: {fmt('employee_id')}
    Boss: {fmt('boss_name')}
    Past Company: {fmt('past_company')}
    University: {fmt('university')}
    Degree/Major: {fmt('degree')}
    """

    location = f"""
    Current City: {fmt('current_city')}
    Hometown: {fmt('hometown')}
    Street: {fmt('street_name')}
    Zip Code: {fmt('zip_code')}
    State: {fmt('state')}
    Country: {fmt('country')}
    Vacation Spot: {fmt('vacation_spot')}
    """

    interests = f"""
    Sports Team: {fmt('sports_team')}
    Musician: {fmt('musician')}
    Movies: {fmt('movies')}
    Hobbies: {fmt('hobbies')}
    Books: {fmt('books')}
    Games: {fmt('games')}
    Favorite Food: {fmt('food')}
    """

    assets = f"""
    Car Model: {fmt('car_model')}
    License Plate: {fmt('license_plate')}
    Bank: {fmt('bank_name')}
    Brand Affinity: {fmt('brand_affinity')}
    Device: {fmt('device_type')}
    Crypto Wallet: {fmt('crypto_wallet')}
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
    
    # Extract raw values from ALL inputs
    for k, val in pii_data.items():
        if val:
            if isinstance(val, list):
                # Split comma-separated strings if they were merged or just lists
                if isinstance(val, str) and ',' in val:
                    seeds.extend([v.strip() for v in val.split(',')])
                else:
                    seeds.extend([str(v) for v in val if v])
            else:
                s_val = str(val)
                # Split multi-word fields like addresses or full names optionally
                # But keep the full phrase too
                seeds.append(s_val)
                if ' ' in s_val:
                    seeds.extend(s_val.split())
    
    # Split full names
    if pii_data.get('full_name'):
        parts = pii_data['full_name'].split()
        seeds.extend(parts)

    # Clean seeds
    seeds = [s.strip() for s in seeds if s and len(s) > 1]
    seeds = list(set(seeds)) # Unique
    
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
        for a, b in itertools.permutations(seeds, 2):
            passwords.add(f"{a}{b}")
            passwords.add(f"{a}.{b}")
            passwords.add(f"{a}_{b}")
            passwords.add(f"{a}{b}123")
            passwords.add(f"{a.lower()}{b.lower()}")
            
    return "\n".join(list(passwords))

def call_gemini_api(prompt, pii_data=None):
    """
    Call Gemini (or fallback) to generate content.
    Returns a newline-separated string on success, or raises an exception / returns an error string.
    """
    
    # Try Gemini API First
    try:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY not set")

        # Optionally mask pii
        send_data = mask_pii_for_api(pii_data or {})

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
    
        resp = requests.post(url, headers=headers, json=payload, timeout=10) # Reduced timeout
        
        if resp.status_code != 200:
            print(f"Gemini API Error (Falling back to offline mode): {resp.text}")
            raise RuntimeError(f"API Error {resp.status_code}")

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

    except Exception as e:
        print(f"LLM Generation Failed: {e}. Engaging Offline Fallback Mode.")
        if pii_data:
            return generate_fallback_wordlist(pii_data)
        return "fallback\npassword\n123456"
