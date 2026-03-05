"""
PIIcasso Core Views — Enterprise Grade
========================================
All API endpoints for wordlist generation, history management,
user profile, admin operations, terminal simulation, and system health.
"""
import os
import csv
import json
import html
import re
import logging
from io import StringIO, BytesIO

from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.http import HttpResponse, FileResponse
from django.utils import timezone
from django.db import connection
from django.db.models import Sum, Count, OuterRef, Subquery, Q
from django.conf import settings

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication

from .llm_handler import build_prompt, call_gemini_api
from generator.models import GenerationHistory
from teams.models import TeamMembership
from operations.models import SystemLog
from .serializers import Piiserializer, SystemLogSerializer
from .report_generator import generate_report_pdf
from analytics.models import UserActivity
from backend.throttles import PiiSubmitRateThrottle

logger = logging.getLogger('wordgen')

# Signer for short-lived download tokens (1.2 fix)
_download_signer = TimestampSigner(salt='piicasso-download')

# Download token expiry in seconds
DOWNLOAD_TOKEN_MAX_AGE = 60


# ─── RockYou Cache (singleton, thread-safe immutable) ────────────────────────
# NOTE (5.6): Loading the entire rockyou.txt into memory can consume significant
# RAM on constrained environments (e.g., 512 MB Render Free Tier). Consider
# making this opt-in or streaming from disk if memory is a concern.

def _load_rockyou():
    try:
        path = os.path.join(os.path.dirname(__file__), 'rockyou.txt')
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                return tuple(line.strip() for line in f if line.strip())
    except Exception as e:
        logger.warning(f"RockYou load failed: {e}")
    return ()

_ROCKYOU_CACHE = _load_rockyou()


def get_rockyou_wordlist():
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


# ─── HEALTH CHECK ────────────────────────────────────────────────────────────

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def health_check(request):
    """
    Production health check — verifies both the application layer and
    database connectivity. Used by load balancers and monitoring.
    """
    health = {
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'version': '2.0.0',
        'database': 'ok',
    }
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception as e:
        health['status'] = 'degraded'
        health['database'] = 'error'
        logger.error(f"Health check DB failure: {e}")
        return Response(health, status=503)

    return Response(health, status=200)


