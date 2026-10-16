using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FirebaseAdmin;
using FirebaseAdmin.Auth;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SnapGastosNet.Application;
using SnapGastosNet.Domain;

namespace SnapGastosNet.Infrastructure;

public sealed class JwtSettings { public string Secret { get; set; } = null!; public int ExpirationMinutes { get; set; } = 120; }
public sealed class FirebaseSettings { public bool Enabled { get; set; } public string? ProjectId { get; set; } }

public sealed class JwtTokenService(IOptions<JwtSettings> options) : ITokenService
{
    public string Create(AppUser user)
    {
        var config = options.Value;
        if (string.IsNullOrWhiteSpace(config.Secret) || config.Secret.Length < 32) throw new InvalidOperationException("Jwt:Secret debe tener al menos 32 caracteres.");
        var now = DateTime.UtcNow;
        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config.Secret)), SecurityAlgorithms.HmacSha256);
        // El contrato compartido usa exclusivamente sub=email, iat y exp, igual que Spring, Django y Node.
        var claims = new[] { new Claim(JwtRegisteredClaimNames.Sub, user.Email), new Claim(JwtRegisteredClaimNames.Iat, new DateTimeOffset(now).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64) };
        return new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(claims: claims, expires: now.AddMinutes(config.ExpirationMinutes), signingCredentials: credentials));
    }
}

public sealed class FirebaseIdentityProvider(IOptions<FirebaseSettings> options) : IFirebaseIdentityProvider
{
    private readonly FirebaseSettings settings = options.Value;
    private readonly Lazy<FirebaseApp?> app = new(() =>
    {
        if (!options.Value.Enabled) return null;
        var json = Environment.GetEnvironmentVariable("FIREBASE_SERVICE_ACCOUNT_JSON");
        var appOptions = string.IsNullOrWhiteSpace(json) ? new AppOptions { ProjectId = options.Value.ProjectId } : new AppOptions { Credential = CredentialFactory.FromJson<ServiceAccountCredential>(json).ToGoogleCredential(), ProjectId = options.Value.ProjectId };
        return FirebaseApp.Create(appOptions, "snapgastos-net");
    });
    public async Task<FirebaseIdentity> Verify(string idToken, CancellationToken ct = default)
    {
        if (!settings.Enabled) throw new ApiException(503, "El inicio de sesión con Google no está configurado.");
        var token = await FirebaseAuth.GetAuth(app.Value!).VerifyIdTokenAsync(idToken, ct);
        if (!token.Claims.TryGetValue("email", out var email) || string.IsNullOrWhiteSpace(email?.ToString())) throw new ApiException(401, "El token de Google no contiene correo.");
        token.Claims.TryGetValue("name", out var name);
        return new FirebaseIdentity(token.Uid, email.ToString()!, name?.ToString());
    }
}
