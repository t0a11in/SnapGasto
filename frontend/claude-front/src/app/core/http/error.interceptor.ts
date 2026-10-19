import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SKIP_AUTO_LOGOUT } from './http-context';
import { toAppHttpError } from './error.utils';

/**
 * Interceptor más externo: normaliza todos los errores a `AppHttpError`
 * y ante un 401 (fuera de login/registro) cierra la sesión.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((err: unknown) => {
      const appError = toAppHttpError(err);
      if (appError.status === 401 && !req.context.get(SKIP_AUTO_LOGOUT)) {
        auth.logout();
      }
      return throwError(() => appError);
    }),
  );
};
