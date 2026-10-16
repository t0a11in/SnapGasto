-- Se ejecuta automáticamente por el servicio db-init de Docker Compose.
-- La variable DB_NAME se entrega mediante sqlcmd y debe ser un nombre simple
-- de base de datos, por ejemplo: snap_gastos.
IF DB_ID(N'$(DB_NAME)') IS NULL
BEGIN
    CREATE DATABASE [$(DB_NAME)];
END;
GO

-- Las tablas se crean mediante las migraciones de Flyway incluidas en la API.
