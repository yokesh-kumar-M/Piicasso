from django.urls import path

from .presentation.views import (
    HistoryView,
    PiiSubmitView,
    delete_history_entry,
    download_file_with_token,
    download_report_pdf,
    download_wordlist,
    export_history_csv,
    generate_download_token,
    get_cached_wordlist,
    user_profile,
    user_stats,
)

urlpatterns = [
    # Clean PascalCase and camelCase routing aliases
    path("submit/", PiiSubmitView.as_view(), name="submit"),
    path("cached/<str:cache_key>/", get_cached_wordlist, name="cached_wordlist"),
    path("history/", HistoryView.as_view(), name="history"),
    path("history/<int:id>/", delete_history_entry, name="delete_history"),
    path("download/<int:id>/", download_wordlist, name="download_wordlist"),
    path("export/csv/", export_history_csv, name="export_csv"),
    path("exportCsv/", export_history_csv, name="export_csv_camel"),
    path("report/pdf/<int:id>/", download_report_pdf, name="download_report"),
    path("profile/", user_profile, name="profile"),
    path("stats/", user_stats, name="stats"),
    path("downloadToken/", generate_download_token, name="generate_download_token_camel"),
    path("downloadtoken/", generate_download_token, name="generate_download_token_clean"),
    path("download-token/", generate_download_token, name="generate_download_token"),
    path("file/<str:file_type>/<int:id>/", download_file_with_token, name="download_file_with_token"),
]
