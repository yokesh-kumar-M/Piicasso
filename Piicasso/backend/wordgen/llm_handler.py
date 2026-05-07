import os
import re
import itertools
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


def build_prompt(pii_data, pattern_mode="standard"):
    """
    Constructs a detailed prompt for the LLM using all available PII fields and generation pattern.
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
    DOB/Year: {fmt('birth_year')}
    Phone Digits: {fmt('phone_suffix')}
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
    Company: {fmt('employer_name')}
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
    Movies: {fmt('favourite_movies')}
    Hobbies: {fmt('hobbies')}
    Books: {fmt('books')}
    Games: {fmt('games')}
    Favorite Food: {fmt('favourite_food')}
    """

    assets = f"""
    Car Model: {fmt('first_car_model')}
    License Plate: {fmt('plate_number_partial')}
    Brand Affinity: {fmt('brand_affinity')}
    Device: {fmt('device_type')}
    Subscription: {fmt('subscription')}
    """

    # Adjust instructions based on user's selected pattern mode
    if pattern_mode == "corporate":
        pattern_instructions = """
2. Generate password candidates focusing on Corporate and Active Directory environments:
   - "Season+Year" patterns (e.g., "Summer2024!", "Fall24@")
   - "Company+Year" (e.g., "Tesla2024", "SpaceX_123")
   - Combinations of Job Title, Department, and Employee ID.
   - Include special character requirements usually enforced by AD (!@#$).
        """
    elif pattern_mode == "leetspeak":
        pattern_instructions = """
2. Generate password candidates focusing heavily on LEETSPEAK and hacker culture:
   - Substitute vowels extensively (e.g., a=@, e=3, i=1, o=0, s=$)
   - E.g., "P@$$w0rd", "J0hnD03!"
   - Combine usernames with aggressive punctuation and leetspeak substitutions.
        """
    elif pattern_mode == "deep":
        pattern_instructions = """
2. Generate password candidates focusing on DEEP personal connections:
   - Combinations of Pet Names + Birth Years + Symbols.
   - Spouse Names + Anniversary Dates.
   - Hometowns + High School Names + Graduation Years.
   - Look for non-obvious emotional connections in the dataset.
        """
    else:
        # Standard mode
        pattern_instructions = """
2. Generate password candidates using a balanced standard approach:
   - Concatenations (e.g., "John1990", "Rover@Tesla")
   - Light Leetspeak (e.g., "P@ssw0rd")
   - Common patterns (e.g., "Summer2024!", "ChangeMe123")
   - Specific combinations of spouse/pet/child names and dates.
        """

    prompt = f"""
You are a highly advanced penetration testing AI engine. Your goal is to generate a highly probable password wordlist (up to 300 entries) for a target based on their profile.
Think like an advanced threat actor profiling a target.

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
1. Analyze the profile deeply for keywords, names, dates, brands, and terms.
{pattern_instructions}
3. IMPORTANT: Return ONLY the raw list of generated passwords, one per line. Do NOT output any markdown, explanations, bullet points, numbering, or conversational text. Start the first password on the very first line.
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


# ─── Probability scoring ──────────────────────────────────────────────────────

_YEAR_RE = re.compile(r'(19|20)\d{2}')
_COMMON_SUFFIXES = ('123', '1234', '12345', '!', '@', '#', '!@#', '!!', '007', '01', '1')
# str.translate table for de-leetification (used to detect leet-encoded PII)
_LEET_TABLE = str.maketrans({'@': 'a', '3': 'e', '1': 'i', '0': 'o', '$': 's', '7': 't', '4': 'a'})


def score_wordlist(passwords, pii_data, rockyou_set=frozenset()):
    """
    Assign a probability score (1–100) to each password and return the list
    sorted descending by score.

    Scoring dimensions:
      - PII overlap   (up to 60 pts): how many PII tokens appear in the password
      - Pattern bonus (up to 30 pts): year, common suffix, leet-encoded PII, special chars
      - RockYou bonus (      10 pts): password appears in the sampled corpus

    Returns: [{"password": "...", "score": N}, ...]
    """
    pii_tokens = _extract_pii_tokens(pii_data)
    scored = [
        {"password": pwd, "score": _score_one(pwd, pii_tokens, rockyou_set)}
        for pwd in passwords
    ]
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored


def _extract_pii_tokens(pii_data):
    """Return a frozenset of lowercased PII substrings (≥3 chars) for overlap checks."""
    tokens = set()
    for val in pii_data.values():
        if not val:
            continue
        chunks = val if isinstance(val, list) else [val]
        for chunk in chunks:
            if isinstance(chunk, str) and chunk.strip():
                s = chunk.strip().lower()
                tokens.add(s)
                tokens.update(w for w in s.split() if len(w) >= 3)
    return frozenset(t for t in tokens if len(t) >= 3)


def _score_one(password, pii_tokens, rockyou_set):
    pw_lower = password.lower()

    # PII overlap — each matching token contributes 30 pts, capped at 60
    pii_hits = sum(1 for tok in pii_tokens if tok in pw_lower)
    score = min(pii_hits * 30, 60)

    # Pattern bonuses — capped collectively at 30
    pattern = 0
    if _YEAR_RE.search(password):
        pattern += 10
    if any(pw_lower.endswith(s) for s in _COMMON_SUFFIXES):
        pattern += 8
    # De-leetify and check again: catches P@ssw0rd-style PII encoding
    normalised = password.translate(_LEET_TABLE).lower()
    if normalised != pw_lower and any(tok in normalised for tok in pii_tokens):
        pattern += 7
    if any(c in password for c in '!@#$%^&*'):
        pattern += 5
    score += min(pattern, 30)

    # RockYou corpus presence
    if password in rockyou_set:
        score += 10

    return max(1, min(100, score))
