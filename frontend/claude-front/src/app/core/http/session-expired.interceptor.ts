import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { HTTP_SESSION_EXPIRED } from '../models';
import { ReauthService } from '../services/reauth.service';
import { SKIP_REAUTH } from './http-context';

/**
 * Ante un HTTP 419 abre (una sola vez) el modal de reautenticación y reintenta
 * la petición original con el token nuevo. Las peticiones de sesión (login,
 * token-status) y los reintentos llevan SKIP_REAUTH, por lo que no hay bucles.
 */
export const sessionExpiredInterceptor: HttpInterceptorFn = (req, next) => {
  const reauth = inject(ReauthService);

  if (req.context.get(SKIP_REAUTH)) {
    return next(req);
  }

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== HTTP_SESSION_EXPIRED) {
        return throwError(() => err);
      }
      return reauth.reauthenticate().pipe(
        switchMap((ok) => {
          if (!ok) {
            return throwError(() => err);
          }
          // Reintento único: si vuelve a fallar con 419 no se reabre el modal.
          req.context.set(SKIP_REAUTH, true);
          return next(req);
        }),
      );
    }),
  );
};
