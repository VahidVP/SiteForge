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
        if (!db.Projects.Any())
        {
            db.Projects.AddRange(
                new Project { Name = "Nimbus Notes", NameFa = "یادداشت‌های نیمبوس", Summary = "A minimal note-taking app with offline sync.", SummaryFa = "برنامهٔ یادداشت‌برداری مینیمال با همگام‌سازی آفلاین.", Description = "Nimbus is a clean, keyboard-first notes app. It works fully offline, syncs when a connection returns, and keeps everything local-first.", DescriptionFa = "نیمبوس یک برنامهٔ یادداشت‌برداری تمیز و مبتنی بر کیبورد است؛ کاملاً آفلاین کار می‌کند، هنگام اتصال همگام می‌شود و همه‌چیز را محلی نگه می‌دارد.", TagsJson = "[\"React\",\"PWA\"]", Order = 1 },
                new Project { Name = "Orbit Dashboard", NameFa = "داشبورد اوربیت", Summary = "Analytics dashboard with realtime charts.", SummaryFa = "داشبورد تحلیلی با نمودارهای زنده.", Description = "Orbit turns raw event streams into live charts. The dashboard streams metrics over WebSockets and renders them with canvas charts.", DescriptionFa = "اوربیت جریان رویدادهای خام را به نمودارهای زنده تبدیل می‌کند؛ داده‌ها از طریق WebSocket پخش و با نمودارهای Canvas نمایش داده می‌شوند.", TagsJson = "[\"TypeScript\",\"Charts\"]", Order = 2 },
                new Project { Name = "Fable Landing", NameFa = "لندینگ فیبل", Summary = "Story-driven landing page for an indie game.", SummaryFa = "صفحهٔ فرود روایت‌محور برای یک بازی مستقل.", Description = "A scroll-driven landing page that tells the game's story scene by scene with subtle parallax and transition animations.", DescriptionFa = "یک صفحهٔ فرود مبتنی بر اسکرول که داستان بازی را صحنه‌به‌صحنه با افکت پارالاکس و انیمیشن‌های نرم روایت می‌کند.", TagsJson = "[\"Animation\",\"CSS\"]", Order = 3 }
            );
            await db.SaveChangesAsync();
        }
    }
}
