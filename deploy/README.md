# Despliegue a producción

```
GitHub (rama production) ──► GitHub Actions ──► GHCR (imágenes) ──► Servidor (Docker Compose)
                              tests + build                          Caddy :443 ─┬─ /api/* → api (Spring Boot)
                                                                                 └─ /*     → web (Angular SSR)
                                                                     SQL Server (solo red interna)
```

## Ramas

| Rama | Uso |
|---|---|
| `production` | Lo que está en producción. Solo entra por pull request. Cada merge despliega. |
| ramas de trabajo (`feature/…`) | **Créalas desde `production`** y abre PR hacia `production`; el PR corre las pruebas. |

`production` contiene solo `backend/snapgasto-backend`, `frontend/claude-front` y
`frontend/claude_flutter` (más `deploy/` y `.github/`). Los demás proyectos del monorepo viven
en las otras ramas y no se despliegan.

## Qué hace el pipeline (`.github/workflows/production.yml`)

1. **Backend · tests**: `./mvnw test` (JUnit, Mockito e integración con H2).
2. **Front · build y tests**: `npm ci`, Karma en Chrome headless y build de producción.
   **Flutter · análisis y tests**: `flutter analyze` y `flutter test` (la app móvil se publica
   por separado en las tiendas; aquí solo se valida).
3. **Imágenes Docker** (solo push a `production`): construye `snapgasto-api` y `snapgasto-web`
   y las publica en `ghcr.io/t0a11in/` con la etiqueta `sha-<commit>` y `latest`.
4. **Despliegue** (solo si `PROD_DEPLOY_ENABLED=true`): copia `compose.prod.yaml` y `Caddyfile`
   al servidor por SSH, descarga las imágenes nuevas y reinicia los contenedores. Flyway aplica
   las migraciones pendientes al iniciar la API. Al final verifica que el sitio responda 200.

Si las pruebas fallan, no se construyen imágenes ni se despliega.

## Configuración (una sola vez)

### 1. Servidor
- Linux con Docker y el plugin Compose (`docker compose version`). Mínimo recomendado: 2 vCPU y
  4 GB de RAM (SQL Server necesita 2 GB).
- Puertos 80 y 443 abiertos. El DNS del dominio apuntando a la IP del servidor.
- Un usuario para desplegar, en el grupo `docker`, con una llave SSH (sin contraseña) cuya
  parte pública esté en `~/.ssh/authorized_keys`.
- Crear la carpeta de despliegue y su `.env`:
  ```bash
  mkdir -p /opt/snapgasto && cd /opt/snapgasto
  # copia deploy/.env.example como .env y complétalo
  nano .env
  chmod 600 .env
  ```

### 2. GitHub → Settings → Secrets and variables → Actions

**Secrets**
| Nombre | Valor |
|---|---|
| `PROD_SSH_HOST` | IP o host del servidor |
| `PROD_SSH_USER` | usuario de despliegue |
| `PROD_SSH_KEY` | llave privada SSH completa |
| `PROD_SSH_PORT` | (opcional) puerto SSH, 22 por defecto |
| `GHCR_READ_TOKEN` | token personal (classic) con permiso `read:packages`, para que el servidor descargue las imágenes |

**Variables**
| Nombre | Valor |
|---|---|
| `PROD_DEPLOY_ENABLED` | `true` cuando todo lo anterior esté listo |
| `PROD_DEPLOY_PATH` | `/opt/snapgasto` |
| `PROD_DOMAIN` | el dominio, sin `https://` |

### 3. GitHub → Settings → Environments → `production`
- Activa **Required reviewers** para aprobar cada despliegue a mano.
- En **Deployment branches** permite solo `production`.

### 4. GitHub → Settings → Branches
- Regla para `production`: exigir pull request y que pasen los checks *Backend · tests*,
  *Front · build y tests* y *Flutter · análisis y tests*.

## Primer despliegue
1. Con todo configurado, haz merge (o push) a `production`.
2. Revisa la pestaña **Actions**. Si exigiste aprobación, apruébala.
3. Abre `https://<dominio>`; registra tu cuenta. Si `APP_BOOTSTRAP_ADMIN_EMAIL` es tu correo,
   reinicia la API para que te promueva a ADMIN:
   `docker compose -f compose.prod.yaml restart api`.

## Operación
```bash
cd /opt/snapgasto
docker compose -f compose.prod.yaml ps              # estado
docker compose -f compose.prod.yaml logs -f api     # logs de la API
# Volver a una versión anterior:
IMAGE_TAG=sha-abc1234 docker compose -f compose.prod.yaml up -d api web
```

**Respaldos**: la base vive en el volumen `snapgasto_sqlserver-data`. Programa un respaldo
diario (por ejemplo `BACKUP DATABASE` con `sqlcmd` + copia fuera del servidor) antes de tener
datos reales.
