# wordgen/views_enhanced.py
import os
import csv
import json
import logging
from io import StringIO
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from django.contrib.auth.models import User
from django.http import HttpResponse
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication

from .llm_handler import build_prompt, call_gemini_api
from generator.models import GenerationHistory
from .serializers import Piiserializer
from .decorators import enhanced_rate_limit

logger = logging.getLogger('wordgen.api')

class PIIValidationError(Exception):
    """Custom exception for PII validation errors."""
    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message
        super().__init__(message)

class EnhancedPIIValidator:
    """Enhanced PII data validation with detailed error messages."""
    
    @staticmethod
    def validate_birth_year(year: str) -> Optional[str]:
        try:
            year_int = int(year)
            current_year = datetime.now().year
            if not (1900 <= year_int <= current_year):
                return f"Birth year must be between 1900 and {current_year}"
        except ValueError:
            return "Birth year must be a valid number"
        return None
    
    @staticmethod
    def validate_phone_suffix(suffix: str) -> Optional[str]:
        if not suffix.isdigit():
            return "Phone suffix must contain only digits"
        if not (3 <= len(suffix) <= 4):
            return "Phone suffix must be 3-4 digits long"
        return None
    
    @staticmethod
    def validate_list_field(field_value: str, field_name: str) -> Optional[str]:
        """Validate comma-separated list fields."""
        if not field_value:
            return None
        
        items = [item.strip() for item in field_value.split(',')]
        if len(items) > 10:
            return f"{field_name} can have maximum 10 items"
        
        if any(len(item) > 50 for item in items):
            return f"Each {field_name} item must be under 50 characters"
        
        return None
    
    @classmethod
    def validate_pii_data(cls, data: Dict[str, Any]) -> Dict[str, str]:
        """Comprehensive PII data validation."""
        errors = {}
        
        validators = {
            'birth_year': cls.validate_birth_year,
            'phone_suffix': cls.validate_phone_suffix,
        }
        
        list_fields = ['pet_names', 'favourite_movies', 'close_contacts']
        
        # Run field-specific validators
        for field, validator in validators.items():
            if field in data and data[field]:
                error = validator(data[field])
                if error:
                    errors[field] = error
        
        # Validate list fields
        for field in list_fields:
            if field in data and data[field]:
                error = cls.validate_list_field(data[field], field.replace('_', ' '))
                if error:
                    errors[field] = error
        
        return errors

