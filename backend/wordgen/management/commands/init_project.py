# backend/wordgen/management/commands/init_project.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import connection
from wordgen.models import UserProfile, EmailVerification, GenerationHistory
import json


class Command(BaseCommand):
    help = 'Initialize PIIcasso project with test data and configuration'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-superuser',
            action='store_true',
            help='Skip superuser creation',
        )
        parser.add_argument(
            '--create-test-data',
            action='store_true',
            help='Create test users and data',
        )
        parser.add_argument(
            '--admin-username',
            type=str,
            default='admin',
            help='Admin username (default: admin)',
        )
        parser.add_argument(
            '--admin-email',
            type=str,
            default='admin@piicasso.com',
            help='Admin email (default: admin@piicasso.com)',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Initializing PIIcasso Project')
        )
        self.stdout.write('=' * 50)

        # Check database connection
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            self.stdout.write(
                self.style.SUCCESS('Database connection: OK')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Database connection failed: {e}')
            )
            return

        # Check if tables exist
        table_names = connection.introspection.table_names()
        required_tables = ['wordgen_userprofile', 'wordgen_emailverification', 'auth_user']
        
        missing_tables = [table for table in required_tables if table not in table_names]
        if missing_tables:
            self.stdout.write(
                self.style.WARNING(f'Missing tables: {missing_tables}')
            )
            self.stdout.write(
                self.style.WARNING('Run: python manage.py migrate')
            )
            return

        self.stdout.write(
            self.style.SUCCESS('Database tables: OK')
        )

        # Create superuser
        if not options['skip_superuser']:
            self.create_superuser(
                options['admin_username'],
                options['admin_email']
            )

        # Create test data
        if options['create_test_data']:
            self.create_test_data()

        # Display summary
        self.display_summary()

    def create_superuser(self, username, email):
        """Create superuser if it doesn't exist"""
        try:
            if User.objects.filter(username=username).exists():
                self.stdout.write(
                    self.style.WARNING(f'Superuser {username} already exists')
                )
                return

            # Create superuser
            admin_user = User.objects.create_superuser(
                username=username,
                email=email,
                password='admin123'  # Default password
            )

            # Create profile
            profile, created = UserProfile.objects.get_or_create(
                user=admin_user,
                defaults={
                    'email_verified': True,
                    'email_verified_at': timezone.now()
                }
            )

            self.stdout.write(
                self.style.SUCCESS(f'Superuser created: {username}')
            )
            self.stdout.write(
                self.style.WARNING(f'Default password: admin123')
            )
            self.stdout.write(
                self.style.WARNING('Please change password after login!')
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to create superuser: {e}')
            )

    def create_test_data(self):
        """Create test users and data"""
        self.stdout.write('Creating test data...')

        try:
            # Create test user 1 (verified)
            test_user1, created = User.objects.get_or_create(
                username='testuser',
                defaults={
                    'email': 'test@example.com',
                    'first_name': 'Test',
                    'last_name': 'User'
                }
            )

            if created:
                test_user1.set_password('test123')
                test_user1.save()

                # Create verified profile
                UserProfile.objects.get_or_create(
                    user=test_user1,
                    defaults={
                        'email_verified': True,
                        'email_verified_at': timezone.now()
                    }
                )

                # Create sample generation history
                sample_pii = {
                    'full_name': 'John Doe',
                    'birth_year': '1990',
                    'hometown': 'New York',
                    'pet_names': ['Buddy', 'Max']
                }
                
                sample_wordlist = [
                    'JohnDoe1990',
                    'johndoe90',
                    'JD1990!',
                    'Buddy123',
                    'NewYork90',
                    'john.doe.1990',
                    'JohnBuddy90'
                ]

                GenerationHistory.objects.create(
                    user=test_user1,
                    pii_data=sample_pii,
                    wordlist=sample_wordlist,
                    ip_address='127.0.0.1'
                )

                self.stdout.write(
                    self.style.SUCCESS('Test user created: testuser / test123')
                )

            # Create test user 2 (unverified)
            test_user2, created = User.objects.get_or_create(
                username='unverified',
                defaults={
                    'email': 'unverified@example.com',
                    'first_name': 'Unverified',
                    'last_name': 'User'
                }
            )

            if created:
                test_user2.set_password('unverified123')
                test_user2.save()

                # Create unverified profile
                UserProfile.objects.get_or_create(
                    user=test_user2,
                    defaults={
                        'email_verified': False,
                        'email_verified_at': None
                    }
                )

                # Create pending email verification
                EmailVerification.objects.create(
                    user=test_user2,
                    verification_type='email_verify'
                )

                self.stdout.write(
                    self.style.SUCCESS('Unverified user created: unverified / unverified123')
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to create test data: {e}')
            )

    def display_summary(self):
        """Display project summary"""
        self.stdout.write('\n' + '=' * 50)
        self.stdout.write(
            self.style.SUCCESS('PIIcasso Project Initialized!')
        )
        self.stdout.write('=' * 50)

        # Count statistics
        total_users = User.objects.count()
        verified_users = UserProfile.objects.filter(email_verified=True).count()
        unverified_users = total_users - verified_users
        total_generations = GenerationHistory.objects.count()
        active_tokens = EmailVerification.objects.filter(is_used=False).count()

        self.stdout.write(f'Total Users: {total_users}')
        self.stdout.write(f'Verified Users: {verified_users}')
        self.stdout.write(f'Unverified Users: {unverified_users}')
        self.stdout.write(f'Total Generations: {total_generations}')
        self.stdout.write(f'Active Tokens: {active_tokens}')

        self.stdout.write('\nNext Steps:')
        self.stdout.write('1. Start the server: python manage.py runserver')
        self.stdout.write('2. Visit admin: http://127.0.0.1:8000/admin/')
        self.stdout.write('3. Test the API: http://127.0.0.1:8000/api/')
        self.stdout.write('4. Start frontend: cd ../frontend && npm start')

        self.stdout.write('\nManagement Commands:')
        self.stdout.write('• python manage.py email_stats - View email statistics')
        self.stdout.write('• python manage.py cleanup_tokens - Clean expired tokens')
        self.stdout.write('• python manage.py verify_user <email> - Manually verify user')

        self.stdout.write('\nTroubleshooting:')
        self.stdout.write('• Check logs/django.log for errors')
        self.stdout.write('• Run python manage.py check for issues')
        self.stdout.write('• Verify .env file configuration')

        self.stdout.write(
            self.style.SUCCESS('\nHappy coding!')
        )