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


def _response_json(resp: requests.Response, context: str) -> Dict[str, Any]:
    """Return a JSON object or raise a stable, user-facing protocol error."""
    try:
        data = resp.json()
    except (ValueError, json.JSONDecodeError) as exc:
        raise APIError(f"{context} returned invalid JSON") from exc
    if not isinstance(data, dict):
        raise APIError(f"{context} returned an invalid response")
    return data


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
        # The backend accepts either a username or email through ``username``.
        payload: Dict[str, Any] = {"username": identifier, "password": password}
        url = self.base + "user/token/"
        try:
            resp = requests.post(url, json=payload, timeout=self.timeout)
        except requests.RequestException as exc:
            raise APIError(f"no response from {self.base} ({exc.__class__.__name__})") from exc
        if not resp.ok:
            raise APIError(_format_http_error(resp))
        data = _response_json(resp, "login endpoint")
        access = data.get("access")
        refresh = data.get("refresh")
        if not access:
            raise APIError("login response missing access token")
        config.set_tokens(
            access=str(access),
            refresh=str(refresh or ""),
            email=identifier if "@" in identifier else "",
        )
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
        try:
            data = _response_json(resp, "token refresh endpoint")
        except APIError:
            return False
        new_access = data.get("access")
        if not new_access:
            return False
        # SimpleJWT rotates and blacklists refresh tokens. Persist the token
        # pair in one config write, retaining the old refresh only when the
        # server has rotation disabled.
        new_refresh = data.get("refresh") or refresh
        config.set_tokens(
            access=str(new_access),
            refresh=str(new_refresh),
            email=cfg.get("email"),
        )
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
                    raise APIError(
                        f"no response from {self.base} ({exc.__class__.__name__})"
                    ) from exc
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
