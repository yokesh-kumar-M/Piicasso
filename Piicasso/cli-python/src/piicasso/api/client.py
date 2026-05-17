"""Authenticated HTTP client for the PIIcasso backend.

Mirrors ``cli-node/src/api/client.js``: every request carries the stored
access token; on a 401 the client tries to refresh once, retries the original
request, then surfaces ``SessionExpired`` if the refresh fails too.
"""

from __future__ import annotations

import json
from typing import Any, Dict, Mapping, Optional

import requests

from .. import config


class APIError(Exception):
    """A non-auth HTTP failure. ``message`` is already user-friendly."""


class SessionExpired(APIError):
    """Raised when the refresh token is missing or rejected."""

    def __init__(self) -> None:
        super().__init__("session expired — run `piicasso login`")


def _format_http_error(resp: requests.Response) -> str:
    body: Any = None
    try:
        body = resp.json()
    except (ValueError, json.JSONDecodeError):
        body = resp.text
    detail = ""
    if isinstance(body, dict):
        detail = body.get("detail") or body.get("error") or ""
        if not detail:
            detail = json.dumps(body)
    elif isinstance(body, str):
        detail = body.strip()
    suffix = f" — {detail}" if detail else ""
    return f"HTTP {resp.status_code}{suffix}"


class APIClient:
    """Thin wrapper around :mod:`requests` with PIIcasso auth semantics."""

    def __init__(self, base: Optional[str] = None, timeout: float = 30.0) -> None:
        self.base = (base or config.get_api_base()).rstrip("/") + "/"
        self.timeout = timeout

    # ─── auth helpers ──────────────────────────────────────────────────

    def _auth_header(self) -> Dict[str, str]:
        token = config.load_config().get("access")
        return {"Authorization": f"Bearer {token}"} if token else {}

    def login(self, identifier: str, password: str) -> Dict[str, Any]:
        """POST credentials to /user/token/ and persist the JWT pair."""
        payload: Dict[str, Any]
        if "@" in identifier:
            payload = {"email": identifier, "password": password}
        else:
            payload = {"username": identifier, "password": password}
        url = self.base + "user/token/"
        resp = requests.post(url, json=payload, timeout=self.timeout)
        if not resp.ok:
            raise APIError(_format_http_error(resp))
        data = resp.json()
        access = data.get("access")
        refresh = data.get("refresh")
        if not access:
            raise APIError("login response missing access token")
        config.set_tokens(access=access, refresh=refresh or "", email=identifier if "@" in identifier else None)
        return data

    def _try_refresh(self) -> bool:
        cfg = config.load_config()
        refresh = cfg.get("refresh")
        if not refresh:
            return False
        try:
            resp = requests.post(
                self.base + "user/token/refresh/",
                json={"refresh": refresh},
                timeout=self.timeout,
            )
        except requests.RequestException:
            return False
        if not resp.ok:
            return False
        data = resp.json()
        new_access = data.get("access")
        if not new_access:
            return False
        config.set_tokens(access=new_access, refresh=refresh, email=cfg.get("email"))
        return True

    # ─── generic request ───────────────────────────────────────────────

    def request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[Mapping[str, Any]] = None,
        json_body: Optional[Mapping[str, Any]] = None,
    ) -> Any:
        url = self.base + path.lstrip("/")
        headers = {"Accept": "application/json", **self._auth_header()}
        try:
            resp = requests.request(
                method.upper(),
                url,
                params=params,
                json=json_body,
                headers=headers,
                timeout=self.timeout,
            )
        except requests.RequestException as exc:
            raise APIError(f"no response from {self.base} ({exc.__class__.__name__})") from exc

        if resp.status_code == 401:
            if self._try_refresh():
                # Refresh succeeded — replay the original request once.
                headers = {"Accept": "application/json", **self._auth_header()}
                resp = requests.request(
                    method.upper(),
                    url,
                    params=params,
                    json=json_body,
                    headers=headers,
                    timeout=self.timeout,
                )
                if resp.status_code == 401:
                    raise SessionExpired()
            else:
                raise SessionExpired()

        if not resp.ok:
            raise APIError(_format_http_error(resp))

        if not resp.content:
            return None
        try:
            return resp.json()
        except (ValueError, json.JSONDecodeError):
            return resp.text

    # ─── convenience verbs ─────────────────────────────────────────────

    def get(self, path: str, **kwargs: Any) -> Any:
        return self.request("GET", path, **kwargs)

    def post(self, path: str, json_body: Optional[Mapping[str, Any]] = None, **kwargs: Any) -> Any:
        return self.request("POST", path, json_body=json_body, **kwargs)


# Default client used by the command layer.
def default_client() -> APIClient:
    return APIClient()
