from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from unittest.mock import Mock

import pytest
import requests

from piicasso import config
from piicasso.api.client import APIClient, APIError


class FakeResponse:
    def __init__(self, status_code: int, payload: Any = None, text: str = "") -> None:
        self.status_code = status_code
        self.payload = payload
        self.text = text
        self.content = b"response" if payload is not None or text else b""

    @property
    def ok(self) -> bool:
        return 200 <= self.status_code < 400

    def json(self) -> Any:
        if isinstance(self.payload, Exception):
            raise self.payload
        return self.payload


@pytest.fixture
def isolated_config(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    config_file = tmp_path / "config.json"
    monkeypatch.setattr(config, "CONFIG_DIR", tmp_path)
    monkeypatch.setattr(config, "CONFIG_FILE", config_file)
    return config_file


def test_email_login_uses_backend_username_contract(
    isolated_config: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    post = Mock(return_value=FakeResponse(200, {"access": "access-1", "refresh": "refresh-1"}))
    monkeypatch.setattr(requests, "post", post)

    data = APIClient(base="https://api.example.test/api/").login("ada@example.test", "secret")

    assert data["access"] == "access-1"
    post.assert_called_once_with(
        "https://api.example.test/api/user/token/",
        json={"username": "ada@example.test", "password": "secret"},
        timeout=30.0,
    )
    assert config.get_tokens() == {
        "access": "access-1",
        "refresh": "refresh-1",
        "email": "ada@example.test",
    }


def test_refresh_persists_rotated_pair_before_replay(
    isolated_config: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    config.set_tokens("access-old", "refresh-old", "ada@example.test")
    request = Mock(
        side_effect=[
            FakeResponse(401, {"detail": "expired"}),
            FakeResponse(200, {"results": []}),
        ]
    )
    refresh = Mock(
        return_value=FakeResponse(200, {"access": "access-new", "refresh": "refresh-new"})
    )
    monkeypatch.setattr(requests, "request", request)
    monkeypatch.setattr(requests, "post", refresh)

    result = APIClient(base="https://api.example.test/api/").get("history/")

    assert result == {"results": []}
    assert config.get_tokens() == {
        "access": "access-new",
        "refresh": "refresh-new",
        "email": "ada@example.test",
    }
    refresh.assert_called_once_with(
        "https://api.example.test/api/user/token/refresh/",
        json={"refresh": "refresh-old"},
        timeout=30.0,
    )
    assert request.call_count == 2
    assert request.call_args_list[1].kwargs["headers"]["Authorization"] == "Bearer access-new"


def test_token_pair_is_written_as_one_valid_config_document(
    isolated_config: Path,
) -> None:
    config.set_tokens("access", "refresh", "user@example.test")

    stored = json.loads(isolated_config.read_text(encoding="utf-8"))

    assert stored["access"] == "access"
    assert stored["refresh"] == "refresh"
    assert not list(isolated_config.parent.glob("*.tmp"))


def test_login_network_failure_is_api_error(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(requests, "post", Mock(side_effect=requests.ConnectionError("offline")))

    with pytest.raises(APIError, match=r"no response.*ConnectionError"):
        APIClient(base="https://api.example.test/api/").login("ada", "secret")


def test_http_error_keeps_backend_detail(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        requests,
        "request",
        Mock(return_value=FakeResponse(400, {"detail": "invalid input"})),
    )

    with pytest.raises(APIError, match="HTTP 400.*invalid input"):
        APIClient(base="https://api.example.test/api/").get("history/")


def test_login_rejects_non_json_protocol_response(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    invalid_json = ValueError("not json")
    monkeypatch.setattr(
        requests, "post", Mock(return_value=FakeResponse(200, invalid_json, "not json"))
    )

    with pytest.raises(APIError, match="login endpoint returned invalid JSON"):
        APIClient(base="https://api.example.test/api/").login("ada", "secret")
