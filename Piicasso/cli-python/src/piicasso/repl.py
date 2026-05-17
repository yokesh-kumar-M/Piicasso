"""Interactive REPL — mirrors the in-browser ``Terminal`` component.

Same command surface as the browser terminal, plus every Click subcommand
exposed by :mod:`piicasso.cli`. Uses ``prompt_toolkit`` for history,
``rich`` for color, and dispatches subcommands by re-entering Click's own
command tree so REPL output matches one-shot ``piicasso <cmd> ...``.
"""

from __future__ import annotations

import shlex
import sys
from typing import List, Optional

import click
from prompt_toolkit import PromptSession
from prompt_toolkit.completion import WordCompleter
from prompt_toolkit.formatted_text import FormattedText
from prompt_toolkit.history import InMemoryHistory

from . import config
from .ui import theme


_REPL_BUILTINS = [
    "help", "clear", "mode", "switch", "whoami", "routes", "echo", "about", "exit", "quit",
]

_SUBCOMMANDS = [
    "analyze", "redact", "score", "wordgen", "submit", "history",
    "darkweb", "risk", "inbox", "login", "logout", "config",
]

ALL_COMMANDS = _REPL_BUILTINS + _SUBCOMMANDS


_HELP_LINES = [
    ("help",                    "show this help text"),
    ("clear",                   "wipe the terminal"),
    ("mode",                    "print the current mode"),
    ("switch <user|security>",  "change the active mode"),
    ("whoami",                  "show the authenticated user"),
    ("routes",                  "list known CLI commands"),
    ("analyze <text>",          "detect PII in text (local)"),
    ("redact <text>",           "print text with PII masked (local)"),
    ("score <pw>",              "score a password (local)"),
    ("wordgen -p k=v",          "generate a wordlist (local)"),
    ("submit <file>",           "upload for AI analysis (API)"),
    ("history",                 "list recent analyses (API)"),
    ("darkweb <q>",             "breach-search (API)"),
    ("risk <target>",           "financial-risk score (API)"),
    ("inbox",                   "list messages (API)"),
    ("login / logout",          "manage credentials"),
    ("config get|set <k>",      "inspect / mutate config"),
    ("echo <text>",             "echo back text"),
    ("about",                   "short blurb about PIIcasso"),
    ("exit / quit",             "leave the terminal"),
]

_ABOUT = [
    "PIIcasso — PII exposure intelligence & adversarial wordlist platform.",
    "Two modes: user (defensive) and security (offensive ops).",
    "Local commands run instantly; API commands need `piicasso login`.",
]


def _prompt_fragments() -> FormattedText:
    p = theme.palette()
    return FormattedText([(p.accent, p.prompt + " ")])


def _print_help() -> None:
    theme.console.print(theme.label_text("commands:"))
    for cmd, desc in _HELP_LINES:
        theme.console.print(f"  [bold white]{cmd:<24}[/bold white] [dim]{desc}[/dim]", markup=True)


def _print_routes() -> None:
    theme.console.print(theme.label_text("CLI commands:"))
    for c in ALL_COMMANDS:
        theme.console.print(f"  {c}")


def _dispatch_subcommand(cmd: str, argv: List[str]) -> None:
    """Re-enter Click with the chosen subcommand."""
    from .cli import main as root  # avoid circular import at module load

    sub = root.get_command(click.Context(root), cmd)
    if sub is None:
        theme.print_err(f"command not found: {cmd}")
        return
    # Run the subcommand in its own context so its sys.exit() doesn't kill the REPL.
    try:
        with click.Context(sub, info_name=cmd) as ctx:
            sub.invoke(_with_parsed_args(sub, ctx, argv))
    except SystemExit:
        # Click commands call sys.exit on failure; the REPL swallows it.
        pass
    except click.ClickException as exc:
        theme.print_err(exc.format_message())
    except Exception as exc:  # noqa: BLE001 — REPL must survive any command error
        theme.print_err(f"{exc.__class__.__name__}: {exc}")


def _with_parsed_args(cmd: click.Command, ctx: click.Context, argv: List[str]) -> click.Context:
    """Parse ``argv`` against ``cmd`` and stash the result on ``ctx``."""
    parser = cmd.make_parser(ctx)
    opts, args, param_order = parser.parse_args(args=list(argv))
    for param in param_order:
        value, args = param.handle_parse_result(ctx, opts, args)
    ctx.args = args
    return ctx


def _tokenize(line: str) -> List[str]:
    try:
        return shlex.split(line)
    except ValueError:
        # Unmatched quotes etc — fall back to whitespace split.
        return line.split()


def run() -> None:
    """Enter the interactive REPL. Returns when the user types exit/quit."""
    for line in theme.banner_lines():
        theme.console.print(line)

    history = InMemoryHistory()
    completer = WordCompleter(ALL_COMMANDS, ignore_case=True)
    session: PromptSession = PromptSession(history=history, completer=completer)

    while True:
        try:
            text = session.prompt(_prompt_fragments())
        except (EOFError, KeyboardInterrupt):
            theme.print_dim("\nbye.")
            return

        line = text.strip()
        if not line:
            continue

        argv = _tokenize(line)
        cmd = argv[0].lower()
        rest = argv[1:]

        if cmd in ("exit", "quit"):
            theme.print_dim("bye.")
            return

        if cmd in ("help", "?"):
            _print_help()
            continue

        if cmd == "clear":
            click.clear()
            continue

        if cmd == "mode":
            theme.console.print(theme.dim_text("current mode: ") + theme.ok_text(config.get_mode()))
            continue

        if cmd == "switch":
            target = (rest[0] if rest else "").lower()
            if target not in ("user", "security"):
                theme.print_err("usage: switch user|security")
                continue
            config.set_mode(target)
            theme.print_ok(f"mode -> {target}")
            continue

        if cmd == "routes":
            _print_routes()
            continue

        if cmd == "echo":
            click.echo(" ".join(rest))
            continue

        if cmd == "about":
            for l in _ABOUT:
                theme.console.print(theme.out_text(l))
            continue

        if cmd in _SUBCOMMANDS:
            _dispatch_subcommand(cmd, rest)
            continue

        theme.print_err(f"command not found: {cmd}")
