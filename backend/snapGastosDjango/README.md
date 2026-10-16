# SnapGasto API · Django

Implementación Django compatible con el contrato HTTP, JWT y SQL Server de `../snapgasto-backend`.

## Garantía de base compartida

Los modelos de `api/models.py` tienen `managed = False` y `db_table` apuntando a `users`, `categories`, `expenses`, `incomes` y `notifications`. No ejecutes `makemigrations` ni `migrate`: el esquema es responsabilidad exclusiva de Flyway en Spring Boot, por lo que cambiar entre APIs no modifica ni duplica tablas.

## Ingresos v1

Rutas autenticadas compatibles con Spring y .NET:

- `GET /api/incomes/v1/listar?month=AAAA-MM`
- `GET /api/incomes/v1/resumen?month=AAAA-MM` — sin parámetro usa el mes actual.
- `POST /api/incomes/v1/crear`
- `PUT /api/incomes/v1/{incomeId}/actualizar`
- `DELETE /api/incomes/v1/{incomeId}/eliminar`

## Ejecutar

```powershell
cd backend/snapGastosDjango
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
$env:DB_PASSWORD = "tu-clave"
$env:JWT_SECRET = "la-misma-clave-de-al-menos-32-caracteres-que-usa-Spring"
.\.venv\Scripts\python.exe manage.py runserver 8082
```

- API: `http://localhost:8082/api`
- OpenAPI: `http://localhost:8082/openapi/v1.json`
- Swagger UI: `http://localhost:8082/swagger-ui/`

## Pruebas

```powershell
.\.venv\Scripts\python.exe manage.py test api
```

Las pruebas son unitarias y no abren conexión a SQL Server.
