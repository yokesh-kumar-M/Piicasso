from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class PasswordSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpassword123')
        self.client.force_authenticate(user=self.user)

    def test_password_analyze_no_password(self):
        response = self.client.post('/api/password/analyze/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_analyze_weak_password(self):
        response = self.client.post('/api/password/analyze/', {'password': 'password'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('score' in response.data)
        self.assertLessEqual(response.data['score'], 20)
        self.assertEqual(response.data['level'], 'critical')

    def test_password_analyze_strong_password(self):
        response = self.client.post('/api/password/analyze/', {'password': 'CorrectHorseBatteryStaple!@#123'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('score' in response.data)
        self.assertGreaterEqual(response.data['score'], 60)
        self.assertIn(response.data['level'], ['low', 'medium'])

    def test_user_preferences(self):
        # Update preferences
        response = self.client.put('/api/password/preferences/', {'default_mode': 'security', 'last_mode': 'security'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['default_mode'], 'security')

        # Get preferences
        response = self.client.get('/api/password/preferences/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['default_mode'], 'security')
