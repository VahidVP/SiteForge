using System.Text.Json;
using Api.Data;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public record OwnerLoginRequest(string Code);

public static class AdminEndpoints
{
    public static async Task<bool> IsAdminAsync(HttpContext http, AppDbContext db)
        => await StoreEndpoints.IsAdminAsync(http, db);

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
        app.MapGet("/api/admin/products", async (HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            var products = await db.Products.OrderBy(p => p.Id).ToListAsync();
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

        app.MapPost("/api/admin/products", async (CreateProductRequest request, HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            if (string.IsNullOrWhiteSpace(request.Name))
                return Results.BadRequest(new { message = "Name is required." });
            string detailsJson = "{}";
            if (request.Details is not null)
            {
                try { detailsJson = JsonSerializer.Serialize(request.Details); } catch { detailsJson = "{}"; }
            }
            else if (!string.IsNullOrWhiteSpace(request.DetailsJson))
            {
                try
                {
                    var parsed = JsonSerializer.Deserialize<Dictionary<string,string>>(request.DetailsJson);
                    detailsJson = JsonSerializer.Serialize(parsed ?? new Dictionary<string,string>());
                }
                catch { detailsJson = request.DetailsJson; }
            }
            var product = new Product
            {
                Name = request.Name.Trim(),
                NameFa = request.NameFa?.Trim() ?? string.Empty,
                Description = request.Description?.Trim() ?? string.Empty,
                DescriptionFa = request.DescriptionFa?.Trim() ?? string.Empty,
                Price = request.Price,
                ImageUrl = request.ImageUrl?.Trim() ?? string.Empty,
                GalleryJson = "[]",
                DetailsJson = detailsJson,
                Featured = request.Featured
            };
            db.Products.Add(product);
            await db.SaveChangesAsync();
            return Results.Ok(new
            {
                product.Id,
                product.Name,
                product.NameFa,
                product.Description,
                product.DescriptionFa,
                product.Price,
                product.ImageUrl,
                Gallery = ParseGallery(product.GalleryJson),
                GalleryJson = product.GalleryJson,
                Details = ParseDetails(product.DetailsJson),
                DetailsJson = product.DetailsJson,
                product.Featured
            });
        });

        app.MapPut("/api/admin/products/{id}", async (int id, HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            var product = await db.Products.FindAsync(id);
            if (product is null) return Results.NotFound(new { message = "Product not found." });
            http.Request.EnableBuffering();
            string bodyText = "";
            try
            {
                using var reader = new StreamReader(http.Request.Body, leaveOpen:true);
                bodyText = await reader.ReadToEndAsync();
                http.Request.Body.Position = 0;
            } catch {}
            var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            UpdateProductRequest? req = null;
            try { req = JsonSerializer.Deserialize<UpdateProductRequest>(bodyText, opts); } catch {}
            bool handled = false;
            if (req is not null && (req.Name != null || req.NameFa != null || req.Description != null || req.DescriptionFa != null || req.Price.HasValue || req.ImageUrl != null || req.Featured.HasValue || req.Details != null || req.DetailsJson != null))
            {
                if (!string.IsNullOrWhiteSpace(req.Name)) product.Name = req.Name.Trim();
                if (req.NameFa is not null) product.NameFa = req.NameFa.Trim();
                if (req.Description is not null) product.Description = req.Description.Trim();
                if (req.DescriptionFa is not null) product.DescriptionFa = req.DescriptionFa.Trim();
                if (req.Price.HasValue) product.Price = req.Price.Value;
                if (req.ImageUrl is not null) product.ImageUrl = req.ImageUrl.Trim();
                if (req.Featured.HasValue) product.Featured = req.Featured.Value;
                if (req.Details is not null)
                {
                    try { product.DetailsJson = JsonSerializer.Serialize(req.Details); handled = true; } catch {}
                }
                else if (!string.IsNullOrWhiteSpace(req.DetailsJson))
                {
                    try
                    {
                        var parsed = JsonSerializer.Deserialize<Dictionary<string,string>>(req.DetailsJson, opts);
                        product.DetailsJson = JsonSerializer.Serialize(parsed ?? new Dictionary<string,string>());
                        handled = true;
                    }
                    catch { product.DetailsJson = req.DetailsJson; handled = true; }
                }
            }
            if (!handled)
            {
                try
                {
                    using var doc = JsonDocument.Parse(bodyText);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("name", out var v) && v.ValueKind == JsonValueKind.String) product.Name = v.GetString()?.Trim() ?? product.Name;
                    if (root.TryGetProperty("nameFa", out var vnfa) && vnfa.ValueKind == JsonValueKind.String) product.NameFa = vnfa.GetString()?.Trim() ?? product.NameFa;
                    if (root.TryGetProperty("name_fa", out var vnfa2) && vnfa2.ValueKind == JsonValueKind.String) product.NameFa = vnfa2.GetString()?.Trim() ?? product.NameFa;
                    if (root.TryGetProperty("description", out var vd) && vd.ValueKind == JsonValueKind.String) product.Description = vd.GetString() ?? product.Description;
                    if (root.TryGetProperty("descriptionFa", out var vdfa) && vdfa.ValueKind == JsonValueKind.String) product.DescriptionFa = vdfa.GetString() ?? product.DescriptionFa;
                    if (root.TryGetProperty("description_fa", out var vdfa2) && vdfa2.ValueKind == JsonValueKind.String) product.DescriptionFa = vdfa2.GetString() ?? product.DescriptionFa;
                    if (root.TryGetProperty("price", out var vp) && vp.ValueKind == JsonValueKind.Number) product.Price = vp.GetDecimal();
                    if (root.TryGetProperty("image_url", out var vi) && vi.ValueKind == JsonValueKind.String) product.ImageUrl = vi.GetString()?.Trim() ?? product.ImageUrl;
                    if (root.TryGetProperty("imageUrl", out var viu) && viu.ValueKind == JsonValueKind.String) product.ImageUrl = viu.GetString()?.Trim() ?? product.ImageUrl;
                    if (root.TryGetProperty("ImageUrl", out var vi2) && vi2.ValueKind == JsonValueKind.String) product.ImageUrl = vi2.GetString()?.Trim() ?? product.ImageUrl;
                    if (root.TryGetProperty("featured", out var vf) && (vf.ValueKind == JsonValueKind.True || vf.ValueKind == JsonValueKind.False)) product.Featured = vf.GetBoolean();
                    if (root.TryGetProperty("Featured", out var vf2) && (vf2.ValueKind == JsonValueKind.True || vf2.ValueKind == JsonValueKind.False)) product.Featured = vf2.GetBoolean();
                    if (root.TryGetProperty("details", out var vdet) && vdet.ValueKind == JsonValueKind.Object)
                    {
                        var dict = new Dictionary<string,string>();
                        foreach (var prop in vdet.EnumerateObject()) dict[prop.Name] = prop.Value.GetString() ?? prop.Value.ToString();
                        product.DetailsJson = JsonSerializer.Serialize(dict);
                    }
                    else if (root.TryGetProperty("Details", out var vdet2) && vdet2.ValueKind == JsonValueKind.Object)
                    {
                        var dict = new Dictionary<string,string>();
                        foreach (var prop in vdet2.EnumerateObject()) dict[prop.Name] = prop.Value.GetString() ?? prop.Value.ToString();
                        product.DetailsJson = JsonSerializer.Serialize(dict);
                    }
                    else if (root.TryGetProperty("DetailsJson", out var vdjs) && vdjs.ValueKind == JsonValueKind.String)
                    {
                        product.DetailsJson = vdjs.GetString() ?? "{}";
                    }
                    else if (root.TryGetProperty("detailsJson", out var vdjs2) && vdjs2.ValueKind == JsonValueKind.String)
                    {
                        product.DetailsJson = vdjs2.GetString() ?? "{}";
                    }
                    else if (root.TryGetProperty("DetailsJson", out var vdjs3) && vdjs3.ValueKind == JsonValueKind.Object)
                    {
                        var dict = new Dictionary<string,string>();
                        foreach (var prop in vdjs3.EnumerateObject()) dict[prop.Name] = prop.Value.GetString() ?? prop.Value.ToString();
                        product.DetailsJson = JsonSerializer.Serialize(dict);
                    }
                }
                catch {}
            }
            await db.SaveChangesAsync();
            return Results.Ok(new
            {
                product.Id,
                product.Name,
                product.NameFa,
                product.Description,
                product.DescriptionFa,
                product.Price,
                product.ImageUrl,
                Gallery = ParseGallery(product.GalleryJson),
                GalleryJson = product.GalleryJson,
                Details = ParseDetails(product.DetailsJson),
                DetailsJson = product.DetailsJson,
                product.Featured
            });
        });

        app.MapDelete("/api/admin/products/{id}", async (int id, HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            var product = await db.Products.FindAsync(id);
            if (product is null) return Results.NotFound(new { message = "Product not found." });
            db.Products.Remove(product);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        app.MapGet("/api/admin/orders", async (HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            var orders = await db.Orders.Include(o => o.User).OrderByDescending(o => o.CreatedAt).ToListAsync();
            return Results.Ok(orders.Select(StoreEndpoints.ToOrderJson));
        });

        app.MapGet("/api/admin/tickets", async (HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            var tickets = await db.Tickets.Include(tk => tk.User).OrderByDescending(tk => tk.CreatedAt).ToListAsync();
            return Results.Ok(tickets.Select(tk => StoreEndpoints.ToTicketJson(tk, tk.User?.Email)));
        });

        app.MapGet("/api/admin/tickets/{id}", async (int id, HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            var messages = await db.TicketMessages.Where(m => m.TicketId == id).ToListAsync();
            return Results.Ok(messages.Select(StoreEndpoints.ToMessageJson));
        });

        app.MapPost("/api/admin/tickets/{id}/reply", async (int id, ReplyRequest request, HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            if (string.IsNullOrWhiteSpace(request.Body)) return Results.BadRequest(new { message = "Body required." });
            db.TicketMessages.Add(new TicketMessage { TicketId = id, Sender = "admin", Body = request.Body.Trim() });
            await db.Tickets.Where(tk => tk.Id == id).ExecuteUpdateAsync(s => s.SetProperty(tk => tk.Status, "answered"));
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        app.MapPost("/api/admin/tickets/{id}/close", async (int id, HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            await db.Tickets.Where(tk => tk.Id == id).ExecuteUpdateAsync(s => s.SetProperty(tk => tk.Status, "closed"));
            return Results.NoContent();
        });

        app.MapGet("/api/admin/settings/payment", async (HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            var setting = await StoreEndpoints.GetPaymentSettingAsync(db);
            return Results.Ok(new { enabled = setting.Enabled, sandbox = setting.Sandbox, merchantId = setting.MerchantId });
        });

        app.MapPut("/api/admin/settings/payment", async (PaymentSettingsRequest request, HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Deny();
            var setting = await StoreEndpoints.GetPaymentSettingAsync(db);
            setting.Enabled = request.Enabled;
            setting.Sandbox = request.Sandbox;
            setting.MerchantId = request.MerchantId?.Trim() ?? string.Empty;
            await db.SaveChangesAsync();
            return Results.Ok(new { enabled = setting.Enabled, sandbox = setting.Sandbox, merchantId = setting.MerchantId });
        });
    }

    private static async Task<string?> CurrentEmailAsync(HttpContext http, AppDbContext db)
    {
        var user = await AuthEndpoints.GetUserFromRequestAsync(http, db);
        return user?.Email;
    }

    private static List<string> ParseGallery(string json)
    {
        try { return JsonSerializer.Deserialize<List<string>>(json ?? "[]") ?? new List<string>(); }
        catch { return new List<string>(); }
    }

    private static Dictionary<string,string> ParseDetails(string json)
    {
        try { return JsonSerializer.Deserialize<Dictionary<string,string>>(json ?? "{}") ?? new Dictionary<string,string>(); }
        catch { return new Dictionary<string,string>(); }
    }

    private static IResult Deny() => Results.Json(new { message = "Admin access required." }, statusCode: 403);
}

public record CreateProductRequest(string Name, string Description, decimal Price, string ImageUrl, bool Featured, string? NameFa, string? DescriptionFa, Dictionary<string,string>? Details, string? DetailsJson);
public record UpdateProductRequest(string? Name, string? NameFa, string? Description, string? DescriptionFa, decimal? Price, string? ImageUrl, bool? Featured, Dictionary<string,string>? Details, string? DetailsJson);
