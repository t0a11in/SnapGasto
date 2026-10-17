import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';
import { AppStore } from '../state/App.store';

const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/google'];

/**
 * Evita llamadas protegidas cuando la sesión ya fue invalidada. Las rutas de
 * autenticación se mantienen disponibles para que la persona pueda iniciar
 * sesión nuevamente y restaurar el estado a OPEN.
 */
export const tokenLifeInterceptor: HttpInterceptorFn = (request, next) => {
  const appStore = inject(AppStore);
  const apiBaseUrl = inject(API_BASE_URL);
  const isApiRequest = request.url.startsWith(apiBaseUrl);
  const isPublicAuthenticationRequest = PUBLIC_AUTH_PATHS
    .some((path) => request.url.startsWith(`${apiBaseUrl}${path}`));

  if (!isApiRequest || isPublicAuthenticationRequest || appStore.tokenLife() !== 'CLOSED') {
    return next(request);
  }

  return throwError(() => new HttpErrorResponse({
    status: 401,
    statusText: 'Unauthorized',
    url: request.urlWithParams,
    error: { message: 'La sesión está cerrada. Inicia sesión nuevamente.' },
  }));
};
