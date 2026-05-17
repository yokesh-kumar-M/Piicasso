from .generation import (
    RegisterView,
    PiiSubmitView,
    HistoryView,
    delete_history_entry,
    download_wordlist,
    export_history_csv,
    download_report_pdf,
    user_stats,
    user_profile,
    generate_download_token,
    download_file_with_token,
    get_cached_wordlist,
)
from .admin import (
    SuperAdminView,
    super_admin_view,
    admin_message_view,
    admin_users_list,
    admin_purge_all,
)
from .system import SystemLogView, SimulatedTerminalView, health_check

# Re-exported so tests / monkey-patches can target wordgen.views.<name> even
# though the actual implementations live in wordgen.llm_handler.
from ..llm_handler import build_prompt, call_gemini_api, score_wordlist  # noqa: F401
