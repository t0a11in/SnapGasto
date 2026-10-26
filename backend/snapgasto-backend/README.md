# SnapGasto Backend

API Spring Boot con SQL Server local en Docker Compose.

## Requisitos

- Docker Desktop en ejecución.
- Una copia local de `.env`, creada desde `.env.example`.

`DB_PASSWORD` debe cumplir la política de SQL Server: al menos ocho caracteres
y caracteres de tres de estos grupos: mayúsculas, minúsculas, números y símbolos.

## Ejecutar la API y la base de datos

```powershell
Copy-Item .env.example .env
docker compose up --build
```

`db` publica SQL Server en `localhost:1434` por defecto (o en el valor de
`DB_PORT`) y conserva los datos en el volumen Docker
`snapgasto_sqlserver-data`. `db-init` crea la base indicada por `DB_NAME`;
después Flyway aplica las migraciones incluidas en la API.

Para detener el entorno sin borrar datos:

```powershell
docker compose down
```

Para borrar también los datos locales de SQL Server:

```powershell
docker compose down --volumes
```

## Conexión desde DBeaver

Crear una conexión **SQL Server** con estos valores de `.env`:

| Campo | Valor |
| --- | --- |
| Host | `localhost` |
| Puerto | `DB_PORT` (por defecto `1434`) |
| Base de datos | `DB_NAME` (por defecto `snap_gastos`) |
| Autenticación | SQL Server Authentication |
| Usuario | `DB_USER` (por defecto `sa`) |
| Contraseña | `DB_PASSWORD` |

En SSL, habilitar **Trust server certificate** para el entorno local. No se
modifican archivos de DBeaver: la conexión se crea desde su interfaz.

## Depuración remota Java

```powershell
docker compose -f compose.yaml -f compose.debug.yaml up --build
```

El debugger queda en `localhost:5005` por defecto (o en el valor de
`DEBUG_PORT`). Configura el IDE con una conexión **Remote JVM Debug** hacia
ese puerto. Define `DEBUG_SUSPEND=y` en `.env` si quieres que Java espere al
depurador antes de iniciar Spring Boot. El archivo `compose.debug.yaml` es
sólo para desarrollo; no debe utilizarse para despliegues públicos.

## Migraciones

Las modificaciones de esquema se agregan como archivos nuevos en
`src/main/resources/db/migration`, siguiendo el formato
`V2__descripcion.sql`. No se editan migraciones que ya se hayan aplicado.

## Sesión JWT

Todos los endpoints protegidos reciben `Authorization: Bearer <token>`.

| Endpoint | Uso |
| --- | --- |
| `GET /api/auth/v1/token-status` | Comprueba la sesión: `200 {"tokenAlive": true}`. |
| `POST /api/auth/v1/refresh` | Emite un token nuevo y **revoca el anterior**. Conserva el inicio de sesión original: no se puede extender más allá de `JWT_MAX_SESSION_HOURS` (168 h por defecto). |
| `POST /api/auth/v1/logout` | Cierra la sesión actual (revoca el token). `204`. |
| `POST /api/auth/v1/logout-all` | Cierra todas las sesiones del usuario en todos sus dispositivos. `204`. |
| `GET /api/auth/v1/expire-token` | **Obsoleto**: usar `POST /api/auth/v1/logout`. |

No es un circuit breaker de infraestructura: no reintenta ni oculta fallas de
servicios externos; sólo valida la sesión actual.

### Errores de autenticación

| Situación | Respuesta |
| --- | --- |
| Token vencido | `401` + `{"code":"TOKEN_EXPIRED","message":"..."}` + `WWW-Authenticate: Bearer error="invalid_token"` |
| Token ausente, inválido, revocado, de un usuario eliminado o de sesiones cerradas | `401` + `{"code":"UNAUTHORIZED","message":"No autorizado."}` |
| Sesión que superó la duración máxima (en `/refresh`) | `401` + `{"message":"La sesión superó su duración máxima..."}` |
| Demasiados intentos de login con un correo (`LOGIN_MAX_FAILURES` en `LOGIN_LOCK_MINUTES`) | `429` + `Retry-After` |
| Demasiadas solicitudes por IP a login/registro/Google (`AUTH_RATE_LIMIT_PER_MINUTE`) | `429` + `Retry-After` + `{"code":"TOO_MANY_REQUESTS",...}` |

