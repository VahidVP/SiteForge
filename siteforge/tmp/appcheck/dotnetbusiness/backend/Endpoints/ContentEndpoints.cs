using System.Text.Json;
using Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public static class ContentEndpoints
{
    public static List<string> ParseGallery(string json)
    {
        try
        {
            var list = JsonSerializer.Deserialize<List<string>>(json ?? "[]");
            return list ?? new List<string>();
        }
        catch { return new List<string>(); }
    }

    public static List<string> ParseTags(string json)
    {
        try
        {
            var list = JsonSerializer.Deserialize<List<string>>(json ?? "[]");
            return list ?? new List<string>();
        }
        catch { return new List<string>(); }
    }

    public static void MapContentEndpoints(this WebApplication app)
    {
        app.MapGet("/api/services", async (AppDbContext db) =>
        {
            var services = await db.Services.OrderBy(s => s.Order).ThenBy(s => s.Id).ToListAsync();
            return Results.Ok(services.Select(s => new
            {
                s.Id,
                s.Title,
                s.TitleFa,
                s.Text,
                s.TextFa,
                s.Icon,
                Gallery = ParseGallery(s.GalleryJson)
            }));
        });

        app.MapGet("/api/services/{id:int}", async (int id, AppDbContext db) =>
        {
            var s = await db.Services.FindAsync(id);
            if (s is null) return Results.NotFound(new { message = "Service not found." });
            return Results.Ok(new
            {
                s.Id,
                s.Title,
                s.TitleFa,
                s.Text,
                s.TextFa,
                s.Icon,
                Gallery = ParseGallery(s.GalleryJson)
            });
        });
    }
}