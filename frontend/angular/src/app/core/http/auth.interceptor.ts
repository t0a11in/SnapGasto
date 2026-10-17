import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../config/api-base-url.token';
import { SessionStore } from '../state/session.store';

const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/google'];

/** Incluye el JWT sólo en solicitudes dirigidas a la API de SnapGasto. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const baseUrl = inject(API_BASE_URL);
  const session = inject(SessionStore).session();
  const isPublicAuthenticationRequest = PUBLIC_AUTH_PATHS
    .some((path) => request.url.startsWith(`${baseUrl}${path}`));

  if (!session?.accessToken || !request.url.startsWith(baseUrl) || isPublicAuthenticationRequest) {
    return next(request);
  }

  return next(request.clone({
    setHeaders: { Authorization: `Bearer ${session.accessToken}` }
  }));
};
