using SnapGastosNet.Domain;

namespace SnapGastosNet.Application;

public sealed class AuthService(ISnapGastoStore store, ITokenService tokens, IFirebaseIdentityProvider firebase)
{
    public async Task<AuthResponse> Register(RegisterRequest request, CancellationToken ct)
    {
        var email = Rules.Email(request.Email);
        Rules.Text(request.FullName, "fullName", 120);
        Rules.Password(request.Password);
        if (await store.UserEmailExists(email, null, ct)) throw new ApiException(409, "El correo ya está registrado.");
        var user = new AppUser
        {
            Id = Guid.NewGuid(), FullName = request.FullName.Trim(), Email = email,
            Password = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 10), Role = Role.USER, CreatedAt = DateTime.UtcNow
        };
        await store.AddUser(user, ct);
        return new AuthResponse(tokens.Create(user), user.ToResponse());
    }

    public async Task<AuthResponse> Login(LoginRequest request, CancellationToken ct)
    {
        var user = await store.FindUserByEmail(Rules.Email(request.Email), ct);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password ?? string.Empty, user.Password))
            throw new ApiException(401, "Credenciales inválidas.");
        return new AuthResponse(tokens.Create(user), user.ToResponse());
    }

    public async Task<AuthResponse> LoginWithGoogle(FirebaseLoginRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.IdToken)) throw new ApiException(400, "idToken es obligatorio.");
        var identity = await firebase.Verify(request.IdToken, ct);
        var user = await store.FindUserByFirebaseUid(identity.Uid, ct) ?? await store.FindUserByEmail(Rules.Email(identity.Email), ct);
        if (user is null)
        {
            user = new AppUser { Id = Guid.NewGuid(), Email = Rules.Email(identity.Email), FullName = string.IsNullOrWhiteSpace(identity.Name) ? identity.Email : identity.Name.Trim(), Password = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString(), 10), FirebaseUid = identity.Uid, Role = Role.USER, CreatedAt = DateTime.UtcNow };
            await store.AddUser(user, ct);
        }
        else if (user.FirebaseUid != identity.Uid)
        {
            user.FirebaseUid = identity.Uid;
            await store.UpdateUser(user, ct);
        }
        return new AuthResponse(tokens.Create(user), user.ToResponse());
    }

    public async Task<UserResponse> Session(Guid userId, CancellationToken ct) =>
        (await store.FindUser(userId, ct) ?? throw new ApiException(401, "Sesión inválida.")).ToResponse();
}

public sealed class ExpenseService(ISnapGastoStore store)
{
    public async Task<List<ExpenseResponse>> List(Guid userId, CancellationToken ct) => (await store.GetExpenses(userId, ct)).OrderByDescending(x => x.ExpenseDate).ThenByDescending(x => x.CreatedAt).Select(x => x.ToResponse()).ToList();

    public async Task<ExpenseResponse> Create(Guid userId, ExpenseRequest request, CancellationToken ct)
    {
        Rules.Expense(request.Amount, request.Category, request.Date, request.PaymentMethod, request.Description);
        var entity = new Expense { Id = Guid.NewGuid(), Amount = request.Amount, Category = request.Category.Trim(), ExpenseDate = request.Date, Description = Rules.Optional(request.Description, 500), PaymentMethod = request.PaymentMethod.Trim(), UserId = userId, CreatedAt = DateTime.UtcNow };
        await store.AddExpense(entity, ct);
        return entity.ToResponse();
    }

    public async Task Delete(Guid userId, Guid expenseId, CancellationToken ct)
    {
        var expense = await store.FindExpense(expenseId, ct) ?? throw new ApiException(404, "Gasto no encontrado.");
        if (expense.UserId != userId) throw new ApiException(403, "No puedes eliminar este gasto.");
        await store.DeleteExpense(expenseId, ct);
    }
}

public sealed class IncomeService(ISnapGastoStore store)
{
    public async Task<List<IncomeResponse>> List(Guid userId, string? requestedMonth, CancellationToken ct)
    {
        var month = ResolveMonth(requestedMonth);
        return (await store.GetIncomes(userId, month, MonthEnd(month), ct))
            .OrderByDescending(x => x.IncomeDate)
            .ThenByDescending(x => x.CreatedAt)
            .Select(x => x.ToResponse())
            .ToList();
    }

