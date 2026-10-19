# SnapGasto · Frontend

SPA Angular 22 (standalone + Signals + Signal Forms) que consume la API Java de SnapGasto con JWT Bearer.
Estilos con Bootstrap 5.3 + ng-bootstrap (modales), alertas SweetAlert2 e íconos feather-icons. Pruebas con Karma + Jasmine.

Montos con el pipe `money` (`$1.234.567`). Cada componente tiene su `.ts`, `.html` y, si aplica, `.scss`.

## Comandos

```bash
npm install
npm start                      # http://localhost:4200
npm run build                  # build de producción (SSR habilitado, rutas renderizadas en cliente)
npm test -- --watch=false      # Karma + Jasmine en Chrome
npm run test:ci                # Karma en ChromeHeadless
```

La URL de la API se configura en `src/app/core/config/api.config.ts` (`DEFAULT_API_BASE_URL`,
por defecto `http://localhost:8080/api`) o sobrescribiendo el token `API_BASE_URL` en `app.config.ts`.

## Estructura

```
src/app/
  core/
    config/     API_BASE_URL y claves de almacenamiento
    guards/     authGuard, adminGuard, guestGuard
    http/       interceptores (error → 419 → Bearer) y normalización de errores
    models/     contratos TypeScript espejo de los records Java
    services/   clientes HTTP, AuthService (fachada) y ReauthService (419)
    state/      SessionStore (Signals + localStorage)
    utils/      fechas (YYYY-MM / YYYY-MM-DD) y montos
  shared/       íconos, campos reutilizables, selector de mes, confirmación, toasts
  features/
    auth/       login, registro y modal de reautenticación
    incomes/    /incomes  — CRUD mensual + resumen
    expenses/   /expenses — CRUD mensual + total y totales por categoría
    admin/      shell autenticado + /admin/{users,categories,expenses,notifications}
```

## Sesión y seguridad

- Se persiste solo `{ accessToken, user }`. **Nunca la contraseña.** "Recordar mi correo" guarda únicamente el email.
- Al iniciar la app se valida la sesión guardada con `GET /auth/v1/token-status`.
- **401** en rutas protegidas → cierre de sesión y redirección a `/login`.
- **419** → un único modal pide la contraseña (correo tomado de la sesión), llama a `/auth/login`
  y reintenta las peticiones pendientes. Login y token-status nunca abren el modal; el reintento
  no reabre el modal si vuelve a fallar (sin bucles). Cancelar → cierre de sesión.

## Contrato usado

| Recurso | Métodos |
|---|---|
| `/auth/login`, `/auth/register` | POST → `AuthResponse` |
| `/auth/v1/token-status` | GET → `{ tokenAlive }` |
| `/incomes/v1` | `GET listar?month`, `GET resumen?month`, `POST crear`, `PUT {id}/actualizar`, `DELETE {id}/eliminar` |
| `/expenses/v1` | `GET listar?month`, `POST crear`, `PUT {id}/actualizar`, `DELETE {id}/eliminar` |
| `/admin/{users,categories,expenses,notifications}` | `GET /` (array plano), `GET /{id}`, `POST /`, **`PATCH /{id}`**, `DELETE /{id}` |

## Pendiente en la API Java

1. **`GET /api/categories`** (rol USER y ADMIN) → `List<CategoryResponse>`.
   El formulario de gastos lo usa para mostrar un select; mientras no exista, cae a texto libre.
   Se envía `category` = `CategoryResponse.name` (String, máx. 80), como define `ExpenseRequest`.
2. Los mantenedores ADMIN actualizan con **`PATCH /{id}`** enviando el request completo
   (`AdminUserRequest` sin `password` si no se cambia). Java debe exponer PATCH en los cuatro recursos.
3. (Futuro) Convertir `paymentMethod` en enum `TARJETA | EFECTIVO | TRANSFERENCIA | OTRO`;
   el front ya restringe esos valores.
