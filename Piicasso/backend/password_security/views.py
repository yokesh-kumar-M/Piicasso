import hashlib
import re
import os
import json
import logging
from datetime import datetime

from django.contrib.auth import get_user_model
from django.conf import settings

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication

logger = logging.getLogger('password_security')

User = get_user_model()

COMMON_PASSWORDS = {
    'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
    'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
    'ashley', 'bailey', 'shadow', '123123', '654321', 'superman', 'qazwsx',
    'michael', 'football', 'password1', 'password123', 'welcome', 'welcome1',
    'admin', 'login', 'starwars', 'hello', 'charlie', 'donald', 'password2',
}

KEYBOARD_PATTERNS = {
    'qwerty', 'qwertyuiop', 'asdf', 'asdfghjkl', 'zxcv', 'zxcvbnm',
    '12345', '1234567890', '0987654321', 'qazwsx', 'wsxedc', 'edcrfv',
    '!@#$%', '!@#$%^&*', 'poiuyt', 'lkjhgf', 'mnbvcx',
}


def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


def calculate_entropy(password):
    if not password:
        return 0
    
    charset_size = 0
    if any(c.islower() for c in password):
        charset_size += 26
    if any(c.isupper() for c in password):
        charset_size += 26
    if any(c.isdigit() for c in password):
        charset_size += 10
    if any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password):
        charset_size += 32
    
    if charset_size == 0:
        return 0
    
    entropy = len(password) * (charset_size ** 0.5)
    return min(entropy, 128)


def estimate_crack_time(entropy, has_personal_info=False):
    guesses_per_second = 10000000000
    
    if has_personal_info:
        entropy = max(entropy - 20, 8)
    
    combinations = 2 ** entropy
    seconds = combinations / guesses_per_second
    
    if seconds < 1:
        return "Instant"
    elif seconds < 60:
        return f"{int(seconds)} seconds"
    elif seconds < 3600:
        return f"{int(seconds / 60)} minutes"
    elif seconds < 86400:
        return f"{int(seconds / 3600)} hours"
    elif seconds < 31536000:
        return f"{int(seconds / 86400)} days"
    elif seconds < 31536000 * 100:
        return f"{int(seconds / 31536000)} years"
    elif seconds < 31536000 * 1000000:
        return f"{int(seconds / 31536000 / 1000)} thousand years"
    else:
        return "Centuries"


