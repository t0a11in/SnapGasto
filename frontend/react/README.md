# SnapGasto Admin

Cliente React para los mantenedores administrativos de SnapGasto.

## Mantenedores incluidos

- Usuarios: alta, edición de datos/rol/contraseña y eliminación protegida.
- Gastos: alta, edición, listado global y eliminación.
- Categorías: alta, edición y eliminación, con color e ícono.
- Notificaciones: alta, edición, asignación a un usuario y eliminación.

Todos los endpoints requieren una sesión con rol `ADMIN`.

## Primer acceso

1. En `backend/snapgasto-backend/.env`, define `APP_BOOTSTRAP_ADMIN_EMAIL` con el correo que usarás como administrador y levanta la API Docker.
2. Copia `.env.example` a `.env` dentro de esta carpeta si la API no se ejecuta en `http://localhost:8080/api`.
3. Ejecuta `npm install` y `npm run dev`.
4. Abre la URL de Vite, selecciona **Crear la primera cuenta** y usa exactamente el correo configurado en `APP_BOOTSTRAP_ADMIN_EMAIL`.

La API asignará el rol ADMIN a esa cuenta durante el registro. Las cuentas restantes nacen con rol USER y luego se administran desde el mantenedor de usuarios.

## Comandos

```powershell
cd D:\2026\proyectos\SnapGasto\frontend\react
Copy-Item .env.example .env
npm install
npm run dev
```

Para obtener una compilación de producción: `npm run build`.
