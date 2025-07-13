# ===== Fixed backend/wordgen/llm_handler.py =====
import requests
import os
import json

def build_prompt(pii_data):
    """Build a prompt for password generation based on PII data"""
    # These fields will be repeated in the prompt based on their emphasis score
    important_fields = {
        'full_name': 3,
        'pet_names': 2,
        'school_name': 2,
        'phone_suffix': 2,
        'childhood_nickname': 2
    }

    def emphasize(key):
        """Emphasize certain fields by repeating them"""
        val = pii_data.get(key)
        if val is None or val == '':
            return ''
        if isinstance(val, list):
            if not val:  # Handle empty lists
                return ''
            val = ', '.join(str(item) for item in val if item)  # Filter out empty items
        return f"{val} " * important_fields.get(key, 1)
    
    # Extract relevant fields with safe defaults
    full_name = emphasize('full_name')
    birth_year = pii_data.get('birth_year', '')
    pet_names = emphasize('pet_names')
    phone_suffix = emphasize('phone_suffix')
    childhood_nickname = emphasize('childhood_nickname')
    
    sports_team = pii_data.get('sports_team', '')
    spouse_name = pii_data.get('spouse_name', '')
    first_car_model = pii_data.get('first_car_model', '')
    hometown = pii_data.get('hometown', '')
    
    # Safely handle favourite_movies list
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
Generate 500 realistic passwords based on the following PII data:

1. Highly Important Fields:
Full Name: {full_name}
Birth Year: {birth_year}
Government ID: {pii_data.get('gov_id', '')}
Mother's Maiden Name: {pii_data.get('mother_maiden', '')}
Passport ID: {pii_data.get('passport_id', '')}
Pets: {pet_names}
Phone Suffix: {phone_suffix}
Childhood Nickname: {childhood_nickname}

2. Additional Details:
Favorite Sports Team: {sports_team}
Spouse Name: {spouse_name}
Relationship Status: {pii_data.get('relationship_status', '')}
Group Affiliations: {pii_data.get('group_affiliations', '')}
Close Contacts: {pii_data.get('close_contacts', '')}
First Car Model: {first_car_model}
Hometown: {hometown}
Last Location: {pii_data.get('last_location', '')}
Travel History: {pii_data.get('travel_history', '')}
Frequent Places: {pii_data.get('frequent_places', '')}
Live Coordinates: {pii_data.get('live_coordinates', '')}
Favourite Movies: {favourite_movies}
Favourite Food: {favourite_food}
Shopping Sites: {pii_data.get('shopping_sites', '')}
Habit Patterns: {pii_data.get('habit_patterns', '')}
Search Keywords: {pii_data.get('search_keywords', '')}
Content Timing: {pii_data.get('content_timing', '')}
Employer Name: {employer_name}
Social Media Handle: {social_media_handle}
Bank Suffix: {pii_data.get('bank_suffix', '')}
Crypto Wallet: {pii_data.get('crypto_wallet', '')}
Vehicle Reg: {pii_data.get('vehicle_reg', '')}
Property ID: {pii_data.get('property_id', '')}
Number Plate Partial: {plate_number_partial}

Generate a newline-separated list of 500 passwords that this person might realistically use.
Use leetspeak, birth years, sports references, pet names, etc.
Include variety (symbols, capitalization) but avoid random gibberish.
Respond with only the password list, no explanations.
"""
    return prompt.strip()

def call_gemini_api(prompt):
    """Call Gemini API to generate passwords"""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return "Error: GEMINI_API_KEY environment variable not set."

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

    headers = {"Content-Type": "application/json"}
    data = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()

        response_json = response.json()
        candidates = response_json.get("candidates", [])

        if (candidates and 
            len(candidates) > 0 and 
            "content" in candidates[0] and 
            "parts" in candidates[0]["content"] and 
            len(candidates[0]["content"]["parts"]) > 0 and 
            "text" in candidates[0]["content"]["parts"][0]):
            
            text_output = candidates[0]["content"]["parts"][0]["text"]
            return text_output
        else:
            print(f"Gemini API Response unexpected structure: {json.dumps(response_json, indent=2)}")
            return "Error: Gemini API response has an unexpected structure."

    except requests.exceptions.Timeout:
        return "Error: Gemini API request timed out."
    except requests.exceptions.ConnectionError:
        return "Error: Could not connect to Gemini API."
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error from Gemini API: {e.response.status_code} - {e.response.text}")
        return f"Error: Gemini API HTTP Error {e.response.status_code}"
    except json.JSONDecodeError:
        return "Error: Gemini API returned invalid JSON."
    except Exception as e:
        print(f"An unexpected error occurred during Gemini API call: {e}")
        return f"Error: An unexpected error occurred - {str(e)}"