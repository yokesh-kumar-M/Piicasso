from rest_framework import serializers


class Piiserializer(serializers.Serializer):
    """
    PII data serializer — aligned with frontend PIIForm.js field names (2.1 fix).
    
    The frontend sends fields like: birth_year, phone_suffix, gov_id, passport_id,
    childhood_nickname, social_handles, etc. This serializer now accepts ALL of those
    field names so data is not silently dropped.
    
    Legacy field names (dob, phone_digits, ssn_last4, etc.) are kept for backward
    compatibility with any existing stored data or API consumers.
    """

    # ─── GENERATION CONFIG (New for AI Pattern Modes) ───────────────────────
    pattern_mode = serializers.ChoiceField(
        choices=['standard', 'corporate', 'leetspeak', 'deep'], 
        required=False, 
        default='standard'
    )

    # ─── IDENTITY CORE (frontend: identity category) ─────────────────────────
    full_name = serializers.CharField(required=False, allow_blank=True, default='')
    # Frontend sends birth_year; legacy: dob
    birth_year = serializers.CharField(required=False, allow_blank=True, default='')
    dob = serializers.CharField(required=False, allow_blank=True, default='')
    # Frontend sends phone_suffix; legacy: phone_digits
    phone_suffix = serializers.CharField(required=False, allow_blank=True, default='')
    phone_digits = serializers.CharField(required=False, allow_blank=True, default='')
    gov_id = serializers.CharField(required=False, allow_blank=True, default='')
    passport_id = serializers.CharField(required=False, allow_blank=True, default='')
    mother_maiden = serializers.CharField(required=False, allow_blank=True, default='')
    # Legacy
    ssn_last4 = serializers.CharField(required=False, allow_blank=True, default='')
    blood_type = serializers.CharField(required=False, allow_blank=True, default='')
    height = serializers.CharField(required=False, allow_blank=True, default='')
    username = serializers.CharField(required=False, allow_blank=True, default='')
    email = serializers.CharField(required=False, allow_blank=True, default='')

    # ─── PERSONAL CONNECTIONS (frontend: personal category) ──────────────────
    pet_names = serializers.CharField(required=False, allow_blank=True, default='')
    spouse_name = serializers.CharField(required=False, allow_blank=True, default='')
    childhood_nickname = serializers.CharField(required=False, allow_blank=True, default='')
    social_handles = serializers.CharField(required=False, allow_blank=True, default='')
    relationship_status = serializers.CharField(required=False, allow_blank=True, default='')
    close_contacts = serializers.CharField(required=False, allow_blank=True, default='')
    group_affiliations = serializers.CharField(required=False, allow_blank=True, default='')
    # Legacy
    child_names = serializers.CharField(required=False, allow_blank=True, default='')
    father_name = serializers.CharField(required=False, allow_blank=True, default='')
    sibling_names = serializers.CharField(required=False, allow_blank=True, default='')
    best_friend = serializers.CharField(required=False, allow_blank=True, default='')

    # ─── LOCATION DATA (frontend: location category) ────────────────────────
    hometown = serializers.CharField(required=False, allow_blank=True, default='')
    school_name = serializers.CharField(required=False, allow_blank=True, default='')
    last_location = serializers.CharField(required=False, allow_blank=True, default='')
    travel_history = serializers.CharField(required=False, allow_blank=True, default='')
    live_coordinates = serializers.CharField(required=False, allow_blank=True, default='')
    frequent_places = serializers.CharField(required=False, allow_blank=True, default='')
    # Legacy
    current_city = serializers.CharField(required=False, allow_blank=True, default='')
    street_name = serializers.CharField(required=False, allow_blank=True, default='')
    zip_code = serializers.CharField(required=False, allow_blank=True, default='')
    state = serializers.CharField(required=False, allow_blank=True, default='')
    country = serializers.CharField(required=False, allow_blank=True, default='')
    vacation_spot = serializers.CharField(required=False, allow_blank=True, default='')

    # ─── INTERESTS (frontend: interests category) ────────────────────────────
    favourite_movies = serializers.CharField(required=False, allow_blank=True, default='')
    sports_team = serializers.CharField(required=False, allow_blank=True, default='')
    first_car_model = serializers.CharField(required=False, allow_blank=True, default='')
    shopping_sites = serializers.CharField(required=False, allow_blank=True, default='')
    habit_patterns = serializers.CharField(required=False, allow_blank=True, default='')
    search_keywords = serializers.CharField(required=False, allow_blank=True, default='')
    content_timing = serializers.CharField(required=False, allow_blank=True, default='')
    favourite_food = serializers.CharField(required=False, allow_blank=True, default='')
    # Legacy
    musician = serializers.CharField(required=False, allow_blank=True, default='')
    movies = serializers.CharField(required=False, allow_blank=True, default='')
    hobbies = serializers.CharField(required=False, allow_blank=True, default='')
    books = serializers.CharField(required=False, allow_blank=True, default='')
    games = serializers.CharField(required=False, allow_blank=True, default='')
    food = serializers.CharField(required=False, allow_blank=True, default='')

    # ─── PROFESSIONAL (frontend: professional category) ──────────────────────
    employer_name = serializers.CharField(required=False, allow_blank=True, default='')
    social_media_handle = serializers.CharField(required=False, allow_blank=True, default='')
    # Legacy
    company = serializers.CharField(required=False, allow_blank=True, default='')
    job_title = serializers.CharField(required=False, allow_blank=True, default='')
    department = serializers.CharField(required=False, allow_blank=True, default='')
    employee_id = serializers.CharField(required=False, allow_blank=True, default='')
    boss_name = serializers.CharField(required=False, allow_blank=True, default='')
    past_company = serializers.CharField(required=False, allow_blank=True, default='')
    university = serializers.CharField(required=False, allow_blank=True, default='')
    degree = serializers.CharField(required=False, allow_blank=True, default='')

    # ─── ASSETS & REGISTRY (frontend: assets category) ──────────────────────
    bank_suffix = serializers.CharField(required=False, allow_blank=True, default='')
    crypto_wallet = serializers.CharField(required=False, allow_blank=True, default='')
    vehicle_reg = serializers.CharField(required=False, allow_blank=True, default='')
    property_id = serializers.CharField(required=False, allow_blank=True, default='')
    plate_number_partial = serializers.CharField(required=False, allow_blank=True, default='')
    # Legacy
    car_model = serializers.CharField(required=False, allow_blank=True, default='')
    license_plate = serializers.CharField(required=False, allow_blank=True, default='')
    bank_name = serializers.CharField(required=False, allow_blank=True, default='')
    brand_affinity = serializers.CharField(required=False, allow_blank=True, default='')
    device_type = serializers.CharField(required=False, allow_blank=True, default='')
    subscription = serializers.CharField(required=False, allow_blank=True, default='')


from operations.models import SystemLog


class SystemLogSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(format="%H:%M:%S")

    class Meta:
        model = SystemLog
        fields = ['timestamp', 'level', 'message', 'source']
