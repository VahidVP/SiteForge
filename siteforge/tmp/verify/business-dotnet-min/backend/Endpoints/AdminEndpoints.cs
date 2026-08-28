using System.Text.Json;
using System.Text.Json.Nodes;
using Api.Data;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public record OwnerLoginRequest(string Code);

public static class AdminEndpoints
{
    public static async Task<bool> IsAdminAsync(HttpContext http, AppDbContext db)
    {
        var token = http.Request.Headers["Authorization"].ToString();
        if (string.IsNullOrEmpty(token)) return false;
        var id = token;
        if (token.StartsWith("Bearer ")) id = token["Bearer ".Length..].Trim();
        else if (token.StartsWith("Owner ")) id = token["Owner ".Length..].Trim();
        else return false;
        if (id.Length == 0) return false;
        if (await db.OwnerTokens.AnyAsync(t => t.Id == id)) return true;
        return false;
    }

    public static void MapAdminEndpoints(this WebApplication app)
    {
        app.MapPost("/api/owner/login", async (OwnerLoginRequest request, AppDbContext db, IConfiguration config) =>
        {
            var expected = config["AdminAccessCode"] ?? "";
            if (expected.Length == 0)
                return Results.Json(new { message = "Owner access is not configured for this site." }, statusCode: 403);
            if (request.Code?.Trim() != expected)
                return Results.Json(new { message = "Wrong code." }, statusCode: 400);
            var token = new OwnerToken { Id = Guid.NewGuid().ToString("N"), ExpiresAt = DateTime.UtcNow.AddDays(30) };
            db.OwnerTokens.Add(token);
            await db.SaveChangesAsync();
            return Results.Ok(new { token = token.Id });
        });

        app.MapGet("/api/admin/services", async (HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            var services = await db.Services.OrderBy(s => s.Order).ThenBy(s => s.Id).ToListAsync();
            return Results.Ok(services.Select(s => new
            {
                s.Id, s.Title, s.TitleFa, s.Text, s.TextFa, s.Icon,
                Gallery = ParseList(s.GalleryJson), s.Order
            }));
        });

        app.MapPost("/api/admin/services", async (CreateServiceRequest request, HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            if (string.IsNullOrWhiteSpace(request.Title))
                return Results.BadRequest(new { message = "Title is required." });
            var service = new Service
            {
                Title = request.Title.Trim(),
                TitleFa = request.TitleFa?.Trim() ?? string.Empty,
                Text = request.Text?.Trim() ?? string.Empty,
                TextFa = request.TextFa?.Trim() ?? string.Empty,
                Icon = request.Icon?.Trim() ?? string.Empty,
                GalleryJson = request.Gallery is not null ? JsonSerializer.Serialize(request.Gallery) : "[]",
                Order = request.Order
            };
            db.Services.Add(service);
            await db.SaveChangesAsync();
            return Results.Ok(new
            {
                service.Id, service.Title, service.TitleFa, service.Text, service.TextFa, service.Icon,
                Gallery = ParseList(service.GalleryJson), service.Order
            });
        });

        app.MapPut("/api/admin/services/{id}", async (int id, UpdateServiceRequest request, HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            var service = await db.Services.FindAsync(id);
            if (service is null) return Results.NotFound(new { message = "Service not found." });
            if (request.Title is not null) service.Title = request.Title.Trim();
            if (request.TitleFa is not null) service.TitleFa = request.TitleFa.Trim();
            if (request.Text is not null) service.Text = request.Text.Trim();
            if (request.TextFa is not null) service.TextFa = request.TextFa.Trim();
            if (request.Icon is not null) service.Icon = request.Icon.Trim();
            if (request.Gallery is not null) service.GalleryJson = JsonSerializer.Serialize(request.Gallery);
            if (request.Order.HasValue) service.Order = request.Order.Value;
            await db.SaveChangesAsync();
            return Results.Ok(new
            {
                service.Id, service.Title, service.TitleFa, service.Text, service.TextFa, service.Icon,
                Gallery = ParseList(service.GalleryJson), service.Order
            });
        });

        app.MapDelete("/api/admin/services/{id}", async (int id, HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            var service = await db.Services.FindAsync(id);
            if (service is null) return Results.NotFound(new { message = "Service not found." });
            db.Services.Remove(service);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
        app.MapGet("/api/admin/media", async (HttpContext http, IWebHostEnvironment env, AppDbContext db) =>
        {
            if (!await IsOwnerTokenAsync(http, db)) return Deny();
            var root = Path.Combine(env.WebRootPath ?? "wwwroot", "media");
            var files = new List<object>();
            if (Directory.Exists(root))
            {
                foreach (var file in Directory.EnumerateFiles(root, "*", SearchOption.AllDirectories))
                {
                    var ext = Path.GetExtension(file).ToLowerInvariant();
                    if (ext is ".webp" or ".png" or ".jpg" or ".jpeg" or ".svg" or ".gif")
                    {
                        var rel = Path.GetRelativePath(env.WebRootPath ?? "wwwroot", file).Replace('\\', '/');
                        files.Add(new { name = Path.GetFileName(file), url = "/" + rel });
                    }
                }
            }
            return Results.Ok(files);
        });

        app.MapPost("/api/admin/media", async (HttpContext http, IWebHostEnvironment env, AppDbContext db) =>
        {
            if (!await IsOwnerTokenAsync(http, db)) return Deny();
            var root = Path.Combine(env.WebRootPath ?? "wwwroot", "media");
            Directory.CreateDirectory(root);
            var saved = new List<object>();
            foreach (var file in http.Request.Form.Files)
            {
                if (saved.Count >= 8) break;
                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (ext is not (".webp" or ".png" or ".jpg" or ".jpeg" or ".svg" or ".gif")) continue;
                var name = Guid.NewGuid().ToString("N")[..12] + ext;
                var dest = Path.Combine(root, name);
                await using var stream = File.Create(dest);
                await file.CopyToAsync(stream);
                saved.Add(new { url = "/media/" + name });
            }
            return Results.Ok(saved);
        });
    }


    private static Task<bool> IsOwnerTokenAsync(HttpContext http, AppDbContext db)
    {
        var token = http.Request.Headers["Authorization"].ToString();
        if (string.IsNullOrEmpty(token) || !token.StartsWith("Owner "))
            return Task.FromResult(false);
        var id = token["Owner ".Length..].Trim();
        if (id.Length == 0) return Task.FromResult(false);
        return db.OwnerTokens.AnyAsync(t => t.Id == id);
    }

    private static List<string> ParseList(string json)
    {
        try { return JsonSerializer.Deserialize<List<string>>(json ?? "[]") ?? new List<string>(); }
        catch { return new List<string>(); }
    }

    private static List<string> ParseGallery(string json)
    {
        try { return JsonSerializer.Deserialize<List<string>>(json ?? "[]") ?? new List<string>(); }
        catch { return new List<string>(); }
    }

    private static JsonNode? ParseDetails(string json)
    {
        try { return JsonNode.Parse(json ?? "{}", documentOptions: new JsonDocumentOptions { AllowTrailingCommas = true }); }
        catch { return null; }
    }

    private static IResult Deny() => Results.Json(new { message = "Admin access required." }, statusCode: 403);
}

public record CreateProductRequest(string Name, string Description, decimal Price, string ImageUrl, bool Featured, string? NameFa, string? DescriptionFa, JsonNode? Details, string? DetailsJson, List<string>? Gallery);
public record UpdateProductRequest(string? Name, string? NameFa, string? Description, string? DescriptionFa, decimal? Price, string? ImageUrl, bool? Featured, JsonNode? Details, string? DetailsJson, List<string>? Gallery);
public record CreateProjectRequest(string Name, string? NameFa, string? Summary, string? SummaryFa, string? Description, string? DescriptionFa, List<string>? Tags, List<string>? Gallery, int Order);
public record UpdateProjectRequest(string? Name, string? NameFa, string? Summary, string? SummaryFa, string? Description, string? DescriptionFa, List<string>? Tags, List<string>? Gallery, int? Order);
public record CreateServiceRequest(string Title, string? TitleFa, string? Text, string? TextFa, string? Icon, List<string>? Gallery, int Order);
public record UpdateServiceRequest(string? Title, string? TitleFa, string? Text, string? TextFa, string? Icon, List<string>? Gallery, int? Order);