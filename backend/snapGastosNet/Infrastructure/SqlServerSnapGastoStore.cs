using Microsoft.EntityFrameworkCore;
using SnapGastosNet.Application;
using SnapGastosNet.Domain;

namespace SnapGastosNet.Infrastructure;

/// <summary>Adaptador SQL Server. No contiene migraciones: Spring/Flyway es el único dueño del esquema compartido.</summary>
public sealed class SnapGastoDbContext(DbContextOptions<SnapGastoDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Income> Incomes => Set<Income>();
    public DbSet<AppNotification> Notifications => Set<AppNotification>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<AppUser>(e =>
        {
            e.ToTable("users", "dbo"); e.HasKey(x => x.Id); e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(120).IsRequired();
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(180).IsRequired();
            e.HasIndex(x => x.Email).IsUnique().HasDatabaseName("uq_users_email");
            e.Property(x => x.Password).HasColumnName("password").HasMaxLength(255).IsRequired();
            e.Property(x => x.FirebaseUid).HasColumnName("firebase_uid").HasMaxLength(128);
            e.Property(x => x.Role).HasColumnName("role").HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasColumnType("datetime2(6)").IsRequired();
        });
        model.Entity<Category>(e =>
        {
            e.ToTable("categories", "dbo"); e.HasKey(x => x.Id); e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(80).IsRequired(); e.HasIndex(x => x.Name).IsUnique().HasDatabaseName("uq_categories_name");
            e.Property(x => x.Icon).HasColumnName("icon").HasMaxLength(80); e.Property(x => x.ColorHex).HasColumnName("color_hex").HasMaxLength(7);
        });
        model.Entity<Expense>(e =>
        {
            e.ToTable("expenses", "dbo"); e.HasKey(x => x.Id); e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Amount).HasColumnName("amount").HasPrecision(14, 2); e.Property(x => x.Category).HasColumnName("category").HasMaxLength(80).IsRequired();
            e.Property(x => x.ExpenseDate).HasColumnName("expense_date").HasColumnType("date"); e.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
            e.Property(x => x.PaymentMethod).HasColumnName("payment_method").HasMaxLength(60).IsRequired(); e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasColumnType("datetime2(6)"); e.HasIndex(x => x.UserId).HasDatabaseName("ix_expenses_user_id");
        });
        model.Entity<Income>(e =>
        {
            e.ToTable("incomes", "dbo"); e.HasKey(x => x.Id); e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Amount).HasColumnName("amount").HasPrecision(14, 2); e.Property(x => x.Type).HasColumnName("income_type").HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(x => x.IncomeDate).HasColumnName("income_date").HasColumnType("date"); e.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
            e.Property(x => x.UserId).HasColumnName("user_id"); e.Property(x => x.CreatedAt).HasColumnName("created_at").HasColumnType("datetime2(6)");
            e.HasIndex(x => new { x.UserId, x.IncomeDate }).HasDatabaseName("ix_incomes_user_date");
        });
        model.Entity<AppNotification>(e =>
        {
            e.ToTable("notifications", "dbo"); e.HasKey(x => x.Id); e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Title).HasColumnName("title").HasMaxLength(140).IsRequired(); e.Property(x => x.Body).HasColumnName("body").HasMaxLength(1000).IsRequired();
            e.Property(x => x.IsRead).HasColumnName("is_read"); e.Property(x => x.UserId).HasColumnName("user_id"); e.Property(x => x.CreatedAt).HasColumnName("created_at").HasColumnType("datetime2(6)");
            e.HasIndex(x => x.UserId).HasDatabaseName("ix_notifications_user_id");
        });
    }
}

