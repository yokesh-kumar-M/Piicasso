# PIIcasso project status

This historical status page previously made deployment and completion claims
that could not be established from the repository. It is intentionally kept as
a short index so project status has one maintained source of truth.

- See [README.md](README.md) for supported setup, architecture, commands,
  deployment configuration, and verification.
- See [UPGRADE_PLAN.md](UPGRADE_PLAN.md) for completed foundations and the
  remaining phased modernization roadmap.
- See [SECURITY_REMEDIATION.md](SECURITY_REMEDIATION.md) for owner actions that
  cannot be completed by code alone.

Configuration files may contain deployment targets, but their presence does
not prove that an external service is currently deployed or healthy. Verify
runtime health through the owning provider and `/api/health/`.
