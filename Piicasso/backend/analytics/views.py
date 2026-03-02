from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import UserActivity
from .serializers import UserActivitySerializer
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from datetime import timedelta


class GlobeDataView(APIView):
    permission_classes = [AllowAny]

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

            # Deduplicate: keep only the most recent activity per description (proxy for user)
            seen = set()
            deduplicated = []
            for activity in qs.order_by('-timestamp'):
                key = activity.description  # e.g. "Operator alice authenticated."
                if key not in seen:
                    seen.add(key)
                    deduplicated.append(activity)

            serializer = UserActivitySerializer(deduplicated, many=True)
            return Response({
                'points': serializer.data,
                'server_time': timezone.now().isoformat(),
            })

        serializer = UserActivitySerializer(qs.order_by('-timestamp'), many=True)
        return Response({
            'points': serializer.data,
            'server_time': timezone.now().isoformat(),
        })
