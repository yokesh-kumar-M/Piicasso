from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import UserActivity
from .serializers import UserActivitySerializer
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.core.cache import cache
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

# Maximum number of globe data points returned per request
GLOBE_DATA_LIMIT = 200


class HelpBeaconView(APIView):
    """
    The iconic HELP beacon — the frontend sends 'HELP' every 10 seconds.
    Now requires authentication to prevent anonymous spam pollution of UserActivity.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get('message', '')
        if message == 'HELP':
            logger.debug(f"[BEACON] HELP signal received from {request.user.username}")
            active = cache.get('globe:active', {})
            active[str(request.user.id)] = timezone.now().isoformat()
            cache.set('globe:active', active, timeout=3600)
        return Response({'status': 'received', 'echo': message}, status=status.HTTP_200_OK)


class GlobeDataView(APIView):
    """
    Returns geo-located user activity data for the interactive globe.
    Requires authentication — previously leaked all user login locations
    (lat/lng/city/username) to anonymous visitors.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Max

        # Read active users — those who heartbeated within the last 90 seconds
        active = cache.get('globe:active', {})
        cutoff = timezone.now() - timedelta(seconds=90)
        active_ids = [
            int(uid) for uid, ts in active.items()
            if parse_datetime(ts) and parse_datetime(ts) >= cutoff
        ]
        live_count = len(active_ids)

        if active_ids:
            # One beacon per active user: their latest LOGIN location
            latest_ids = (
                UserActivity.objects
                .filter(user_id__in=active_ids, activity_type='LOGIN')
                .exclude(latitude=999.0)
                .exclude(longitude=999.0)
                .values('user_id')
                .annotate(latest_id=Max('id'))
                .values_list('latest_id', flat=True)
            )
            points_qs = UserActivity.objects.filter(id__in=latest_ids)
        else:
            points_qs = UserActivity.objects.none()

        serializer = UserActivitySerializer(points_qs, many=True)
        return Response({
            'points': serializer.data,
            'live_count': live_count,
            'server_time': timezone.now().isoformat(),
        })
