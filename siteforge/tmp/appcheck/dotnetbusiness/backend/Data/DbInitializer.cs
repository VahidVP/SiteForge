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
        if (!db.Services.Any())
        {
            db.Services.AddRange(
                new Service { Title = "Web Development", TitleFa = "توسعه وب", Icon = "🌐", Text = "Modern, fast websites and web apps built with React and a robust backend. From brochure sites to full platforms.", TextFa = "وب‌سایت‌ها و اپلیکیشن‌های وب مدرن و سریع با React و بک‌اند قدرتمند؛ از سایت‌های معرفی تا پلتفرم‌های کامل.", Order = 1 },
                new Service { Title = "UI / UX Design", TitleFa = "طراحی رابط و تجربه کاربری", Icon = "🎨", Text = "Interfaces that put content first. User flows, prototypes and design systems tested with real users.", TextFa = "رابط‌هایی که محتوا را در اولویت قرار می‌دهند؛ مسیر کاربر، نمونهٔ اولیه و سیستم‌های طراحی که با کاربران واقعی آزموده می‌شوند.", Order = 2 },
                new Service { Title = "Consulting", TitleFa = "مشاوره", Icon = "💡", Text = "Technical guidance for product teams - architecture reviews, code audits and mentoring.", TextFa = "راهنمایی فنی برای تیم‌های محصول؛ بازبینی معماری، ممیزی کد و مربی‌گری.", Order = 3 }
            );
            await db.SaveChangesAsync();
        }
    }
}
