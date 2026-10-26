import { InjectionToken } from '@angular/core';

/**
 * Valor que inyecta el build de producción (angular.json → configurations.production.define).
 * En desarrollo y en pruebas no existe y se usa la API local.
 */
declare const ngApiBaseUrl: string | undefined;

/**
 * URL base de la API Java. En producción es `/api`: el proxy del servidor
 * (deploy/Caddyfile) envía esas rutas al backend bajo el mismo dominio.
 * Se puede sobrescribir en app.config.ts o en pruebas.
 */
export const DEFAULT_API_BASE_URL: string =
  typeof ngApiBaseUrl !== 'undefined' ? ngApiBaseUrl : 'http://localhost:8080/api';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => DEFAULT_API_BASE_URL,
});

/** Claves de almacenamiento local. Nunca se persiste la contraseña. */
export const STORAGE_KEYS = {
  session: 'snapgasto.session',
  rememberedEmail: 'snapgasto.rememberedEmail',
} as const;
