"""Configuración de Django para la API intercambiable de SnapGasto."""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DB_ENCRYPT = os.getenv("DB_ENCRYPT", "true").lower() == "true"
DB_TRUST_SERVER_CERTIFICATE = os.getenv("DB_TRUST_SERVER_CERTIFICATE", "true").lower() == "true"

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "django-development-only-secret")
DEBUG = os.getenv("DJANGO_DEBUG", "true").lower() == "true"
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "api.apps.ApiConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "api.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "snapGastosDjango.urls"
TEMPLATES = []
WSGI_APPLICATION = "snapGastosDjango.wsgi.application"
ASGI_APPLICATION = "snapGastosDjango.asgi.application"

# Estas tablas pertenecen al contrato de SnapGasto y son creadas exclusivamente
# por Flyway en Spring Boot. Django sólo las consulta/escribe; no migra ninguna.
DATABASES = {
    "default": {
        "ENGINE": "sql_server.pyodbc",
        "NAME": os.getenv("DB_NAME", "snap_gastos"),
        "USER": os.getenv("DB_USER", "sa"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "1433"),
        "OPTIONS": {
            "driver": os.getenv("DB_ODBC_DRIVER", "ODBC Driver 18 for SQL Server"),
            "extra_params": (
                f"Encrypt={'yes' if DB_ENCRYPT else 'no'};"
                f"TrustServerCertificate={'yes' if DB_TRUST_SERVER_CERTIFICATE else 'no'}"
            ),
        },
    }
}
MIGRATION_MODULES = {"api": None}

LANGUAGE_CODE = "es-cl"
TIME_ZONE = "America/Santiago"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

JWT_SECRET = os.getenv("JWT_SECRET", "change-this-development-secret-to-a-value-with-at-least-32-characters")
JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", "120"))
BOOTSTRAP_ADMIN_EMAIL = os.getenv("APP_BOOTSTRAP_ADMIN_EMAIL", "").strip().lower()
FIREBASE_ENABLED = os.getenv("FIREBASE_ENABLED", "false").lower() == "true"
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")
CORS_ALLOWED_ORIGINS = [value.strip() for value in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:*,http://127.0.0.1:*").split(",")]
