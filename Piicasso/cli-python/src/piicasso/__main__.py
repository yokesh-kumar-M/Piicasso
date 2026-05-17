"""Allow ``python -m piicasso`` to dispatch into the Click root group."""

from piicasso.cli import main

if __name__ == "__main__":  # pragma: no cover - thin shim
    main()
