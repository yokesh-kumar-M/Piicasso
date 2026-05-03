from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status


class PingView(APIView):
    """Health check endpoint to verify the server is awake."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {"status": "ok", "message": "Server is awake"}, status=status.HTTP_200_OK
        )
