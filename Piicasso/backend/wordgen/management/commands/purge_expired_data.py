"""
Enterprise management command: Purge expired data per retention policy.
Usage:  python manage.py purge_expired_data
        python manage.py purge_expired_data --days 60
"""
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings

from generator.models import GenerationHistory
from analytics.models import UserActivity
from operations.models import SystemLog, Notification


class Command(BaseCommand):
    help = 'Purge data older than the configured retention period (DATA_RETENTION_DAYS).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=None,
            help='Override the retention period (in days).',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting.',
        )

    def handle(self, *args, **options):
        days = options['days'] or settings.PIICASSO_SETTINGS.get('DATA_RETENTION_DAYS', 30)
        dry_run = options['dry_run']
        cutoff = timezone.now() - timedelta(days=days)

        self.stdout.write(f"Retention policy: {days} days  |  Cutoff: {cutoff.isoformat()}")
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN — nothing will be deleted.\n"))

        purge_targets = [
            ('GenerationHistory', GenerationHistory.objects.filter(timestamp__lt=cutoff)),
            ('UserActivity', UserActivity.objects.filter(timestamp__lt=cutoff)),
            ('SystemLog', SystemLog.objects.filter(timestamp__lt=cutoff)),
            ('Notification (read)', Notification.objects.filter(timestamp__lt=cutoff, is_read=True)),
        ]

        total = 0
        for name, qs in purge_targets:
            count = qs.count()
            total += count
            self.stdout.write(f"  {name}: {count} records")
            if not dry_run and count:
                qs.delete()

        if dry_run:
            self.stdout.write(self.style.WARNING(f"\nTotal records that WOULD be deleted: {total}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"\nPurged {total} expired records."))
