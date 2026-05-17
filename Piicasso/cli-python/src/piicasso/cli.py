"""Click command surface for the PIIcasso CLI.

All subcommands live in this module — keeps imports trivial and the entry
point (`piicasso = piicasso.cli:main`) wires up cleanly. Heavy logic stays
in :mod:`piicasso.engine.pii` (local) and :mod:`piicasso.api.client` (API).
"""

from __future__ import annotations

import getpass
import json
import sys
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import click

# Coerce stdout/stderr to UTF-8 on Windows consoles so the box-drawing
# characters in our table dividers and REPL banner don't blow up under cp1252.
# `reconfigure` is a no-op if the stream is already UTF-8 or doesn't support it.
for _stream in (sys.stdout, sys.stderr):
    _reconfigure = getattr(_stream, "reconfigure", None)
    if _reconfigure is not None:
        try:
            _reconfigure(encoding="utf-8")
        except (OSError, ValueError):  # pragma: no cover — platform-dependent
            pass

from . import __version__, config  # noqa: E402  — must come after reconfigure
from .api.client import APIClient, APIError, SessionExpired
from .engine.pii import (
    detect_entities,
    generate_wordlist,
    redact_text,
    score_password,
)
from .ui import theme


SENSITIVE_CONFIG_KEYS = {"access", "refresh"}


# ─── helpers ────────────────────────────────────────────────────────────────

def _print_error_and_exit(message: str, code: int = 1) -> None:
    theme.print_err(f"error: {message}")
    sys.exit(code)


def _run_api(callable_) -> Any:
    """Invoke an API call and translate :class:`APIError` into a clean exit."""
    try:
        return callable_()
    except SessionExpired as exc:
        _print_error_and_exit(str(exc))
    except APIError as exc:
        _print_error_and_exit(str(exc))


def _parse_profile(pairs: Iterable[str]) -> Dict[str, str]:
    out: Dict[str, str] = {}
    for raw in pairs:
        if "=" not in raw:
            continue
        key, _, value = raw.partition("=")
        key = key.strip()
        value = value.strip()
        if key:
            out[key] = value
    return out


def _maybe_read(text: Optional[str], file: Optional[Path]) -> str:
    if file is not None:
        try:
            return file.read_text(encoding="utf-8")
        except OSError as exc:
            _print_error_and_exit(f"cannot read {file}: {exc}")
    return text or ""


def _mask(value: Any) -> str:
    if not isinstance(value, str):
        return str(value)
    if len(value) <= 8:
        return "***"
    return f"{value[:4]}…{value[-4:]}"


# ─── root group ─────────────────────────────────────────────────────────────

@click.group(
    invoke_without_command=True,
    context_settings={"help_option_names": ["-h", "--help"]},
)
@click.version_option(__version__, "-v", "--version", prog_name="piicasso")
@click.pass_context
def main(ctx: click.Context) -> None:
    """Command-line interface for the PIIcasso platform."""
    if ctx.invoked_subcommand is None:
        # Default behaviour: enter the REPL. Lazy import so the CLI starts fast.
        from . import repl
        repl.run()


# ─── auth ───────────────────────────────────────────────────────────────────

@main.command()
def login() -> None:
    """Sign in to the PIIcasso backend and store a JWT pair."""
    api_base = config.get_api_base()
    theme.print_dim("Sign in to PIIcasso")
    theme.print_dim(f"API: {api_base}")
    identifier = click.prompt("email or username", type=str, default="", show_default=False)
    identifier = identifier.strip()
    if not identifier:
        _print_error_and_exit("email or username is required")
    try:
        password = getpass.getpass("password: ")
    except (EOFError, KeyboardInterrupt):
        click.echo("")
        _print_error_and_exit("login cancelled")
    if not password:
        _print_error_and_exit("password is required")

    client = APIClient(base=api_base)
    try:
        client.login(identifier, password)
    except APIError as exc:
        _print_error_and_exit(str(exc))

    theme.print_ok("signed in.")
    theme.print_dim(f"tokens saved to {config.CONFIG_FILE}")


@main.command()
def logout() -> None:
    """Clear stored credentials from ~/.piicasso/config.json."""
    config.clear_tokens()
    theme.print_ok("signed out.")


@main.command()
def whoami() -> None:
    """Print the currently authenticated user."""
    cfg = config.load_config()
    if not cfg.get("access"):
        theme.print_dim("guest (not authenticated)")
        return
    client = APIClient()
    data = _run_api(lambda: client.get("profile/"))
    identifier = (data or {}).get("email") or (data or {}).get("username") or cfg.get("email") or "authenticated"
    role = "superuser" if (data or {}).get("is_superuser") else "standard"
    theme.console.print(theme.out_text(f"user: {identifier}"))
    theme.console.print(theme.out_text(f"role: {role}"))
    theme.print_dim(f"api : {config.get_api_base()}")


