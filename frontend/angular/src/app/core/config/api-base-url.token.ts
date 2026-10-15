import { InjectionToken } from '@angular/core';

/** URL base del backend local. Reemplázala en app.config.ts al desplegar. */
export const DEFAULT_API_BASE_URL = 'http://localhost:8080/api';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => DEFAULT_API_BASE_URL
});
