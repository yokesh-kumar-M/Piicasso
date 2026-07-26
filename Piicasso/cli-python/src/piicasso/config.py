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
import tempfile
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
    """Atomically write the complete config back to disk."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(
        prefix=f".{CONFIG_FILE.name}.",
        suffix=".tmp",
        dir=CONFIG_DIR,
    )
    tmp = Path(tmp_name)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2, sort_keys=True)
            fh.flush()
            os.fsync(fh.fileno())

        # Tighten permissions before publishing the file so JWTs are never
        # briefly exposed with the process umask's default permissions.
        if os.name == "posix":
            os.chmod(tmp, stat.S_IRUSR | stat.S_IWUSR)
        os.replace(tmp, CONFIG_FILE)
    finally:
        try:
            tmp.unlink(missing_ok=True)
        except OSError:  # pragma: no cover - best-effort cleanup
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
    """Persist an access/refresh pair together in one atomic config update."""
    data = load_config()
    data["access"] = access
    data["refresh"] = refresh
    if email is not None:
        if email:
            data["email"] = email
        else:
            data.pop("email", None)
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
