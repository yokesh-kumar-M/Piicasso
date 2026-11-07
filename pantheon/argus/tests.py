from django.test import TestCase
from rest_framework.test import APIClient

from .services.telemetry_service import TelemetryService
from .services.terminal_service import TerminalService


class ArgusOperationsTests(TestCase):
    def test_health_check(self):
        client = APIClient()
        response = client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.get("status"), "healthy")

    def test_terminal_service_execution(self):
        help_output = TerminalService.execute_command("help")
        self.assertIn("Available commands", help_output)

        ping_output = TerminalService.execute_command("ping")
        self.assertIn("PING", ping_output)

        status_output = TerminalService.execute_command("status")
        self.assertIn("Cerberus", status_output)
        self.assertIn("Golem", status_output)
        self.assertIn("Valkyrie", status_output)
        self.assertIn("Argus", status_output)

    def test_telemetry_recording(self):
        log = TelemetryService.log_system_event("Cluster node synchronized", level="INFO")
        self.assertEqual(log.message, "Cluster node synchronized")

        activity = TelemetryService.record_activity(
            user=None,
            activity_type="SCAN",
            description="Recon sweep",
            lat=13.0827,
            lng=80.2707,
            city="Chennai",
            cc="IND",
        )
        self.assertEqual(activity.city, "Chennai")
        self.assertEqual(activity.color, "#3b82f6")