# ─── local engine ───────────────────────────────────────────────────────────

@main.command()
@click.argument("text", required=False)
@click.option("-f", "--file", "file_", type=click.Path(exists=True, dir_okay=False, path_type=Path),
              help="Read input from a file instead of an argument.")
@click.option("--json", "as_json", is_flag=True, help="Emit raw JSON instead of a table.")
def analyze(text: Optional[str], file_: Optional[Path], as_json: bool) -> None:
    """Detect PII entities in text (local, no network)."""
    body = _maybe_read(text, file_)
    if not body.strip():
        _print_error_and_exit("no text supplied (pass a string or --file path)")
    entities = detect_entities(body)
    if as_json:
        click.echo(json.dumps(entities, indent=2))
        return
    if not entities:
        theme.print_dim("no PII detected.")
        return
    plural = "ies" if len(entities) != 1 else "y"
    theme.console.print(theme.label_text(f"detected {len(entities)} entit{plural}:"))
    theme.print_dim("─" * 64)
    theme.print_dim(f"{'TYPE':<8} {'LABEL':<10} {'SPAN':<10} {'WEIGHT':<8} TEXT")
    theme.print_dim("─" * 64)
    for e in entities:
        span = f"{e['start']}-{e['end']}"
        theme.console.print(
            f"[bold green]{e['type']:<8}[/bold green] "
            f"{e['label']:<10} {span:<10} {e['weight']:.2f}     {e['text']}",
            markup=True,
        )


@main.command()
@click.argument("text", required=False)
@click.option("-f", "--file", "file_", type=click.Path(exists=True, dir_okay=False, path_type=Path),
              help="Read input from a file instead of an argument.")
@click.option("--json", "as_json", is_flag=True, help="Emit raw JSON instead of redacted text.")
def redact(text: Optional[str], file_: Optional[Path], as_json: bool) -> None:
    """Print text with PII replaced by [TYPE] placeholders (local)."""
    body = _maybe_read(text, file_)
    if not body.strip():
        _print_error_and_exit("no text supplied (pass a string or --file path)")
    entities = detect_entities(body)
    segments = redact_text(body, entities)
    if as_json:
        click.echo(json.dumps({"entities": entities, "segments": segments}, indent=2))
        return
    parts: List[str] = []
    for seg in segments:
        if seg["kind"] == "redact":
            parts.append(f"[{seg['type']}]")
        else:
            parts.append(seg["text"])
    click.echo("".join(parts))


@main.command()
@click.argument("password")
@click.option("-p", "--profile", multiple=True, help="Profile pairs (key=value); pass multiple.")
@click.option("--json", "as_json", is_flag=True, help="Emit raw JSON.")
def score(password: str, profile: Tuple[str, ...], as_json: bool) -> None:
    """Score a password's strength against an optional profile (local)."""
    if not password:
        _print_error_and_exit("password is required")
    prof = _parse_profile(profile)
    result = score_password(password, prof)
    if as_json:
        click.echo(json.dumps(result, indent=2, default=str))
        return
    rating = result["rating"]
    rating_style = "green" if rating in ("Strong", "Excellent") else ("yellow" if rating == "Moderate" else "red")
    theme.console.print(f"[yellow]score  [/yellow] : [{rating_style}]{result['score']}[/{rating_style}] / 100", markup=True)
    theme.console.print(f"[yellow]rating [/yellow] : [{rating_style}]{rating}[/{rating_style}]", markup=True)
    theme.console.print(f"[yellow]entropy[/yellow] : {result['entropy']} bits", markup=True)
    theme.console.print(f"[yellow]crack  [/yellow] : {result['time']} @ 10B guesses/sec", markup=True)
    if result["reasons"]:
        theme.print_dim("reasons:")
        for r in result["reasons"]:
            theme.console.print(f"  [dim]-[/dim] {r['label']} [dim]({r['kind']})[/dim]", markup=True)


