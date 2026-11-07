from ..persistence.models import SystemLog, UserActivity


class TelemetryService:
    @staticmethod
    def log_system_event(message: str, level: str = "INFO", source: str = "SYSTEM"):
        return SystemLog.objects.create(message=message, level=level, source=source)

    @staticmethod
    def record_activity(user, activity_type: str, description: str, lat=None, lng=None, city="Unknown", cc="UNK"):
        return UserActivity.objects.create(
            user=user if user and user.is_authenticated else None,
            activity_type=activity_type,
            description=description,
            latitude=lat,
            longitude=lng,
            city=city,
            country_code=cc,
        )

    @staticmethod
    def get_globe_data(limit=100):
        activities = UserActivity.objects.exclude(latitude__isnull=True).exclude(longitude__isnull=True)[:limit]
        return [
            {
                "lat": act.latitude,
                "lng": act.longitude,
                "city": act.city,
                "country": act.country_code,
                "type": act.activity_type,
                "description": act.description,
                "color": act.color,
                "intensity": act.intensity,
                "timestamp": act.timestamp,
            }
            for act in activities
        ]

