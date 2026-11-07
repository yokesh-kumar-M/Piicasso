from rest_framework import serializers

from ..persistence.models import GenerationHistory


class PiiSubmitSerializer(serializers.Serializer):
    full_name = serializers.CharField(required=False, allow_blank=True, max_length=256)
    dob = serializers.CharField(required=False, allow_blank=True, max_length=100)
    birth_year = serializers.CharField(required=False, allow_blank=True, max_length=10)
    pets_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    favorite_color = serializers.CharField(required=False, allow_blank=True, max_length=100)
    favorite_sport = serializers.CharField(required=False, allow_blank=True, max_length=100)
    company_name = serializers.CharField(required=False, allow_blank=True, max_length=256)
    pattern_mode = serializers.ChoiceField(
        choices=["standard", "corporate", "leetspeak", "deep"],
        default="standard",
    )
    limit = serializers.IntegerField(default=500, min_value=1, max_value=2000)

    def validate(self, attrs):
        # Ensure at least one identifying PII field is provided
        has_pii = any(attrs.get(k) for k in ["full_name", "dob", "birth_year", "pets_name", "company_name"])
        if not has_pii:
            raise serializers.ValidationError("At least one identifying PII attribute is required.")
        return attrs


class GenerationHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = GenerationHistory
        fields = ("id", "timestamp", "wordlist_count", "ip_address")

