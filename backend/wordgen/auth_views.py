from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        token['is_superuser'] = user.is_superuser
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['username'] = self.user.username
        data['is_superuser'] = self.user.is_superuser
        
        # Log real login activity
        UserActivity.objects.create(
            activity_type='LOGIN',
            description=f"Operator {self.user.username} authenticated.",
            city="Secure Node"
        )
        
        return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

from visualization.models import UserActivity

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
import requests
import random
import string

User = get_user_model()

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
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
                
                user = User.objects.create(
                    username=username,
                    email=email,
                    first_name=name.split()[0] if name else '',
                    last_name=' '.join(name.split()[1:]) if name and len(name.split()) > 1 else ''
                )
                user.set_unusable_password()
                user.save()
            
            # Generate Tokens
            refresh = RefreshToken.for_user(user)
            
            # Log real Google login activity
            UserActivity.objects.create(
                activity_type='LOGIN',
                description=f"Operator {user.username} authenticated via Google.",
                city="Global Hub"
            )
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'username': user.username,
                'is_superuser': user.is_superuser
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
