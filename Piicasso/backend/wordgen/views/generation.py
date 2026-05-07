"""
Wordlist generation, history, download, and user profile views.
"""

import os
import csv
import json
import html
import re
import random
import logging
import threading
from io import StringIO, BytesIO

from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.http import HttpResponse, FileResponse, StreamingHttpResponse
from django.utils import timezone
from django.db.models import Sum
from django.conf import settings

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication

from generator.models import GenerationHistory
from ..serializers import Piiserializer
from ..report_generator import generate_report_pdf
from analytics.models import UserActivity
from backend.throttles import PiiSubmitRateThrottle
from ..utils import safe_float
from ..llm_handler import mask_pii_for_api

logger = logging.getLogger("wordgen")

# Signer for short-lived download tokens (1.2 fix)
_download_signer = TimestampSigner(salt="piicasso-download")

# Download token expiry in seconds
DOWNLOAD_TOKEN_MAX_AGE = 60

# Fields excluded from the PII summary (non-PII generation config)
_PII_SUMMARY_EXCLUDED = frozenset({"pattern_mode"})


def _redact_pii(pii_data):
    """
    Return a dict of field names whose values were non-empty, with every
    value replaced by '***'.  The caller learns *which* fields were provided
    without receiving any actual PII.
    """
    if not isinstance(pii_data, dict):
        return {}
    return {
        k: "***"
        for k, v in pii_data.items()
        if k not in _PII_SUMMARY_EXCLUDED and v and v != [] and v != ""
    }


# ─── RockYou Cache (lazy singleton, memory-bounded) ─────────────────────────
# Loaded on first use, not at import time, so startup RAM is unaffected even
# when rockyou.txt is present.  Reservoir sampling (Vitter's Algorithm R)
# caps the in-memory set at _ROCKYOU_MAX entries regardless of file size,
# giving a uniform random sample with a single streaming pass.

_ROCKYOU_MAX = 50_000
_ROCKYOU_CACHE = None          # None = not yet loaded
_ROCKYOU_LOCK = threading.Lock()


def _load_rockyou():
    path = os.path.join(os.path.dirname(__file__), "rockyou.txt")
    if not os.path.exists(path):
        return ()
    try:
        reservoir = []
        count = 0  # number of valid (non-blank) lines seen so far
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                word = line.strip()
                if not word:
                    continue
                if count < _ROCKYOU_MAX:
                    reservoir.append(word)
                else:
                    # Algorithm R: replace a random earlier entry with
                    # decreasing probability so every word has an equal
                    # chance of appearing in the final reservoir.
                    j = random.randint(0, count)
                    if j < _ROCKYOU_MAX:
                        reservoir[j] = word
                count += 1
        logger.info(f"RockYou loaded {len(reservoir)} entries (sampled from {count})")
        return tuple(reservoir)
    except Exception as e:
        logger.warning(f"RockYou load failed: {e}")
        return ()


def get_rockyou_wordlist():
    global _ROCKYOU_CACHE
    if _ROCKYOU_CACHE is None:
        with _ROCKYOU_LOCK:
            if _ROCKYOU_CACHE is None:  # second check under the lock
                _ROCKYOU_CACHE = _load_rockyou()
    return list(_ROCKYOU_CACHE)


# ─── PII SANITIZATION HELPER (1.6 fix) ──────────────────────────────────────


