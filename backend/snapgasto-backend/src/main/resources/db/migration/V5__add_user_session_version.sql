-- Versión de credenciales: al incrementarla se invalidan todos los JWT del
-- usuario (cerrar todas las sesiones, cambio de contraseña o de rol).
ALTER TABLE dbo.users ADD session_version int NOT NULL
    CONSTRAINT df_users_session_version DEFAULT 0;
