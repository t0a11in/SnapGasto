using SnapGastosNet.Domain;

namespace SnapGastosNet.Application;

public sealed record RegisterRequest(string FullName, string Email, string Password);
public sealed record LoginRequest(string Email, string Password);
public sealed record FirebaseLoginRequest(string IdToken);
public sealed record AuthResponse(string AccessToken, UserResponse User);
public sealed record UserResponse(Guid Id, string FullName, string Email, Role Role);
public sealed record AdminUserResponse(Guid Id, string FullName, string Email, Role Role, DateTime CreatedAt);
public sealed record ExpenseRequest(decimal Amount, string Category, DateOnly Date, string? Description, string PaymentMethod);
public sealed record ExpenseResponse(Guid Id, decimal Amount, string Category, DateOnly Date, string? Description, string PaymentMethod);
public sealed record IncomeRequest(decimal Amount, IncomeType Type, DateOnly Date, string? Description);
public sealed record IncomeResponse(Guid Id, decimal Amount, IncomeType Type, DateOnly Date, string? Description);
public sealed record IncomeMonthlySummaryResponse(string Month, decimal TotalTarjeta, decimal TotalFisico, decimal Total);
public sealed record AdminExpenseResponse(Guid Id, Guid UserId, string UserName, decimal Amount, string Category, DateOnly Date, string? Description, string PaymentMethod);
public sealed record AdminUserRequest(string FullName, string Email, string? Password, Role? Role);
public sealed record CategoryRequest(string Name, string? Icon, string? ColorHex);
public sealed record CategoryResponse(Guid Id, string Name, string? Icon, string? ColorHex);
public sealed record NotificationRequest(Guid UserId, string Title, string Body, bool Read);
public sealed record NotificationResponse(Guid Id, Guid UserId, string UserName, string Title, string Body, bool Read, DateTime CreatedAt);
public sealed record AdminExpenseRequest(Guid UserId, decimal Amount, string Category, DateOnly Date, string? Description, string PaymentMethod);
public sealed record ApiError(string Message);

public sealed class ApiException(int statusCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

public interface ISnapGastoStore
{
    Task<AppUser?> FindUserByEmail(string email, CancellationToken ct = default);
    Task<AppUser?> FindUserByFirebaseUid(string firebaseUid, CancellationToken ct = default);
    Task<AppUser?> FindUser(Guid id, CancellationToken ct = default);
    Task<List<AppUser>> GetUsers(CancellationToken ct = default);
    Task<bool> UserEmailExists(string email, Guid? exceptId = null, CancellationToken ct = default);
    Task AddUser(AppUser user, CancellationToken ct = default);
    Task UpdateUser(AppUser user, CancellationToken ct = default);
    Task DeleteUser(Guid id, CancellationToken ct = default);
    Task<List<Expense>> GetExpenses(Guid? userId = null, CancellationToken ct = default);
    Task<Expense?> FindExpense(Guid id, CancellationToken ct = default);
    Task AddExpense(Expense expense, CancellationToken ct = default);
    Task UpdateExpense(Expense expense, CancellationToken ct = default);
    Task DeleteExpense(Guid id, CancellationToken ct = default);
    Task<List<Income>> GetIncomes(Guid userId, DateOnly from, DateOnly to, CancellationToken ct = default);
    Task<Income?> FindIncome(Guid id, CancellationToken ct = default);
    Task AddIncome(Income income, CancellationToken ct = default);
    Task UpdateIncome(Income income, CancellationToken ct = default);
    Task DeleteIncome(Guid id, CancellationToken ct = default);
    Task<List<Category>> GetCategories(CancellationToken ct = default);
    Task<Category?> FindCategory(Guid id, CancellationToken ct = default);
    Task<bool> CategoryNameExists(string name, Guid? exceptId = null, CancellationToken ct = default);
    Task AddCategory(Category category, CancellationToken ct = default);
    Task UpdateCategory(Category category, CancellationToken ct = default);
    Task DeleteCategory(Guid id, CancellationToken ct = default);
    Task<List<AppNotification>> GetNotifications(CancellationToken ct = default);
    Task<AppNotification?> FindNotification(Guid id, CancellationToken ct = default);
    Task AddNotification(AppNotification notification, CancellationToken ct = default);
    Task UpdateNotification(AppNotification notification, CancellationToken ct = default);
    Task DeleteNotification(Guid id, CancellationToken ct = default);
}

public interface ITokenService { string Create(AppUser user); }
public sealed record FirebaseIdentity(string Uid, string Email, string? Name);
public interface IFirebaseIdentityProvider { Task<FirebaseIdentity> Verify(string idToken, CancellationToken ct = default); }

public static class Maps
{
    public static UserResponse ToResponse(this AppUser user) => new(user.Id, user.FullName, user.Email, user.Role);
    public static AdminUserResponse ToAdminResponse(this AppUser user) => new(user.Id, user.FullName, user.Email, user.Role, user.CreatedAt);
    public static ExpenseResponse ToResponse(this Expense expense) => new(expense.Id, expense.Amount, expense.Category, expense.ExpenseDate, expense.Description, expense.PaymentMethod);
    public static IncomeResponse ToResponse(this Income income) => new(income.Id, income.Amount, income.Type, income.IncomeDate, income.Description);
    public static CategoryResponse ToResponse(this Category category) => new(category.Id, category.Name, category.Icon, category.ColorHex);
}
