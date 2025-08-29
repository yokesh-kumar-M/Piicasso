from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth import authenticate
from .models import EmailVerification, UserProfile

class UserRegistrationSerializer(serializers.Serializer):
    username = serializers.CharField(required=True, min_length=3, max_length=150)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True)
    
    def validate_username(self, value):
        """Validate username is unique and meets requirements"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        
        # Additional username validation
        if not value.replace('_', '').replace('.', '').replace('-', '').isalnum():
            raise serializers.ValidationError("Username can only contain letters, numbers, underscores, dots, and hyphens.")
        
        return value
    
    def validate_email(self, value):
        """Validate email is unique"""
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value.lower()
    
    def validate_password(self, value):
        """Validate password meets Django's password requirements"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def validate(self, attrs):
        """Validate password confirmation matches"""
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Password confirmation doesn't match."})
        return attrs

class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.UUIDField(required=True)
    
    def validate_token(self, value):
        """Validate the verification token exists and is valid"""
        try:
            verification = EmailVerification.objects.get(
                token=value,
                verification_type='email_verify'
            )
            
            if verification.is_used:
                raise serializers.ValidationError("This verification link has already been used.")
            
            if verification.is_expired:
                raise serializers.ValidationError("This verification link has expired. Please request a new one.")
            
            self.verification = verification
            return value
            
        except EmailVerification.DoesNotExist:
            raise serializers.ValidationError("Invalid verification token.")

class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """Validate email exists and is not already verified"""
        try:
            user = User.objects.get(email=value.lower())
            profile = UserProfile.get_or_create_profile(user)
            
            if profile.email_verified:
                raise serializers.ValidationError("This email address is already verified.")
            
            self.user = user
            return value.lower()
            
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found with this email address.")

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """Validate email exists"""
        try:
            user = User.objects.get(email=value.lower())
            profile = UserProfile.get_or_create_profile(user)
            
            if not profile.email_verified:
                raise serializers.ValidationError("Please verify your email address before requesting a password reset.")
            
            self.user = user
            return value.lower()
            
        except User.DoesNotExist:
            # For security, we don't reveal if email exists or not
            # But we still validate the format and store None
            self.user = None
            return value.lower()

class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.UUIDField(required=True)
    new_password = serializers.CharField(write_only=True, required=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True)
    
    def validate_token(self, value):
        """Validate the password reset token"""
        try:
            verification = EmailVerification.objects.get(
                token=value,
                verification_type='password_reset'
            )
            
            if verification.is_used:
                raise serializers.ValidationError("This password reset link has already been used.")
            
            if verification.is_expired:
                raise serializers.ValidationError("This password reset link has expired. Please request a new one.")
            
            self.verification = verification
            return value
            
        except EmailVerification.DoesNotExist:
            raise serializers.ValidationError("Invalid password reset token.")
    
    def validate_new_password(self, value):
        """Validate new password meets requirements"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def validate(self, attrs):
        """Validate password confirmation matches"""
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Password confirmation doesn't match."})
        return attrs

class CustomLoginSerializer(serializers.Serializer):
    """Custom login serializer that handles email verification check"""
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            # Try to authenticate
            user = authenticate(username=username, password=password)
            
            if not user:
                # Check if user exists but password is wrong
                try:
                    existing_user = User.objects.get(username=username)
                    raise serializers.ValidationError("Invalid password.")
                except User.DoesNotExist:
                    raise serializers.ValidationError("No account found with this username.")
            
            if not user.is_active:
                raise serializers.ValidationError("This account has been deactivated.")
            
            # Check email verification
            profile = UserProfile.get_or_create_profile(user)
            if not profile.email_verified:
                raise serializers.ValidationError({
                    "email_not_verified": True,
                    "message": "Please verify your email address before logging in.",
                    "email": user.email
                })
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError("Must include username and password.")

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile information"""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    date_joined = serializers.DateTimeField(source='user.date_joined', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['username', 'email', 'email_verified', 'email_verified_at', 'date_joined', 'created_at']
        read_only_fields = ['email_verified', 'email_verified_at', 'created_at']