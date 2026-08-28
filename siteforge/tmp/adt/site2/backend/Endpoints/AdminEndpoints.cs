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

public record CreateProductRequest(string Name, string Description, decimal Price, string ImageUrl, bool Featured, string? NameFa, string? DescriptionFa, Dictionary<string,string>? Details, string? DetailsJson);
public record UpdateProductRequest(string? Name, string? NameFa, string? Description, string? DescriptionFa, decimal? Price, string? ImageUrl, bool? Featured, Dictionary<string,string>? Details, string? DetailsJson);