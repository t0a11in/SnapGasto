# Contrato compartido de SnapGasto

Las implementaciones Spring Boot, ASP.NET Core, Django y Node/Express se diseñaron para alternarse sin migrar ni transformar datos. Sólo debe ejecutarse **una** API contra la misma base durante una operación normal; se pueden levantar a la vez para pruebas, usando puertos distintos.

## Fuente de verdad

- Esquema: `backend/snapgasto-backend/src/main/resources/db/migration/`; Flyway de Spring es el único que crea o evoluciona el esquema.
- Base: SQL Server `snap_gastos`, esquema `dbo`.
- Tablas: `users`, `categories`, `expenses`, `incomes`, `notifications`.
- Django usa el modelo `AppUser` con `db_table = "users"` y `managed = False`; no existe ni se crea `auth_user`.
- Ninguna implementación alternativa ejecuta migraciones, DDL, `migrate` o `EnsureCreated`.

## Patrón común por capa

Se conserva el patrón de la API Java —entrada HTTP → caso de uso/servicio → repositorio/adaptador → entidades del dominio—, con el nombre idiomático de cada plataforma:

| Implementación | HTTP | Casos de uso | Persistencia | Dominio |
| --- | --- | --- | --- | --- |
| Spring | `controller` | `service` | `repository` | `entity` |
| .NET | `Api` | `Application` | `Infrastructure` | `Domain` |
| Django | `api/views.py` | `api/services.py` | `api/repositories.py` | `api/models.py` |
| Node | `src/api` | `src/application` | `src/infrastructure` | `src/domain` |

## Sesión y contraseñas

- JWT: HS256, misma variable `JWT_SECRET`, `sub` igual a email normalizado, más `iat` y `exp`.
- Vencimiento: `JWT_EXPIRATION_MINUTES` / `Jwt__ExpirationMinutes`, 120 minutos por defecto.
- Las cuatro APIs verifican el usuario y su rol actual en `users` después de validar el token.
- Las contraseñas se guardan con BCrypt, costo 10 y formato compatible `$2a$`; nunca se exponen en respuestas.
- Google/Firebase es opcional en los cuatro proyectos; se activa sólo con sus variables respectivas.
- Para Node y Django la credencial de Firebase se resuelve con Application Default Credentials (`GOOGLE_APPLICATION_CREDENTIALS`); .NET permite esa vía o `FIREBASE_SERVICE_ACCOUNT_JSON`.

## Rutas y roles

| Grupo | Rutas | Acceso |
| --- | --- | --- |
| Autenticación | `POST /api/auth/register`, `/login`, `/google`; `GET /api/auth/session` | Públicas salvo `session` |
| Perfil | `GET /api/users/me` | JWT |
| Gastos propios | `GET`, `POST /api/expenses`; `DELETE /api/expenses/{expenseId}` | JWT |
| Ingresos propios | CRUD en `/api/incomes/v1`; listado y resumen mensual | JWT |
| Mantenedores | CRUD en `/api/admin/users`, `/categories`, `/expenses`, `/notifications` | JWT con rol `ADMIN` |
| Documentación | `GET /openapi/v1.json`, `/swagger-ui/` | Pública |

Los cuerpos y respuestas usan JSON camelCase. En gastos el campo expuesto es `date`; las respuestas administrativas incluyen el usuario propietario (`userId`, `userName`). Los errores controlados usan `{ "message": "..." }`.

## Cambio seguro de implementación

1. Mantén exactamente los mismos datos de conexión y `JWT_SECRET`.
2. Detén la API actual y levanta la alternativa en su puerto asignado.
3. No ejecutes migraciones en Django/.NET/Node; para cambios de esquema agrega una migración nueva de Flyway en Spring.
4. Conserva los puertos distintos si las levantas simultáneamente para comparar respuestas.

El archivo [GUIA_API_MULTILENGUAJE.txt](GUIA_API_MULTILENGUAJE.txt) es la referencia rápida de distribución y comandos.
