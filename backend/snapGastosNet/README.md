# SnapGasto API · .NET

API ASP.NET Core `net10.0` intercambiable con `../snapgasto-backend`: mismo SQL Server, rutas, cuerpos JSON y JWT HS256.

## Base compartida

El adaptador EF Core mapea explícitamente `dbo.users`, `dbo.categories`, `dbo.expenses`, `dbo.incomes` y `dbo.notifications`. Esta implementación no contiene migraciones, `EnsureCreated` ni DDL. Flyway de Spring Boot mantiene el esquema.

Un JWT emitido por Spring, Django, Node o .NET se acepta siempre que comparta `JWT_SECRET`: el contrato usa `sub=email`, `iat`, `exp` y HS256. El rol se consulta en la tabla `users` al validar el token.

## Ingresos v1

Rutas autenticadas compatibles con Spring y Django:

- `GET /api/incomes/v1/listar?month=AAAA-MM`
- `GET /api/incomes/v1/resumen?month=AAAA-MM` — sin parámetro usa el mes actual.
- `POST /api/incomes/v1/crear`
- `PUT /api/incomes/v1/{incomeId}/actualizar`
- `DELETE /api/incomes/v1/{incomeId}/eliminar`

## Ejecutar

```powershell
cd backend/snapGastosNet
$env:ConnectionStrings__SnapGasto = "Server=localhost,1433;Database=snap_gastos;User Id=sa;Password=tu-clave;Encrypt=True;TrustServerCertificate=True"
$env:Jwt__Secret = "la-misma-clave-de-al-menos-32-caracteres-que-usa-Spring"
dotnet run --urls http://localhost:8081
```

- API: `http://localhost:8081/api`
- OpenAPI: `http://localhost:8081/openapi/v1.json`
- Swagger UI: `http://localhost:8081/swagger-ui/`

Consulta `.env.example` para las demás variables. Nunca subas la contraseña ni `FIREBASE_SERVICE_ACCOUNT_JSON`.

## Pruebas

```powershell
dotnet test .\tests\SnapGastosNet.Tests\SnapGastosNet.Tests.csproj
```

Las pruebas son unitarias, con un adaptador en memoria y sin SQL Server.
