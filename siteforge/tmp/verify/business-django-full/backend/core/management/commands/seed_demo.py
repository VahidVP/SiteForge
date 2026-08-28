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
    help = "Seeds demo pages and services."

    def handle(self, *args, **options):
        for slug, (title, content) in PAGES.items():
            Page.objects.update_or_create(slug=slug, defaults={"title": title, "content": content})
        from core.models import Service

        if not Service.objects.exists():
            Service.objects.create(title="Web Development", title_fa="توسعه وب", icon="🌐",
                text="Modern, fast websites and web apps built with React and a robust backend. From brochure sites to full platforms.",
                text_fa="وب‌سایت‌ها و اپلیکیشن‌های وب مدرن و سریع با React و بک‌اند قدرتمند؛ از سایت‌های معرفی تا پلتفرم‌های کامل.",
                order=1)
            Service.objects.create(title="UI / UX Design", title_fa="طراحی رابط و تجربه کاربری", icon="🎨",
                text="Interfaces that put content first. User flows, prototypes and design systems tested with real users.",
                text_fa="رابط‌هایی که محتوا را در اولویت قرار می‌دهند؛ مسیر کاربر، نمونهٔ اولیه و سیستم‌های طراحی که با کاربران واقعی آزموده می‌شوند.",
                order=2)
            Service.objects.create(title="Consulting", title_fa="مشاوره", icon="💡",
                text="Technical guidance for product teams - architecture reviews, code audits and mentoring.",
                text_fa="راهنمایی فنی برای تیم‌های محصول؛ بازبینی معماری، ممیزی کد و مربی‌گری.",
                order=3)
        self.stdout.write(self.style.SUCCESS("Demo content seeded."))
