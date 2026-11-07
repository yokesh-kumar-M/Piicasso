from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .persistence.models import Team, TeamMembership
from .services.auth_service import AuthService
from .services.team_service import TeamService

User = get_user_model()


class CerberusAuthServiceTests(TestCase):
    def test_register_and_token_generation(self):
        user = AuthService.register_user(
            username="phantom_operator",
            email="operator@pantheon.local",
            password="StrongPassword123!",
        )
        self.assertEqual(user.username, "phantom_operator")
        tokens = AuthService.generate_tokens_for_user(user)
        self.assertIn("access", tokens)
        self.assertIn("refresh", tokens)
        self.assertEqual(tokens["username"], "phantom_operator")

    def test_team_creation_and_membership(self):
        owner = User.objects.create_user(username="team_leader", password="Password123!")
        team = TeamService.create_team(owner, "Alpha Syndicate")
        self.assertEqual(team.name, "Alpha Syndicate")
        self.assertTrue(team.invite_code)

        member_user = User.objects.create_user(username="team_operative", password="Password123!")
        membership = TeamService.join_team(member_user, team.invite_code)
        self.assertEqual(membership.team, team)
        self.assertEqual(membership.role, "MEMBER")

    def test_api_ping(self):
        client = APIClient()
        response = client.get("/api/user/ping/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.get("status"), "ok")

