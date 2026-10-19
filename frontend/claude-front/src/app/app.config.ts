import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { routes } from './app.routes';
import { API_BASE_URL, DEFAULT_API_BASE_URL } from './core/config/api.config';
import { authInterceptor } from './core/http/auth.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';
import { sessionExpiredInterceptor } from './core/http/session-expired.interceptor';
import { AuthService } from './core/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(),
    { provide: API_BASE_URL, useValue: DEFAULT_API_BASE_URL },
    // Orden: error (más externo) → 419 → Bearer (más interno).
    provideHttpClient(
      withFetch(),
      withInterceptors([errorInterceptor, sessionExpiredInterceptor, authInterceptor]),
    ),
    // Valida la sesión persistida antes de resolver la primera ruta.
    provideAppInitializer(() => inject(AuthService).validateStoredSession()),
  ],
};