@main.command()
@click.option("-p", "--profile", multiple=True, help="Profile pairs (key=value); pass multiple.")
@click.option("-l", "--limit", type=int, default=40, show_default=True, help="Cap the candidate count.")
@click.option("--json", "as_json", is_flag=True, help="Emit raw JSON instead of one-per-line.")
def wordgen(profile: Tuple[str, ...], limit: int, as_json: bool) -> None:
    """Generate an adversarial wordlist from a profile (local)."""
    prof = _parse_profile(profile)
    if not prof:
        _print_error_and_exit("at least one --profile key=value pair is required")
    words = generate_wordlist(prof, limit if limit > 0 else 40)
    if as_json:
        click.echo(json.dumps(words, indent=2))
        return
    if not words:
        theme.print_dim("no candidates generated.")
        return
    for w in words:
        click.echo(w)


# ─── API-backed ─────────────────────────────────────────────────────────────

@main.command()
@click.argument("file", type=click.Path(exists=True, dir_okay=False, path_type=Path))
@click.option("--json", "as_json", is_flag=True, help="Emit raw JSON.")
def submit(file: Path, as_json: bool) -> None:
    """Upload a file to the backend for AI-backed PII analysis."""
    text = file.read_text(encoding="utf-8")
    if not text.strip():
        _print_error_and_exit("file is empty")
    client = APIClient()
    data = _run_api(lambda: client.post("submit/", json_body={"text": text}))
    if as_json:
        click.echo(json.dumps(data, indent=2, default=str))
        return
    theme.print_ok("submitted.")
    if isinstance(data, dict):
        if "id" in data:
            theme.console.print(theme.label_text(f"id     : {data['id']}"))
        if "status" in data:
            theme.console.print(theme.label_text(f"status : {data['status']}"))
        if "summary" in data:
            theme.print_dim("summary:")
            theme.console.print(theme.out_text(str(data["summary"])))


@main.command()
@click.option("-l", "--limit", type=int, default=20, show_default=True)
@click.option("--json", "as_json", is_flag=True)
def history(limit: int, as_json: bool) -> None:
    """List recent analyses (API)."""
    client = APIClient()
    data = _run_api(lambda: client.get("history/"))
    rows: List[Dict[str, Any]] = []
    if isinstance(data, list):
        rows = data
    elif isinstance(data, dict):
        rows = list(data.get("results", []))
    rows = rows[: limit if limit > 0 else 20]
    if as_json:
        click.echo(json.dumps(rows, indent=2, default=str))
        return
    if not rows:
        theme.print_dim("no history yet.")
        return
    theme.console.print(theme.label_text(f"{len(rows)} record{'s' if len(rows) != 1 else ''}:"))
    theme.print_dim("─" * 72)
    theme.print_dim(f"{'ID':<6} {'CREATED':<22} {'STATUS':<12} PREVIEW")
    theme.print_dim("─" * 72)
    for r in rows:
        rid = r.get("id", "—")
        created = r.get("created_at") or r.get("timestamp") or r.get("created") or ""
        status = r.get("status") or r.get("state") or ""
        preview = (r.get("text") or r.get("input") or r.get("summary") or "").replace("\n", " ")[:40]
        theme.console.print(
            f"[green]{str(rid):<6}[/green] {str(created):<22} {str(status):<12} {preview}",
            markup=True,
        )


@main.command()
@click.argument("query")
@click.option("--json", "as_json", is_flag=True)
def darkweb(query: str, as_json: bool) -> None:
    """Breach-search the configured dark-web sources (API)."""
    client = APIClient()
    data = _run_api(lambda: client.post("operations/breach-search/", json_body={"query": query}))
    if as_json:
        click.echo(json.dumps(data, indent=2, default=str))
        return
    theme.console.print(theme.label_text(f'breach-search for "{query}"'))
    if not data:
        theme.print_dim("no data.")
        return
    hits = data.get("hits") if isinstance(data, dict) else None
    if isinstance(hits, list):
        theme.print_ok(f"{len(hits)} hit{'s' if len(hits) != 1 else ''}")
        for h in hits:
            src = h.get("source") or h.get("dataset") or "unknown"
            when = h.get("date") or h.get("breach_date") or ""
            theme.console.print(theme.out_text(f"  - {src}" + (f" ({when})" if when else "")))
        return
    click.echo(json.dumps(data, indent=2, default=str))


@main.command()
@click.argument("target")
@click.option("--json", "as_json", is_flag=True)
def risk(target: str, as_json: bool) -> None:
    """Compute a financial-risk score for the named target (API)."""
    client = APIClient()
    data = _run_api(lambda: client.post("operations/financial-risk/", json_body={"target": target}))
    if as_json:
        click.echo(json.dumps(data, indent=2, default=str))
        return
    theme.console.print(theme.label_text(f'financial-risk for "{target}"'))
    if not data:
        theme.print_dim("no data.")
        return
    if isinstance(data, dict):
        score_val = data.get("score") if "score" in data else data.get("risk_score")
        if isinstance(score_val, (int, float)):
            theme.print_ok(f"score: {score_val}")
        if data.get("summary"):
            theme.console.print(theme.out_text(str(data["summary"])))
        signals = data.get("signals")
        if isinstance(signals, list):
            theme.print_dim(f"signals ({len(signals)}):")
            for s in signals:
                theme.console.print(theme.out_text(f"  - {s if isinstance(s, str) else json.dumps(s)}"))


