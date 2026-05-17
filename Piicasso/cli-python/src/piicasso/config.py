"""Config + credential storage for the PIIcasso CLI.

Persists to ``~/.piicasso/config.json``. The file is created with restrictive
permissions where the platform allows (POSIX 0600). Schema::

    {
        "api":     "https://core-engine-woeg.onrender.com/api/",
        "mode":    "user" | "security",
        "access":  "<jwt>",
        "refresh": "<jwt>",
        "email":   "user@example.com"
    }

Only ``api`` and ``mode`` are guaranteed to be present after first use; the
rest appear after a successful ``piicasso login``.
"""

from __future__ import annotations

import json
import os
import stat
from pathlib import Path
from typing import Any, Dict, Optional

DEFAULT_API = "https://core-engine-woeg.onrender.com/api/"
DEFAULT_MODE = "user"

CONFIG_DIR = Path.home() / ".piicasso"
CONFIG_FILE = CONFIG_DIR / "config.json"


def _default_config() -> Dict[str, Any]:
    return {"api": DEFAULT_API, "mode": DEFAULT_MODE}


def load_config() -> Dict[str, Any]:
    """Load the persisted config, falling back to defaults on any failure."""
    if not CONFIG_FILE.exists():
        return _default_config()
    try:
        with CONFIG_FILE.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
        if not isinstance(data, dict):
            return _default_config()
        # Backfill defaults so callers always see required keys.
        data.setdefault("api", DEFAULT_API)
        data.setdefault("mode", DEFAULT_MODE)
        return data
    except (OSError, json.JSONDecodeError):
        return _default_config()


def save_config(data: Dict[str, Any]) -> None:
    """Atomically write the config back to disk."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    tmp = CONFIG_FILE.with_suffix(".tmp")
    with tmp.open("w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, sort_keys=True)
    os.replace(tmp, CONFIG_FILE)
    # Best-effort tighten perms on POSIX. Windows has no concept of 0600.
    try:
        if os.name == "posix":
            os.chmod(CONFIG_FILE, stat.S_IRUSR | stat.S_IWUSR)
    except OSError:  # pragma: no cover - permission tightening is opportunistic
        pass


def get_api_base() -> str:
    """Resolve the API base URL: env var wins, then config, then default."""
    env = os.environ.get("PIICASSO_API")
    if env:
        return env.rstrip("/") + "/"
    api = load_config().get("api", DEFAULT_API)
    return api.rstrip("/") + "/"


def set_api_base(url: str) -> None:
    data = load_config()
    data["api"] = url.rstrip("/") + "/"
    save_config(data)


def get_mode() -> str:
    return load_config().get("mode", DEFAULT_MODE)


def set_mode(mode: str) -> None:
    if mode not in ("user", "security"):
        raise ValueError("mode must be 'user' or 'security'")
    data = load_config()
    data["mode"] = mode
    save_config(data)


def set_tokens(access: str, refresh: str, email: Optional[str] = None) -> None:
    data = load_config()
    data["access"] = access
    data["refresh"] = refresh
    if email:
        data["email"] = email
    save_config(data)


def clear_tokens() -> None:
    data = load_config()
    for key in ("access", "refresh", "email"):
        data.pop(key, None)
    save_config(data)


def get_tokens() -> Dict[str, Optional[str]]:
    data = load_config()
    return {
        "access": data.get("access"),
        "refresh": data.get("refresh"),
        "email": data.get("email"),
    }
