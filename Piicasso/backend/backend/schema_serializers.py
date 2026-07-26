"""Serializers used exclusively to describe the public OpenAPI contract.

The application has several API views that intentionally build lightweight
response dictionaries instead of persisting a model.  Keeping their schema
types here gives those endpoints an explicit, reusable contract without
coupling runtime validation to response rendering.
"""

from rest_framework import serializers

from analytics.serializers import UserActivitySerializer
from operations.serializers import NotificationSerializer


class MessageResponseSerializer(serializers.Serializer):
    message = serializers.CharField()


class StatusResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    message = serializers.CharField(required=False)


class RegistrationRequestSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    lat = serializers.FloatField(required=False, allow_null=True)
    lng = serializers.FloatField(required=False, allow_null=True)


class PasswordLoginRequestSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    lat = serializers.FloatField(required=False, allow_null=True)
    lng = serializers.FloatField(required=False, allow_null=True)
    city = serializers.CharField(required=False)
    country_code = serializers.CharField(required=False, max_length=3)


class GoogleLoginRequestSerializer(serializers.Serializer):
    token = serializers.CharField(write_only=True)
    lat = serializers.FloatField(required=False, allow_null=True)
    lng = serializers.FloatField(required=False, allow_null=True)
    city = serializers.CharField(required=False)
    country_code = serializers.CharField(required=False, max_length=3)


class TokenPairResponseSerializer(serializers.Serializer):
    refresh = serializers.CharField(read_only=True)
    access = serializers.CharField(read_only=True)
    username = serializers.CharField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetVerifyRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(write_only=True, min_length=6, max_length=6)
    new_password = serializers.CharField(write_only=True)


class HelpBeaconRequestSerializer(serializers.Serializer):
    message = serializers.CharField()
    latitude = serializers.FloatField(required=False, allow_null=True, min_value=-90, max_value=90)
    longitude = serializers.FloatField(required=False, allow_null=True, min_value=-180, max_value=180)
    city = serializers.CharField(required=False)
    country_code = serializers.CharField(required=False, max_length=3)


class HelpBeaconResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    echo = serializers.CharField(allow_blank=True)


class GlobeDataResponseSerializer(serializers.Serializer):
    points = UserActivitySerializer(many=True, read_only=True)
    live_count = serializers.IntegerField(min_value=0)
    server_time = serializers.DateTimeField()


class HealthResponseSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["healthy", "degraded"])
    timestamp = serializers.DateTimeField()
    version = serializers.CharField()
    database = serializers.ChoiceField(choices=["ok", "error"])


class TerminalRequestSerializer(serializers.Serializer):
    command = serializers.CharField(allow_blank=True)


class TerminalResponseSerializer(serializers.Serializer):
    output = serializers.ListField(child=serializers.CharField())


class NotificationListResponseSerializer(serializers.Serializer):
    notifications = NotificationSerializer(many=True, read_only=True)
    unread_count = serializers.IntegerField(min_value=0)


class NotificationActionRequestSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["mark_all_read"], required=False)
    id = serializers.IntegerField(required=False, min_value=1)


class SystemSettingUpdateRequestSerializer(serializers.Serializer):
    key = serializers.CharField()
    value = serializers.CharField(allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)


class SystemSettingDeleteRequestSerializer(serializers.Serializer):
    key = serializers.CharField()


class SystemSettingUpdateResponseSerializer(serializers.Serializer):
    key = serializers.CharField()
    value = serializers.CharField(allow_blank=True)
    message = serializers.CharField()


class BreachSearchRequestSerializer(serializers.Serializer):
    query = serializers.CharField(max_length=254)


class BreachSerializer(serializers.Serializer):
    name = serializers.CharField()
    domain = serializers.CharField()
    breach_date = serializers.CharField()
    data_classes = serializers.ListField(child=serializers.CharField())
    is_verified = serializers.BooleanField()
    description = serializers.CharField(allow_blank=True)


class BreachSearchResponseSerializer(serializers.Serializer):
    breaches = BreachSerializer(many=True)
    password_exposures = serializers.IntegerField(min_value=0)
    internal_matches = serializers.IntegerField(min_value=0)
    query = serializers.CharField()
    rate_limited = serializers.BooleanField(required=False)
    hibp_error = serializers.CharField(required=False)
    hibp_note = serializers.CharField(required=False)
    risk_score = serializers.IntegerField(min_value=0, max_value=100)


class RiskBreakdownSerializer(serializers.Serializer):
    critical = serializers.IntegerField(min_value=0)
    high = serializers.IntegerField(min_value=0)
    medium = serializers.IntegerField(min_value=0)
    low = serializers.IntegerField(min_value=0)
    total_analyses = serializers.IntegerField(min_value=0)
    breach_hits = serializers.IntegerField(min_value=0)
    average_strength = serializers.FloatField()
    passwords_generated = serializers.IntegerField(min_value=0)


class RiskRecommendationSerializer(serializers.Serializer):
    level = serializers.CharField()
    title = serializers.CharField()
    detail = serializers.CharField()


class RiskTrajectoryPointSerializer(serializers.Serializer):
    label = serializers.CharField()
    value = serializers.FloatField()


