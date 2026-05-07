"""
Intelligence app models — Target Profiles, Dossiers, Seeds, Credentials, Reports.
Aligned with PIIcasso Implementation Plan (CSE439 Capstone).
"""
import uuid
from django.db import models
from django.contrib.auth.models import User


class TargetProfile(models.Model):
    """Core entity — stores all PII for an authorized penetration test target."""

    unique_target_id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="intelligence_profiles"
    )
    full_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    place_of_origin = models.CharField(max_length=100, blank=True)
    current_location = models.CharField(max_length=100, blank=True)
    professional_affiliations = models.TextField(blank=True)
    education_background = models.TextField(blank=True)
    social_media_handles = models.JSONField(default=list)   # ["@handle1", "@handle2"]
    interests_array = models.JSONField(default=list)        # ["cricket", "BMW", "LPU"]
    # Extra PII fields (mirrors TargetForm categories)
    extra_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "target_profile"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["full_name"]),
            models.Index(fields=["created_by"]),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.unique_target_id})"

    def to_profile_dict(self):
        """Returns a flat dict suitable for passing to services."""
        return {
            "unique_target_id": str(self.unique_target_id),
            "full_name": self.full_name,
            "date_of_birth": str(self.date_of_birth) if self.date_of_birth else None,
            "place_of_origin": self.place_of_origin,
            "current_location": self.current_location,
            "professional_affiliations": self.professional_affiliations,
            "education_background": self.education_background,
            "social_media_handles": self.social_media_handles,
            "interests_array": self.interests_array,
            **self.extra_data,
        }


class IntelligenceDossier(models.Model):
    """1:1 with TargetProfile — stores computed risk metrics and generated wordlist."""

    THREAT_LEVELS = [
        ("LOW", "Low"),
        ("MEDIUM", "Medium"),
        ("HIGH", "High"),
        ("CRITICAL", "Critical"),
    ]

    dossier_id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )
    target = models.OneToOneField(
        TargetProfile, on_delete=models.CASCADE, related_name="dossier"
    )
    overall_risk_density = models.DecimalField(
        max_digits=10, decimal_places=4, default=0.0
    )
    effectiveness_score = models.DecimalField(
        max_digits=10, decimal_places=4, default=0.0
    )
    threat_level = models.CharField(
        max_length=20, choices=THREAT_LEVELS, default="LOW"
    )
    wordlist = models.JSONField(default=list)   # Plain password strings
    analyst_notes = models.TextField(blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "intelligence_dossier"

    def __str__(self):
        return f"Dossier for {self.target.full_name} — {self.threat_level}"


class WordlistSeed(models.Model):
    """1:M with TargetProfile — raw Gemini API output seeds."""

    BEHAVIORAL_CATEGORIES = [
        ("NAME", "Name-Based"),
        ("DATE", "Date-Based"),
        ("INTEREST", "Interest-Based"),
        ("LOCATION", "Location-Based"),
        ("AFFILIATION", "Affiliation-Based"),
    ]

    seed_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    target = models.ForeignKey(
        TargetProfile, on_delete=models.CASCADE, related_name="seeds"
    )
    seed_value = models.CharField(max_length=255)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=4, default=0.0)
    behavioral_category = models.CharField(
        max_length=20, choices=BEHAVIORAL_CATEGORIES, default="AFFILIATION"
    )
    source_engine = models.CharField(max_length=50, default="gemini-1.5-flash")
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "wordlist_seed"
        ordering = ["-confidence_score"]

    def __str__(self):
        return f"{self.seed_value} ({self.behavioral_category})"


class PermutedCredential(models.Model):
    """1:M with WordlistSeed — final expanded wordlist entries."""

    credential_id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )
    seed = models.ForeignKey(
        WordlistSeed, on_delete=models.CASCADE, related_name="permutations"
    )
    permuted_value = models.CharField(max_length=255)
    permutation_type = models.CharField(
        max_length=50
    )  # 'base', 'leetspeak', 'date_append', 'suffix'
    leetspeak_rule = models.CharField(max_length=50, blank=True)
    date_appendix = models.CharField(max_length=20, blank=True)
    risk_score = models.DecimalField(max_digits=10, decimal_places=4, default=0.0)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "permuted_credential"
        ordering = ["-risk_score"]

    def __str__(self):
        return f"{self.permuted_value} [{self.permutation_type}]"


class ExportReport(models.Model):
    """Stores metadata for exported PDF / TXT dossiers."""

    FILE_TYPES = [("PDF", "PDF"), ("TXT", "TXT")]

    report_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    target = models.ForeignKey(
        TargetProfile, on_delete=models.CASCADE, related_name="reports"
    )
    dossier = models.ForeignKey(
        IntelligenceDossier, on_delete=models.CASCADE, related_name="reports"
    )
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=10, choices=FILE_TYPES, default="PDF")
    generated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="export_reports"
    )
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "export_report"
        ordering = ["-generated_at"]

    def __str__(self):
        return f"{self.file_name} ({self.file_type})"