    public async Task<IncomeMonthlySummaryResponse> Summary(Guid userId, string? requestedMonth, CancellationToken ct)
    {
        var month = ResolveMonth(requestedMonth);
        var card = 0m;
        var cash = 0m;
        foreach (var income in await store.GetIncomes(userId, month, MonthEnd(month), ct))
        {
            if (income.Type == IncomeType.TARJETA) card += income.Amount;
            if (income.Type == IncomeType.FISICO) cash += income.Amount;
        }
        return new IncomeMonthlySummaryResponse($"{month:yyyy-MM}", card, cash, card + cash);
    }

    public async Task<IncomeResponse> Create(Guid userId, IncomeRequest request, CancellationToken ct)
    {
        Rules.Income(request.Amount, request.Type, request.Date, request.Description);
        var income = new Income
        {
            Id = Guid.NewGuid(), Amount = request.Amount, Type = request.Type,
            IncomeDate = request.Date, Description = Rules.Optional(request.Description, 500),
            UserId = userId, CreatedAt = DateTime.UtcNow
        };
        await store.AddIncome(income, ct);
        return income.ToResponse();
    }

    public async Task<IncomeResponse> Update(Guid userId, Guid incomeId, IncomeRequest request, CancellationToken ct)
    {
        var income = await store.FindIncome(incomeId, ct) ?? throw new ApiException(404, "Ingreso no encontrado.");
        if (income.UserId != userId) throw new ApiException(403, "No puedes actualizar este ingreso.");
        Rules.Income(request.Amount, request.Type, request.Date, request.Description);
        income.Amount = request.Amount;
        income.Type = request.Type;
        income.IncomeDate = request.Date;
        income.Description = Rules.Optional(request.Description, 500);
        await store.UpdateIncome(income, ct);
        return income.ToResponse();
    }

    public async Task Delete(Guid userId, Guid incomeId, CancellationToken ct)
    {
        var income = await store.FindIncome(incomeId, ct) ?? throw new ApiException(404, "Ingreso no encontrado.");
        if (income.UserId != userId) throw new ApiException(403, "No puedes eliminar este ingreso.");
        await store.DeleteIncome(incomeId, ct);
    }

    private static DateOnly ResolveMonth(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            return new DateOnly(today.Year, today.Month, 1);
        }
        if (value.Length != 7 || value[4] != '-' ||
            !int.TryParse(value[..4], out var year) || !int.TryParse(value[5..], out var month))
            throw new ApiException(400, "El mes debe usar el formato AAAA-MM.");
        try { return new DateOnly(year, month, 1); }
        catch (ArgumentOutOfRangeException) { throw new ApiException(400, "El mes debe usar el formato AAAA-MM."); }
    }

    private static DateOnly MonthEnd(DateOnly month) => month.AddMonths(1).AddDays(-1);
}

public sealed class AdminService(ISnapGastoStore store)
{
    public async Task<List<AdminUserResponse>> Users(CancellationToken ct) => (await store.GetUsers(ct)).OrderByDescending(x => x.CreatedAt).Select(x => x.ToAdminResponse()).ToList();
    public async Task<AdminUserResponse> CreateUser(AdminUserRequest request, CancellationToken ct)
    {
        var email = Rules.Email(request.Email); Rules.Text(request.FullName, "fullName", 120); Rules.Password(request.Password ?? string.Empty); var role = Rules.RequiredRole(request.Role);
        if (await store.UserEmailExists(email, null, ct)) throw new ApiException(409, "El correo ya está registrado.");
        var user = new AppUser { Id = Guid.NewGuid(), FullName = request.FullName.Trim(), Email = email, Password = BCrypt.Net.BCrypt.HashPassword(request.Password!, 10), Role = role, CreatedAt = DateTime.UtcNow };
        await store.AddUser(user, ct); return user.ToAdminResponse();
    }
    public async Task<AdminUserResponse> UpdateUser(Guid id, AdminUserRequest request, CancellationToken ct)
    {
        var user = await store.FindUser(id, ct) ?? throw new ApiException(404, "Usuario no encontrado.");
        var email = Rules.Email(request.Email); Rules.Text(request.FullName, "fullName", 120);
        if (await store.UserEmailExists(email, id, ct)) throw new ApiException(409, "El correo ya está registrado.");
        user.FullName = request.FullName.Trim(); user.Email = email; user.Role = Rules.RequiredRole(request.Role);
        if (!string.IsNullOrWhiteSpace(request.Password)) { Rules.Password(request.Password); user.Password = BCrypt.Net.BCrypt.HashPassword(request.Password, 10); }
        await store.UpdateUser(user, ct); return user.ToAdminResponse();
    }
    public async Task DeleteUser(Guid id, Guid currentUserId, CancellationToken ct)
    {
        if (id == currentUserId) throw new ApiException(400, "No puedes eliminar tu propia cuenta.");
        if (await store.FindUser(id, ct) is null) throw new ApiException(404, "Usuario no encontrado.");
        await store.DeleteUser(id, ct);
    }

