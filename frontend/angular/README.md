# SnapGasto Admin · Angular

Cliente web Angular de los mantenedores del backend Spring Boot de SnapGasto.

## Requisitos

- Node.js 22.18 o superior.
- API de SnapGasto disponible en `http://localhost:8080`.
- Una cuenta con rol `ADMIN`. Para crear el primer administrador, define `APP_BOOTSTRAP_ADMIN_EMAIL` en la API antes de registrar esa cuenta.

## Ejecutar

```powershell
cd frontend/angular
npm install
npm start
```

La aplicación se abre en `http://localhost:4200`. La URL de la API está centralizada en `src/app/core/config/api-base-url.token.ts`; cambia `DEFAULT_API_BASE_URL` si el backend se publica en otra dirección.

## Funciones

- Inicio de sesión y registro contra `/api/auth`.
- Sesión JWT en `localStorage`, interceptor `Authorization: Bearer` y protección de rutas ADMIN.
- CRUD de usuarios, gastos, categorías y notificaciones.
- Mensajes de error compatibles con el contrato `ApiError` de Spring Boot.

## Calidad

```powershell
npm run build
npm test
```

Las pruebas se ejecutan con Vitest y `HttpTestingController`; no requieren levantar la API ni una base de datos.
