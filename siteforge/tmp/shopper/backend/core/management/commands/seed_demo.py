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
    help = "Seeds demo pages, products."

    def handle(self, *args, **options):
        for slug, (title, content) in PAGES.items():
            Page.objects.update_or_create(slug=slug, defaults={"title": title, "content": content})
        from shop.models import Product

        if not Product.objects.exists():
            products = [
                Product(name="Aurora Hoodie", name_fa="هودی آرورا",
                    description="Soft fleece hoodie with embroidered logo.",
                    description_fa="هودی نرم با لوگوی گلدوزی‌شده.", price="49.90", featured=True),
                Product(name="Drift Sneakers", name_fa="کفش دریفت",
                    description="Lightweight everyday sneakers with memory foam.",
                    description_fa="کفش روزمره سبک با کفی مموری فوم.", price="79.00", featured=True),
                Product(name="Nomad Backpack", name_fa="کوله نومد",
                    description="Water-resistant 25L backpack for daily commutes.",
                    description_fa="کوله ۲۵ لیتری ضدآب برای رفت‌وآمد روزانه.", price="59.50"),
                Product(name="Lumen Desk Lamp", name_fa="چراغ رومیزی لومن",
                    description="Dimmable LED lamp with wireless charging base.",
                    description_fa="چراغ LED با نور قابل تنظیم و شارژ بی‌سیم.", price="34.90"),
                Product(name="Terra Mug", name_fa="ماگ ترا",
                    description="Handcrafted ceramic mug, 350ml.",
                    description_fa="ماگ سرامیکی دست‌ساز ۳۵۰ میلی‌لیتر.", price="18.00"),
                Product(name="Echo Speaker", name_fa="اسپیکر اکو",
                    description="Compact bluetooth speaker with 12h battery.",
                    description_fa="اسپیکر بلوتوث جمع‌وجور با ۱۲ ساعت باتری.", price="45.00"),
            ]
            Product.objects.bulk_create(products)
        self.stdout.write(self.style.SUCCESS("Demo content seeded."))
