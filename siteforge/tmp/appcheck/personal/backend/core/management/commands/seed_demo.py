from django.core.management.base import BaseCommand

from core.models import Page

PAGES = {
    "home": (
        "Home",
        "Welcome! This content lives in your database. Edit it from the admin panel or the seed file.",
    ),
    "about": (
        "About",
        "Tell your story here.\n\nAdd as many paragraphs as you like - separate them with a blank line and they will animate in one by one.",
    ),
}


class Command(BaseCommand):
    help = "Seeds demo pages, projects."

    def handle(self, *args, **options):
        for slug, (title, content) in PAGES.items():
            Page.objects.update_or_create(slug=slug, defaults={"title": title, "content": content})
        from core.models import Project

        if not Project.objects.exists():
            Project.objects.create(
                name="Nimbus Notes", name_fa="یادداشت‌های نیمبوس",
                summary="A minimal note-taking app with offline sync.",
                summary_fa="برنامهٔ یادداشت‌برداری مینیمال با همگام‌سازی آفلاین.",
                description="Nimbus is a clean, keyboard-first notes app. It works fully offline, syncs when a connection returns, and keeps everything local-first.",
                description_fa="نیمبوس یک برنامهٔ یادداشت‌برداری تمیز و مبتنی بر کیبورد است؛ کاملاً آفلاین کار می‌کند، هنگام اتصال همگام می‌شود و همه‌چیز را در اولویت محلی نگه می‌دارد.",
                tags='["React", "PWA"]', order=1)
            Project.objects.create(
                name="Orbit Dashboard", name_fa="داشبورد اوربیت",
                summary="Analytics dashboard with realtime charts.",
                summary_fa="داشبورد تحلیلی با نمودارهای زنده.",
                description="Orbit turns raw event streams into live charts. The dashboard streams metrics over WebSockets and renders them with canvas charts.",
                description_fa="اوربیت جریان رویدادهای خام را به نمودارهای زنده تبدیل می‌کند؛ داده‌ها از طریق WebSocket پخش و با نمودارهای Canvas نمایش داده می‌شوند.",
                tags='["TypeScript", "Charts"]', order=2)
            Project.objects.create(
                name="Fable Landing", name_fa="لندینگ فیبل",
                summary="Story-driven landing page for an indie game.",
                summary_fa="صفحهٔ فرود روایت‌محور برای یک بازی مستقل.",
                description="A scroll-driven landing page that tells the game's story scene by scene with subtle parallax and transition animations.",
                description_fa="یک صفحهٔ فرود مبتنی بر اسکرول که داستان بازی را صحنه‌به‌صحنه با افکت پارالاکس و انیمیشن‌های نرم روایت می‌کند.",
                tags='["Animation", "CSS"]', order=3)
        self.stdout.write(self.style.SUCCESS("Demo content seeded."))
