# SnapGasto · AngularJS

Implementación independiente en **AngularJS 1.8** que replica el cliente de
`frontend/angular`, conectándose al mismo contrato REST de SnapGasto. Incluye:

- Inicio de sesión y registro contra `/api/auth`.
- Sesión JWT en `localStorage`, interceptor `Authorization: Bearer` y guards de
  rutas para usuario autenticado y administrador.
- Mantenedor ADMIN de usuarios, gastos, categorías y notificaciones.
- Módulo personal de ingresos con CRUD para `TARJETA` y `FISICO`, filtro por
  mes y suma separada/total usando `/api/incomes/v1`.

> AngularJS está fuera de soporte desde 2022. Se usa aquí porque fue solicitado;
> para desarrollos nuevos el cliente Angular moderno sigue siendo la alternativa
> recomendada. Esta versión aplica prácticas vigentes alrededor del framework:
> Vite, módulos ES, `strictDi`, componentes, rutas con `resolve`, una capa API
> centralizada, variables de entorno y pruebas automatizadas.

## Requisitos

- Node.js 22.18 o superior.
- API Spring Boot disponible en `http://localhost:8080`.

## Ejecutar

```powershell
cd frontend/angularjs
Copy-Item .env.example .env.local
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:4201`. Por defecto Vite
redirige `/api` al backend local, de modo que no se requiere configurar CORS
para desarrollo. Para apuntar a otra API, edita `VITE_API_BASE_URL` en
`.env.local`, por ejemplo `https://api.ejemplo.cl/api`.

## Estructura y funcionamiento

```text
src/
  core/       configuración, sesión, interceptor, guards y cliente HTTP
  auth/       pantalla de ingreso/registro
  incomes/    mantenedor personal de ingresos v1
  admin/      mantenedores administrativos reutilizables
  layout/     barra superior y menú lateral común
```

- `core/session.service.js` persiste solamente la respuesta de autenticación.
- `core/http-interceptor.js` adjunta el token a `/api/*` y limpia la sesión ante
  un `401`; el servidor sigue siendo la autoridad que valida permisos.
- `core/route-guards.js` bloquea la carga de rutas con `resolve` antes de que se
  construya el componente.
- `core/iso-date.directive.js` adapta el objeto `Date` de AngularJS a
  `YYYY-MM-DD`, que es el formato esperado por la API SQL Server.
- `core/api.service.js` es el único punto que conoce endpoints y normaliza los
  errores `{ "message": "..." }` del backend.

Los comentarios en esos archivos explican el motivo de cada mecanismo.

## Seguridad y ciclo de vida

AngularJS 1.8.3 es la última versión publicada y `npm audit` reporta
vulnerabilidades conocidas en el propio framework que no tienen actualización
disponible. Por ello este cliente debe tratarse como una solución de
compatibilidad o de migración, no como la alternativa para un producto nuevo
expuesto a Internet.

- No uses `ng-bind-html` ni `$sce.trustAsHtml` con contenido de usuarios.
  Las vistas de este proyecto emplean interpolación normal, que AngularJS
  escapa por defecto.
- Mantén una política CSP restrictiva al desplegar y valida/autorizá siempre en
  el backend; el JWT del navegador no reemplaza los controles del servidor.
- Planifica la migración gradual al cliente Angular moderno de
  `frontend/angular` para eliminar este riesgo de dependencia.

## Calidad y compilación

```powershell
npm test
npm run build
```

Las pruebas de `test/core.spec.js` validan la conversión de errores y fechas sin
necesitar API ni base de datos.
