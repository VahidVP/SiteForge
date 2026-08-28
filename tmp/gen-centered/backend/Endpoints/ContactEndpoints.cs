using Api.Data;

namespace Api.Endpoints;

public record ContactRequest(string Name, string Email, string Message);

public static class ContactEndpoints
{
    public static void MapContactEndpoints(this WebApplication app)
    {
        app.MapPost("/api/contact", async (ContactRequest request, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Message))
            {
                return Results.BadRequest(new { message = "All fields are required." });
            }

            db.ContactMessages.Add(new Models.ContactMessage
            {
                Name = request.Name.Trim(),
                Email = request.Email.Trim(),
                Message = request.Message.Trim()
            });
            await db.SaveChangesAsync();
            return Results.Ok(new { ok = true });
        });
    }
}