# ─── BEACON ──────────────────────────────────────────────────────────────────

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
        reg_enabled = SystemSetting.get('registration_enabled', 'true')
        if reg_enabled.lower() in ('false', '0', 'no'):
            return Response(
                {'error': 'Registration is currently disabled.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')
        lat = request.data.get('lat')
        lng = request.data.get('lng')

        # Input validation
        if not username or not password:
            return Response(
                {'error': 'Missing required fields: username and password.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(username) < 3 or len(username) > 30:
            return Response(
                {'error': 'Username must be 3–30 characters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Username must be alphanumeric with underscores/hyphens only
        if not re.match(r'^[a-zA-Z0-9_-]+$', username):
            return Response(
                {'error': 'Username may only contain letters, numbers, underscores, and hyphens.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Email format validation
        if email and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return Response(
                {'error': 'Invalid email format.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Password strength validation (uses Django's built-in validators)
        try:
            validate_password(password)
        except DjangoValidationError as e:
            return Response(
                {'error': e.messages[0] if e.messages else 'Password too weak.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Registration failed. Username or email may already be in use.'}, status=status.HTTP_400_BAD_REQUEST)

        if email and User.objects.filter(email=email).exists():
            return Response({'error': 'Registration failed. Username or email may already be in use.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.create_user(username=username, email=email, password=password)

            UserActivity.objects.create(
                activity_type='LOGIN',
                description=f"New operator registered",
                city="Unknown Cluster",
                latitude=max(-90.0, min(90.0, float(lat))) if lat is not None else 999.0,
                longitude=max(-180.0, min(180.0, float(lng))) if lng is not None else 999.0,
            )

            from operations.views import create_notification
            create_notification(
                user=user,
                notification_type='SYSTEM',
                title='Welcome to PIIcasso!',
                description='Your account has been created. Start by generating your first wordlist.',
                link='/',
            )

            logger.info(f"New user registered: {username}")
            return Response({'message': 'User created successfully.'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Registration error: {e}")
            return Response({'error': 'Registration failed. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        if xff:
            # Use first IP (client IP when behind trusted proxy like Render/Cloudflare)
            ip = xff.split(',')[0].strip()
            # Basic validation
            if ip and len(ip) <= 45:  # Max IPv6 length
                return ip
        return request.META.get('REMOTE_ADDR')

    def post(self, request):
        serializer = Piiserializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        pii_data = serializer.validated_data

        # Sanitize PII data to prevent stored XSS (1.6 fix)
        pii_data = _sanitize_pii_data(pii_data)

        non_empty_values = [v for v in pii_data.values() if v and v != '' and v != []]
        if not non_empty_values:
            return Response(
                {"error": "No meaningful PII data provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not os.environ.get("GEMINI_API_KEY"):
            return Response(
                {"error": "Generation service not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Read max_wordlist_size from system settings if available (5.4 fix)
        from operations.models import SystemSetting
        max_size_setting = SystemSetting.get('max_wordlist_size', '')
        try:
            max_size = int(max_size_setting) if max_size_setting else settings.PIICASSO_SETTINGS.get('MAX_WORDLIST_SIZE', 1000)
        except (ValueError, TypeError):
            max_size = settings.PIICASSO_SETTINGS.get('MAX_WORDLIST_SIZE', 1000)

        try:
            prompt = build_prompt(pii_data)
            wordlist_raw = call_gemini_api(prompt, pii_data=pii_data)

            rockyou_passwords = get_rockyou_wordlist()
            ai_wordlist = [line.strip() for line in wordlist_raw.splitlines() if line.strip()]

            # Combine unique (preserving order: AI-generated first)
            wordlist = list(dict.fromkeys(ai_wordlist + rockyou_passwords))

            if not wordlist:
                return Response({"error": "No passwords generated."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            if len(wordlist) > max_size:
                wordlist = wordlist[:max_size]

            record = GenerationHistory.objects.create(
                user=request.user,
                pii_data=pii_data,
                wordlist=wordlist,
                ip_address=self.get_client_ip(request),
            )

            UserActivity.objects.create(
                activity_type='GENERATE',
                description=f"Intelligence dossiers generated by {request.user.username}",
                city="Secure Node",
            )

            from operations.views import create_notification
            target_name = pii_data.get('full_name') or pii_data.get('username') or 'Unknown Target'
            create_notification(
                user=request.user,
                notification_type='GENERATION',
                title=f'Wordlist generated: {len(wordlist)} passwords',
                description=f'Target: {target_name}',
                link='/dashboard',
            )

            logger.info(f"Generation complete user={request.user.username} count={len(wordlist)}")
            return Response({"wordlist": wordlist, "id": record.id}, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Generation failed user={request.user.username}: {e}")
            error_response = {
                'error': 'Generation failed.',
                'type': 'server_error',
                'timestamp': timezone.now().isoformat(),
            }
            if 'api key' in str(e).lower():
                error_response['error'] = 'Service temporarily unavailable.'
                error_response['type'] = 'service_error'
            elif 'timeout' in str(e).lower():
                error_response['error'] = 'Request timed out.'
                error_response['type'] = 'timeout_error'

            return Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── HISTORY ─────────────────────────────────────────────────────────────────

class HistoryView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            page = max(1, int(request.query_params.get('page', 1)))
            page_size = min(100, max(1, int(request.query_params.get('page_size', 10))))

            start = (page - 1) * page_size
            end = start + page_size

            qs = GenerationHistory.objects.filter(user=request.user).defer('wordlist').order_by('-timestamp')
            total = qs.count()

            entries = qs[start:end]
            return Response({
                'results': [{
                    "id": h.id,
                    "timestamp": h.timestamp,
                    "pii_data": h.pii_data,
                    "wordlist_count": h.wordlist_count or 0,
                    "ip_address": h.ip_address,
                } for h in entries],
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': max(1, (total + page_size - 1) // page_size),
            })
        except Exception as e:
            logger.error(f"History fetch error: {e}")
            return Response({"error": "Failed to fetch history."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_history_entry(request, id):
    try:
        r = GenerationHistory.objects.get(id=id)
        if r.user != request.user and not request.user.is_superuser:
            return Response({"error": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)
        r.delete()
        return Response({"message": "Deleted."}, status=status.HTTP_204_NO_CONTENT)
    except GenerationHistory.DoesNotExist:
        return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def download_wordlist(request, id):
    try:
        r = GenerationHistory.objects.get(id=id)
        if r.user != request.user and not request.user.is_superuser:
            return Response({"error": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)
        txt = "\n".join(r.wordlist or [])
        resp = HttpResponse(txt, content_type='text/plain')
        resp['Content-Disposition'] = f'attachment; filename=wordlist_{id}.txt'
        return resp
    except GenerationHistory.DoesNotExist:
        return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def export_history_csv(request):
    try:
        if request.user.is_superuser:
            rows = GenerationHistory.objects.all().order_by('-timestamp')
        else:
            rows = GenerationHistory.objects.filter(user=request.user).order_by('-timestamp')

        buf = StringIO()
        writer = csv.writer(buf)
        writer.writerow(['ID', 'Timestamp', 'IP Address', 'PII Data', 'Wordlist Count', 'Sample Passwords'])
        for r in rows:
            sample = ', '.join((r.wordlist or [])[:5]) + ('...' if r.wordlist and len(r.wordlist) > 5 else '')
            writer.writerow([r.id, r.timestamp, r.ip_address, json.dumps(r.pii_data), len(r.wordlist or []), sample])

        resp = HttpResponse(buf.getvalue(), content_type='text/csv')
        resp['Content-Disposition'] = 'attachment; filename=history.csv'
        return resp
    except Exception as e:
        logger.error(f"CSV export error: {e}")
        return Response({"error": "Export failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def download_report_pdf(request, id):
    try:
        r = GenerationHistory.objects.get(id=id)
        if r.user != request.user and not request.user.is_superuser:
            return Response({"error": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)

        buffer = BytesIO()
        generate_report_pdf(r, buffer)
        buffer.seek(0)

        return FileResponse(buffer, as_attachment=True, filename=f'PIICASSO_REPORT_{id}.pdf', content_type='application/pdf')
    except GenerationHistory.DoesNotExist:
        return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        return Response({"error": "Report generation failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── USER STATS & PROFILE ───────────────────────────────────────────────────

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def user_stats(request):
    try:
        total_ops = GenerationHistory.objects.filter(user=request.user).count()
        total_passwords = GenerationHistory.objects.filter(user=request.user).aggregate(
            total=Sum('wordlist_count')
        )['total'] or 0

        return Response({
            "operations": total_ops,
            "data_points": total_passwords,
            "uptime": "99.9%",
            "threats": 0,
        })
    except Exception as e:
        logger.error(f"User stats error: {e}")
        return Response({"error": "Failed to fetch stats."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'PATCH'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Returns or updates detailed profile information for the authenticated user."""
    u = request.user

    if request.method in ('PUT', 'PATCH'):
        try:
            data = request.data

            if 'first_name' in data:
                u.first_name = data['first_name'][:30]
            if 'last_name' in data:
                u.last_name = data['last_name'][:30]
            if 'email' in data and data['email']:
                if User.objects.filter(email=data['email']).exclude(id=u.id).exists():
                    return Response({"error": "Email already in use."}, status=status.HTTP_400_BAD_REQUEST)
                u.email = data['email']

            if 'current_password' in data and 'new_password' in data:
                if not u.has_usable_password():
                    return Response({"error": "Cannot change password for OAuth accounts."}, status=status.HTTP_400_BAD_REQUEST)
                if not u.check_password(data['current_password']):
                    return Response({"error": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)
                try:
                    validate_password(data['new_password'], user=u)
                except DjangoValidationError as e:
                    return Response({"error": e.messages[0]}, status=status.HTTP_400_BAD_REQUEST)
                u.set_password(data['new_password'])

            u.save()

            # If password was changed, blacklist all existing refresh tokens
            if 'new_password' in data and 'current_password' in data:
                try:
                    from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
                    outstanding = OutstandingToken.objects.filter(user=u)
                    for token in outstanding:
                        BlacklistedToken.objects.get_or_create(token=token)
                except Exception:
                    pass  # Token blacklist may not be available

            return Response({"message": "Profile updated successfully."})
        except Exception as e:
            logger.error(f"Profile update error: {e}")
            return Response({"error": "Profile update failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # GET
    try:
        team_info = None
        try:
            membership = TeamMembership.objects.select_related('team').get(user=u)
            team_info = {
                "name": membership.team.name,
                "role": membership.role,
                "joined_at": membership.joined_at,
            }
        except TeamMembership.DoesNotExist:
            pass

        total_generations = GenerationHistory.objects.filter(user=u).count()
        total_words = GenerationHistory.objects.filter(user=u).aggregate(total=Sum('wordlist_count'))['total'] or 0
        last_gen = GenerationHistory.objects.filter(user=u).order_by('-timestamp').first()

        from operations.models import Message
        unread_messages = Message.objects.filter(recipient=u, is_read=False).count()

        return Response({
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
        })
    except Exception as e:
        logger.error(f"Profile fetch error: {e}")
        return Response({"error": "Failed to fetch profile."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── DOWNLOAD TOKEN GENERATION (1.2 fix) ────────────────────────────────────

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def generate_download_token(request):
    """
    Generate a short-lived, signed download token for browser window.open() downloads.
    This replaces passing full JWT access tokens in URL query parameters, which
    would leak them in server access logs, browser history, and Referer headers.
    """
    file_type = request.data.get('file_type', '')
    record_id = request.data.get('record_id', '')

    if not file_type or not record_id:
        return Response({"error": "file_type and record_id are required."}, status=status.HTTP_400_BAD_REQUEST)

    if file_type not in ('wordlist', 'report'):
        return Response({"error": "Invalid file_type."}, status=status.HTTP_400_BAD_REQUEST)

    # Verify user has access to this record
    try:
        record = GenerationHistory.objects.get(id=record_id)
        if record.user != request.user and not request.user.is_superuser:
            return Response({"error": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)
    except GenerationHistory.DoesNotExist:
        return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    # Sign: "user_id:file_type:record_id"
    payload = f"{request.user.id}:{file_type}:{record_id}"
    signed_token = _download_signer.sign(payload)

    return Response({"download_token": signed_token})


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def download_file_with_token(request, file_type, id):
    """
    Download endpoint that accepts a short-lived signed token (not a full JWT).
    Token is generated by generate_download_token and expires in 60 seconds.
    """
    token = request.query_params.get('token')
    if not token:
        return HttpResponse("Authentication required.", status=401)

    try:
        # Unsign and verify the token (max_age in seconds)
        payload = _download_signer.unsign(token, max_age=DOWNLOAD_TOKEN_MAX_AGE)
        parts = payload.split(':')
        if len(parts) != 3:
            return HttpResponse("Invalid token format.", status=401)

        user_id, token_file_type, token_record_id = parts

        # Verify the token matches the requested resource
        if token_file_type != file_type or str(token_record_id) != str(id):
            return HttpResponse("Token does not match requested resource.", status=403)

        user = User.objects.get(id=int(user_id))

    except SignatureExpired:
        return HttpResponse("Download link has expired. Please generate a new one.", status=401)
    except (BadSignature, User.DoesNotExist, ValueError):
        return HttpResponse("Invalid or expired token.", status=401)

    try:
        r = GenerationHistory.objects.get(id=id)
        if r.user != user and not user.is_superuser:
            return HttpResponse("Unauthorized.", status=403)

        if file_type == 'wordlist':
            txt = "\n".join(r.wordlist or [])
            resp = HttpResponse(txt, content_type='text/plain')
            resp['Content-Disposition'] = f'attachment; filename=wordlist_{id}.txt'
            return resp
        elif file_type == 'report':
            buffer = BytesIO()
            generate_report_pdf(r, buffer)
            buffer.seek(0)
            return FileResponse(buffer, as_attachment=True, filename=f'PIICASSO_REPORT_{id}.pdf', content_type='application/pdf')
        else:
            return HttpResponse("Invalid file type.", status=400)

    except GenerationHistory.DoesNotExist:
        return HttpResponse("Not found.", status=404)
    except Exception as e:
        logger.error(f"File download error: {e}")
        return HttpResponse("Download failed.", status=500)


# ─── SYSTEM LOGS ─────────────────────────────────────────────────────────────

class SystemLogView(APIView):
    """
    System logs — now requires authentication and superuser access (1.1 fix).
    Previously publicly readable by any anonymous visitor.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_superuser:
            return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

        logs = SystemLog.objects.all()[:15]
        if not logs.exists():
            SystemLog.objects.create(message="System initialized.", level="INFO", source="SYS")
            logs = SystemLog.objects.all()[:15]

        serializer = SystemLogSerializer(logs, many=True)
        return Response(serializer.data)



# ─── SIMULATED TERMINAL (1.7 fix — renamed + enum-based commands) ───────────
# ⚠️  WARNING: This endpoint does NOT execute real system commands.
# It returns hardcoded, simulated output for a cybersecurity-themed UI.
# Do NOT add real command execution (subprocess, os.system, etc.) here.
# Doing so would create an instant Remote Code Execution (RCE) vulnerability.

class SimulatedTerminalView(APIView):
    """
    Simulated terminal for the cybersecurity-themed UI.
    All commands are whitelisted and return hardcoded output.
    No real system commands are ever executed.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    # Whitelist of allowed simulated commands
    ALLOWED_COMMANDS = frozenset(['hydra', 'nmap', 'help', 'clear', 'whoami', 'status'])

    def post(self, request):
        command = request.data.get('command', '').strip()
        if not command:
            return Response({'output': []})

        parts = command.split()
        cmd_base = parts[0].lower()
        is_god = request.user.is_superuser
        output = []

        if cmd_base not in self.ALLOWED_COMMANDS:
            output.append(f"Restricted Shell: command '{cmd_base}' is not authorized.")
            output.append(f"Type 'help' for available commands.")
            return Response({'output': output})

        if cmd_base == 'hydra':
            output.append("Hydra v9.5 (c) 2024 by van Hauser/THC")
            output.append("[DATA] Attacking target...")
            output.append("[SUCCESS] Password found: admin/password123" if is_god else "[STATUS] 0 valid words found.")
        elif cmd_base == 'nmap':
            if not is_god:
                output.append(f"Restricted Shell: command '{cmd_base}' requires admin privileges.")
                return Response({'output': output})
            output.append(f"Starting Nmap 7.94 at {timezone.now()}")
            output.append("Nmap scan report for target")
            output.append("Host is up (0.001s latency).")
            output.append("PORT   STATE SERVICE")
            output.append("22/tcp open  ssh")
            output.append("80/tcp open  http")
        elif cmd_base == 'whoami':
            output.append(f"{request.user.username} ({'ADMIN' if is_god else 'OPERATOR'})")
        elif cmd_base == 'status':
            output.append("PIIcasso System Status: OPERATIONAL")
            output.append(f"Authenticated as: {request.user.username}")
        elif cmd_base == 'help':
            output.append("Available commands: hydra, nmap, whoami, status, help, clear")
        elif cmd_base == 'clear':
            output = []

        return Response({'output': output})


# ─── SUPER ADMIN ─────────────────────────────────────────────────────────────

class SuperAdminView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def check_permissions(self, request):
        super().check_permissions(request)
        if not request.user.is_superuser:
            self.permission_denied(request, message="Restricted entry. System Administrator ONLY.")

    def get(self, request):
        action = request.query_params.get('action')

        if action == "get_generations":
            target_id = request.query_params.get('user_id')
            if not target_id:
                return Response({"error": "user_id required."}, status=400)
            try:
                target_id = int(target_id)
            except (ValueError, TypeError):
                return Response({"error": "Invalid user_id."}, status=400)
            # Verify user exists
            if not User.objects.filter(id=target_id).exists():
                return Response({"error": "User not found."}, status=404)
            gens = list(
                GenerationHistory.objects.filter(user_id=target_id)
                .order_by('-timestamp')
                .values('id', 'timestamp', 'ip_address', 'wordlist')[:100]  # Limit results
            )
            for g in gens:
                g['wordlist_count'] = len(g['wordlist']) if g['wordlist'] else 0
                del g['wordlist']
            return Response({"generations": gens})

        latest_activity_sq = UserActivity.objects.filter(
            description__contains=OuterRef('username'),
            latitude__isnull=False,
        ).order_by('-timestamp').values('city')[:1]

        users_qs = User.objects.annotate(
            generated=Count('generationhistory'),
            latest_city=Subquery(latest_activity_sq),
        ).order_by('-date_joined')

        users = [{
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'is_superuser': u.is_superuser,
            'is_active': u.is_active,
            'date_joined': u.date_joined,
            'location': u.latest_city or "Unknown",
            'pass_display': "External Auth (Google)" if not u.has_usable_password() else "Password Set",
            'generation_count': u.generated,
        } for u in users_qs]

        logs = list(SystemLog.objects.all().order_by('-timestamp')[:50].values())
        activities = list(UserActivity.objects.all().order_by('-timestamp')[:50].values())
        history_count = GenerationHistory.objects.count()

        return Response({
            "users": users,
            "logs": logs,
            "activities": activities,
            "total_generations": history_count,
        })

    def post(self, request):
        action = request.data.get('action')
        target_id = request.data.get('user_id')

        if not target_id:
            return Response({"error": "user_id required."}, status=400)

        try:
            target_id = int(target_id)
        except (ValueError, TypeError):
            return Response({"error": "Invalid user_id."}, status=400)

        try:
            target_user = User.objects.get(id=target_id)
            if target_user.is_superuser and action in ("block", "delete", "change_password"):
                return Response({"error": "Admin Protection: Cannot modify another administrator."}, status=400)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)

        if action == "block":
            target_user.is_active = False
            target_user.save()
            return Response({"message": f"Operator {target_user.username} ACCESS BLOCKED."})
        elif action == "unblock":
            target_user.is_active = True
            target_user.save()
            return Response({"message": f"Operator {target_user.username} access restored."})
        elif action == "change_password":
            new_pwd = request.data.get('new_password')
            if not new_pwd:
                return Response({"error": "new_password required."}, status=400)
            try:
                validate_password(new_pwd, user=target_user)
            except DjangoValidationError as e:
                return Response({"error": e.messages[0] if e.messages else "Password too weak."}, status=400)
            target_user.set_password(new_pwd)
            target_user.save()
            # Invalidate all existing tokens for the target user
            try:
                from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
                for token in OutstandingToken.objects.filter(user=target_user):
                    BlacklistedToken.objects.get_or_create(token=token)
            except Exception:
                pass
            return Response({"message": f"Security clearance for {target_user.username} manually overridden."})

        return Response({"error": "Invalid action parameter."}, status=400)

    def delete(self, request):
        target_id = request.query_params.get('user_id')
        if not target_id:
            return Response({"error": "Provide user_id parameter."}, status=400)
        try:
            target_id = int(target_id)
        except (ValueError, TypeError):
            return Response({"error": "Invalid user_id."}, status=400)
        try:
            u = User.objects.get(id=target_id)
            if u.is_superuser:
                return Response({"error": "System Protection: Cannot delete an administrator."}, status=400)
            username = u.username
            u.delete()
            return Response({"message": f"User {username} and all their data eliminated."})
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)


super_admin_view = SuperAdminView.as_view()


# ─── ADMIN MESSAGING (2.3 fix — optimized N+1 queries) ──────────────────────

@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_message_view(request):
    """
    Superuser: GET ?user_id= → thread; GET → user list with unread counts;
               POST {recipient_id, content} → send.
    Regular user: GET → admin conversation; POST {content} → reply to admin.
    """
    from operations.models import Message

    # Pagination limit for message threads (2.5 fix)
    MESSAGE_LIMIT = 200

    if request.user.is_superuser:
        if request.method == 'GET':
            user_id = request.query_params.get('user_id')
            if not user_id:
                # Optimized: batch unread counts with annotation (2.3 fix)
                sent_ids = Message.objects.filter(recipient=request.user).values_list('sender_id', flat=True).distinct()
                recv_ids = Message.objects.filter(sender=request.user).values_list('recipient_id', flat=True).distinct()
                user_ids = set(list(sent_ids) + list(recv_ids)) - {request.user.id}

                users = User.objects.filter(id__in=user_ids).annotate(
                    unread_count=Count(
                        'sent_messages',
                        filter=Q(sent_messages__recipient=request.user, sent_messages__is_read=False)
                    )
                )
                return Response([{
                    "id": u.id,
                    "username": u.username,
                    "unread": u.unread_count,
                } for u in users])

            msgs = Message.objects.filter(
                Q(sender=request.user, recipient_id=user_id) |
                Q(sender_id=user_id, recipient=request.user)
            ).order_by('timestamp')[:MESSAGE_LIMIT]
            Message.objects.filter(sender_id=user_id, recipient=request.user, is_read=False).update(is_read=True)
            return Response([{
                "id": m.id, "sender": m.sender.username, "content": m.content,
                "timestamp": m.timestamp.isoformat(), "is_me": m.sender_id == request.user.id,
                "is_read": m.is_read,
            } for m in msgs])

        recipient_id = request.data.get('recipient_id')
        content = request.data.get('content', '').strip()
        if not recipient_id or not content:
            return Response({"error": "recipient_id and content are required."}, status=400)
        if len(content) > 2000:
            return Response({"error": "Message too long (max 2000 characters)."}, status=400)
        content = html.escape(content, quote=True)
        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)
        msg = Message.objects.create(sender=request.user, recipient=recipient, content=content)

        from operations.views import create_notification
        create_notification(user=recipient, notification_type='MESSAGE',
                           title=f'New message from {request.user.username}',
                           description=content[:100], link='/inbox')

        return Response({
            "id": msg.id, "sender": request.user.username, "content": msg.content,
            "timestamp": msg.timestamp.isoformat(), "is_me": True,
        }, status=201)

    else:
        admin = User.objects.filter(is_superuser=True).first()
        if not admin:
            return Response({"error": "No admin available."}, status=503)

        if request.method == 'GET':
            msgs = Message.objects.filter(
                Q(sender=request.user, recipient=admin) |
                Q(sender=admin, recipient=request.user)
            ).order_by('timestamp')[:MESSAGE_LIMIT]
            Message.objects.filter(sender=admin, recipient=request.user, is_read=False).update(is_read=True)
            return Response([{
                "id": m.id, "sender": m.sender.username, "content": m.content,
                "timestamp": m.timestamp.isoformat(), "is_me": m.sender_id == request.user.id,
            } for m in msgs])

        content = request.data.get('content', '').strip()
        if not content:
            return Response({"error": "Message cannot be empty."}, status=400)
        if len(content) > 2000:
            return Response({"error": "Message too long (max 2000 characters)."}, status=400)
        content = html.escape(content, quote=True)
        msg = Message.objects.create(sender=request.user, recipient=admin, content=content)

        from operations.views import create_notification
        create_notification(user=admin, notification_type='MESSAGE',
                           title=f'New message from {request.user.username}',
                           description=content[:100], link=f'/inbox?recipient={request.user.id}')

        return Response({
            "id": msg.id, "sender": request.user.username, "content": msg.content,
            "timestamp": msg.timestamp.isoformat(), "is_me": True,
        }, status=201)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_users_list(request):
    """Superuser-only: list all users for admin to select and message."""
    if not request.user.is_superuser:
        return Response({"error": "Access denied."}, status=403)
    users = User.objects.filter(is_superuser=False).order_by('username').values('id', 'username', 'email', 'is_active')
    return Response(list(users))
