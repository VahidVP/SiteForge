using Api.Data;
using Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public record RegisterRequest(string Email, string Password);

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

            var isFirstUser = !db.Users.Any();
            var user = new User { Email = email, IsAdmin = isFirstUser };
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
    }
}
