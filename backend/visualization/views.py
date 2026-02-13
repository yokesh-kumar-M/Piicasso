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
        # Fetch actual recent activities from the database
        # Get last 150 events for a dense globe visualization
        activities = UserActivity.objects.all()[:150]
        serializer = UserActivitySerializer(activities, many=True)
        return Response(serializer.data)
