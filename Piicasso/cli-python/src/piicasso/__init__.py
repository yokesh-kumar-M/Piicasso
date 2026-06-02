"""piicasso — command-line interface for the PIIcasso platform.

Local PII analysis (analyze/redact/score/wordgen) is delivered by the
:mod:`piicasso.engine.pii` module. API-backed features (login, submit,
history, dark-web, risk, inbox) live under :mod:`piicasso.api.client`.
"""

__version__ = "2.0.0"
__all__ = ["__version__"]
