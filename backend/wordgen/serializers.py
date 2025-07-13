from rest_framework import serializers

class Piiserializer(serializers.Serializer):
    # IDENTITY_CORE
    full_name = serializers.CharField(required=False, allow_blank=True)
    birth_year = serializers.CharField(required=False, allow_blank=True)
    gov_id = serializers.CharField(required=False, allow_blank=True)
    mother_maiden = serializers.CharField(required=False, allow_blank=True)
    passport_id = serializers.CharField(required=False, allow_blank=True)

    # SOCIAL_GRAPH
    spouse_name = serializers.CharField(required=False, allow_blank=True)
    social_handles = serializers.CharField(required=False, allow_blank=True)
    relationship_status = serializers.CharField(required=False, allow_blank=True)
    close_contacts = serializers.CharField(required=False, allow_blank=True)
    group_affiliations = serializers.CharField(required=False, allow_blank=True)

    # GEO_INTEL
    hometown = serializers.CharField(required=False, allow_blank=True)
    last_location = serializers.CharField(required=False, allow_blank=True)
    travel_history = serializers.CharField(required=False, allow_blank=True)
    live_coordinates = serializers.CharField(required=False, allow_blank=True)
    frequent_places = serializers.CharField(required=False, allow_blank=True)

    # BEHAVIOR_PATTERN
    favourite_movies = serializers.ListField(child=serializers.CharField(), required=False, allow_empty=True)
    shopping_sites = serializers.CharField(required=False, allow_blank=True)
    habit_patterns = serializers.CharField(required=False, allow_blank=True)
    search_keywords = serializers.CharField(required=False, allow_blank=True)
    content_timing = serializers.CharField(required=False, allow_blank=True)

    # ASSET_REGISTRY
    phone_suffix = serializers.CharField(required=False, allow_blank=True)
    bank_suffix = serializers.CharField(required=False, allow_blank=True)
    crypto_wallet = serializers.CharField(required=False, allow_blank=True)
    vehicle_reg = serializers.CharField(required=False, allow_blank=True)
    property_id = serializers.CharField(required=False, allow_blank=True)

    # Legacy or extra fields
    pet_names = serializers.ListField(child=serializers.CharField(), required=False, allow_empty=True)
    sports_team = serializers.CharField(required=False, allow_blank=True)
    childhood_nickname = serializers.CharField(required=False, allow_blank=True)
    first_car_model = serializers.CharField(required=False, allow_blank=True)
    school_name = serializers.CharField(required=False, allow_blank=True)
    employer_name = serializers.CharField(required=False, allow_blank=True)
    favourite_food = serializers.CharField(required=False, allow_blank=True)
    social_media_handle = serializers.CharField(required=False, allow_blank=True)
    plate_number_partial = serializers.CharField(required=False, allow_blank=True)