class FinancialRiskResponseSerializer(serializers.Serializer):
    total_exposure = serializers.FloatField(min_value=0)
    gdpr_fines = serializers.FloatField(min_value=0)
    ccpa_fines = serializers.FloatField(min_value=0)
    remediation_cost = serializers.FloatField(min_value=0)
    breach_probability = serializers.FloatField(min_value=0, max_value=100)
    severity = serializers.CharField()
    breakdown = RiskBreakdownSerializer()
    recommendations = RiskRecommendationSerializer(many=True)
    trajectory = RiskTrajectoryPointSerializer(many=True)
    generated_at = serializers.DateTimeField()


class PasswordAnalyzeRequestSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)
    pii_data = serializers.JSONField(required=False, default=dict)


class PasswordAnalyzeResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False, min_value=1)
    score = serializers.IntegerField(min_value=0, max_value=100)
    vulnerabilities = serializers.ListField(child=serializers.CharField())
    recommendations = serializers.ListField(child=serializers.CharField())
    crack_time = serializers.CharField()
    level = serializers.CharField()
    entropy = serializers.IntegerField(required=False, min_value=0)
    breach_count = serializers.IntegerField(required=False, min_value=0)
    created_at = serializers.DateTimeField(required=False)


class PasswordAnalysisHistoryItemSerializer(serializers.Serializer):
    id = serializers.IntegerField(min_value=1)
    vulnerability_level = serializers.CharField()
    strength_score = serializers.IntegerField(min_value=0, max_value=100)
    crack_time_estimate = serializers.CharField()
    breach_count = serializers.IntegerField(min_value=0)
    vulnerabilities_count = serializers.IntegerField(min_value=0)
    vulnerabilities_found = serializers.ListField(child=serializers.CharField())
    recommendations = serializers.ListField(child=serializers.CharField())
    created_at = serializers.DateTimeField()


class PasswordAnalysisHistoryResponseSerializer(serializers.Serializer):
    analyses = PasswordAnalysisHistoryItemSerializer(many=True)


class UserPreferencesSerializer(serializers.Serializer):
    default_mode = serializers.CharField(help_text='Either "user" or "security".')
    last_mode = serializers.CharField(help_text='Either "user" or "security".')
    updated_at = serializers.DateTimeField(required=False)


class UserPreferencesUpdateRequestSerializer(serializers.Serializer):
    default_mode = serializers.CharField(required=False, help_text='Either "user" or "security".')
    last_mode = serializers.CharField(required=False, help_text='Either "user" or "security".')


class UserPreferencesUpdateResponseSerializer(UserPreferencesSerializer):
    message = serializers.CharField()


class PasswordBreachCheckRequestSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)


class PasswordBreachCheckResponseSerializer(serializers.Serializer):
    breached = serializers.BooleanField(allow_null=True)
    count = serializers.IntegerField(allow_null=True, min_value=0)
    message = serializers.CharField(required=False)


class UserActivityFeedItemSerializer(serializers.Serializer):
    id = serializers.JSONField()
    type = serializers.CharField()
    message = serializers.CharField()
    details = serializers.JSONField(required=False)
    time = serializers.DateTimeField()
    status = serializers.CharField()


class UserActivityFeedResponseSerializer(serializers.Serializer):
    activities = UserActivityFeedItemSerializer(many=True)


class CreateTeamRequestSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)


class CreateTeamResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    code = serializers.CharField()
    id = serializers.IntegerField(min_value=1)


class JoinTeamRequestSerializer(serializers.Serializer):
    invite_code = serializers.CharField(required=False)
    code = serializers.CharField(required=False)


class TeamMemberSerializer(serializers.Serializer):
    username = serializers.CharField()
    role = serializers.CharField()
    joined_at = serializers.DateTimeField()
    active_status = serializers.CharField()


class TeamInfoResponseSerializer(serializers.Serializer):
    active = serializers.BooleanField()
    name = serializers.CharField(required=False)
    invite_code = serializers.CharField(required=False)
    my_role = serializers.CharField(required=False)
    members = TeamMemberSerializer(many=True, required=False)
    feed = serializers.ListField(child=serializers.DictField(), required=False)


class TeamChatRequestSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=2000)


class TeamChatMessageSerializer(serializers.Serializer):
    id = serializers.IntegerField(min_value=1)
    sender = serializers.CharField()
    content = serializers.CharField()
    timestamp = serializers.DateTimeField()
    is_me = serializers.BooleanField()


class WordlistEntrySerializer(serializers.Serializer):
    password = serializers.CharField()
    score = serializers.IntegerField(min_value=0, max_value=100)


class GenerationMetricsSerializer(serializers.Serializer):
    effectiveness_score = serializers.FloatField(min_value=0, max_value=100)
    risk_density = serializers.FloatField(min_value=0, max_value=100)
    threat_level = serializers.CharField()
    total_words = serializers.IntegerField(min_value=0)
    matched_words = serializers.IntegerField(min_value=0)


