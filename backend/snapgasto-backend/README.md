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
