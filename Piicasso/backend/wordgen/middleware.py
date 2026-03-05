# wordgen/middleware.py
"""
Enterprise middleware stack for PIIcasso:
- RequestIDMiddleware: Attaches a unique request ID for log correlation.
- PolicyViolationMiddleware: Blocks suspended users from non-auth endpoints.
- MaintenanceModeMiddleware: Returns 503 when maintenance_mode is enabled (5.4 fix).
- SecurityLoggingMiddleware: Audit logging with PII sanitization.
"""
import logging
import time
import json
import uuid

from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser
from django.http import JsonResponse
from django.core.cache import cache

logger = logging.getLogger('wordgen.security')


class RequestIDMiddleware(MiddlewareMixin):
    """
    Attaches a unique X-Request-ID to every request/response for correlation
    across logs, monitoring dashboards, and error reports.
    """
    def process_request(self, request):
        request.request_id = request.META.get(
            'HTTP_X_REQUEST_ID', uuid.uuid4().hex[:16]
        )

    def process_response(self, request, response):
        request_id = getattr(request, 'request_id', None)
        if request_id:
            response['X-Request-ID'] = request_id
        return response


class PolicyViolationMiddleware(MiddlewareMixin):
    """
    Blocks inactive (suspended) users from accessing any endpoint except
    auth and messaging endpoints so they can still appeal or communicate.
    """
    # Paths that suspended users are still allowed to access
    EXEMPT_PREFIXES = (
        '/api/token/',
        '/api/auth/',
        '/api/operations/messages/',
        '/api/health/',
    )

    def process_request(self, request):
        if (
            hasattr(request, 'user')
            and request.user.is_authenticated
            and not request.user.is_active
        ):
            if any(request.path.startswith(prefix) for prefix in self.EXEMPT_PREFIXES):
                return None
            return JsonResponse(
                {
                    'error': True,
                    'detail': 'Your account has been suspended due to a policy violation.',
                    'code': 'user_inactive',
                },
                status=403,
            )


class MaintenanceModeMiddleware(MiddlewareMixin):
    """
    Returns 503 for all non-admin, non-health requests when the
    'maintenance_mode' SystemSetting is set to 'true' (5.4 fix).
    Superusers can still access the site during maintenance.
    """
    EXEMPT_PREFIXES = (
        '/api/health/',
        '/api/token/',
        '/admin/',
    )

    def process_request(self, request):
        # Only check if the app is loaded (avoid import errors during startup)
        try:
            from operations.models import SystemSetting
            maintenance = SystemSetting.get('maintenance_mode', 'false')
        except Exception:
            return None

        if maintenance.lower() not in ('true', '1', 'yes'):
            return None

        # Allow exempt paths
        if any(request.path.startswith(prefix) for prefix in self.EXEMPT_PREFIXES):
            return None

        # Allow superusers through
        if hasattr(request, 'user') and request.user.is_authenticated and request.user.is_superuser:
            return None

        return JsonResponse(
            {
                'error': True,
                'detail': 'PIIcasso is currently under maintenance. Please try again later.',
                'code': 'maintenance_mode',
            },
            status=503,
        )


