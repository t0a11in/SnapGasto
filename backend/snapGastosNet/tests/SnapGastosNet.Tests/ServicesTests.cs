using Microsoft.Extensions.Options;
using SnapGastosNet.Application;
using SnapGastosNet.Domain;
using SnapGastosNet.Infrastructure;
using Xunit;

namespace SnapGastosNet.Tests;

public sealed class ServicesTests
{
    [Fact]
    public async Task Register_hashes_password_and_creates_shared_jwt()
    {
        var store = new MemoryStore();
        var tokens = new JwtTokenService(Options.Create(new JwtSettings { Secret = "12345678901234567890123456789012", ExpirationMinutes = 120 }));
        var service = new AuthService(store, tokens, new FakeFirebase());

        var result = await service.Register(new RegisterRequest("Ana", " ANA@EXAMPLE.COM ", "Password1"), default);

        Assert.Equal("ana@example.com", result.User.Email);
        Assert.StartsWith("$2", store.Users.Single().Password);
        Assert.True(BCrypt.Net.BCrypt.Verify("Password1", store.Users.Single().Password));
        Assert.Equal("ana@example.com", new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().ReadJwtToken(result.AccessToken).Subject);
    }

    [Fact]
    public async Task Delete_expense_rejects_expense_owned_by_another_user()
    {
        var store = new MemoryStore();
        var expense = new Expense { Id = Guid.NewGuid(), UserId = Guid.NewGuid() };
        store.Expenses.Add(expense);
        var service = new ExpenseService(store);

        var error = await Assert.ThrowsAsync<ApiException>(() => service.Delete(Guid.NewGuid(), expense.Id, default));

        Assert.Equal(403, error.StatusCode);
        Assert.Single(store.Expenses);
    }

    [Fact]
    public async Task Summary_income_separates_card_cash_and_combined_total()
    {
        var store = new MemoryStore();
        var userId = Guid.NewGuid();
        store.Incomes.AddRange([
            new Income { Id = Guid.NewGuid(), UserId = userId, Amount = 12500m, Type = IncomeType.TARJETA, IncomeDate = new DateOnly(2026, 10, 10) },
            new Income { Id = Guid.NewGuid(), UserId = userId, Amount = 8000m, Type = IncomeType.FISICO, IncomeDate = new DateOnly(2026, 10, 8) },
            new Income { Id = Guid.NewGuid(), UserId = userId, Amount = 2500m, Type = IncomeType.TARJETA, IncomeDate = new DateOnly(2026, 10, 1) },
        ]);

        var result = await new IncomeService(store).Summary(userId, "2026-10", default);

        Assert.Equal("2026-10", result.Month);
        Assert.Equal(15000m, result.TotalTarjeta);
        Assert.Equal(8000m, result.TotalFisico);
        Assert.Equal(23000m, result.Total);
    }

    [Fact]
    public async Task Summary_income_uses_the_current_month_when_the_filter_is_omitted()
    {
        var store = new MemoryStore();
        var userId = Guid.NewGuid();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        store.Incomes.Add(new Income { Id = Guid.NewGuid(), UserId = userId, Amount = 1000m, Type = IncomeType.TARJETA, IncomeDate = today });

        var result = await new IncomeService(store).Summary(userId, null, default);

        Assert.Equal($"{today:yyyy-MM}", result.Month);
        Assert.Equal(1000m, result.Total);
    }

    [Fact]
    public async Task Delete_income_rejects_income_owned_by_another_user()
    {
        var store = new MemoryStore();
        var income = new Income { Id = Guid.NewGuid(), UserId = Guid.NewGuid() };
        store.Incomes.Add(income);

        var error = await Assert.ThrowsAsync<ApiException>(() => new IncomeService(store).Delete(Guid.NewGuid(), income.Id, default));

        Assert.Equal(403, error.StatusCode);
        Assert.Single(store.Incomes);
    }
}

internal sealed class FakeFirebase : IFirebaseIdentityProvider
{
    public Task<FirebaseIdentity> Verify(string idToken, CancellationToken ct = default) => throw new NotSupportedException();
}

