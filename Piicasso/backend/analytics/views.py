from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import UserActivity
from .serializers import UserActivitySerializer
import random
from django.utils import timezone

class GlobeDataView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Fetch actual recent activities from the database and exclude invalid coordinates
        activities = UserActivity.objects.exclude(latitude=999.0).exclude(longitude=999.0)[:150]
        serializer = UserActivitySerializer(activities, many=True)
        return Response(serializer.data)