class SecurityLoggingMiddleware(MiddlewareMixin):
    """
    Enterprise security & audit logging middleware.
    - Logs all PII submissions (sanitised)
    - Logs auth attempts (success/failure)
    - Logs failed requests (4xx/5xx)
    - Detects automated scanning tools
    """

    SENSITIVE_FIELDS = frozenset([
        'password', 'token', 'secret', 'key', 'gov_id',
        'passport_id', 'bank_suffix', 'crypto_wallet',
    ])

    # Only flag actual attack tools, not legitimate HTTP clients
    SCANNER_SIGNATURES = frozenset([
        'sqlmap', 'nikto', 'burp', 'nessus', 'dirbuster',
        'gobuster', 'wfuzz', 'nuclei', 'masscan', 'zap',
    ])

    def process_request(self, request):
        request.start_time = time.time()

        # Cache body for later audit logging
        if request.method == 'POST' and hasattr(request, 'body'):
            try:
                request._cached_body = request.body
            except Exception:
                request._cached_body = None

        ip_address = self._get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown')

        if self._is_scanner(user_agent):
            logger.warning(
                f"[SCANNER] tool={user_agent!r} ip={ip_address} path={request.path}"
            )

        if self._has_path_traversal(request):
            logger.warning(
                f"[SUSPICIOUS] path_traversal ip={ip_address} path={request.path}"
            )

        request.security_context = {
            'ip_address': ip_address,
            'user_agent': user_agent,
            'path': request.path,
            'method': request.method,
        }

    def process_response(self, request, response):
        if not hasattr(request, 'start_time'):
            return response

        duration = time.time() - request.start_time
        request_id = getattr(request, 'request_id', '-')

        # Audit: PII submissions
        if request.path == '/api/submit/' and request.method == 'POST':
            self._log_pii_submission(request, response, duration, request_id)

        # Audit: auth attempts
        if request.path == '/api/token/' and request.method == 'POST':
            self._log_auth_attempt(request, response, duration, request_id)

        # Monitor: 4xx/5xx
        if response.status_code >= 400:
            self._log_failed_request(request, response, duration, request_id)

        return response

    # ── helpers ──────────────────────────────────────────────────────────────

    @staticmethod
    def _get_client_ip(request):
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        if xff:
            return xff.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'Unknown')

    def _is_scanner(self, user_agent):
        ua_lower = user_agent.lower()
        return any(sig in ua_lower for sig in self.SCANNER_SIGNATURES)

    @staticmethod
    def _has_path_traversal(request):
        """Detect directory-traversal and extension-probing attacks."""
        path = request.path.lower()
        query = request.META.get('QUERY_STRING', '').lower()

        if path.endswith(('.php', '.asp', '.jsp', '.cgi')):
            return True
        if any(p in query for p in ('union select', 'drop table', 'insert into', "' or ", '1=1')):
            return True
        return False

    def _log_pii_submission(self, request, response, duration, request_id):
        user = getattr(request, 'user', AnonymousUser())
        ip = request.security_context.get('ip_address', 'Unknown')

        log_data = {
            'event': 'pii_submission',
            'request_id': request_id,
            'user_id': user.id if user.is_authenticated else None,
            'ip': ip,
            'status': response.status_code,
            'duration_ms': round(duration * 1000),
        }

        if response.status_code == 201 and getattr(request, '_cached_body', None):
            try:
                body = json.loads(request._cached_body.decode('utf-8'))
                log_data['fields'] = [k for k, v in body.items() if v]
            except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
                pass

        logger.info(f"PII_SUBMIT: {json.dumps(log_data)}")

    def _log_auth_attempt(self, request, response, duration, request_id):
        username = 'Unknown'
        if getattr(request, '_cached_body', None):
            try:
                body = json.loads(request._cached_body.decode('utf-8'))
                username = body.get('username', 'Unknown')
            except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
                pass

        log_data = {
            'event': 'auth_attempt',
            'request_id': request_id,
            'username': username,
            'ip': request.security_context.get('ip_address', 'Unknown'),
            'status': response.status_code,
            'success': response.status_code == 200,
            'duration_ms': round(duration * 1000),
        }

        if response.status_code == 200:
            logger.info(f"AUTH_OK: {json.dumps(log_data)}")
        else:
            logger.warning(f"AUTH_FAIL: {json.dumps(log_data)}")

    def _log_failed_request(self, request, response, duration, request_id):
        log_data = {
            'event': 'failed_request',
            'request_id': request_id,
            'path': request.path,
            'method': request.method,
            'status': response.status_code,
            'ip': request.security_context.get('ip_address', 'Unknown'),
            'duration_ms': round(duration * 1000),
        }
        logger.warning(f"FAIL: {json.dumps(log_data)}")