class PiiSubmitResponseSerializer(serializers.Serializer):
    wordlist = WordlistEntrySerializer(many=True)
    id = serializers.IntegerField(min_value=1)
    status = serializers.CharField()
    fallback = serializers.BooleanField()
    metrics = GenerationMetricsSerializer()


class HistoryItemSerializer(serializers.Serializer):
    id = serializers.IntegerField(min_value=1)
    timestamp = serializers.DateTimeField()
    pii_summary = serializers.JSONField()
    wordlist_count = serializers.IntegerField(min_value=0)
    ip_address = serializers.IPAddressField(allow_null=True)


class HistoryResponseSerializer(serializers.Serializer):
    results = HistoryItemSerializer(many=True)
    total = serializers.IntegerField(min_value=0)
    page = serializers.IntegerField(min_value=1)
    page_size = serializers.IntegerField(min_value=1)
    total_pages = serializers.IntegerField(min_value=0)


class UserStatsResponseSerializer(serializers.Serializer):
    operations = serializers.IntegerField(min_value=0)
    data_points = serializers.IntegerField(min_value=0)
    uptime = serializers.CharField()
    threats = serializers.IntegerField(min_value=0)


class UserProfileTeamSerializer(serializers.Serializer):
    name = serializers.CharField()
    role = serializers.CharField()
    joined_at = serializers.DateTimeField()


class UserProfileStatsSerializer(serializers.Serializer):
    total_generations = serializers.IntegerField(min_value=0)
    total_words_generated = serializers.IntegerField(min_value=0)
    last_generation = serializers.DateTimeField(allow_null=True)


class UserProfileResponseSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField(allow_blank=True)
    first_name = serializers.CharField(allow_blank=True)
    last_name = serializers.CharField(allow_blank=True)
    date_joined = serializers.DateTimeField()
    is_superuser = serializers.BooleanField()
    is_active = serializers.BooleanField()
    has_usable_password = serializers.BooleanField()
    auth_type = serializers.CharField()
    team = UserProfileTeamSerializer(allow_null=True)
    unread_messages = serializers.IntegerField(min_value=0)
    stats = UserProfileStatsSerializer()


class UserProfileUpdateRequestSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False)
    current_password = serializers.CharField(required=False, write_only=True)
    new_password = serializers.CharField(required=False, write_only=True)


class DownloadTokenRequestSerializer(serializers.Serializer):
    file_type = serializers.ChoiceField(choices=["wordlist", "report"])
    record_id = serializers.IntegerField(min_value=1)


class DownloadTokenResponseSerializer(serializers.Serializer):
    download_token = serializers.CharField()


class CachedWordlistResponseSerializer(serializers.Serializer):
    wordlist = WordlistEntrySerializer(many=True)
    id = serializers.IntegerField(min_value=1)
    status = serializers.CharField()


class AdminActionRequestSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["promote_admin", "demote_admin", "block", "unblock", "change_password"])
    user_id = serializers.IntegerField(min_value=1)
    new_password = serializers.CharField(required=False, write_only=True)


class AdminUserSerializer(serializers.Serializer):
    id = serializers.IntegerField(min_value=1)
    username = serializers.CharField()
    email = serializers.EmailField(allow_blank=True)
    is_superuser = serializers.BooleanField()
    is_active = serializers.BooleanField()
    date_joined = serializers.DateTimeField()
    location = serializers.CharField()
    pass_display = serializers.CharField()
    generation_count = serializers.IntegerField(min_value=0)


class AdminGenerationSerializer(serializers.Serializer):
    id = serializers.IntegerField(min_value=1)
    timestamp = serializers.DateTimeField()
    ip_address = serializers.IPAddressField(allow_null=True)
    wordlist_count = serializers.IntegerField(min_value=0)


class SuperAdminResponseSerializer(serializers.Serializer):
    users = AdminUserSerializer(many=True, required=False)
    logs = serializers.ListField(child=serializers.DictField(), required=False)
    activities = serializers.ListField(child=serializers.DictField(), required=False)
    total_generations = serializers.IntegerField(required=False, min_value=0)
    generations = AdminGenerationSerializer(many=True, required=False)


class AdminMessageRequestSerializer(serializers.Serializer):
    recipient_id = serializers.IntegerField(required=False, min_value=1)
    content = serializers.CharField(max_length=2000)


class AdminConversationEntrySerializer(serializers.Serializer):
    id = serializers.IntegerField(min_value=1)
    username = serializers.CharField(required=False)
    unread = serializers.IntegerField(required=False, min_value=0)
    sender = serializers.CharField(required=False)
    content = serializers.CharField(required=False)
    timestamp = serializers.DateTimeField(required=False)
    is_me = serializers.BooleanField(required=False)
    is_read = serializers.BooleanField(required=False)


class AdminUserListSerializer(serializers.Serializer):
    id = serializers.IntegerField(min_value=1)
    username = serializers.CharField()
    email = serializers.EmailField(allow_blank=True)
    is_active = serializers.BooleanField()


class AdminPurgeRequestSerializer(serializers.Serializer):
    confirm = serializers.CharField()


class AdminPurgeResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    deleted = serializers.DictField(child=serializers.IntegerField(min_value=0))