    public async Task<List<CategoryResponse>> Categories(CancellationToken ct) => (await store.GetCategories(ct)).OrderBy(x => x.Name).Select(x => x.ToResponse()).ToList();
    public async Task<CategoryResponse> CreateCategory(CategoryRequest request, CancellationToken ct)
    {
        Rules.Text(request.Name, "name", 80);
        if (await store.CategoryNameExists(request.Name.Trim(), null, ct)) throw new ApiException(409, "La categoría ya existe.");
        var category = new Category { Id = Guid.NewGuid(), Name = request.Name.Trim(), Icon = Rules.Optional(request.Icon, 80), ColorHex = Rules.Color(request.ColorHex) };
        await store.AddCategory(category, ct); return category.ToResponse();
    }
    public async Task<CategoryResponse> UpdateCategory(Guid id, CategoryRequest request, CancellationToken ct)
    {
        var category = await store.FindCategory(id, ct) ?? throw new ApiException(404, "Categoría no encontrada."); Rules.Text(request.Name, "name", 80);
        if (await store.CategoryNameExists(request.Name.Trim(), id, ct)) throw new ApiException(409, "La categoría ya existe.");
        category.Name = request.Name.Trim(); category.Icon = Rules.Optional(request.Icon, 80); category.ColorHex = Rules.Color(request.ColorHex);
        await store.UpdateCategory(category, ct); return category.ToResponse();
    }
    public async Task DeleteCategory(Guid id, CancellationToken ct)
    {
        if (await store.FindCategory(id, ct) is null) throw new ApiException(404, "Categoría no encontrada.");
        await store.DeleteCategory(id, ct);
    }

    public async Task<List<AdminExpenseResponse>> Expenses(CancellationToken ct)
    {
        var result = new List<AdminExpenseResponse>();
        foreach (var expense in (await store.GetExpenses(null, ct)).OrderByDescending(x => x.ExpenseDate))
        {
            var user = await store.FindUser(expense.UserId, ct);
            if (user is not null) result.Add(new(expense.Id, expense.UserId, user.FullName, expense.Amount, expense.Category, expense.ExpenseDate, expense.Description, expense.PaymentMethod));
        }
        return result;
    }
    public async Task<AdminExpenseResponse> CreateExpense(AdminExpenseRequest request, CancellationToken ct)
    {
        if (await store.FindUser(request.UserId, ct) is null) throw new ApiException(400, "userId no existe."); Rules.Expense(request.Amount, request.Category, request.Date, request.PaymentMethod, request.Description);
        var expense = new Expense { Id = Guid.NewGuid(), Amount = request.Amount, Category = request.Category.Trim(), ExpenseDate = request.Date, Description = Rules.Optional(request.Description, 500), PaymentMethod = request.PaymentMethod.Trim(), UserId = request.UserId, CreatedAt = DateTime.UtcNow };
        await store.AddExpense(expense, ct); var user = (await store.FindUser(request.UserId, ct))!; return new(expense.Id, expense.UserId, user.FullName, expense.Amount, expense.Category, expense.ExpenseDate, expense.Description, expense.PaymentMethod);
    }
    public async Task<AdminExpenseResponse> UpdateExpense(Guid id, AdminExpenseRequest request, CancellationToken ct)
    {
        var expense = await store.FindExpense(id, ct) ?? throw new ApiException(404, "Gasto no encontrado.");
        if (await store.FindUser(request.UserId, ct) is null) throw new ApiException(400, "userId no existe."); Rules.Expense(request.Amount, request.Category, request.Date, request.PaymentMethod, request.Description);
        expense.Amount = request.Amount; expense.Category = request.Category.Trim(); expense.ExpenseDate = request.Date; expense.Description = Rules.Optional(request.Description, 500); expense.PaymentMethod = request.PaymentMethod.Trim(); expense.UserId = request.UserId;
        await store.UpdateExpense(expense, ct); var user = (await store.FindUser(request.UserId, ct))!; return new(expense.Id, expense.UserId, user.FullName, expense.Amount, expense.Category, expense.ExpenseDate, expense.Description, expense.PaymentMethod);
    }
    public async Task DeleteExpense(Guid id, CancellationToken ct) { if (await store.FindExpense(id, ct) is null) throw new ApiException(404, "Gasto no encontrado."); await store.DeleteExpense(id, ct); }

