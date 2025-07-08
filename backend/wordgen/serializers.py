from rest_framework import serializers

class Piiserializer(serializers.Serializer):
    full_name = serializers.CharField(required=False)
    birth_year = serializers.CharField(required=False)
    pet_names = serializers.ListField(child=serializers.CharField(),required=False)
    spouse_name = serializers.CharField(required=False)
    favourite_sports_team = serializers.CharField(required=False)
    childhood_nickname = serializers.CharField(required=False)
    first_car_model = serializers.CharField(required=False)
    hometown = serializers.CharField(required=False)
    favourite_movies = serializers.ListField(child=serializers.CharField(),required=False)
    school_name = serializers.CharField(required=False)
    employer_name = serializers.CharField(required=False)
    phone_suffix = serializers.CharField(required=False)
    favourite_food = serializers.CharField(required=False)
    social_media_handle = serializers.CharField(required=False)
    plate_number_partial = serializers.CharField(required=False)