def _sanitize_pii_data(data):
    """
    Strip HTML tags from all string values in PII data to prevent stored XSS.
    Works recursively on dicts and lists.
    """
    if isinstance(data, dict):
        return {k: _sanitize_pii_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [_sanitize_pii_data(item) for item in data]
    elif isinstance(data, str):
        # Escape HTML entities to neutralise any embedded HTML/script tags
        return html.escape(data, quote=True)
    return data


# ─── REGISTRATION ────────────────────────────────────────────────────────────


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get_throttles(self):
        from backend.throttles import RegisterRateThrottle

        return [RegisterRateThrottle()]

    def post(self, request):
        # Check system setting: registration_enabled (5.4 fix)
        from operations.models import SystemSetting

        reg_enabled = SystemSetting.get("registration_enabled", "true")
        if reg_enabled.lower() in ("false", "0", "no"):
            return Response(
                {"error": "Registration is currently disabled."},
                status=status.HTTP_403_FORBIDDEN,
            )

        username = request.data.get("username", "").strip()
        email = request.data.get("email", "").strip()
        password = request.data.get("password", "")
        lat = request.data.get("lat")
        lng = request.data.get("lng")

        # Input validation
        if not username or not password:
            return Response(
                {"error": "Missing required fields: username and password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(username) < 3 or len(username) > 30:
            return Response(
                {"error": "Username must be 3–30 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Username must be alphanumeric with underscores/hyphens only
        if not re.match(r"^[a-zA-Z0-9_-]+$", username):
            return Response(
                {
                    "error": "Username may only contain letters, numbers, underscores, and hyphens."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Email format validation
        if email and not re.match(
            r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", email
        ):
            return Response(
                {"error": "Invalid email format."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Password strength validation (uses Django's built-in validators)
        try:
            validate_password(password)
        except DjangoValidationError as e:
            return Response(
                {"error": e.messages[0] if e.messages else "Password too weak."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {
                    "error": "Registration failed. Username or email may already be in use."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if email and User.objects.filter(email=email).exists():
            return Response(
                {
                    "error": "Registration failed. Username or email may already be in use."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.create_user(
                username=username, email=email, password=password
            )

            UserActivity.objects.create(
                user=user,
                activity_type="LOGIN",
                description=f"New operator registered",
                city="Unknown Cluster",
                latitude=max(-90.0, min(90.0, safe_float(lat)))
                if safe_float(lat) != 999.0
                else 999.0,
                longitude=max(-180.0, min(180.0, safe_float(lng)))
                if safe_float(lng) != 999.0
                else 999.0,
            )

            from operations.views import create_notification

            create_notification(
                user=user,
                notification_type="SYSTEM",
                title="Welcome to PIIcasso!",
                description="Your account has been created. Start by generating your first wordlist.",
                link="/",
            )

            logger.info(f"New user registered: {username}")
            return Response(
                {"message": "User created successfully."},
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            logger.error(f"Registration error: {e}")
            return Response(
                {"error": "Registration failed. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ─── PII SUBMISSION (Wordlist Generation) ────────────────────────────────────


class PiiSubmitView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [PiiSubmitRateThrottle]

    def get_client_ip(self, request):
        """
        Get client IP. In production behind a reverse proxy, use the
        rightmost IP in X-Forwarded-For (last external hop) for safety,
        or fall back to REMOTE_ADDR.
        """
        xff = request.META.get("HTTP_X_FORWARDED_FOR")
        if xff:
            # Use first IP (client IP when behind trusted proxy like Render/Cloudflare)
            ip = xff.split(",")[0].strip()
            # Basic validation
            if ip and len(ip) <= 45:  # Max IPv6 length
                return ip
        return request.META.get("REMOTE_ADDR")

    def post(self, request):
        serializer = Piiserializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        pii_data = serializer.validated_data

        # Sanitize PII data to prevent stored XSS (1.6 fix)
        pii_data = _sanitize_pii_data(pii_data)

        non_empty_values = [
            v
            for k, v in pii_data.items()
            if k != "pattern_mode" and v and v != "" and v != []
        ]
        if not non_empty_values:
            return Response(
                {"error": "No meaningful PII data provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        used_fallback = not bool(os.environ.get("GEMINI_API_KEY"))

        # Read max_wordlist_size from system settings if available (5.4 fix)
        from operations.models import SystemSetting

        max_size_setting = SystemSetting.get("max_wordlist_size", "")
        try:
            max_size = (
                int(max_size_setting)
                if max_size_setting
                else settings.PIICASSO_SETTINGS.get("MAX_WORDLIST_SIZE", 1000)
            )
        except (ValueError, TypeError):
            max_size = settings.PIICASSO_SETTINGS.get("MAX_WORDLIST_SIZE", 1000)

        try:
            from django.db import transaction

            pattern_mode = pii_data.pop("pattern_mode", "standard")

            # Caching to load balance and scale
            from django.core.cache import cache
            import hashlib
            import json
            from ..llm_handler import build_prompt, call_gemini_api, score_wordlist

            # Create a deterministic hash of the PII data + pattern mode
            cache_key_data = json.dumps(pii_data, sort_keys=True) + pattern_mode
            cache_key = f"wordgen_{request.user.id}_{hashlib.md5(cache_key_data.encode()).hexdigest()}"

            cached = cache.get(cache_key)

            if cached:
                # Cache stores scored format [{password, score}]; handle legacy
                # plain-string entries (pre-scoring) gracefully.
                if isinstance(cached[0], dict):
                    scored_list = cached
                    plain_passwords = [item["password"] for item in scored_list]
                else:
                    plain_passwords = cached
                    rockyou_set = set(get_rockyou_wordlist())
                    scored_list = score_wordlist(plain_passwords, pii_data, rockyou_set)
                    cache.set(cache_key, scored_list, timeout=60 * 60 * 24)
            else:
                # Synchronous generation (no Celery — fits 512MB free tier)
                logger.info(
                    f"Starting wordlist generation for user={request.user.username} cache_key={cache_key}"
                )

                pii_data = mask_pii_for_api(pii_data)
                prompt = build_prompt(pii_data, pattern_mode)
                wordlist_raw = call_gemini_api(prompt, pii_data=pii_data)

                ai_wordlist = [
                    line.strip() for line in wordlist_raw.splitlines() if line.strip()
                ]

                seen = set()
                plain_passwords = []
                for pwd in ai_wordlist:
                    if pwd not in seen:
                        plain_passwords.append(pwd)
                        seen.add(pwd)

                rockyou_passwords = get_rockyou_wordlist()
                for pwd in rockyou_passwords:
                    if pwd not in seen:
                        plain_passwords.append(pwd)
                        seen.add(pwd)

                if not plain_passwords:
                    return Response(
                        {"error": "No passwords generated. Provide more PII data."},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )

                # Truncate to max_size
                if len(plain_passwords) > max_size:
                    plain_passwords = plain_passwords[:max_size]

                # Score and sort; rockyou_set already in memory
                rockyou_set = set(rockyou_passwords)
                scored_list = score_wordlist(plain_passwords, pii_data, rockyou_set)

                # Cache scored format; DB stores plain strings (downloads unchanged)
                cache.set(cache_key, scored_list, timeout=60 * 60 * 24)

            # Atomically save DB records (generation history + activity + notification)
            with transaction.atomic():
                record = GenerationHistory.objects.create(
                    user=request.user,
                    pii_data=pii_data,
                    wordlist=plain_passwords,
                    ip_address=self.get_client_ip(request),
                )

                UserActivity.objects.create(
                    user=request.user,
                    activity_type="GENERATE",
                    description=f"Intelligence generated by {request.user.username}",
                    city="Secure Node",
                )

                from operations.views import create_notification

                create_notification(
                    user=request.user,
                    notification_type="SYSTEM",
                    title="Wordlist Generated",
                    description=f"Generated {len(scored_list)} password candidates.",
                    link="/dashboard",
                )

            # ── Compute threat metrics (E score + Risk Density + Threat Level) ──
            try:
                from ..services.metrics_service import compute_metrics
                metrics = compute_metrics(plain_passwords, pii_data)
            except Exception as _me:
                logger.warning(f"Metrics computation skipped: {_me}")
                metrics = {
                    "effectiveness_score": 0.0,
                    "risk_density": 0.0,
                    "threat_level": "LOW",
                    "total_words": len(plain_passwords),
                    "matched_words": 0,
                }

            logger.info(
                f"Generation complete user={request.user.username} "
                f"count={len(scored_list)} E={metrics['effectiveness_score']} "
                f"Rd={metrics['risk_density']} threat={metrics['threat_level']}"
            )
            return Response(
                {
                    "wordlist": scored_list,
                    "id": record.id,
                    "status": "success",
                    "fallback": used_fallback,
                    "metrics": metrics,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            logger.error(f"Generation failed user={request.user.username}: {e}")
            error_response = {
                "error": "Generation failed.",
                "type": "server_error",
                "timestamp": timezone.now().isoformat(),
            }
            if "api key" in str(e).lower():
                error_response["error"] = "Service temporarily unavailable."
                error_response["type"] = "service_error"
            elif "timeout" in str(e).lower():
                error_response["error"] = "Request timed out."
                error_response["type"] = "timeout_error"

            return Response(
                error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ─── HISTORY ─────────────────────────────────────────────────────────────────


class HistoryView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            page = max(1, int(request.query_params.get("page", 1)))
            page_size = min(100, max(1, int(request.query_params.get("page_size", 10))))

            start = (page - 1) * page_size
            end = start + page_size

            qs = (
                GenerationHistory.objects.filter(user=request.user)
                .defer("wordlist")
                .order_by("-timestamp")
            )
            total = qs.count()

            entries = qs[start:end]
            return Response(
                {
                    "results": [
                        {
                            "id": h.id,
                            "timestamp": h.timestamp,
                            # Raw pii_data is never returned — only the field
                            # names that were provided, with values masked.
                            "pii_summary": _redact_pii(h.pii_data),
                            "wordlist_count": h.wordlist_count or 0,
                            "ip_address": h.ip_address,
                        }
                        for h in entries
                    ],
                    "total": total,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": max(1, (total + page_size - 1) // page_size),
                }
            )
        except Exception as e:
            logger.error(f"History fetch error: {e}")
            return Response(
                {"error": "Failed to fetch history."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@api_view(["DELETE"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_history_entry(request, id):
    try:
        r = GenerationHistory.objects.get(id=id)
        if r.user != request.user and not request.user.is_superuser:
            return Response(
                {"error": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN
            )
        r.delete()
        return Response({"message": "Deleted."}, status=status.HTTP_204_NO_CONTENT)
    except GenerationHistory.DoesNotExist:
        return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def download_wordlist(request, id):
    try:
        r = GenerationHistory.objects.get(id=id)
        if r.user != request.user and not request.user.is_superuser:
            return Response(
                {"error": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN
            )
        txt = "\n".join(r.wordlist or [])
        resp = HttpResponse(txt, content_type="text/plain")
        resp["Content-Disposition"] = f"attachment; filename=wordlist_{id}.txt"
        return resp
    except GenerationHistory.DoesNotExist:
        return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def export_history_csv(request):
    def _row_generator():
        if request.user.is_superuser:
            qs = GenerationHistory.objects.all().order_by("-timestamp")
        else:
            qs = GenerationHistory.objects.filter(user=request.user).order_by(
                "-timestamp"
            )
        yield "ID,Timestamp,IP Address,PII Data,Wordlist Count,Sample Passwords\n"
        for r in qs:
            sample = ", ".join((r.wordlist or [])[:5]) + (
                "..." if r.wordlist and len(r.wordlist) > 5 else ""
            )
            row = [
                str(r.id),
                str(r.timestamp),
                str(r.ip_address),
                json.dumps(_redact_pii(r.pii_data)),
                str(len(r.wordlist or [])),
                sample,
            ]
            yield ",".join([f'"{v}"' for v in row]) + "\n"

    try:
        return StreamingHttpResponse(
            _row_generator(),
            content_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=history.csv"},
        )
    except Exception as e:
        logger.error(f"CSV export error: {e}")
        return Response(
            {"error": "Export failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def download_report_pdf(request, id):
    try:
        r = GenerationHistory.objects.get(id=id)
        if r.user != request.user and not request.user.is_superuser:
            return Response(
                {"error": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN
            )

        buffer = BytesIO()
        generate_report_pdf(r, buffer)
        buffer.seek(0)

        return FileResponse(
            buffer,
            as_attachment=True,
            filename=f"PIICASSO_REPORT_{id}.pdf",
            content_type="application/pdf",
        )
    except GenerationHistory.DoesNotExist:
        return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        return Response(
            {"error": "Report generation failed."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ─── USER STATS & PROFILE ───────────────────────────────────────────────────


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def user_stats(request):
    try:
        total_ops = GenerationHistory.objects.filter(user=request.user).count()
        total_passwords = (
            GenerationHistory.objects.filter(user=request.user).aggregate(
                total=Sum("wordlist_count")
            )["total"]
            or 0
        )

        return Response(
            {
                "operations": total_ops,
                "data_points": total_passwords,
                "uptime": "99.9%",
                "threats": 0,
            }
        )
    except Exception as e:
        logger.error(f"User stats error: {e}")
        return Response(
            {"error": "Failed to fetch stats."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET", "PUT", "PATCH"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Returns or updates detailed profile information for the authenticated user."""
    u = request.user

    if request.method in ("PUT", "PATCH"):
        try:
            data = request.data

            if "first_name" in data:
                u.first_name = data["first_name"][:30]
            if "last_name" in data:
                u.last_name = data["last_name"][:30]
            if "email" in data and data["email"]:
                if User.objects.filter(email=data["email"]).exclude(id=u.id).exists():
                    return Response(
                        {"error": "Email already in use."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                u.email = data["email"]

            if "current_password" in data and "new_password" in data:
                if not u.has_usable_password():
                    return Response(
                        {"error": "Cannot change password for OAuth accounts."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if not u.check_password(data["current_password"]):
                    return Response(
                        {"error": "Current password is incorrect."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                try:
                    validate_password(data["new_password"], user=u)
                except DjangoValidationError as e:
                    return Response(
                        {"error": e.messages[0]}, status=status.HTTP_400_BAD_REQUEST
                    )
                u.set_password(data["new_password"])

            u.save()

            # If password was changed, blacklist all existing refresh tokens
            if "new_password" in data and "current_password" in data:
                try:
                    from rest_framework_simplejwt.token_blacklist.models import (
                        OutstandingToken,
                        BlacklistedToken,
                    )

                    outstanding = OutstandingToken.objects.filter(user=u)
                    for token in outstanding:
                        BlacklistedToken.objects.get_or_create(token=token)
                except Exception:
                    pass  # Token blacklist may not be available

            return Response({"message": "Profile updated successfully."})
        except Exception as e:
            logger.error(f"Profile update error: {e}")
            return Response(
                {"error": "Profile update failed."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # GET
    try:
        team_info = None
        try:
            if hasattr(u, "team_membership"):
                membership = u.team_membership
                team_info = {
                    "name": membership.team.name,
                    "role": membership.role,
                    "joined_at": membership.joined_at,
                }
        except Exception as e:
            logger.error(f"Failed to fetch team info: {e}")

        total_generations = GenerationHistory.objects.filter(user=u).count()
        total_words = (
            GenerationHistory.objects.filter(user=u).aggregate(
                total=Sum("wordlist_count")
            )["total"]
            or 0
        )
        last_gen = (
            GenerationHistory.objects.filter(user=u).order_by("-timestamp").first()
        )

        from operations.models import Message

        unread_messages = Message.objects.filter(recipient=u, is_read=False).count()

        return Response(
            {
                "username": u.username,
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "date_joined": u.date_joined,
                "is_superuser": u.is_superuser,
                "is_active": u.is_active,
                "has_usable_password": u.has_usable_password(),
                "auth_type": "Password" if u.has_usable_password() else "Google OAuth",
                "team": team_info,
                "unread_messages": unread_messages,
                "stats": {
                    "total_generations": total_generations,
                    "total_words_generated": total_words,
                    "last_generation": last_gen.timestamp if last_gen else None,
                },
            }
        )
    except Exception as e:
        logger.error(f"Profile fetch error: {e}")
        return Response(
            {"error": "Failed to fetch profile."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ─── DOWNLOAD TOKEN GENERATION (1.2 fix) ────────────────────────────────────


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def generate_download_token(request):
    """
    Generate a short-lived, signed download token for browser window.open() downloads.
    This replaces passing full JWT access tokens in URL query parameters, which
    would leak them in server access logs, browser history, and Referer headers.
    """
    file_type = request.data.get("file_type", "")
    record_id = request.data.get("record_id", "")

    if not file_type or not record_id:
        return Response(
            {"error": "file_type and record_id are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if file_type not in ("wordlist", "report"):
        return Response(
            {"error": "Invalid file_type."}, status=status.HTTP_400_BAD_REQUEST
        )

    # Verify user has access to this record
    try:
        record = GenerationHistory.objects.get(id=record_id)
        if record.user != request.user and not request.user.is_superuser:
            return Response(
                {"error": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN
            )
    except GenerationHistory.DoesNotExist:
        return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    # Sign: "user_id:file_type:record_id"
    payload = f"{request.user.id}:{file_type}:{record_id}"
    signed_token = _download_signer.sign(payload)

    return Response({"download_token": signed_token})


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def download_file_with_token(request, file_type, id):
    """
    Download endpoint that accepts a short-lived signed token (not a full JWT).
    Token is generated by generate_download_token and expires in 60 seconds.
    """
    token = request.query_params.get("token")
    if not token:
        return HttpResponse("Authentication required.", status=401)

    try:
        # Unsign and verify the token (max_age in seconds)
        payload = _download_signer.unsign(token, max_age=DOWNLOAD_TOKEN_MAX_AGE)
        parts = payload.split(":")
        if len(parts) != 3:
            return HttpResponse("Invalid token format.", status=401)

        user_id, token_file_type, token_record_id = parts

        # Verify the token matches the requested resource
        if token_file_type != file_type or str(token_record_id) != str(id):
            return HttpResponse("Token does not match requested resource.", status=403)

        user = User.objects.get(id=int(user_id))

    except SignatureExpired:
        return HttpResponse(
            "Download link has expired. Please generate a new one.", status=401
        )
    except (BadSignature, User.DoesNotExist, ValueError):
        return HttpResponse("Invalid or expired token.", status=401)

    try:
        r = GenerationHistory.objects.get(id=id)
        if r.user != user and not user.is_superuser:
            return HttpResponse("Unauthorized.", status=403)

        if file_type == "wordlist":
            txt = "\n".join(r.wordlist or [])
            resp = HttpResponse(txt, content_type="text/plain")
            resp["Content-Disposition"] = f"attachment; filename=wordlist_{id}.txt"
            return resp
        elif file_type == "report":
            buffer = BytesIO()
            generate_report_pdf(r, buffer)
            buffer.seek(0)
            return FileResponse(
                buffer,
                as_attachment=True,
                filename=f"PIICASSO_REPORT_{id}.pdf",
                content_type="application/pdf",
            )
        else:
            return HttpResponse("Invalid file type.", status=400)

    except GenerationHistory.DoesNotExist:
        return HttpResponse("Not found.", status=404)
    except Exception as e:
        logger.error(f"File download error: {e}")
        return HttpResponse("Download failed.", status=500)


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_cached_wordlist(request, cache_key):
    """Retrieves a recently generated wordlist from Redis via cache_key."""
    from django.core.cache import cache

    cached = cache.get(cache_key)
    if not cached:
        return Response(
            {"error": "Wordlist not found or expired."}, status=status.HTTP_404_NOT_FOUND
        )

    # Normalise: cache holds scored [{password, score}] or legacy plain strings.
    if isinstance(cached[0], dict):
        scored_list = cached
        plain_passwords = [item["password"] for item in scored_list]
    else:
        plain_passwords = cached
        scored_list = [{"password": p, "score": 50} for p in cached]

    # Ownership check: DB stores plain strings, so compare against those.
    record = (
        GenerationHistory.objects.filter(user=request.user, wordlist=plain_passwords)
        .order_by("-timestamp")
        .first()
    )
    if not record:
        return Response({"error": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)

    return Response({"wordlist": scored_list, "id": record.id, "status": "complete"})
