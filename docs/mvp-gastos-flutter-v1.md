# Gastos personales v1: Flutter y Java

## Objetivo

El módulo móvil de gastos replica el mantenedor personal disponible en Angular.
Cada movimiento pertenece al usuario autenticado y se consulta por mes.

## Aplicación Flutter

La pestaña **Gastos** permite:

- Elegir el mes de consulta y actualizar sus movimientos.
- Ver el total gastado y la cantidad de registros del mes.
- Crear, editar y eliminar gastos.
- Registrar monto, categoría, fecha, descripción opcional y medio de pago.
- Usar los valores de pago `TARJETA`, `EFECTIVO`, `TRANSFERENCIA` u `OTRO`.
- Adjuntar una boleta al crear un gasto. La imagen se almacena sólo en el
  dispositivo; no se transmite al backend.

El formulario no incluye credenciales ni valores de prueba. Para iniciar sesión
se deben ingresar desde la pantalla de acceso.

## Contrato REST

Los clientes Angular y Flutter comparten estos endpoints autenticados:

| Operación | Método y ruta |
| --- | --- |
| Listar gastos del mes | `GET /api/expenses/v1/listar?month=AAAA-MM` |
| Crear gasto | `POST /api/expenses/v1/crear` |
| Actualizar gasto | `PUT /api/expenses/v1/{expenseId}/actualizar` |
| Eliminar gasto | `DELETE /api/expenses/v1/{expenseId}/eliminar` |

El cuerpo de creación y actualización contiene `amount`, `category`, `date`,
`description` y `paymentMethod`. La API valida que el monto sea mayor a cero y
que la fecha no sea futura. Las rutas históricas de gastos se conservan para no
interrumpir clientes anteriores.

## Verificación

Desde las carpetas correspondientes:

```powershell
cd backend/snapgasto-backend
.\mvnw.cmd clean test

cd ../../frontend/flutter
flutter analyze
flutter test
flutter build apk --debug
```

El APK de depuración se crea en
`frontend/flutter/build/app/outputs/flutter-apk/app-debug.apk`.
