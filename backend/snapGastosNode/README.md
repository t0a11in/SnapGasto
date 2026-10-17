# SnapGasto API · Node/Express

Implementación Node.js/Express intercambiable con `../snapgasto-backend`. Conserva el mismo contrato HTTP, JWT HS256 y SQL Server.

## Base compartida

Usa **solamente** `dbo.users`, `dbo.categories`, `dbo.expenses` y `dbo.notifications` de `snap_gastos`. No tiene migraciones ni crea tablas: Flyway del backend Spring es el único dueño del esquema.

## Ejecutar

```powershell
cd backend/snapGastosNode
npm install
$env:DB_PASSWORD = "tu-clave"
$env:JWT_SECRET = "la-misma-clave-de-al-menos-32-caracteres-que-usa-Spring"
npm start
```

- API: `http://localhost:8083/api`
- OpenAPI: `http://localhost:8083/openapi/v1.json`
- Swagger UI: `http://localhost:8083/swagger-ui/`

Las variables disponibles están en `.env.example`; la aplicación se configura con variables de entorno para no guardar secretos.

## Pruebas

```powershell
npm test
```

Las pruebas son unitarias, no se conectan a SQL Server.
