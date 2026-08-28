using Api.Models;

namespace Api.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();

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
    }
}