    public async Task<List<NotificationResponse>> Notifications(CancellationToken ct)
    {
        var result = new List<NotificationResponse>();
        foreach (var notification in (await store.GetNotifications(ct)).OrderByDescending(x => x.CreatedAt))
        {
            var user = await store.FindUser(notification.UserId, ct);
            if (user is not null) result.Add(new(notification.Id, notification.UserId, user.FullName, notification.Title, notification.Body, notification.IsRead, notification.CreatedAt));
        }
        return result;
    }
    public async Task<NotificationResponse> CreateNotification(NotificationRequest request, CancellationToken ct)
    {
        if (await store.FindUser(request.UserId, ct) is null) throw new ApiException(400, "userId no existe."); Rules.Text(request.Title, "title", 140); Rules.Text(request.Body, "body", 1000);
        var notification = new AppNotification { Id = Guid.NewGuid(), Title = request.Title.Trim(), Body = request.Body.Trim(), IsRead = request.Read, UserId = request.UserId, CreatedAt = DateTime.UtcNow };
        await store.AddNotification(notification, ct); var user = (await store.FindUser(request.UserId, ct))!; return new(notification.Id, notification.UserId, user.FullName, notification.Title, notification.Body, notification.IsRead, notification.CreatedAt);
    }
    public async Task<NotificationResponse> UpdateNotification(Guid id, NotificationRequest request, CancellationToken ct)
    {
        var notification = await store.FindNotification(id, ct) ?? throw new ApiException(404, "Notificación no encontrada.");
        if (await store.FindUser(request.UserId, ct) is null) throw new ApiException(400, "userId no existe."); Rules.Text(request.Title, "title", 140); Rules.Text(request.Body, "body", 1000);
        notification.Title = request.Title.Trim(); notification.Body = request.Body.Trim(); notification.IsRead = request.Read; notification.UserId = request.UserId;
        await store.UpdateNotification(notification, ct); var user = (await store.FindUser(request.UserId, ct))!; return new(notification.Id, notification.UserId, user.FullName, notification.Title, notification.Body, notification.IsRead, notification.CreatedAt);
    }
    public async Task DeleteNotification(Guid id, CancellationToken ct) { if (await store.FindNotification(id, ct) is null) throw new ApiException(404, "Notificación no encontrada."); await store.DeleteNotification(id, ct); }
}

internal static class Rules
{
    public static string Email(string? value) { var email = value?.Trim().ToLowerInvariant(); if (string.IsNullOrWhiteSpace(email) || email.Length > 180 || !email.Contains('@')) throw new ApiException(400, "email no es válido."); return email; }
    public static void Text(string? value, string name, int max) { if (string.IsNullOrWhiteSpace(value) || value.Trim().Length > max) throw new ApiException(400, $"{name} es obligatorio y debe tener hasta {max} caracteres."); }
    public static string? Optional(string? value, int max) { if (string.IsNullOrWhiteSpace(value)) return null; if (value.Trim().Length > max) throw new ApiException(400, $"El texto no puede superar {max} caracteres."); return value.Trim(); }
    public static void Password(string value) { if (string.IsNullOrWhiteSpace(value) || value.Length < 8 || value.Length > 72) throw new ApiException(400, "password debe tener entre 8 y 72 caracteres."); }
    public static string? Color(string? value) { if (string.IsNullOrWhiteSpace(value)) return null; var color = value.Trim(); if (color.Length != 7 || color[0] != '#' || !color.Skip(1).All(Uri.IsHexDigit)) throw new ApiException(400, "colorHex debe tener formato #RRGGBB."); return color; }
    public static Role RequiredRole(Role? value) => value ?? throw new ApiException(400, "role es obligatorio.");
    public static void Expense(decimal amount, string? category, DateOnly date, string? paymentMethod, string? description) { if (amount <= 0 || amount > 999999999999.99m) throw new ApiException(400, "amount debe ser mayor que cero."); if (date == default || date > DateOnly.FromDateTime(DateTime.UtcNow)) throw new ApiException(400, "date no puede ser futura."); Text(category, "category", 80); Text(paymentMethod, "paymentMethod", 60); Optional(description, 500); }
    public static void Income(decimal amount, IncomeType type, DateOnly date, string? description) { if (amount <= 0 || amount > 999999999999.99m) throw new ApiException(400, "amount debe ser mayor que cero."); if (!Enum.IsDefined(type)) throw new ApiException(400, "type debe ser TARJETA o FISICO."); if (date == default || date > DateOnly.FromDateTime(DateTime.UtcNow)) throw new ApiException(400, "date no puede ser futura."); Optional(description, 500); }
}