Antes el token vencido respondía `419`; los clientes deben distinguirlo ahora
por `code = TOKEN_EXPIRED` dentro del `401`.

Las sesiones de un usuario se invalidan automáticamente cuando un
administrador le cambia la contraseña, el rol o el correo, y cuando una cuenta
creada con contraseña se vincula por primera vez con Google (en ese caso
también se reemplaza la contraseña local, para impedir que alguien que
registró ese correo antes que su dueño conserve el acceso).

### Roles

El registro con contraseña siempre crea cuentas `USER`. `APP_BOOTSTRAP_ADMIN_EMAIL`
promueve a `ADMIN` una cuenta que ya existe al iniciar la API, y también da
`ADMIN` a quien entre con Google usando ese correo (verificado por Google).

### Secretos

`JWT_SECRET` es obligatorio y no tiene valor por defecto: sin él la API no
arranca. `.env` está en `.gitignore`; nunca debe subirse al repositorio.

## Proyectos (gastos futuros)

Migración `V6__create_projects.sql`. Tipos: `COMPRA` (compra planificada),
`RECURRENTE` (arriendo, suscripciones) y `AHORRO` (metas con aportes y retiros).

| Método | Ruta (`/api/projects`) | Uso |
| --- | --- | --- |
| GET | `/v1/listar?type=&status=` | Proyectos con valores calculados (ahorrado, faltante, aporte sugerido, próxima fecha). |
| GET | `/v1/{id}` | Detalle. |
| POST | `/v1/crear` | Crear. |
| PUT | `/v1/{id}/actualizar` | Actualizar (el tipo no se puede cambiar). |
| DELETE | `/v1/{id}/eliminar` | Eliminar; los gastos ya registrados se conservan sin proyecto. |
| GET / POST | `/v1/{id}/movimientos` | Aportes y retiros de un ahorro (un retiro no puede superar lo ahorrado). |
| DELETE | `/v1/{id}/movimientos/{movId}` | Eliminar un movimiento. |
| POST | `/v1/{id}/concretar` | "Lo compré": crea el gasto real y cierra la compra. |
| POST / DELETE | `/v1/{id}/omitir?month=AAAA-MM` | Omitir (o volver a incluir) un mes de un recurrente. |
| GET | `/v1/{id}/gastos` | Gastos registrados desde el proyecto. |
| GET | `/v1/compromisos?month=AAAA-MM` | Lo comprometido del mes; `pending` es lo que aún falta salir. |
| GET | `/v1/proyeccion?from=AAAA-MM&months=12` | Comprometido por mes (máximo 24). |
| GET | `/v1/ahorro/resumen?month=AAAA-MM` | Total ahorrado acumulado y aportes/retiros del mes. |

Administración: `/api/admin/projects` (GET, GET `/{id}`, PUT o PATCH `/{id}`, DELETE `/{id}`).

Notificaciones del usuario: `GET /api/notifications/v1/mias[?soloNoLeidas=true]`,
`GET /api/notifications/v1/no-leidas/cantidad`, `PATCH /api/notifications/v1/{id}/leida`
y `PATCH /api/notifications/v1/leer-todas`.

La tarea diaria (`PROJECTS_DAILY_CRON`, 06:00 por defecto, zona `APP_TIME_ZONE`)
registra los gastos recurrentes en su día (con `projectId` y `generated: true`),
recupera las ocurrencias perdidas si la API estuvo detenida, nunca genera gastos
anteriores a la creación del proyecto y avisa `notifyDaysBefore` días antes.
También recuerda las compras cuya fecha objetivo se acerca.
