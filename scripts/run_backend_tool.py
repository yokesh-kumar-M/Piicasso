#!/usr/bin/env python3
"""Run a backend tool with the repository-managed virtual environment.

This avoids shell-specific activation scripts, so Taskfile and pre-commit use
the same command on Windows, macOS, and Linux.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = REPO_ROOT / "Piicasso" / "backend"
VENV_DIR = BACKEND_DIR / ".venv"


def _venv_python() -> Path:
    interpreter = VENV_DIR / "Scripts" / "python.exe" if os.name == "nt" else VENV_DIR / "bin" / "python"

    if not interpreter.is_file():
        raise FileNotFoundError(
            f"Backend virtual environment not found at {VENV_DIR}. "
            "Run `task setup` first."
        )
    return interpreter


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    if not args:
        print(
            "usage: run_backend_tool.py <module-or-script> [arguments ...]",
            file=sys.stderr,
        )
        return 2

    try:
        interpreter = _venv_python()
    except FileNotFoundError as exc:
        print(exc, file=sys.stderr)
        return 2

    tool, *tool_args = args
    if tool.endswith(".py"):
        command = [str(interpreter), tool, *tool_args]
    else:
        command = [str(interpreter), "-m", tool, *tool_args]

    environment = os.environ.copy()
    environment["VIRTUAL_ENV"] = str(VENV_DIR)
    environment["PATH"] = str(interpreter.parent) + os.pathsep + environment.get("PATH", "")

    try:
        # The executable is the fixed venv interpreter and shell execution is disabled.
        completed = subprocess.run(  # noqa: S603
            command,
            cwd=BACKEND_DIR,
            env=environment,
            check=False,
        )
    except KeyboardInterrupt:
        return 130
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
