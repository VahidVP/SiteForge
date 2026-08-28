namespace Api.Models;

public class OwnerToken
{
    public string Id { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}
