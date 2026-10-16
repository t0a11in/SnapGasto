namespace SnapGastosNet.Domain;

public enum Role { USER, ADMIN }
public enum IncomeType { TARJETA, FISICO }

public sealed class AppUser
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string? FirebaseUid { get; set; }
    public Role Role { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class Category
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Icon { get; set; }
    public string? ColorHex { get; set; }
}

public sealed class Expense
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public string Category { get; set; } = null!;
    public DateOnly ExpenseDate { get; set; }
    public string? Description { get; set; }
    public string PaymentMethod { get; set; } = null!;
    public Guid UserId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class Income
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public IncomeType Type { get; set; }
    public DateOnly IncomeDate { get; set; }
    public string? Description { get; set; }
    public Guid UserId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class AppNotification
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!;
    public string Body { get; set; } = null!;
    public bool IsRead { get; set; }
    public Guid UserId { get; set; }
    public DateTime CreatedAt { get; set; }
}
