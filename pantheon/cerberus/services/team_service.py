from rest_framework.exceptions import PermissionDenied, ValidationError

from ..persistence.models import Team, TeamMembership, TeamMessage


class TeamService:
    @staticmethod
    def create_team(owner, name):
        if Team.objects.filter(name__iexact=name).exists():
            raise ValidationError({"error": "A team with this name already exists."})

        # Check if user already owns or belongs to a team
        if TeamMembership.objects.filter(user=owner).exists():
            raise ValidationError({"error": "You already belong to a team. Leave your current team first."})

        team = Team.objects.create(owner=owner, name=name)
        TeamMembership.objects.create(team=team, user=owner, role="LEADER")
        return team

    @staticmethod
    def join_team(user, invite_code):
        if TeamMembership.objects.filter(user=user).exists():
            raise ValidationError({"error": "You already belong to a team. Leave your current team first."})

        team = Team.objects.filter(invite_code=invite_code).first()
        if not team:
            raise ValidationError({"error": "Invalid team invite code."})

        membership = TeamMembership.objects.create(team=team, user=user, role="MEMBER")
        return membership

    @staticmethod
    def leave_team(user):
        membership = TeamMembership.objects.filter(user=user).first()
        if not membership:
            raise ValidationError({"error": "You are not a member of any team."})

        team = membership.team
        if membership.role == "LEADER":
            # If the leader leaves and there are other members, promote the oldest member
            other_members = team.members.exclude(user=user).order_by("joined_at")
            if other_members.exists():
                new_leader = other_members.first()
                new_leader.role = "LEADER"
                new_leader.save()
                team.owner = new_leader.user
                team.save()
            else:
                team.delete()
                return {"message": "Team deleted as last member left."}

        membership.delete()
        return {"message": "Successfully left team."}

    @staticmethod
    def post_message(team, sender, content):
        if not TeamMembership.objects.filter(team=team, user=sender).exists():
            raise PermissionDenied("You must be an active member of this team to post messages.")

        return TeamMessage.objects.create(team=team, sender=sender, content=content)

