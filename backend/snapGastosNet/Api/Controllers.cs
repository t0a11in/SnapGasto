using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SnapGastosNet.Application;

namespace SnapGastosNet.Api;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(AuthService service) : ControllerBase
{
    [HttpPost("register")] public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken ct) => Created("/api/auth/session", await service.Register(request, ct));
    [HttpPost("login")] public Task<AuthResponse> Login(LoginRequest request, CancellationToken ct) => service.Login(request, ct);
    [HttpPost("google")] public Task<AuthResponse> Google(FirebaseLoginRequest request, CancellationToken ct) => service.LoginWithGoogle(request, ct);
    [HttpGet("session"), Authorize] public Task<UserResponse> Session(CancellationToken ct) => service.Session(UserId(), ct);
    private Guid UserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

[ApiController]
[Route("api/users")]
[Authorize]
public sealed class UserController(AuthService service) : ControllerBase
{
    [HttpGet("me")] public Task<UserResponse> Me(CancellationToken ct) => service.Session(Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!), ct);
}

[ApiController]
[Route("api/expenses")]
[Authorize]
public sealed class ExpenseController(ExpenseService service) : ControllerBase
{
    [HttpGet] public Task<List<ExpenseResponse>> List(CancellationToken ct) => service.List(UserId(), ct);
    [HttpPost] public async Task<ActionResult<ExpenseResponse>> Create(ExpenseRequest request, CancellationToken ct) => StatusCode(201, await service.Create(UserId(), request, ct));
    [HttpDelete("{expenseId:guid}")] public async Task<IActionResult> Delete(Guid expenseId, CancellationToken ct) { await service.Delete(UserId(), expenseId, ct); return NoContent(); }
    private Guid UserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

[ApiController]
[Route("api/incomes/v1")]
[Authorize]
public sealed class IncomeController(IncomeService service) : ControllerBase
{
    [HttpGet("listar")] public Task<List<IncomeResponse>> List([FromQuery] string? month, CancellationToken ct) => service.List(UserId(), month, ct);
    [HttpGet("resumen")] public Task<IncomeMonthlySummaryResponse> Summary([FromQuery] string? month, CancellationToken ct) => service.Summary(UserId(), month, ct);
    [HttpPost("crear")] public async Task<ActionResult<IncomeResponse>> Create(IncomeRequest request, CancellationToken ct) => StatusCode(201, await service.Create(UserId(), request, ct));
    [HttpPut("{incomeId:guid}/actualizar")] public Task<IncomeResponse> Update(Guid incomeId, IncomeRequest request, CancellationToken ct) => service.Update(UserId(), incomeId, request, ct);
    [HttpDelete("{incomeId:guid}/eliminar")] public async Task<IActionResult> Delete(Guid incomeId, CancellationToken ct) { await service.Delete(UserId(), incomeId, ct); return NoContent(); }
    private Guid UserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "ADMIN")]
public sealed class AdminUsersController(AdminService service) : ControllerBase
{
    [HttpGet] public Task<List<AdminUserResponse>> List(CancellationToken ct) => service.Users(ct);
    [HttpPost] public async Task<ActionResult<AdminUserResponse>> Create(AdminUserRequest request, CancellationToken ct) => StatusCode(201, await service.CreateUser(request, ct));
    [HttpPut("{userId:guid}")] public Task<AdminUserResponse> Update(Guid userId, AdminUserRequest request, CancellationToken ct) => service.UpdateUser(userId, request, ct);
    [HttpDelete("{userId:guid}")] public async Task<IActionResult> Delete(Guid userId, CancellationToken ct) { await service.DeleteUser(userId, Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!), ct); return NoContent(); }
}

[ApiController]
[Route("api/admin/categories")]
[Authorize(Roles = "ADMIN")]
public sealed class CategoriesController(AdminService service) : ControllerBase
{
    [HttpGet] public Task<List<CategoryResponse>> List(CancellationToken ct) => service.Categories(ct);
    [HttpPost] public async Task<ActionResult<CategoryResponse>> Create(CategoryRequest request, CancellationToken ct) => StatusCode(201, await service.CreateCategory(request, ct));
    [HttpPut("{categoryId:guid}")] public Task<CategoryResponse> Update(Guid categoryId, CategoryRequest request, CancellationToken ct) => service.UpdateCategory(categoryId, request, ct);
    [HttpDelete("{categoryId:guid}")] public async Task<IActionResult> Delete(Guid categoryId, CancellationToken ct) { await service.DeleteCategory(categoryId, ct); return NoContent(); }
}

[ApiController]
[Route("api/admin/expenses")]
[Authorize(Roles = "ADMIN")]
public sealed class AdminExpensesController(AdminService service) : ControllerBase
{
    [HttpGet] public Task<List<AdminExpenseResponse>> List(CancellationToken ct) => service.Expenses(ct);
    [HttpPost] public async Task<ActionResult<AdminExpenseResponse>> Create(AdminExpenseRequest request, CancellationToken ct) => StatusCode(201, await service.CreateExpense(request, ct));
    [HttpPut("{expenseId:guid}")] public Task<AdminExpenseResponse> Update(Guid expenseId, AdminExpenseRequest request, CancellationToken ct) => service.UpdateExpense(expenseId, request, ct);
    [HttpDelete("{expenseId:guid}")] public async Task<IActionResult> Delete(Guid expenseId, CancellationToken ct) { await service.DeleteExpense(expenseId, ct); return NoContent(); }
}

[ApiController]
[Route("api/admin/notifications")]
[Authorize(Roles = "ADMIN")]
public sealed class NotificationsController(AdminService service) : ControllerBase
{
    [HttpGet] public Task<List<NotificationResponse>> List(CancellationToken ct) => service.Notifications(ct);
    [HttpPost] public async Task<ActionResult<NotificationResponse>> Create(NotificationRequest request, CancellationToken ct) => StatusCode(201, await service.CreateNotification(request, ct));
    [HttpPut("{notificationId:guid}")] public Task<NotificationResponse> Update(Guid notificationId, NotificationRequest request, CancellationToken ct) => service.UpdateNotification(notificationId, request, ct);
    [HttpDelete("{notificationId:guid}")] public async Task<IActionResult> Delete(Guid notificationId, CancellationToken ct) { await service.DeleteNotification(notificationId, ct); return NoContent(); }
}