def analyze_password_strength(password, pii_data=None):
    score = 0
    vulnerabilities = []
    recommendations = []
    
    if not password:
        return {
            'score': 0,
            'vulnerabilities': ['No password provided'],
            'recommendations': ['Enter a password to analyze'],
            'crack_time': 'Instant',
            'level': 'critical'
        }
    
    pii_data = pii_data or {}
    pii_values = []
    for key, value in pii_data.items():
        if value and isinstance(value, str) and len(value) > 2:
            pii_values.append(value.lower())
    
    password_lower = password.lower()
    
    if len(password) >= 16:
        score += 25
    elif len(password) >= 12:
        score += 20
    elif len(password) >= 8:
        score += 10
    elif len(password) >= 6:
        score += 5
    else:
        vulnerabilities.append("Password is too short (less than 6 characters)")
        recommendations.append("Use at least 12 characters")
    
    if len(password) > 20:
        score += 10
    
    has_lower = any(c.islower() for c in password)
    has_upper = any(c.isupper() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?/' for c in password)
    
    char_types = sum([has_lower, has_upper, has_digit, has_special])
    if char_types >= 4:
        score += 25
    elif char_types >= 3:
        score += 15
    elif char_types >= 2:
        score += 5
    else:
        vulnerabilities.append("Password lacks character variety")
        recommendations.append("Mix uppercase, lowercase, numbers, and symbols")
    
    if has_digit and has_special:
        score += 10
    
    common_check = password_lower.replace('0', 'o').replace('1', 'i').replace('3', 'e').replace('4', 'a')
    if any(common in COMMON_PASSWORDS or COMMON_PASSWORDS.intersection(common_check.split()) for common in [password_lower, common_check]):
        score = max(score - 50, 5)
        vulnerabilities.append("Password is in common password lists")
        recommendations.append("Avoid common passwords")
    
    has_personal = False
    for pii_value in pii_values:
        if len(pii_value) >= 4 and pii_value in password_lower:
            score = max(score - 30, 5)
            vulnerabilities.append(f"Contains personal information: {pii_value[:10]}...")
            recommendations.append("Avoid using personal information in passwords")
            has_personal = True
            break
    
    for pattern in KEYBOARD_PATTERNS:
        if pattern in password_lower or pattern[::-1] in password_lower:
            score = max(score - 25, 5)
            vulnerabilities.append("Contains keyboard pattern")
            recommendations.append("Avoid keyboard patterns like qwerty")
            break
    
    year_match = re.search(r'(19|20)\d{2}', password)
    if year_match:
        year = year_match.group()
        if pii_data.get('dob'):
            dob_year = re.search(r'(19|20)\d{2}', str(pii_data['dob']))
            if dob_year and dob_year.group() == year:
                score = max(score - 20, 5)
                vulnerabilities.append("Contains birth year")
    
    repeated = re.search(r'(.)\1{2,}', password)
    if repeated:
        score = max(score - 10, 0)
        vulnerabilities.append("Contains repeated characters")
    
    if not has_digit and not has_special:
        recommendations.append("Add numbers and special characters")
    
    if len(password) < 12:
        recommendations.append("Use at least 12 characters")
    
    entropy = calculate_entropy(password)
    crack_time = estimate_crack_time(entropy, has_personal)
    
    score = max(0, min(100, score))
    
    if score >= 75:
        level = 'low'
    elif score >= 50:
        level = 'medium'
    elif score >= 25:
        level = 'high'
    else:
        level = 'critical'
    
    return {
        'score': score,
        'vulnerabilities': vulnerabilities[:5],
        'recommendations': list(set(recommendations))[:5],
        'crack_time': crack_time,
        'level': level,
        'entropy': entropy
    }


def get_breach_cache_key(password):
    sha1_hash = hashlib.sha1(password.encode()).hexdigest().upper()
    return f"breach_check:{sha1_hash}"


def get_cached_breach_count(password):
    try:
        from django.core.cache import cache
        cache_key = get_breach_cache_key(password)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
    except Exception:
        pass
    return None


def set_cached_breach_count(password, count):
    try:
        from django.core.cache import cache
        cache_key = get_breach_cache_key(password)
        cache.set(cache_key, count, 86400)
    except Exception:
        pass


def check_breach_count(password):
    cached_count = get_cached_breach_count(password)
    if cached_count is not None:
        return cached_count
    
    try:
        sha1_hash = hashlib.sha1(password.encode()).hexdigest().upper()
        prefix = sha1_hash[:5]
        suffix = sha1_hash[5:]
        
        hibp_api_key = os.environ.get('HAVEIBEENPWNED_API_KEY', '')
        
        import urllib.request
        url = f'https://api.pwnedpasswords.com/range/{prefix}'
        
        if hibp_api_key:
            req = urllib.request.Request(url, headers={'hibp-api-key': hibp_api_key})
        else:
            req = urllib.request.Request(url)
        
        with urllib.request.urlopen(req, timeout=10) as response:
            data = response.read().decode('utf-8')
        
        count = 0
        for line in data.split('\n'):
            hash_suffix, cnt = line.strip().split(':')
            if hash_suffix == suffix:
                count = int(cnt)
                break
        
        set_cached_breach_count(password, count)
        return count
        
    except Exception as e:
        logger.warning(f"Breach check failed: {e}")
        return -1


class PasswordAnalyzeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get_client_ip(self, request):
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        if xff:
            ip = xff.split(',')[0].strip()
            if ip and len(ip) <= 45:
                return ip
        return request.META.get('REMOTE_ADDR')
    
    def post(self, request):
        password = request.data.get('password', '')
        pii_data = request.data.get('pii_data', {})
        
        if not password:
            return Response(
                {'error': 'Password is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        analysis_result = analyze_password_strength(password, pii_data)
        
        breach_count = check_breach_count(password)
        if breach_count >= 0:
            analysis_result['breach_count'] = breach_count
            
            if breach_count > 0:
                analysis_result['vulnerabilities'].append(f"Found in {breach_count} data breaches")
                analysis_result['recommendations'].append("Change this password immediately - it's been exposed in breaches")
                analysis_result['level'] = 'critical'
                analysis_result['score'] = max(analysis_result['score'], 10)
        else:
            analysis_result['breach_count'] = 0
        
        try:
            from .models import PasswordAnalysis, PasswordAuditLog
            analysis = PasswordAnalysis.objects.create(
                user=request.user,
                pii_data=pii_data,
                password_hash=hash_password(password),
                vulnerability_level=analysis_result['level'],
                strength_score=analysis_result['score'],
                crack_time_estimate=analysis_result['crack_time'],
                breach_count=analysis_result.get('breach_count', 0),
                recommendations=analysis_result['recommendations'],
                vulnerabilities_found=analysis_result['vulnerabilities']
            )
            analysis_result['id'] = analysis.id
            analysis_result['created_at'] = analysis.created_at.isoformat()
            
            PasswordAuditLog.objects.create(
                user=request.user,
                action='analyze',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                details={
                    'analysis_id': analysis.id,
                    'vulnerability_level': analysis_result['level'],
                    'strength_score': analysis_result['score'],
                    'breach_count': analysis_result.get('breach_count', 0),
                }
            )
        except Exception as e:
            logger.error(f"Failed to save analysis: {e}")
        
        return Response(analysis_result, status=status.HTTP_200_OK)


class PasswordAnalysisHistoryView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            from .models import PasswordAnalysis
            analyses = PasswordAnalysis.objects.filter(
                user=request.user
            ).order_by('-created_at')[:50]
            
            results = []
            for a in analyses:
                results.append({
                    'id': a.id,
                    'vulnerability_level': a.vulnerability_level,
                    'strength_score': a.strength_score,
                    'crack_time_estimate': a.crack_time_estimate,
                    'breach_count': a.breach_count,
                    'vulnerabilities_count': len(a.vulnerabilities_found),
                    'created_at': a.created_at.isoformat()
                })
            
            return Response({'analyses': results}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Failed to fetch history: {e}")
            return Response({'error': 'Failed to fetch history'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserPreferencesView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            from .models import UserPreference
            pref, created = UserPreference.objects.get_or_create(user=request.user)
            return Response({
                'default_mode': pref.default_mode,
                'last_mode': pref.last_mode,
                'updated_at': pref.updated_at.isoformat()
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Failed to get preferences: {e}")
            return Response({'error': 'Failed to get preferences'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request):
        try:
            from .models import UserPreference
            default_mode = request.data.get('default_mode', 'user')
            last_mode = request.data.get('last_mode', 'user')
            
            if default_mode not in ['user', 'security']:
                return Response({'error': 'Invalid mode'}, status=status.HTTP_400_BAD_REQUEST)
            if last_mode not in ['user', 'security']:
                return Response({'error': 'Invalid mode'}, status=status.HTTP_400_BAD_REQUEST)
            
            pref, created = UserPreference.objects.get_or_create(user=request.user)
            pref.default_mode = default_mode
            pref.last_mode = last_mode
            pref.save()
            
            return Response({
                'message': 'Preferences updated',
                'default_mode': pref.default_mode,
                'last_mode': pref.last_mode
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Failed to update preferences: {e}")
            return Response({'error': 'Failed to update preferences'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def check_password_breach(request):
    password = request.data.get('password', '')
    
    if not password:
        return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    breach_count = check_breach_count(password)
    
    if breach_count >= 0:
        return Response({
            'breached': breach_count > 0,
            'count': breach_count
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'breached': None,
            'count': None,
            'message': 'Breach check unavailable'
        }, status=status.HTTP_200_OK)
