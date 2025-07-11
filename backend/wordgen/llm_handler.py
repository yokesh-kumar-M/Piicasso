import requests
import os
import json # Import json for better error logging if needed

def build_prompt(pii_data):
    # These fields will be repeated in the prompt based on their emphasis score
    important_fields = {
        'full_name': 3,
        'pet_names': 2,
        'school_name': 2, # Note: This field is in important_fields but not explicitly used in the prompt example
        'phone_suffix': 2,
        'childhood_nickname': 2
    }

    def emphasize(key):
        val = pii_data.get(key)
        if val is None or val == '': # Handle empty strings or None explicitly
            return ''
        if isinstance(val, list):
            val = ', '.join(val)
        return f"{val}" * important_fields.get(key, 1) # Repeat value based on importance score
    
    # Extract relevant fields, ensuring defaults for potentially missing ones
    full_name = emphasize('full_name')
    birth_year = pii_data.get('birth_year', '')
    pet_names = emphasize('pet_names')
    phone_suffix = emphasize('phone_suffix')
    childhood_nickname = emphasize('childhood_nickname')
    
    sports_team = pii_data.get('sports_team', '')
    spouse_name = pii_data.get('spouse_name', '')
    first_car_model = pii_data.get('first_car_model', '')
    hometown = pii_data.get('hometown', '')
    # Ensure favourite_movies is a list before joining
    favourite_movies = ', '.join(pii_data.get('favourite_movies', []))
    favourite_food = pii_data.get('favourite_food', '')
    employer_name = pii_data.get('employer_name', '')
    social_media_handle = pii_data.get('social_media_handle', '')
    plate_number_partial = pii_data.get('plate_number_partial', '')

    prompt = f"""
Generate 500 realistic passwords based on the following PII data:

1. Highly Important Fields:
Full Name: {full_name}
Birth Year: {birth_year}
Pets: {pet_names}
Phone Suffix: {phone_suffix}
Childhood Nickname: {childhood_nickname}

2. Additional Details:
Favorite Sports Team: {sports_team}
Spouse Name: {spouse_name}
First Car Model: {first_car_model}
Hometown: {hometown}
Favourite Movies: {favourite_movies}
Favourite Food: {favourite_food}
Employer Name: {employer_name}
Social Media Handle: {social_media_handle}
Number Plate Partial: {plate_number_partial}

Generate a newline-separated list of 500 passwords that this person might realistically use.
Use leetspeak, birth years, sports references, pet names, etc.
Include variety (symbols, capitalization) but avoid random gibberish.
Respond with only the password list, no explanations.
"""
    return prompt.strip()

def call_gemini_api(prompt):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return "Error: GEMINI_API_KEY environment variable not set."

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

    headers = {"Content-type": "application/json"}
    data = {
        "contents":[
            {
                "parts": [{"text": prompt}]
            }
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=data, timeout=30) # Added timeout
        response.raise_for_status() # Raises HTTPError for bad responses (4xx or 5xx)

        response_json = response.json()
        candidates = response_json.get("candidates")

        if candidates and len(candidates) > 0 and "content" in candidates[0] and "parts" in candidates[0]["content"] and len(candidates[0]["content"]["parts"]) > 0 and "text" in candidates[0]["content"]["parts"][0]:
            text_output = candidates[0]["content"]["parts"][0]["text"]
            return text_output
        else:
            # Log the full response_json for debugging if the structure is unexpected
            print(f"Gemini API Response unexpected structure: {json.dumps(response_json, indent=2)}")
            return "Error: Gemini API response has an unexpected structure."

    except requests.exceptions.Timeout:
        return "Error: Gemini API request timed out."
    except requests.exceptions.ConnectionError:
        return "Error: Could not connect to Gemini API."
    except requests.exceptions.HTTPError as e:
        # This will catch 4xx or 5xx errors
        print(f"HTTP Error from Gemini API: {e.response.status_code} - {e.response.text}")
        return f"Error: Gemini API HTTP Error {e.response.status_code} - {e.response.text}"
    except json.JSONDecodeError:
        return "Error: Gemini API returned invalid JSON."
    except Exception as e:
        # Catch any other unexpected errors
        print(f"An unexpected error occurred during Gemini API call: {e}")
        return f"Error: An unexpected error occurred - {str(e)}"