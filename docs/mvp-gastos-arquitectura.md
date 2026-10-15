# Arquitectura del MVP de gastos

## Alcance

El producto registra **únicamente gastos**. No existe entidad, endpoint ni
pantalla para ingresos en esta entrega. El método de pago que ya existía se
mantiene como dato adicional de compatibilidad.

## Datos persistidos

La tabla `expenses`, administrada por JPA, continúa siendo la fuente de verdad
remota de cada gasto:

| Columna | Tipo lógico | Uso |
| --- | --- | --- |
| `id` | UUID | Identificador del gasto |
| `user_id` | UUID/FK | Propietario autenticado |
| `amount` | decimal(14,2) | Monto positivo |
| `category` | varchar(80) | Categoría |
| `description` | varchar(500), nulo | Detalle opcional |
| `expense_date` | date | Fecha del gasto |
| `payment_method` | varchar(60) | Campo heredado y compatible |
| `created_at` | datetime | Auditoría de creación |

No se requieren migraciones SQL para los recibos: por diseño, la foto y su
ruta **no llegan al servidor**. Flutter copia la imagen a
`<documentos privados de la app>/expense-receipts/` y mantiene el índice local
`expenseId -> ruta` en `GetStorage`. Esto impide que una ruta de un dispositivo
se convierta en un dato inválido o expuesto en otro dispositivo.

## Flujo de sesión automática

1. `POST /api/auth/login` o `POST /api/auth/register` devuelve un JWT.
2. Flutter persiste sólo ese JWT en `flutter_secure_storage` (Keychain/Keystore
   o equivalente); nunca guarda la contraseña.
3. Al abrir la app, se restaura el token y `GET /api/auth/session` lo valida
   mediante el filtro JWT existente.
4. Si la sesión es válida, se obtiene el perfil y se entra directamente a la
   app. Si expiró o es inválida, se elimina el token seguro y se muestra login.

Al actualizar desde una versión que guardaba `access_token` en `GetStorage`, la
app lo migra una única vez al almacén seguro y elimina la copia heredada. Los
cuerpos HTTP no se registran en los logs de depuración para no exponer
contraseñas ni JWT.

El endpoint de sesión sirve también a un cliente web o a un proceso
automatizado que presente `Authorization: Bearer <JWT>`; no requiere guardar
credenciales de contraseña en Angular.

## Flujo de gasto con boleta

```text
Flutter formulario
  ├─ selecciona/toma foto ─> directorio privado de la app
  ├─ POST /api/expenses (monto, categoría, descripción, fecha, método)
  └─ guarda localmente { expenseId: rutaDeBoleta }
                              │
Spring Boot ─> expenses (SQL Server)
```

La tabla de Flutter obtiene los gastos desde `/api/expenses`, combina a cada
uno con su ruta local si existe, permite ordenar por fecha, descripción,
categoría o monto, y abre la imagen sin hacer una solicitud de red.
