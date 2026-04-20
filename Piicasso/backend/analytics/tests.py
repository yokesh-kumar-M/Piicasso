"""
PIIcasso Backend Tests — analytics app
========================================
Tests for globe data and beacon endpoints.
"""

from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from analytics.models import UserActivity


class GlobeDataTest(TestCase):
    """1.1 fix: GlobeDataView should require authentication."""

    def setUp(self):
        self.user = User.objects.create_user("globeuser", password="Pass1234!")
        UserActivity.objects.create(
            activity_type="LOGIN",
            description="Test login",
            latitude=40.7128,
            longitude=-74.0060,
            city="New York",
        )

    def test_anonymous_cannot_access_globe(self):
        client = APIClient()
        response = client.get("/api/analytics/globe-data/")
        self.assertEqual(response.status_code, 401)

    def test_authenticated_can_access_globe(self):
        client = APIClient()
        client.force_authenticate(user=self.user)
        response = client.get("/api/analytics/globe-data/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("points", response.data)


class BeaconTest(TestCase):
    """1.1 fix: Beacon should require authentication."""

    def test_anonymous_cannot_use_beacon(self):
        client = APIClient()
        response = client.post(
            "/api/analytics/beacon/", {"message": "HELP"}, format="json"
        )
        self.assertEqual(response.status_code, 401)

    def test_authenticated_beacon(self):
        user = User.objects.create_user("beaconuser", password="Pass1234!")
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post(
            "/api/analytics/beacon/", {"message": "HELP"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
