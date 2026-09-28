# SnapGasto

Monorepo para la aplicación SnapGasto. Contendrá un cliente web en Angular, una aplicación móvil en Flutter y un backend. Por ahora se conserva solamente la estructura: no se ha generado código ni se ha elegido la tecnología del backend.

## Estructura

```text
SnapGasto/
|- backend/             # API, lógica de negocio e integraciones del servidor
|- frontend/
|  |- angular/          # Aplicación web en Angular
|  `- flutter/          # Aplicación móvil en Flutter
|- .gitignore           # Archivos locales y artefactos generados que no se versionan
`- README.md            # Documentación principal del repositorio
```

## Siguientes decisiones

Cuando estén definidos los requisitos del servidor, se podrá elegir su tecnología y acordar las herramientas compartidas del monorepo (pruebas, formato, automatización y despliegue).
