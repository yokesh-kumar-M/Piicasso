from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.schema_serializers import StatusResponseSerializer


class PingView(APIView):
    """Health check endpoint to verify the server is awake."""

    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Check API availability",
        responses={200: StatusResponseSerializer},
        tags=["Health"],
    )
    def get(self, request):
        return Response({"status": "ok", "message": "Server is awake"}, status=status.HTTP_200_OK)
