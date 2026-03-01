# wordgen/middleware.py
import logging
import time
import json
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser
from django.http import JsonResponse
from django.core.cache import cache

logger = logging.getLogger('wordgen.security')

class PolicyViolationMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if hasattr(request, 'user') and request.user.is_authenticated and not request.user.is_active:
            # Allow auth endpoints (token generation, refresh)
            if request.path.startswith('/api/token/') or request.path.startswith('/api/auth/'):
                return None
            
            # Allow message endpoints (so they can use INBOX)
            if request.path.startswith('/api/messages/'):
                return None
                
            return JsonResponse({'detail': 'You have violeted the policy of website', 'code': 'user_inactive'}, status=403)

class SecurityLoggingMiddleware(MiddlewareMixin):
    """Enhanced security and audit logging middleware."""
    
    SENSITIVE_FIELDS = [
        'password', 'token', 'secret', 'key', 'gov_id', 
        'passport_id', 'bank_suffix', 'crypto_wallet'
    ]
    
    def process_request(self, request):
        """Log incoming requests with security context."""
        request.start_time = time.time()
        
        # Store request body early before it's consumed
        if request.method == 'POST' and hasattr(request, 'body'):
            try:
                # Store the raw body data before it gets consumed
                request._cached_body = request.body
            except Exception:
                request._cached_body = None
        
        # Get client information
        ip_address = self.get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown')
        
        # Log suspicious patterns
        if self.is_suspicious_request(request, ip_address, user_agent):
            logger.warning(
                f"Suspicious request detected: IP={ip_address}, "
                f"User-Agent={user_agent}, Path={request.path}"
            )
        
        # Rate limiting check (simplified)
        if self.check_rate_limit(request, ip_address):
            logger.warning(f"Rate limit exceeded for IP: {ip_address}")
            return JsonResponse(
                {"error": "Rate limit exceeded"}, 
                status=429
            )
        
        # Store request info for response processing
        request.security_context = {
            'ip_address': ip_address,
            'user_agent': user_agent,
            'path': request.path,
            'method': request.method,
        }
    
    def process_response(self, request, response):
        """Log response with security metrics."""
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            
            # Log PII submission attempts
            if request.path == '/api/submit-pii/' and request.method == 'POST':
                self.log_pii_submission(request, response, duration)
            
            # Log authentication attempts
            if request.path == '/api/token/' and request.method == 'POST':
                self.log_auth_attempt(request, response, duration)
            
            # Log failed requests
            if response.status_code >= 400:
                self.log_failed_request(request, response, duration)
        
        return response
    
    def get_client_ip(self, request):
        """Get the real client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'Unknown')
        return ip
    
    def is_suspicious_request(self, request, ip_address, user_agent):
        """Detect suspicious request patterns."""
        suspicious_patterns = [
            'sqlmap', 'nikto', 'burp', 'nessus', 'nmap',
            'python-requests', 'curl', 'wget'
        ]
        
        # Check user agent
        user_agent_lower = user_agent.lower()
        if any(pattern in user_agent_lower for pattern in suspicious_patterns):
            return True
        
        # Check for unusual request patterns
        if request.path.endswith(('.php', '.asp', '.jsp')):
            return True
        
        # Check for SQL injection patterns in query params
        query_string = request.META.get('QUERY_STRING', '').lower()
        sql_patterns = ['union select', 'drop table', 'insert into', '--', ';']
        if any(pattern in query_string for pattern in sql_patterns):
            return True
        
        return False
    
    def check_rate_limit(self, request, ip_address):
        """Enhanced rate limiting with IP-based tracking."""
        cache_key = f"rate_limit:{ip_address}:{request.path}"
        requests_count = cache.get(cache_key, 0)
        
        # Different limits for different endpoints
        limits = {
            '/api/submit-pii/': 50,  # 50 per hour
            '/api/token/': 20,       # 20 per hour
            '/api/register/': 10,    # 10 per hour
        }
        
        limit = limits.get(request.path, 100)  # Default 100 per hour
        
        if requests_count >= limit:
            return True
        
        # Increment counter
        cache.set(cache_key, requests_count + 1, 3600)  # 1 hour timeout
        return False
    
    def log_pii_submission(self, request, response, duration):
        """Log PII submission attempts with sanitized data."""
        user = getattr(request, 'user', AnonymousUser())
        
        log_data = {
            'event': 'pii_submission',
            'user_id': user.id if user.is_authenticated else None,
            'ip_address': getattr(request, 'security_context', {}).get('ip_address', 'Unknown'),
            'status_code': response.status_code,
            'duration': round(duration, 3),
        }
        
        # Try to get request data safely
        if response.status_code == 201 and hasattr(request, '_cached_body') and request._cached_body:
            try:
                request_data = json.loads(request._cached_body.decode('utf-8'))
                sanitized_data = self.sanitize_pii_data(request_data)
                log_data['fields_submitted'] = list(sanitized_data.keys())
            except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
                pass
        
        logger.info(f"PII submission: {json.dumps(log_data)}")
    
    def log_auth_attempt(self, request, response, duration):
        """Log authentication attempts."""
        username = 'Unknown'
        if hasattr(request, '_cached_body') and request._cached_body:
            try:
                request_data = json.loads(request._cached_body.decode('utf-8'))
                username = request_data.get('username', 'Unknown')
            except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
                pass
        
        log_data = {
            'event': 'auth_attempt',
            'username': username,
            'ip_address': getattr(request, 'security_context', {}).get('ip_address', 'Unknown'),
            'status_code': response.status_code,
            'duration': round(duration, 3),
            'success': response.status_code == 200,
        }
        
        if response.status_code != 200:
            logger.warning(f"Failed auth attempt: {json.dumps(log_data)}")
        else:
            logger.info(f"Successful auth: {json.dumps(log_data)}")
    
    def log_failed_request(self, request, response, duration):
        """Log failed requests for monitoring."""
        log_data = {
            'event': 'failed_request',
            'path': request.path,
            'method': request.method,
            'status_code': response.status_code,
            'ip_address': getattr(request, 'security_context', {}).get('ip_address', 'Unknown'),
            'user_agent': getattr(request, 'security_context', {}).get('user_agent', 'Unknown'),
            'duration': round(duration, 3),
        }
        
        logger.warning(f"Failed request: {json.dumps(log_data)}")
    
    def sanitize_pii_data(self, data):
        """Remove sensitive values from PII data for logging."""
        sanitized = {}
        for key, value in data.items():
            if key.lower() in self.SENSITIVE_FIELDS:
                sanitized[key] = '[REDACTED]' if value else None
            else:
                sanitized[key] = value if value else None
        return sanitized