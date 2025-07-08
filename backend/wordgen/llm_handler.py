import requests
import os

def build_prompt(pii_data):

    important_fields = {
        'full_name':3,
        'pet_names':2,
        'school_name':2,
        'phone_suffix':2,
        'childhood_nickname':2
    }

    def emphasize(key):
        val = pii_data.get(key)
        if isinstance(val, list):
            val = ', '.join(val)
        return f"{val}" * important_fields.get(key, 1)
    
    prompt = f"""
Generate 500 realistic passwords based on the following PII data:

1. Highly Important Fields:
Full Name: {emphasize('full_name')}
Birth Year: {pii_data.get('birth_year', '')}
Pets: {emphasize('pet_names')}
Phone Suffix: {emphasize('phone_suffix')}
Childhood Nickname: {emphasize('childhood_nickname')}

2. Additional Details:
Favorite Sports Team: {pii_data.get('sports_team', '')}
Spouse Name: {pii_data.get('spouse_name', '')}
First Car Model: {pii_data.get('first_car_model', '')}
Hometown: {pii_data.get('hometown', '')}
Favourite Movies: {', '.join(pii_data.get('favourite_movies', []))}
Favourite Food: {pii_data.get('favourite_food', '')}
Employer Name: {pii_data.get('employer_name', '')}
Social Media Handle: {pii_data.get('social_media_handle', '')}
Number Plate Partial: {pii_data.get('plate_number_partial', '')}

Generate a newline-separated list of 500 passwords that this person might realistically use.
Use leetspeak, birth years, sports references, pet names, etc.
Include variety (symbols, capitalization) but avoid random gibberish.
Respond with only the password list, no explanations.
"""
    

    return prompt.strip() 

def call_gemini_api(prompt):
    api_key = os.environ.get("GEMINI_API_KEY")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

    headers = {"Content-type": "application/json"}
    data = {
        "contents":[
            {
                "parts": [{"text": prompt}]
            }
        ]
    }

    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        candidates = response.json()["candidates"]
        text_output = candidates[0]["content"]["parts"][0]["text"]

        return text_output
    else:
        return f"Error: {response.status_code} - {response.text}"