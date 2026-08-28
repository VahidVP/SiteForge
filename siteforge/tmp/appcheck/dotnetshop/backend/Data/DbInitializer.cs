using Api.Models;

namespace Api.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();

        var webRoot = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
        Directory.CreateDirectory(Path.Combine(webRoot, "media"));

        if (!db.Pages.Any())
        {
            db.Pages.AddRange(
                new Page
                {
                    Slug = "home",
                    Title = "Home",
                    Content = "Welcome! This content lives in your database - edit it in Data/DbInitializer.cs or wire up an admin UI."
                },
                new Page
                {
                    Slug = "about",
                    Title = "About",
                    Content = "Tell your story here."
                }
            );
            await db.SaveChangesAsync();
        }
        if (!db.Products.Any())
        {
            db.Products.AddRange(
                new Product { Name = "Aurora Hoodie", NameFa = "هودی آرورا", Description = "Soft fleece hoodie with embroidered logo.", DescriptionFa = "هودی نرم با لوگوی گلدوزی‌شده.", Price = 49.90m, Featured = true },
                new Product { Name = "Drift Sneakers", NameFa = "کفش دریفت", Description = "Lightweight everyday sneakers with memory foam.", DescriptionFa = "کفش روزمره سبک با کفی مموری فوم.", Price = 79.00m, Featured = true },
                new Product { Name = "Nomad Backpack", NameFa = "کوله نومد", Description = "Water-resistant 25L backpack for daily commutes.", DescriptionFa = "کوله ۲۵ لیتری ضدآب برای رفت‌وآمد روزانه.", Price = 59.50m },
                new Product { Name = "Lumen Desk Lamp", NameFa = "چراغ رومیزی لومن", Description = "Dimmable LED lamp with wireless charging base.", DescriptionFa = "چراغ LED با نور قابل تنظیم و شارژ بی‌سیم.", Price = 34.90m },
                new Product { Name = "Terra Mug", NameFa = "ماگ ترا", Description = "Handcrafted ceramic mug, 350ml.", DescriptionFa = "ماگ سرامیکی دست‌ساز ۳۵۰ میلی‌لیتر.", Price = 18.00m },
                new Product { Name = "Echo Speaker", NameFa = "اسپیکر اکو", Description = "Compact bluetooth speaker with 12h battery.", DescriptionFa = "اسپیکر بلوتوث جمع‌وجور با ۱۲ ساعت باتری.", Price = 45.00m }
            );
            await db.SaveChangesAsync();
        }
    }
}
