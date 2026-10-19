# SnapGasto — Flutter (Android / iOS)

Migración del frontend Angular (`frontend/claude-front`) a Flutter con **arquitectura BLoC** y
**un widget por componente**. Misma API Java, mismas reglas de negocio y mismos mensajes.

## Puesta en marcha

```bash
cd frontend/claude_flutter
flutter pub get
flutter analyze
flutter test
flutter run                     # emulador Android → API en http://10.0.2.2:8080/api
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:8080/api   # teléfono físico
```

- Android emulador: `localhost` del PC es `10.0.2.2` (valor por defecto).
- iOS simulador: `http://localhost:8080/api` (valor por defecto).
- HTTP sin TLS solo está permitido en desarrollo (`android/app/src/debug` y `NSAllowsLocalNetworking` en iOS).

## Arquitectura

```
lib/
  main.dart                    valida la sesión guardada y arranca la app
  app/
    app_dependencies.dart      crea API, sesión, servicios y router (≈ app.config.ts)
    snapgasto_app.dart         RepositoryProviders + MaterialApp.router (es-CL)
    router/                    go_router + guards (auth / admin / guest) como función pura
    theme/                     colores y tema Material 3
  core/
    config/                    API_BASE_URL y claves de almacenamiento
    models/                    contratos JSON con Java
    http/                      Dio + interceptores: Bearer → 419 (reautenticar y reintentar) → errores/401
    data/                      clientes de la API (auth, ingresos, gastos, categorías, CRUD admin)
    session/                   SessionCubit (persistido) y ReauthCoordinator (un solo diálogo)
    storage/                   SharedPreferences
    utils/                     montos ($1.234.567), porcentajes (12,3 %), fechas, paleta del gráfico
  shared/
    forms/                     validadores y FormSubmitCubit (enviando / error del servidor)
    feedback/                  toasts y alerta superior
    widgets/                   componentes reutilizables (selector de mes, balance, campos, etc.)
  features/
    auth/      cubit/ view/ widgets/        login, registro, diálogo de sesión expirada
    incomes/   bloc/ view/ widgets/         IncomesBloc + resumen, lista y formulario
    expenses/  bloc/ domain/ view/ widgets/ ExpensesBloc + por categoría, gráfico, hojas de detalle
    admin/     shared/ users/ categories/ expenses/ notifications/  AdminResourceCubit genérico
    shell/                     barra superior, menú lateral por rol
```

Reglas:

- Las **páginas** solo crean el BLoC y coordinan hojas/diálogos; la presentación vive en widgets de `widgets/`.
- Los **BLoC/Cubit** no conocen widgets; los mensajes de una sola vez (toasts) salen como `UiMessage` en el estado.
- Los cálculos derivados (totales por categoría, “Otras”, colores) están en `expenses/domain/expense_stats.dart`, probados aparte.
- Equivalencias con Angular: modales → hojas inferiores (`showFormSheet`); tablas → listas; `datalist` → `RawAutocomplete`; SweetAlert superior → `MaterialBanner` de 10 s.

## Fases

| Fase | Alcance | Estado |
|------|---------|--------|
| 1 | Migración Angular → Flutter: auth, ingresos, gastos (gráfico, categorías), CRUD admin, sesión 419/401 | Hecha |
| 2 | Por definir | — |
| 3 | Registro por voz y lectura de texto en imágenes (boletas) | Pendiente |

### Fase 3 (borrador)

- **Voz**: botón de micrófono que llena el formulario de gasto (`speech_to_text`, es-CL) mediante un
  intérprete Dart puro (“ocho lucas en comida, ayer” → monto, categoría, fecha). Nunca guarda solo: siempre se revisa.
- **Texto en imágenes**: foto de la boleta → OCR en el teléfono (p. ej. ML Kit Text Recognition) → mismo
  intérprete para proponer monto, fecha y comercio.
- Se integran como widgets nuevos que entregan un borrador al `ExpenseFormSheet` existente.

## Pendiente en la API Java (igual que en Angular)

1. `GET /api/categories` (USER y ADMIN) → `List<CategoryResponse>`. Sin él, el autocompletado usa las categorías del mes.
2. `PATCH /{id}` en `/api/admin/users|categories|expenses|notifications`.
3. (Futuro) `paymentMethod` como enum.
