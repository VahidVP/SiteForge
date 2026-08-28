using System.Text.Json;
using Api.Data;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public record CheckoutRequest(int[] Items);
public record TicketCreateRequest(string Subject, string Body);
public record ReplyRequest(string Body);
public record PaymentSettingsRequest(bool Enabled, bool Sandbox, string MerchantId);

public static class StoreEndpoints
{
    public static async Task<User?> GetUserFromRequestAsync(HttpContext http, AppDbContext db)
        => await AuthEndpoints.GetUserFromRequestAsync(http, db);

    public static async Task<bool> IsAdminAsync(HttpContext http, AppDbContext db)
    {
        var user = await GetUserFromRequestAsync(http, db);
        if (user is { IsAdmin: true }) return true;
        var header = http.Request.Headers.Authorization.ToString();
        var value = header.StartsWith("Bearer ") ? header["Bearer ".Length..].Trim() : string.Empty;
        if (value.Length == 0) return false;
        return await db.OwnerTokens.AnyAsync(t => t.Id == value && t.ExpiresAt > DateTime.UtcNow);
    }

    public static void MapStoreEndpoints(this WebApplication app)
    {
        app.MapGet("/api/payments/status", async (AppDbContext db) =>
        {
            var s = await GetPaymentSettingAsync(db);
            return Results.Ok(new { enabled = s.Enabled && s.MerchantId.Length > 0, sandbox = s.Sandbox });
        });

        app.MapGet("/api/payment/mock", async (HttpContext http, AppDbContext db) =>
        {
            var code = http.Request.Query["order"].ToString();
            var html = $@"<!doctype html><html><head><meta charset='utf-8'><title>Mock Gateway</title>
<style>body{{font-family:sans-serif;display:grid;place-items:center;height:100vh;background:#10131a;color:#fff}}
a{{display:block;margin:8px;padding:14px 30px;border-radius:10px;text-decoration:none;font-weight:bold;text-align:center}}
.ok{{background:#10b981;color:#04281a}}.no{{background:#f87171;color:#2b0505}}</style></head>
<body><div style='text-align:center'><h2>Sandbox Mock Gateway</h2><p>Order {code}</p>
<a class='ok' href='/api/payment/callback?order={code}&Status=OK'>Simulate SUCCESS</a>
<a class='no' href='/api/payment/callback?order={code}&Status=NOK'>Simulate FAILURE</a></div></body></html>";
            return Results.Content(html, "text/html");
        });

        app.MapGet("/api/payment/callback", async (HttpContext http, AppDbContext db, IConfiguration config) =>
        {
            var code = http.Request.Query["order"].ToString();
            var statusParam = http.Request.Query["Status"].ToString();
            var authority = http.Request.Query["Authority"].ToString();
            var order = await db.Orders.FirstOrDefaultAsync(o => o.Code == code);
            if (order is not null && order.Status == "pending")
            {
                var setting = await GetPaymentSettingAsync(db);
                bool ok; string refId;
                if (setting.Enabled && setting.MerchantId.Length > 0 && authority.Length > 0)
                {
                    (ok, refId) = await ZarinpalVerifyAsync(setting, order.TotalAmount, authority);
                }
                else
                {
                    ok = statusParam == "OK";
                    refId = ok ? Guid.NewGuid().ToString("N")[..8].ToUpper() : "";
                }
                if (ok) { order.Status = "paid"; order.RefId = refId; }
                else if (statusParam.Length > 0 || authority.Length > 0) { order.Status = "failed"; }
                await db.SaveChangesAsync();
            }
            return Results.Redirect($"http://localhost:5173/payment/result?order={Uri.EscapeDataString(code)}");
        });

        app.MapPost("/api/checkout", async (CheckoutRequest request, HttpContext http, AppDbContext db) =>
        {
            var user = await GetUserFromRequestAsync(http, db);
            if (user is null) return Results.Unauthorized();
            var ids = request.Items ?? Array.Empty<int>();
            if (ids.Length == 0) return Results.BadRequest(new { message = "Cart is empty." });
            var products = await db.Products.Where(p => ids.Contains(p.Id)).ToListAsync();
            if (products.Count == 0) return Results.BadRequest(new { message = "No valid products." });

            var total = products.Sum(p => p.Price);
            var snapshot = JsonSerializer.Serialize(products.Select(p => new { p.Id, p.Name, Price = p.Price }));
            var order = new Order
            {
                Code = "ORD-" + Guid.NewGuid().ToString("N")[..8].ToUpper(),
                UserId = user.Id,
                TotalAmount = total,
                ItemsSnapshot = snapshot
            };
            db.Orders.Add(order);
            await db.SaveChangesAsync();

            var setting = await GetPaymentSettingAsync(db);
            if (!setting.Enabled || setting.MerchantId.Length == 0)
            {
                return Results.Ok(new { mode = "mock", url = $"/api/payment/mock?order={order.Code}" });
            }

            try
            {
                var callback = $"http://localhost:8000/api/payment/callback?order={order.Code}";
                using var httpClient = new HttpClient();
                var payload = JsonSerializer.Serialize(new
                {
                    merchant_id = setting.MerchantId,
                    amount = (int)total,
                    currency = "IRT",
                    description = $"Order {order.Code}",
                    callback_url = callback
                });
                var response = await httpClient.PostAsync(
                    $"{ZarinpalBase(setting)}/pg/v4/payment/request.json",
                    new StringContent(payload, System.Text.Encoding.UTF8, "application/json"));
                var body = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(body);
                var authority = doc.RootElement.GetProperty("data").GetProperty("authority").GetString();
                order.Authority = authority ?? "";
                await db.SaveChangesAsync();
                return Results.Ok(new { mode = "zarinpal", url = $"{ZarinpalBase(setting)}/pg/StartPay/{authority}" });
            }
            catch (Exception ex)
            {
                order.Status = "failed";
                await db.SaveChangesAsync();
                return Results.Json(new { message = $"Gateway error: {ex.Message}" }, statusCode: 502);
            }
        });

        app.MapGet("/api/orders", async (HttpContext http, AppDbContext db) =>
        {
            var user = await GetUserFromRequestAsync(http, db);
            if (user is null) return Results.Unauthorized();
            var orders = await db.Orders.Where(o => o.UserId == user.Id).ToListAsync();
            return Results.Ok(orders.Select(ToOrderJson));
        });

        app.MapGet("/api/orders/{code}", async (string code, HttpContext http, AppDbContext db) =>
        {
            var user = await GetUserFromRequestAsync(http, db);
            if (user is null) return Results.Unauthorized();
            var order = await db.Orders.FirstOrDefaultAsync(o => o.Code == code);
            if (order is null) return Results.NotFound(new { message = "Not found." });
            if (order.UserId != user.Id && !user.IsAdmin) return Results.StatusCode(403);
            return Results.Ok(ToOrderJson(order));
        });

        app.MapPost("/api/support/tickets", async (TicketCreateRequest request, HttpContext http, AppDbContext db) =>
        {
            var user = await GetUserFromRequestAsync(http, db);
            if (user is null) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(request.Subject) || string.IsNullOrWhiteSpace(request.Body))
                return Results.BadRequest(new { message = "Subject and body are required." });
            var ticket = new Ticket { Subject = request.Subject.Trim(), UserId = user.Id };
            db.Tickets.Add(ticket);
            await db.SaveChangesAsync();
            db.TicketMessages.Add(new TicketMessage { TicketId = ticket.Id, Sender = "user", Body = request.Body.Trim() });
            await db.SaveChangesAsync();
            return Results.Ok(ToTicketJson(ticket, user.Email));
        });

        app.MapGet("/api/support/tickets", async (HttpContext http, AppDbContext db) =>
        {
            var user = await GetUserFromRequestAsync(http, db);
            if (user is null) return Results.Unauthorized();
            var tickets = await db.Tickets.Where(tk => tk.UserId == user.Id).ToListAsync();
            return Results.Ok(tickets.Select(tk => ToTicketJson(tk, user.Email)));
        });

        app.MapGet("/api/support/tickets/{id}", async (int id, HttpContext http, AppDbContext db) =>
        {
            var user = await GetUserFromRequestAsync(http, db);
            if (user is null) return Results.Unauthorized();
            var ticket = await db.Tickets.FindAsync(id);
            if (ticket is null) return Results.NotFound(new { message = "Not found." });
            if (ticket.UserId != user.Id && !user.IsAdmin) return Results.StatusCode(403);
            var messages = await db.TicketMessages.Where(m => m.TicketId == id).ToListAsync();
            return Results.Ok(messages.Select(ToMessageJson));
        });

        app.MapPost("/api/support/tickets/{id}/reply", async (int id, ReplyRequest request, HttpContext http, AppDbContext db) =>
        {
            var user = await GetUserFromRequestAsync(http, db);
            if (user is null) return Results.Unauthorized();
            var ticket = await db.Tickets.FindAsync(id);
            if (ticket is null) return Results.NotFound(new { message = "Not found." });
            if (ticket.UserId != user.Id && !user.IsAdmin) return Results.StatusCode(403);
            if (string.IsNullOrWhiteSpace(request.Body)) return Results.BadRequest(new { message = "Body required." });
            db.TicketMessages.Add(new TicketMessage { TicketId = id, Sender = user.IsAdmin ? "admin" : "user", Body = request.Body.Trim() });
            ticket.Status = user.IsAdmin ? "answered" : "open";
            await db.SaveChangesAsync();
            var messages = await db.TicketMessages.Where(m => m.TicketId == id).ToListAsync();
            return Results.Ok(messages.Select(ToMessageJson));
        });

        app.MapPost("/api/admin/products/{id}/images", async (int id, HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Results.Json(new { message = "Admin access required." }, statusCode: 403);
            var product = await db.Products.FindAsync(id);
            if (product is null) return Results.NotFound(new { message = "Product not found." });
            var form = await http.Request.ReadFormAsync();
            var files = form.Files.Where(f => f.Name == "images").ToList();
            if (files.Count == 0)
            {
                var single = form.Files.FirstOrDefault(f => f.Name == "image");
                if (single is not null) files = new List<IFormFile> { single };
                else if (form.Files.Count > 0) files = form.Files.ToList();
            }
            if (files.Count == 0)
                return Results.BadRequest(new { message = "No images provided. Use field 'images'." });
            if (files.Count > 6)
                return Results.BadRequest(new { message = "Up to 6 images allowed per request." });
            List<string> gallery;
            try { gallery = JsonSerializer.Deserialize<List<string>>(product.GalleryJson ?? "[]") ?? new List<string>(); }
            catch { gallery = new List<string>(); }
            if (gallery.Count + files.Count > 6)
                return Results.BadRequest(new { message = $"Gallery limit is 6 images. Currently has {gallery.Count}." });
            var webRoot = app.Environment.WebRootPath ?? Path.Combine(AppContext.BaseDirectory, "wwwroot");
            var productsDir = Path.Combine(webRoot, "media", "products");
            Directory.CreateDirectory(productsDir);
            foreach (var file in files)
            {
                var filename = $"{Guid.NewGuid():N}.webp";
                var dest = Path.Combine(productsDir, filename);
                try
                {
                    using var stream = new FileStream(dest, FileMode.Create);
                    await file.CopyToAsync(stream);
                }
                catch
                {
                    using var stream = new FileStream(dest, FileMode.Create);
                    await file.CopyToAsync(stream);
                }
                gallery.Add($"/media/products/{filename}");
            }
            product.GalleryJson = JsonSerializer.Serialize(gallery);
            if (gallery.Count > 0) product.ImageUrl = gallery[0];
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
                Gallery = gallery,
                product.Featured
            });
        });

        app.MapDelete("/api/admin/products/{id}/images", async (int id, HttpContext http, AppDbContext db) =>
        {
            if (!await IsAdminAsync(http, db)) return Results.Json(new { message = "Admin access required." }, statusCode: 403);
            var product = await db.Products.FindAsync(id);
            if (product is null) return Results.NotFound(new { message = "Product not found." });
            string? pathToRemove = null;
            if (http.Request.Query.TryGetValue("path", out var qv)) pathToRemove = qv.ToString();
            if (string.IsNullOrWhiteSpace(pathToRemove) && http.Request.HasFormContentType)
            {
                var form = await http.Request.ReadFormAsync();
                pathToRemove = form["path"].ToString();
            }
            if (string.IsNullOrWhiteSpace(pathToRemove))
                return Results.BadRequest(new { message = "Provide 'path' to remove." });
            List<string> gallery;
            try { gallery = JsonSerializer.Deserialize<List<string>>(product.GalleryJson ?? "[]") ?? new List<string>(); }
            catch { gallery = new List<string>(); }
            if (!gallery.Contains(pathToRemove))
                return Results.NotFound(new { message = "Image not in gallery." });
            gallery = gallery.Where(p => p != pathToRemove).ToList();
            try
            {
                var webRoot = app.Environment.WebRootPath ?? Path.Combine(AppContext.BaseDirectory, "wwwroot");
                var fileName = Path.GetFileName(pathToRemove);
                var candidate = Path.Combine(webRoot, "media", "products", fileName);
                if (File.Exists(candidate)) File.Delete(candidate);
            }
            catch { }
            product.GalleryJson = JsonSerializer.Serialize(gallery);
            if (gallery.Count > 0) product.ImageUrl = gallery[0];
            else if (product.ImageUrl.StartsWith("/media/")) product.ImageUrl = string.Empty;
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
                Gallery = gallery,
                product.Featured
            });
        });
    }

    public static object ToOrderJson(Order order)
    {
        return new
        {
            order.Code,
            order.Status,
            TotalAmount = order.TotalAmount,
            order.RefId,
            order.ItemsSnapshot,
            order.CreatedAt,
            UserEmail = order.User?.Email
        };
    }

    public static object ToTicketJson(Ticket ticket, string? email = null)
    {
        return new { ticket.Id, ticket.Subject, ticket.Status, ticket.CreatedAt, UserEmail = email };
    }

    public static object ToMessageJson(TicketMessage message)
    {
        return new { message.Id, message.Sender, message.Body, message.CreatedAt };
    }

    public static async Task<PaymentSetting> GetPaymentSettingAsync(AppDbContext db)
    {
        var setting = await db.PaymentSettings.FirstOrDefaultAsync();
        if (setting is null)
        {
            setting = new PaymentSetting();
            db.PaymentSettings.Add(setting);
            await db.SaveChangesAsync();
        }
        return setting;
    }

    private static string ZarinpalBase(PaymentSetting setting)
        => setting.Sandbox ? "https://sandbox.zarinpal.com" : "https://payment.zarinpal.com";

    private static async Task<(bool ok, string refId)> ZarinpalVerifyAsync(PaymentSetting setting, decimal amount, string authority)
    {
        using var httpClient = new HttpClient();
        var payload = JsonSerializer.Serialize(new { merchant_id = setting.MerchantId, amount = (int)amount, authority });
        var response = await httpClient.PostAsync(
            $"{ZarinpalBase(setting)}/pg/v4/payment/verify.json",
            new StringContent(payload, System.Text.Encoding.UTF8, "application/json"));
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var data = doc.RootElement.GetProperty("data");
        var code = data.GetProperty("code").GetInt32();
        if (code is 100 or 101)
        {
            var refId = data.TryGetProperty("ref_id", out var r) ? r.ToString() : "";
            return (true, refId);
        }
        return (false, "");
    }
}
