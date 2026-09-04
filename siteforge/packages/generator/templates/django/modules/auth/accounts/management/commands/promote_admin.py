from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Promote an existing account to site admin (recovery path for the one-time claim-admin flow)."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True, help="Account email to promote to admin.")

    def handle(self, *args, **options):
        email = str(options["email"]).strip()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise CommandError(f'No account with email "{email}".')
        user.is_staff = True
        user.is_superuser = True
        user.save(update_fields=["is_staff", "is_superuser"])
        self.stdout.write(self.style.SUCCESS(f'"{email}" is now a site admin.'))
