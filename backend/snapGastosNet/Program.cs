using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using SnapGastosNet.Application;
using SnapGastosNet.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
var connection = builder.Configuration.GetConnectionString("SnapGasto") ?? throw new InvalidOperationException("Falta ConnectionStrings:SnapGasto.");
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtSettings>() ?? throw new InvalidOperationException("Falta configuración Jwt.");
if (string.IsNullOrWhiteSpace(jwt.Secret) || jwt.Secret.Length < 32) throw new InvalidOperationException("Jwt:Secret debe tener al menos 32 caracteres.");

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<FirebaseSettings>(builder.Configuration.GetSection("Firebase"));
builder.Services.AddDbContext<SnapGastoDbContext>(options => options.UseSqlServer(connection));
builder.Services.AddScoped<ISnapGastoStore, SqlServerSnapGastoStore>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ExpenseService>();
builder.Services.AddScoped<IncomeService>();
builder.Services.AddScoped<AdminService>();
builder.Services.AddSingleton<ITokenService, JwtTokenService>();
builder.Services.AddSingleton<IFirebaseIdentityProvider, FirebaseIdentityProvider>();
builder.Services.AddHostedService<AdminBootstrapper>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false, ValidateAudience = false, ValidateLifetime = true, ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),
        RoleClaimType = ClaimTypes.Role, NameClaimType = ClaimTypes.NameIdentifier, ClockSkew = TimeSpan.Zero
    };
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var email = context.Principal?.FindFirstValue("sub")?.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(email)) { context.Fail("El token no contiene sub."); return; }
            var store = context.HttpContext.RequestServices.GetRequiredService<ISnapGastoStore>();
            var user = await store.FindUserByEmail(email, context.HttpContext.RequestAborted);
            if (user is null) { context.Fail("El usuario de la sesión no existe."); return; }
            var identity = context.Principal!.Identity as ClaimsIdentity;
            identity!.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()));
            identity.AddClaim(new Claim(ClaimTypes.Role, user.Role.ToString()));
        }
    };
});
builder.Services.AddAuthorization();
builder.Services.AddCors(options => options.AddPolicy("frontend", policy => policy
    .SetIsOriginAllowed(origin => Uri.TryCreate(origin, UriKind.Absolute, out var uri) && (uri.Host is "localhost" or "127.0.0.1"))
    .AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
builder.Services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "SnapGastos API (.NET)", Version = "v1" });
    options.AddSecurityDefinition("bearerAuth", new OpenApiSecurityScheme { Name = "Authorization", In = ParameterLocation.Header, Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT" });
    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement { [new OpenApiSecuritySchemeReference("bearerAuth", document)] = [] });
});

var app = builder.Build();
app.Use(async (context, next) =>
{
    try { await next(context); }
    catch (ApiException error) { context.Response.StatusCode = error.StatusCode; await context.Response.WriteAsJsonAsync(new ApiError(error.Message)); }
    catch (Exception error) { app.Logger.LogError(error, "Error no controlado"); context.Response.StatusCode = 500; await context.Response.WriteAsJsonAsync(new ApiError("Error interno del servidor.")); }
});
app.UseSwagger(options => options.RouteTemplate = "openapi/{documentName}.json");
app.UseSwaggerUI(options => { options.RoutePrefix = "swagger-ui"; options.SwaggerEndpoint("/openapi/v1.json", "SnapGastos API v1"); });
app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

public partial class Program { }