internal sealed class MemoryStore : ISnapGastoStore
{
    public List<AppUser> Users { get; } = [];
    public List<Expense> Expenses { get; } = [];
    public List<Income> Incomes { get; } = [];
    public List<Category> Categories { get; } = [];
    public List<AppNotification> Notifications { get; } = [];
    public Task<AppUser?> FindUserByEmail(string email, CancellationToken ct = default) => Task.FromResult(Users.SingleOrDefault(x => x.Email == email));
    public Task<AppUser?> FindUserByFirebaseUid(string firebaseUid, CancellationToken ct = default) => Task.FromResult(Users.SingleOrDefault(x => x.FirebaseUid == firebaseUid));
    public Task<AppUser?> FindUser(Guid id, CancellationToken ct = default) => Task.FromResult(Users.SingleOrDefault(x => x.Id == id));
    public Task<List<AppUser>> GetUsers(CancellationToken ct = default) => Task.FromResult(Users.ToList());
    public Task<bool> UserEmailExists(string email, Guid? exceptId = null, CancellationToken ct = default) => Task.FromResult(Users.Any(x => x.Email == email && x.Id != exceptId));
    public Task AddUser(AppUser user, CancellationToken ct = default) { Users.Add(user); return Task.CompletedTask; }
    public Task UpdateUser(AppUser user, CancellationToken ct = default) => Task.CompletedTask;
    public Task DeleteUser(Guid id, CancellationToken ct = default) { Users.RemoveAll(x => x.Id == id); return Task.CompletedTask; }
    public Task<List<Expense>> GetExpenses(Guid? userId = null, CancellationToken ct = default) => Task.FromResult(Expenses.Where(x => !userId.HasValue || x.UserId == userId).ToList());
    public Task<Expense?> FindExpense(Guid id, CancellationToken ct = default) => Task.FromResult(Expenses.SingleOrDefault(x => x.Id == id));
    public Task AddExpense(Expense expense, CancellationToken ct = default) { Expenses.Add(expense); return Task.CompletedTask; }
    public Task UpdateExpense(Expense expense, CancellationToken ct = default) => Task.CompletedTask;
    public Task DeleteExpense(Guid id, CancellationToken ct = default) { Expenses.RemoveAll(x => x.Id == id); return Task.CompletedTask; }
    public Task<List<Income>> GetIncomes(Guid userId, DateOnly from, DateOnly to, CancellationToken ct = default) => Task.FromResult(Incomes.Where(x => x.UserId == userId && x.IncomeDate >= from && x.IncomeDate <= to).ToList());
    public Task<Income?> FindIncome(Guid id, CancellationToken ct = default) => Task.FromResult(Incomes.SingleOrDefault(x => x.Id == id));
    public Task AddIncome(Income income, CancellationToken ct = default) { Incomes.Add(income); return Task.CompletedTask; }
    public Task UpdateIncome(Income income, CancellationToken ct = default) => Task.CompletedTask;
    public Task DeleteIncome(Guid id, CancellationToken ct = default) { Incomes.RemoveAll(x => x.Id == id); return Task.CompletedTask; }
    public Task<List<Category>> GetCategories(CancellationToken ct = default) => Task.FromResult(Categories.ToList());
    public Task<Category?> FindCategory(Guid id, CancellationToken ct = default) => Task.FromResult(Categories.SingleOrDefault(x => x.Id == id));
    public Task<bool> CategoryNameExists(string name, Guid? exceptId = null, CancellationToken ct = default) => Task.FromResult(Categories.Any(x => x.Name == name && x.Id != exceptId));
    public Task AddCategory(Category category, CancellationToken ct = default) { Categories.Add(category); return Task.CompletedTask; }
    public Task UpdateCategory(Category category, CancellationToken ct = default) => Task.CompletedTask;
    public Task DeleteCategory(Guid id, CancellationToken ct = default) { Categories.RemoveAll(x => x.Id == id); return Task.CompletedTask; }
    public Task<List<AppNotification>> GetNotifications(CancellationToken ct = default) => Task.FromResult(Notifications.ToList());
    public Task<AppNotification?> FindNotification(Guid id, CancellationToken ct = default) => Task.FromResult(Notifications.SingleOrDefault(x => x.Id == id));
    public Task AddNotification(AppNotification notification, CancellationToken ct = default) { Notifications.Add(notification); return Task.CompletedTask; }
    public Task UpdateNotification(AppNotification notification, CancellationToken ct = default) => Task.CompletedTask;
    public Task DeleteNotification(Guid id, CancellationToken ct = default) { Notifications.RemoveAll(x => x.Id == id); return Task.CompletedTask; }
}
