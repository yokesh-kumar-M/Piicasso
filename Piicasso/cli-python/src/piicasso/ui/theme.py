"""Mode-aware terminal styling — mirrors ``cli-node/src/ui/theme.js`` and the
in-browser ``Terminal`` component.

User mode uses cyan; security mode uses red. Errors are always red regardless
of mode (standard terminal UX).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from rich.console import Console
from rich.text import Text

from .. import config


@dataclass(frozen=True)
class Palette:
    name: str
    prompt: str
    accent: str            # main mode color (rich style name)
    accent_soft: str       # softer / brighter variant
    banner: str


_USER = Palette(
    name="user",
    prompt="user@piicasso:~$",
    accent="cyan",
    accent_soft="bright_cyan",
    banner="bold bright_cyan",
)

_SECURITY = Palette(
    name="security",
    prompt="sec@piicasso:~#",
    accent="red",
    accent_soft="bright_red",
    banner="bold bright_red",
)


def palette(mode: Optional[str] = None) -> Palette:
    """Return the palette for ``mode`` (or the currently configured mode)."""
    active = mode or config.get_mode()
    return _SECURITY if active == "security" else _USER


# Shared console — one per process, used by every command.
console = Console(highlight=False, soft_wrap=False)


# Convenience styled-text helpers. Each returns a rich ``Text`` so it composes
# cleanly with ``console.print(...)``.

def err_text(message: str) -> Text:
    return Text(message, style="bold red")


def ok_text(message: str) -> Text:
    return Text(message, style="bold green")


def dim_text(message: str) -> Text:
    return Text(message, style="dim")


def label_text(message: str) -> Text:
    return Text(message, style="yellow")


def out_text(message: str) -> Text:
    return Text(message, style="bold white")


def print_err(message: str) -> None:
    console.print(err_text(message))


def print_ok(message: str) -> None:
    console.print(ok_text(message))


def print_dim(message: str) -> None:
    console.print(dim_text(message))


def banner_lines(mode: Optional[str] = None):
    """Yield the banner lines used at REPL startup."""
    p = palette(mode)
    border = "═" * 58
    yield Text(f"╔{border}╗", style=p.banner)
    yield Text("║              PIIcasso Interactive Terminal              ║", style=p.banner)
    yield Text(f"║                Mode: {p.name.upper().ljust(8)}                          ║", style=p.banner)
    yield Text(f"╚{border}╝", style=p.banner)
    yield dim_text("Type 'help' to list available commands.")
    yield Text("")


def prompt_text(mode: Optional[str] = None) -> str:
    """Plain prompt string (without ANSI codes) for prompt_toolkit fallback."""
    return palette(mode).prompt + " "
