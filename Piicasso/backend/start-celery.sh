#!/bin/sh
set -eu

exec celery -A backend worker \
  --loglevel "${CELERY_LOG_LEVEL:-INFO}" \
  --concurrency "${CELERY_CONCURRENCY:-2}" \
  --max-tasks-per-child "${CELERY_MAX_TASKS_PER_CHILD:-100}"
