namespace Api.Models;

public class PaymentSetting
{
    public int Id { get; set; }
    public bool Enabled { get; set; }
    public bool Sandbox { get; set; } = true;
    public string MerchantId { get; set; } = string.Empty;
}

public class Order
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public int UserId { get; set; }
    public User? User { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "pending";
    public string Authority { get; set; } = string.Empty;
    public string RefId { get; set; } = string.Empty;
    public string ItemsSnapshot { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Ticket
{
    public int Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Status { get; set; } = "open";
    public int UserId { get; set; }
    public User? User { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class TicketMessage
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public string Sender { get; set; } = "user";
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
