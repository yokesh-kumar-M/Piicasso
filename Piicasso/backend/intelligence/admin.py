from django.contrib import admin
from .models import TargetProfile, IntelligenceDossier, WordlistSeed, PermutedCredential, ExportReport


@admin.register(TargetProfile)
class TargetProfileAdmin(admin.ModelAdmin):
    list_display = ("full_name", "created_by", "created_at")
    search_fields = ("full_name", "created_by__username")
    list_filter = ("created_at",)
    readonly_fields = ("unique_target_id", "created_at", "updated_at")


@admin.register(IntelligenceDossier)
class IntelligenceDossierAdmin(admin.ModelAdmin):
    list_display = ("target", "threat_level", "effectiveness_score", "overall_risk_density", "generated_at")
    list_filter = ("threat_level",)
    readonly_fields = ("dossier_id", "generated_at", "updated_at")


@admin.register(WordlistSeed)
class WordlistSeedAdmin(admin.ModelAdmin):
    list_display = ("seed_value", "behavioral_category", "confidence_score", "target", "generated_at")
    list_filter = ("behavioral_category",)
    search_fields = ("seed_value", "target__full_name")


@admin.register(PermutedCredential)
class PermutedCredentialAdmin(admin.ModelAdmin):
    list_display = ("permuted_value", "permutation_type", "risk_score", "seed")
    list_filter = ("permutation_type",)


@admin.register(ExportReport)
class ExportReportAdmin(admin.ModelAdmin):
    list_display = ("file_name", "file_type", "generated_by", "generated_at")
    list_filter = ("file_type",)
