using System.Text.Json;
using Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public static class ProductEndpoints
{
    private static List<string> ParseGallery(string json)
    {
        try
        {
            var list = JsonSerializer.Deserialize<List<string>>(json ?? "[]");
            return list ?? new List<string>();
        }
        catch { return new List<string>(); }
    }

    private static Dictionary<string,string> ParseDetails(string json)
    {
        try
        {
            var dict = JsonSerializer.Deserialize<Dictionary<string,string>>(json ?? "{}");
            return dict ?? new Dictionary<string,string>();
        }
        catch { return new Dictionary<string,string>(); }
    }

    public static void MapProductEndpoints(this WebApplication app)
    {
        app.MapGet("/api/products", async (HttpContext http, AppDbContext db) =>
        {
            var lang = http.Request.Query["lang"].ToString();
            var products = await db.Products
                .OrderByDescending(p => p.Featured)
                .ThenBy(p => p.Name)
                .ToListAsync();
            if (lang == "fa")
            {
                return Results.Ok(products.Select(p => new
                {
                    p.Id,
                    Name = string.IsNullOrWhiteSpace(p.NameFa) ? p.Name : p.NameFa,
                    Description = string.IsNullOrWhiteSpace(p.DescriptionFa) ? p.Description : p.DescriptionFa,
                    p.Price,
                    p.ImageUrl,
                    Gallery = ParseGallery(p.GalleryJson),
                    Details = ParseDetails(p.DetailsJson),
                    DetailsJson = p.DetailsJson,
                    p.Featured
                }));
            }
            return Results.Ok(products.Select(p => new
            {
                p.Id,
                p.Name,
                p.NameFa,
                p.Description,
                p.DescriptionFa,
                p.Price,
                p.ImageUrl,
                Gallery = ParseGallery(p.GalleryJson),
                GalleryJson = p.GalleryJson,
                Details = ParseDetails(p.DetailsJson),
                DetailsJson = p.DetailsJson,
                p.Featured
            }));
        });

        app.MapGet("/api/products/{id:int}", async (int id, HttpContext http, AppDbContext db) =>
        {
            var lang = http.Request.Query["lang"].ToString();
            var p = await db.Products.FindAsync(id);
            if (p is null) return Results.NotFound(new { message = "Product not found." });
            var gallery = ParseGallery(p.GalleryJson);
            var details = ParseDetails(p.DetailsJson);
            if (lang == "fa")
            {
                return Results.Ok(new
                {
                    p.Id,
                    Name = string.IsNullOrWhiteSpace(p.NameFa) ? p.Name : p.NameFa,
                    p.NameFa,
                    Description = string.IsNullOrWhiteSpace(p.DescriptionFa) ? p.Description : p.DescriptionFa,
                    p.DescriptionFa,
                    p.Price,
                    p.ImageUrl,
                    Gallery = gallery,
                    GalleryJson = p.GalleryJson,
                    Details = details,
                    DetailsJson = p.DetailsJson,
                    p.Featured
                });
            }
            return Results.Ok(new
            {
                p.Id,
                p.Name,
                p.NameFa,
                p.Description,
                p.DescriptionFa,
                p.Price,
                p.ImageUrl,
                Gallery = gallery,
                GalleryJson = p.GalleryJson,
                Details = details,
                DetailsJson = p.DetailsJson,
                p.Featured
            });
        });
    }
}
