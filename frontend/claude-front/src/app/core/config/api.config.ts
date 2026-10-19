import { InjectionToken } from '@angular/core';

/** URL base de la API Java. Se puede sobrescribir en app.config.ts o en pruebas. */
export const DEFAULT_API_BASE_URL = 'http://localhost:8080/api';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => DEFAULT_API_BASE_URL,
});

/** Claves de almacenamiento local. Nunca se persiste la contraseña. */
export const STORAGE_KEYS = {
  session: 'snapgasto.session',
  rememberedEmail: 'snapgasto.rememberedEmail',
} as const;
