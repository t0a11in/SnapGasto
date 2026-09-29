-- Crea la base de datos del MVP. Ejecutar una vez desde SSMS con un usuario con permisos de creación.
IF DB_ID(N'snap_gastos') IS NULL
BEGIN
    CREATE DATABASE snap_gastos;
END;
GO

-- Las tablas users y expenses se generan y actualizan mediante JPA al iniciar la API.