public sealed class SqlServerSnapGastoStore(SnapGastoDbContext db) : ISnapGastoStore
{
    public Task<AppUser?> FindUserByEmail(string email, CancellationToken ct = default) => db.Users.SingleOrDefaultAsync(x => x.Email == email, ct);
    public Task<AppUser?> FindUserByFirebaseUid(string firebaseUid, CancellationToken ct = default) => db.Users.SingleOrDefaultAsync(x => x.FirebaseUid == firebaseUid, ct);
    public Task<AppUser?> FindUser(Guid id, CancellationToken ct = default) => db.Users.SingleOrDefaultAsync(x => x.Id == id, ct);
    public Task<List<AppUser>> GetUsers(CancellationToken ct = default) => db.Users.AsNoTracking().ToListAsync(ct);
    public Task<bool> UserEmailExists(string email, Guid? exceptId = null, CancellationToken ct = default) => db.Users.AnyAsync(x => x.Email == email && (!exceptId.HasValue || x.Id != exceptId.Value), ct);
    public async Task AddUser(AppUser user, CancellationToken ct = default) { db.Users.Add(user); await db.SaveChangesAsync(ct); }
    public async Task UpdateUser(AppUser user, CancellationToken ct = default) { db.Users.Update(user); await db.SaveChangesAsync(ct); }
    public async Task DeleteUser(Guid id, CancellationToken ct = default)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        await db.Notifications.Where(x => x.UserId == id).ExecuteDeleteAsync(ct);
        await db.Expenses.Where(x => x.UserId == id).ExecuteDeleteAsync(ct);
        await db.Incomes.Where(x => x.UserId == id).ExecuteDeleteAsync(ct);
        await db.Users.Where(x => x.Id == id).ExecuteDeleteAsync(ct);
        await transaction.CommitAsync(ct);
    }
    public Task<List<Expense>> GetExpenses(Guid? userId = null, CancellationToken ct = default) => (userId.HasValue ? db.Expenses.Where(x => x.UserId == userId) : db.Expenses).AsNoTracking().ToListAsync(ct);
    public Task<Expense?> FindExpense(Guid id, CancellationToken ct = default) => db.Expenses.SingleOrDefaultAsync(x => x.Id == id, ct);
    public async Task AddExpense(Expense expense, CancellationToken ct = default) { db.Expenses.Add(expense); await db.SaveChangesAsync(ct); }
    public async Task UpdateExpense(Expense expense, CancellationToken ct = default) { db.Expenses.Update(expense); await db.SaveChangesAsync(ct); }
    public async Task DeleteExpense(Guid id, CancellationToken ct = default) { await db.Expenses.Where(x => x.Id == id).ExecuteDeleteAsync(ct); }
    public Task<List<Income>> GetIncomes(Guid userId, DateOnly from, DateOnly to, CancellationToken ct = default) => db.Incomes.Where(x => x.UserId == userId && x.IncomeDate >= from && x.IncomeDate <= to).AsNoTracking().ToListAsync(ct);
    public Task<Income?> FindIncome(Guid id, CancellationToken ct = default) => db.Incomes.SingleOrDefaultAsync(x => x.Id == id, ct);
    public async Task AddIncome(Income income, CancellationToken ct = default) { db.Incomes.Add(income); await db.SaveChangesAsync(ct); }
    public async Task UpdateIncome(Income income, CancellationToken ct = default) { db.Incomes.Update(income); await db.SaveChangesAsync(ct); }
    public async Task DeleteIncome(Guid id, CancellationToken ct = default) { await db.Incomes.Where(x => x.Id == id).ExecuteDeleteAsync(ct); }
    public Task<List<Category>> GetCategories(CancellationToken ct = default) => db.Categories.AsNoTracking().ToListAsync(ct);
    public Task<Category?> FindCategory(Guid id, CancellationToken ct = default) => db.Categories.SingleOrDefaultAsync(x => x.Id == id, ct);
    public Task<bool> CategoryNameExists(string name, Guid? exceptId = null, CancellationToken ct = default) => db.Categories.AnyAsync(x => x.Name == name && (!exceptId.HasValue || x.Id != exceptId.Value), ct);
    public async Task AddCategory(Category category, CancellationToken ct = default) { db.Categories.Add(category); await db.SaveChangesAsync(ct); }
    public async Task UpdateCategory(Category category, CancellationToken ct = default) { db.Categories.Update(category); await db.SaveChangesAsync(ct); }
    public async Task DeleteCategory(Guid id, CancellationToken ct = default) { await db.Categories.Where(x => x.Id == id).ExecuteDeleteAsync(ct); }
    public Task<List<AppNotification>> GetNotifications(CancellationToken ct = default) => db.Notifications.AsNoTracking().ToListAsync(ct);
    public Task<AppNotification?> FindNotification(Guid id, CancellationToken ct = default) => db.Notifications.SingleOrDefaultAsync(x => x.Id == id, ct);
    public async Task AddNotification(AppNotification notification, CancellationToken ct = default) { db.Notifications.Add(notification); await db.SaveChangesAsync(ct); }
    public async Task UpdateNotification(AppNotification notification, CancellationToken ct = default) { db.Notifications.Update(notification); await db.SaveChangesAsync(ct); }
    public async Task DeleteNotification(Guid id, CancellationToken ct = default) { await db.Notifications.Where(x => x.Id == id).ExecuteDeleteAsync(ct); }
}
