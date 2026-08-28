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
        app.MapGet("/api/projects", async (AppDbContext db) =>
        {
            var projects = await db.Projects.OrderBy(p => p.Order).ThenBy(p => p.Id).ToListAsync();
            return Results.Ok(projects.Select(p => new
            {
                p.Id,
                p.Name,
                p.NameFa,
                p.Summary,
                p.SummaryFa,
                p.Description,
                p.DescriptionFa,
                Tags = ParseTags(p.TagsJson),
                Gallery = ParseGallery(p.GalleryJson)
            }));
        });

        app.MapGet("/api/projects/{id:int}", async (int id, AppDbContext db) =>
        {
            var p = await db.Projects.FindAsync(id);
            if (p is null) return Results.NotFound(new { message = "Project not found." });
            return Results.Ok(new
            {
                p.Id,
                p.Name,
                p.NameFa,
                p.Summary,
                p.SummaryFa,
                p.Description,
                p.DescriptionFa,
                Tags = ParseTags(p.TagsJson),
                Gallery = ParseGallery(p.GalleryJson)
            });
        });
    }
}