from django.contrib import admin
from .models import GenerationHistory
from django.http import HttpResponse
import json
from django.utils.html import format_html

def export_wordlist(modeladmin, request, queryset):
    for obj in queryset:
        response = HttpResponse("\n".join(obj.wordlist), content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename=wordlist_{obj.id}.txt'
        return response

export_wordlist.short_description = "Download Wordlist (.txt)"

@admin.register(GenerationHistory)
class GenerationHistoryAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "ip_address", "short_pii", "wordlist_link")
    search_fields = ("ip_address",)
    readonly_fields = ("timestamp", "pii_data", "wordlist", "ip_address")
    actions = [export_wordlist]

    def short_pii(self, obj):
        return json.dumps(obj.pii_data)[:75] + "..."

    def wordlist_link(self, obj):
        text = "\n".join(obj.wordlist[:5]) + "\n..."
        return format_html(f"<pre style='max-width:400px; overflow-x:auto'>{text}</pre>")
