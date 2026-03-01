from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache
import requests
import random
import string
from analytics.models import UserActivity

User = get_user_model()

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        # Bulletproof auto-upgrade intercepts right before token payload is encrypted
        if user.username == "Yokesh-superuser" and not user.is_superuser:
            user.is_superuser = True
            user.is_staff = True
            user.save()

        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        token['is_superuser'] = user.is_superuser
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Log real login activity

        data['username'] = self.user.username
        data['is_superuser'] = self.user.is_superuser
        
        lat = self.initial_data.get('lat') if hasattr(self, 'initial_data') else None
        lng = self.initial_data.get('lng') if hasattr(self, 'initial_data') else None

        # Log real login activity
        UserActivity.objects.create(
            activity_type='LOGIN',
            description=f"Operator {self.user.username} authenticated.",
            city="Secure Node",
            latitude=float(lat) if lat is not None else 999.0,
            longitude=float(lng) if lng is not None else 999.0
        )
        
        return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        lat = request.data.get('lat')
        lng = request.data.get('lng')
        
        if not token:
            return Response({'error': 'No token provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verify token with Google
            res = requests.get(f'https://oauth2.googleapis.com/tokeninfo?id_token={token}')
            
            if res.status_code != 200:
                return Response({'error': 'Invalid Google token', 'details': res.json()}, status=status.HTTP_400_BAD_REQUEST)
            
            payload = res.json()
            email = payload.get('email')
            name = payload.get('name', '')
            
            if not email:
                return Response({'error': 'Email not found in token'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user exists
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Create user
                username = email.split('@')[0]
                # Ensure username uniqueness
                while User.objects.filter(username=username).exists():
                    username = f"{username}{random.randint(100, 999)}"
                
                # Split name properly
                first_name = ''
                last_name = ''
                if name:
                    parts = name.split()
                    first_name = parts[0]
                    if len(parts) > 1:
                        last_name = ' '.join(parts[1:])

                user = User.objects.create(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name
                )
                user.set_unusable_password()
                user.save()
            
            # Auto-upgrade for Google SSO
            if user.username == "Yokesh-superuser" and not user.is_superuser:
                user.is_superuser = True
                user.is_staff = True
                user.save()
                
            # Generate Tokens
            refresh = RefreshToken.for_user(user)
            
            # Log real Google login activity
            UserActivity.objects.create(
                activity_type='LOGIN',
                description=f"Operator {user.username} authenticated via Google.",
                city="Global Hub",
                latitude=float(lat) if lat is not None else 999.0,
                longitude=float(lng) if lng is not None else 999.0
            )
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'username': user.username,
                'is_superuser': user.is_superuser
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RequestPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
            if not user.has_usable_password():
                return Response({"error": "This account is authenticated externally (e.g. Google). Password reset not available."}, status=status.HTTP_400_BAD_REQUEST)
                
            # Generate 6 digit OTP
            otp = ''.join(random.choices(string.digits, k=6))
            
            # Store in cache for 10 minutes (600 seconds)
            cache.set(f"pwd_reset_otp_{email}", otp, timeout=600)
            
            # Send Email
            send_mail(
                subject='PIIcasso - System Recovery Authorization',
                message=f'Operator {user.username},\n\nA password reset was requested for your account.\n\nYour Authorization Code: {otp}\n\nThis code will self-destruct in 10 minutes.\nIf you did not request this, ignore this transmission.',
                from_email=settings.DEFAULT_FROM_EMAIL or 'noreply@piicasso.com',
                recipient_list=[email],
                fail_silently=False,
            )
            
            return Response({"message": "If an account exists, a recovery code has been sent."}, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # Mask existence of user
            return Response({"message": "If an account exists, a recovery code has been sent."}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"SMTP Error: {e}")
            return Response({"error": "Failed to transmit recovery code. Check SMTP logs."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyResetOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')
        
        if not all([email, otp, new_password]):
            return Response({"error": "Missing required fields (email, otp, new_password)."}, status=status.HTTP_400_BAD_REQUEST)
            
        stored_otp = cache.get(f"pwd_reset_otp_{email}")
        
        if not stored_otp or stored_otp != otp:
            return Response({"error": "Invalid or expired authorization code."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            
            # Invalidate OTP
            cache.delete(f"pwd_reset_otp_{email}")
            
            # Log security event
            UserActivity.objects.create(
                activity_type='CONFIG',
                description=f"Operator {user.username} executed system password recovery.",
                city="Security Center",
                latitude=999.0,
                longitude=999.0
            )
            
            return Response({"message": "Password successfully reset."}, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({"error": "User no longer exists."}, status=status.HTTP_404_NOT_FOUND)
