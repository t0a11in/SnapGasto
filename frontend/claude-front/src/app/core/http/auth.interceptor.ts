import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { PUBLIC_AUTH_PATHS } from '../services/auth-api.service';
import { SessionStore } from '../state/session.store';

/** Agrega `Authorization: Bearer <token>` solo a peticiones hacia la API propia. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);
  const token = inject(SessionStore).token();

  if (!token || !req.url.startsWith(baseUrl)) {
    return next(req);
  }
  const path = req.url.slice(baseUrl.length).split('?')[0];
  if (PUBLIC_AUTH_PATHS.some((p) => path === p)) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
