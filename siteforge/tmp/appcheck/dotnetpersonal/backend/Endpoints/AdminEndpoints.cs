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
        var user = await AuthEndpoints.GetUserFromRequestAsync(http, db);
        if (user is not null && user.IsAdmin) return true;
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

        app.MapGet("/api/admin/messages", async (HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            var messages = await db.ContactMessages.OrderByDescending(m => m.CreatedAt).ToListAsync();
            return Results.Ok(messages);
        });
        app.MapGet("/api/admin/users", async (HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            var users = await db.Users.OrderBy(u => u.Id).Select(u => new { u.Id, u.Email, IsAdmin = u.IsAdmin }).ToListAsync();
            return Results.Ok(users);
        });

        app.MapDelete("/api/admin/users/{id}", async (int id, HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            var user = await db.Users.FindAsync(id);
            if (user is null) return Results.NotFound(new { message = "User not found." });
            var currentEmail = await CurrentEmailAsync(http, db);
            if (user.Email == currentEmail) return Results.BadRequest(new { message = "You cannot delete your own account." });
            db.Users.Remove(user);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
        app.MapGet("/api/admin/projects", async (HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            var projects = await db.Projects.OrderBy(p => p.Order).ThenBy(p => p.Id).ToListAsync();
            return Results.Ok(projects.Select(p => new
            {
                p.Id, p.Name, p.NameFa, p.Summary, p.SummaryFa, p.Description, p.DescriptionFa,
                Tags = ParseList(p.TagsJson), Gallery = ParseList(p.GalleryJson), p.Order
            }));
        });

        app.MapPost("/api/admin/projects", async (CreateProjectRequest request, HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            if (string.IsNullOrWhiteSpace(request.Name))
                return Results.BadRequest(new { message = "Name is required." });
            var project = new Project
            {
                Name = request.Name.Trim(),
                NameFa = request.NameFa?.Trim() ?? string.Empty,
                Summary = request.Summary?.Trim() ?? string.Empty,
                SummaryFa = request.SummaryFa?.Trim() ?? string.Empty,
                Description = request.Description?.Trim() ?? string.Empty,
                DescriptionFa = request.DescriptionFa?.Trim() ?? string.Empty,
                TagsJson = request.Tags is not null ? JsonSerializer.Serialize(request.Tags) : "[]",
                GalleryJson = request.Gallery is not null ? JsonSerializer.Serialize(request.Gallery) : "[]",
                Order = request.Order
            };
            db.Projects.Add(project);
            await db.SaveChangesAsync();
            return Results.Ok(new
            {
                project.Id, project.Name, project.NameFa, project.Summary, project.SummaryFa,
                project.Description, project.DescriptionFa,
                Tags = ParseList(project.TagsJson), Gallery = ParseList(project.GalleryJson), project.Order
            });
        });

        app.MapPut("/api/admin/projects/{id}", async (int id, UpdateProjectRequest request, HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            var project = await db.Projects.FindAsync(id);
            if (project is null) return Results.NotFound(new { message = "Project not found." });
            if (request.Name is not null) project.Name = request.Name.Trim();
            if (request.NameFa is not null) project.NameFa = request.NameFa.Trim();
            if (request.Summary is not null) project.Summary = request.Summary.Trim();
            if (request.SummaryFa is not null) project.SummaryFa = request.SummaryFa.Trim();
            if (request.Description is not null) project.Description = request.Description.Trim();
            if (request.DescriptionFa is not null) project.DescriptionFa = request.DescriptionFa.Trim();
            if (request.Tags is not null) project.TagsJson = JsonSerializer.Serialize(request.Tags);
            if (request.Gallery is not null) project.GalleryJson = JsonSerializer.Serialize(request.Gallery);
            if (request.Order.HasValue) project.Order = request.Order.Value;
            await db.SaveChangesAsync();
            return Results.Ok(new
            {
                project.Id, project.Name, project.NameFa, project.Summary, project.SummaryFa,
                project.Description, project.DescriptionFa,
                Tags = ParseList(project.TagsJson), Gallery = ParseList(project.GalleryJson), project.Order
            });
        });

        app.MapDelete("/api/admin/projects/{id}", async (int id, HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            var project = await db.Projects.FindAsync(id);
            if (project is null) return Results.NotFound(new { message = "Project not found." });
            db.Projects.Remove(project);
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

    private static async Task<string?> CurrentEmailAsync(HttpContext http, AppDbContext db)
    {
        var user = await AuthEndpoints.GetUserFromRequestAsync(http, db);
        return user?.Email;
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