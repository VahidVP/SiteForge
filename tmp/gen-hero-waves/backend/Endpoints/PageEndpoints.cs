using Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public static class PageEndpoints
{
    public static void MapPageEndpoints(this WebApplication app)
    {
        app.MapGet("/api/pages/{slug}", async (string slug, AppDbContext db) =>
        {
            var page = await db.Pages.FirstOrDefaultAsync(p => p.Slug == slug);
            return page is null
                ? Results.NotFound(new { message = $"Page '{slug}' not found." })
                : Results.Ok(new { page.Slug, page.Title, page.Content });
        });
    }
}