class EnhancedRegisterView(APIView):
    """Enhanced user registration with better validation and logging."""
    permission_classes = [AllowAny]

    @rate_limit(key_prefix='register', limit=5, period=3600)
    def post(self, request):
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        # Enhanced validation
        errors = {}
        
        if not username or len(username) < 3:
            errors['username'] = 'Username must be at least 3 characters long'
        elif len(username) > 30:
            errors['username'] = 'Username must be under 30 characters'
        elif not username.isalnum():
            errors['username'] = 'Username can only contain letters and numbers'
        
        if not email:
            errors['email'] = 'Email is required'
        elif '@' not in email or '.' not in email.split('@')[-1]:
            errors['email'] = 'Please enter a valid email address'
        
        if not password:
            errors['password'] = 'Password is required'
        elif len(password) < 8:
            errors['password'] = 'Password must be at least 8 characters long'
        
        # Check existing users
        if not errors.get('username') and User.objects.filter(username=username).exists():
            errors['username'] = 'Username already exists'
        
        if not errors.get('email') and email and User.objects.filter(email=email).exists():
            errors['email'] = 'Email already registered'
        
        if errors:
            return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=username, 
                    email=email, 
                    password=password
                )
            
            logger.info(f"New user registered: {username} ({email})")
            return Response({
                'message': 'Account created successfully',
                'user_id': user.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"User registration failed: {str(e)}")
            return Response({
                'error': 'Registration failed. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EnhancedPiiSubmitView(APIView):
    """Enhanced PII submission with comprehensive validation and caching."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_client_ip(self, request):
        """Get the real client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'Unknown')
        return ip

    @rate_limit(key_prefix='pii_submit', limit=10, period=3600)
    def post(self, request):
        """Process PII data and generate wordlist with enhanced error handling."""
        
        # Validate request data
        serializer = Piiserializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid data format',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        pii_data = serializer.validated_data
        
        # Enhanced PII validation
        validation_errors = EnhancedPIIValidator.validate_pii_data(pii_data)
        if validation_errors:
            return Response({
                'error': 'Validation failed',
                'field_errors': validation_errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if any meaningful data provided
        non_empty_values = [v for v in pii_data.values() if v and v != '' and v != []]
        if not non_empty_values:
            return Response({
                'error': 'Please provide at least one piece of information',
                'suggestion': 'Fill in fields like name, birth year, or pet names for better results'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check API configuration
        if not os.environ.get("GEMINI_API_KEY"):
            logger.error("Gemini API key not configured")
            return Response({
                'error': 'Service temporarily unavailable',
                'message': 'Please try again later'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Check cache for similar requests (optional optimization)
        cache_key = f"wordlist:{hash(str(sorted(pii_data.items())))}"
        cached_result = cache.get(cache_key)
        if cached_result:
            logger.info("Returning cached wordlist result")
            return Response(cached_result, status=status.HTTP_200_OK)

        try:
            # Generate wordlist
            prompt = build_prompt(pii_data)
            wordlist_raw = call_gemini_api(prompt, pii_data=pii_data)

            # Process and validate wordlist
            wordlist = [line.strip() for line in wordlist_raw.splitlines() if line.strip()]
            
            if not wordlist:
                logger.warning("No passwords generated from PII data")
                return Response({
                    'error': 'Unable to generate passwords from provided data',
                    'suggestion': 'Try providing more specific information like names or dates'
                }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

            # Limit wordlist size
            max_size = int(os.getenv('MAX_WORDLIST_SIZE', '1000'))
            if len(wordlist) > max_size:
                wordlist = wordlist[:max_size]
                logger.info(f"Wordlist truncated to {max_size} items")

            # Save to database with error handling
            try:
                with transaction.atomic():
                    record = GenerationHistory.objects.create(
                        user=request.user,
                        pii_data=pii_data,
                        wordlist=wordlist,
                        ip_address=self.get_client_ip(request)
                    )
                
                logger.info(f"Wordlist generated successfully: {len(wordlist)} passwords for user {request.user.username}")
                
                result = {
                    'wordlist': wordlist,
                    'id': record.id,
                    'count': len(wordlist),
                    'generated_at': record.timestamp.isoformat()
                }
                
                # Cache the result (expire in 1 hour)
                cache.set(cache_key, result, 3600)
                
                return Response(result, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                logger.error(f"Database save failed: {str(e)}")
                # Still return the wordlist even if saving fails
                return Response({
                    'wordlist': wordlist,
                    'count': len(wordlist),
                    'warning': 'Generated successfully but not saved to history'
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Wordlist generation failed: {str(e)}")
            
            # Provide helpful error messages based on error type
            if "api key" in str(e).lower():
                error_msg = "API service unavailable"
            elif "timeout" in str(e).lower():
                error_msg = "Request timed out. Please try again with less data."
            else:
                error_msg = "Generation failed. Please check your input and try again."
            
            return Response({
                'error': error_msg,
                'type': 'generation_error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EnhancedHistoryView(APIView):
    """Enhanced history view with filtering and search."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    @rate_limit(key_prefix='history_view', limit=100, period=3600)
    def get(self, request):
        """Get user's generation history with enhanced filtering."""
        try:
            # Parse query parameters
            page = max(1, int(request.query_params.get('page', 1)))
            page_size = min(50, max(1, int(request.query_params.get('page_size', 10))))
            search = request.query_params.get('search', '').strip()
            
            # Date filtering
            date_from = request.query_params.get('date_from')
            date_to = request.query_params.get('date_to')
            
            # Base queryset
            qs = GenerationHistory.objects.filter(user=request.user).order_by('-timestamp')
            
            # Apply filters
            if search:
                # Search in PII data (basic text search)
                qs = qs.filter(pii_data__icontains=search)
            
            if date_from:
                try:
                    date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                    qs = qs.filter(timestamp__gte=date_from_obj)
                except ValueError:
                    pass
            
            if date_to:
                try:
                    date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                    qs = qs.filter(timestamp__lte=date_to_obj)
                except ValueError:
                    pass
            
            # Pagination
            total = qs.count()
            start = (page - 1) * page_size
            end = start + page_size
            entries = qs[start:end]
            
            # Serialize data
            data = {
                'results': [{
                    "id": h.id,
                    "timestamp": h.timestamp,
                    "pii_data": h.pii_data,
                    "wordlist_count": len(h.wordlist) if h.wordlist else 0,
                    "wordlist_preview": (h.wordlist or [])[:5],  # First 5 words
                    "ip_address": h.ip_address
                } for h in entries],
                'pagination': {
                    'total': total,
                    'page': page,
                    'page_size': page_size,
                    'total_pages': (total + page_size - 1) // page_size,
                    'has_next': end < total,
                    'has_previous': page > 1
                },
                'filters': {
                    'search': search,
                    'date_from': date_from,
                    'date_to': date_to
                }
            }
            
            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"History retrieval failed: {str(e)}")
            return Response({
                'error': 'Failed to retrieve history'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def enhanced_delete_history_entry(request, id):
    """Enhanced history entry deletion with ownership check."""
    try:
        # Ensure user owns the record
        record = GenerationHistory.objects.get(id=id, user=request.user)
        
        # Log deletion for audit
        logger.info(f"User {request.user.username} deleted history entry {id}")
        
        record.delete()
        return Response({
            'message': 'Entry deleted successfully',
            'deleted_id': id
        }, status=status.HTTP_200_OK)
        
    except GenerationHistory.DoesNotExist:
        return Response({
            'error': 'Entry not found or access denied'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"History deletion failed: {str(e)}")
        return Response({
            'error': 'Deletion failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def enhanced_download_wordlist(request, id):
    """Enhanced wordlist download with metadata."""
    try:
        record = GenerationHistory.objects.get(id=id, user=request.user)
        
        if not record.wordlist:
            return Response({
                'error': 'No wordlist found for this entry'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Create enhanced text content
        header = f"# PIIcasso Wordlist\n# Generated: {record.timestamp}\n# Count: {len(record.wordlist)}\n# Entry ID: {id}\n\n"
        content = header + "\n".join(record.wordlist)
        
        # Log download
        logger.info(f"User {request.user.username} downloaded wordlist {id}")
        
        response = HttpResponse(content, content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename="piicasso_wordlist_{id}.txt"'
        response['Content-Length'] = len(content)
        
        return response
        
    except GenerationHistory.DoesNotExist:
        return Response({
            'error': 'Wordlist not found or access denied'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Download failed: {str(e)}")
        return Response({
            'error': 'Download failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)