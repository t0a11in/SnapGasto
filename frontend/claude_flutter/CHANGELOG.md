# Cambios — SnapGasto Flutter

## Fase 1 — Migración Angular → Flutter con BLoC (2026-10-19)

Origen: `frontend/claude-front` (Angular). Misma API Java, mismas reglas, mismos textos.
Cada bloque corresponde a un commit en la rama `codex/comentarios-push`.

### 1. Proyecto base y plataformas
- Proyecto `flutter create` (Android + iOS) incorporado al repositorio.
- `android/app/src/main/AndroidManifest.xml`: permiso `INTERNET` (necesario en builds release).
- `android/app/src/debug/AndroidManifest.xml`: `usesCleartextTraffic="true"` solo en debug para llamar a `http://10.0.2.2:8080`.
- `ios/Runner/Info.plist`: `NSAppTransportSecurity › NSAllowsLocalNetworking` para HTTP hacia localhost/IP local.

### 2. Núcleo (`lib/core`) y dependencias (`pubspec.yaml`)
- Dependencias: flutter_bloc, equatable, dio, go_router, shared_preferences, fl_chart, flutter_localizations; dev: bloc_test.
- `config/api_config.dart`: URL base configurable con `--dart-define=API_BASE_URL`; por defecto `10.0.2.2` (emulador Android) o `localhost` (iOS). Claves de almacenamiento.
- `models/`: contratos con Java (auth, ingresos, gastos, admin) con `fromJson`/`toJson`; `AppHttpError` y código 419.
- `http/`:
  - `AuthInterceptor`: agrega `Bearer` solo a la API propia y nunca a `/auth/login` ni `/auth/register`.
  - `SessionExpiredInterceptor`: ante 419 abre la reautenticación una sola vez y reintenta la petición una sola vez.
  - `ErrorInterceptor`: normaliza errores (prioriza `ApiError.message`) y ante 401 cierra la sesión salvo en peticiones de sesión.
  - `request_flags.dart`: equivalentes a `SKIP_REAUTH` / `SKIP_AUTO_LOGOUT`.
  - `ApiClient`: envuelve Dio y lanza siempre `AppHttpError`.
- `data/`: `AuthApi`, `AuthRepository` (login, registro, recordar correo, reautenticar, validar token al iniciar), `IncomesApi`, `ExpensesApi`, `CategoriesApi` (no cierra sesión si el endpoint aún no existe), `AdminCrudApi` genérico + usuarios/categorías/gastos/notificaciones.
- `session/`: `SessionCubit` persistido (descarta sesiones corruptas) y `ReauthCoordinator` (un único diálogo para peticiones simultáneas; cancelar = cerrar sesión).
- `storage/`: SharedPreferences tolerante a fallos + versión en memoria para pruebas.
- `utils/`: `formatMoney` ($1.234.567), `formatPercent` (12,3 %), fechas YYYY-MM-DD, paleta del gráfico (6 colores + gris "Otras"), comparación alfabética en español.

### 3. App, router, tema y componentes compartidos
- `main.dart` valida la sesión guardada antes de mostrar la primera pantalla.
- `app/app_dependencies.dart` arma todas las dependencias; `snapgasto_app.dart` las expone y configura es-CL.
- `app/router/`: go_router con guards como función pura (`resolveRedirect`): auth con `returnUrl`, admin y visitante.
- `app/theme/`: colores de `styles.scss` y tema Material 3.
- `shared/forms/`: validadores (monto > 0 que acepta `12.000`, fecha no futura, correo, largos) y `FormSubmitCubit`.
- `shared/feedback/`: toasts, alerta superior de 10 s (login) y `UiMessage` para mensajes desde BLoC.
- `shared/widgets/`: selector de mes, balance del mes, campo de monto, fecha, contraseña con mostrar/ocultar, autocompletado de categoría con aviso "Nueva", medio de pago, descripción, hoja de formulario, confirmación, estados de lista, tarjetas y chips.
- `features/shell/`: barra superior con menú de cuenta y menú lateral según rol.

### 4. Autenticación (`features/auth`)
- `LoginCubit`: credenciales inválidas (400/401/403/404) → "Correo o contraseña incorrectos" arriba por 10 s; recordar correo.
- `RegisterCubit`: validación de nombre, correo, contraseña ≥ 8 y confirmación.
- `ReauthDialog` + `ReauthCubit`: diálogo de sesión expirada que solo pide la contraseña.

### 5. Ingresos (`features/incomes`)
- `IncomesBloc`: mes, listado + resumen en paralelo, total de gastos para el balance, eliminación con mensaje; ignora respuestas de un mes que ya no está seleccionado.
- Widgets: tarjetas de resumen, lista, fila, selector de tipo y formulario en hoja.

### 6. Gastos (`features/expenses`)
- `ExpensesBloc`: gastos, categorías (catálogo opcional) y total de ingresos para el balance.
- `domain/expense_stats.dart`: total, agrupación por categoría, top 6 + "Otras", colores y categorías conocidas.
- Widgets: resumen, "Por categoría" (3 filas + scroll + "Ver todas"), hoja con todas las categorías, hoja de gastos de una categoría, lista, fila, gráfico de torta con leyenda y detalle del sector, formulario.

### 7. Administración (`features/admin`)
- `AdminResourceCubit` genérico (listar, crear/actualizar con PATCH, eliminar) y una subclase por recurso.
- Usuarios: búsqueda, rol, no se puede eliminar a sí mismo, contraseña opcional al editar.
- Categorías: ícono Feather con vista previa (se traduce a Material) y color #RRGGBB con paleta sugerida.
- Gastos de usuarios: filtros por usuario y mes, total filtrado.
- Notificaciones: filtro leídas/no leídas y cambio rápido de estado.

### 8. Pruebas (`test/`)
- Formato de montos y fechas, normalización de errores, interceptores (Bearer, 401, 419 con reintento y sin bucle), sesión y reautenticación, guards, estadísticas de gastos, validadores, `IncomesBloc` y `MonthBalance`.

### 9. Documentación
- `README.md` con puesta en marcha, arquitectura y fases (fase 3: voz y texto en imágenes).
- Este `CHANGELOG.md`.

### Pendiente de verificar
- El código se escribió sin poder ejecutar el SDK de Flutter en la sesión de Claude: correr `flutter pub get`, `flutter analyze` y `flutter test`.
- `pubspec.lock` se regenera con `flutter pub get` (el de la plantilla quedó desactualizado y no se incluye).
