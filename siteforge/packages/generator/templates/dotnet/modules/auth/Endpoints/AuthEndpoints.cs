using Api.Data;
using Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public record RegisterRequest(string Email, string Password);
public record ClaimAdminRequest(string Code);

public static class AuthEndpoints
{
    public static async Task<User?> GetUserFromRequestAsync(HttpContext http, AppDbContext db)
    {
        var header = http.Request.Headers.Authorization.ToString();
        var tokenValue = header.StartsWith("Bearer ") ? header["Bearer ".Length..].Trim() : string.Empty;
        if (tokenValue.Length == 0) return null;
        var token = await db.Tokens.Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == tokenValue && t.ExpiresAt > DateTime.UtcNow);
        return token?.User;
    }

    public static void MapAuthEndpoints(this WebApplication app)
    {
        app.MapPost("/api/auth/register", async (RegisterRequest request, AppDbContext db, PasswordHasher<User> hasher) =>
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var at = email.IndexOf('@');
            if (at < 1 || !email[(at + 1)..].Contains('.'))
            {
                return Results.BadRequest(new { message = "Please enter a valid email address." });
            }
            if (request.Password.Length < 6)
            {
                return Results.BadRequest(new { message = "Password must be at least 6 characters." });
            }
            if (await db.Users.AnyAsync(u => u.Email == email))
            {
                return Results.Conflict(new { message = "An account with this email already exists." });
            }

            // Public registration NEVER grants admin. Every new account is a
            // plain customer; the owner claims admin once via claim-admin
            // (setup code) or the promote-admin CLI command.
            var user = new User { Email = email, IsAdmin = false };
            user.PasswordHash = hasher.HashPassword(user, request.Password);
            db.Users.Add(user);
            await db.SaveChangesAsync();

            var token = new Token { Id = Guid.NewGuid().ToString("N"), UserId = user.Id, ExpiresAt = DateTime.UtcNow.AddDays(30) };
            db.Tokens.Add(token);
            await db.SaveChangesAsync();
            return Results.Ok(new { token = token.Id, email = user.Email });
        });

        app.MapPost("/api/auth/login", async (RegisterRequest request, AppDbContext db, PasswordHasher<User> hasher) =>
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user is null ||
                hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password) == PasswordVerificationResult.Failed)
            {
                return Results.Json(new { message = "Invalid credentials." }, statusCode: 400);
            }

            var token = new Token { Id = Guid.NewGuid().ToString("N"), UserId = user.Id, ExpiresAt = DateTime.UtcNow.AddDays(30) };
            db.Tokens.Add(token);
            await db.SaveChangesAsync();
            return Results.Ok(new { token = token.Id, email = user.Email });
        });

        app.MapGet("/api/auth/me", async (HttpContext http, AppDbContext db) =>
        {
            var user = await GetUserFromRequestAsync(http, db);
            return user is null
                ? Results.Unauthorized()
                : Results.Ok(new { email = user.Email, isAdmin = user.IsAdmin });
        });

        app.MapDelete("/api/auth/logout", async (HttpContext http, AppDbContext db) =>
        {
            var header = http.Request.Headers.Authorization.ToString();
            var tokenValue = header.StartsWith("Bearer ") ? header["Bearer ".Length..].Trim() : string.Empty;
            if (tokenValue.Length > 0)
            {
                await db.Tokens.Where(t => t.Id == tokenValue).ExecuteDeleteAsync();
            }
            return Results.NoContent();
        });

        // Public, boolean-only flag so the UI can hide the one-time claim
        // card once an admin exists (no emails or counts leak).
        app.MapGet("/api/auth/admin-status", async (AppDbContext db) =>
        {
            return Results.Ok(new { hasAdmin = await db.Users.AnyAsync(u => u.IsAdmin) });
        });

        // One-time admin bootstrap: an authenticated user presents the owner
        // setup code (AdminAccessCode chosen at site creation). Succeeds only
        // while zero admins exist; afterwards it returns 410 and role changes
        // go through an existing admin.
        app.MapPost("/api/auth/claim-admin", async (ClaimAdminRequest request, HttpContext http, AppDbContext db, IConfiguration config) =>
        {
            var user = await GetUserFromRequestAsync(http, db);
            if (user is null) return Results.Unauthorized();
            var expected = config["AdminAccessCode"] ?? "";
            if (expected.Length == 0)
                return Results.Json(new { message = "Owner setup is not configured for this site." }, statusCode: 403);
            if ((request.Code ?? "").Trim() != expected)
                return Results.Json(new { message = "Wrong setup code." }, statusCode: 403);
            await using var tx = await db.Database.BeginTransactionAsync();
            if (await db.Users.AnyAsync(u => u.IsAdmin))
            {
                await tx.RollbackAsync();
                return Results.Json(new { message = "An admin already exists. Ask an admin to promote you." }, statusCode: 410);
            }
            user.IsAdmin = true;
            await db.SaveChangesAsync();
            await tx.CommitAsync();
            return Results.Ok(new { email = user.Email, isAdmin = true });
        });
    }
}
