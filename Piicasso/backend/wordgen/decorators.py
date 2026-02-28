import time
from functools import wraps
from django.core.cache import cache
from django.http import JsonResponse

def enhanced_rate_limit(key_prefix, limit=100, period=3600, message=None):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(view_instance, request, *args, **kwargs):
            # Get client IP with better detection
            ip = get_client_ip(request)
            cache_key = f"ratelimit:{key_prefix}:{ip}"
            
            # Get current count
            current = cache.get(cache_key, {'count': 0, 'reset_time': time.time() + period})
            
            # Reset if expired
            if time.time() > current['reset_time']:
                current = {'count': 0, 'reset_time': time.time() + period}
            
            if current['count'] >= limit:
                return JsonResponse({
                    'error': message or 'Rate limit exceeded',
                    'retry_after': int(current['reset_time'] - time.time()),
                    'limit': limit,
                    'period': period
                }, status=429)
            
            # Increment counter
            current['count'] += 1
            cache.set(cache_key, current, period)
            
            return view_func(view_instance, request, *args, **kwargs)
        return _wrapped_view
    return decorator

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'unknown')