@main.command()
@click.option("--json", "as_json", is_flag=True)
def inbox(as_json: bool) -> None:
    """List messages from the operations inbox (API)."""
    client = APIClient()
    data = _run_api(lambda: client.get("operations/messages/"))
    rows: List[Dict[str, Any]] = []
    if isinstance(data, list):
        rows = data
    elif isinstance(data, dict):
        rows = list(data.get("results", []))
    if as_json:
        click.echo(json.dumps(rows, indent=2, default=str))
        return
    if not rows:
        theme.print_dim("inbox empty.")
        return
    theme.console.print(theme.label_text(f"{len(rows)} message{'s' if len(rows) != 1 else ''}:"))
    theme.print_dim("─" * 72)
    theme.print_dim(f"{'ID':<6} {'FROM':<20} {'WHEN':<22} SUBJECT")
    theme.print_dim("─" * 72)
    for r in rows:
        rid = r.get("id", "—")
        sender = r.get("sender") or r.get("from") or r.get("from_user") or ""
        when = r.get("created_at") or r.get("timestamp") or ""
        subj = (r.get("subject") or r.get("title") or r.get("body") or "").replace("\n", " ")[:40]
        theme.console.print(
            f"[green]{str(rid):<6}[/green] {str(sender):<20} {str(when):<22} {subj}",
            markup=True,
        )


# ─── mode + config ──────────────────────────────────────────────────────────

@main.command("mode")
@click.argument("value", required=False)
def mode_cmd(value: Optional[str]) -> None:
    """Show or set the local mode (controls prompt color)."""
    if value is None:
        theme.console.print(theme.dim_text("current mode: ") + theme.ok_text(config.get_mode()))
        return
    val = value.lower()
    if val not in ("user", "security"):
        _print_error_and_exit("mode must be one of: user, security")
    config.set_mode(val)
    theme.print_ok(f"mode -> {val}")


@main.command("config")
@click.argument("action", required=False)
@click.argument("key", required=False)
@click.argument("value", required=False)
def config_cmd(action: Optional[str], key: Optional[str], value: Optional[str]) -> None:
    """Inspect or mutate ~/.piicasso/config.json (list|get|set|unset)."""
    action = (action or "list").lower()
    cfg = config.load_config()

    if action == "list" or (action == "get" and not key):
        if not cfg:
            theme.print_dim("config is empty.")
            theme.print_dim(f"path: {config.CONFIG_FILE}")
            return
        theme.console.print(theme.label_text("config:"))
        for k, v in cfg.items():
            shown = _mask(v) if k in SENSITIVE_CONFIG_KEYS else (json.dumps(v) if isinstance(v, (dict, list)) else v)
            theme.console.print(f"  {k} = {shown}")
        theme.print_dim(f"path: {config.CONFIG_FILE}")
        theme.print_dim(f"api : {config.get_api_base()}")
        return

    if action == "get":
        if key not in cfg:
            _print_error_and_exit(f"key not set: {key}")
        v = cfg[key]
        shown = _mask(v) if key in SENSITIVE_CONFIG_KEYS else v
        click.echo(json.dumps(shown) if isinstance(shown, (dict, list)) else str(shown))
        return

    if action == "set":
        if not key:
            _print_error_and_exit("usage: piicasso config set <key> <value>")
        if value is None:
            _print_error_and_exit(f"missing value for {key}")
        cfg[key] = value
        config.save_config(cfg)
        theme.print_ok(f"set {key} = {value}")
        return

    if action in ("unset", "delete", "rm"):
        if not key:
            _print_error_and_exit(f"usage: piicasso config {action} <key>")
        cfg.pop(key, None)
        config.save_config(cfg)
        theme.print_ok(f"unset {key}")
        return

    _print_error_and_exit(f'unknown action "{action}". use get|set|unset|list')


@main.command()
def repl() -> None:
    """Start the interactive REPL (default when invoked with no args)."""
    from . import repl as repl_mod
    repl_mod.run()


if __name__ == "__main__":  # pragma: no cover
    main()
