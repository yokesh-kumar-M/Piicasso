from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import User
from django.utils import timezone

from .models import Team, TeamMembership, TeamMessage
from analytics.models import UserActivity
from generator.models import GenerationHistory

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_team(request):
    """Establishes a new tactical team and assigns the creator as LEADER."""
    try:
        user = request.user
        if TeamMembership.objects.filter(user=user).exists():
            return Response({"error": "You are already a member of an active team."}, status=status.HTTP_400_BAD_REQUEST)

        name = request.data.get('name')
        if not name:
            return Response({"error": "A unique team identification name is required."}, status=status.HTTP_400_BAD_REQUEST)

        team = Team.objects.create(name=name, owner=user)
        TeamMembership.objects.create(user=user, team=team, role='LEADER')

        UserActivity.objects.create(
            activity_type='TEAM_JOIN',
            description=f"Unit established: {name} (Cmdr: {user.username})",
            city="HQ Command Center",
            latitude=0.0,
            longitude=0.0
        )

        return Response({
            "message": "Team establishment successful.",
            "code": team.invite_code,
            "id": team.id
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def join_team(request):
    """Joins an existing team using a verified invite code."""
    try:
        user = request.user
        if TeamMembership.objects.filter(user=user).exists():
            return Response({"error": "Active deployment detected. Cannot join multiple teams."}, status=status.HTTP_400_BAD_REQUEST)

        code = request.data.get('invite_code') or request.data.get('code')
        if not code:
            return Response({"error": "Valid invitation credentials required."}, status=status.HTTP_400_BAD_REQUEST)
        
        team = get_object_or_404(Team, invite_code=code)

        TeamMembership.objects.create(user=user, team=team, role='MEMBER')
        
        UserActivity.objects.create(
            activity_type='TEAM_JOIN',
            description=f"Operator {user.username} deployed to unit {team.name}",
            city="Strategic Node"
        )
        
        # Notify team owner
        from operations.views import create_notification
        create_notification(
            user=team.owner,
            notification_type='TEAM',
            title=f'{user.username} joined your team',
            description=f'{user.username} has joined {team.name}',
            link='/teams'
        )
        
        # Notify the joining user
        create_notification(
            user=user,
            notification_type='TEAM',
            title=f'Welcome to {team.name}!',
            description=f'You have successfully joined the team.',
            link='/teams'
        )
        
        return Response({"message": f"Successfully joined {team.name}."}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_team_info(request):
    """Retrieves intelligence feed and member details for the current team."""
    try:
        user = request.user
        membership = TeamMembership.objects.filter(user=user).select_related('team').first()
        if not membership:
            return Response({"active": False})

        team = membership.team
        members = TeamMembership.objects.filter(team=team).select_related('user')
        member_list = [{
            "username": m.user.username,
            "role": m.role,
            "joined_at": m.joined_at,
            "active_status": "ONLINE"
        } for m in members]

        member_ids = [m.user.id for m in members]
        recent_ops = GenerationHistory.objects.filter(user_id__in=member_ids).order_by('-timestamp')[:10]
        
        feed = [{
            "id": op.id,
            "operator": op.user.username if op.user else "System",
            "target": op.pii_data.get('full_name') or op.pii_data.get('username') or 'Unknown',
            "timestamp": op.timestamp,
            "wordlist_count": op.wordlist_count
        } for op in recent_ops]

        return Response({
            "active": True,
            "name": team.name,
            "invite_code": team.invite_code,
            "my_role": membership.role,
            "members": member_list,
            "feed": feed
        })
    except Exception as e:
        return Response({"error": f"Intelligence report failure: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def leave_team(request):
    """Handles operator extraction from current unit or unit decommissioning."""
    try:
        membership = get_object_or_404(TeamMembership, user=request.user)
        team = membership.team

        if membership.role == 'LEADER':
            count = TeamMembership.objects.filter(team=team).count()
            if count == 1:
                team.delete()
                return Response({"message": "Unit decommissioned (no remaining operators)."})
            
            # Transfer command hierarchy
            next_member = TeamMembership.objects.filter(team=team).exclude(user=request.user).order_by('joined_at').first()
            if next_member:
                next_member.role = 'LEADER'
                next_member.save()
            membership.delete()
            return Response({"message": "Command hierarchy transferred. Operator extracted."})

        membership.delete()
        return Response({"message": f"Successfully detached from unit {team.name}."})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def team_chat_messages(request):
    """Secure encrypted team communication channel."""
    try:
        membership = TeamMembership.objects.get(user=request.user)
        team = membership.team
    except TeamMembership.DoesNotExist:
        return Response({"error": "Unauthorized: Membership required for chat access."}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'GET':
        after_id = int(request.query_params.get('after', 0))
        msgs = TeamMessage.objects.filter(team=team, id__gt=after_id).order_by('timestamp')[:100]
        return Response([{
            "id": m.id,
            "sender": m.sender.username if m.sender else "N/A",
            "content": m.content,
            "timestamp": m.timestamp.isoformat(),
            "is_me": m.sender_id == request.user.id
        } for m in msgs])

    content = request.data.get('content', '').strip()
    if not content:
        return Response({"error": "Empty signal transmissions are restricted."}, status=400)
    if len(content) > 2000:
        return Response({"error": "Signal transmission exceeds limit (2000 chars)."}, status=400)

    msg = TeamMessage.objects.create(team=team, sender=request.user, content=content)
    return Response({
        "id": msg.id,
        "sender": request.user.username,
        "content": msg.content,
        "timestamp": msg.timestamp.isoformat(),
        "is_me": True
    }, status=201)
