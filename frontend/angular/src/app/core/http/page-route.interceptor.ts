import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../config/api-base-url.token';
import { SessionStore } from '../state/session.store';
import { Router } from '@angular/router';

/** Incluye el JWT sólo en solicitudes dirigidas a la API de SnapGasto. */
export const pageRouteInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  const pageUrl = router.url;

  // console.log(`Página actual: ${pageUrl} Petición HTTP:', ${req.urlWithParams}`);
  // console.log(JSON.stringify(req));

  return next(req);
};