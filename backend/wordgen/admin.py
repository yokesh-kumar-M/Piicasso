# ===== Fixed backend/wordgen/admin.py =====
from django.contrib import admin
from generator.models import GenerationHistory
from django.http import HttpResponse
import json
from django.utils.html import format_html

def export_wordlist(modeladmin, request, queryset):
    """Export selected wordlists"""
    if queryset.count() == 1:
        obj = queryset.first()
        response = HttpResponse("\n".join(obj.wordlist), content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename=wordlist_{obj.id}.txt'
        return response
    else:
        # Handle multiple selections
        import zipfile
        import io
        
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for obj in queryset:
                zip_file.writestr(f'wordlist_{obj.id}.txt', '\n'.join(obj.wordlist))
        
        zip_buffer.seek(0)
        response = HttpResponse(zip_buffer.read(), content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename=wordlists.zip'
        return response

export_wordlist.short_description = "Download Selected Wordlists"

@admin.register(GenerationHistory)
class GenerationHistoryAdmin(admin.ModelAdmin):
    list_display = ("id", "timestamp", "ip_address", "short_pii", "wordlist_count", "wordlist_preview")
    list_filter = ("timestamp", "ip_address")
    search_fields = ("ip_address",)
    readonly_fields = ("timestamp", "pii_data", "wordlist", "ip_address")
    actions = [export_wordlist]

    def short_pii(self, obj):
        """Show shortened PII data"""
        pii_str = json.dumps(obj.pii_data, indent=2)
        return (pii_str[:100] + "...") if len(pii_str) > 100 else pii_str
    short_pii.short_description = "PII Data"

    def wordlist_count(self, obj):
        """Show count of generated passwords"""
        return len(obj.wordlist) if obj.wordlist else 0
    wordlist_count.short_description = "Password Count"

    def wordlist_preview(self, obj):
        """Show preview of wordlist"""
        if not obj.wordlist:
            return "None"
        preview = "\n".join(obj.wordlist[:5])
        if len(obj.wordlist) > 5:
            preview += f"\n... and {len(obj.wordlist) - 5} more"
        return format_html(f"<pre style='max-width:300px; overflow-x:auto; font-size:12px;'>{preview}</pre>")
    wordlist_preview.short_description = "Password Preview"