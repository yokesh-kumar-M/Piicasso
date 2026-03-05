from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import UserActivity
from .serializers import UserActivitySerializer
from django.utils import timezone
from django.utils.dateparse import parse_datetime
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
        since_param = request.query_params.get('since')

        # Base queryset: all events with valid coordinates
        qs = UserActivity.objects.exclude(
            latitude=999.0
        ).exclude(
            longitude=999.0
        )

        if since_param:
            # Incremental mode: only return events newer than the provided timestamp
            try:
                since_dt = parse_datetime(since_param)
                if since_dt:
                    qs = qs.filter(timestamp__gt=since_dt)
            except (ValueError, TypeError):
                pass
        else:
            # Initial load: one beacon per user — their most recent login location
            # Grab the last 72 hours of logins to keep the globe current
            cutoff = timezone.now() - timedelta(hours=72)
            qs = qs.filter(timestamp__gte=cutoff)

            # Deduplicate efficiently at database level
            from django.db.models import Max
            latest_ids = qs.values('description').annotate(latest_id=Max('id')).values_list('latest_id', flat=True)
            deduplicated = UserActivity.objects.filter(id__in=latest_ids).order_by('-timestamp')[:GLOBE_DATA_LIMIT]

            serializer = UserActivitySerializer(deduplicated, many=True)
            return Response({
                'points': serializer.data,
                'server_time': timezone.now().isoformat(),
            })

        # Apply limit to incremental queries too (2.5 fix)
        serializer = UserActivitySerializer(qs.order_by('-timestamp')[:GLOBE_DATA_LIMIT], many=True)
        return Response({
            'points': serializer.data,
            'server_time': timezone.now().isoformat(),
        })
