from rest_framework import serializers

class Piiserializer(serializers.Serializer):
    # IDENTITY
    full_name = serializers.CharField(required=False, allow_blank=True)
    dob = serializers.CharField(required=False, allow_blank=True)
    phone_digits = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.CharField(required=False, allow_blank=True)
    ssn_last4 = serializers.CharField(required=False, allow_blank=True)
    blood_type = serializers.CharField(required=False, allow_blank=True)
    height = serializers.CharField(required=False, allow_blank=True)

    # FAMILY
    spouse_name = serializers.CharField(required=False, allow_blank=True)
    child_names = serializers.CharField(required=False, allow_blank=True)
    pet_names = serializers.CharField(required=False, allow_blank=True)
    mother_maiden = serializers.CharField(required=False, allow_blank=True)
    father_name = serializers.CharField(required=False, allow_blank=True)
    sibling_names = serializers.CharField(required=False, allow_blank=True)
    best_friend = serializers.CharField(required=False, allow_blank=True)

    # WORK
    company = serializers.CharField(required=False, allow_blank=True)
    job_title = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    employee_id = serializers.CharField(required=False, allow_blank=True)
    boss_name = serializers.CharField(required=False, allow_blank=True)
    past_company = serializers.CharField(required=False, allow_blank=True)
    university = serializers.CharField(required=False, allow_blank=True)
    degree = serializers.CharField(required=False, allow_blank=True)

    # LOCATION
    current_city = serializers.CharField(required=False, allow_blank=True)
    hometown = serializers.CharField(required=False, allow_blank=True)
    street_name = serializers.CharField(required=False, allow_blank=True)
    zip_code = serializers.CharField(required=False, allow_blank=True)
    state = serializers.CharField(required=False, allow_blank=True)
    country = serializers.CharField(required=False, allow_blank=True)
    vacation_spot = serializers.CharField(required=False, allow_blank=True)

    # INTERESTS
    sports_team = serializers.CharField(required=False, allow_blank=True)
    musician = serializers.CharField(required=False, allow_blank=True)
    movies = serializers.CharField(required=False, allow_blank=True)
    hobbies = serializers.CharField(required=False, allow_blank=True)
    books = serializers.CharField(required=False, allow_blank=True)
    games = serializers.CharField(required=False, allow_blank=True)
    food = serializers.CharField(required=False, allow_blank=True)

    # ASSETS
    car_model = serializers.CharField(required=False, allow_blank=True)
    license_plate = serializers.CharField(required=False, allow_blank=True)
    bank_name = serializers.CharField(required=False, allow_blank=True)
    brand_affinity = serializers.CharField(required=False, allow_blank=True)
    device_type = serializers.CharField(required=False, allow_blank=True)
    crypto_wallet = serializers.CharField(required=False, allow_blank=True)
    subscription = serializers.CharField(required=False, allow_blank=True)

from operations.models import SystemLog

class SystemLogSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(format="%H:%M:%S")

    class Meta:
        model = SystemLog
        fields = ['timestamp', 'level', 'message', 'source']

class ThreatMapSerializer(serializers.Serializer):
    lat = serializers.FloatField()
    lng = serializers.FloatField()
    size = serializers.FloatField()
    color = serializers.CharField()
    label = serializers.CharField(required=False)