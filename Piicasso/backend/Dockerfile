# syntax=docker/dockerfile:1.7

FROM python:3.12-slim-bookworm AS wheel-builder

ENV PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./

# Build direct and transitive dependencies into a complete wheelhouse. The
# runtime stage installs exclusively from this directory and never contacts an
# index.
RUN python -m pip wheel \
    --no-cache-dir \
    --wheel-dir /wheels \
    --requirement requirements.txt \
    pip==26.1.2 \
    setuptools==83.0.0


FROM python:3.12-slim-bookworm AS runtime

ENV ENV=production \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 10001 piicasso \
    && useradd --system --uid 10001 --gid piicasso \
        --home-dir /app --shell /usr/sbin/nologin piicasso

COPY --from=wheel-builder /build/requirements.txt ./requirements.txt

RUN --mount=type=bind,from=wheel-builder,source=/wheels,target=/wheels \
    python -m pip install \
    --no-cache-dir \
    --no-index \
    --find-links=/wheels \
    pip==26.1.2 \
    setuptools==83.0.0 \
    && python -m pip install \
    --no-cache-dir \
    --no-index \
    --find-links=/wheels \
    --requirement requirements.txt

COPY --chown=piicasso:piicasso . .

# Runtime-writable paths are excluded from the build context. Create them with
# the final UID before collectstatic imports Django's file log handlers, and so
# fresh named volumes inherit usable ownership.
RUN install -d -o piicasso -g piicasso \
        /app/logs \
        /app/media \
        /app/staticfiles

# collectstatic imports Django settings, which intentionally require signing
# and encryption keys. Generate throwaway values for this build step only;
# they are neither persisted as image ENV entries nor used at runtime.
RUN DJANGO_SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(64))')" \
    FIELD_ENCRYPTION_KEY="$(python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())')" \
    GOOGLE_CLIENT_ID="docker-build.invalid" \
    ENV=build \
    python manage.py collectstatic --noinput \
    && chmod 0755 /app/start.sh \
    && chown -R piicasso:piicasso /app

USER piicasso

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl --fail --silent --show-error --output /dev/null \
        "http://127.0.0.1:${PORT:-8000}/api/health/" || exit 1

CMD ["./start.sh"]
