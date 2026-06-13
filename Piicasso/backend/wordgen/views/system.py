"""
System health, logs, and simulated terminal views.
"""

import logging

from django.utils import timezone
from django.db import connection

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication

from operations.models import SystemLog
from ..serializers import SystemLogSerializer
from backend.throttles import TerminalRateThrottle

logger = logging.getLogger("wordgen")


# ─── HEALTH CHECK ────────────────────────────────────────────────────────────


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def health_check(request):
    """
    Production health check — verifies both the application layer and
    database connectivity. Used by load balancers and monitoring.
    """
    health = {
        "status": "healthy",
        "timestamp": timezone.now().isoformat(),
        "version": "2.0.0",
        "database": "ok",
    }
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception as e:
        health["status"] = "degraded"
        health["database"] = "error"
        logger.error(f"Health check DB failure: {e}")
        return Response(health, status=503)

    return Response(health, status=200)


# ─── SYSTEM LOGS ─────────────────────────────────────────────────────────────


class SystemLogView(APIView):
    """
    System logs — now requires authentication and superuser access (1.1 fix).
    Previously publicly readable by any anonymous visitor.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_superuser:
            return Response(
                {"error": "Admin access required."}, status=403
            )

        logs = SystemLog.objects.all()[:15]
        if not logs.exists():
            SystemLog.objects.create(
                message="System initialized.", level="INFO", source="SYS"
            )
            logs = SystemLog.objects.all()[:15]

        serializer = SystemLogSerializer(logs, many=True)
        return Response(serializer.data)


# ─── SIMULATED TERMINAL (1.7 fix — renamed + enum-based commands) ───────────
# ⚠️  WARNING: This endpoint does NOT execute real system commands.
# It returns hardcoded, simulated output for a cybersecurity-themed UI.
# Do NOT add real command execution (subprocess, os.system, etc.) here.
# Doing so would create an instant Remote Code Execution (RCE) vulnerability.


class SimulatedTerminalView(APIView):
    """
    Simulated terminal for the cybersecurity-themed UI.
    All commands are whitelisted and return hardcoded output.
    No real system commands are ever executed.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [TerminalRateThrottle]

    # Whitelist of allowed simulated commands
    ALLOWED_COMMANDS = frozenset(["hydra", "nmap", "help", "clear", "whoami", "status"])

    def post(self, request):
        command = request.data.get("command", "").strip()
        if not command:
            return Response({"output": []})

        parts = command.split()
        cmd_base = parts[0].lower()
        is_god = request.user.is_superuser
        output = []

        if cmd_base not in self.ALLOWED_COMMANDS:
            output.append(f"Restricted Shell: command '{cmd_base}' is not authorized.")
            output.append(f"Type 'help' for available commands.")
            return Response({"output": output})

        if cmd_base == "hydra":
            output.append("Hydra v9.5 (c) 2024 by van Hauser/THC")
            output.append("[DATA] Attacking target...")

            # Simulate real hydra output with whitespace formatting
            if len(parts) > 1 and "-l" in parts:
                try:
                    user_idx = parts.index("-l") + 1
                    target_user = parts[user_idx] if user_idx < len(parts) else "admin"
                except:
                    target_user = "admin"
            else:
                target_user = "admin"

            output.append(
                f"[INFO] 1 target, 1 server, 1 login try ({target_user}), 1000 passwords/try"
            )

            if is_god:
                output.append(
                    f"[22][ssh] host: 10.10.1.5   login: {target_user}   password: ********"
                )
                output.append(f"[SUCCESS] 1 valid password found")
            else:
                output.append(f"[ERROR] 0 valid passwords found")

        elif cmd_base == "nmap":
            if not is_god:
                output.append(
                    f"Restricted Shell: command '{cmd_base}' requires admin privileges."
                )
                return Response({"output": output})

            # Simulate real nmap output with accurate whitespace
            from django.utils import timezone

            output.append(
                f"Starting Nmap 7.94 ( https://nmap.org ) at {timezone.now().strftime('%Y-%m-%d %H:%M %Z')}"
            )
            output.append("Nmap scan report for target (10.10.1.5)")
            output.append("Host is up (0.0012s latency).")
            output.append("Not shown: 997 closed tcp ports (reset)")
            output.append("PORT     STATE SERVICE  VERSION")
            output.append(
                "22/tcp   open  ssh      OpenSSH 8.9p1 Ubuntu 3ubuntu0.4 (Ubuntu Linux; protocol 2.0)"
            )
            output.append("80/tcp   open  http     nginx 1.18.0 (Ubuntu)")
            output.append("3306/tcp open  mysql    MySQL 8.0.34-0ubuntu0.22.04.1")
            output.append("Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel")
            output.append("")
            output.append("Nmap done: 1 IP address (1 host up) scanned in 0.53 seconds")

        elif cmd_base == "whoami":
            output.append(
                f"{request.user.username} ({'ADMIN' if is_god else 'OPERATOR'})"
            )

        elif cmd_base == "status":
            output.append("PIIcasso System Status: OPERATIONAL")
            output.append(f"Authenticated as: {request.user.username}")
            output.append(f"Active Nodes: 12")
            output.append(f"Threat Intel Sync: OK")

        elif cmd_base == "help":
            output.append("Available commands:")
            output.append("  hydra   - Network logon cracker")
            output.append(
                "  nmap    - Network exploration tool and security / port scanner (Admin)"
            )
            output.append("  whoami  - Print effective userid")
            output.append("  status  - Show PIIcasso system status")
            output.append("  help    - Show this message")
            output.append("  clear   - Clear terminal screen")

        elif cmd_base == "clear":
            output = []

        return Response({"output": output})
