"""
PIIcasso Backend Tests — analytics app
========================================
Tests for globe data and beacon endpoints.
"""

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from analytics.models import UserActivity


class GlobeDataTest(TestCase):
    """1.1 fix: GlobeDataView should require authentication."""

    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user("globeuser", password="Pass1234!")
        UserActivity.objects.create(
            user=self.user,
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
        cache.set("globe:active", {str(self.user.id): timezone.now().isoformat()}, timeout=90)
        response = client.get("/api/analytics/globe-data/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["points"]), 1)
        self.assertEqual(response.data["points"][0]["latitude"], 40.7)
        self.assertEqual(response.data["points"][0]["longitude"], -74.0)
        self.assertEqual(response.data["points"][0]["city"], "Approximate area")


class BeaconTest(TestCase):
    """1.1 fix: Beacon should require authentication."""

    def test_anonymous_cannot_use_beacon(self):
        client = APIClient()
        response = client.post("/api/analytics/beacon/", {"message": "HELP"}, format="json")
        self.assertEqual(response.status_code, 401)

    def test_authenticated_beacon(self):
        user = User.objects.create_user("beaconuser", password="Pass1234!")
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post("/api/analytics/beacon/", {"message": "HELP"}, format="json")
        self.assertEqual(response.status_code, 200)

    def test_beacon_discards_precise_location_and_city(self):
        user = User.objects.create_user("coarseuser", password="Pass1234!")
        client = APIClient()
        client.force_authenticate(user=user)

        response = client.post(
            "/api/analytics/beacon/",
            {
                "message": "HELP",
                "latitude": 12.9715987,
                "longitude": 77.594566,
                "city": "Precise private location",
                "country_code": "IND",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        activity = UserActivity.objects.get(user=user)
        self.assertEqual(activity.latitude, 13.0)
        self.assertEqual(activity.longitude, 77.6)
        self.assertEqual(activity.city, "Approximate area")
