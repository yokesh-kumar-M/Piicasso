# Re-exported so tests / monkey-patches can target wordgen.views.<name> even
# though the actual implementations live in the submodules below.
from ..llm_handler import build_prompt, call_gemini_api, score_wordlist
from .admin import (
    SuperAdminView,
    admin_message_view,
    admin_purge_all,
    admin_users_list,
    super_admin_view,
)
from .generation import (
    HistoryView,
    PiiSubmitView,
    RegisterView,
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
from .system import SimulatedTerminalView, SystemLogView, health_check

__all__ = [
    "HistoryView",
    "PiiSubmitView",
    "RegisterView",
    "SimulatedTerminalView",
    "SuperAdminView",
    "SystemLogView",
    "admin_message_view",
    "admin_purge_all",
    "admin_users_list",
    "build_prompt",
    "call_gemini_api",
    "delete_history_entry",
    "download_file_with_token",
    "download_report_pdf",
    "download_wordlist",
    "export_history_csv",
    "generate_download_token",
    "get_cached_wordlist",
    "health_check",
    "score_wordlist",
    "super_admin_view",
    "user_profile",
    "user_stats",
]
