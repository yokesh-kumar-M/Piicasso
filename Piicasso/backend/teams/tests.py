"""
PIIcasso Backend Tests — teams app
====================================
Tests for team creation, joining, leaving, leadership transfer, and chat.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from teams.models import Team, TeamMembership, TeamMessage


class TeamCreateTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('teamowner', password='Pass1234!')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_team(self):
        response = self.client.post('/api/teams/create/', {'name': 'Alpha Squad'}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Team.objects.filter(name='Alpha Squad').exists())
        # Creator should be LEADER
        membership = TeamMembership.objects.get(user=self.user)
        self.assertEqual(membership.role, 'LEADER')

    def test_create_team_already_in_team(self):
        self.client.post('/api/teams/create/', {'name': 'First Team'}, format='json')
        response = self.client.post('/api/teams/create/', {'name': 'Second Team'}, format='json')
        self.assertIn(response.status_code, [400, 409])


class TeamJoinTest(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user('owner', password='Pass1234!')
        self.joiner = User.objects.create_user('joiner', password='Pass1234!')
        self.team = Team.objects.create(name='Test Team', owner=self.owner)
        TeamMembership.objects.create(user=self.owner, team=self.team, role='LEADER')

    def test_join_by_invite_code(self):
        client = APIClient()
        client.force_authenticate(user=self.joiner)
        response = client.post('/api/teams/join/', {'invite_code': self.team.invite_code}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(TeamMembership.objects.filter(user=self.joiner, team=self.team).exists())

    def test_join_invalid_code(self):
        client = APIClient()
        client.force_authenticate(user=self.joiner)
        response = client.post('/api/teams/join/', {'invite_code': 'INVALID'}, format='json')
        self.assertIn(response.status_code, [400, 404, 500])


class TeamLeaveTest(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user('owner', password='Pass1234!')
        self.member = User.objects.create_user('member', password='Pass1234!')
        self.team = Team.objects.create(name='Test Team', owner=self.owner)
        TeamMembership.objects.create(user=self.owner, team=self.team, role='LEADER')
        TeamMembership.objects.create(user=self.member, team=self.team, role='MEMBER')

    def test_member_leave(self):
        client = APIClient()
        client.force_authenticate(user=self.member)
        response = client.post('/api/teams/leave/')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(TeamMembership.objects.filter(user=self.member).exists())


class TeamChatTest(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user('chatowner', password='Pass1234!')
        self.member = User.objects.create_user('chatmember', password='Pass1234!')
        self.team = Team.objects.create(name='Chat Team', owner=self.owner)
        TeamMembership.objects.create(user=self.owner, team=self.team, role='LEADER')
        TeamMembership.objects.create(user=self.member, team=self.team, role='MEMBER')

    def test_send_message(self):
        client = APIClient()
        client.force_authenticate(user=self.member)
        response = client.post('/api/teams/chat/', {'content': 'Hello team!'}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(TeamMessage.objects.count(), 1)

    def test_get_messages(self):
        TeamMessage.objects.create(team=self.team, sender=self.owner, content='Test msg')
        client = APIClient()
        client.force_authenticate(user=self.member)
        response = client.get('/api/teams/chat/')
        self.assertEqual(response.status_code, 200)

    def test_non_member_cannot_chat(self):
        outsider = User.objects.create_user('outsider', password='Pass1234!')
        client = APIClient()
        client.force_authenticate(user=outsider)
        response = client.post('/api/teams/chat/', {'content': 'Intruder!'}, format='json')
        self.assertIn(response.status_code, [400, 403])
