from django.core.management.base import BaseCommand

from appointments.views import expire_stale_requests


class Command(BaseCommand):
    help = 'Expire pending visit requests nobody answered within an hour of the visit time, and text the visitors.'

    def handle(self, *args, **options):
        count = expire_stale_requests()
        self.stdout.write(f'Expired {count} visit request(s).')
