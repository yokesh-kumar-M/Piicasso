from __future__ import annotations

from unittest.mock import Mock

import pytest
from click.testing import CliRunner

from piicasso import cli
from piicasso.api.client import APIError


@pytest.fixture
def runner() -> CliRunner:
    return CliRunner()


def test_login_command_passes_prompted_identifier(
    runner: CliRunner,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = Mock()
    client_factory = Mock(return_value=client)
    monkeypatch.setattr(cli, "_api_client", client_factory)
    monkeypatch.setattr(
        cli.config, "get_api_base", Mock(return_value="https://api.example.test/api/")
    )
    monkeypatch.setattr(cli.getpass, "getpass", Mock(return_value="secret"))

    result = runner.invoke(cli.main, ["login"], input="ada@example.test\n")

    assert result.exit_code == 0, result.output
    client_factory.assert_called_once_with(base="https://api.example.test/api/")
    client.login.assert_called_once_with("ada@example.test", "secret")


def test_submit_sends_only_supported_structured_profile(
    runner: CliRunner,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = Mock()
    client.post.return_value = {"id": 7, "status": "success", "wordlist": []}
    monkeypatch.setattr(cli, "_api_client", Mock(return_value=client))

    result = runner.invoke(
        cli.main,
        [
            "submit",
            "--profile",
            "full_name=Ada Lovelace",
            "--profile",
            "birth_year=1815",
            "--pattern-mode",
            "deep",
            "--json",
        ],
    )

    assert result.exit_code == 0, result.output
    client.post.assert_called_once_with(
        "submit/",
        json_body={
            "full_name": "Ada Lovelace",
            "birth_year": "1815",
            "pattern_mode": "deep",
        },
    )


def test_submit_rejects_unknown_field_before_http(
    runner: CliRunner,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client_factory = Mock()
    monkeypatch.setattr(cli, "_api_client", client_factory)

    result = runner.invoke(cli.main, ["submit", "--profile", "typo_name=Ada"])

    assert result.exit_code == 2
    assert "unsupported PII field: typo_name" in result.output
    client_factory.assert_not_called()


def test_risk_uses_supported_get_contract(
    runner: CliRunner,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = Mock()
    client.get.return_value = {
        "severity": "LOW",
        "total_exposure": 0,
        "breach_probability": 0,
        "recommendations": [],
    }
    monkeypatch.setattr(cli, "_api_client", Mock(return_value=client))

    result = runner.invoke(cli.main, ["risk", "--json"])

    assert result.exit_code == 0, result.output
    client.get.assert_called_once_with("operations/financial-risk/")
    client.post.assert_not_called()


def test_api_error_becomes_clean_cli_failure(
    runner: CliRunner,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = Mock()
    client.get.side_effect = APIError("HTTP 503 — unavailable")
    monkeypatch.setattr(cli, "_api_client", Mock(return_value=client))

    result = runner.invoke(cli.main, ["risk"])

    assert result.exit_code == 1
    assert isinstance(result.exception, SystemExit)
