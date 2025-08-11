from functools import wraps
from django.core.cache import cache
from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework import status

def rate_limit(key_prefix, limit=100, period=3600):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(view_instance, request, *args, **kwargs):
            # Get client IP
            ip = request.META.get('HTTP_X_FORWARDED_FOR', '') or request.META.get('REMOTE_ADDR')
            
            # Create a unique key for this IP and endpoint
            cache_key = f"ratelimit:{key_prefix}:{ip}"
            
            # Get current count for this IP
            count = cache.get(cache_key, 0)
            
            if count >= limit:
                return Response(
                    {"error": "Rate limit exceeded. Please try again later."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            # Increment the counter
            cache.set(cache_key, count + 1, period)
            
            return view_func(view_instance, request, *args, **kwargs)
        return _wrapped_view
    return decorator
