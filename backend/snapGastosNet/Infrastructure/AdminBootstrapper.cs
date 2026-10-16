using Microsoft.EntityFrameworkCore;
using SnapGastosNet.Domain;

namespace SnapGastosNet.Infrastructure;

/// <summary>Equivale al bootstrap de Spring: sólo promueve una cuenta ya existente.</summary>
public sealed class AdminBootstrapper(IServiceScopeFactory scopes, IConfiguration configuration, ILogger<AdminBootstrapper> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken ct)
    {
        var email = configuration["BootstrapAdminEmail"]?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email)) return;
        await using var scope = scopes.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<SnapGastoDbContext>();
        var user = await db.Users.SingleOrDefaultAsync(x => x.Email == email, ct);
        if (user is null) return;
        user.Role = Role.ADMIN;
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Cuenta bootstrap promovida a ADMIN: {Email}", email);
    }
    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
